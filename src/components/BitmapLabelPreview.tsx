import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { bitmapToSvgPath, type MonochromeBitmap } from '../printing/bitmap';
import { colors, radii, sizes, spacing } from '../theme';
import { Card } from './Card';

export function BitmapLabelPreview({
  bitmap,
  compact = false,
  maxWidthOverride,
}: {
  bitmap: MonochromeBitmap;
  compact?: boolean;
  maxWidthOverride?: number;
}) {
  const window = useWindowDimensions();
  const widthLimit = maxWidthOverride ?? Math.min(
    window.width - sizes.sidebar - spacing.huge,
    compact ? sizes.labelPreviewCompactMaxWidth : sizes.labelPreviewMaxWidth,
  );
  const heightLimit = compact ? sizes.labelPreviewCompactMaxHeight : sizes.labelPreviewMaxHeight;
  const scale = Math.min(widthLimit / bitmap.width, heightLimit / bitmap.height);
  const path = useMemo(() => bitmapToSvgPath(bitmap), [bitmap]);
  return (
    <Card style={styles.previewCard}>
      <Svg
        height={bitmap.height * scale}
        viewBox={`0 0 ${bitmap.width} ${bitmap.height}`}
        width={bitmap.width * scale}
      >
        <Rect fill={colors.monochromeSurface} height={bitmap.height} width={bitmap.width} />
        <Path d={path} fill={colors.monochromeBlack} />
        <Rect fill="none" height={bitmap.height} stroke={colors.monochromeBlack} width={bitmap.width} />
      </Svg>
    </Card>
  );
}

const styles = StyleSheet.create({
  previewCard: { alignSelf: 'center', padding: spacing.lg, borderRadius: radii.xs },
});
