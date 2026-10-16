import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { ArrowLeft, CheckCircle2, Printer, UserRound } from 'lucide-react-native';

import { BigButton } from '../components/BigButton';
import { Card } from '../components/Card';
import { ItemSelector } from '../components/ItemSelector';
import { LabelPreview } from '../components/LabelPreview';
import { OptionStep } from '../components/OptionStep';
import { PageHeader } from '../components/PageHeader';
import { SafetyBanner } from '../components/SafetyBanner';
import { StepProgress } from '../components/StepProgress';
import { getItems, getShelfLife } from '../database/itemsRepository';
import { getStaff } from '../database/staffRepository';
import { getItemName, getLabelOptionName } from '../i18n';
import { useLanguage } from '../i18n/LanguageContext';
import { MockPrinter } from '../printing/MockPrinter';
import type { PreparedPrintJob } from '../printing/EscPosPrinter';
import { useSettings } from '../settings/SettingsContext';
import { colors, radii, sizes, spacing, typography } from '../theme';
import type {
  KitchenItem,
  ItemLabelOption,
  PrintableLabel,
  SavedLabel,
  ShelfLife,
  StaffMember,
} from '../types';
import { getAppNow } from '../utils/appClock';
import { addHours } from '../utils/dates';

type FlowStep = 'item' | 'storage' | 'form' | 'staff' | 'preview' | 'printed';

const FLOW_STEP_NUMBER: Record<FlowStep, number> = {
  item: 1,
  storage: 2,
  form: 3,
  staff: 4,
  preview: 5,
  printed: 5,
};
const FLOW_STEP_TOTAL = 5;

interface LabelFlowScreenProps {
  onPrinted: () => void;
}

function defaultOption(options: ItemLabelOption[]): ItemLabelOption {
  const option = options.find((candidate) => candidate.isDefault) ?? options[0];
  if (!option) {
    throw new Error('This item has no configured options.');
  }
  return option;
}

export function LabelFlowScreen({ onPrinted }: LabelFlowScreenProps) {
  const db = useSQLiteContext();
  const { language, copy } = useLanguage();
  const { settings } = useSettings();
  const [items, setItems] = useState<KitchenItem[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [step, setStep] = useState<FlowStep>('item');
  const [item, setItem] = useState<KitchenItem | null>(null);
  const [storageOption, setStorageOption] = useState<ItemLabelOption | null>(null);
  const [formOption, setFormOption] = useState<ItemLabelOption | null>(null);
  const [label, setLabel] = useState<PrintableLabel | null>(null);
  const [draftWithoutUseBy, setDraftWithoutUseBy] = useState<
    Omit<PrintableLabel, 'useByAt'> | null
  >(null);
  const [shelfLife, setShelfLife] = useState<ShelfLife | null>(null);
  const [printedLabel, setPrintedLabel] = useState<SavedLabel | null>(null);
  const [preparedJob, setPreparedJob] = useState<PreparedPrintJob | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const printer = useMemo(
    () => new MockPrinter(db, settings, () => getAppNow(settings)),
    [db, settings],
  );
  const progress = (
    <StepProgress
      current={FLOW_STEP_NUMBER[step]}
      total={FLOW_STEP_TOTAL}
      label={copy.setup.step(FLOW_STEP_NUMBER[step], FLOW_STEP_TOTAL)}
    />
  );

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
        if (mounted) setError(errorMessage(caught, copy.genericError));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [copy.genericError, db]);

  useEffect(() => {
    if (step !== 'preview' || !label || !formOption || !storageOption) return;
    let mounted = true;
    setPreparing(true);
    setPreparedJob(null);
    setError('');
    void printer.prepare(label, { formOption, storageOption })
      .then((prepared) => {
        if (mounted) setPreparedJob(prepared);
      })
      .catch((caught: unknown) => {
        if (mounted) setError(errorMessage(caught, copy.printFailed));
      })
      .finally(() => {
        if (mounted) setPreparing(false);
      });
    return () => {
      mounted = false;
    };
  }, [copy.printFailed, formOption, label, printer, step, storageOption]);

  // Voice input can later resolve an item and call this exact function.
  function selectItem(selectedItem: KitchenItem) {
    setItem(selectedItem);
    setStorageOption(defaultOption(selectedItem.storageOptions));
    setFormOption(defaultOption(selectedItem.formOptions));
    setError('');
    setStep('storage');
  }

  async function selectStaff(member: StaffMember) {
    if (!item || !formOption || !storageOption) return;
    setBusy(true);
    setError('');
    try {
      const configuredShelfLife = await getShelfLife(
        db,
        item.id,
        formOption.id,
        storageOption.id,
      );
      const madeAt = getAppNow(settings);
      const draft = {
        itemId: item.id,
        itemName: getItemName(item.id, item.name, language),
        form: formOption.legacyValue,
        formOptionId: formOption.id,
        storageType: storageOption.legacyValue,
        storageOptionId: storageOption.id,
        madeAt: madeAt.toISOString(),
        staffId: member.id,
        staffName: member.name,
        labelWidthMm: settings.labelWidthMm,
        labelHeightMm: settings.labelHeightMm,
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
      setError(errorMessage(caught, copy.genericError));
    } finally {
      setBusy(false);
    }
  }

  async function printLabel() {
    if (!label) return;
    setBusy(true);
    setError('');
    try {
      const prepared = preparedJob ?? await printer.prepare(label, { formOption: formOption ?? undefined, storageOption: storageOption ?? undefined });
      const saved = await printer.printPrepared(label, prepared);
      setPrintedLabel(saved);
      setStep('printed');
      onPrinted();
    } catch (caught) {
      setError(errorMessage(caught, copy.genericError));
    } finally {
      setBusy(false);
    }
  }

  function resetFlow() {
    setItem(null);
    setStorageOption(null);
    setFormOption(null);
    setLabel(null);
    setDraftWithoutUseBy(null);
    setShelfLife(null);
    setPrintedLabel(null);
    setPreparedJob(null);
    setPreparing(false);
    setError('');
    setStep('item');
  }

  if (loading) {
    return <CenteredMessage loading message={copy.loadingItems} />;
  }

  if (step === 'item') {
    return (
      <View style={styles.screen}>
        <View style={styles.headerWithBanner}>
          <PageHeader title={copy.itemQuestion} subtitle={copy.itemHint} action={progress} />
          <SafetyBanner compact style={styles.headerBanner} />
        </View>
        {error ? <ErrorMessage message={error} /> : null}
        <ItemSelector items={items} onSelectItem={selectItem} />
      </View>
    );
  }

  if (!item || !storageOption || !formOption) {
    return <CenteredMessage message={copy.chooseItem} />;
  }

  const localizedItemName = getItemName(item.id, item.name, language);

  if (step === 'storage') {
    return (
      <View style={styles.screen}>
        <OptionStep
          title={copy.storageQuestion}
          subtitle={copy.likelyOptionHint(localizedItemName)}
          options={item.storageOptions}
          selected={storageOption}
          onSelect={(option) => {
            setStorageOption(option);
            setStep('form');
          }}
          onBack={resetFlow}
          progress={progress}
        />
      </View>
    );
  }

  if (step === 'form') {
    return (
      <View style={styles.screen}>
        <OptionStep
          title={copy.formQuestion}
          subtitle={`${localizedItemName} · ${getLabelOptionName(storageOption, language)}`}
          options={item.formOptions}
          selected={formOption}
          onSelect={(option) => {
            setFormOption(option);
            setStep('staff');
          }}
          onBack={() => setStep('storage')}
          progress={progress}
        />
      </View>
    );
  }

  if (step === 'staff') {
    return (
      <View style={styles.screen}>
        <PageHeader
          title={copy.staffQuestion}
          subtitle={`${localizedItemName} · ${getLabelOptionName(formOption, language)} · ${getLabelOptionName(storageOption, language)}`}
          action={progress}
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
                leading={<UserRound color={colors.secondary} size={sizes.iconMd} strokeWidth={2} />}
              />
            ))}
          </ScrollView>
        ) : (
          <Card style={styles.emptyStaff}>
            <Text style={styles.emptyTitle}>{copy.noStaffTitle}</Text>
            <Text style={styles.emptyBody}>{copy.noStaffBody}</Text>
          </Card>
        )}
        <BigButton
          label={copy.back}
          onPress={() => setStep('form')}
          variant="secondary"
          style={styles.bottomBack}
          leading={<ArrowLeft color={colors.ink} size={sizes.iconMd} strokeWidth={2} />}
        />
      </View>
    );
  }

  if (step === 'preview' && draftWithoutUseBy) {
    return (
      <View style={styles.screen}>
        <PageHeader title={copy.previewTitle} subtitle={copy.previewHint} action={progress} />
        {error ? <ErrorMessage message={error} /> : null}
        <ScrollView contentContainerStyle={styles.previewArea}>
          <LabelPreview
            label={label ?? draftWithoutUseBy}
            shelfLife={shelfLife}
            formOption={formOption}
            storageOption={storageOption}
            compact
          />
          {preparing ? (
            <View style={styles.preparing}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.preparingText}>{copy.preparingPrintImage}</Text>
            </View>
          ) : null}
          {!shelfLife ? (
            <View style={styles.noShelfLife}>
              <Text style={styles.noShelfTitle}>{copy.missingShelfTitle}</Text>
              <Text style={styles.noShelfBody}>
                {copy.missingShelfBody(
                  localizedItemName,
                  getLabelOptionName(formOption, language),
                  getLabelOptionName(storageOption, language),
                )}
              </Text>
            </View>
          ) : null}
        </ScrollView>
        <View style={styles.actionRow}>
          <BigButton
            label={copy.back}
            onPress={() => setStep('staff')}
            variant="secondary"
            style={styles.backButton}
            leading={<ArrowLeft color={colors.ink} size={sizes.iconMd} strokeWidth={2} />}
          />
          <BigButton
            label={busy ? copy.printing : error ? copy.retry : copy.printLabel}
            onPress={() => void printLabel()}
            disabled={!label || busy || preparing}
            style={styles.flexButton}
            leading={<Printer color={colors.background} size={sizes.iconLg} strokeWidth={2} />}
          />
        </View>
      </View>
    );
  }

  if (step === 'printed' && printedLabel) {
    return (
      <View style={styles.screen}>
        <PageHeader
          title={copy.mockPrintComplete}
          subtitle={copy.savedLabel(printedLabel.id)}
        />
        <View style={styles.printedNotice}>
          <CheckCircle2 color={colors.background} size={sizes.iconLg} strokeWidth={2} />
          <Text style={styles.printedNoticeText}>
            {copy.mockPrinterNotice}
          </Text>
        </View>
        <ScrollView contentContainerStyle={styles.previewArea}>
          <LabelPreview
            label={printedLabel}
            shelfLife={shelfLife}
            formOption={formOption}
            storageOption={storageOption}
            compact
          />
        </ScrollView>
        <BigButton label={copy.makeAnother} onPress={resetFlow} />
      </View>
    );
  }

  return <CenteredMessage message={copy.unableStep} />;
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

function errorMessage(caught: unknown, fallback: string): string {
  void caught;
  return fallback;
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.xxl, gap: spacing.lg, backgroundColor: colors.background },
  headerWithBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xl },
  headerBanner: { width: sizes.banner, flexShrink: 1 },
  staffGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, paddingVertical: spacing.lg },
  staffButton: { width: '31%', minHeight: sizes.tapMin + spacing.xxl },
  emptyStaff: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceRaised,
  },
  emptyTitle: { ...typography.h2, color: colors.ink },
  emptyBody: { ...typography.body, marginTop: spacing.xs, color: colors.muted },
  inlineButton: { marginTop: spacing.xl, minWidth: 260 },
  bottomBack: { width: 180 },
  previewArea: { flexGrow: 1, justifyContent: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  preparing: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  preparingText: { ...typography.body, color: colors.muted },
  noShelfLife: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radii.md,
    backgroundColor: colors.dangerSoft,
  },
  noShelfTitle: { ...typography.h3, color: colors.dangerDark },
  noShelfBody: { ...typography.body, marginTop: spacing.xxs, color: colors.dangerDark },
  actionRow: { flexDirection: 'row', gap: spacing.md },
  backButton: { width: 180 },
  flexButton: { flex: 1, minHeight: sizes.control + spacing.sm },
  printedNotice: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  printedNoticeText: { ...typography.bodyStrong, flex: 1, color: colors.background },
  error: {
    ...typography.bodyStrong,
    padding: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.dangerSoft,
    color: colors.dangerDark,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, backgroundColor: colors.background },
  centeredText: { ...typography.h3, color: colors.ink },
});
