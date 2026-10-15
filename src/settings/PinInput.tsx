import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '../theme';
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
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        keyboardType="number-pad"
        maxLength={6}
        onChangeText={(text) => onChange(sanitizePin(text))}
        secureTextEntry
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flex: 1, gap: 7 },
  label: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  input: {
    minHeight: 66,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 13,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: 8,
    textAlign: 'center',
  },
});
