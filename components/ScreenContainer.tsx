import type { PropsWithChildren } from 'react';
import { useMemo } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useThemeColors } from '@/lib/useThemeColors';

type Props = PropsWithChildren<{
  style?: ViewStyle;
  /**
   * Which window insets this screen owns. Android is always edge-to-edge from
   * SDK 54 on, so every inset has to be claimed by exactly one element or it is
   * either doubled or ignored. Defaults to `['top']`, which suits a headerless
   * screen inside the tab navigator: the tab bar already applies the bottom
   * inset itself. Screens with a navigation header should drop `top` too, and
   * let their scroll view pad for the bottom inset so content scrolls under the
   * system bars instead of being clipped above them.
   */
  edges?: readonly Edge[];
}>;

export function ScreenContainer({ children, style, edges = ['top'] }: Props) {
  const { colors } = useThemeColors();
  const styles = useMemo(
    () => StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background } }),
    [colors],
  );

  return (
    <SafeAreaView style={[styles.container, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
}
