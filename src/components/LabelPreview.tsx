import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { getFormLabel, getLabelOptionName, getStorageLabel } from '../i18n';
import { useLanguage } from '../i18n/LanguageContext';
import { useSettings } from '../settings/SettingsContext';
import { colors, radii, spacing, typography } from '../theme';
import type { LabelOption, ShelfLife } from '../types';
import { formatConfiguredDateTime, formatLabelUseBy, formatShelfLife } from '../utils/dates';
import { Card } from './Card';

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
    <Card style={styles.previewCard}>
      <View
        style={[
          styles.label,
          compact && styles.compact,
          { width: previewWidth, height: previewHeight, padding: Math.max(spacing.xs, spacing.lg * scale) },
        ]}
      >
      <View style={[styles.titleRow, vertical && styles.verticalStack]}>
        <Text
          {...fitText}
          numberOfLines={1}
          style={[styles.itemName, { fontSize: typography.h2.fontSize * scale }]}
        >
          {label.itemName}
        </Text>
        <Text {...fitText} numberOfLines={1} style={[styles.mockBadge, { fontSize: typography.caption.fontSize * scale }]}> 
          {copy.sampleLabelBadge}
        </Text>
      </View>
      <Text {...fitText} numberOfLines={1} style={[styles.detail, { fontSize: typography.body.fontSize * scale }]}> 
        {formName} · {storageName}
      </Text>
      <View style={[styles.rule, { marginVertical: Math.max(5, 12 * scale) }]} />
      <View style={[styles.dateRow, vertical && styles.dateColumnLayout]}>
        <View style={styles.dateColumn}>
          <Text {...fitText} numberOfLines={1} style={[styles.fieldLabel, { fontSize: typography.caption.fontSize * scale }]}> 
            {copy.made}
          </Text>
          <Text {...fitText} numberOfLines={1} style={[styles.fieldValue, { fontSize: typography.body.fontSize * scale }]}> 
            {formatConfiguredDateTime(label.madeAt, settings)}
          </Text>
        </View>
        <View style={styles.dateColumn}>
          <Text {...fitText} numberOfLines={1} style={[styles.fieldLabel, { fontSize: typography.caption.fontSize * scale }]}> 
            {copy.useBy}
          </Text>
          <Text {...fitText} numberOfLines={1} style={[styles.useBy, { fontSize: typography.h1.fontSize * scale }]}> 
            {label.useByAt ? formatLabelUseBy(label.useByAt, settings) : copy.notConfigured}
          </Text>
        </View>
      </View>
      <View
        style={[
          styles.footer,
          vertical && styles.verticalStack,
          { marginTop: Math.max(5, 12 * scale) },
        ]}
      >
        <Text
          {...fitText}
          numberOfLines={1}
          style={[styles.staff, vertical && styles.verticalText, { fontSize: typography.body.fontSize * scale }]}
        >
          {copy.madeBy(label.staffName)}
        </Text>
        {shelfLife ? (
          <Text
            {...fitText}
            numberOfLines={1}
            style={[
              styles.duration,
              vertical && styles.verticalText,
              vertical && styles.verticalDuration,
              { fontSize: typography.caption.fontSize * scale },
            ]}
          >
            {copy.shelfLife(formatShelfLife(shelfLife.hours, language))}
          </Text>
        ) : null}
      </View>
      {shelfLife?.isPlaceholder ? (
        <Text
          {...fitText}
          numberOfLines={2}
          style={[styles.placeholder, { fontSize: typography.caption.fontSize * scale, marginTop: Math.max(spacing.xxs, spacing.xs * scale) }]}
        >
          {copy.placeholderWarning}
        </Text>
      ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  previewCard: { alignSelf: 'center', padding: spacing.lg },
  label: {
    alignSelf: 'center',
    borderWidth: 3,
    borderColor: colors.monochromeBlack,
    borderRadius: radii.xs,
    backgroundColor: colors.monochromeSurface,
    overflow: 'hidden',
  },
  compact: {},
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  verticalStack: { flexDirection: 'column', alignItems: 'stretch', gap: spacing.xxs },
  itemName: { flex: 1, color: colors.monochromeBlack, fontFamily: typography.h1.fontFamily },
  mockBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.xs,
    backgroundColor: colors.monochromeSurface,
    borderWidth: 1,
    borderColor: colors.monochromeInk,
    color: colors.monochromeBlack,
    fontFamily: typography.bodyStrong.fontFamily,
  },
  detail: { marginTop: spacing.xxs, color: colors.monochromeInk, fontFamily: typography.bodyStrong.fontFamily },
  rule: { height: 2, backgroundColor: colors.monochromeBlack },
  dateRow: { flexDirection: 'row', gap: spacing.xxl },
  dateColumnLayout: { flexDirection: 'column', gap: spacing.xs },
  dateColumn: { flex: 1 },
  fieldLabel: { color: colors.monochromeInk, fontFamily: typography.bodyStrong.fontFamily, letterSpacing: 1.2 },
  fieldValue: { marginTop: spacing.xxs, color: colors.monochromeBlack, fontFamily: typography.bodyStrong.fontFamily },
  useBy: { marginTop: spacing.xxs, color: colors.monochromeBlack, fontFamily: typography.h1.fontFamily },
  footer: { marginTop: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  staff: { flex: 1, color: colors.monochromeBlack, fontFamily: typography.bodyStrong.fontFamily },
  duration: { flex: 1, color: colors.monochromeInk, fontFamily: typography.caption.fontFamily, textAlign: 'right' },
  verticalDuration: { textAlign: 'left' },
  verticalText: { flex: 0 },
  placeholder: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.monochromeBorder,
    color: colors.monochromeBlack,
    fontFamily: typography.bodyStrong.fontFamily,
    textAlign: 'center',
  },
});
