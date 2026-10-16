import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { BigButton } from '../components/BigButton';
import { LabelPreview } from '../components/LabelPreview';
import { getLabelOptions } from '../database/optionsRepository';
import { useLanguage } from '../i18n/LanguageContext';
import { MockPrinter } from '../printing/MockPrinter';
import { colors, spacing, typography } from '../theme';
import type { LabelOption, PrintableLabel, SavedLabel, ShelfLife } from '../types';
import { getAppNow } from '../utils/appClock';
import { addHours } from '../utils/dates';
import { useSettings } from './SettingsContext';
import { TemplateVerificationPanel } from './TemplateVerificationPanel';

const TEST_SHELF_LIFE: ShelfLife = {
  hours: 24,
  isPlaceholder: true,
  sourceNote: 'PLACEHOLDER_SAMPLE_DATA',
};

export function TestPrintPanel({ autoPrint = false }: { autoPrint?: boolean }) {
  const db = useSQLiteContext();
  const { settings } = useSettings();
  const { language, copy } = useLanguage();
  const [printedLabel, setPrintedLabel] = useState<SavedLabel | null>(null);
  const [formOption, setFormOption] = useState<LabelOption>();
  const [storageOption, setStorageOption] = useState<LabelOption>();
  const [error, setError] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const printer = useMemo(
    () => new MockPrinter(db, settings, () => getAppNow(settings)),
    [db, settings],
  );

  const printTest = useCallback(async () => {
    setError('');
    try {
      const [forms, storage] = await Promise.all([
        getLabelOptions(db, 'form'),
        getLabelOptions(db, 'storage'),
      ]);
      const selectedForm = forms[0];
      const selectedStorage = storage[0];
      if (!selectedForm || !selectedStorage) {
        setError(copy.setup.optionRequired);
        return;
      }
      setFormOption(selectedForm);
      setStorageOption(selectedStorage);
      const madeAt = getAppNow(settings);
      const label: PrintableLabel = {
        itemId: 'test-label',
        itemName: copy.setup.sampleItem,
        form: selectedForm.legacyValue,
        formOptionId: selectedForm.id,
        storageType: selectedStorage.legacyValue,
        storageOptionId: selectedStorage.id,
        madeAt: madeAt.toISOString(),
        useByAt: addHours(madeAt, TEST_SHELF_LIFE.hours).toISOString(),
        staffId: 0,
        staffName: copy.setup.samplePerson,
        labelWidthMm: settings.labelWidthMm,
        labelHeightMm: settings.labelHeightMm,
        testOnly: true,
      };
      setPrintedLabel(await printer.print(label, { formOption: selectedForm, storageOption: selectedStorage }));
    } catch {
      setError(copy.genericError);
    }
  }, [copy, db, printer, settings]);

  useEffect(() => {
    if (autoPrint) void printTest();
  }, [autoPrint, printTest]);

  return (
    <View style={styles.container}>
      {!autoPrint && showVerification ? (
        <>
          <BigButton
            label={copy.labelSizes.closeVerification}
            onPress={() => setShowVerification(false)}
            style={styles.printButton}
            variant="secondary"
          />
          <TemplateVerificationPanel />
        </>
      ) : null}
      {!showVerification ? (
        <>
          {!autoPrint ? (
            <View style={styles.actions}>
              <BigButton
                label={copy.settings.testPrint}
                onPress={() => void printTest()}
                style={styles.printButton}
              />
              <BigButton
                label={copy.labelSizes.openVerification}
                onPress={() => setShowVerification(true)}
                style={styles.printButton}
                variant="secondary"
              />
            </View>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {printedLabel ? (
            <LabelPreview
              label={printedLabel}
              shelfLife={TEST_SHELF_LIFE}
              formOption={formOption}
              storageOption={storageOption}
              compact
            />
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.md },
  printButton: { minWidth: 260 },
  error: { ...typography.bodyStrong, color: colors.dangerDark },
});
