import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts, spacing, typography } from '../theme';

type LogoSize = 'small' | 'medium' | 'large';

const dimensions = {
  small: { mark: 42, wordmark: 23, gap: spacing.sm },
  medium: { mark: 62, wordmark: 34, gap: spacing.md },
  large: { mark: 100, wordmark: 54, gap: spacing.lg },
} as const;

export function Logo({ size = 'medium', tagline, style }: {
  size?: LogoSize;
  tagline?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const metrics = dimensions[size];
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.lockup, { gap: metrics.gap }]}>
        <View style={[styles.markWindow, { width: metrics.mark, height: metrics.mark }]}>
          <Image
            accessibilityIgnoresInvertColors
            source={require('../../assets/brand/keeptab-mark.png')}
            resizeMode="stretch"
            style={[
              styles.mark,
              {
                width: metrics.mark * 1.895,
                height: metrics.mark * 1.679,
                left: metrics.mark * -0.463,
                top: metrics.mark * -0.363,
              },
            ]}
          />
        </View>
        <Text style={[styles.wordmark, { fontSize: metrics.wordmark }]}>Keep Tab</Text>
      </View>
      {tagline ? <Text style={styles.tagline}>{tagline}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: 'flex-start' },
  lockup: { flexDirection: 'row', alignItems: 'center' },
  markWindow: { overflow: 'hidden' },
  mark: { position: 'absolute' },
  wordmark: { color: colors.ink, fontFamily: fonts.extraBold, letterSpacing: -1.4 },
  tagline: { ...typography.overline, marginTop: spacing.sm, color: colors.muted },
});
