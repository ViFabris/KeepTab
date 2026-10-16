import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { BigButton } from '../components/BigButton';
import { BrandShapes } from '../components/BrandShapes';
import { Card } from '../components/Card';
import { Logo } from '../components/Logo';
import { PageHeader } from '../components/PageHeader';
import { StepProgress } from '../components/StepProgress';
import { getLabelOptions } from '../database/optionsRepository';
import { useLanguage } from '../i18n/LanguageContext';
import { MockPrinter } from '../printing/MockPrinter';
import { findNearestLabelTemplate, type LabelTemplate } from '../printing/labelTemplates';
import { DateTimeEditor } from '../settings/DateTimeEditor';
import { LabelSizeEditor } from '../settings/LabelSizeEditor';
import { OptionManager } from '../settings/OptionManager';
import { PinInput } from '../settings/PinInput';
import { isValidPin, saveAdminPin } from '../settings/pin';
import { PreferencesEditor } from '../settings/PreferencesEditor';
import { useSettings } from '../settings/SettingsContext';
import { TestPrintPanel } from '../settings/TestPrintPanel';
import { colors, radii, sizes, spacing, typography } from '../theme';
import type { AppSettings } from '../types';
import { createClockDraft, parseClockDraft, reformatClockDraft } from '../utils/appClock';
import { StaffScreen } from './StaffScreen';

const TOTAL_STEPS = 6;

export function SetupWizard() {
  const db = useSQLiteContext();
  const { copy } = useLanguage();
  const { settings, updateSettings } = useSettings();
  const [step, setStep] = useState(1);
  const [sizeDraft, setSizeDraft] = useState<LabelTemplate>(() =>
    findNearestLabelTemplate(settings.labelWidthMm, settings.labelHeightMm),
  );
  const [clockDraft, setClockDraft] = useState(() => createClockDraft(settings));
  const [pendingClockPatch, setPendingClockPatch] = useState<Pick<
    AppSettings,
    'clockOffsetMs' | 'timeZone'
  > | null>(null);
  const [staffCount, setStaffCount] = useState(0);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const printer = useMemo(() => new MockPrinter(db), [db]);

  function continueFromWelcome() {
    const patch = parseClockDraft(clockDraft, settings);
    if (!patch) {
      setError(copy.setup.clockValidation);
      return;
    }
    setPendingClockPatch(patch);
    setError('');
    setStep(2);
  }

  async function saveSizeAndContinue() {
    setBusy(true);
    setError('');
    try {
      await updateSettings({ labelWidthMm: sizeDraft.widthMm, labelHeightMm: sizeDraft.heightMm });
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
    const clockPatch = pendingClockPatch ?? parseClockDraft(clockDraft, settings);
    if (!clockPatch) {
      setError(copy.setup.clockValidation);
      setStep(1);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await saveAdminPin(db, pin);
      await updateSettings(clockPatch);
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
        <Logo size="small" />
        <StepProgress
          current={step}
          total={TOTAL_STEPS}
          label={copy.setup.step(step, TOTAL_STEPS)}
        />
      </View>
      <Card style={styles.card}>
        {step === 1 ? (
          <WizardPage title={copy.setup.languageDateTitle} hint={copy.setup.languageDateHint}>
            <View style={styles.welcomeLayout}>
              <View style={styles.welcomeBrand}>
                <Logo size="large" tagline={copy.appTagline} />
                <BrandShapes style={styles.brandShapes} />
              </View>
              <ScrollView style={styles.welcomeSettings} contentContainerStyle={styles.scrollContent}>
                <PreferencesEditor
                  settings={settings}
                  applyLanguageDefaults
                  onChange={(patch) => {
                    setClockDraft((draft) =>
                      reformatClockDraft(draft, settings, { ...settings, ...patch }),
                    );
                    void updateSettings(patch);
                  }}
                />
                <DateTimeEditor
                  deferredUntilPin
                  settings={settings}
                  value={clockDraft}
                  onChange={(value) => {
                    setClockDraft(value);
                    setError('');
                  }}
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
              </ScrollView>
            </View>
            <BigButton label={copy.setup.next} onPress={continueFromWelcome} />
          </WizardPage>
        ) : null}

        {step === 2 ? (
          <WizardPage title={copy.setup.sizeTitle} hint={copy.setup.sizeHint}>
            <LabelSizeEditor
              value={sizeDraft}
              onChange={setSizeDraft}
              printerMaximumWidth={printer.maxPrintableWidthMm}
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
      </Card>
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
  screen: { flex: 1, padding: spacing.xl, backgroundColor: colors.background },
  topBar: {
    minHeight: sizes.control,
    flexShrink: 0,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  card: {
    flex: 1,
    minHeight: 0,
    padding: spacing.xl,
  },
  page: { flex: 1, gap: spacing.md },
  welcomeLayout: { flex: 1, flexDirection: 'row', gap: spacing.xxl, minHeight: 0 },
  welcomeBrand: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
    backgroundColor: colors.secondarySoft,
  },
  brandShapes: { alignSelf: 'flex-end', marginTop: spacing.md },
  welcomeSettings: { flex: 1, minWidth: 0 },
  scrollContent: { paddingVertical: spacing.xxs },
  pinFields: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  actions: { flexDirection: 'row', gap: spacing.md },
  back: { width: sizes.control * 3 },
  next: { flex: 1 },
  testActions: { flexDirection: 'row', gap: spacing.md },
  changeSize: { flex: 1 },
  finish: { flex: 1 },
  error: { ...typography.bodyStrong, color: colors.dangerDark },
});
