import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { LabelPreview } from '../components/LabelPreview';
import { getItems } from '../database/itemsRepository';
import { getStaff } from '../database/staffRepository';
import { getCopy, getItemName } from '../i18n';
import { useLanguage } from '../i18n/LanguageContext';
import { buildFittedLabelFields } from '../printing/labelContent';
import { LABEL_TEMPLATES, type LabelTemplate } from '../printing/labelTemplates';
import { colors, radii, sizes, spacing, typography } from '../theme';
import type { AppSettings, KitchenItem, Language, StaffMember } from '../types';
import { useSettings } from './SettingsContext';

const VERIFICATION_MADE_AT = '2026-10-16T20:45:00.000Z';
const VERIFICATION_USE_BY_AT = '2026-12-31T23:59:00.000Z';

export function TemplateVerificationPanel() {
  const db = useSQLiteContext();
  const { copy } = useLanguage();
  const { settings } = useSettings();
  const [items, setItems] = useState<KitchenItem[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([getItems(db), getStaff(db)])
      .then(([nextItems, nextStaff]) => {
        if (!active) return;
        setItems(nextItems);
        setStaff(nextStaff);
      })
      .catch(() => active && setError(copy.genericError))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [copy.genericError, db]);

  const longestStaff = useMemo(
    () => longestByText(staff, (person) => person.name)?.name ?? copy.labelSizes.noStaff,
    [copy.labelSizes.noStaff, staff],
  );

  if (loading) return <Text style={styles.message}>{copy.loadingItems}</Text>;
  if (error) return <Text style={styles.error}>{error}</Text>;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.heading}>
        <Text style={styles.title}>{copy.labelSizes.verificationTitle}</Text>
        <Text style={styles.hint}>{copy.labelSizes.verificationHint}</Text>
        <Text style={styles.dataNote}>{copy.labelSizes.longestStaff}: {longestStaff}</Text>
      </View>
      {(['en', 'pt-BR'] as const).map((language) => {
        const languageCopy = getCopy(language);
        const databaseItem = longestByText(items, (item) => getItemName(item.id, item.name, language));
        return (
          <View key={language} style={styles.languageSection}>
            <Text style={styles.languageTitle}>
              {language === 'en' ? copy.labelSizes.languageEnglish : copy.labelSizes.languagePortuguese}
            </Text>
            <View style={styles.grid}>
              {LABEL_TEMPLATES.flatMap((template) => [
                <VerificationCase
                  key={`${language}-${template.id}-database`}
                  caseName={languageCopy.labelSizes.databaseItem}
                  itemId={databaseItem?.id}
                  itemName={databaseItem?.name ?? languageCopy.labelSizes.noDatabaseItems}
                  language={language}
                  settings={settings}
                  staffName={longestStaff}
                  template={template}
                />,
                <VerificationCase
                  key={`${language}-${template.id}-custom`}
                  caseName={languageCopy.labelSizes.customItem}
                  itemName={languageCopy.labelSizes.customItemValue}
                  language={language}
                  settings={settings}
                  staffName={longestStaff}
                  template={template}
                />,
              ])}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

function VerificationCase({
  caseName,
  itemId,
  itemName,
  language,
  settings,
  staffName,
  template,
}: {
  caseName: string;
  itemId?: string;
  itemName: string;
  language: Language;
  settings: AppSettings;
  staffName: string;
  template: LabelTemplate;
}) {
  const copy = getCopy(language);
  const localizedSettings: AppSettings = {
    ...settings,
    language,
    dateOrder: language === 'pt-BR' ? 'DD/MM/YYYY' : 'MM/DD/YYYY',
    timeFormat: language === 'pt-BR' ? '24h' : '12h',
    spellOutMonth: true,
    labelWidthMm: template.widthMm,
    labelHeightMm: template.heightMm,
  };
  const label = {
    itemId,
    itemName,
    form: 'In shell',
    storageType: 'Frozen',
    madeAt: VERIFICATION_MADE_AT,
    useByAt: VERIFICATION_USE_BY_AT,
    staffName,
    labelWidthMm: template.widthMm,
    labelHeightMm: template.heightMm,
  };
  const fields = buildFittedLabelFields({ template, label, settings: localizedSettings, language });
  const hasTruncation = fields.some((field) => field.truncated);

  return (
    <View style={styles.caseCard}>
      <View style={styles.caseHeading}>
        <Text style={styles.caseTitle}>{copy.labelSizes[template.id]} · {caseName}</Text>
        <Text style={[styles.fitStatus, hasTruncation && styles.truncatedStatus]}>
          {hasTruncation ? copy.labelSizes.fitTruncated : copy.labelSizes.fitPassed}
        </Text>
      </View>
      <LabelPreview
        compact
        label={label}
        languageOverride={language}
        maxWidthOverride={sizes.templateVerificationPreviewWidth}
        settingsOverride={localizedSettings}
        shelfLife={null}
      />
    </View>
  );
}

function longestByText<T>(values: readonly T[], getText: (value: T) => string): T | undefined {
  return values.reduce<T | undefined>((longest, value) => {
    if (!longest) return value;
    return getText(value).length > getText(longest).length ? value : longest;
  }, undefined);
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl, padding: spacing.xs },
  heading: { gap: spacing.xs },
  title: { ...typography.h2, color: colors.ink },
  hint: { ...typography.body, color: colors.muted },
  dataNote: { ...typography.caption, color: colors.muted },
  message: { ...typography.body, color: colors.muted },
  error: { ...typography.bodyStrong, color: colors.dangerDark },
  languageSection: { gap: spacing.md },
  languageTitle: { ...typography.h3, color: colors.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: spacing.md },
  caseCard: {
    width: sizes.templateVerificationCardWidth,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceRaised,
  },
  caseHeading: { gap: spacing.xxs },
  caseTitle: { ...typography.bodyStrong, color: colors.ink },
  fitStatus: { ...typography.caption, color: colors.primaryDark },
  truncatedStatus: { color: colors.warning },
});
