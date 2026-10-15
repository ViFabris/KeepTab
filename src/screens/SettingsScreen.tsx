import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { BigButton } from '../components/BigButton';
import { PageHeader } from '../components/PageHeader';
import { useLanguage } from '../i18n/LanguageContext';
import { LabelSizeEditor, parseLabelSize, type LabelSizeDraft } from '../settings/LabelSizeEditor';
import { OptionManager } from '../settings/OptionManager';
import { PinInput } from '../settings/PinInput';
import { isValidPin, saveAdminPin, verifyAdminPin } from '../settings/pin';
import { PreferencesEditor } from '../settings/PreferencesEditor';
import { useSettings } from '../settings/SettingsContext';
import { TestPrintPanel } from '../settings/TestPrintPanel';
import { MockPrinter } from '../printing/MockPrinter';
import { colors } from '../theme';
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

  const sections: { id: SettingsSection; label: string }[] = [
    { id: 'preferences', label: copy.settings.preferences },
    { id: 'size', label: copy.settings.labelSize },
    { id: 'people', label: copy.settings.people },
    { id: 'options', label: copy.settings.options },
    { id: 'security', label: copy.settings.security },
    { id: 'test', label: copy.settings.testPrint },
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
          <BigButton
            key={item.id}
            label={item.label}
            onPress={() => {
              setSection(item.id);
              setMessage('');
            }}
            selected={section === item.id}
            variant="choice"
            style={styles.sectionButton}
          />
        ))}
      </ScrollView>
      {message ? (
        <Text style={[styles.message, isError && styles.errorMessage]}>{message}</Text>
      ) : null}
      <View style={styles.content}>
        {section === 'preferences' ? (
          <ScrollView contentContainerStyle={styles.paddedContent}>
            <PreferencesEditor
              settings={settings}
              onChange={(patch) => {
                setMessage('');
                void updateSettings(patch).catch(() => {
                  setIsError(true);
                  setMessage(copy.settings.settingsError);
                });
              }}
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, gap: 14 },
  close: { width: 150, minHeight: 56 },
  sectionNav: { gap: 8, paddingBottom: 2 },
  sectionScroller: { flexGrow: 0 },
  sectionButton: { minWidth: 150, minHeight: 56, paddingHorizontal: 12 },
  content: { flex: 1, minHeight: 0 },
  paddedContent: { flexGrow: 1, padding: 8, gap: 14 },
  securityContent: { flex: 1, justifyContent: 'center', gap: 20, padding: 18 },
  pinRow: { flexDirection: 'row', gap: 14 },
  message: {
    padding: 10,
    borderRadius: 9,
    backgroundColor: colors.primarySoft,
    color: colors.primaryDark,
    fontSize: 16,
    fontWeight: '800',
  },
  errorMessage: { backgroundColor: colors.dangerSoft, color: colors.dangerDark },
});
