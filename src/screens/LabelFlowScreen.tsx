import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { ArrowLeft, CheckCircle2, PackagePlus, Printer, UserRound } from 'lucide-react-native';

import { BigButton } from '../components/BigButton';
import { Card } from '../components/Card';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Input } from '../components/Input';
import { ItemSelector } from '../components/ItemSelector';
import { LabelPreview } from '../components/LabelPreview';
import { OptionStep } from '../components/OptionStep';
import { PageHeader } from '../components/PageHeader';
import { getItems, getShelfLife } from '../database/itemsRepository';
import { getLatestPackageEvidenceForItem } from '../database/packageScansRepository';
import { getStaff } from '../database/staffRepository';
import { getItemName, getLabelOptionName } from '../i18n';
import { useLanguage } from '../i18n/LanguageContext';
import { MockPrinter } from '../printing/MockPrinter';
import { PackageIntakeModal } from '../packages/PackageIntakeModal';
import { RULES_VERSION } from '../rules/rules';
import { evaluatePrintingGate } from '../rules/printingGate';
import { calculateValidity, type ValidityResult } from '../rules/validity';
import type { PreparedPrintJob } from '../printing/EscPosPrinter';
import { useSettings } from '../settings/SettingsContext';
import { colors, radii, sizes, spacing, typography } from '../theme';
import type {
  KitchenItem,
  ItemLabelOption,
  PackageEvidence,
  PrintableLabel,
  SavedLabel,
  ShelfLife,
  StaffMember,
} from '../types';
import { getAppNow } from '../utils/appClock';
import { zonedDateTimeToInstant } from '../utils/appClock';
import packageData from '../../package.json';

type FlowStep = 'item' | 'storage' | 'staff' | 'preview' | 'printed';

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
  const [validity, setValidity] = useState<ValidityResult | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [openedDays, setOpenedDays] = useState('');
  const [packageExpiry, setPackageExpiry] = useState('');
  const [packageEvidence, setPackageEvidence] = useState<PackageEvidence | null>(null);
  const [packageIntakeVisible, setPackageIntakeVisible] = useState(false);
  const [confirmTestPrint, setConfirmTestPrint] = useState(false);
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
    setFormOption(combineFormOptions(selectedItem.formOptions, language));
    setError('');
    if (selectedItem.storageOptions.length > 1) {
      setStep('storage');
    } else {
      setStep('staff');
    }
  }

  async function selectStaff(
    member: StaffMember,
    manufacturerDaysOverride?: number | null,
    packageExpiryOverride?: string,
    evidenceOverride?: PackageEvidence | null,
  ) {
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
      const opened = formIncludes(formOption, 'Opened');
      const confirmedPackage = evidenceOverride
        ?? packageEvidence
        ?? (!(formOption.preparedFood ?? false) ? await getLatestPackageEvidenceForItem(db, item.id) : null);
      const effectiveManufacturerDays = manufacturerDaysOverride
        ?? item.manufacturerDaysAfterOpen
        ?? confirmedPackage?.manufacturerDaysAfterOpen
        ?? null;
      const effectivePackageExpiry = packageExpiryOverride
        || packageExpiry
        || confirmedPackage?.packageExpiryDate
        || '';
      if (confirmedPackage) {
        setPackageEvidence(confirmedPackage);
        setPackageExpiry(confirmedPackage.packageExpiryDate);
      }
      if (opened && !openedDays && effectiveManufacturerDays) {
        setOpenedDays(String(effectiveManufacturerDays));
      }
      const result = calculateValidity({
        madeAt,
        timeZone: settings.timeZone,
        shelfLifeDays: configuredShelfLife && !configuredShelfLife.isPlaceholder
          ? configuredShelfLife.hours / 24
          : null,
        preparedFood: formOption.preparedFood ?? false,
        opened,
        storageTemperatureClass: storageOption.temperatureClass ?? inferTemperatureClass(storageOption.legacyValue),
        jurisdiction: settings.jurisdiction,
        fridgeAtOrBelow4C: settings.fridgeAtOrBelow4C,
        reducedMaximumDays: settings.reducedMaximumDays,
        plantBasedType: item.plantBasedType,
        heatTreated: item.heatTreated,
        manufacturerDaysAfterOpen: effectiveManufacturerDays,
        packageExpiryAt: parsePackageExpiry(effectivePackageExpiry, settings.timeZone),
      });
      const legalRule = result.allowed && Boolean(result.cappedBy);
      const gate = evaluatePrintingGate(result, item.verificationStatus, settings.verificationMode, {
        legalRule,
        confirmedPackage: Boolean(confirmedPackage),
      });
      const verificationBasis = item.verificationStatus === 'verified'
        ? 'item-review' as const
        : legalRule
          ? 'legal-rule' as const
          : confirmedPackage
            ? 'package-evidence' as const
            : 'test' as const;
      const draft: Omit<PrintableLabel, 'useByAt'> = {
        itemId: item.id,
        itemName: getItemName(item.id, item.name, language),
        form: formOption.legacyValue,
        formOptionId: formOption.id,
        storageType: storageOption.legacyValue,
        storageOptionId: storageOption.id,
        madeAt: madeAt.toISOString(),
        dateKind: opened ? 'opened' as const : 'prepared' as const,
        staffId: member.id,
        staffName: member.name,
        labelWidthMm: settings.labelWidthMm,
        labelHeightMm: settings.labelHeightMm,
        jurisdictions: settings.jurisdiction === 'RS' ? ['Federal', 'RS'] : ['Federal'],
        rulesVersion: RULES_VERSION,
        cappedByRuleId: result.allowed ? result.cappedBy?.ruleId ?? null : null,
        itemVerificationStatus: item.verificationStatus,
        verificationMode: settings.verificationMode,
        printerProfileSnapshot: settings.printerProfile,
        appVersion: packageData.version,
        packageScanId: confirmedPackage?.id ?? null,
        lotCode: confirmedPackage?.lotCode ?? '',
        productBarcode: confirmedPackage?.barcodeValue ?? '',
        verificationBasis,
      };
      setSelectedStaff(member);
      setDraftWithoutUseBy(draft);
      setShelfLife(configuredShelfLife);
      setValidity(result);
      setLabel(
        gate.allowed && result.allowed
          ? {
              ...draft,
              useByAt: result.expiresAt.toISOString(),
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
    if (label.verificationBasis === 'test' && settings.verificationMode === 'test' && !confirmTestPrint) {
      setConfirmTestPrint(true);
      return;
    }
    await printConfirmed();
  }

  async function printConfirmed() {
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
    setValidity(null);
    setSelectedStaff(null);
    setOpenedDays('');
    setPackageExpiry('');
    setPackageEvidence(null);
    setPackageIntakeVisible(false);
    setConfirmTestPrint(false);
    setStep('item');
  }

  if (loading) {
    return <CenteredMessage loading message={copy.loadingItems} />;
  }

  if (step === 'item') {
    return (
      <View style={styles.screen}>
        <PageHeader title={copy.itemQuestion} subtitle={copy.itemHint} />
        {error ? <ErrorMessage message={error} /> : null}
        {items.length ? (
          <ItemSelector items={items} onSelectItem={selectItem} />
        ) : (
          <Card style={styles.emptyCatalog}>
            <PackagePlus color={colors.secondary} size={sizes.iconXl} strokeWidth={2} />
            <Text style={styles.emptyTitle}>{copy.foodSafety.emptyCatalog}</Text>
          </Card>
        )}
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
            if (
              item.plantBasedType !== 'none' &&
              !item.heatTreated &&
              (option.temperatureClass ?? inferTemperatureClass(option.legacyValue)) === 'ambient'
            ) {
              setError(copy.foodSafety.ambientPlantBlock);
              return;
            }
            setError('');
            setStorageOption(option);
            setStep('staff');
          }}
          onBack={resetFlow}
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
          onPress={() => {
            if (item.storageOptions.length > 1) setStep('storage');
            else resetFlow();
          }}
          variant="secondary"
          style={styles.bottomBack}
          leading={<ArrowLeft color={colors.ink} size={sizes.iconMd} strokeWidth={2} />}
        />
      </View>
    );
  }

  if (step === 'preview' && draftWithoutUseBy) {
    const previewGate = validity
      ? evaluatePrintingGate(validity, item.verificationStatus, settings.verificationMode, {
          legalRule: validity.allowed && Boolean(validity.cappedBy),
          confirmedPackage: Boolean(packageEvidence),
        })
      : null;
    const strictVerificationBlock = previewGate?.reason === 'unverifiedStrict';
    const validityMessage = validity && !validity.allowed
      ? validity.reason === 'ambientPlantPreparation'
        ? copy.foodSafety.ambientPlantBlock
        : validity.reason === 'missingManufacturerDays'
          ? copy.foodSafety.missingManufacturerDays
          : copy.missingShelfBody(localizedItemName, getLabelOptionName(formOption, language), getLabelOptionName(storageOption, language))
      : '';
    return (
      <View style={styles.screen}>
        <PageHeader title={copy.previewTitle} subtitle={copy.previewHint} />
        {error ? <ErrorMessage message={error} /> : null}
        <ScrollView contentContainerStyle={styles.previewArea}>
          {previewGate?.requiresTestWarning ? (
            <Text style={styles.testBanner}>{copy.foodSafety.testModeBanner}</Text>
          ) : null}
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
          {validity && !validity.allowed && validity.reason === 'missingShelfLife' ? (
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
          {strictVerificationBlock ? (
            <View style={styles.noShelfLife}><Text style={styles.noShelfTitle}>{copy.foodSafety.unverified}</Text><Text style={styles.noShelfBody}>{copy.foodSafety.notVerifiedBlock}</Text></View>
          ) : null}
          {validityMessage && validity && !validity.allowed && validity.reason !== 'missingShelfLife' ? (
            <View style={styles.noShelfLife}><Text style={styles.noShelfTitle}>{copy.missingShelfTitle}</Text><Text style={styles.noShelfBody}>{validityMessage}</Text></View>
          ) : null}
          {formIncludes(formOption, 'Opened') ? (
            <Card style={styles.openedInputs}>
              <Input keyboardType="number-pad" label={copy.foodSafety.manufacturerDays} onChangeText={(value) => setOpenedDays(value.replace(/\D/g, ''))} value={openedDays} />
              <Input label={copy.foodSafety.packageExpiry} onChangeText={setPackageExpiry} value={packageExpiry} />
              <BigButton label={copy.settings.save} disabled={!openedDays} onPress={() => selectedStaff ? void selectStaff(selectedStaff, Number(openedDays)) : undefined} />
            </Card>
          ) : null}
          <Card style={styles.packageCard}>
            <View style={styles.packageCopy}>
              <Text style={styles.packageTitle}>{copy.foodSafety.packageIntakeTitle}</Text>
              <Text style={styles.packageHint}>
                {packageEvidence ? copy.foodSafety.packageSaved : copy.foodSafety.packageIntakeHint}
              </Text>
              {packageEvidence ? (
                <Text style={styles.packageMeta}>
                  {copy.foodSafety.lotCode}: {packageEvidence.lotCode || '—'} · {copy.foodSafety.packageExpiry}: {packageEvidence.packageExpiryDate}
                </Text>
              ) : null}
            </View>
            <BigButton
              label={copy.foodSafety.scanPackage}
              onPress={() => setPackageIntakeVisible(true)}
              variant="secondary"
              style={styles.packageButton}
            />
          </Card>
          {validity?.allowed && validity.cappedBy ? (
            <Text style={styles.ruleExplanation}>{copy.foodSafety.ruleLimited(validity.cappedBy.limitDays, validity.cappedBy.law, validity.cappedBy.itemNumber)}</Text>
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
        <ConfirmDialog
          body={copy.foodSafety.testPrintWarning}
          cancelLabel={copy.cancel}
          confirmLabel={copy.foodSafety.confirmPrint}
          onCancel={() => setConfirmTestPrint(false)}
          onConfirm={() => { setConfirmTestPrint(false); void printConfirmed(); }}
          title={copy.foodSafety.testModeBanner}
          visible={confirmTestPrint}
        />
        <PackageIntakeModal
          itemId={item.id}
          onCancel={() => setPackageIntakeVisible(false)}
          onConfirmed={(evidence) => {
            setPackageEvidence(evidence);
            setPackageExpiry(evidence.packageExpiryDate);
            if (evidence.manufacturerDaysAfterOpen) {
              setOpenedDays(String(evidence.manufacturerDaysAfterOpen));
            }
            setPackageIntakeVisible(false);
            if (selectedStaff) {
              void selectStaff(
                selectedStaff,
                evidence.manufacturerDaysAfterOpen,
                evidence.packageExpiryDate,
                evidence,
              );
            }
          }}
          requireManufacturerDays={formIncludes(formOption, 'Opened')}
          visible={packageIntakeVisible}
        />
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

function inferTemperatureClass(storage: string): 'refrigerated' | 'frozen' | 'ambient' {
  if (storage.toLocaleLowerCase() === 'frozen' || storage.toLocaleLowerCase() === 'congelado') return 'frozen';
  if (storage.toLocaleLowerCase() === 'refrigerated' || storage.toLocaleLowerCase() === 'refrigerado') return 'refrigerated';
  return 'ambient';
}

function combineFormOptions(options: ItemLabelOption[], language: 'en' | 'pt-BR'): ItemLabelOption {
  if (options.length === 1 && options[0]) return options[0];
  if (!options.length) throw new Error('This item has no configured form options.');
  return {
    id: options.map((option) => option.id).join('|'),
    kind: 'form',
    translationKey: null,
    customLabel: options.map((option) => getLabelOptionName(option, language)).join(' · '),
    legacyValue: options.map((option) => option.legacyValue).join(' + '),
    sortOrder: Math.min(...options.map((option) => option.sortOrder)),
    appliesToAll: false,
    isDefault: true,
    preparedFood: options.some((option) => option.preparedFood),
  };
}

function formIncludes(option: ItemLabelOption, legacyValue: string): boolean {
  return option.legacyValue.split(' + ').includes(legacyValue);
}

function parsePackageExpiry(value: string, timeZone: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  return zonedDateTimeToInstant({
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: 23,
    minute: 59,
    second: 0,
  }, timeZone);
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.xxl, gap: spacing.lg, backgroundColor: colors.background },
  emptyCatalog: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.xxl },
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
  testBanner: { ...typography.bodyStrong, alignSelf: 'center', padding: spacing.sm, borderRadius: radii.sm, backgroundColor: colors.accent, color: colors.ink },
  openedInputs: { gap: spacing.sm, padding: spacing.md },
  packageCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  packageCopy: { flex: 1, minWidth: 0, gap: spacing.xxs },
  packageTitle: { ...typography.h3, color: colors.ink },
  packageHint: { ...typography.caption, color: colors.muted },
  packageMeta: { ...typography.bodyStrong, color: colors.primaryDark },
  packageButton: { minWidth: 300 },
  ruleExplanation: { ...typography.bodyStrong, alignSelf: 'center', color: colors.primaryDark },
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
