import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { BigButton } from '../components/BigButton';
import { PageHeader } from '../components/PageHeader';
import { getTodayLabelGroups, updateLabelStatus } from '../database/labelsRepository';
import { getLabelOptions } from '../database/optionsRepository';
import { getFormLabel, getItemName, getLabelOptionName, getStorageLabel } from '../i18n';
import { useLanguage } from '../i18n/LanguageContext';
import { useSettings } from '../settings/SettingsContext';
import { colors } from '../theme';
import type { LabelOption, SavedLabel, TodayLabelGroups } from '../types';
import { formatConfiguredDateTime } from '../utils/dates';

const EMPTY_GROUPS: TodayLabelGroups = { overdue: [], today: [], nextThreeDays: [] };

interface TodayScreenProps {
  refreshKey: number;
}

export function TodayScreen({ refreshKey }: TodayScreenProps) {
  const db = useSQLiteContext();
  const { copy } = useLanguage();
  const [options, setOptions] = useState<LabelOption[]>([]);
  const [groups, setGroups] = useState<TodayLabelGroups>(EMPTY_GROUPS);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const loadLabels = useCallback(async () => {
    setError('');
    try {
      const [nextGroups, nextOptions] = await Promise.all([
        getTodayLabelGroups(db),
        getLabelOptions(db, undefined, true),
      ]);
      setGroups(nextGroups);
      setOptions(nextOptions);
    } catch {
      setError(copy.labelsLoadError);
    } finally {
      setLoading(false);
    }
  }, [copy.labelsLoadError, db]);

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
  return (
    <View style={styles.section}>
      <View style={[styles.sectionHeader, toneStyles[tone].header]}>
        <Text style={[styles.sectionTitle, toneStyles[tone].title]}>{title}</Text>
        <Text style={[styles.count, toneStyles[tone].count]}>{labels.length}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {labels.length === 0 ? <Text style={styles.empty}>{copy.nothingHere}</Text> : null}
        {labels.map((label) => (
          <View key={label.id} style={[styles.card, toneStyles[tone].card]}>
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
              />
              <BigButton
                label={copy.thrownAway}
                onPress={() => void onClose(label, 'thrown_away')}
                disabled={updatingId === label.id}
                variant="danger"
                style={styles.cardButton}
              />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const toneStyles = {
  danger: StyleSheet.create({
    header: { backgroundColor: colors.dangerSoft },
    title: { color: colors.dangerDark },
    count: { backgroundColor: colors.danger, color: '#ffffff' },
    card: { borderLeftColor: colors.danger },
  }),
  today: StyleSheet.create({
    header: { backgroundColor: colors.todaySoft },
    title: { color: '#754000' },
    count: { backgroundColor: colors.today, color: '#ffffff' },
    card: { borderLeftColor: colors.today },
  }),
  upcoming: StyleSheet.create({
    header: { backgroundColor: colors.upcomingSoft },
    title: { color: colors.upcoming },
    count: { backgroundColor: colors.upcoming, color: '#ffffff' },
    card: { borderLeftColor: colors.upcoming },
  }),
};

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 28, gap: 18 },
  refresh: { width: 150, minHeight: 58 },
  columns: { flex: 1, flexDirection: 'row', gap: 14, minHeight: 0 },
  section: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  sectionHeader: {
    minHeight: 64,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionTitle: { flex: 1, fontSize: 18, fontWeight: '900' },
  count: {
    minWidth: 34,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 17,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '900',
  },
  list: { padding: 12, gap: 12 },
  card: {
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 6,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  itemName: { color: colors.ink, fontSize: 23, fontWeight: '900' },
  meta: { marginTop: 2, color: colors.muted, fontSize: 16, fontWeight: '600' },
  due: { marginTop: 11, color: colors.ink, fontSize: 17, fontWeight: '800' },
  staff: { marginTop: 3, color: colors.muted, fontSize: 15 },
  cardActions: { marginTop: 13, flexDirection: 'row', gap: 8 },
  cardButton: { flex: 1, minHeight: 56, paddingHorizontal: 8, paddingVertical: 8 },
  empty: { paddingVertical: 28, color: colors.muted, fontSize: 17, textAlign: 'center' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { color: colors.ink, fontSize: 20, fontWeight: '700' },
  error: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.dangerSoft,
    color: colors.dangerDark,
    fontSize: 17,
    fontWeight: '700',
  },
});
