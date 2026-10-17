import { useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { PackagePlus, X } from 'lucide-react-native';

import {
  archiveKitchenItem,
  completeKitchenItemRegistration,
  getItems,
  registerKitchenItem,
} from '../database/itemsRepository';
import { getLabelOptions } from '../database/optionsRepository';
import { getLabelOptionName, type FoodSafetyCopy } from '../i18n';
import { useLanguage } from '../i18n/LanguageContext';
import { PackageIntakeModal } from '../packages/PackageIntakeModal';
import { colors, sizes, spacing, typography } from '../theme';
import type { KitchenItem, LabelOption, PackageEvidence, PlantBasedType } from '../types';
import { BigButton } from './BigButton';
import { Card } from './Card';
import { Input } from './Input';
import { OptionChip } from './OptionChip';
import {
  getFormCategory,
  nextFormSelection,
  nextStorageSelection,
  type FormCategory,
} from './itemRegistrationChoices';

const PREPARED_DEFAULTS = new Set([
  'form.cut', 'form.other', 'form.cooked', 'form.peeled', 'form.shredded',
]);
const FORM_CATEGORY_ORDER: FormCategory[] = ['preparation', 'cooking', 'skin', 'package'];

export function ItemRegistrationModal({
  visible,
  onCancel,
  onRegistered,
  mode = 'catalog',
}: {
  visible: boolean;
  onCancel: () => void;
  onRegistered: (item: KitchenItem) => void;
  mode?: 'catalog' | 'label';
}) {
  const db = useSQLiteContext();
  const { language, copy } = useLanguage();
  const [name, setName] = useState('');
  const [options, setOptions] = useState<LabelOption[]>([]);
  const [selectedFormIds, setSelectedFormIds] = useState<string[]>([]);
  const [selectedStorageIds, setSelectedStorageIds] = useState<string[]>([]);
  const [preparedInKitchen, setPreparedInKitchen] = useState(false);
  const [plantBasedType, setPlantBasedType] = useState<PlantBasedType>('none');
  const [heatTreated, setHeatTreated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pendingManufacturerItem, setPendingManufacturerItem] = useState<KitchenItem | null>(null);
  const formOptions = useMemo(() => options.filter((option) => option.kind === 'form'), [options]);
  const storageOptions = useMemo(() => options.filter((option) => option.kind === 'storage'), [options]);
  const isLabelMode = mode === 'label';
  const requiresManufacturerEvidence = selectedFormIds.length > 0 && !preparedInKitchen;
  const requiresManufacturerDays = selectedFormIds.some((id) => {
    const option = formOptions.find((candidate) => candidate.id === id);
    return option?.legacyValue === 'Opened' && !preparedInKitchen;
  });

  useEffect(() => {
    if (!visible) return;
    setName('');
    setSelectedFormIds([]);
    setSelectedStorageIds([]);
    setPreparedInKitchen(false);
    setPlantBasedType('none');
    setHeatTreated(false);
    setPendingManufacturerItem(null);
    setError('');
    void getLabelOptions(db)
      .then(setOptions)
      .catch(() => setError(copy.genericError));
  }, [copy.genericError, db, visible]);

  function toggleForm(option: LabelOption) {
    if (!selectedFormIds.length) {
      setPreparedInKitchen(Boolean(option.translationKey && PREPARED_DEFAULTS.has(option.translationKey)));
    }
    setSelectedFormIds((current) => nextFormSelection(current, option, formOptions));
  }

  function toggleStorage(optionId: string) {
    setSelectedStorageIds((current) => nextStorageSelection(current, optionId, isLabelMode));
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
          preparedFood: preparedInKitchen,
        })),
        storageOptionIds: selectedStorageIds,
        plantBasedType,
        heatTreated: plantBasedType === 'none' ? false : heatTreated,
        registrationComplete: !requiresManufacturerEvidence,
      });
      const item = (await getItems(db, { includeIncomplete: true })).find((candidate) => candidate.id === itemId);
      if (!item) throw new Error('ITEM_NOT_FOUND_AFTER_REGISTRATION');
      if (requiresManufacturerEvidence) setPendingManufacturerItem(item);
      else onRegistered(item);
    } catch (caught) {
      setError(caught instanceof Error && caught.message === 'ITEM_ALREADY_EXISTS'
        ? copy.foodSafety.itemAlreadyExists
        : copy.genericError);
    } finally {
      setBusy(false);
    }
  }

  async function finishManufacturerEvidence(evidence: PackageEvidence) {
    if (!pendingManufacturerItem) return;
    setBusy(true);
    setError('');
    try {
      await completeKitchenItemRegistration(db, pendingManufacturerItem.id, evidence);
      const completed = {
        ...pendingManufacturerItem,
        manufacturerDaysAfterOpen: evidence.manufacturerDaysAfterOpen,
        source: `package-evidence:${evidence.id}`,
      };
      setPendingManufacturerItem(null);
      onRegistered(completed);
    } catch {
      setError(copy.genericError);
    } finally {
      setBusy(false);
    }
  }

  async function cancelManufacturerEvidence() {
    if (!pendingManufacturerItem) return;
    try {
      await archiveKitchenItem(db, pendingManufacturerItem.id);
      setPendingManufacturerItem(null);
      setError(copy.foodSafety.manufacturerEvidenceRequired);
    } catch {
      setError(copy.genericError);
    }
  }

  return (
    <Modal animationType="slide" onRequestClose={onCancel} visible={visible}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{copy.foodSafety.itemRegistrationTitle}</Text>
            <Text style={styles.hint}>
              {isLabelMode ? copy.foodSafety.itemRegistrationForLabelHint : copy.foodSafety.itemRegistrationHint}
            </Text>
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
            <Text style={styles.sectionTitle}>
              {isLabelMode ? copy.foodSafety.chooseCurrentForm : copy.foodSafety.chooseForms}
            </Text>
            {FORM_CATEGORY_ORDER.map((category) => {
              const categoryOptions = formOptions.filter((option) => getFormCategory(option) === category);
              if (!categoryOptions.length) return null;
              return (
                <View key={category} style={styles.category}>
                  <Text style={styles.categoryTitle}>{formCategoryLabel(category, copy.foodSafety)}</Text>
                  <View style={styles.grid}>
                    {categoryOptions.map((option) => (
                      <OptionChip
                        key={option.id}
                        label={getLabelOptionName(option, language)}
                        onPress={() => toggleForm(option)}
                        selected={selectedFormIds.includes(option.id)}
                        style={styles.option}
                      />
                    ))}
                  </View>
                </View>
              );
            })}
          </Card>

          {selectedFormIds.length ? (
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>{copy.foodSafety.preparedClassification}</Text>
              <Text style={styles.hint}>{copy.foodSafety.preparedClassificationHint}</Text>
              <View style={styles.classificationChoices}>
                <OptionChip
                  label={copy.foodSafety.preparedInKitchen}
                  onPress={() => setPreparedInKitchen(true)}
                  selected={preparedInKitchen}
                  style={styles.classificationChoice}
                />
                <OptionChip
                  label={copy.foodSafety.manufacturerControlled}
                  onPress={() => setPreparedInKitchen(false)}
                  selected={!preparedInKitchen}
                  style={styles.classificationChoice}
                />
              </View>
            </Card>
          ) : null}

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>
              {isLabelMode ? copy.foodSafety.chooseCurrentStorage : copy.foodSafety.chooseStorageTypes}
            </Text>
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
            label={requiresManufacturerEvidence
              ? copy.foodSafety.continueToEvidence
              : copy.foodSafety.registerAndUse}
            onPress={() => void save()}
            leading={<PackagePlus color={colors.background} size={sizes.iconMd} strokeWidth={2} />}
          />
        </ScrollView>
        <PackageIntakeModal
          itemId={pendingManufacturerItem?.id ?? ''}
          onCancel={() => void cancelManufacturerEvidence()}
          onConfirmed={(evidence) => void finishManufacturerEvidence(evidence)}
          requireManufacturerDays={requiresManufacturerDays}
          visible={pendingManufacturerItem !== null}
        />
      </View>
    </Modal>
  );
}

function formCategoryLabel(category: FormCategory, copy: FoodSafetyCopy): string {
  if (category === 'preparation') return copy.formCategoryPreparation;
  if (category === 'cooking') return copy.formCategoryCooking;
  if (category === 'skin') return copy.formCategorySkin;
  return copy.formCategoryPackage;
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
  category: { gap: spacing.xs },
  categoryTitle: { ...typography.caption, color: colors.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: { minWidth: 190, flexGrow: 1, minHeight: sizes.tapMin },
  classificationChoices: { flexDirection: 'row', gap: spacing.sm },
  classificationChoice: { flex: 1, minHeight: sizes.tapMin },
  lawNotice: { ...typography.bodyStrong, color: colors.primaryDark },
  error: { ...typography.bodyStrong, color: colors.dangerDark },
});
