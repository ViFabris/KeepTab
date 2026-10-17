import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { BigButton } from '../components/BigButton';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { OptionChip } from '../components/OptionChip';
import { StatusBadge } from '../components/StatusBadge';
import { getItems, importItemRows, setItemVerification, updateItemSafety } from '../database/itemsRepository';
import { parseItemsCsv, type ItemsCsvImportReport } from '../import/itemsCsv';
import { useLanguage } from '../i18n/LanguageContext';
import { colors, sizes, spacing, typography } from '../theme';
import type { KitchenItem, PlantBasedType, VerificationStatus } from '../types';

interface ItemDraft {
  plantBasedType: PlantBasedType;
  heatTreated: boolean;
  manufacturerDays: string;
  source: string;
}

export function ItemAdminPanel() {
  const db = useSQLiteContext();
  const { copy } = useLanguage();
  const [items, setItems] = useState<KitchenItem[]>([]);
  const [filter, setFilter] = useState<VerificationStatus>('unverified');
  const [drafts, setDrafts] = useState<Record<string, ItemDraft>>({});
  const [reviewer, setReviewer] = useState('');
  const [reviewDate, setReviewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [csv, setCsv] = useState('');
  const [report, setReport] = useState<ItemsCsvImportReport | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const loaded = await getItems(db);
    setItems(loaded);
    setDrafts(Object.fromEntries(loaded.map((item) => [item.id, {
      plantBasedType: item.plantBasedType,
      heatTreated: item.heatTreated,
      manufacturerDays: item.manufacturerDaysAfterOpen ? String(item.manufacturerDaysAfterOpen) : '',
      source: item.source,
    }])));
  }, [db]);

  useEffect(() => { void load().catch(() => setError(copy.settings.settingsError)); }, [copy.settings.settingsError, load]);

  async function saveItem(item: KitchenItem) {
    const draft = drafts[item.id];
    if (!draft) return;
    setError('');
    try {
      const days = draft.manufacturerDays ? Number(draft.manufacturerDays) : null;
      await updateItemSafety(db, item.id, {
        plantBasedType: draft.plantBasedType,
        heatTreated: draft.heatTreated,
        manufacturerDaysAfterOpen: days && Number.isInteger(days) && days > 0 ? days : null,
        source: draft.source,
      });
      await load();
    } catch {
      setError(copy.settings.settingsError);
    }
  }

  async function verify(item: KitchenItem) {
    setError('');
    try {
      await setItemVerification(db, item.id, {
        status: 'verified',
        reviewer,
        reviewedOn: reviewDate,
      });
      await load();
    } catch {
      setError(copy.settings.settingsError);
    }
  }

  async function revert(item: KitchenItem) {
    setError('');
    try {
      await setItemVerification(db, item.id, { status: 'unverified' });
      await load();
    } catch {
      setError(copy.settings.settingsError);
    }
  }

  async function importCsv() {
    const nextReport = parseItemsCsv(csv);
    setReport(nextReport);
    if (!nextReport.accepted.length) return;
    try {
      await importItemRows(db, nextReport.accepted);
      await load();
    } catch {
      setError(copy.settings.settingsError);
    }
  }

  const filtered = items.filter((item) => item.verificationStatus === filter);
  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Card style={styles.importCard}>
        <Text style={styles.title}>{copy.foodSafety.importCsv}</Text>
        <Input
          accessibilityLabel={copy.foodSafety.csvInputHint}
          multiline
          numberOfLines={4}
          onChangeText={setCsv}
          placeholder={copy.foodSafety.csvInputHint}
          style={styles.csvInput}
          value={csv}
        />
        <BigButton label={copy.foodSafety.importCsv} onPress={() => void importCsv()} />
        {report ? (
          <View style={styles.report}>
            <Text style={styles.body}>{copy.foodSafety.importReport(report.accepted.length, report.rejected.length)}</Text>
            {report.rejected.map((rejection) => (
              <Text key={`${rejection.rowNumber}-${rejection.reason}`} style={styles.error}>
                {copy.foodSafety.rejectedRow(
                  rejection.rowNumber,
                  copy.foodSafety.importReasons[rejection.reason] ?? rejection.reason,
                )}
              </Text>
            ))}
          </View>
        ) : null}
      </Card>
      <View style={styles.filters}>
        {(['unverified', 'verified'] as VerificationStatus[]).map((status) => (
          <OptionChip
            key={status}
            label={status === 'verified' ? copy.foodSafety.verified : copy.foodSafety.unverified}
            onPress={() => setFilter(status)}
            selected={filter === status}
            style={styles.filter}
          />
        ))}
      </View>
      <View style={styles.reviewRow}>
        <Input label={copy.foodSafety.reviewerName} onChangeText={setReviewer} value={reviewer} containerStyle={styles.flex} />
        <Input label={copy.foodSafety.reviewDate} onChangeText={setReviewDate} value={reviewDate} containerStyle={styles.flex} />
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {filtered.map((item) => {
          const draft = drafts[item.id];
          if (!draft) return null;
          return (
            <Card key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeading}>
                <Text style={styles.itemName}>{item.name}</Text>
                <StatusBadge
                  label={item.verificationStatus === 'verified' ? copy.foodSafety.verified : copy.foodSafety.unverified}
                  tone={item.verificationStatus === 'verified' ? 'fine' : 'warning'}
                />
              </View>
              {item.verifiedBy ? <Text style={styles.body}>{copy.foodSafety.reviewedBy}: {item.verifiedBy} · {item.verifiedOn}</Text> : null}
              <Text style={styles.label}>{copy.foodSafety.plantBasedType}</Text>
              <View style={styles.choices}>
                {(['none', 'drink', 'food'] as PlantBasedType[]).map((value) => (
                  <OptionChip
                    key={value}
                    label={value === 'none' ? copy.foodSafety.plantNone : value === 'drink' ? copy.foodSafety.plantDrink : copy.foodSafety.plantFood}
                    onPress={() => setDrafts((current) => ({ ...current, [item.id]: { ...draft, plantBasedType: value } }))}
                    selected={draft.plantBasedType === value}
                    style={styles.choice}
                  />
                ))}
              </View>
              <Text style={styles.label}>{copy.foodSafety.heatTreated}</Text>
              <View style={styles.choices}>
                <OptionChip label={copy.foodSafety.no} onPress={() => setDrafts((current) => ({ ...current, [item.id]: { ...draft, heatTreated: false } }))} selected={!draft.heatTreated} style={styles.choice} />
                <OptionChip label={copy.foodSafety.yes} onPress={() => setDrafts((current) => ({ ...current, [item.id]: { ...draft, heatTreated: true } }))} selected={draft.heatTreated} style={styles.choice} />
              </View>
              <View style={styles.reviewRow}>
                <Input keyboardType="number-pad" label={copy.foodSafety.manufacturerDays} onChangeText={(value) => setDrafts((current) => ({ ...current, [item.id]: { ...draft, manufacturerDays: value.replace(/\D/g, '') } }))} value={draft.manufacturerDays} containerStyle={styles.flex} />
                <Input label={copy.foodSafety.source} onChangeText={(value) => setDrafts((current) => ({ ...current, [item.id]: { ...draft, source: value } }))} value={draft.source} containerStyle={styles.flex} />
              </View>
              <View style={styles.actions}>
                <BigButton label={copy.settings.save} onPress={() => void saveItem(item)} variant="secondary" style={styles.flex} />
                {item.verificationStatus === 'verified' ? (
                  <BigButton label={copy.foodSafety.revertUnverified} onPress={() => void revert(item)} variant="danger" style={styles.flex} />
                ) : (
                  <BigButton label={copy.foodSafety.markVerified} onPress={() => void verify(item)} disabled={!reviewer.trim() || !reviewDate.trim()} style={styles.flex} />
                )}
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0, gap: spacing.md },
  importCard: { gap: spacing.sm, padding: spacing.md },
  title: { ...typography.h3, color: colors.ink },
  body: { ...typography.caption, color: colors.muted },
  label: { ...typography.bodyStrong, color: colors.ink },
  csvInput: { minHeight: sizes.control * 2, textAlignVertical: 'top' },
  report: { gap: spacing.xxs },
  error: { ...typography.caption, color: colors.dangerDark },
  filters: { flexDirection: 'row', gap: spacing.sm },
  filter: { minWidth: sizes.control * 3 },
  reviewRow: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  list: { gap: spacing.md, paddingBottom: spacing.xl },
  itemCard: { gap: spacing.sm, padding: spacing.md },
  itemHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemName: { ...typography.h3, flex: 1, color: colors.ink },
  choices: { flexDirection: 'row', gap: spacing.xs },
  choice: { flex: 1, minHeight: sizes.tapMin },
  actions: { flexDirection: 'row', gap: spacing.sm },
});
