import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { BigButton } from '../components/BigButton';
import { PageHeader } from '../components/PageHeader';
import { getLabelOptions } from '../database/optionsRepository';
import { useLanguage } from '../i18n/LanguageContext';
import { MockPrinter } from '../printing/MockPrinter';
import { LabelSizeEditor, parseLabelSize, type LabelSizeDraft } from '../settings/LabelSizeEditor';
import { OptionManager } from '../settings/OptionManager';
import { PinInput } from '../settings/PinInput';
import { isValidPin, saveAdminPin } from '../settings/pin';
import { PreferencesEditor } from '../settings/PreferencesEditor';
import { useSettings } from '../settings/SettingsContext';
import { TestPrintPanel } from '../settings/TestPrintPanel';
import { colors } from '../theme';
import { StaffScreen } from './StaffScreen';

const TOTAL_STEPS = 6;

export function SetupWizard() {
  const db = useSQLiteContext();
  const { copy } = useLanguage();
  const { settings, updateSettings } = useSettings();
  const [step, setStep] = useState(1);
  const [sizeDraft, setSizeDraft] = useState<LabelSizeDraft>({
    width: String(settings.labelWidthMm),
    height: String(settings.labelHeightMm),
  });
  const [showSizeValidation, setShowSizeValidation] = useState(false);
  const [staffCount, setStaffCount] = useState(0);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const printer = useMemo(() => new MockPrinter(db), [db]);

  async function saveSizeAndContinue() {
    const parsed = parseLabelSize(sizeDraft);
    if (!parsed) {
      setShowSizeValidation(true);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await updateSettings({ labelWidthMm: parsed.width, labelHeightMm: parsed.height });
      setStep(3);
    } catch {
      setError(copy.settings.settingsError);
    } finally {
      setBusy(false);
    }
  }

  async function savePinAndContinue() {
    if (!isValidPin(pin)) {
      setError(copy.setup.pinLengthError);
      return;
    }
    if (pin !== confirmPin) {
      setError(copy.setup.pinMismatchError);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await saveAdminPin(db, pin);
      setStep(5);
    } catch {
      setError(copy.genericError);
    } finally {
      setBusy(false);
    }
  }

  async function continueFromOptions() {
    const [storage, forms] = await Promise.all([
      getLabelOptions(db, 'storage'),
      getLabelOptions(db, 'form'),
    ]);
    if (!storage.length || !forms.length) {
      setError(copy.setup.optionRequired);
      return;
    }
    setError('');
    setStep(6);
  }

  async function finish() {
    setBusy(true);
    setError('');
    try {
      await updateSettings({ setupComplete: true });
    } catch {
      setError(copy.setup.finishError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>KeepTab</Text>
        <Text style={styles.progress}>{copy.setup.step(step, TOTAL_STEPS)}</Text>
      </View>
      <View style={styles.card}>
        {step === 1 ? (
          <WizardPage title={copy.setup.languageDateTitle} hint={copy.setup.languageDateHint}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <PreferencesEditor
                settings={settings}
                applyLanguageDefaults
                onChange={(patch) => void updateSettings(patch)}
              />
            </ScrollView>
            <BigButton label={copy.setup.next} onPress={() => setStep(2)} />
          </WizardPage>
        ) : null}

        {step === 2 ? (
          <WizardPage title={copy.setup.sizeTitle} hint={copy.setup.sizeHint}>
            <LabelSizeEditor
              value={sizeDraft}
              onChange={setSizeDraft}
              printerMaximumWidth={printer.maxWidthMm}
              showValidation={showSizeValidation}
            />
            <WizardActions
              onBack={() => setStep(1)}
              onNext={() => void saveSizeAndContinue()}
              nextLabel={copy.setup.next}
              disabled={busy}
            />
          </WizardPage>
        ) : null}

        {step === 3 ? (
          <WizardPage title={copy.setup.peopleTitle} hint={copy.setup.peopleHint}>
            <StaffScreen embedded onStaffCountChange={setStaffCount} />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <WizardActions
              onBack={() => setStep(2)}
              onNext={() => {
                if (staffCount < 1) {
                  setError(copy.setup.personRequired);
                } else {
                  setError('');
                  setStep(4);
                }
              }}
              nextLabel={copy.setup.next}
            />
          </WizardPage>
        ) : null}

        {step === 4 ? (
          <WizardPage title={copy.setup.pinTitle} hint={copy.setup.pinHint}>
            <View style={styles.pinFields}>
              <PinInput label={copy.setup.pin} value={pin} onChange={setPin} />
              <PinInput label={copy.setup.confirmPin} value={confirmPin} onChange={setConfirmPin} />
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <WizardActions
              onBack={() => setStep(3)}
              onNext={() => void savePinAndContinue()}
              nextLabel={copy.setup.next}
              disabled={busy}
            />
          </WizardPage>
        ) : null}

        {step === 5 ? (
          <WizardPage title={copy.setup.optionsTitle} hint={copy.setup.optionsHint}>
            <OptionManager onOptionsChange={() => setError('')} />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <WizardActions
              onBack={() => setStep(4)}
              onNext={() => void continueFromOptions()}
              nextLabel={copy.setup.next}
            />
          </WizardPage>
        ) : null}

        {step === 6 ? (
          <WizardPage title={copy.setup.testTitle} hint={copy.setup.testHint}>
            <TestPrintPanel autoPrint />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.testActions}>
              <BigButton
                label={copy.setup.changeSize}
                onPress={() => setStep(2)}
                variant="secondary"
                style={styles.changeSize}
              />
              <BigButton
                label={copy.setup.looksGood}
                onPress={() => void finish()}
                disabled={busy}
                style={styles.finish}
              />
            </View>
          </WizardPage>
        ) : null}
      </View>
    </View>
  );
}

function WizardPage({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.page}>
      <PageHeader title={title} subtitle={hint} />
      {children}
    </View>
  );
}

function WizardActions({
  onBack,
  onNext,
  nextLabel,
  disabled = false,
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  disabled?: boolean;
}) {
  const { copy } = useLanguage();
  return (
    <View style={styles.actions}>
      <BigButton label={copy.back} onPress={onBack} variant="secondary" style={styles.back} />
      <BigButton label={nextLabel} onPress={onNext} disabled={disabled} style={styles.next} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 22, backgroundColor: colors.background },
  topBar: { height: 50, flexDirection: 'row', justifyContent: 'space-between' },
  brand: { color: colors.primary, fontSize: 30, fontWeight: '900' },
  progress: { color: colors.muted, fontSize: 17, fontWeight: '800' },
  card: {
    flex: 1,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  page: { flex: 1, gap: 16 },
  scrollContent: { paddingVertical: 4 },
  pinFields: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 20 },
  actions: { flexDirection: 'row', gap: 14 },
  back: { width: 170 },
  next: { flex: 1 },
  testActions: { flexDirection: 'row', gap: 14 },
  changeSize: { flex: 1 },
  finish: { flex: 1 },
  error: { color: colors.danger, fontSize: 17, fontWeight: '800' },
});
