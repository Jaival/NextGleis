import * as Haptics from 'expo-haptics';

// Haptics are best-effort: silent on most Android hardware, disabled
// system-wide by plenty of users, and rejected on web without vibration
// support. Every call site pairs the tap with a visual change, so a failure
// here is never worth surfacing — but an unhandled rejection would still warn
// in development, hence the swallow.
function fire(run: () => Promise<void>) {
  void run().catch(() => {});
}

export const tap = {
  /** A value moved to a new step: chip, segment, reorder. */
  selection: () => fire(() => Haptics.selectionAsync()),
  /** Something committed or snapped home. */
  light: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** A destructive action fired. */
  medium: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
};

export type HapticKind = keyof typeof tap;
