import { cached } from '../cache.js';
import { coordinatesOf, type Coordinates } from './geo.js';
import { clientFor, ownerOf, withTimeout, type NetworkId } from './networks.js';
import { formatStopId, type ParsedStopId, type StopRef } from './stopId.js';

const LOOKUP_TIMEOUT_MS = 3_000;
// Stops don't move: a day keeps repeat lookups off the networks without
// pinning a bad match forever.
const LOOKUP_TTL_MS = 86_400_000;
// How far apart two networks' registers can put the same stop.
const MATCH_RADIUS_METRES = 500;

export class StopNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StopNotFoundError';
  }
}

function locate(ref: StopRef): Promise<Coordinates> {
  return cached(`locate:${formatStopId(ref)}`, LOOKUP_TTL_MS, async () => {
    const place = await withTimeout(
      clientFor(ref.network).stop(ref.id, { linesOfStops: false }),
      LOOKUP_TIMEOUT_MS,
    );
    const coordinates = coordinatesOf(place);
    if (!coordinates) throw new StopNotFoundError(`${formatStopId(ref)} has no position`);
    return coordinates;
  });
}

// The same physical stop as `target` knows it. Ids don't carry over between
// networks, so the match goes by position.
export function findInNetwork(ref: StopRef, target: NetworkId): Promise<StopRef> {
  if (ref.network === target) return Promise.resolve(ref);
  return cached(`find:${formatStopId(ref)}>${target}`, LOOKUP_TTL_MS, async () => {
    const { latitude, longitude } = await locate(ref);
    const [match] = await withTimeout(
      clientFor(target).nearby(
        { type: 'location', latitude, longitude },
        { distance: MATCH_RADIUS_METRES, results: 1, poi: false, linesOfStops: false },
      ),
      LOOKUP_TIMEOUT_MS,
    );
    if (!match || match.type === 'location' || !match.id) {
      throw new StopNotFoundError(`No stop near ${formatStopId(ref)} in ${target}`);
    }
    return { network: target, id: match.id };
  });
}

// Every network indexes stops far outside its own area, but only the network
// that owns an area has all of its buses and trams. A search result can come
// from another network (when the owner didn't return that stop), so boards
// are re-pointed at the owner. If that lookup fails the stop is used as
// given: a thinner board beats none.
export async function preferOwner(ref: StopRef): Promise<StopRef> {
  try {
    const owner = ownerOf(await locate(ref));
    return owner ? await findInNetwork(ref, owner) : ref;
  } catch {
    return ref;
  }
}

// Rail stations keep their EVA number as stop id in these Germany-wide
// networks, so any of them can place a favorite saved under the old DB
// Timetables API.
const EVA_NETWORKS: readonly NetworkId[] = ['vbn', 'insa', 'nahsh'];

export function resolveEva(eva: string): Promise<StopRef> {
  return cached(`eva:${eva}`, LOOKUP_TTL_MS, async () => {
    for (const network of EVA_NETWORKS) {
      const ref: StopRef = { network, id: eva };
      try {
        await locate(ref);
      } catch {
        continue;
      }
      return preferOwner(ref);
    }
    throw new StopNotFoundError(`EVA number ${eva} is not known to any network`);
  });
}

export function resolveStopId(parsed: ParsedStopId): Promise<StopRef> {
  return parsed.kind === 'eva' ? resolveEva(parsed.eva) : Promise.resolve(parsed.ref);
}
