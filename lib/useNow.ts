import { useEffect, useState } from 'react';
import { berlinNow } from './time';

// "Now" as a Berlin wall-clock string, refreshed every 15 seconds while
// `active`. One per screen: passing it down keeps every countdown on a
// screen in step and lets the screen stop the clock when out of view.
export function useNow(active: boolean): string {
  const [now, setNow] = useState(berlinNow);

  useEffect(() => {
    if (!active) return;
    const tick = () => setNow(berlinNow());
    // A screen that comes back into view would show a stale minute until the
    // first interval tick. The refresh is deferred a tick because the lint rule
    // forbids setState straight in an effect body.
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 15_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [active]);

  return now;
}
