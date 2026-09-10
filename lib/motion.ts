import { cubicBezier, Easing } from 'react-native-reanimated';

// Motion tokens. Every animation in the app draws its duration and its curve
// from here so that unrelated screens still feel like the same product.
//
// The ceiling is deliberate: nothing the user triggers dozens of times a day
// runs longer than `fast`, and nothing at all runs longer than `slow`. Mobile
// UI that animates for 400ms reads as sluggish, not as smooth.
export const duration = {
  /** Press-in / press-out feedback. Long enough to see, short enough to feel instant. */
  press: 120,
  /** Small state flips: chip selection, badge swap, focus ring. */
  fast: 160,
  /** Elements entering, leaving, or moving within a screen. */
  base: 240,
  /** Larger surfaces and list reflow. */
  slow: 320,
} as const;

// Reanimated's built-in easings are as weak as CSS's defaults. `curve` is the
// form Reanimated CSS transitions/animations take; `easing` is the same two
// curves for the imperative `withTiming` API.
export const curve = {
  /** Entering, leaving, and press feedback — fast out of the gate, gentle landing. */
  out: cubicBezier(0.23, 1, 0.32, 1),
  /** Something already on screen moving to a new position. */
  inOut: cubicBezier(0.77, 0, 0.175, 1),
} as const;

export const easing = {
  out: Easing.bezier(0.23, 1, 0.32, 1),
  inOut: Easing.bezier(0.77, 0, 0.175, 1),
} as const;

// Apple's two designer parameters, not mass/stiffness/damping.
export const spring = {
  /** Settles without overshoot. The default for anything that isn't thrown. */
  settle: { duration: 400, dampingRatio: 1 },
  /** A touch of overshoot, for a control that should feel eager (a star popping in). */
  pop: { duration: 350, dampingRatio: 0.6 },
} as const;

/** Scale a pressable drops to while held. 3% — any deeper reads as a bug. */
export const PRESS_SCALE = 0.97;
