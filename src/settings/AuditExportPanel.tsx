import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { BigButton } from '../components/BigButton';
import { Input } from '../components/Input';
import { getAuditRecords } from '../database/labelsRepository';
import { useLanguage } from '../i18n/LanguageContext';
import { colors, spacing, typography } from '../theme';

export function AuditExportPanel() {
  const db = useSQLiteContext();
  const { copy } = useLanguage();
  const [start, setStart] = useState(() => new Date(Date.now() - 90 * 86_400_000).toISOString().slice(0, 10));
  const [end, setEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);

  async function exportAudit(format: 'csv' | 'json') {
    setMessage('');
    const startDate = parseDate(start, false);
    const endDate = parseDate(end, true);
    if (!startDate || !endDate || startDate > endDate || !FileSystem.cacheDirectory) {
      setError(true);
      setMessage(copy.foodSafety.invalidDateRange);
      return;
    }
    try {
      const records = await getAuditRecords(db, startDate.toISOString(), endDate.toISOString());
      const content = format === 'json'
        ? JSON.stringify(records, null, 2)
        : toCsv(records, [
            copy.foodSafety.recordId,
            copy.itemQuestion,
            copy.formQuestion,
            copy.storageQuestion,
            copy.made,
            copy.useBy,
            copy.staffQuestion,
            copy.foodSafety.state,
            copy.foodSafety.rulesVersion,
            copy.foodSafety.verificationStatus,
            copy.foodSafety.verificationMode,
            copy.foodSafety.cappedByRule,
            copy.foodSafety.printerProfile,
            copy.foodSafety.appVersion,
            copy.foodSafety.events,
          ]);
      const uri = `${FileSystem.cacheDirectory}keeptab-audit-${start}-${end}.${format}`;
      await FileSystem.writeAsStringAsync(uri, content);
      if (!(await Sharing.isAvailableAsync())) throw new Error('SHARING_UNAVAILABLE');
      await Sharing.shareAsync(uri, {
        mimeType: format === 'json' ? 'application/json' : 'text/csv',
        dialogTitle: copy.foodSafety.auditExport,
      });
      setError(false);
      setMessage(copy.foodSafety.exportComplete);
    } catch {
      setError(true);
      setMessage(copy.settings.exportError);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputs}>
        <Input label={copy.foodSafety.exportStart} onChangeText={setStart} value={start} containerStyle={styles.flex} />
        <Input label={copy.foodSafety.exportEnd} onChangeText={setEnd} value={end} containerStyle={styles.flex} />
      </View>
      <View style={styles.actions}>
        <BigButton label={copy.foodSafety.exportCsv} onPress={() => void exportAudit('csv')} style={styles.flex} />
        <BigButton label={copy.foodSafety.exportJson} onPress={() => void exportAudit('json')} variant="secondary" style={styles.flex} />
      </View>
      {message ? <Text style={[styles.message, error && styles.error]}>{message}</Text> : null}
    </View>
  );
}

function parseDate(value: string, end: boolean): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T${end ? '23:59:59.999' : '00:00:00.000'}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toCsv(records: Awaited<ReturnType<typeof getAuditRecords>>, headers: string[]): string {
  const rows = records.map(({ label, events }) => [
    label.id,
    label.itemName,
    label.form,
    label.storageType,
    label.madeAt,
    label.useByAt,
    label.staffName,
    label.jurisdictions?.join('|') ?? '',
    label.rulesVersion ?? '',
    label.itemVerificationStatus ?? '',
    label.verificationMode ?? '',
    label.cappedByRuleId ?? '',
    JSON.stringify(label.printerProfileSnapshot ?? {}),
    label.appVersion ?? '',
    events.map((event) => `${event.eventType}:${event.occurredAt}:${event.personName}`).join('|'),
  ]);
  return [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
}

function csvCell(value: unknown): string {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', gap: spacing.lg, padding: spacing.lg },
  inputs: { flexDirection: 'row', gap: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
  message: { ...typography.bodyStrong, color: colors.primaryDark },
  error: { color: colors.dangerDark },
});
