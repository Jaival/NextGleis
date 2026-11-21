import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, type Theme } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import type { Notice } from '@/types';

// One network remark under a departure or journey leg: "stop cancelled",
// "replacement bus", "departs from platform 13 today". Clamped, because a row
// is scanned rather than read; the full text of disruption warnings lives in
// the board's banner.
export function NoticeLine({
  notice,
  lines = 2,
  tone = 'default',
}: {
  notice: Notice;
  lines?: number;
  // 'highlight' is for a line on `colors.highlight`, where the warning colour
  // has no contrast guarantee: icon and text take that fill's text colour.
  tone?: 'default' | 'highlight';
}) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const text = notice.title ? `${notice.title}: ${notice.text}` : notice.text;

  return (
    <View style={styles.row}>
      <Ionicons
        name={notice.severity === 'warning' ? 'warning' : 'information-circle'}
        size={13}
        color={tone === 'highlight' ? colors.highlightForeground : colors.delay}
        style={styles.icon}
      />
      <Text
        style={[styles.text, tone === 'highlight' && { color: colors.highlightForeground }]}
        numberOfLines={lines}
      >
        {text}
      </Text>
    </View>
  );
}

function createStyles({ colors, type }: Theme) {
  return StyleSheet.create({
    // Stretches inside the start-aligned columns it sits in, so long text
    // wraps at the column edge instead of sizing the row to its content.
    row: { flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start', alignSelf: 'stretch' },
    // Sits on the first line's x-height rather than the line box's top.
    icon: { marginTop: 1 },
    text: { flex: 1, ...type.caption, color: colors.mutedForeground },
  });
}
