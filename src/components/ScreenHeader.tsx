import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../theme';

export function ScreenHeader({ title, subtitle, eyebrow, action }: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.xl },
  copy: { flex: 1 },
  eyebrow: { ...typography.overline, color: colors.primary, marginBottom: spacing.xs },
  title: { ...typography.h1, color: colors.ink },
  subtitle: { ...typography.body, marginTop: spacing.xs, color: colors.muted, maxWidth: 820 },
});
