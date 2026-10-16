import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Languages, LockKeyhole, PackageOpen, Printer, Ruler, Users } from 'lucide-react-native';

import { BigButton } from '../components/BigButton';
import { Card } from '../components/Card';
import { OptionChip } from '../components/OptionChip';
import { PageHeader } from '../components/PageHeader';
import { useLanguage } from '../i18n/LanguageContext';
import { findNearestLabelTemplate, type LabelTemplate } from '../printing/labelTemplates';
import { DateTimeEditor } from '../settings/DateTimeEditor';
import { LabelSizeEditor } from '../settings/LabelSizeEditor';
import { OptionManager } from '../settings/OptionManager';
import { PinInput } from '../settings/PinInput';
import { isValidPin, saveAdminPin, verifyAdminPin } from '../settings/pin';
import { PreferencesEditor } from '../settings/PreferencesEditor';
import { PrinterSettingsEditor } from '../settings/PrinterSettingsEditor';
import { PrintingDebugPanel } from '../settings/PrintingDebugPanel';
import { useSettings } from '../settings/SettingsContext';
import { TestPrintPanel } from '../settings/TestPrintPanel';
import { MockPrinter } from '../printing/MockPrinter';
import { colors, radii, sizes, spacing, typography } from '../theme';
import { createClockDraft, reformatClockDraft } from '../utils/appClock';
import { StaffScreen } from './StaffScreen';

type SettingsSection = 'preferences' | 'size' | 'people' | 'options' | 'security' | 'printer' | 'debug';

export function SettingsScreen({ onClose }: { onClose: () => void }) {
  const db = useSQLiteContext();
  const { copy } = useLanguage();
  const { settings, updateSettings } = useSettings();
  const [section, setSection] = useState<SettingsSection>('people');
  const [pendingSection, setPendingSection] = useState<SettingsSection | null>(null);
  const [unlockPin, setUnlockPin] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [unlockBusy, setUnlockBusy] = useState(false);
  const [sizeDraft, setSizeDraft] = useState<LabelTemplate>(() =>
    findNearestLabelTemplate(settings.labelWidthMm, settings.labelHeightMm),
  );
  const [clockDraft, setClockDraft] = useState(() => createClockDraft(settings));
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const printer = new MockPrinter(db, settings);

  function openSection(nextSection: SettingsSection) {
    if (nextSection === section) return;
    setMessage('');
    if (isProtectedSection(nextSection)) {
      setPendingSection(nextSection);
      setUnlockPin('');
      setUnlockError('');
      return;
    }
    setSection(nextSection);
  }

  async function unlockSection() {
    if (!pendingSection) return;
    setUnlockBusy(true);
    setUnlockError('');
    try {
      if (!(await verifyAdminPin(db, unlockPin))) {
        setUnlockError(copy.settings.wrongPin);
        setUnlockPin('');
        return;
      }
      setSection(pendingSection);
      setPendingSection(null);
      setUnlockPin('');
    } catch {
      setUnlockError(copy.genericError);
    } finally {
      setUnlockBusy(false);
    }
  }

  async function saveSize() {
    await saveChange(() =>
      updateSettings({ labelWidthMm: sizeDraft.widthMm, labelHeightMm: sizeDraft.heightMm }),
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
    { id: 'printer' as const, label: copy.settings.advancedPrinterSettings, icon: Printer },
    { id: 'debug' as const, label: copy.settings.printingDebug, icon: Printer },
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
            onPress={() => openSection(item.id)}
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
              requiresPin={false}
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
              printerMaximumWidth={printer.maxPrintableWidthMm}
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
        {section === 'printer' ? (
          <PrinterSettingsEditor
            settings={settings}
            onSave={async (patch) => {
              await updateSettings(patch);
              setIsError(false);
              setMessage(copy.settings.saved);
            }}
          />
        ) : null}
        {section === 'debug' ? <PrintingDebugPanel /> : null}
      </Card>
      <ProtectedSectionDialog
        busy={unlockBusy}
        error={unlockError}
        onCancel={() => setPendingSection(null)}
        onConfirm={() => void unlockSection()}
        pin={unlockPin}
        sectionLabel={sections.find((item) => item.id === pendingSection)?.label ?? ''}
        setPin={setUnlockPin}
        visible={pendingSection !== null}
      />
    </View>
  );
}

function isProtectedSection(section: SettingsSection): boolean {
  return section === 'preferences' || section === 'size' || section === 'security' || section === 'printer' || section === 'debug';
}

function ProtectedSectionDialog({
  visible,
  sectionLabel,
  pin,
  error,
  busy,
  setPin,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  sectionLabel: string;
  pin: string;
  error: string;
  busy: boolean;
  setPin: (pin: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { copy } = useLanguage();
  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <View style={styles.dialogOverlay}>
        <Pressable accessibilityRole="button" onPress={onCancel} style={StyleSheet.absoluteFill} />
        <Card style={styles.dialog}>
          <View style={styles.dialogHeading}>
            <View style={styles.lockIcon}>
              <LockKeyhole color={colors.primary} size={sizes.iconLg} strokeWidth={2} />
            </View>
            <View style={styles.dialogCopy}>
              <Text style={styles.dialogTitle}>{copy.settings.unlockTitle}</Text>
              <Text style={styles.dialogHint}>{sectionLabel} · {copy.settings.unlockHint}</Text>
            </View>
          </View>
          <PinInput label={copy.setup.pin} value={pin} onChange={setPin} />
          {error ? <Text style={styles.dialogError}>{error}</Text> : null}
          <View style={styles.dialogActions}>
            <BigButton
              disabled={busy}
              label={copy.cancel}
              onPress={onCancel}
              style={styles.dialogButton}
              variant="secondary"
            />
            <BigButton
              disabled={busy}
              label={copy.settings.unlock}
              onPress={onConfirm}
              style={styles.dialogButton}
            />
          </View>
        </Card>
      </View>
    </Modal>
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
  dialogOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.overlay,
  },
  dialog: { width: '62%', maxWidth: 680, padding: spacing.xxl, gap: spacing.lg },
  dialogHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  lockIcon: {
    width: sizes.control,
    height: sizes.control,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
  },
  dialogCopy: { flex: 1, minWidth: 0 },
  dialogTitle: { ...typography.h2, color: colors.ink },
  dialogHint: { ...typography.body, marginTop: spacing.xs, color: colors.muted },
  dialogError: { ...typography.bodyStrong, color: colors.dangerDark },
  dialogActions: { flexDirection: 'row', gap: spacing.md },
  dialogButton: { flex: 1 },
});
