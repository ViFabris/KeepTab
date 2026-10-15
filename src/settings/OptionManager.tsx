import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { BigButton } from '../components/BigButton';
import {
  addLabelOption,
  getLabelOptions,
  removeLabelOption,
  renameLabelOption,
  reorderLabelOption,
} from '../database/optionsRepository';
import { getLabelOptionName } from '../i18n';
import { useLanguage } from '../i18n/LanguageContext';
import { colors } from '../theme';
import type { LabelOption, OptionKind } from '../types';

export function OptionManager({ onOptionsChange }: { onOptionsChange?: () => void }) {
  const db = useSQLiteContext();
  const { language, copy } = useLanguage();
  const [storageOptions, setStorageOptions] = useState<LabelOption[]>([]);
  const [formOptions, setFormOptions] = useState<LabelOption[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const [storage, form] = await Promise.all([
      getLabelOptions(db, 'storage'),
      getLabelOptions(db, 'form'),
    ]);
    setStorageOptions(storage);
    setFormOptions(form);
  }, [db]);

  useEffect(() => {
    void load().catch(() => setError(copy.settings.settingsError));
  }, [copy.settings.settingsError, load]);

  async function changed(action: () => Promise<void>) {
    setError('');
    try {
      await action();
      await load();
      onOptionsChange?.();
    } catch {
      setError(copy.settings.settingsError);
    }
  }

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.columns}>
        <OptionList
          kind="storage"
          title={copy.setup.storageOptions}
          options={storageOptions}
          language={language}
          onChanged={changed}
        />
        <OptionList
          kind="form"
          title={copy.setup.formOptions}
          options={formOptions}
          language={language}
          onChanged={changed}
        />
      </View>
    </View>
  );
}

function OptionList({
  kind,
  title,
  options,
  language,
  onChanged,
}: {
  kind: OptionKind;
  title: string;
  options: LabelOption[];
  language: 'en' | 'pt-BR';
  onChanged: (action: () => Promise<void>) => Promise<void>;
}) {
  const db = useSQLiteContext();
  const { copy } = useLanguage();
  const [newName, setNewName] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    setDrafts(
      Object.fromEntries(options.map((option) => [option.id, getLabelOptionName(option, language)])),
    );
  }, [language, options]);

  async function add() {
    if (!newName.trim()) {
      setLocalError(copy.settings.optionNameRequired);
      return;
    }
    setLocalError('');
    await onChanged(() => addLabelOption(db, kind, newName));
    setNewName('');
  }

  async function rename(option: LabelOption) {
    const value = drafts[option.id] ?? '';
    if (!value.trim()) {
      setLocalError(copy.settings.optionNameRequired);
      return;
    }
    setLocalError('');
    await onChanged(() => renameLabelOption(db, option.id, value));
  }

  async function move(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= options.length) return;
    const ids = options.map((option) => option.id);
    const currentId = ids[index];
    const destinationId = ids[destination];
    if (!currentId || !destinationId) return;
    ids[index] = destinationId;
    ids[destination] = currentId;
    await onChanged(() => reorderLabelOption(db, kind, ids));
  }

  function confirmRemove(option: LabelOption) {
    if (options.length <= 1) {
      setLocalError(copy.settings.atLeastOneOption);
      return;
    }
    const name = getLabelOptionName(option, language);
    Alert.alert(copy.settings.removeOptionTitle(name), copy.settings.removeOptionHint, [
      { text: copy.cancel, style: 'cancel' },
      {
        text: copy.remove,
        style: 'destructive',
        onPress: () => void onChanged(() => removeLabelOption(db, option.id)),
      },
    ]);
  }

  return (
    <View style={styles.listPanel}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.addRow}>
        <TextInput
          accessibilityLabel={copy.settings.optionPlaceholder}
          onChangeText={setNewName}
          placeholder={copy.settings.optionPlaceholder}
          placeholderTextColor="#788781"
          style={styles.addInput}
          value={newName}
        />
        <BigButton
          label={copy.settings.addOption}
          onPress={() => void add()}
          style={styles.addButton}
        />
      </View>
      {localError ? <Text style={styles.localError}>{localError}</Text> : null}
      <ScrollView contentContainerStyle={styles.list}>
        {options.map((option, index) => (
          <View key={option.id} style={styles.optionCard}>
            <View style={styles.optionRow}>
              <TextInput
                accessibilityLabel={getLabelOptionName(option, language)}
                onChangeText={(value) => setDrafts((current) => ({ ...current, [option.id]: value }))}
                style={styles.renameInput}
                value={drafts[option.id] ?? ''}
              />
              <BigButton
                label={copy.settings.rename}
                onPress={() => void rename(option)}
                variant="secondary"
                style={styles.renameButton}
              />
            </View>
            <View style={styles.optionActions}>
              <BigButton
                label={copy.settings.moveUp}
                onPress={() => void move(index, -1)}
                disabled={index === 0}
                variant="secondary"
                style={styles.actionButton}
              />
              <BigButton
                label={copy.settings.moveDown}
                onPress={() => void move(index, 1)}
                disabled={index === options.length - 1}
                variant="secondary"
                style={styles.actionButton}
              />
              <BigButton
                label={copy.remove}
                onPress={() => confirmRemove(option)}
                variant="danger"
                style={styles.actionButton}
              />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0, gap: 10 },
  columns: { flex: 1, flexDirection: 'row', gap: 14, minHeight: 0 },
  listPanel: {
    flex: 1,
    minWidth: 0,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  title: { color: colors.ink, fontSize: 22, fontWeight: '900' },
  addRow: { marginTop: 10, flexDirection: 'row', gap: 8 },
  addInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 56,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 10,
    color: colors.ink,
    fontSize: 17,
  },
  addButton: { width: 150, minHeight: 56, paddingHorizontal: 8 },
  list: { paddingTop: 12, gap: 9, paddingBottom: 20 },
  optionCard: {
    padding: 8,
    gap: 7,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
  },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  optionActions: { flexDirection: 'row', gap: 7 },
  renameInput: {
    flex: 1,
    minWidth: 90,
    minHeight: 52,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  renameButton: { width: 125, minHeight: 52, paddingHorizontal: 5 },
  actionButton: { flex: 1, minHeight: 52, paddingHorizontal: 4 },
  error: { color: colors.danger, fontSize: 17, fontWeight: '800' },
  localError: { marginTop: 7, color: colors.danger, fontSize: 15, fontWeight: '800' },
});
