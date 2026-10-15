import { AlertTriangle } from 'lucide-react-native';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useLanguage } from '../i18n/LanguageContext';
import { colors, radii, sizes, spacing, typography } from '../theme';

export function SafetyBanner({ compact = false, style }: { compact?: boolean; style?: StyleProp<ViewStyle> }) {
  const { copy } = useLanguage();
  return (
    <View style={[styles.banner, compact && styles.compact, style]}>
      <AlertTriangle color={colors.warning} size={compact ? sizes.iconSm : sizes.iconMd} strokeWidth={2} />
      <View style={styles.copy}>
        <Text style={[styles.title, compact && styles.compactTitle]}>{copy.safetyTitle}</Text>
        <Text style={[styles.body, compact && styles.compactBody]}>{copy.safetyBody}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radii.md,
    backgroundColor: colors.warningBackground,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  copy: { flex: 1 },
  compact: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  title: { ...typography.overline, color: colors.warning },
  compactTitle: { ...typography.caption, color: colors.warning },
  body: { ...typography.caption, marginTop: spacing.xxs, color: colors.warning },
  compactBody: { ...typography.caption },
});
