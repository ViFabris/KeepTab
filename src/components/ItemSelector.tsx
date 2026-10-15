import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '../theme';
import type { KitchenItem } from '../types';
import { filterItems } from '../utils/itemSearch';
import { BigButton } from './BigButton';

interface ItemSelectorProps {
  items: KitchenItem[];
  onSelectItem: (item: KitchenItem) => void;
}

// This is the single boundary for item selection. A future voice adapter can call
// the same onSelectItem callback without changing the rest of the label flow.
export function ItemSelector({ items, onSelectItem }: ItemSelectorProps) {
  const [query, setQuery] = useState('');
  const suggestions = useMemo(() => filterItems(items, query), [items, query]);

  return (
    <View style={styles.container}>
      <TextInput
        accessibilityLabel="Search food items"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        onChangeText={setQuery}
        placeholder="Search items, e.g. cucumber"
        placeholderTextColor="#788781"
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
            label={item.name}
            onPress={() => onSelectItem(item)}
            variant="choice"
            style={styles.itemButton}
          />
        ))}
        {suggestions.length === 0 ? (
          <Text style={styles.empty}>No items match “{query.trim()}”.</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0 },
  input: {
    minHeight: 70,
    paddingHorizontal: 22,
    borderWidth: 3,
    borderColor: colors.primary,
    borderRadius: 16,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontSize: 24,
    fontWeight: '600',
  },
  suggestions: {
    paddingTop: 18,
    paddingBottom: 28,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  itemButton: { width: '31%', minHeight: 72 },
  empty: { padding: 22, color: colors.muted, fontSize: 21 },
});
