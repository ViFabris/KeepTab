import { StyleSheet, Text, View } from 'react-native';
import { Scale } from 'lucide-react-native';

import { BigButton } from '../components/BigButton';
import { Card } from '../components/Card';
import { useLanguage } from '../i18n/LanguageContext';
import { colors, sizes, spacing, typography } from '../theme';

export function LegalNoticePanel({ onAcknowledge }: { onAcknowledge?: () => void }) {
  const { copy } = useLanguage();
  return (
    <Card style={styles.card}>
      <View style={styles.heading}>
        <Scale color={colors.primary} size={sizes.iconLg} strokeWidth={2} />
        <Text style={styles.title}>{copy.foodSafety.legalNotice}</Text>
      </View>
      <Text style={styles.body}>{copy.foodSafety.legalNoticeBody}</Text>
      <Text style={styles.notice}>{copy.foodSafety.municipalNotice}</Text>
      {onAcknowledge ? (
        <BigButton label={copy.foodSafety.acknowledgeNotice} onPress={onAcknowledge} />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md, padding: spacing.lg },
  heading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...typography.h2, flex: 1, color: colors.ink },
  body: { ...typography.body, color: colors.ink },
  notice: { ...typography.bodyStrong, color: colors.warning },
});
