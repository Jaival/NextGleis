/** Returns a copy of `items` with the entry at `from` relocated to `to`. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  if (from === to) return next;
  if (from < 0 || to < 0 || from >= next.length || to >= next.length) return next;

  const [moved] = next.splice(from, 1) as [T];
  next.splice(to, 0, moved);
  return next;
}
