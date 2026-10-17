import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { PackagePlus } from 'lucide-react-native';

import { BigButton } from '../components/BigButton';
import { Card } from '../components/Card';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ItemRegistrationModal } from '../components/ItemRegistrationModal';
import { OptionChip } from '../components/OptionChip';
import { archiveKitchenItem, getItems, updateItemSafety } from '../database/itemsRepository';
import { getLabelOptionName } from '../i18n';
import { useLanguage } from '../i18n/LanguageContext';
import { colors, sizes, spacing, typography } from '../theme';
import type { KitchenItem, PlantBasedType } from '../types';

interface ItemDraft {
  plantBasedType: PlantBasedType;
  heatTreated: boolean;
}

export function ItemAdminPanel() {
  const db = useSQLiteContext();
  const { language, copy } = useLanguage();
  const [items, setItems] = useState<KitchenItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, ItemDraft>>({});
  const [registrationVisible, setRegistrationVisible] = useState(false);
  const [removeItem, setRemoveItem] = useState<KitchenItem | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const loaded = await getItems(db);
    setItems(loaded);
    setDrafts(Object.fromEntries(loaded.map((item) => [item.id, {
      plantBasedType: item.plantBasedType,
      heatTreated: item.heatTreated,
    }])));
  }, [db]);

  useEffect(() => {
    void load().catch(() => setError(copy.settings.settingsError));
  }, [copy.settings.settingsError, load]);

  async function saveItem(item: KitchenItem) {
    const draft = drafts[item.id];
    if (!draft) return;
    setError('');
    try {
      await updateItemSafety(db, item.id, {
        plantBasedType: draft.plantBasedType,
        heatTreated: draft.plantBasedType === 'none' ? false : draft.heatTreated,
        manufacturerDaysAfterOpen: item.manufacturerDaysAfterOpen,
        source: item.source,
      });
      await load();
    } catch {
      setError(copy.settings.settingsError);
    }
  }

  async function removeConfirmed() {
    if (!removeItem) return;
    try {
      await archiveKitchenItem(db, removeItem.id);
      setRemoveItem(null);
      await load();
    } catch {
      setError(copy.settings.settingsError);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={styles.title}>{copy.foodSafety.items}</Text>
          <Text style={styles.body}>{copy.foodSafety.emptyCatalog}</Text>
        </View>
        <BigButton
          label={copy.foodSafety.registerItem}
          onPress={() => setRegistrationVisible(true)}
          variant="secondary"
          style={styles.registerButton}
          leading={<PackagePlus color={colors.ink} size={sizes.iconMd} strokeWidth={2} />}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <ScrollView contentContainerStyle={styles.list}>
        {items.map((item) => {
          const draft = drafts[item.id];
          if (!draft) return null;
          return (
            <Card key={item.id} style={styles.itemCard}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.meta}>
                {copy.formQuestion}: {item.formOptions.map((option) => getLabelOptionName(option, language)).join(', ')}
              </Text>
              <Text style={styles.meta}>
                {copy.storageQuestion}: {item.storageOptions.map((option) => getLabelOptionName(option, language)).join(', ')}
              </Text>
              <Text style={styles.label}>{copy.foodSafety.plantBasedType}</Text>
              <View style={styles.choices}>
                {(['none', 'drink', 'food'] as PlantBasedType[]).map((value) => (
                  <OptionChip
                    key={value}
                    label={value === 'none' ? copy.foodSafety.plantNone : value === 'drink' ? copy.foodSafety.plantDrink : copy.foodSafety.plantFood}
                    onPress={() => setDrafts((current) => ({ ...current, [item.id]: { ...draft, plantBasedType: value } }))}
                    selected={draft.plantBasedType === value}
                    style={styles.choice}
                  />
                ))}
              </View>
              {draft.plantBasedType !== 'none' ? (
                <>
                  <Text style={styles.label}>{copy.foodSafety.heatTreated}</Text>
                  <View style={styles.choices}>
                    <OptionChip label={copy.foodSafety.no} onPress={() => setDrafts((current) => ({ ...current, [item.id]: { ...draft, heatTreated: false } }))} selected={!draft.heatTreated} style={styles.choice} />
                    <OptionChip label={copy.foodSafety.yes} onPress={() => setDrafts((current) => ({ ...current, [item.id]: { ...draft, heatTreated: true } }))} selected={draft.heatTreated} style={styles.choice} />
                  </View>
                </>
              ) : null}
              <View style={styles.actions}>
                <BigButton label={copy.settings.save} onPress={() => void saveItem(item)} variant="secondary" style={styles.flex} />
                <BigButton label={copy.remove} onPress={() => setRemoveItem(item)} variant="danger" style={styles.flex} />
              </View>
            </Card>
          );
        })}
        {!items.length ? <Text style={styles.empty}>{copy.foodSafety.emptyCatalog}</Text> : null}
      </ScrollView>
      <ItemRegistrationModal
        onCancel={() => setRegistrationVisible(false)}
        onRegistered={() => {
          setRegistrationVisible(false);
          void load();
        }}
        visible={registrationVisible}
      />
      <ConfirmDialog
        body={copy.foodSafety.removeRegisteredItemHint}
        cancelLabel={copy.cancel}
        confirmLabel={copy.remove}
        onCancel={() => setRemoveItem(null)}
        onConfirm={() => void removeConfirmed()}
        title={removeItem ? copy.foodSafety.removeRegisteredItemTitle(removeItem.name) : ''}
        visible={removeItem !== null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0, gap: spacing.md },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  headingCopy: { flex: 1, gap: spacing.xs },
  title: { ...typography.h3, color: colors.ink },
  body: { ...typography.body, color: colors.muted },
  registerButton: { minWidth: 230 },
  error: { ...typography.bodyStrong, color: colors.dangerDark },
  list: { gap: spacing.md, paddingBottom: spacing.xl },
  itemCard: { gap: spacing.sm, padding: spacing.md },
  itemName: { ...typography.h3, color: colors.ink },
  meta: { ...typography.body, color: colors.muted },
  label: { ...typography.bodyStrong, color: colors.ink },
  choices: { flexDirection: 'row', gap: spacing.xs },
  choice: { flex: 1, minHeight: sizes.tapMin },
  actions: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  empty: { ...typography.body, padding: spacing.xl, textAlign: 'center', color: colors.muted },
});
