import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { JourneyCard } from '@/components/JourneyCard';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SearchField } from '@/components/SearchField';
import { StationSearchResults } from '@/components/StationSearchResults';
import { getJourneys } from '@/lib/api';
import { routeId, useFavoriteRoutesStore } from '@/lib/favoriteRoutesStore';
import { tap } from '@/lib/haptics';
import { useT, type Translate } from '@/lib/i18n';
import { radii, spacing, type } from '@/lib/theme';
import { useStationSearch } from '@/lib/useStationSearch';
import { useThemeColors } from '@/lib/useThemeColors';
import type { StationSearchResult } from '@/types';

type Colors = ReturnType<typeof useThemeColors>['colors'];
type Styles = ReturnType<typeof createStyles>;
type Stop = { id: string; name: string };
type End = 'from' | 'to';

function endLabels(end: End, t: Translate): { title: string; placeholder: string; role: string } {
  return end === 'from'
    ? {
        title: t('routes.from'),
        placeholder: t('routes.fromPlaceholder'),
        role: t('routes.fromRole'),
      }
    : { title: t('routes.to'), placeholder: t('routes.toPlaceholder'), role: t('routes.toRole') };
}

export default function RoutesScreen() {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const t = useT();
  const { fromEva, fromName, toEva, toName } = useLocalSearchParams<{
    fromEva?: string;
    fromName?: string;
    toEva?: string;
    toName?: string;
  }>();

  const [from, setFrom] = useState<Stop | null>(null);
  const [to, setTo] = useState<Stop | null>(null);
  const [editing, setEditing] = useState<End | null>(null);
  const [input, setInput] = useState('');
  const search = useStationSearch(input, editing !== null);

  // A saved route opened from Home arrives as params and replaces whatever
  // was on screen. Applied during render (rather than in an effect) so the
  // first frame already shows the route instead of an empty picker.
  const paramsKey = fromEva && fromName && toEva && toName ? `${fromEva}>${toEva}` : null;
  const [appliedParams, setAppliedParams] = useState<string | null>(null);
  if (paramsKey && paramsKey !== appliedParams && fromEva && fromName && toEva && toName) {
    setAppliedParams(paramsKey);
    setFrom({ id: fromEva, name: fromName });
    setTo({ id: toEva, name: toName });
    setEditing(null);
  }

  const saved = useFavoriteRoutesStore(
    (s) =>
      from !== null &&
      to !== null &&
      s.favoriteRoutes.some((r) => r.id === routeId(from.id, to.id)),
  );
  const addFavoriteRoute = useFavoriteRoutesStore((s) => s.addFavoriteRoute);
  const removeFavoriteRoute = useFavoriteRoutesStore((s) => s.removeFavoriteRoute);

  const toggleSaved = () => {
    if (!from || !to) return;
    tap.light();
    if (saved) {
      removeFavoriteRoute(routeId(from.id, to.id));
    } else {
      addFavoriteRoute({ fromEva: from.id, fromName: from.name, toEva: to.id, toName: to.name });
    }
  };

  const startEditing = (end: End) => {
    setInput('');
    setEditing(end);
  };

  const stopEditing = () => {
    Keyboard.dismiss();
    setInput('');
    setEditing(null);
  };

  const pick = (station: StationSearchResult) => {
    const stop = { id: station.evaNo, name: station.name };
    if (editing === 'from') setFrom(stop);
    else setTo(stop);
    stopEditing();
  };

  const swap = () => {
    tap.light();
    setFrom(to);
    setTo(from);
  };

  const ready = from !== null && to !== null && from.id !== to.id;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>{t('routes.title')}</Text>
        {ready ? (
          <Pressable
            onPress={toggleSaved}
            accessibilityRole="button"
            accessibilityState={{ selected: saved }}
            accessibilityLabel={saved ? t('routes.unsave') : t('routes.save')}
            hitSlop={12}
          >
            <Ionicons
              name={saved ? 'star' : 'star-outline'}
              size={22}
              color={saved ? colors.primary : colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.ends}>
        <EndRow
          end="from"
          stop={from}
          active={editing === 'from'}
          onPress={() => startEditing('from')}
          styles={styles}
          colors={colors}
        />
        <View style={styles.divider} />
        <EndRow
          end="to"
          stop={to}
          active={editing === 'to'}
          onPress={() => startEditing('to')}
          styles={styles}
          colors={colors}
        />
        <Pressable
          onPress={swap}
          disabled={!from && !to}
          style={styles.swap}
          accessibilityRole="button"
          accessibilityLabel={t('routes.swap')}
          hitSlop={8}
        >
          <Ionicons name="swap-vertical" size={18} color={colors.primary} />
        </Pressable>
      </View>

      {editing ? (
        <View style={styles.fill}>
          <View style={styles.searchRow}>
            <View style={styles.fill}>
              <SearchField
                autoFocus
                value={input}
                onChangeText={setInput}
                placeholder={endLabels(editing, t).placeholder}
                accessibilityLabel={t('routes.searchLabel', endLabels(editing, t).role)}
              />
            </View>
            <Pressable onPress={stopEditing} accessibilityRole="button" hitSlop={8}>
              <Text style={styles.cancel}>{t('common.cancel')}</Text>
            </Pressable>
          </View>
          <StationSearchResults
            search={search}
            onSelect={pick}
            idleTitle={editing === 'from' ? t('routes.chooseStart') : t('routes.chooseDestination')}
            idleMessage={t('routes.idleMessage')}
            itemLabel={(station) => t('routes.chooseAs', station.name, endLabels(editing, t).role)}
          />
        </View>
      ) : !from || !to ? (
        <EmptyState
          fill
          icon="git-network-outline"
          title={t('routes.planTitle')}
          message={t('routes.planMessage')}
        />
      ) : !ready ? (
        <EmptyState
          fill
          icon="swap-vertical"
          title={t('routes.sameStopTitle')}
          message={t('routes.sameStopMessage')}
        />
      ) : (
        <JourneyList from={from} to={to} styles={styles} colors={colors} />
      )}
    </ScreenContainer>
  );
}

function EndRow({
  end,
  stop,
  active,
  onPress,
  styles,
  colors,
}: {
  end: End;
  stop: Stop | null;
  active: boolean;
  onPress: () => void;
  styles: Styles;
  colors: Colors;
}) {
  const t = useT();
  const labels = endLabels(end, t);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        stop ? t('routes.endLabel', labels.title, stop.name) : t('routes.chooseEnd', labels.role)
      }
      style={({ pressed }) => [styles.endRow, pressed && styles.endRowPressed]}
    >
      <Ionicons
        name={end === 'from' ? 'radio-button-on' : 'location'}
        size={16}
        color={active ? colors.primary : colors.textTertiary}
      />
      <View style={styles.fill}>
        <Text style={styles.endTitle}>{labels.title}</Text>
        <Text style={[styles.endName, !stop && styles.endPlaceholder]} numberOfLines={1}>
          {stop?.name ?? labels.placeholder}
        </Text>
      </View>
    </Pressable>
  );
}

function JourneyList({
  from,
  to,
  styles,
  colors,
}: {
  from: Stop;
  to: Stop;
  styles: Styles;
  colors: Colors;
}) {
  const t = useT();
  const { data, isLoading, isError, isRefetching, refetch, fetchStatus } = useQuery({
    queryKey: ['journeys', from.id, to.id],
    queryFn: ({ signal }) => getJourneys(from.id, to.id, signal),
    // Connections shift with realtime delays; a minute is fresh enough while
    // the list is open.
    refetchInterval: 60_000,
  });
  const isOffline = fetchStatus === 'paused';

  if (isLoading) {
    return isOffline ? (
      <EmptyState
        fill
        icon="cloud-offline-outline"
        title={t('common.offline')}
        message={t('routes.offlineLoading')}
      />
    ) : (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={data ?? []}
      keyExtractor={(journey) => journey.id}
      renderItem={({ item }) => <JourneyCard journey={item} />}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      ListEmptyComponent={
        isOffline ? (
          <EmptyState
            fill
            icon="cloud-offline-outline"
            title={t('common.offline')}
            message={t('routes.offlineStale')}
          />
        ) : isError ? (
          <EmptyState
            fill
            icon="alert-circle-outline"
            title={t('routes.error')}
            message={t('common.pullToRetry')}
          />
        ) : (
          <EmptyState
            fill
            icon="git-network-outline"
            title={t('routes.emptyTitle')}
            message={t('routes.emptyMessage')}
          />
        )
      }
    />
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    fill: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
    },
    title: { ...type.largeTitle, color: colors.textPrimary },
    ends: {
      marginHorizontal: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderCurve: 'continuous',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      boxShadow: colors.shadowCard,
      overflow: 'hidden',
      justifyContent: 'center',
    },
    endRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingLeft: spacing.md,
      // Clears the swap button that floats over the right edge.
      paddingRight: 56,
    },
    endRowPressed: { backgroundColor: colors.surfaceMuted },
    endTitle: { ...type.micro, color: colors.textTertiary },
    endName: { ...type.subheadMedium, color: colors.textPrimary },
    endPlaceholder: { color: colors.textTertiary },
    // Starts where the stop names do, so the two rows read as one list.
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginLeft: spacing.md + 16 + spacing.md,
    },
    swap: {
      position: 'absolute',
      right: spacing.md,
      width: 36,
      height: 36,
      borderRadius: radii.pill,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    cancel: { ...type.calloutMedium, color: colors.primary },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.xxl,
      gap: spacing.sm,
      flexGrow: 1,
    },
  });
}
