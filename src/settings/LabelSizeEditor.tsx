import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useLanguage } from '../i18n/LanguageContext';
import { colors } from '../theme';

export interface LabelSizeDraft {
  width: string;
  height: string;
}

export function parseLabelSize(draft: LabelSizeDraft): {
  width: number;
  height: number;
} | null {
  const width = Number(draft.width.replace(',', '.'));
  const height = Number(draft.height.replace(',', '.'));
  return Number.isFinite(width) && Number.isFinite(height) &&
    width >= 20 && width <= 100 && height >= 20 && height <= 100
    ? { width, height }
    : null;
}

export function LabelSizeEditor({
  value,
  onChange,
  printerMaximumWidth,
  showValidation = false,
}: {
  value: LabelSizeDraft;
  onChange: (value: LabelSizeDraft) => void;
  printerMaximumWidth: number;
  showValidation?: boolean;
}) {
  const { copy } = useLanguage();
  const parsed = parseLabelSize(value);
  const ratio = parsed ? parsed.width / parsed.height : 1.5;
  const previewWidth = Math.min(360, 220 * ratio);
  const previewHeight = previewWidth / ratio;

  return (
    <View style={styles.container}>
      <View style={styles.fields}>
        <NumericField
          label={copy.setup.width}
          unit={copy.setup.millimeters}
          value={value.width}
          onChange={(width) => onChange({ ...value, width })}
        />
        <NumericField
          label={copy.setup.height}
          unit={copy.setup.millimeters}
          value={value.height}
          onChange={(height) => onChange({ ...value, height })}
        />
      </View>
      {showValidation && !parsed ? (
        <Text style={styles.error}>{copy.setup.sizeValidation}</Text>
      ) : null}
      {parsed && parsed.width > printerMaximumWidth ? (
        <Text style={styles.warning}>
          {copy.setup.printerWidthWarning(printerMaximumWidth)}
        </Text>
      ) : null}
      <View style={styles.previewArea}>
        <Text style={styles.previewTitle}>{copy.setup.livePreview}</Text>
        <View
          style={[
            styles.preview,
            { width: previewWidth, height: Math.min(previewHeight, 230) },
          ]}
        >
          <Text style={styles.previewSize}>
            {value.width || '—'} × {value.height || '—'} {copy.setup.millimeters}
          </Text>
        </View>
      </View>
    </View>
  );
}

function NumericField({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          accessibilityLabel={label}
          keyboardType="decimal-pad"
          onChangeText={(text) => onChange(text.replace(/[^0-9.,]/g, '').slice(0, 6))}
          style={styles.input}
          value={value}
        />
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 14 },
  fields: { flexDirection: 'row', gap: 18 },
  field: { flex: 1, gap: 7 },
  fieldLabel: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: {
    flex: 1,
    minHeight: 64,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 13,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontSize: 25,
    fontWeight: '800',
  },
  unit: { color: colors.muted, fontSize: 20, fontWeight: '800' },
  error: { color: colors.danger, fontSize: 17, fontWeight: '800' },
  warning: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.warningBackground,
    color: colors.warning,
    fontSize: 16,
    fontWeight: '800',
  },
  previewArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  previewTitle: { color: colors.muted, fontSize: 16, fontWeight: '800' },
  preview: {
    minWidth: 120,
    minHeight: 80,
    maxWidth: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
  },
  previewSize: { color: colors.ink, fontSize: 18, fontWeight: '900' },
});
