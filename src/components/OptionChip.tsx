import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { Button } from './Button';

export function OptionChip({ label, selected, onPress, leading, style }: {
  label: string;
  selected: boolean;
  onPress: () => void;
  leading?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <Button label={label} onPress={onPress} variant="ghost" selected={selected} leading={leading} style={style} />;
}
