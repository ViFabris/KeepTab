import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { useLanguage } from '../i18n/LanguageContext';
import { buildFittedLabelFields, createLabelQrValue } from '../printing/labelContent';
import { pointsToDots, resolveLabelTemplate } from '../printing/labelLayout';
import { findNearestLabelTemplate } from '../printing/labelTemplates';
import { useSettings } from '../settings/SettingsContext';
import { colors, fonts, radii, sizes, spacing } from '../theme';
import type { AppSettings, LabelOption, Language, ShelfLife } from '../types';
import { Card } from './Card';

interface LabelPreviewProps {
  label: {
    itemId?: string;
    itemName: string;
    form: string;
    storageType: string;
    madeAt: string;
    dateKind?: 'prepared' | 'opened';
    useByAt?: string;
    staffName: string;
    labelWidthMm?: number;
    labelHeightMm?: number;
  };
  shelfLife: ShelfLife | null;
  compact?: boolean;
  formOption?: LabelOption;
  storageOption?: LabelOption;
  languageOverride?: Language;
  settingsOverride?: AppSettings;
  maxWidthOverride?: number;
}

export function LabelPreview({
  label,
  compact = false,
  formOption,
  storageOption,
  languageOverride,
  settingsOverride,
  maxWidthOverride,
}: LabelPreviewProps) {
  const currentLanguage = useLanguage().language;
  const currentSettings = useSettings().settings;
  const window = useWindowDimensions();
  const language = languageOverride ?? currentLanguage;
  const settings = settingsOverride ?? currentSettings;
  const template = findNearestLabelTemplate(
    label.labelWidthMm ?? settings.labelWidthMm,
    label.labelHeightMm ?? settings.labelHeightMm,
  );
  const layout = resolveLabelTemplate(template, settings.printerProfile.dpi);
  const widthLimit = maxWidthOverride ?? Math.min(
    window.width - sizes.sidebar - spacing.huge,
    compact ? sizes.labelPreviewCompactMaxWidth : sizes.labelPreviewMaxWidth,
  );
  const heightLimit = compact
    ? sizes.labelPreviewCompactMaxHeight
    : sizes.labelPreviewMaxHeight;
  const scale = Math.min(widthLimit / layout.width, heightLimit / layout.height);
  const previewWidth = layout.width * scale;
  const previewHeight = layout.height * scale;
  const fittedFields = buildFittedLabelFields({
    template,
    label,
    settings: { ...settings, language },
    language,
    formOption,
    storageOption,
  });
  const fieldById = new Map(fittedFields.map((field) => [field.id, field]));

  return (
    <Card style={styles.previewCard}>
      <View style={[styles.label, { width: previewWidth, height: previewHeight }]}>
        {layout.textZones.map((zone) => {
          const field = fieldById.get(zone.id);
          if (!field?.lines.length) return null;
          const fontSize = pointsToDots(field.fontSizePt, layout.dpi) * scale;
          return (
            <View
              key={zone.id}
              style={[
                styles.textZone,
                {
                  left: zone.x * scale,
                  top: zone.y * scale,
                  width: zone.width * scale,
                  height: zone.height * scale,
                },
              ]}
            >
              <Text
                numberOfLines={zone.maxLines}
                style={[
                  styles.labelText,
                  zone.id === 'itemName' && styles.strongText,
                  zone.id === 'useByValue' && styles.useByText,
                  {
                    fontSize,
                    lineHeight: fontSize * 1.16,
                    textAlign: zone.align,
                  },
                ]}
              >
                {field.lines.join('\n')}
              </Text>
            </View>
          );
        })}
        <View
          style={[
            styles.qrQuietZone,
            {
              left: layout.qr.x * scale,
              top: layout.qr.y * scale,
              width: layout.qr.width * scale,
              height: layout.qr.height * scale,
              padding: layout.qr.quietMargin * scale,
            },
          ]}
        >
          <QRCode
            backgroundColor={colors.monochromeSurface}
            color={colors.monochromeBlack}
            quietZone={0}
            size={layout.qr.content.width * scale}
            value={createLabelQrValue(label)}
          />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  previewCard: { alignSelf: 'center', padding: spacing.lg },
  label: {
    position: 'relative',
    alignSelf: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.monochromeBlack,
    borderRadius: radii.xs,
    backgroundColor: colors.monochromeSurface,
  },
  textZone: { position: 'absolute', overflow: 'hidden', justifyContent: 'center' },
  labelText: { color: colors.monochromeBlack, fontFamily: fonts.medium },
  strongText: { fontFamily: fonts.bold },
  useByText: { fontFamily: fonts.extraBold },
  qrQuietZone: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.monochromeSurface,
  },
});
