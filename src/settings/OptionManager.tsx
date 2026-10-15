import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { BigButton } from '../components/BigButton';
import { Card } from '../components/Card';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Input } from '../components/Input';
import { ListRow } from '../components/ListRow';
import {
  addLabelOption,
  getLabelOptions,
  removeLabelOption,
  renameLabelOption,
  reorderLabelOption,
} from '../database/optionsRepository';
import { getLabelOptionName } from '../i18n';
import { useLanguage } from '../i18n/LanguageContext';
import { colors, radii, sizes, spacing, typography } from '../theme';
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
  const [pendingRemove, setPendingRemove] = useState<LabelOption | null>(null);

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

  async function saveName(option: LabelOption) {
    const value = drafts[option.id] ?? '';
    if (!value.trim()) {
      setLocalError(copy.settings.optionNameRequired);
      return;
    }
    if (value.trim() === getLabelOptionName(option, language)) return;
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
    setPendingRemove(option);
  }

  return (
    <Card style={styles.listPanel}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.addRow}>
        <Input
          accessibilityLabel={copy.settings.optionPlaceholder}
          onChangeText={setNewName}
          placeholder={copy.settings.optionPlaceholder}
          containerStyle={styles.addInput}
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
          <ListRow key={option.id} style={styles.optionCard}>
            <Input
              accessibilityLabel={getLabelOptionName(option, language)}
              onBlur={() => void saveName(option)}
              onChangeText={(value) => setDrafts((current) => ({ ...current, [option.id]: value }))}
              returnKeyType="done"
              value={drafts[option.id] ?? ''}
            />
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
          </ListRow>
        ))}
      </ScrollView>
      <ConfirmDialog
        body={copy.settings.removeOptionHint}
        cancelLabel={copy.cancel}
        confirmLabel={copy.remove}
        onCancel={() => setPendingRemove(null)}
        onConfirm={() => {
          if (!pendingRemove) return;
          const option = pendingRemove;
          setPendingRemove(null);
          void onChanged(() => removeLabelOption(db, option.id));
        }}
        title={pendingRemove ? copy.settings.removeOptionTitle(getLabelOptionName(pendingRemove, language)) : ''}
        visible={pendingRemove !== null}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0, gap: spacing.sm },
  columns: { flex: 1, flexDirection: 'row', gap: spacing.md, minHeight: 0 },
  listPanel: {
    flex: 1,
    minWidth: 0,
    padding: spacing.md,
  },
  title: { ...typography.h3, color: colors.ink },
  addRow: { marginTop: spacing.sm, flexDirection: 'row', gap: spacing.xs },
  addInput: {
    flex: 1,
    minWidth: 0,
  },
  addButton: { width: 160, minHeight: sizes.tapMin, paddingHorizontal: spacing.xs },
  list: { paddingTop: spacing.sm, gap: spacing.sm, paddingBottom: spacing.lg },
  optionCard: {
    alignItems: 'stretch',
    padding: spacing.xs,
  },
  optionActions: { flexDirection: 'row', gap: spacing.xs },
  actionButton: { flex: 1, minHeight: sizes.tapMin, paddingHorizontal: spacing.xs },
  error: { ...typography.bodyStrong, color: colors.dangerDark },
  localError: { ...typography.caption, marginTop: spacing.xs, color: colors.dangerDark },
});
