import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../theme';
import type { KitchenItem } from '../types';
import { getItemName } from '../i18n';
import { useLanguage } from '../i18n/LanguageContext';
import { filterItems } from '../utils/itemSearch';
import { BigButton } from './BigButton';
import { Input } from './Input';

interface ItemSelectorProps {
  items: KitchenItem[];
  onSelectItem: (item: KitchenItem) => void;
}

// This is the single boundary for item selection. A future voice adapter can call
// the same onSelectItem callback without changing the rest of the label flow.
export function ItemSelector({ items, onSelectItem }: ItemSelectorProps) {
  const { language, copy } = useLanguage();
  const [query, setQuery] = useState('');
  const suggestions = useMemo(
    () => filterItems(items, query, language),
    [items, language, query],
  );

  return (
    <View style={styles.container}>
      <Input
        accessibilityLabel={copy.searchPlaceholder}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        onChangeText={setQuery}
        placeholder={copy.searchPlaceholder}
        icon="search"
        returnKeyType="search"
        style={styles.input}
        value={query}
      />
      <ScrollView
        contentContainerStyle={styles.suggestions}
        keyboardShouldPersistTaps="handled"
      >
        {suggestions.map((item) => (
          <BigButton
            key={item.id}
            label={getItemName(item.id, item.name, language)}
            onPress={() => onSelectItem(item)}
            variant="choice"
            style={styles.itemButton}
          />
        ))}
        {suggestions.length === 0 ? (
          <Text style={styles.empty}>{copy.noItemMatches(query.trim())}</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0 },
  suggestions: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  input: { ...typography.bodyStrong },
  itemButton: { width: '31%', minHeight: 72 },
  empty: { ...typography.body, padding: spacing.xl, color: colors.muted },
});
