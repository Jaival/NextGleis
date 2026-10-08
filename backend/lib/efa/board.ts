import type { DepartureRow } from '../../types/index.js';
import { toDepartureRow } from './normalize.js';
import { efaNetworkById } from './networks.js';
import { efaRequest } from './request.js';
import type { EfaStopRef } from './stopId.js';
import type { EfaDepartureMonitorResponse } from './types.js';

// Mirrors hafas/board.ts's generous "next couple of hours" promise: DM has no
// duration option, only a result cap, so this is sized to cover a similar
// window at a busy stop.
const BOARD_RESULTS = 40;

export async function efaBoard(ref: EfaStopRef): Promise<DepartureRow[]> {
  const network = efaNetworkById(ref.network);
  const response = await efaRequest<EfaDepartureMonitorResponse>(network, 'XML_DM_REQUEST', {
    type_dm: 'stop',
    name_dm: ref.id,
    mode: 'direct',
    useRealtime: '1',
    limit: String(BOARD_RESULTS),
  });

  return (response.stopEvents ?? [])
    .flatMap((event) => toDepartureRow(event) ?? [])
    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
}
