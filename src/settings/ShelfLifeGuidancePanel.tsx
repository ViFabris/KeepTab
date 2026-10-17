import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { useLanguage } from '../i18n/LanguageContext';
import {
  FROZEN_GUIDANCE,
  guidanceRequiresExactChoice,
  REFRIGERATED_GUIDANCE,
  type ShelfLifeGuidanceEntry,
} from '../rules/shelfLifeGuidance';
import { colors, spacing, typography } from '../theme';

export function ShelfLifeGuidancePanel() {
  const { language, copy } = useLanguage();
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.noticeCard}>
        <StatusBadge label={copy.foodSafety.unverified} tone="warning" />
        <Text style={styles.notice}>{copy.foodSafety.shelfLifeGuidanceNotice}</Text>
      </Card>
      <GuidanceGroup title={copy.foodSafety.refrigeratedGuidance} entries={REFRIGERATED_GUIDANCE} />
      <GuidanceGroup title={copy.foodSafety.frozenGuidance} entries={FROZEN_GUIDANCE} />
    </ScrollView>
  );

  function GuidanceGroup({ title, entries }: { title: string; entries: ShelfLifeGuidanceEntry[] }) {
    return (
      <View style={styles.group}>
        <Text style={styles.heading}>{title}</Text>
        <View style={styles.grid}>
          {entries.map((entry) => (
            <Card key={entry.id} style={styles.entry}>
              <Text style={styles.entryTitle}>{entry.category?.[language] ?? entry.temperatureText[language]}</Text>
              {entry.category ? <Text style={styles.temperature}>{entry.temperatureText[language]}</Text> : null}
              {entry.examples ? <Text style={styles.meta}>{entry.examples[language]}</Text> : null}
              <Text style={styles.value}>{entry.wording[language]}</Text>
              {guidanceRequiresExactChoice(entry) ? (
                <Text style={styles.warning}>{copy.foodSafety.exactValueRequired}</Text>
              ) : null}
              <Text style={styles.meta}>
                {copy.foodSafety.source}: {entry.sourceType === 'third-party-reference'
                  ? copy.foodSafety.thirdPartySource
                  : copy.foodSafety.userSuppliedSource}
              </Text>
              {entry.relatedRuleIds.length ? (
                <Text style={styles.meta}>{copy.foodSafety.relatedRules}: {entry.relatedRuleIds.join(', ')}</Text>
              ) : null}
            </Card>
          ))}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { gap: spacing.xl, paddingBottom: spacing.xl },
  noticeCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.md },
  notice: { ...typography.body, flex: 1, color: colors.warning },
  group: { gap: spacing.md },
  heading: { ...typography.h2, color: colors.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  entry: { width: '48%', minWidth: 320, gap: spacing.xs, padding: spacing.md },
  entryTitle: { ...typography.h3, color: colors.ink },
  temperature: { ...typography.bodyStrong, color: colors.primaryDark },
  value: { ...typography.bodyStrong, color: colors.ink },
  meta: { ...typography.caption, color: colors.muted },
  warning: { ...typography.caption, color: colors.warning },
});
