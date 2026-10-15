import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '../theme';

export function StepProgress({ label, current, total }: { label: string; current: number; total: number }) {
  return (
    <View accessibilityLabel={label} style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(0, Math.min(100, (current / total) * 100))}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { minWidth: 180, gap: spacing.xs },
  label: { ...typography.caption, color: colors.muted, textAlign: 'right' },
  track: { height: 6, overflow: 'hidden', borderRadius: radii.pill, backgroundColor: colors.secondarySoft },
  fill: { height: '100%', borderRadius: radii.pill, backgroundColor: colors.primary },
});
