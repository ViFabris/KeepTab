import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { LabelSizeCopy } from '../i18n';
import { useLanguage } from '../i18n/LanguageContext';
import {
  isTemplateAvailable,
  LABEL_TEMPLATES,
  type LabelPresetId,
  type LabelTemplate,
} from '../printing/labelTemplates';
import { colors, radii, sizes, spacing, typography } from '../theme';

export function LabelSizeEditor({
  value,
  onChange,
  printerMaximumWidth,
}: {
  value: LabelTemplate;
  onChange: (value: LabelTemplate) => void;
  printerMaximumWidth: number;
}) {
  const { copy } = useLanguage();

  return (
    <View style={styles.container}>
      <View style={styles.cards}>
        {LABEL_TEMPLATES.map((template) => {
          const available = isTemplateAvailable(template, printerMaximumWidth);
          const selected = template.id === value.id;
          return (
            <Pressable
              accessibilityLabel={`${presetName(template.id, copy.labelSizes)} · ${template.widthMm} × ${template.heightMm} ${copy.setup.millimeters}`}
              accessibilityRole="button"
              accessibilityState={{ disabled: !available, selected }}
              disabled={!available}
              key={template.id}
              onPress={() => onChange(template)}
              style={({ pressed }) => [
                styles.card,
                selected && styles.selectedCard,
                !available && styles.unavailableCard,
                pressed && available && styles.pressedCard,
              ]}
            >
              <View style={styles.cardHeading}>
                <Text style={[styles.name, selected && styles.selectedText]}>
                  {presetName(template.id, copy.labelSizes)}
                </Text>
                <Text style={[styles.dimensions, selected && styles.selectedText]}>
                  {template.widthMm} × {template.heightMm} {copy.setup.millimeters}
                </Text>
              </View>
              <TemplateMiniature template={template} selected={selected} />
              <Text style={[styles.hint, selected && styles.selectedHint]}>
                {presetHint(template.id, copy.labelSizes)}
              </Text>
              {!available ? (
                <View style={styles.unavailableMessage}>
                  <Text style={styles.unavailableTitle}>{copy.labelSizes.unavailable}</Text>
                  <Text style={styles.unavailableText}>
                    {copy.labelSizes.unavailableReason(
                      Math.min(template.widthMm, template.heightMm),
                      printerMaximumWidth,
                    )}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      <View style={styles.previewArea}>
        <Text style={styles.previewTitle}>{copy.setup.livePreview}</Text>
        <TemplateMiniature template={value} large />
      </View>
    </View>
  );
}

function TemplateMiniature({
  template,
  selected = false,
  large = false,
}: {
  template: LabelTemplate;
  selected?: boolean;
  large?: boolean;
}) {
  return (
    <View
      style={[
        styles.miniature,
        large ? styles.largeMiniature : styles.cardMiniature,
        { aspectRatio: template.widthMm / template.heightMm },
        selected && styles.selectedMiniature,
      ]}
    >
      {template.textZones.map((zone) => (
        <View
          key={zone.id}
          style={[
            styles.zone,
            {
              left: `${(zone.xMm / template.widthMm) * 100}%`,
              top: `${(zone.yMm / template.heightMm) * 100}%`,
              width: `${(zone.widthMm / template.widthMm) * 100}%`,
              height: `${(zone.heightMm / template.heightMm) * 100}%`,
            },
          ]}
        />
      ))}
      <View
        style={[
          styles.qrZone,
          {
            left: `${(template.qr.xMm / template.widthMm) * 100}%`,
            top: `${(template.qr.yMm / template.heightMm) * 100}%`,
            width: `${(template.qr.sizeMm / template.widthMm) * 100}%`,
            height: `${(template.qr.sizeMm / template.heightMm) * 100}%`,
          },
        ]}
      />
    </View>
  );
}

function presetName(id: LabelPresetId, copy: LabelSizeCopy): string {
  return copy[id];
}

function presetHint(id: LabelPresetId, copy: LabelSizeCopy): string {
  if (id === 'small') return copy.smallHint;
  if (id === 'medium') return copy.mediumHint;
  return copy.largeHint;
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: spacing.lg },
  cards: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.md },
  card: {
    flex: 1,
    minHeight: sizes.tapMin * 4,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceRaised,
  },
  selectedCard: { borderColor: colors.primary, backgroundColor: colors.primary },
  unavailableCard: { borderColor: colors.border, backgroundColor: colors.secondarySoft, opacity: 0.82 },
  pressedCard: { opacity: 0.84, transform: [{ scale: 0.99 }] },
  cardHeading: { gap: spacing.xxs },
  name: { ...typography.h3, color: colors.ink },
  dimensions: { ...typography.bodyStrong, color: colors.muted },
  selectedText: { color: colors.background },
  hint: { ...typography.caption, minHeight: typography.caption.lineHeight * 2, color: colors.muted },
  selectedHint: { color: colors.background },
  cardMiniature: { width: sizes.labelPresetMiniature },
  largeMiniature: { width: sizes.labelPresetPreview, maxWidth: '100%' },
  miniature: {
    position: 'relative',
    alignSelf: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.monochromeBlack,
    borderRadius: radii.xs,
    backgroundColor: colors.monochromeSurface,
  },
  selectedMiniature: { borderColor: colors.background },
  zone: {
    position: 'absolute',
    borderRadius: radii.xs,
    backgroundColor: colors.monochromeBorder,
  },
  qrZone: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: colors.monochromeBlack,
    backgroundColor: colors.monochromeSurface,
  },
  unavailableMessage: { gap: spacing.xxs },
  unavailableTitle: { ...typography.bodyStrong, color: colors.dangerDark },
  unavailableText: { ...typography.caption, color: colors.dangerDark },
  previewArea: {
    flex: 1,
    minHeight: sizes.tapMin * 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  previewTitle: { ...typography.overline, color: colors.muted },
});
