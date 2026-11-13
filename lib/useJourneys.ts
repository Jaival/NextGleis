import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getJourneys, type JourneyQuery } from './api';
import { needsLongDistanceTicket } from './product';
import type { Journey } from '@/types';

// One search for connections. `when` null means "from now".
export type JourneySearch = {
  fromId: string;
  toId: string;
  when: Date | null;
  arrival: boolean;
  // Leave out trains the Deutschlandticket doesn't cover.
  regionalOnly: boolean;
};

// The connections of one search, in pages towards earlier and later. Shared by
// the Routes list and the screen for a single connection: the same search has
// the same cache entry, so opening a connection shows it at once and keeps it
// up to date. `subscribed` false stops the polling for a screen out of view.
export function useJourneys(
  { fromId, toId, when, arrival, regionalOnly }: JourneySearch,
  subscribed: boolean,
) {
  const query = useInfiniteQuery({
    queryKey: ['journeys', fromId, toId, arrival, when?.toISOString() ?? 'now', regionalOnly],
    queryFn: ({ pageParam, signal }) => getJourneys(fromId, toId, pageParam, regionalOnly, signal),
    initialPageParam: (when ? { when, arrival } : { arrival: false }) as JourneyQuery,
    getPreviousPageParam: (first): JourneyQuery | undefined =>
      first.earlierRef ? { earlier: first.earlierRef } : undefined,
    getNextPageParam: (last): JourneyQuery | undefined =>
      last.laterRef ? { later: last.laterRef } : undefined,
    subscribed,
    // Connections shift with realtime delays; a minute is fresh enough while
    // one is on screen.
    refetchInterval: 60_000,
  });

  // Neighbouring pages can repeat a connection where they meet. In
  // Deutschlandticket mode the backend already asks for regional trains only;
  // this catches a long-distance train a network files under a regional
  // product.
  const { data } = query;
  const journeys = useMemo(() => {
    const seen = new Set<string>();
    const all: Journey[] = [];
    for (const journey of data?.pages.flatMap((page) => page.journeys) ?? []) {
      if (seen.has(journey.id)) continue;
      if (
        regionalOnly &&
        journey.legs.some((leg) => !leg.walking && leg.line && needsLongDistanceTicket(leg.line))
      ) {
        continue;
      }
      seen.add(journey.id);
      all.push(journey);
    }
    return all;
  }, [data, regionalOnly]);

  return { query, journeys };
}
