import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArchiveX, ArrowLeft, PackagePlus } from 'lucide-react-native';

import { BigButton } from '../components/BigButton';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { useLanguage } from '../i18n/LanguageContext';
import { useSettings } from '../settings/SettingsContext';
import { colors, sizes, spacing, typography } from '../theme';
import type { AppSettings, PackageEvidence } from '../types';
import { zonedDateTimeToInstant } from '../utils/appClock';
import { formatConfiguredDate, formatConfiguredDateTime } from '../utils/dates';
import { getRecommendedBatchId, isPackageBatchExpired } from './batchSelection';

export function PackageBatchSelector({
  batches,
  selectedIds,
  today,
  loading,
  busy,
  message,
  messageIsError,
  onToggle,
  onAdd,
  onMarkUsedUp,
  onContinue,
  onBack,
}: {
  batches: PackageEvidence[];
  selectedIds: number[];
  today: string;
  loading: boolean;
  busy: boolean;
  message: string;
  messageIsError: boolean;
  onToggle: (batch: PackageEvidence) => void;
  onAdd: () => void;
  onMarkUsedUp: (batch: PackageEvidence) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const { copy } = useLanguage();
  const { settings } = useSettings();
  const recommendedId = getRecommendedBatchId(batches, today);

  return (
    <View style={styles.screen}>
      <PageHeader title={copy.foodSafety.batchSelectionTitle} subtitle={copy.foodSafety.batchSelectionHint} />
      {message ? <Text style={[styles.message, messageIsError && styles.errorMessage]}>{message}</Text> : null}
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {!batches.length ? (
            <Card style={styles.empty}>
              <PackagePlus color={colors.secondary} size={sizes.iconXl} strokeWidth={2} />
              <Text style={styles.emptyText}>{copy.foodSafety.noActiveBatches}</Text>
            </Card>
          ) : null}
          {batches.map((batch) => {
            const expired = isPackageBatchExpired(batch, today);
            const selected = selectedIds.includes(batch.id);
            const lot = batch.lotCode || `#${batch.id}`;
            return (
              <Card key={batch.id} style={styles.batchCard}>
                <View style={styles.batchDetails}>
                  <View style={styles.badges}>
                    <StatusBadge
                      label={expired
                        ? copy.foodSafety.batchExpired
                        : batch.status === 'open'
                          ? copy.foodSafety.batchOpen
                          : copy.foodSafety.batchSealed}
                      tone={expired ? 'danger' : batch.status === 'open' ? 'warning' : 'fine'}
                    />
                    {!expired && batch.id === recommendedId ? (
                      <StatusBadge label={copy.foodSafety.batchUseFirst} tone="warning" />
                    ) : null}
                  </View>
                  <Text style={styles.lot}>{copy.foodSafety.lotCode}: {lot}</Text>
                  <Text style={styles.meta}>
                    {copy.foodSafety.packageExpiry}: {formatPackageDate(batch.packageExpiryDate, settings)}
                  </Text>
                  {batch.openedAt ? (
                    <Text style={styles.meta}>
                      {copy.foodSafety.openedAt}: {formatConfiguredDateTime(batch.openedAt, settings)}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.actions}>
                  <BigButton
                    disabled={expired || busy}
                    label={selected ? copy.foodSafety.batchSelectedCount(1) : `${copy.foodSafety.lotCode} ${lot}`}
                    onPress={() => onToggle(batch)}
                    selected={selected}
                    variant="choice"
                    style={styles.selectButton}
                  />
                  <BigButton
                    disabled={busy}
                    label={copy.foodSafety.markBatchUsedUp}
                    onPress={() => onMarkUsedUp(batch)}
                    variant="danger"
                    style={styles.closeButton}
                    leading={<ArchiveX color={colors.background} size={sizes.iconMd} strokeWidth={2} />}
                  />
                </View>
              </Card>
            );
          })}
          <BigButton
            disabled={busy}
            label={copy.foodSafety.addBatch}
            onPress={onAdd}
            variant="secondary"
            leading={<PackagePlus color={colors.ink} size={sizes.iconMd} strokeWidth={2} />}
          />
          {selectedIds.length > 1 ? (
            <Text style={styles.combined}>{copy.foodSafety.combinedBatches}</Text>
          ) : null}
        </ScrollView>
      )}
      <View style={styles.footer}>
        <BigButton
          label={copy.back}
          onPress={onBack}
          variant="secondary"
          style={styles.back}
          leading={<ArrowLeft color={colors.ink} size={sizes.iconMd} strokeWidth={2} />}
        />
        <BigButton
          disabled={!selectedIds.length || busy}
          label={`${copy.foodSafety.continueWithBatches} · ${copy.foodSafety.batchSelectedCount(selectedIds.length)}`}
          onPress={onContinue}
          style={styles.continue}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, gap: spacing.lg, padding: spacing.xxl, backgroundColor: colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { gap: spacing.md, paddingBottom: spacing.lg },
  empty: { alignItems: 'center', gap: spacing.md, padding: spacing.xxl },
  emptyText: { ...typography.body, maxWidth: 680, textAlign: 'center', color: colors.muted },
  batchCard: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.lg, padding: spacing.md },
  batchDetails: { flex: 1, justifyContent: 'center', gap: spacing.xs },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  lot: { ...typography.h3, color: colors.ink },
  meta: { ...typography.body, color: colors.muted },
  actions: { width: 330, gap: spacing.sm },
  selectButton: { flex: 1 },
  closeButton: { minHeight: sizes.tapMin },
  combined: { ...typography.bodyStrong, color: colors.warning },
  message: { ...typography.bodyStrong, color: colors.primaryDark },
  errorMessage: { color: colors.dangerDark },
  footer: { flexDirection: 'row', gap: spacing.md },
  back: { width: 180 },
  continue: { flex: 1 },
});

function formatPackageDate(value: string, settings: AppSettings): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const instant = zonedDateTimeToInstant({
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: 12,
    minute: 0,
    second: 0,
  }, settings.timeZone);
  return instant ? formatConfiguredDate(instant, settings) : value;
}
