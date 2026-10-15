import { StyleSheet } from 'react-native';

import { Input } from '../components/Input';
import { spacing, typography } from '../theme';
import { sanitizePin } from './pin';

export function PinInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Input
      accessibilityLabel={label}
      containerStyle={styles.field}
      keyboardType="number-pad"
      label={label}
      maxLength={6}
      onChangeText={(text) => onChange(sanitizePin(text))}
      secureTextEntry
      style={styles.input}
      value={value}
    />
  );
}

const styles = StyleSheet.create({
  field: { flex: 1 },
  input: {
    ...typography.h2,
    letterSpacing: spacing.xs,
    textAlign: 'center',
  },
});
