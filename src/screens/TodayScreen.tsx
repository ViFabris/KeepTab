import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Check, RefreshCw, Trash2 } from 'lucide-react-native';

import { BigButton } from '../components/BigButton';
import { BrandShapes } from '../components/BrandShapes';
import { ListRow } from '../components/ListRow';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge, type StatusTone } from '../components/StatusBadge';
import { getTodayLabelGroups, updateLabelStatus } from '../database/labelsRepository';
import { getLabelOptions } from '../database/optionsRepository';
import { getFormLabel, getItemName, getLabelOptionName, getStorageLabel } from '../i18n';
import { useLanguage } from '../i18n/LanguageContext';
import { useSettings } from '../settings/SettingsContext';
import { cardStyle, colors, radii, sizes, spacing, typography } from '../theme';
import type { LabelOption, SavedLabel, TodayLabelGroups } from '../types';
import { getAppNow } from '../utils/appClock';
import { formatConfiguredDateTime } from '../utils/dates';

const EMPTY_GROUPS: TodayLabelGroups = { overdue: [], today: [], nextThreeDays: [] };

interface TodayScreenProps {
  refreshKey: number;
}

export function TodayScreen({ refreshKey }: TodayScreenProps) {
  const db = useSQLiteContext();
  const { copy } = useLanguage();
  const { settings } = useSettings();
  const [options, setOptions] = useState<LabelOption[]>([]);
  const [groups, setGroups] = useState<TodayLabelGroups>(EMPTY_GROUPS);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const loadLabels = useCallback(async () => {
    setError('');
    try {
      const [nextGroups, nextOptions] = await Promise.all([
        getTodayLabelGroups(db, getAppNow(settings), settings.timeZone),
        getLabelOptions(db, undefined, true),
      ]);
      setGroups(nextGroups);
      setOptions(nextOptions);
    } catch {
      setError(copy.labelsLoadError);
    } finally {
      setLoading(false);
    }
  }, [copy.labelsLoadError, db, settings.clockOffsetMs, settings.timeZone]);

  useEffect(() => {
    setLoading(true);
    void loadLabels();
  }, [loadLabels, refreshKey]);

  async function closeLabel(label: SavedLabel, status: 'used' | 'thrown_away') {
    setUpdatingId(label.id);
    setError('');
    try {
      await updateLabelStatus(db, label.id, status);
      removeFromView(label.id);
    } catch {
      setError(copy.labelUpdateError);
    } finally {
      setUpdatingId(null);
    }
  }

  function removeFromView(id: number) {
    setGroups((current) => ({
      overdue: current.overdue.filter((label) => label.id !== id),
      today: current.today.filter((label) => label.id !== id),
      nextThreeDays: current.nextThreeDays.filter((label) => label.id !== id),
    }));
  }

  return (
    <View style={styles.screen}>
      <PageHeader
        title={copy.todayTitle}
        subtitle={copy.todayHint}
        action={
          <BigButton
            label={copy.refresh}
            onPress={() => {
              setLoading(true);
              void loadLabels();
            }}
            variant="secondary"
            style={styles.refresh}
            leading={<RefreshCw color={colors.ink} size={sizes.iconMd} strokeWidth={2} />}
          />
        }
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>{copy.loadingLabels}</Text>
        </View>
      ) : (
        <View style={styles.columns}>
          <LabelSection
            title={copy.overdueSection}
            labels={groups.overdue}
            tone="danger"
            updatingId={updatingId}
            options={options}
            onClose={closeLabel}
          />
          <LabelSection
            title={copy.todaySection}
            labels={groups.today}
            tone="today"
            updatingId={updatingId}
            options={options}
            onClose={closeLabel}
          />
          <LabelSection
            title={copy.nextThreeDaysSection}
            labels={groups.nextThreeDays}
            tone="upcoming"
            updatingId={updatingId}
            options={options}
            onClose={closeLabel}
          />
        </View>
      )}
    </View>
  );
}

type SectionTone = 'danger' | 'today' | 'upcoming';

interface LabelSectionProps {
  title: string;
  labels: SavedLabel[];
  tone: SectionTone;
  updatingId: number | null;
  options: LabelOption[];
  onClose: (label: SavedLabel, status: 'used' | 'thrown_away') => Promise<void>;
}

function LabelSection({ title, labels, tone, updatingId, options, onClose }: LabelSectionProps) {
  const { language, copy } = useLanguage();
  const { settings } = useSettings();
  const statusTone: StatusTone = tone === 'danger' ? 'danger' : 'warning';
  return (
    <View style={styles.section}>
      <View style={[styles.sectionHeader, toneStyles[tone].header]}>
        <StatusBadge label={title} tone={statusTone} />
        <Text style={[styles.count, toneStyles[tone].count]}>{labels.length}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {labels.length === 0 ? (
          <View style={styles.empty}>
            <BrandShapes style={styles.emptyShapes} />
            <Text style={styles.emptyText}>{copy.nothingHere}</Text>
          </View>
        ) : null}
        {labels.map((label) => (
          <ListRow key={label.id} style={[styles.card, toneStyles[tone].card]}>
            <StatusBadge label={title} tone={statusTone} />
            <Text numberOfLines={1} style={styles.itemName}>
              {getItemName(label.itemId, label.itemName, language)}
            </Text>
            <Text style={styles.meta}>
              {label.formOptionId
                ? getLabelOptionName(
                    options.find((option) => option.id === label.formOptionId) ?? {
                      id: label.formOptionId,
                      kind: 'form',
                      translationKey: null,
                      customLabel: null,
                      legacyValue: label.form,
                      sortOrder: 0,
                      appliesToAll: false,
                    },
                    language,
                  )
                : getFormLabel(label.form, language)}{' '}
              ·{' '}
              {label.storageOptionId
                ? getLabelOptionName(
                    options.find((option) => option.id === label.storageOptionId) ?? {
                      id: label.storageOptionId,
                      kind: 'storage',
                      translationKey: null,
                      customLabel: null,
                      legacyValue: label.storageType,
                      sortOrder: 0,
                      appliesToAll: false,
                    },
                    language,
                  )
                : getStorageLabel(label.storageType, language)}
            </Text>
            <Text style={styles.due}>
              {copy.useByValue(formatConfiguredDateTime(label.useByAt, settings))}
            </Text>
            <Text style={styles.staff}>{copy.madeBy(label.staffName)}</Text>
            <View style={styles.cardActions}>
              <BigButton
                label={copy.used}
                onPress={() => void onClose(label, 'used')}
                disabled={updatingId === label.id}
                variant="secondary"
                style={styles.cardButton}
                leading={<Check color={colors.ink} size={sizes.iconSm} strokeWidth={2} />}
              />
              <BigButton
                label={copy.thrownAway}
                onPress={() => void onClose(label, 'thrown_away')}
                disabled={updatingId === label.id}
                variant="danger"
                style={styles.cardButton}
                leading={<Trash2 color={colors.background} size={sizes.iconSm} strokeWidth={2} />}
              />
            </View>
          </ListRow>
        ))}
      </ScrollView>
    </View>
  );
}

const toneStyles = {
  danger: StyleSheet.create({
    header: { backgroundColor: colors.dangerSoft },
    title: { color: colors.dangerDark },
    count: { backgroundColor: colors.danger, color: colors.background },
    card: { borderLeftColor: colors.danger },
  }),
  today: StyleSheet.create({
    header: { backgroundColor: colors.todaySoft },
    title: { color: colors.warning },
    count: { backgroundColor: colors.today, color: colors.ink },
    card: { borderLeftColor: colors.today },
  }),
  upcoming: StyleSheet.create({
    header: { backgroundColor: colors.accentSoft },
    title: { color: colors.warning },
    count: { backgroundColor: colors.accent, color: colors.ink },
    card: { borderLeftColor: colors.accent },
  }),
};

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.xxl, gap: spacing.lg, backgroundColor: colors.background },
  refresh: { width: 160, minHeight: sizes.tapMin },
  columns: { flex: 1, flexDirection: 'row', gap: spacing.md, minHeight: 0 },
  section: {
    ...cardStyle,
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  sectionHeader: {
    minHeight: sizes.control,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  count: {
    ...typography.bodyStrong,
    minWidth: 36,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    textAlign: 'center',
  },
  list: { padding: spacing.sm, gap: spacing.sm, flexGrow: 1 },
  card: {
    alignItems: 'stretch',
    borderLeftWidth: 6,
    borderRadius: radii.md,
  },
  itemName: { ...typography.h2, marginTop: spacing.sm, color: colors.ink },
  meta: { ...typography.caption, marginTop: spacing.xxs, color: colors.muted },
  due: { ...typography.h3, marginTop: spacing.sm, color: colors.ink },
  staff: { ...typography.caption, marginTop: spacing.xxs, color: colors.muted },
  cardActions: { marginTop: spacing.sm, flexDirection: 'row', gap: spacing.xs },
  cardButton: { flex: 1, minHeight: sizes.tapMin, paddingHorizontal: spacing.xs, paddingVertical: spacing.xs },
  empty: { flex: 1, minHeight: 180, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl },
  emptyShapes: { transform: [{ scale: 0.42 }], marginVertical: -48 },
  emptyText: { ...typography.bodyStrong, color: colors.muted, textAlign: 'center' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { ...typography.h3, color: colors.ink },
  error: {
    ...typography.bodyStrong,
    padding: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.dangerSoft,
    color: colors.dangerDark,
  },
});
