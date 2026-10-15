import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { getFormLabel, getLabelOptionName, getStorageLabel } from '../i18n';
import { useLanguage } from '../i18n/LanguageContext';
import { useSettings } from '../settings/SettingsContext';
import { colors } from '../theme';
import type { LabelOption, ShelfLife } from '../types';
import { formatConfiguredDateTime, formatLabelUseBy, formatShelfLife } from '../utils/dates';

interface LabelPreviewProps {
  label: {
    itemName: string;
    form: string;
    storageType: string;
    madeAt: string;
    useByAt?: string;
    staffName: string;
  };
  shelfLife: ShelfLife | null;
  compact?: boolean;
  formOption?: LabelOption;
  storageOption?: LabelOption;
}

export function LabelPreview({
  label,
  shelfLife,
  compact = false,
  formOption,
  storageOption,
}: LabelPreviewProps) {
  const { language, copy } = useLanguage();
  const { settings } = useSettings();
  const window = useWindowDimensions();
  const widthMm = 'labelWidthMm' in label ? Number(label.labelWidthMm) : settings.labelWidthMm;
  const heightMm = 'labelHeightMm' in label ? Number(label.labelHeightMm) : settings.labelHeightMm;
  const ratio = widthMm / heightMm;
  const maxWidth = Math.min(window.width - 330, compact ? 680 : 760);
  const maxHeight = Math.min(window.height - 255, compact ? 330 : 390);
  const previewWidth = Math.min(maxWidth, maxHeight * ratio);
  const previewHeight = Math.max(80, previewWidth / ratio);
  const scale = Math.max(0.45, Math.min(1.15, previewWidth / 620, previewHeight / 300));
  const vertical = ratio < 1.2;
  const formName = formOption
    ? getLabelOptionName(formOption, language)
    : getFormLabel(label.form, language);
  const storageName = storageOption
    ? getLabelOptionName(storageOption, language)
    : getStorageLabel(label.storageType, language);
  const fitText = { adjustsFontSizeToFit: true, minimumFontScale: 0.35 } as const;
  return (
    <View
      style={[
        styles.label,
        compact && styles.compact,
        { width: previewWidth, height: previewHeight, padding: Math.max(8, 20 * scale) },
      ]}
    >
      <View style={styles.titleRow}>
        <Text
          {...fitText}
          numberOfLines={1}
          style={[styles.itemName, { fontSize: 29 * scale }]}
        >
          {label.itemName}
        </Text>
        <Text {...fitText} numberOfLines={1} style={[styles.mockBadge, { fontSize: 10 * scale }]}>
          {copy.sampleLabelBadge}
        </Text>
      </View>
      <Text {...fitText} numberOfLines={1} style={[styles.detail, { fontSize: 19 * scale }]}>
        {formName} · {storageName}
      </Text>
      <View style={[styles.rule, { marginVertical: Math.max(5, 12 * scale) }]} />
      <View style={[styles.dateRow, vertical && styles.dateColumnLayout]}>
        <View style={styles.dateColumn}>
          <Text {...fitText} numberOfLines={1} style={[styles.fieldLabel, { fontSize: 11 * scale }]}>
            {copy.made}
          </Text>
          <Text {...fitText} numberOfLines={1} style={[styles.fieldValue, { fontSize: 17 * scale }]}>
            {formatConfiguredDateTime(label.madeAt, settings)}
          </Text>
        </View>
        <View style={styles.dateColumn}>
          <Text {...fitText} numberOfLines={1} style={[styles.fieldLabel, { fontSize: 12 * scale }]}>
            {copy.useBy}
          </Text>
          <Text {...fitText} numberOfLines={1} style={[styles.useBy, { fontSize: 38 * scale }]}>
            {label.useByAt ? formatLabelUseBy(label.useByAt, settings) : copy.notConfigured}
          </Text>
        </View>
      </View>
      <View style={[styles.footer, { marginTop: Math.max(5, 12 * scale) }]}>
        <Text {...fitText} numberOfLines={1} style={[styles.staff, { fontSize: 15 * scale }]}>
          {copy.madeBy(label.staffName)}
        </Text>
        {shelfLife ? (
          <Text {...fitText} numberOfLines={1} style={[styles.duration, { fontSize: 14 * scale }]}>
            {copy.shelfLife(formatShelfLife(shelfLife.hours, language))}
          </Text>
        ) : null}
      </View>
      {shelfLife?.isPlaceholder ? (
        <Text
          {...fitText}
          numberOfLines={2}
          style={[styles.placeholder, { fontSize: 10 * scale, marginTop: Math.max(3, 8 * scale) }]}
        >
          {copy.placeholderWarning}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    alignSelf: 'center',
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: 8,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  compact: {},
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  itemName: { flex: 1, color: '#000000', fontWeight: '900' },
  mockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
    backgroundColor: '#ecefec',
    color: '#27332e',
    fontWeight: '900',
  },
  detail: { marginTop: 3, color: '#18231f', fontWeight: '700' },
  rule: { height: 2, backgroundColor: '#000000' },
  dateRow: { flexDirection: 'row', gap: 32 },
  dateColumnLayout: { flexDirection: 'column', gap: 5 },
  dateColumn: { flex: 1 },
  fieldLabel: { color: '#36423d', fontWeight: '900', letterSpacing: 1.2 },
  fieldValue: { marginTop: 2, color: '#000000', fontWeight: '700' },
  useBy: { marginTop: 2, color: colors.dangerDark, fontWeight: '900' },
  footer: { marginTop: 20, flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  staff: { flex: 1, color: '#000000', fontWeight: '800' },
  duration: { flex: 1, color: '#27332e', fontWeight: '600', textAlign: 'right' },
  placeholder: {
    marginTop: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#9ca49f',
    color: colors.danger,
    fontWeight: '900',
    textAlign: 'center',
  },
});
