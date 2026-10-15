import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, layout } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'choice';

interface BigButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  selected?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  leading?: ReactNode;
}

export function BigButton({
  label,
  onPress,
  variant = 'primary',
  selected = false,
  disabled = false,
  style,
  leading,
}: BigButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        variant === 'choice' && selected && styles.choiceSelected,
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
          variant === 'secondary' && styles.secondaryLabel,
          variant === 'choice' && styles.choiceLabel,
          variant === 'choice' && selected && styles.choiceSelectedLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.primary, borderColor: colors.primary },
  secondary: { backgroundColor: colors.surface, borderColor: colors.border },
  danger: { backgroundColor: colors.danger, borderColor: colors.danger },
  choice: { backgroundColor: colors.surface, borderColor: colors.border },
});

const styles = StyleSheet.create({
  base: {
    minHeight: layout.tapHeight,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: layout.radius,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  label: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  secondaryLabel: { color: colors.ink },
  choiceLabel: { color: colors.ink },
  choiceSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderWidth: 4,
  },
  choiceSelectedLabel: { color: colors.primaryDark },
  disabled: { backgroundColor: colors.disabled, borderColor: colors.disabled, opacity: 0.75 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
});
