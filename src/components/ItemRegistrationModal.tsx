import { useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { PackagePlus, X } from 'lucide-react-native';

import { getItems, registerKitchenItem } from '../database/itemsRepository';
import { getLabelOptions } from '../database/optionsRepository';
import { getLabelOptionName } from '../i18n';
import { useLanguage } from '../i18n/LanguageContext';
import { colors, sizes, spacing, typography } from '../theme';
import type { KitchenItem, LabelOption, PlantBasedType } from '../types';
import { BigButton } from './BigButton';
import { Card } from './Card';
import { Input } from './Input';
import { OptionChip } from './OptionChip';

const PREPARED_DEFAULTS = new Set([
  'form.cut', 'form.other', 'form.cooked', 'form.peeled', 'form.shredded',
]);

export function ItemRegistrationModal({
  visible,
  onCancel,
  onRegistered,
}: {
  visible: boolean;
  onCancel: () => void;
  onRegistered: (item: KitchenItem) => void;
}) {
  const db = useSQLiteContext();
  const { language, copy } = useLanguage();
  const [name, setName] = useState('');
  const [options, setOptions] = useState<LabelOption[]>([]);
  const [selectedFormIds, setSelectedFormIds] = useState<string[]>([]);
  const [selectedStorageIds, setSelectedStorageIds] = useState<string[]>([]);
  const [preparedByForm, setPreparedByForm] = useState<Record<string, boolean>>({});
  const [plantBasedType, setPlantBasedType] = useState<PlantBasedType>('none');
  const [heatTreated, setHeatTreated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const formOptions = useMemo(() => options.filter((option) => option.kind === 'form'), [options]);
  const storageOptions = useMemo(() => options.filter((option) => option.kind === 'storage'), [options]);

  useEffect(() => {
    if (!visible) return;
    setName('');
    setSelectedFormIds([]);
    setSelectedStorageIds([]);
    setPreparedByForm({});
    setPlantBasedType('none');
    setHeatTreated(false);
    setError('');
    void getLabelOptions(db)
      .then(setOptions)
      .catch(() => setError(copy.genericError));
  }, [copy.genericError, db, visible]);

  function toggleForm(option: LabelOption) {
    setSelectedFormIds((current) => current.includes(option.id)
      ? current.filter((id) => id !== option.id)
      : [...current, option.id]);
    setPreparedByForm((current) => ({
      ...current,
      [option.id]: current[option.id] ?? Boolean(option.translationKey && PREPARED_DEFAULTS.has(option.translationKey)),
    }));
  }

  function toggleStorage(optionId: string) {
    setSelectedStorageIds((current) => current.includes(optionId)
      ? current.filter((id) => id !== optionId)
      : [...current, optionId]);
  }

  async function save() {
    if (!name.trim() || !selectedFormIds.length || !selectedStorageIds.length) {
      setError(copy.foodSafety.registrationIncomplete);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const itemId = await registerKitchenItem(db, {
        name,
        formOptions: selectedFormIds.map((optionId) => ({
          optionId,
          preparedFood: preparedByForm[optionId] ?? false,
        })),
        storageOptionIds: selectedStorageIds,
        plantBasedType,
        heatTreated: plantBasedType === 'none' ? false : heatTreated,
      });
      const item = (await getItems(db)).find((candidate) => candidate.id === itemId);
      if (!item) throw new Error('ITEM_NOT_FOUND_AFTER_REGISTRATION');
      onRegistered(item);
    } catch (caught) {
      setError(caught instanceof Error && caught.message === 'ITEM_ALREADY_EXISTS'
        ? copy.foodSafety.itemAlreadyExists
        : copy.genericError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal animationType="slide" onRequestClose={onCancel} visible={visible}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{copy.foodSafety.itemRegistrationTitle}</Text>
            <Text style={styles.hint}>{copy.foodSafety.itemRegistrationHint}</Text>
          </View>
          <BigButton
            label={copy.settings.close}
            onPress={onCancel}
            variant="secondary"
            style={styles.close}
            leading={<X color={colors.ink} size={sizes.iconMd} strokeWidth={2} />}
          />
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Card style={styles.card}>
            <Input
              autoCapitalize="sentences"
              autoFocus
              label={copy.foodSafety.itemName}
              onChangeText={setName}
              placeholder={copy.foodSafety.itemNamePlaceholder}
              value={name}
            />
          </Card>

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>{copy.foodSafety.chooseForms}</Text>
            <View style={styles.grid}>
              {formOptions.map((option) => (
                <OptionChip
                  key={option.id}
                  label={getLabelOptionName(option, language)}
                  onPress={() => toggleForm(option)}
                  selected={selectedFormIds.includes(option.id)}
                  style={styles.option}
                />
              ))}
            </View>
          </Card>

          {selectedFormIds.length ? (
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>{copy.foodSafety.preparedClassification}</Text>
              <Text style={styles.hint}>{copy.foodSafety.preparedClassificationHint}</Text>
              {selectedFormIds.map((id) => {
                const option = formOptions.find((candidate) => candidate.id === id);
                if (!option) return null;
                const prepared = preparedByForm[id] ?? false;
                return (
                  <View key={id} style={styles.classificationRow}>
                    <Text style={styles.formName}>{getLabelOptionName(option, language)}</Text>
                    <View style={styles.classificationChoices}>
                      <OptionChip
                        label={copy.foodSafety.preparedInKitchen}
                        onPress={() => setPreparedByForm((current) => ({ ...current, [id]: true }))}
                        selected={prepared}
                        style={styles.classificationChoice}
                      />
                      <OptionChip
                        label={copy.foodSafety.manufacturerControlled}
                        onPress={() => setPreparedByForm((current) => ({ ...current, [id]: false }))}
                        selected={!prepared}
                        style={styles.classificationChoice}
                      />
                    </View>
                  </View>
                );
              })}
            </Card>
          ) : null}

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>{copy.foodSafety.chooseStorageTypes}</Text>
            <View style={styles.grid}>
              {storageOptions.map((option) => (
                <OptionChip
                  key={option.id}
                  label={getLabelOptionName(option, language)}
                  onPress={() => toggleStorage(option.id)}
                  selected={selectedStorageIds.includes(option.id)}
                  style={styles.option}
                />
              ))}
            </View>
          </Card>

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>{copy.foodSafety.plantBasedType}</Text>
            <View style={styles.grid}>
              {(['none', 'drink', 'food'] as PlantBasedType[]).map((value) => (
                <OptionChip
                  key={value}
                  label={value === 'none' ? copy.foodSafety.plantNone : value === 'drink' ? copy.foodSafety.plantDrink : copy.foodSafety.plantFood}
                  onPress={() => setPlantBasedType(value)}
                  selected={plantBasedType === value}
                  style={styles.option}
                />
              ))}
            </View>
            {plantBasedType !== 'none' ? (
              <>
                <Text style={styles.sectionTitle}>{copy.foodSafety.heatTreated}</Text>
                <View style={styles.grid}>
                  <OptionChip label={copy.foodSafety.no} onPress={() => setHeatTreated(false)} selected={!heatTreated} style={styles.option} />
                  <OptionChip label={copy.foodSafety.yes} onPress={() => setHeatTreated(true)} selected={heatTreated} style={styles.option} />
                </View>
              </>
            ) : null}
          </Card>

          <Text style={styles.lawNotice}>{copy.foodSafety.lawManagedNotice}</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <BigButton
            disabled={busy}
            label={copy.foodSafety.registerAndUse}
            onPress={() => void save()}
            leading={<PackagePlus color={colors.background} size={sizes.iconMd} strokeWidth={2} />}
          />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, gap: spacing.lg, padding: spacing.xl, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg },
  headerText: { flex: 1, gap: spacing.xs },
  title: { ...typography.h1, color: colors.ink },
  hint: { ...typography.body, color: colors.muted },
  close: { width: 180 },
  content: { gap: spacing.md, paddingBottom: spacing.xxl },
  card: { gap: spacing.md, padding: spacing.md },
  sectionTitle: { ...typography.h3, color: colors.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: { minWidth: 190, flexGrow: 1, minHeight: sizes.tapMin },
  classificationRow: { gap: spacing.xs, paddingTop: spacing.xs },
  formName: { ...typography.bodyStrong, color: colors.ink },
  classificationChoices: { flexDirection: 'row', gap: spacing.sm },
  classificationChoice: { flex: 1, minHeight: sizes.tapMin },
  lawNotice: { ...typography.bodyStrong, color: colors.primaryDark },
  error: { ...typography.bodyStrong, color: colors.dangerDark },
});
