import { StyleSheet, Text, View } from 'react-native';

import { BigButton } from '../components/BigButton';
import { defaultsForLanguage } from '../database/settingsRepository';
import { getLanguageName } from '../i18n';
import { useLanguage } from '../i18n/LanguageContext';
import { colors } from '../theme';
import type { AppSettings, DateOrder, Language, TimeFormat } from '../types';

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
        <BigButton
          label={settings.spellOutMonth ? copy.setup.on : copy.setup.off}
          onPress={() => onChange({ spellOutMonth: !settings.spellOutMonth })}
          selected={settings.spellOutMonth}
          variant="choice"
          style={styles.toggleButton}
        />
      </View>
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
          <BigButton
            key={choice.value}
            label={choice.label}
            onPress={() => onSelect(choice.value)}
            selected={selected === choice.value}
            variant="choice"
            style={styles.choice}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 18 },
  group: { gap: 8 },
  label: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  hint: { marginTop: 3, color: colors.muted, fontSize: 15, lineHeight: 20 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  choice: { flex: 1, minWidth: 150, minHeight: 58 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  toggleCopy: { flex: 1 },
  toggleButton: { width: 180, minHeight: 58 },
});
