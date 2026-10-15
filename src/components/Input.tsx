import { Search } from 'lucide-react-native';
import { forwardRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { colors, radii, sizes, spacing, typography } from '../theme';

export const Input = forwardRef<TextInput, TextInputProps & {
  label?: string;
  icon?: 'search';
  containerStyle?: StyleProp<ViewStyle>;
}>(function Input({ label, icon, containerStyle, style, placeholderTextColor, ...props }, ref) {
  return (
    <View style={[styles.field, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputWrap}>
        {icon === 'search' ? <Search color={colors.secondary} size={sizes.iconMd} strokeWidth={2} /> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={placeholderTextColor ?? colors.muted}
          style={[styles.input, style]}
          {...props}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { ...typography.bodyStrong, color: colors.ink },
  inputWrap: {
    minHeight: sizes.control,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceRaised,
  },
  input: { ...typography.body, flex: 1, minWidth: 0, color: colors.ink, paddingVertical: spacing.sm },
});
