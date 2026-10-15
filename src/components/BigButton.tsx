import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { Button } from './Button';

type LegacyVariant = 'primary' | 'secondary' | 'danger' | 'choice';

export function BigButton({
  label,
  onPress,
  variant = 'primary',
  selected = false,
  disabled = false,
  style,
  leading,
}: {
  label: string;
  onPress: () => void;
  variant?: LegacyVariant;
  selected?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  leading?: ReactNode;
}) {
  return (
    <Button
      label={label}
      onPress={onPress}
      variant={variant === 'danger' ? 'destructive' : variant === 'choice' ? 'ghost' : variant}
      selected={selected}
      disabled={disabled}
      style={style}
      leading={leading}
    />
  );
}
