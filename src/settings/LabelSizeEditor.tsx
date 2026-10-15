import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useLanguage } from '../i18n/LanguageContext';
import { colors, radii, sizes, spacing, typography } from '../theme';

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
  const previewBounds = { width: 360, height: 230 };
  const previewWidth = ratio >= previewBounds.width / previewBounds.height
    ? previewBounds.width
    : previewBounds.height * ratio;
  const previewHeight = ratio >= previewBounds.width / previewBounds.height
    ? previewBounds.width / ratio
    : previewBounds.height;

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
            { width: previewWidth, height: previewHeight },
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
  container: { flex: 1, gap: spacing.md },
  fields: { flexDirection: 'row', gap: spacing.lg },
  field: { flex: 1, gap: spacing.xs },
  fieldLabel: { ...typography.bodyStrong, color: colors.ink },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    ...typography.h2,
    flex: 1,
    minHeight: sizes.control,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceRaised,
    color: colors.ink,
  },
  unit: { ...typography.bodyStrong, color: colors.muted },
  error: { ...typography.bodyStrong, color: colors.dangerDark },
  warning: {
    ...typography.bodyStrong,
    padding: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.warningBackground,
    color: colors.warning,
  },
  previewArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  previewTitle: { ...typography.overline, color: colors.muted },
  preview: {
    maxWidth: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.ink,
    backgroundColor: colors.monochromeSurface,
  },
  previewSize: {
    ...typography.bodyStrong,
    maxWidth: '94%',
    color: colors.monochromeBlack,
    textAlign: 'center',
  },
});
