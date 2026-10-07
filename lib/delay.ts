import type { Translate } from './i18n';
import type { ThemeColors } from './theme';

export type DepartureStatusKind = 'onTime' | 'delayed' | 'cancelled';

export type DepartureStatus = {
  kind: DepartureStatusKind;
  /** Short caption under the departure time. */
  label: string;
  /** Foreground for the caption, and for the time itself when delayed. */
  fg: string;
  /** Tint behind the caption. Only used where the status needs to shout. */
  bg: string;
};

export function departureStatus(
  status: { cancelled: boolean; delayMinutes?: number },
  colors: ThemeColors,
  t: Translate,
): DepartureStatus {
  if (status.cancelled) {
    return {
      kind: 'cancelled',
      label: t('status.cancelled'),
      fg: colors.cancelled,
      bg: colors.cancelledSoft,
    };
  }
  if (status.delayMinutes && status.delayMinutes > 0) {
    return {
      kind: 'delayed',
      label: t('status.delayed', status.delayMinutes),
      fg: colors.delay,
      bg: colors.delaySoft,
    };
  }
  return { kind: 'onTime', label: t('status.onTime'), fg: colors.onTime, bg: colors.onTimeSoft };
}
