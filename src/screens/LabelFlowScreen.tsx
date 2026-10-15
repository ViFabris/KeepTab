import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { BigButton } from '../components/BigButton';
import { ItemSelector } from '../components/ItemSelector';
import { LabelPreview } from '../components/LabelPreview';
import { OptionStep } from '../components/OptionStep';
import { PageHeader } from '../components/PageHeader';
import { SafetyBanner } from '../components/SafetyBanner';
import { getItems, getShelfLife } from '../database/itemsRepository';
import { getStaff } from '../database/staffRepository';
import { MockPrinter } from '../printing/MockPrinter';
import { colors } from '../theme';
import type {
  KitchenItem,
  PrintableLabel,
  SavedLabel,
  ShelfLife,
  StaffMember,
  StorageType,
} from '../types';
import { addHours } from '../utils/dates';

type FlowStep = 'item' | 'storage' | 'form' | 'staff' | 'preview' | 'printed';

interface LabelFlowScreenProps {
  onPrinted: () => void;
  onOpenStaff: () => void;
}

function defaultValue<T extends string>(options: { value: T; isDefault: boolean }[]): T {
  const option = options.find((candidate) => candidate.isDefault) ?? options[0];
  if (!option) {
    throw new Error('This item has no configured options.');
  }
  return option.value;
}

export function LabelFlowScreen({ onPrinted, onOpenStaff }: LabelFlowScreenProps) {
  const db = useSQLiteContext();
  const [items, setItems] = useState<KitchenItem[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [step, setStep] = useState<FlowStep>('item');
  const [item, setItem] = useState<KitchenItem | null>(null);
  const [storageType, setStorageType] = useState<StorageType>('Refrigerated');
  const [form, setForm] = useState('Whole');
  const [label, setLabel] = useState<PrintableLabel | null>(null);
  const [draftWithoutUseBy, setDraftWithoutUseBy] = useState<
    Omit<PrintableLabel, 'useByAt'> | null
  >(null);
  const [shelfLife, setShelfLife] = useState<ShelfLife | null>(null);
  const [printedLabel, setPrintedLabel] = useState<SavedLabel | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const printer = useMemo(() => new MockPrinter(db), [db]);

  useEffect(() => {
    let mounted = true;
    Promise.all([getItems(db), getStaff(db)])
      .then(([nextItems, nextStaff]) => {
        if (mounted) {
          setItems(nextItems);
          setStaff(nextStaff);
        }
      })
      .catch((caught: unknown) => {
        if (mounted) setError(errorMessage(caught));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [db]);

  // Voice input can later resolve an item and call this exact function.
  function selectItem(selectedItem: KitchenItem) {
    setItem(selectedItem);
    setStorageType(defaultValue(selectedItem.storageOptions));
    setForm(defaultValue(selectedItem.formOptions));
    setError('');
    setStep('storage');
  }

  async function selectStaff(member: StaffMember) {
    if (!item) return;
    setBusy(true);
    setError('');
    try {
      const configuredShelfLife = await getShelfLife(db, item.id, form, storageType);
      const madeAt = new Date();
      const draft = {
        itemId: item.id,
        itemName: item.name,
        form,
        storageType,
        madeAt: madeAt.toISOString(),
        staffId: member.id,
        staffName: member.name,
      };
      setDraftWithoutUseBy(draft);
      setShelfLife(configuredShelfLife);
      setLabel(
        configuredShelfLife
          ? {
              ...draft,
              useByAt: addHours(madeAt, configuredShelfLife.hours).toISOString(),
            }
          : null,
      );
      setStep('preview');
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  async function printLabel() {
    if (!label) return;
    setBusy(true);
    setError('');
    try {
      const saved = await printer.print(label);
      setPrintedLabel(saved);
      setStep('printed');
      onPrinted();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  function resetFlow() {
    setItem(null);
    setLabel(null);
    setDraftWithoutUseBy(null);
    setShelfLife(null);
    setPrintedLabel(null);
    setError('');
    setStep('item');
  }

  if (loading) {
    return <CenteredMessage loading message="Loading kitchen items…" />;
  }

  if (step === 'item') {
    return (
      <View style={styles.screen}>
        <View style={styles.headerWithBanner}>
          <PageHeader title="What are you labeling?" subtitle="Search or tap an item." />
          <SafetyBanner compact />
        </View>
        {error ? <ErrorMessage message={error} /> : null}
        <ItemSelector items={items} onSelectItem={selectItem} />
      </View>
    );
  }

  if (!item) {
    return <CenteredMessage message="Choose an item to continue." />;
  }

  if (step === 'storage') {
    return (
      <View style={styles.screen}>
        <OptionStep
          title="How is it stored?"
          subtitle={`${item.name} · The most likely option is already selected.`}
          options={item.storageOptions}
          selected={storageType}
          onSelect={setStorageType}
          onBack={resetFlow}
          onConfirm={() => setStep('form')}
        />
      </View>
    );
  }

  if (step === 'form') {
    return (
      <View style={styles.screen}>
        <OptionStep
          title="What form is it in?"
          subtitle={`${item.name} · ${storageType}`}
          options={item.formOptions}
          selected={form}
          onSelect={setForm}
          onBack={() => setStep('storage')}
          onConfirm={() => setStep('staff')}
        />
      </View>
    );
  }

  if (step === 'staff') {
    return (
      <View style={styles.screen}>
        <PageHeader
          title="Who is making it?"
          subtitle={`${item.name} · ${form} · ${storageType}`}
        />
        {error ? <ErrorMessage message={error} /> : null}
        {staff.length ? (
          <ScrollView contentContainerStyle={styles.staffGrid}>
            {staff.map((member) => (
              <BigButton
                key={member.id}
                label={member.name}
                onPress={() => void selectStaff(member)}
                disabled={busy}
                variant="choice"
                style={styles.staffButton}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyStaff}>
            <Text style={styles.emptyTitle}>No staff names yet</Text>
            <Text style={styles.emptyBody}>Add at least one person before making a label.</Text>
            <BigButton label="Open Staff" onPress={onOpenStaff} style={styles.inlineButton} />
          </View>
        )}
        <BigButton
          label="Back"
          onPress={() => setStep('form')}
          variant="secondary"
          style={styles.bottomBack}
        />
      </View>
    );
  }

  if (step === 'preview' && draftWithoutUseBy) {
    return (
      <View style={styles.screen}>
        <PageHeader title="Check the label" subtitle="Confirm the details before printing." />
        {error ? <ErrorMessage message={error} /> : null}
        <ScrollView contentContainerStyle={styles.previewArea}>
          <LabelPreview
            label={label ?? draftWithoutUseBy}
            shelfLife={shelfLife}
            compact
          />
          {!shelfLife ? (
            <View style={styles.noShelfLife}>
              <Text style={styles.noShelfTitle}>No shelf life configured</Text>
              <Text style={styles.noShelfBody}>
                There is no value for {item.name} + {form} + {storageType}. Nothing was
                guessed, and printing is disabled.
              </Text>
            </View>
          ) : null}
        </ScrollView>
        <View style={styles.actionRow}>
          <BigButton
            label="Back"
            onPress={() => setStep('staff')}
            variant="secondary"
            style={styles.backButton}
          />
          <BigButton
            label={busy ? 'Printing…' : 'Print label'}
            onPress={() => void printLabel()}
            disabled={!label || busy}
            style={styles.flexButton}
          />
        </View>
      </View>
    );
  }

  if (step === 'printed' && printedLabel) {
    return (
      <View style={styles.screen}>
        <PageHeader title="Mock print complete" subtitle={`Saved as label #${printedLabel.id}.`} />
        <View style={styles.printedNotice}>
          <Text style={styles.printedNoticeText}>
            No physical printer is connected. This label was saved to the local database.
          </Text>
        </View>
        <ScrollView contentContainerStyle={styles.previewArea}>
          <LabelPreview label={printedLabel} shelfLife={shelfLife} compact />
        </ScrollView>
        <BigButton label="Make another label" onPress={resetFlow} />
      </View>
    );
  }

  return <CenteredMessage message="Unable to show this label step." />;
}

function ErrorMessage({ message }: { message: string }) {
  return <Text style={styles.error}>{message}</Text>;
}

function CenteredMessage({ message, loading = false }: { message: string; loading?: boolean }) {
  return (
    <View style={styles.centered}>
      {loading ? <ActivityIndicator color={colors.primary} size="large" /> : null}
      <Text style={styles.centeredText}>{message}</Text>
    </View>
  );
}

function errorMessage(caught: unknown): string {
  return caught instanceof Error ? caught.message : 'Something went wrong. Please try again.';
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 28, gap: 18 },
  headerWithBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 22 },
  staffGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, paddingVertical: 20 },
  staffButton: { width: '31%', minHeight: 92 },
  emptyStaff: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  emptyTitle: { color: colors.ink, fontSize: 28, fontWeight: '800' },
  emptyBody: { marginTop: 8, color: colors.muted, fontSize: 19 },
  inlineButton: { marginTop: 22, minWidth: 260 },
  bottomBack: { width: 180 },
  previewArea: { flexGrow: 1, justifyContent: 'center', gap: 14, paddingVertical: 6 },
  noShelfLife: {
    padding: 16,
    borderWidth: 2,
    borderColor: colors.danger,
    borderRadius: 12,
    backgroundColor: colors.dangerSoft,
  },
  noShelfTitle: { color: colors.dangerDark, fontSize: 20, fontWeight: '900' },
  noShelfBody: { marginTop: 4, color: colors.dangerDark, fontSize: 17, lineHeight: 23 },
  actionRow: { flexDirection: 'row', gap: 16 },
  backButton: { width: 180 },
  flexButton: { flex: 1 },
  printedNotice: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
  },
  printedNoticeText: { color: colors.primaryDark, fontSize: 17, fontWeight: '700' },
  error: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.dangerSoft,
    color: colors.dangerDark,
    fontSize: 17,
    fontWeight: '700',
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  centeredText: { color: colors.ink, fontSize: 22, fontWeight: '700' },
});
