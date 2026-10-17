import { StyleSheet, Text, View } from 'react-native';

import { OptionChip } from '../components/OptionChip';
import { Input } from '../components/Input';
import { defaultsForLanguage } from '../database/settingsRepository';
import { getLanguageName } from '../i18n';
import { useLanguage } from '../i18n/LanguageContext';
import { colors, sizes, spacing, typography } from '../theme';
import type { AppSettings, DateOrder, Jurisdiction, Language, TimeFormat, VerificationMode } from '../types';

export function PreferencesEditor({
  settings,
  onChange,
  applyLanguageDefaults = false,
}: {
  settings: AppSettings;
  onChange: (patch: Partial<AppSettings>) => void;
  applyLanguageDefaults?: boolean;
}) {
  const { copy } = useLanguage();

  function changeLanguage(language: Language) {
    onChange({
      language,
      ...(applyLanguageDefaults ? defaultsForLanguage(language) : {}),
    });
  }

  return (
    <View style={styles.container}>
      <ChoiceGroup
        label={copy.setup.language}
        values={(['pt-BR', 'en'] as Language[]).map((value) => ({
          value,
          label: getLanguageName(value),
        }))}
        selected={settings.language}
        onSelect={changeLanguage}
      />
      <ChoiceGroup
        label={copy.setup.dateOrder}
        values={(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] as DateOrder[]).map(
          (value) => ({ value, label: value }),
        )}
        selected={settings.dateOrder}
        onSelect={(dateOrder) => onChange({ dateOrder })}
      />
      <ChoiceGroup
        label={copy.setup.timeFormat}
        values={[
          { value: '12h' as const, label: copy.setup.twelveHour },
          { value: '24h' as const, label: copy.setup.twentyFourHour },
        ]}
        selected={settings.timeFormat}
        onSelect={(timeFormat: TimeFormat) => onChange({ timeFormat })}
      />
      <View style={styles.toggleRow}>
        <View style={styles.toggleCopy}>
          <Text style={styles.label}>{copy.setup.spellMonth}</Text>
          <Text style={styles.hint}>{copy.setup.spellMonthHint}</Text>
        </View>
        <OptionChip
          label={settings.spellOutMonth ? copy.setup.on : copy.setup.off}
          onPress={() => onChange({ spellOutMonth: !settings.spellOutMonth })}
          selected={settings.spellOutMonth}
          style={styles.toggleButton}
        />
      </View>
      <ChoiceGroup
        label={copy.foodSafety.state}
        values={[
          { value: 'RS' as const, label: copy.foodSafety.rioGrandeDoSul },
          { value: 'OTHER' as const, label: copy.foodSafety.otherState },
        ]}
        selected={settings.jurisdiction}
        onSelect={(jurisdiction: Jurisdiction) => onChange({ jurisdiction })}
      />
      <Text style={styles.hint}>{copy.foodSafety.jurisdictionHint}</Text>
      {settings.jurisdiction === 'OTHER' ? (
        <Text style={styles.notice}>{copy.foodSafety.otherStateNotice}</Text>
      ) : null}
      <Text style={styles.notice}>{copy.foodSafety.municipalNotice}</Text>
      <View style={styles.toggleRow}>
        <View style={styles.toggleCopy}>
          <Text style={styles.label}>{copy.foodSafety.fridgeAssumption}</Text>
          <Text style={styles.hint}>{copy.foodSafety.fridgeAssumptionHint}</Text>
        </View>
        <OptionChip
          label={settings.fridgeAtOrBelow4C ? copy.setup.on : copy.setup.off}
          onPress={() => onChange({ fridgeAtOrBelow4C: !settings.fridgeAtOrBelow4C })}
          selected={settings.fridgeAtOrBelow4C}
          style={styles.toggleButton}
        />
      </View>
      {!settings.fridgeAtOrBelow4C ? (
        <Input
          accessibilityLabel={copy.foodSafety.reducedMaximumDays}
          keyboardType="number-pad"
          label={copy.foodSafety.reducedMaximumDays}
          onChangeText={(value) => {
            const days = Number(value);
            if (Number.isInteger(days) && days > 0) onChange({ reducedMaximumDays: days });
          }}
          value={String(settings.reducedMaximumDays)}
        />
      ) : null}
      <ChoiceGroup
        label={copy.foodSafety.verificationMode}
        values={[
          { value: 'strict' as const, label: copy.foodSafety.strictMode },
          { value: 'test' as const, label: copy.foodSafety.testMode },
        ]}
        selected={settings.verificationMode}
        onSelect={(verificationMode: VerificationMode) => onChange({ verificationMode })}
      />
      <Text style={styles.hint}>
        {settings.verificationMode === 'strict'
          ? copy.foodSafety.strictModeHint
          : copy.foodSafety.testModeHint}
      </Text>
    </View>
  );
}

function ChoiceGroup<T extends string>({
  label,
  values,
  selected,
  onSelect,
}: {
  label: string;
  values: { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.choices}>
        {values.map((choice) => (
          <OptionChip
            key={choice.value}
            label={choice.label}
            onPress={() => onSelect(choice.value)}
            selected={selected === choice.value}
            style={styles.choice}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  group: { gap: spacing.xs },
  label: { ...typography.bodyStrong, color: colors.ink },
  hint: { ...typography.caption, marginTop: spacing.xxs, color: colors.muted },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  choice: { flex: 1, minWidth: 150, minHeight: sizes.tapMin },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  toggleCopy: { flex: 1 },
  toggleButton: { width: sizes.control * 3, minHeight: sizes.tapMin },
  notice: { ...typography.caption, color: colors.warning },
});
