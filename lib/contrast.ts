// WCAG 2 contrast maths for #RRGGBB colours, used to derive the high-contrast
// variant of a theme at runtime instead of hand-maintaining a second palette
// for every theme.

function channels(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1, 7), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

function linear(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const [r, g, b] = channels(hex);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// `amount` 0 keeps `from`, 1 gives `to`.
export function mix(from: string, to: string, amount: number): string {
  const [r1, g1, b1] = channels(from);
  const [r2, g2, b2] = channels(to);
  const lerp = (a: number, b: number) => a + (b - a) * amount;
  return toHex([lerp(r1, r2), lerp(g1, g2), lerp(b1, b2)]);
}

// Moves `color` toward `ink` (black in light mode, white in dark) in small
// steps until it reaches `ratio` against every background, keeping as much of
// its hue as it can.
export function ensureContrast(
  color: string,
  backgrounds: string[],
  ratio: number,
  ink: string,
): string {
  const passes = (c: string) => backgrounds.every((bg) => contrastRatio(c, bg) >= ratio);
  for (let step = 0; step <= 20; step++) {
    const candidate = mix(color, ink, step / 20);
    if (passes(candidate)) return candidate;
  }
  return ink;
}
