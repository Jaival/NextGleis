import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SearchField } from '@/components/SearchField';
import { StationSearchResults } from '@/components/StationSearchResults';
import { spacing, type } from '@/lib/theme';
import { useStationSearch } from '@/lib/useStationSearch';
import { useThemeColors } from '@/lib/useThemeColors';

export default function SearchScreen() {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [input, setInput] = useState('');
  const search = useStationSearch(input);

  const openBoard = (evaNo: string, name: string) => {
    router.push({ pathname: '/board/[evaNo]', params: { evaNo, name } });
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <SearchField
          value={input}
          onChangeText={setInput}
          placeholder="Stop or station, e.g. Frankfurt Hbf"
          accessibilityLabel="Stop or station search"
        />
      </View>

      <StationSearchResults
        search={search}
        onSelect={(station) => openBoard(station.evaNo, station.name)}
        idleTitle="Find a stop"
        idleMessage="Type at least two letters of a stop or station name to see its departures."
      />
    </ScreenContainer>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>['colors']) {
  return StyleSheet.create({
    header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
    title: { ...type.largeTitle, color: colors.textPrimary },
  });
}
