import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { colors } from '../theme';

export function BrandShapes({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <Svg accessibilityElementsHidden height="180" viewBox="0 0 220 180" width="220" style={style}>
      <Path d="M18 22h88a38 38 0 0 1 38 38v24H18z" fill={colors.primary} opacity={0.13} />
      <Rect x="104" y="76" width="92" height="46" rx="23" fill={colors.accent} opacity={0.24} transform="rotate(42 150 99)" />
      <Rect x="26" y="98" width="72" height="72" rx="28" fill={colors.secondary} opacity={0.18} />
    </Svg>
  );
}
