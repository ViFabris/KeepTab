import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BigButton } from '../components/BigButton';
import { Input } from '../components/Input';
import { OptionChip } from '../components/OptionChip';
import { useLanguage } from '../i18n/LanguageContext';
import {
  bytesToHex,
  clonePrinterProfile,
  EIGHTY_MM_PRINTER_PROFILE,
  hexToBytes,
  type EndOfLabelAction,
  type PrinterProfile,
  validatePrinterProfile,
  DEFAULT_PRINTER_PROFILE,
} from '../printing/PrinterProfile';
import { colors, spacing, typography } from '../theme';
import type { AppSettings } from '../types';

interface PrinterSettingsEditorProps {
  settings: AppSettings;
  onSave: (patch: Pick<AppSettings, 'printerProfile' | 'printerThresholdPercent' | 'defaultPrintCopies'>) => Promise<void>;
}

export function PrinterSettingsEditor({ settings, onSave }: PrinterSettingsEditorProps) {
  const { copy } = useLanguage();
  const [profile, setProfile] = useState<PrinterProfile>(() => clonePrinterProfile(settings.printerProfile));
  const [threshold, setThreshold] = useState(String(settings.printerThresholdPercent));
  const [copies, setCopies] = useState(String(settings.defaultPrintCopies));
  const [preBytes, setPreBytes] = useState(bytesToHex(settings.printerProfile.prePrintBytes));
  const [postBytes, setPostBytes] = useState(bytesToHex(settings.printerProfile.postPrintBytes));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setProfile(clonePrinterProfile(settings.printerProfile));
    setThreshold(String(settings.printerThresholdPercent));
    setCopies(String(settings.defaultPrintCopies));
    setPreBytes(bytesToHex(settings.printerProfile.prePrintBytes));
    setPostBytes(bytesToHex(settings.printerProfile.postPrintBytes));
  }, [settings]);

  function selectPreset(next: PrinterProfile) {
    setProfile(clonePrinterProfile(next));
    setPreBytes(bytesToHex(next.prePrintBytes));
    setPostBytes(bytesToHex(next.postPrintBytes));
  }

  function updateProfile(patch: Partial<PrinterProfile>) {
    setProfile((current) => ({ ...current, ...patch }));
  }

  async function save() {
    setSaving(true);
    setError('');
    try {
      const nextProfile = {
        ...profile,
        dpi: Number(profile.dpi),
        headWidthDots: Number(profile.headWidthDots),
        rasterChunkHeightRows: Number(profile.rasterChunkHeightRows),
        endFeedDots: Number(profile.endFeedDots),
        prePrintBytes: hexToBytes(preBytes),
        postPrintBytes: hexToBytes(postBytes),
      };
      const nextThreshold = Number(threshold);
      const nextCopies = Number(copies);
      validatePrinterProfile(nextProfile);
      if (!Number.isInteger(nextThreshold) || nextThreshold < 0 || nextThreshold > 100) {
        throw new Error('THRESHOLD_INVALID');
      }
      if (!Number.isInteger(nextCopies) || nextCopies < 1 || nextCopies > 99) {
        throw new Error('PRINT_COPIES_INVALID');
      }
      await onSave({
        printerProfile: nextProfile,
        printerThresholdPercent: nextThreshold,
        defaultPrintCopies: nextCopies,
      });
    } catch {
      setError(copy.settings.settingsError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.note}>{copy.settings.printerHardwareNote}</Text>
      <View style={styles.presets}>
        <OptionChip
          label={copy.settings.printerProfile58}
          onPress={() => selectPreset(DEFAULT_PRINTER_PROFILE)}
          selected={profile.headWidthDots === DEFAULT_PRINTER_PROFILE.headWidthDots}
        />
        <OptionChip
          label={copy.settings.printerProfile80}
          onPress={() => selectPreset(EIGHTY_MM_PRINTER_PROFILE)}
          selected={profile.headWidthDots === EIGHTY_MM_PRINTER_PROFILE.headWidthDots}
        />
      </View>
      <PrinterField label={copy.settings.printerProfileName} note={copy.settings.printerHardwareNote} value={profile.name} onChangeText={(name) => updateProfile({ name })} />
      <PrinterField label={copy.settings.printerDpi} note={copy.settings.printerHardwareNote} value={String(profile.dpi)} onChangeText={(value) => updateProfile({ dpi: Number(value) })} />
      <PrinterField label={copy.settings.printerHeadWidth} note={copy.settings.printerHardwareNote} value={String(profile.headWidthDots)} onChangeText={(value) => updateProfile({ headWidthDots: Number(value) })} />
      <PrinterField label={copy.settings.rasterChunkHeight} note={copy.settings.printerHardwareNote} value={String(profile.rasterChunkHeightRows)} onChangeText={(value) => updateProfile({ rasterChunkHeightRows: Number(value) })} />
      <PrinterField label={copy.settings.prePrintBytes} note={copy.settings.printerHardwareNote} value={preBytes} onChangeText={setPreBytes} />
      <PrinterField label={copy.settings.postPrintBytes} note={copy.settings.printerHardwareNote} value={postBytes} onChangeText={setPostBytes} />
      <View style={styles.field}>
        <Text style={styles.label}>{copy.settings.endOfLabelAction}</Text>
        <View style={styles.actions}>
          <EndActionChip action="none" label={copy.settings.noEndAction} profile={profile} onChange={updateProfile} />
          <EndActionChip action="lineFeed" label={copy.settings.lineFeed} profile={profile} onChange={updateProfile} />
          <EndActionChip action="formFeed" label={copy.settings.formFeed} profile={profile} onChange={updateProfile} />
          <EndActionChip action="labelFeed" label={copy.settings.labelFeed} profile={profile} onChange={updateProfile} />
        </View>
        <Text style={styles.note}>{copy.settings.printerHardwareNote}</Text>
      </View>
      {profile.endOfLabelAction === 'lineFeed' ? <PrinterField label={copy.settings.endFeedDots} note={copy.settings.printerHardwareNote} value={String(profile.endFeedDots)} onChangeText={(value) => updateProfile({ endFeedDots: Number(value) })} /> : null}
      <PrinterField label={copy.settings.threshold} note={copy.settings.printerHardwareNote} value={threshold} onChangeText={setThreshold} />
      <PrinterField label={copy.settings.defaultCopies} note={copy.settings.printerHardwareNote} value={copies} onChangeText={setCopies} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <BigButton disabled={saving} label={copy.settings.save} onPress={() => void save()} />
    </ScrollView>
  );
}

function PrinterField({ label, note, value, onChangeText }: { label: string; note: string; value: string; onChangeText: (value: string) => void }) {
  return (
    <View style={styles.field}>
      <Input label={label} keyboardType="default" onChangeText={onChangeText} value={value} />
      <Text style={styles.note}>{note}</Text>
    </View>
  );
}

function EndActionChip({ action, label, profile, onChange }: { action: EndOfLabelAction; label: string; profile: PrinterProfile; onChange: (patch: Partial<PrinterProfile>) => void }) {
  return <OptionChip label={label} onPress={() => onChange({ endOfLabelAction: action })} selected={profile.endOfLabelAction === action} />;
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, padding: spacing.xs },
  field: { gap: spacing.xs },
  label: { ...typography.bodyStrong, color: colors.ink },
  note: { ...typography.caption, color: colors.muted },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  error: { ...typography.bodyStrong, color: colors.dangerDark },
});
