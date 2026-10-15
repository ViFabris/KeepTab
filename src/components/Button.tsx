import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radii, sizes, spacing, typography } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
  leading?: ReactNode;
  accessibilityLabel?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  selected = false,
  style,
  leading,
  accessibilityLabel,
}: ButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        selected && styles.selected,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {leading}
      <Text
        numberOfLines={2}
        style={[
          styles.label,
          variant === 'secondary' && styles.darkLabel,
          variant === 'ghost' && styles.darkLabel,
          selected && styles.selectedLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.primary, borderColor: colors.primary },
  secondary: { backgroundColor: colors.secondarySoft, borderColor: colors.secondary },
  destructive: { backgroundColor: colors.danger, borderColor: colors.danger },
  ghost: { backgroundColor: colors.transparent, borderColor: colors.border },
});

const styles = StyleSheet.create({
  base: {
    minHeight: sizes.tapMin,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  label: { ...typography.button, color: colors.background, textAlign: 'center' },
  darkLabel: { color: colors.ink },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  selectedLabel: { color: colors.background },
  disabled: { backgroundColor: colors.disabled, borderColor: colors.disabled, opacity: 0.72 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
});
