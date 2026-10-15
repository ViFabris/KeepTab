import { StyleSheet, View } from 'react-native';

import type { SelectableOption } from '../types';
import { BigButton } from './BigButton';
import { PageHeader } from './PageHeader';

interface OptionStepProps<T extends string> {
  title: string;
  subtitle: string;
  options: SelectableOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export function OptionStep<T extends string>({
  title,
  subtitle,
  options,
  selected,
  onSelect,
  onConfirm,
  onBack,
}: OptionStepProps<T>) {
  return (
    <View style={styles.container}>
      <PageHeader title={title} subtitle={subtitle} />
      <View style={styles.choices}>
        {options.map((option) => (
          <BigButton
            key={option.value}
            label={option.value}
            onPress={() => onSelect(option.value)}
            selected={selected === option.value}
            variant="choice"
            style={styles.choice}
          />
        ))}
      </View>
      <View style={styles.actions}>
        <BigButton label="Back" onPress={onBack} variant="secondary" style={styles.back} />
        <BigButton
          label={`Use ${selected}`}
          onPress={onConfirm}
          style={styles.confirm}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  choices: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 18 },
  choice: { flex: 1, minHeight: 120 },
  actions: { flexDirection: 'row', gap: 16 },
  back: { width: 180 },
  confirm: { flex: 1 },
});
