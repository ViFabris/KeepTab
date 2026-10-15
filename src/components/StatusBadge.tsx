import { AlertTriangle, CalendarClock, CircleCheck } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, sizes, spacing, typography } from '../theme';

export type StatusTone = 'danger' | 'warning' | 'fine';

export function StatusBadge({ label, tone }: { label: string; tone: StatusTone }) {
  const Icon = tone === 'danger' ? AlertTriangle : tone === 'warning' ? CalendarClock : CircleCheck;
  const palette = palettes[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.background }]}>
      <Icon color={palette.foreground} size={sizes.iconSm} strokeWidth={2} />
      <Text style={[styles.label, { color: palette.foreground }]}>{label}</Text>
    </View>
  );
}

const palettes = {
  danger: { foreground: colors.dangerDark, background: colors.dangerSoft },
  warning: { foreground: colors.warning, background: colors.accentSoft },
  fine: { foreground: colors.primaryDark, background: colors.primarySoft },
};

const styles = StyleSheet.create({
  badge: {
    minHeight: 32,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  label: { ...typography.caption, fontFamily: typography.bodyStrong.fontFamily },
});
