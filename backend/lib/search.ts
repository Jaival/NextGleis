import { searchEfaCandidates } from './efa/search.js';
import { searchHafasCandidates } from './hafas/search.js';
import { metresBetween } from './hafas/geo.js';
import { type Candidate, SAME_STOP_METRES } from './searchCandidate.js';
import { tokenize } from './searchText.js';
import type { StationSearchResult } from '../types/index.js';

const MAX_RESULTS = 15;

export async function searchStops(query: string): Promise<StationSearchResult[]> {
  const [hafas, efa] = await Promise.all([
    searchHafasCandidates(query),
    searchEfaCandidates(query, tokenize(query)),
  ]);

  // The four EFA networks exist specifically to cover the one real gap in
  // HAFAS's index (see THINGS_TO_KNOW.md): inside their area they have every
  // local bus and tram, where a HAFAS network only has thin, rail-only
  // fallback entries. So an EFA result always wins a same-stop duplicate,
  // regardless of either source's own area-based ranking.
  const hafasFiltered = hafas.filter(
    (h) => !efa.some((e) => metresBetween(h.coordinates, e.coordinates) <= SAME_STOP_METRES),
  );
  const all = [...efa, ...hafasFiltered];

  // Each source's own fuzzy matching pads its answer with loosely related
  // stops ("Berliner Straße" for "Berlin"). This has to run once, across
  // both sources together — deciding it per source would let one source's
  // noise back in whenever only the other source had a real match.
  const matching = all.filter((c) => c.matchesQuery);
  const pool = matching.length > 0 ? matching : all;

  const kept: Candidate[] = [];
  for (const candidate of pool.sort((a, b) => a.priority - b.priority || a.rank - b.rank)) {
    const duplicate = kept.some(
      (k) => k.sourceLabel !== candidate.sourceLabel && metresBetween(k.coordinates, candidate.coordinates) <= SAME_STOP_METRES,
    );
    if (!duplicate) kept.push(candidate);
  }

  kept.sort((a, b) => a.rank - b.rank);

  return kept.slice(0, MAX_RESULTS).map((c) => ({ evaNo: c.stopId, name: c.name, network: c.sourceLabel }));
}
