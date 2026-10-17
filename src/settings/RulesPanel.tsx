import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { BigButton } from '../components/BigButton';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { StatusBadge } from '../components/StatusBadge';
import { getRuleReviews, saveRuleReview, type RuleReview } from '../database/ruleReviewsRepository';
import { useLanguage } from '../i18n/LanguageContext';
import { getRulesForJurisdiction, RULES_VERSION, type FoodSafetyRule } from '../rules/rules';
import { useSettings } from './SettingsContext';
import { colors, spacing, typography } from '../theme';

export function RulesPanel() {
  const db = useSQLiteContext();
  const { language, copy } = useLanguage();
  const { settings } = useSettings();
  const [reviews, setReviews] = useState<Record<string, RuleReview>>({});
  const [reviewer, setReviewer] = useState('');
  const [reviewDate, setReviewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');
  const load = useCallback(async () => setReviews(await getRuleReviews(db)), [db]);
  useEffect(() => { void load().catch(() => setError(copy.settings.settingsError)); }, [copy.settings.settingsError, load]);

  const groups = useMemo(() => {
    const grouped = new Map<string, FoodSafetyRule[]>();
    for (const rule of getRulesForJurisdiction(settings.jurisdiction)) {
      const sources = rule.sources.filter((source) =>
        settings.jurisdiction === 'RS' || !source.law.includes('Portaria SES'),
      );
      for (const source of sources) {
        grouped.set(source.law, [...(grouped.get(source.law) ?? []), rule]);
      }
    }
    return [...grouped.entries()];
  }, [copy.foodSafety.ruleSource, settings.jurisdiction]);

  async function review(rule: FoodSafetyRule) {
    try {
      await saveRuleReview(db, rule.id, reviewer, reviewDate);
      await load();
    } catch {
      setError(copy.settings.settingsError);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.version}>{copy.foodSafety.rulesVersion}: {RULES_VERSION}</Text>
      <Text style={styles.notice}>{copy.foodSafety.municipalNotice}</Text>
      <Text style={styles.notice}>{copy.foodSafety.englishInformalNotice}</Text>
      {settings.jurisdiction === 'OTHER' ? <Text style={styles.notice}>{copy.foodSafety.otherStateNotice}</Text> : null}
      <View style={styles.inputs}>
        <Input label={copy.foodSafety.reviewerName} onChangeText={setReviewer} value={reviewer} containerStyle={styles.flex} />
        <Input label={copy.foodSafety.reviewDate} onChangeText={setReviewDate} value={reviewDate} containerStyle={styles.flex} />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <ScrollView contentContainerStyle={styles.list}>
        {groups.map(([source, rules]) => (
          <View key={source} style={styles.group}>
            <Text style={styles.groupTitle}>{source}</Text>
            {rules.map((rule) => {
              const saved = reviews[rule.id];
              return (
                <Card key={rule.id} style={styles.ruleCard}>
                  <View style={styles.heading}>
                    <View style={styles.flex}>
                      <Text style={styles.ruleId}>{rule.id}</Text>
                      <Text style={styles.title}>{rule.title[language]}</Text>
                    </View>
                    <StatusBadge label={rule.enforced ? copy.foodSafety.enforced : copy.foodSafety.informational} tone={rule.enforced ? 'fine' : 'warning'} />
                  </View>
                  <Text style={styles.body}>{rule.summary[language]}</Text>
                  <Text style={styles.meta}>{copy.foodSafety.ruleSource}: {rule.sources.filter((item) => settings.jurisdiction === 'RS' || !item.law.includes('Portaria SES')).map((item) => `${item.law} · ${item.itemNumber}`).join(' | ')}</Text>
                  <Text style={styles.meta}>{copy.foodSafety.enforcedIn}: {localizeEnforcedIn(rule.enforcedIn, copy.foodSafety)}</Text>
                  <Text style={styles.meta}>{rule.appliesTo[language]}</Text>
                  {saved ? <Text style={styles.review}>{copy.foodSafety.reviewedBy}: {saved.reviewedBy} · {saved.reviewedOn}</Text> : null}
                  <BigButton label={copy.foodSafety.recordReview} onPress={() => void review(rule)} disabled={!reviewer.trim() || !reviewDate.trim()} variant="secondary" />
                </Card>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0, gap: spacing.sm },
  version: { ...typography.bodyStrong, color: colors.ink },
  notice: { ...typography.caption, color: colors.warning },
  inputs: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  error: { ...typography.caption, color: colors.dangerDark },
  list: { gap: spacing.xl, paddingBottom: spacing.xl },
  group: { gap: spacing.sm },
  groupTitle: { ...typography.h2, color: colors.ink },
  ruleCard: { gap: spacing.sm, padding: spacing.md },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  ruleId: { ...typography.caption, color: colors.primaryDark },
  title: { ...typography.h3, color: colors.ink },
  body: { ...typography.body, color: colors.ink },
  meta: { ...typography.caption, color: colors.muted },
  review: { ...typography.bodyStrong, color: colors.primaryDark },
});

function localizeEnforcedIn(value: string, copy: ReturnType<typeof useLanguage>['copy']['foodSafety']): string {
  if (value === 'Informational') return copy.informational;
  if (value === 'Phase 1') return copy.phase1;
  if (value === 'Phase 1 (storage rule)') return `${copy.phase1} · ${copy.storageRule}`;
  if (value === 'Phase 2') return copy.phase2;
  if (value.startsWith('Phase 3')) return copy.phase3;
  return value;
}
