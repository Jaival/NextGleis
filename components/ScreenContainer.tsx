import type { PropsWithChildren } from 'react';
import { useMemo } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../lib/useThemeColors';

export function ScreenContainer({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  const { colors } = useThemeColors();
  const styles = useMemo(
    () => StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background } }),
    [colors],
  );

  return <SafeAreaView style={[styles.container, style]}>{children}</SafeAreaView>;
}
