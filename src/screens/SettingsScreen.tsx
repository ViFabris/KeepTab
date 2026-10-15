import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Languages, LockKeyhole, PackageOpen, Printer, Ruler, Users } from 'lucide-react-native';

import { BigButton } from '../components/BigButton';
import { Card } from '../components/Card';
import { OptionChip } from '../components/OptionChip';
import { PageHeader } from '../components/PageHeader';
import { useLanguage } from '../i18n/LanguageContext';
import { DateTimeEditor } from '../settings/DateTimeEditor';
import { LabelSizeEditor, parseLabelSize, type LabelSizeDraft } from '../settings/LabelSizeEditor';
import { OptionManager } from '../settings/OptionManager';
import { PinInput } from '../settings/PinInput';
import { isValidPin, saveAdminPin, verifyAdminPin } from '../settings/pin';
import { PreferencesEditor } from '../settings/PreferencesEditor';
import { useSettings } from '../settings/SettingsContext';
import { TestPrintPanel } from '../settings/TestPrintPanel';
import { MockPrinter } from '../printing/MockPrinter';
import { colors, radii, sizes, spacing, typography } from '../theme';
import { createClockDraft, reformatClockDraft } from '../utils/appClock';
import { StaffScreen } from './StaffScreen';

type SettingsSection = 'preferences' | 'size' | 'people' | 'options' | 'security' | 'test';

export function SettingsScreen({ onClose }: { onClose: () => void }) {
  const db = useSQLiteContext();
  const { copy } = useLanguage();
  const { settings, updateSettings } = useSettings();
  const [section, setSection] = useState<SettingsSection>('preferences');
  const [sizeDraft, setSizeDraft] = useState<LabelSizeDraft>({
    width: String(settings.labelWidthMm),
    height: String(settings.labelHeightMm),
  });
  const [clockDraft, setClockDraft] = useState(() => createClockDraft(settings));
  const [showSizeValidation, setShowSizeValidation] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const printer = new MockPrinter(db);

  async function saveSize() {
    const parsed = parseLabelSize(sizeDraft);
    if (!parsed) {
      setShowSizeValidation(true);
      return;
    }
    await saveChange(() =>
      updateSettings({ labelWidthMm: parsed.width, labelHeightMm: parsed.height }),
    );
  }

  async function changePin() {
    setMessage('');
    if (!(await verifyAdminPin(db, currentPin))) {
      setIsError(true);
      setMessage(copy.settings.currentPinWrong);
      return;
    }
    if (!isValidPin(newPin)) {
      setIsError(true);
      setMessage(copy.setup.pinLengthError);
      return;
    }
    if (newPin !== confirmNewPin) {
      setIsError(true);
      setMessage(copy.setup.pinMismatchError);
      return;
    }
    try {
      await saveAdminPin(db, newPin);
      setCurrentPin('');
      setNewPin('');
      setConfirmNewPin('');
      setIsError(false);
      setMessage(copy.settings.pinChanged);
    } catch {
      setIsError(true);
      setMessage(copy.settings.settingsError);
    }
  }

  async function saveChange(action: () => Promise<unknown>) {
    setMessage('');
    try {
      await action();
      setIsError(false);
      setMessage(copy.settings.saved);
    } catch {
      setIsError(true);
      setMessage(copy.settings.settingsError);
    }
  }

  const sections = [
    { id: 'preferences' as const, label: copy.settings.preferences, icon: Languages },
    { id: 'size' as const, label: copy.settings.labelSize, icon: Ruler },
    { id: 'people' as const, label: copy.settings.people, icon: Users },
    { id: 'options' as const, label: copy.settings.options, icon: PackageOpen },
    { id: 'security' as const, label: copy.settings.security, icon: LockKeyhole },
    { id: 'test' as const, label: copy.settings.testPrint, icon: Printer },
  ];

  return (
    <View style={styles.screen}>
      <PageHeader
        title={copy.settings.title}
        action={
          <BigButton
            label={copy.settings.close}
            onPress={onClose}
            variant="secondary"
            style={styles.close}
          />
        }
      />
      <ScrollView horizontal style={styles.sectionScroller} contentContainerStyle={styles.sectionNav}>
        {sections.map((item) => (
          <OptionChip
            key={item.id}
            label={item.label}
            onPress={() => {
              setSection(item.id);
              setMessage('');
            }}
            selected={section === item.id}
            style={styles.sectionButton}
            leading={
              <item.icon
                color={section === item.id ? colors.background : colors.secondary}
                size={sizes.iconSm}
                strokeWidth={2}
              />
            }
          />
        ))}
      </ScrollView>
      {message ? (
        <Text style={[styles.message, isError && styles.errorMessage]}>{message}</Text>
      ) : null}
      <Card style={styles.content}>
        {section === 'preferences' ? (
          <ScrollView contentContainerStyle={styles.paddedContent}>
            <PreferencesEditor
              settings={settings}
              onChange={(patch) => {
                setMessage('');
                setClockDraft((draft) =>
                  reformatClockDraft(draft, settings, { ...settings, ...patch }),
                );
                void updateSettings(patch).catch(() => {
                  setIsError(true);
                  setMessage(copy.settings.settingsError);
                });
              }}
            />
            <DateTimeEditor
              settings={settings}
              value={clockDraft}
              onChange={setClockDraft}
              onApply={(patch) => updateSettings(patch)}
            />
          </ScrollView>
        ) : null}
        {section === 'size' ? (
          <View style={styles.paddedContent}>
            <LabelSizeEditor
              value={sizeDraft}
              onChange={setSizeDraft}
              printerMaximumWidth={printer.maxWidthMm}
              showValidation={showSizeValidation}
            />
            <BigButton label={copy.settings.save} onPress={() => void saveSize()} />
          </View>
        ) : null}
        {section === 'people' ? <StaffScreen embedded /> : null}
        {section === 'options' ? <OptionManager /> : null}
        {section === 'security' ? (
          <View style={styles.securityContent}>
            <View style={styles.pinRow}>
              <PinInput label={copy.settings.currentPin} value={currentPin} onChange={setCurrentPin} />
              <PinInput label={copy.settings.newPin} value={newPin} onChange={setNewPin} />
              <PinInput
                label={copy.settings.confirmNewPin}
                value={confirmNewPin}
                onChange={setConfirmNewPin}
              />
            </View>
            <BigButton label={copy.settings.changePin} onPress={() => void changePin()} />
          </View>
        ) : null}
        {section === 'test' ? <TestPrintPanel /> : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.xl, gap: spacing.md, backgroundColor: colors.background },
  close: { width: 160, minHeight: sizes.tapMin },
  sectionNav: { gap: spacing.xs, paddingBottom: spacing.xxs },
  sectionScroller: { flexGrow: 0 },
  sectionButton: { minWidth: 160, minHeight: sizes.tapMin, paddingHorizontal: spacing.sm },
  content: { flex: 1, minHeight: 0, padding: spacing.md },
  paddedContent: { flexGrow: 1, padding: spacing.xs, gap: spacing.md },
  securityContent: { flex: 1, justifyContent: 'center', gap: spacing.lg, padding: spacing.lg },
  pinRow: { flexDirection: 'row', gap: spacing.md },
  message: {
    ...typography.bodyStrong,
    padding: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.primarySoft,
    color: colors.primaryDark,
  },
  errorMessage: { backgroundColor: colors.dangerSoft, color: colors.dangerDark },
});
