import { StyleSheet, Text, View } from 'react-native';
import { useT } from '@/lib/i18n';
import type { Translate } from '@/lib/i18n';
import { addMinutes, formatTime, minutesUntil } from '@/lib/time';
import { useTheme } from '@/lib/useTheme';

type Props = {
  time: string;
  delayMinutes?: number;
  now: string;
  cancelled?: boolean;
  // 'highlight' is for a countdown drawn on `colors.highlight`. The delay colour
  // has no contrast guarantee on that fill, so every part takes its text colour
  // and the row says "+3" in words instead.
  tone?: 'default' | 'highlight';
};

// The realtime clock time, "in 6 minutes" or "now": what a row's countdown
// says, as a sentence for the parent row's `accessibilityLabel`. A cancelled
// row has no countdown, so the caller decides what to say for it.
export function countdownLabel(
  time: string,
  delayMinutes: number | undefined,
  now: string,
  t: Translate,
): string {
  const minutes = minutesUntil(time, delayMinutes, now);
  if (minutes < 0 || minutes >= 60) return formatTime(addMinutes(time, delayMinutes ?? 0));
  // "in 0 minutes" reads wrong; "now" is what the visible countdown says too.
  return minutes === 0 ? t('countdown.now') : t('countdown.label', minutes);
}

// Minutes to go in the right-hand column of a row: the number when it is close
// enough to count down, the clock time when it is not.
export function Countdown({ time, delayMinutes, now, cancelled, tone = 'default' }: Props) {
  const theme = useTheme();
  const { colors, type } = theme;
  const t = useT();

  if (cancelled) return null;

  const minutes = minutesUntil(time, delayMinutes, now);
  const onHighlight = tone === 'highlight';
  const color = onHighlight
    ? colors.highlightForeground
    : (delayMinutes ?? 0) > 0
      ? colors.delay
      : colors.foreground;
  // The "min" caption stays muted even on a delayed row: only the number turns.
  const caption = onHighlight ? colors.highlightForeground : colors.mutedForeground;

  if (minutes < 0 || minutes >= 60) {
    return (
      <View style={styles.box}>
        <Text style={[type.timeSmall, { color }]} numberOfLines={1}>
          {formatTime(addMinutes(time, delayMinutes ?? 0))}
        </Text>
      </View>
    );
  }
  if (minutes === 0) {
    return (
      <View style={styles.box}>
        <Text style={[type.headline, { color }]} numberOfLines={1}>
          {t('countdown.now')}
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.box}>
      <Text style={[type.title, { color }]} numberOfLines={1}>
        {minutes}
      </Text>
      <Text style={[type.micro, { color: caption }]} numberOfLines={1}>
        {t('countdown.min')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { minWidth: 44, alignItems: 'flex-end', justifyContent: 'center' },
});
