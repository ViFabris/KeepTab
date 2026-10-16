import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { fromByteArray } from 'base64-js';

import { BigButton } from '../components/BigButton';
import { BitmapLabelPreview } from '../components/BitmapLabelPreview';
import { getLabelOptions } from '../database/optionsRepository';
import { useLanguage } from '../i18n/LanguageContext';
import { bytesToHex } from '../printing/PrinterProfile';
import type { PreparedPrintJob } from '../printing/EscPosPrinter';
import { MockPrinter } from '../printing/MockPrinter';
import { colors, spacing, typography } from '../theme';
import type { LabelOption, PrintableLabel } from '../types';
import { getAppNow } from '../utils/appClock';
import { addHours } from '../utils/dates';
import { useSettings } from './SettingsContext';

export function PrintingDebugPanel() {
  const db = useSQLiteContext();
  const { settings } = useSettings();
  const { copy } = useLanguage();
  const [prepared, setPrepared] = useState<PreparedPrintJob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const printer = useMemo(() => new MockPrinter(db, settings, () => getAppNow(settings)), [db, settings]);

  async function testPrint() {
    setBusy(true);
    setError('');
    try {
      const [forms, storage] = await Promise.all([getLabelOptions(db, 'form'), getLabelOptions(db, 'storage')]);
      const formOption = forms[0];
      const storageOption = storage[0];
      if (!formOption || !storageOption) throw new Error('OPTIONS_NOT_CONFIGURED');
      const label = createTestLabel(copy.setup.sampleItem, copy.setup.samplePerson, settings, formOption, storageOption);
      const job = await printer.prepare(label, { formOption, storageOption });
      setPrepared(job);
      await printer.printPrepared(label, job);
    } catch {
      setError(copy.printFailed);
    } finally {
      setBusy(false);
    }
  }

  async function exportBytes() {
    if (!prepared || !FileSystem.cacheDirectory) return;
    setError('');
    try {
      const uri = `${FileSystem.cacheDirectory}keeptab-print-${Date.now()}.bin`;
      await FileSystem.writeAsStringAsync(uri, fromByteArray(prepared.bytes), {
        encoding: FileSystem.EncodingType.Base64,
      });
      if (!(await Sharing.isAvailableAsync())) throw new Error('SHARING_UNAVAILABLE');
      await Sharing.shareAsync(uri, { mimeType: 'application/octet-stream', dialogTitle: copy.settings.exportBytes });
    } catch {
      setError(copy.settings.exportError);
    }
  }

  return (
    <View style={styles.content}>
      <View style={styles.actions}>
        <BigButton disabled={busy} label={busy ? copy.printing : copy.settings.testPrint} onPress={() => void testPrint()} style={styles.button} />
        <BigButton disabled={!prepared || busy} label={copy.settings.exportBytes} onPress={() => void exportBytes()} style={styles.button} variant="secondary" />
      </View>
      {busy ? <View style={styles.busy}><ActivityIndicator color={colors.primary} /><Text style={styles.busyText}>{copy.preparingPrintImage}</Text></View> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {prepared ? (
        <>
          <BitmapLabelPreview bitmap={prepared.bitmap} compact />
          <View style={styles.stats}>
            <Text style={styles.stat}>{copy.settings.imageSizeDots}: {prepared.bitmap.width} × {prepared.bitmap.height}</Text>
            <Text style={styles.stat}>{copy.settings.totalBytes}: {prepared.bytes.length}</Text>
            <Text style={styles.stat}>{copy.settings.first64Bytes}: {bytesToHex(prepared.bytes.slice(0, 64))}</Text>
          </View>
        </>
      ) : null}
    </View>
  );
}

function createTestLabel(itemName: string, staffName: string, settings: ReturnType<typeof useSettings>['settings'], formOption: LabelOption, storageOption: LabelOption): PrintableLabel {
  const madeAt = getAppNow(settings);
  return {
    itemId: 'test-label', itemName, form: formOption.legacyValue, formOptionId: formOption.id,
    storageType: storageOption.legacyValue, storageOptionId: storageOption.id,
    madeAt: madeAt.toISOString(), useByAt: addHours(madeAt, 24).toISOString(), staffId: 0,
    staffName, labelWidthMm: settings.labelWidthMm, labelHeightMm: settings.labelHeightMm, testOnly: true,
  };
}

const styles = StyleSheet.create({
  content: { flex: 1, gap: spacing.md, alignItems: 'center', justifyContent: 'center', padding: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.md },
  button: { minWidth: 220 },
  busy: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  busyText: { ...typography.body, color: colors.muted },
  error: { ...typography.bodyStrong, color: colors.dangerDark },
  stats: { width: '100%', gap: spacing.xs },
  stat: { ...typography.caption, color: colors.ink },
});
