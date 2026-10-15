import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Clock3, Globe2 } from 'lucide-react-native';

import { BigButton } from '../components/BigButton';
import { Input } from '../components/Input';
import { OptionChip } from '../components/OptionChip';
import { useLanguage } from '../i18n/LanguageContext';
import { colors, radii, sizes, spacing, typography } from '../theme';
import type { AppSettings } from '../types';
import {
  COMMON_TIME_ZONES,
  getAppNow,
  parseClockDraft,
  type ClockDraft,
} from '../utils/appClock';
import { formatConfiguredDateTime } from '../utils/dates';
import { PinInput } from './PinInput';
import { verifyAdminPin } from './pin';

type ClockPatch = Pick<AppSettings, 'clockOffsetMs' | 'timeZone'>;

export function DateTimeEditor({
  settings,
  value,
  onChange,
  onApply,
  deferredUntilPin = false,
}: {
  settings: AppSettings;
  value: ClockDraft;
  onChange: (value: ClockDraft) => void;
  onApply?: (patch: ClockPatch) => Promise<unknown>;
  deferredUntilPin?: boolean;
}) {
  const db = useSQLiteContext();
  const { copy } = useLanguage();
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((tick) => tick + 1), 1_000);
    return () => clearInterval(interval);
  }, []);

  const liveNow = getAppNow(settings);
  const liveText = copy.setup.liveClock(
    formatConfiguredDateTime(liveNow.toISOString(), settings),
    settings.timeZone,
  );

  function change(patch: Partial<ClockDraft>) {
    setMessage('');
    onChange({ ...value, ...patch });
  }

  async function applyClock() {
    const patch = parseClockDraft(value);
    if (!patch) {
      setIsError(true);
      setMessage(copy.setup.clockValidation);
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      if (!(await verifyAdminPin(db, pin))) {
        setIsError(true);
        setMessage(copy.settings.wrongPin);
        return;
      }
      if (!onApply) return;
      await onApply(patch);
      setPin('');
      setIsError(false);
      setMessage(copy.setup.clockApplied);
    } catch {
      setIsError(true);
      setMessage(copy.settings.settingsError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <View style={styles.headingIcon}>
          <Clock3 color={colors.primary} size={sizes.iconMd} strokeWidth={2} />
        </View>
        <View style={styles.headingCopy}>
          <Text style={styles.title}>{copy.setup.clockTitle}</Text>
          <Text style={styles.hint}>{copy.setup.clockHint}</Text>
        </View>
      </View>

      <View style={styles.liveRow}>
        <Globe2 color={colors.secondary} size={sizes.iconSm} strokeWidth={2} />
        <Text style={styles.liveText}>{liveText}</Text>
      </View>

      <View style={styles.dateTimeRow}>
        <Input
          accessibilityLabel={copy.setup.currentDate}
          containerStyle={styles.dateField}
          label={copy.setup.currentDate}
          maxLength={10}
          onChangeText={(date) => change({ date })}
          placeholder={copy.setup.datePlaceholder}
          value={value.date}
        />
        <Input
          accessibilityLabel={copy.setup.currentTime}
          containerStyle={styles.timeField}
          label={copy.setup.currentTime}
          maxLength={5}
          onChangeText={(time) => change({ time })}
          placeholder={copy.setup.timePlaceholder}
          value={value.time}
        />
      </View>
      <Input
        accessibilityLabel={copy.setup.timeZone}
        autoCapitalize="none"
        autoCorrect={false}
        label={copy.setup.timeZone}
        onChangeText={(timeZone) => change({ timeZone })}
        placeholder={copy.setup.timeZonePlaceholder}
        value={value.timeZone}
      />
      <View style={styles.zoneGroup}>
        <Text style={styles.zoneLabel}>{copy.setup.commonTimeZones}</Text>
        <View style={styles.zoneChoices}>
          {COMMON_TIME_ZONES.map((timeZone) => (
            <OptionChip
              key={timeZone}
              label={timeZone}
              onPress={() => change({ timeZone })}
              selected={value.timeZone === timeZone}
              style={styles.zoneChip}
            />
          ))}
        </View>
      </View>

      {deferredUntilPin ? (
        <Text style={styles.pending}>{copy.setup.clockPendingPin}</Text>
      ) : (
        <View style={styles.applyRow}>
          <PinInput label={copy.setup.clockPin} value={pin} onChange={setPin} />
          <BigButton
            disabled={busy}
            label={copy.setup.applyClock}
            onPress={() => void applyClock()}
            style={styles.applyButton}
          />
        </View>
      )}
      {message ? (
        <Text style={[styles.message, isError && styles.error]}>{message}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  headingIcon: {
    width: sizes.tapMin,
    height: sizes.tapMin,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
  },
  headingCopy: { flex: 1, minWidth: 0 },
  title: { ...typography.h3, color: colors.ink },
  hint: { ...typography.body, marginTop: spacing.xxs, color: colors.muted },
  liveRow: {
    minHeight: sizes.tapMin,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.secondarySoft,
  },
  liveText: { ...typography.bodyStrong, flex: 1, color: colors.ink },
  dateTimeRow: { flexDirection: 'row', gap: spacing.md },
  dateField: { flex: 2 },
  timeField: { flex: 1 },
  zoneGroup: { gap: spacing.xs },
  zoneLabel: { ...typography.bodyStrong, color: colors.ink },
  zoneChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  zoneChip: { minHeight: sizes.tapMin, paddingHorizontal: spacing.sm },
  pending: {
    ...typography.bodyStrong,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.accentSoft,
    color: colors.warning,
  },
  applyRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md },
  applyButton: { flex: 1, minHeight: sizes.control },
  message: {
    ...typography.bodyStrong,
    padding: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.successSoft,
    color: colors.primaryDark,
  },
  error: { backgroundColor: colors.dangerSoft, color: colors.dangerDark },
});
