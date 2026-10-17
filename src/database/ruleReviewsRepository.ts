import type { SQLiteDatabase } from 'expo-sqlite';

export interface RuleReview {
  ruleId: string;
  reviewedOn: string;
  reviewedBy: string;
}

export async function getRuleReviews(db: SQLiteDatabase): Promise<Record<string, RuleReview>> {
  const rows = await db.getAllAsync<{ rule_id: string; reviewed_on: string; reviewed_by: string }>(
    'SELECT rule_id, reviewed_on, reviewed_by FROM rule_reviews',
  );
  return Object.fromEntries(rows.map((row) => [row.rule_id, {
    ruleId: row.rule_id,
    reviewedOn: row.reviewed_on,
    reviewedBy: row.reviewed_by,
  }]));
}

export async function saveRuleReview(
  db: SQLiteDatabase,
  ruleId: string,
  reviewedBy: string,
  reviewedOn: string,
): Promise<void> {
  if (!reviewedBy.trim() || !reviewedOn.trim()) throw new Error('RULE_REVIEW_REQUIRED');
  await db.runAsync(
    `INSERT INTO rule_reviews (rule_id, reviewed_on, reviewed_by) VALUES (?, ?, ?)
     ON CONFLICT(rule_id) DO UPDATE SET
       reviewed_on = excluded.reviewed_on,
       reviewed_by = excluded.reviewed_by`,
    ruleId,
    reviewedOn.trim(),
    reviewedBy.trim(),
  );
}
