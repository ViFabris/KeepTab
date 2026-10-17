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
import {
  closePackageBatch,
  getPackageBatchesForItem,
  openPackageBatch,
} from '../database/packageScansRepository';
import { getStaff } from '../database/staffRepository';
import { getItemName, getLabelOptionName } from '../i18n';
import { useLanguage } from '../i18n/LanguageContext';
import { MockPrinter } from '../printing/MockPrinter';
import { PackageIntakeModal } from '../packages/PackageIntakeModal';
import { PackageBatchSelector } from '../packages/PackageBatchSelector';
import {
  formRequiresOpening,
  getPackageBatchLimits,
  isPackageBatchExpired,
  sortPackageBatches,
  toggleBatchSelection,
} from '../packages/batchSelection';
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
import { getAppNow, getZonedDateTimeParts } from '../utils/appClock';
import { zonedDateTimeToInstant } from '../utils/appClock';
import packageData from '../../package.json';

type FlowStep = 'item' | 'storage' | 'batch' | 'staff' | 'preview' | 'printed';

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
  const [packageEvidence, setPackageEvidence] = useState<PackageEvidence | null>(null);
  const [packageBatches, setPackageBatches] = useState<PackageEvidence[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<number[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [batchMessage, setBatchMessage] = useState('');
  const [batchMessageIsError, setBatchMessageIsError] = useState(false);
  const [pendingBatchClose, setPendingBatchClose] = useState<PackageEvidence | null>(null);
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

  useEffect(() => {
    if (step !== 'batch' || !item) return;
    let mounted = true;
    setLoadingBatches(true);
    setBatchMessage('');
    setBatchMessageIsError(false);
    setPendingBatchClose(null);
    void getPackageBatchesForItem(db, item.id)
      .then((batches) => {
        if (!mounted) return;
        setPackageBatches(sortPackageBatches(batches));
        setSelectedBatchIds((current) => current.filter((id) => batches.some((batch) => batch.id === id)));
      })
      .catch(() => {
        if (mounted) {
          setBatchMessage(copy.genericError);
          setBatchMessageIsError(true);
        }
      })
      .finally(() => {
        if (mounted) setLoadingBatches(false);
      });
    return () => {
      mounted = false;
    };
  }, [copy.genericError, db, item, step]);

  // Voice input can later resolve an item and call this exact function.
  function selectItem(selectedItem: KitchenItem) {
    const combinedForm = combineFormOptions(selectedItem.formOptions, language);
    setItem(selectedItem);
    setStorageOption(defaultOption(selectedItem.storageOptions));
    setFormOption(combinedForm);
    setError('');
    if (selectedItem.storageOptions.length > 1) {
      setStep('storage');
    } else {
      setStep(combinedForm.preparedFood ? 'staff' : 'batch');
    }
  }

  async function selectStaff(member: StaffMember) {
    if (!item || !formOption || !storageOption) return;
    const outsideProduct = !(formOption.preparedFood ?? false);
    const selectedBatches = packageBatches.filter((batch) => selectedBatchIds.includes(batch.id));
    if (outsideProduct && !selectedBatches.length) {
      setError(copy.foodSafety.batchRequired);
      setStep('batch');
      return;
    }
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
      const opened = formRequiresOpening(formOption.legacyValue.split(' + '));
      const batchLimits = getPackageBatchLimits(selectedBatches);
      const confirmedPackage = selectedBatches[0] ?? null;
      const effectiveManufacturerDays = batchLimits.manufacturerDaysAfterOpen
        ?? item.manufacturerDaysAfterOpen
        ?? null;
      const effectivePackageExpiry = batchLimits.packageExpiryDate;
      if (confirmedPackage) {
        setPackageEvidence(confirmedPackage);
      }
      const result = calculateValidity({
        madeAt,
        timeZone: settings.timeZone,
        shelfLifeDays: configuredShelfLife && !configuredShelfLife.isPlaceholder
          ? configuredShelfLife.hours / 24
          : null,
        preparedFood: formOption.preparedFood ?? false,
        opened,
        openedAt: batchLimits.openedAt ? new Date(batchLimits.openedAt) : null,
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
        confirmedPackage: selectedBatches.length > 0,
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
        packageScanIds: selectedBatches.map((batch) => batch.id),
        lotCode: selectedBatches.map((batch) => batch.lotCode).filter(Boolean).join(' / '),
        productBarcode: [...new Set(selectedBatches.map((batch) => batch.barcodeValue).filter(Boolean))].join(' / '),
        verificationBasis,
      };
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

  async function continueWithBatches() {
    if (!formOption) return;
    const today = currentDateKey(getAppNow(settings), settings.timeZone);
    const selected = packageBatches.filter(
      (batch) => selectedBatchIds.includes(batch.id) && !isPackageBatchExpired(batch, today),
    );
    if (!selected.length) {
      setBatchMessage(copy.foodSafety.batchRequired);
      setBatchMessageIsError(true);
      return;
    }
    setBusy(true);
    setBatchMessage('');
    setBatchMessageIsError(false);
    try {
      if (formRequiresOpening(formOption.legacyValue.split(' + '))) {
        const openedAt = getAppNow(settings).toISOString();
        for (const batch of selected) {
          if (batch.status === 'sealed') await openPackageBatch(db, batch.id, openedAt);
        }
        setPackageBatches((current) => current.map((batch) => (
          selectedBatchIds.includes(batch.id) && batch.status === 'sealed'
            ? { ...batch, status: 'open', openedAt }
            : batch
        )));
      }
      setStep('staff');
    } catch {
      setBatchMessage(copy.genericError);
      setBatchMessageIsError(true);
    } finally {
      setBusy(false);
    }
  }

  async function markBatchUsedUp(batch: PackageEvidence) {
    setBusy(true);
    setBatchMessage('');
    setBatchMessageIsError(false);
    try {
      await closePackageBatch(db, batch.id, getAppNow(settings).toISOString());
      setPackageBatches((current) => current.filter((candidate) => candidate.id !== batch.id));
      setSelectedBatchIds((current) => current.filter((id) => id !== batch.id));
      setBatchMessage(copy.foodSafety.batchUsedUp);
    } catch {
      setBatchMessage(copy.genericError);
      setBatchMessageIsError(true);
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
    setPackageEvidence(null);
    setPackageBatches([]);
    setSelectedBatchIds([]);
    setLoadingBatches(false);
    setBatchMessage('');
    setBatchMessageIsError(false);
    setPendingBatchClose(null);
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
            setStep(formOption.preparedFood ? 'staff' : 'batch');
          }}
          onBack={resetFlow}
        />
      </View>
    );
  }

  if (step === 'batch') {
    const today = currentDateKey(getAppNow(settings), settings.timeZone);
    return (
      <>
        <PackageBatchSelector
          batches={packageBatches}
          busy={busy}
          loading={loadingBatches}
          message={batchMessage}
          messageIsError={batchMessageIsError}
          onAdd={() => setPackageIntakeVisible(true)}
          onBack={() => {
            if (item.storageOptions.length > 1) setStep('storage');
            else resetFlow();
          }}
          onContinue={() => void continueWithBatches()}
          onMarkUsedUp={setPendingBatchClose}
          onToggle={(batch) => setSelectedBatchIds((current) => toggleBatchSelection(current, batch.id))}
          selectedIds={selectedBatchIds}
          today={today}
        />
        <PackageIntakeModal
          activeBatches={packageBatches.filter((batch) => !isPackageBatchExpired(batch, today))}
          itemId={item.id}
          onCancel={() => setPackageIntakeVisible(false)}
          onConfirmed={(evidence) => {
            setPackageBatches((current) => sortPackageBatches([...current, evidence]));
            setSelectedBatchIds([evidence.id]);
            setPackageIntakeVisible(false);
            setBatchMessage(copy.foodSafety.packageSaved);
            setBatchMessageIsError(false);
          }}
          onMatched={(evidence) => {
            setSelectedBatchIds([evidence.id]);
            setPackageIntakeVisible(false);
            setBatchMessage(copy.foodSafety.batchMatched);
            setBatchMessageIsError(false);
          }}
          requireManufacturerDays={formRequiresOpening(formOption.legacyValue.split(' + '))}
          visible={packageIntakeVisible}
        />
        <ConfirmDialog
          body={copy.foodSafety.closeBatchHint}
          cancelLabel={copy.cancel}
          confirmLabel={copy.foodSafety.markBatchUsedUp}
          onCancel={() => setPendingBatchClose(null)}
          onConfirm={() => {
            const batch = pendingBatchClose;
            setPendingBatchClose(null);
            if (batch) void markBatchUsedUp(batch);
          }}
          title={copy.foodSafety.closeBatchTitle(pendingBatchClose?.lotCode || `#${pendingBatchClose?.id ?? ''}`)}
          visible={pendingBatchClose !== null}
        />
      </>
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
            if (!(formOption.preparedFood ?? false)) setStep('batch');
            else if (item.storageOptions.length > 1) setStep('storage');
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
          {packageEvidence ? (
            <Card style={styles.packageCard}>
              <View style={styles.packageCopy}>
                <Text style={styles.packageTitle}>{copy.foodSafety.batchSelectionTitle}</Text>
                {selectedBatchIds.length > 1 ? (
                  <Text style={styles.packageHint}>{copy.foodSafety.combinedBatches}</Text>
                ) : null}
                {packageBatches.filter((batch) => selectedBatchIds.includes(batch.id)).map((batch) => (
                  <Text key={batch.id} style={styles.packageMeta}>
                    {copy.foodSafety.lotCode}: {batch.lotCode || `#${batch.id}`} · {copy.foodSafety.packageExpiry}: {batch.packageExpiryDate}
                  </Text>
                ))}
              </View>
            </Card>
          ) : null}
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

function currentDateKey(date: Date, timeZone: string): string {
  const parts = getZonedDateTimeParts(date, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
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
  packageCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  packageCopy: { flex: 1, minWidth: 0, gap: spacing.xxs },
  packageTitle: { ...typography.h3, color: colors.ink },
  packageHint: { ...typography.caption, color: colors.muted },
  packageMeta: { ...typography.bodyStrong, color: colors.primaryDark },
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
