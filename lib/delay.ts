import type { ThemeColors } from './theme';

export type DelayBadgeSpec = { label: string; bg: string; fg: string };

export function delayBadgeSpec(
  status: { cancelled: boolean; delayMinutes?: number },
  colors: ThemeColors,
): DelayBadgeSpec {
  if (status.cancelled)
    return { label: 'Cancelled', bg: colors.cancelledSoft, fg: colors.cancelled };
  if (status.delayMinutes && status.delayMinutes > 0) {
    return { label: `+${status.delayMinutes} min`, bg: colors.delaySoft, fg: colors.delay };
  }
  return { label: 'On time', bg: colors.onTimeSoft, fg: colors.onTime };
}
