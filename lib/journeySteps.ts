import type { JourneyLeg } from '@/types';

// Where the rider gets off one service and onto the next.
export type Transfer = {
  // The stop the next service leaves from.
  station: string;
  // Time between arriving and leaving again, with realtime delays applied.
  // Negative when the next service leaves before the rider gets there.
  minutes: number;
  // Minutes of the change spent walking, when the planner routed a walk.
  walkMinutes: number;
  // Set when that walk leads to another stop than the one arrived at.
  walkTo?: string;
  fromPlatform?: string;
  toPlatform?: string;
  status: 'ok' | 'tight' | 'missed';
};

// A connection as the rider goes through it: ride, change, ride. Walks only
// stand on their own at the two ends; between rides they are part of the
// change.
export type JourneyStep =
  | { type: 'ride'; leg: JourneyLeg }
  | { type: 'walk'; leg: JourneyLeg; minutes: number }
  | { type: 'transfer'; transfer: Transfer };

// At or under this many minutes a change is flagged, so the rider knows to be
// at the door.
const TIGHT_MINUTES = 2;

// Timestamps are Berlin wall-clock strings; read as UTC, since only the
// difference matters (see lib/time.ts).
function wallMs(wall: string, delayMinutes = 0): number {
  return Date.parse(`${wall}Z`) + delayMinutes * 60_000;
}

function legMinutes(leg: JourneyLeg): number {
  return Math.round((wallMs(leg.arrival) - wallMs(leg.departure)) / 60_000);
}

export function journeySteps(legs: readonly JourneyLeg[]): JourneyStep[] {
  const steps: JourneyStep[] = [];
  let lastRide: JourneyLeg | null = null;
  let walks: JourneyLeg[] = [];

  // Planners mark a change inside one station with a zero-minute "walk";
  // that is not a step of its own.
  const pushWalks = () => {
    for (const leg of walks) {
      const minutes = legMinutes(leg);
      if (minutes > 0) steps.push({ type: 'walk', leg, minutes });
    }
    walks = [];
  };

  for (const leg of legs) {
    if (leg.walking) {
      walks.push(leg);
      continue;
    }
    if (lastRide) {
      const minutes = Math.round(
        (wallMs(leg.departure, leg.departureDelayMinutes) -
          wallMs(lastRide.arrival, lastRide.arrivalDelayMinutes)) /
          60_000,
      );
      const walkTo = walks.at(-1)?.destination;
      const transfer: Transfer = {
        station: leg.origin,
        minutes,
        walkMinutes: walks.reduce((sum, walk) => sum + legMinutes(walk), 0),
        status: minutes < 0 ? 'missed' : minutes <= TIGHT_MINUTES ? 'tight' : 'ok',
      };
      if (walkTo && walkTo !== lastRide.destination) transfer.walkTo = walkTo;
      if (lastRide.arrivalPlatform) transfer.fromPlatform = lastRide.arrivalPlatform;
      if (leg.departurePlatform) transfer.toPlatform = leg.departurePlatform;
      steps.push({ type: 'transfer', transfer });
      walks = [];
    } else {
      pushWalks();
    }
    steps.push({ type: 'ride', leg });
    lastRide = leg;
  }
  pushWalks();

  return steps;
}
