import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from '@/components/BottomSheet';
import { SegmentedControl } from '@/components/SegmentedControl';
import { useLanguage, useT } from '@/lib/i18n';
import { radii, spacing, type } from '@/lib/theme';
import { TRANSIT_TIME_ZONE, formatClock, formatDay } from '@/lib/time';
import { useThemeColors } from '@/lib/useThemeColors';

// `when: null` is "leave now": the search follows the clock instead of
// pinning the moment the user opened the screen.
export type TripTime = { arrival: boolean; when: Date | null };

type Colors = ReturnType<typeof useThemeColors>['colors'];
type Mode = 'depart' | 'arrive';

type Props = {
  visible: boolean;
  value: TripTime;
  onChange: (value: TripTime) => void;
  onClose: () => void;
};

// The system pickers on Android are dialogs of their own, opened from a date
// row and a time row; iOS has an inline wheel. The web build has neither
// (the library renders nothing there), so Routes doesn't offer this sheet on
// web at all.
export function TripTimeSheet({ visible, value, onChange, onClose }: Props) {
  const { colors, isDark } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const t = useT();
  const language = useLanguage();

  // Edits stay a draft until Done, so scrolling the iOS wheel doesn't start a
  // search per notch. Reset from the current value each time the sheet opens
  // (during render, not in an effect, so the first frame is already right).
  const [draft, setDraft] = useState(value);
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setDraft(value);
  }

  const shown = draft.when ?? new Date();

  const setMode = (mode: Mode) => setDraft({ arrival: mode === 'arrive', when: shown });

  const pick = (_event: DateTimePickerEvent, date?: Date) => {
    if (date) setDraft((d) => ({ ...d, when: date }));
  };

  const openAndroid = (mode: 'date' | 'time') =>
    DateTimePickerAndroid.open({
      value: shown,
      mode,
      is24Hour: true,
      timeZoneName: TRANSIT_TIME_ZONE,
      onChange: (event, date) => {
        if (event.type === 'set') pick(event, date);
      },
    });

  const now = () => {
    onChange({ arrival: false, when: null });
    onClose();
  };

  const done = () => {
    onChange(draft);
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      title={t('routes.timeTitle')}
      action={{ label: t('routes.now'), onPress: now }}
      onDone={done}
      onClose={onClose}
    >
      <SegmentedControl<Mode>
        options={[
          { value: 'depart', label: t('routes.depart') },
          { value: 'arrive', label: t('routes.arrive') },
        ]}
        value={draft.arrival ? 'arrive' : 'depart'}
        onChange={setMode}
        accessibilityLabel={t('routes.timeModeLabel')}
      />

      {Platform.OS === 'ios' ? (
        <DateTimePicker
          value={shown}
          mode="datetime"
          display="spinner"
          timeZoneName={TRANSIT_TIME_ZONE}
          locale={language === 'de' ? 'de-DE' : 'en-GB'}
          themeVariant={isDark ? 'dark' : 'light'}
          onChange={pick}
          style={styles.wheel}
        />
      ) : (
        <View style={styles.rows}>
          <PickerRow
            icon="calendar-outline"
            label={t('routes.date')}
            value={formatDay(shown, language, t)}
            onPress={() => openAndroid('date')}
            styles={styles}
            colors={colors}
          />
          <View style={styles.divider} />
          <PickerRow
            icon="time-outline"
            label={t('routes.time')}
            value={formatClock(shown, language)}
            onPress={() => openAndroid('time')}
            styles={styles}
            colors={colors}
          />
        </View>
      )}
    </BottomSheet>
  );
}

function PickerRow({
  icon,
  label,
  value,
  onPress,
  styles,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  colors: Colors;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Ionicons name={icon} size={18} color={colors.textSecondary} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </Pressable>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    wheel: { alignSelf: 'stretch' },
    rows: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.md,
      borderCurve: 'continuous',
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    rowPressed: { backgroundColor: colors.border },
    rowLabel: { ...type.subhead, color: colors.textSecondary, flex: 1 },
    rowValue: { ...type.subheadMedium, color: colors.textPrimary, fontVariant: ['tabular-nums'] },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginLeft: spacing.md + 18 + spacing.md,
    },
  });
}
