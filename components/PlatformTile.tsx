import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useT } from '@/lib/i18n';
import { spacing, type Theme } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import type { ServiceKind } from '@/types';

type Props = {
  // "11", "17 Ost", "103"
  platform?: string;
  // Set only when the platform changed.
  plannedPlatform?: string;
  // Picks the icon when there is no platform.
  kind?: ServiceKind;
  tone?: 'sign' | 'quiet' | 'highlight';
  // Defaults to the translated "Platform".
  label?: string;
  // Sits flush against the edge of a card that clips its corners: the tile
  // then has none of its own, or the card colour would show in the notches.
  flush?: boolean;
};

// The station sign: the platform number, the biggest thing on a row. Not an
// accessibility element itself; the row it sits in carries the label.
export function PlatformTile({
  platform,
  plannedPlatform,
  kind,
  tone = 'quiet',
  label,
  flush = false,
}: Props) {
  const theme = useTheme();
  const { colors, type } = theme;
  const t = useT();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!platform) {
    // Most bus and tram stops have no platform. The glyph is always quiet, so
    // a row of them does not shout where there is nothing to read.
    return (
      <View style={[styles.tile, flush && styles.flush, { backgroundColor: colors.muted }]}>
        <Ionicons
          name={kind === 'db' || kind === 'rail' ? 'train-outline' : 'bus-outline'}
          size={24}
          color={colors.foreground}
        />
      </View>
    );
  }

  // A changed platform overrides the tone: it is the one thing on the row the
  // rider must not miss.
  const changed = Boolean(plannedPlatform) && plannedPlatform !== platform;
  const palette = changed
    ? { bg: colors.delaySoft, fg: colors.delay }
    : tone === 'sign'
      ? { bg: colors.sign, fg: colors.signForeground }
      : tone === 'highlight'
        ? { bg: colors.highlight, fg: colors.highlightForeground }
        : { bg: colors.muted, fg: colors.foreground };

  return (
    <View style={[styles.tile, flush && styles.flush, { backgroundColor: palette.bg }]}>
      <Text
        style={[type.microBold, styles.label, { color: palette.fg }]}
        numberOfLines={1}
        // "Ausstieg" in capitals and a wide mono face does not fit 56pt.
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {label ?? t('platform.label')}
      </Text>
      <Text
        style={[type.title, { color: palette.fg }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.5}
      >
        {platform}
      </Text>
      {changed ? (
        <Text style={[type.micro, styles.planned, { color: palette.fg }]} numberOfLines={1}>
          {plannedPlatform}
        </Text>
      ) : null}
    </View>
  );
}

function createStyles({ radii }: Theme) {
  return StyleSheet.create({
    // Stretches to the height of its row. The card that holds it clips the
    // corners; a tile on its own keeps the card radius.
    tile: {
      width: 64,
      minHeight: 56,
      alignSelf: 'stretch',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xs,
      borderRadius: radii.md,
      borderCurve: 'continuous',
    },
    flush: { borderRadius: 0 },
    label: { textTransform: 'uppercase', opacity: 0.75 },
    planned: { textDecorationLine: 'line-through', opacity: 0.75 },
  });
}
