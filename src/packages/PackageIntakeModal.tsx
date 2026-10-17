import { useEffect, useRef, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import { useSQLiteContext } from 'expo-sqlite';
import { Camera, CheckCircle2, ScanBarcode, X } from 'lucide-react-native';

import { BigButton } from '../components/BigButton';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { getLatestPackageProfile, savePackageEvidence } from '../database/packageScansRepository';
import { useLanguage } from '../i18n/LanguageContext';
import { useSettings } from '../settings/SettingsContext';
import { colors, radii, sizes, spacing, typography } from '../theme';
import type { PackageEvidence } from '../types';
import { getAppNow } from '../utils/appClock';
import { validatePackageEvidence, type PackageEvidenceValidationError } from './evidenceValidation';
import { parseProductBarcode, type ParsedProductBarcode } from './gs1';

const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr', 'datamatrix', 'code128'] as const;

export function PackageIntakeModal({
  visible,
  itemId,
  requireManufacturerDays = false,
  onCancel,
  onConfirmed,
}: {
  visible: boolean;
  itemId: string;
  requireManufacturerDays?: boolean;
  onCancel: () => void;
  onConfirmed: (evidence: PackageEvidence) => void;
}) {
  const db = useSQLiteContext();
  const { copy } = useLanguage();
  const { settings } = useSettings();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [parsed, setParsed] = useState<ParsedProductBarcode | null>(null);
  const [productPhotoUri, setProductPhotoUri] = useState('');
  const [expiryPhotoUri, setExpiryPhotoUri] = useState('');
  const [lotCode, setLotCode] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [manufacturerDays, setManufacturerDays] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setParsed(null);
    setProductPhotoUri('');
    setExpiryPhotoUri('');
    setLotCode('');
    setExpiryDate('');
    setManufacturerDays('');
    setError('');
  }, [visible]);

  async function handleBarcode(result: BarcodeScanningResult) {
    if (parsed) return;
    const next = parseProductBarcode(result.data, result.type);
    setParsed(next);
    setLotCode(next.lotCode ?? '');
    setExpiryDate(next.expiryDate ?? next.bestBeforeDate ?? '');
    if (next.gtin) {
      const profile = await getLatestPackageProfile(db, next.gtin);
      if (profile?.manufacturerDaysAfterOpen) {
        setManufacturerDays(String(profile.manufacturerDaysAfterOpen));
      }
    }
  }

  async function capturePhoto(target: 'product' | 'expiry') {
    setBusy(true);
    setError('');
    try {
      const picture = await cameraRef.current?.takePictureAsync({ quality: 0.75 });
      if (!picture?.uri) throw new Error('NO_PHOTO');
      const uri = await persistEvidencePhoto(picture.uri, target);
      if (target === 'product') setProductPhotoUri(uri);
      else setExpiryPhotoUri(uri);
    } catch {
      setError(copy.genericError);
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    const validationError = validatePackageEvidence({
      barcodeValue: parsed?.rawValue ?? '',
      productPhotoUri,
      expiryPhotoUri,
      expiryDate,
      manufacturerDays,
      requireManufacturerDays,
    });
    if (validationError) {
      setError(validationMessage(validationError));
      return;
    }

    const days = manufacturerDays ? Number(manufacturerDays) : null;
    setBusy(true);
    setError('');
    try {
      const evidence = await savePackageEvidence(db, {
        itemId,
        barcodeValue: parsed?.rawValue ?? '',
        barcodeFormat: parsed?.format ?? '',
        gtin: parsed?.gtin ?? '',
        lotCode: lotCode.trim(),
        packageExpiryDate: expiryDate.trim(),
        manufacturerDaysAfterOpen: days && Number.isInteger(days) && days > 0 ? days : null,
        productPhotoUri,
        expiryPhotoUri,
        confirmedAt: getAppNow(settings).toISOString(),
        status: 'sealed',
        openedAt: null,
        closedAt: null,
      });
      onConfirmed(evidence);
    } catch {
      setError(copy.genericError);
    } finally {
      setBusy(false);
    }
  }

  function validationMessage(reason: PackageEvidenceValidationError): string {
    switch (reason) {
      case 'productIdentityRequired': return copy.foodSafety.productIdentityRequired;
      case 'expiryPhotoRequired': return copy.foodSafety.expiryPhotoRequired;
      case 'expiryRequired': return copy.foodSafety.packageExpiryRequired;
      case 'expiryInvalid': return copy.foodSafety.packageDateInvalid;
      case 'manufacturerDaysRequired': return copy.foodSafety.manufacturerDaysRequired;
    }
  }

  return (
    <Modal animationType="slide" onRequestClose={onCancel} visible={visible}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{copy.foodSafety.packageIntakeTitle}</Text>
            <Text style={styles.hint}>{copy.foodSafety.packageIntakeHint}</Text>
          </View>
          <BigButton
            label={copy.settings.close}
            onPress={onCancel}
            variant="secondary"
            style={styles.close}
            leading={<X color={colors.ink} size={sizes.iconMd} strokeWidth={2} />}
          />
        </View>

        {!permission?.granted ? (
          <Card style={styles.permissionCard}>
            <Camera color={colors.secondary} size={sizes.iconXl} strokeWidth={2} />
            <Text style={styles.body}>{copy.foodSafety.cameraPermission}</Text>
            <BigButton label={copy.foodSafety.grantCameraPermission} onPress={() => void requestPermission()} />
          </Card>
        ) : (
          <View style={styles.content}>
            <Card style={styles.cameraCard}>
              <CameraView
                ref={cameraRef}
                barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
                facing="back"
                onBarcodeScanned={parsed ? undefined : (result) => void handleBarcode(result)}
                style={styles.camera}
              />
              <View style={styles.cameraFooter}>
                <ScanBarcode color={parsed ? colors.primary : colors.secondary} size={sizes.iconMd} strokeWidth={2} />
                <Text style={styles.cameraHint}>
                  {parsed ? copy.foodSafety.barcodeCaptured : copy.foodSafety.noBarcodeYet}
                </Text>
              </View>
              <View style={styles.cameraActions}>
                {parsed ? (
                  <BigButton
                    label={copy.foodSafety.scanAgain}
                    onPress={() => {
                      setParsed(null);
                      setLotCode('');
                      setExpiryDate('');
                      setError('');
                    }}
                    variant="secondary"
                    style={styles.cameraAction}
                  />
                ) : null}
                <BigButton
                  disabled={busy}
                  label={productPhotoUri ? copy.foodSafety.retakeProductPhoto : copy.foodSafety.captureProductPhoto}
                  onPress={() => void capturePhoto('product')}
                  variant="secondary"
                  style={styles.cameraAction}
                  leading={<Camera color={colors.ink} size={sizes.iconMd} strokeWidth={2} />}
                />
                <BigButton
                  disabled={busy}
                  label={expiryPhotoUri ? copy.foodSafety.retakeExpiryPhoto : copy.foodSafety.captureExpiryPhoto}
                  onPress={() => void capturePhoto('expiry')}
                  variant="secondary"
                  style={styles.cameraAction}
                  leading={<Camera color={colors.ink} size={sizes.iconMd} strokeWidth={2} />}
                />
              </View>
            </Card>

            <ScrollView contentContainerStyle={styles.form}>
              <Card style={styles.evidenceCard}>
                <Text style={styles.sectionTitle}>{copy.foodSafety.productIdentityEvidence}</Text>
                <Text style={styles.hint}>{copy.foodSafety.productIdentityEvidenceHint}</Text>
                {parsed ? (
                  <View style={styles.detectedCard}>
                    <CheckCircle2 color={colors.primary} size={sizes.iconMd} strokeWidth={2} />
                    <Text style={styles.detectedText}>
                      {parsed.expiryDate || parsed.bestBeforeDate || parsed.lotCode
                        ? copy.foodSafety.packageDetailsDetected
                        : copy.foodSafety.barcodeOnlyNotice}
                    </Text>
                  </View>
                ) : null}
                {parsed ? <Input editable={false} label={copy.foodSafety.barcode} value={parsed.rawValue} /> : null}
                {parsed?.gtin ? <Input editable={false} label={copy.foodSafety.gtin} value={parsed.gtin} /> : null}
                {productPhotoUri ? (
                  <Image
                    accessibilityLabel={copy.foodSafety.productPhotoEvidence}
                    resizeMode="cover"
                    source={{ uri: productPhotoUri }}
                    style={styles.thumbnail}
                  />
                ) : null}
              </Card>

              <Card style={styles.evidenceCard}>
                <Text style={styles.sectionTitle}>{copy.foodSafety.expiryEvidence}</Text>
                <Text style={styles.hint}>{copy.foodSafety.expiryEvidenceHint}</Text>
                {expiryPhotoUri ? (
                  <Image
                    accessibilityLabel={copy.foodSafety.expiryPhotoEvidence}
                    resizeMode="cover"
                    source={{ uri: expiryPhotoUri }}
                    style={styles.thumbnail}
                  />
                ) : null}
                <Input label={copy.foodSafety.lotCode} onChangeText={setLotCode} value={lotCode} />
                <Input
                  label={copy.foodSafety.packageExpiry}
                  onChangeText={setExpiryDate}
                  placeholder={copy.setup.datePlaceholder('YYYY-MM-DD')}
                  value={expiryDate}
                />
                <Input
                  keyboardType="number-pad"
                  label={copy.foodSafety.manufacturerDays}
                  onChangeText={(value) => setManufacturerDays(value.replace(/\D/g, ''))}
                  value={manufacturerDays}
                />
              </Card>

              {error ? <Text style={styles.error}>{error}</Text> : null}
              <BigButton
                disabled={busy}
                label={copy.foodSafety.confirmPackage}
                onPress={() => void confirm()}
              />
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
}

async function persistEvidencePhoto(uri: string, target: 'product' | 'expiry'): Promise<string> {
  if (uri.startsWith('data:') || !FileSystem.documentDirectory) return uri;
  const directory = `${FileSystem.documentDirectory}package-evidence/`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const destination = `${directory}${target}-${Date.now()}.jpg`;
  await FileSystem.copyAsync({ from: uri, to: destination });
  return destination;
}

const styles = StyleSheet.create({
  screen: { flex: 1, gap: spacing.lg, padding: spacing.xl, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg },
  headerCopy: { flex: 1, gap: spacing.xs },
  title: { ...typography.h1, color: colors.ink },
  sectionTitle: { ...typography.h3, color: colors.ink },
  hint: { ...typography.body, color: colors.muted },
  close: { width: 180 },
  content: { flex: 1, minHeight: 0, flexDirection: 'row', gap: spacing.lg },
  cameraCard: { flex: 1.1, minWidth: 0, gap: spacing.sm, padding: spacing.md },
  camera: { flex: 1, minHeight: 300, borderRadius: radii.md, overflow: 'hidden', backgroundColor: colors.ink },
  cameraFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cameraHint: { ...typography.body, flex: 1, color: colors.muted },
  cameraActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cameraAction: { flexGrow: 1, minWidth: 210 },
  form: { flexGrow: 1, gap: spacing.sm, paddingBottom: spacing.xl },
  evidenceCard: { gap: spacing.sm, padding: spacing.md },
  permissionCard: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.xxl },
  body: { ...typography.body, maxWidth: 680, textAlign: 'center', color: colors.ink },
  detectedCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.sm, backgroundColor: colors.primarySoft },
  detectedText: { ...typography.caption, flex: 1, color: colors.primaryDark },
  thumbnail: { width: '100%', height: 150, borderRadius: radii.md, backgroundColor: colors.surfaceRaised },
  error: { ...typography.bodyStrong, color: colors.dangerDark },
});
