import { ScrollView, StyleSheet, View } from 'react-native';

import { getLabelOptionName } from '../i18n';
import { useLanguage } from '../i18n/LanguageContext';
import type { ItemLabelOption } from '../types';
import { BigButton } from './BigButton';
import { OptionChip } from './OptionChip';
import { PageHeader } from './PageHeader';
import { spacing } from '../theme';

interface OptionStepProps {
  title: string;
  subtitle: string;
  options: ItemLabelOption[];
  selected: ItemLabelOption;
  onSelect: (value: ItemLabelOption) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export function OptionStep({
  title,
  subtitle,
  options,
  selected,
  onSelect,
  onConfirm,
  onBack,
}: OptionStepProps) {
  const { language, copy } = useLanguage();
  const selectedLabel = getLabelOptionName(selected, language);
  return (
    <View style={styles.container}>
      <PageHeader title={title} subtitle={subtitle} />
      <ScrollView style={styles.choiceScroller} contentContainerStyle={styles.choices}>
        {options.map((option) => (
          <OptionChip
            key={option.id}
            label={getLabelOptionName(option, language)}
            onPress={() => onSelect(option)}
            selected={selected.id === option.id}
            style={styles.choice}
          />
        ))}
      </ScrollView>
      <View style={styles.actions}>
        <BigButton label={copy.back} onPress={onBack} variant="secondary" style={styles.back} />
        <BigButton
          label={copy.confirmChoice(selectedLabel)}
          onPress={onConfirm}
          style={styles.confirm}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  choiceScroller: { flex: 1 },
  choices: { flexGrow: 1, flexDirection: 'row', flexWrap: 'wrap', alignContent: 'center', gap: spacing.md },
  choice: { flexGrow: 1, flexBasis: '30%', minWidth: 190, minHeight: 88 },
  actions: { flexDirection: 'row', gap: spacing.md },
  back: { width: 180 },
  confirm: { flex: 1 },
});
