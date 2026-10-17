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
import { parseProductBarcode, type ParsedProductBarcode } from './gs1';

const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr', 'datamatrix', 'code128'] as const;

export function PackageIntakeModal({
  visible,
  itemId,
  onCancel,
  onConfirmed,
}: {
  visible: boolean;
  itemId: string;
  onCancel: () => void;
  onConfirmed: (evidence: PackageEvidence) => void;
}) {
  const db = useSQLiteContext();
  const { copy } = useLanguage();
  const { settings } = useSettings();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [parsed, setParsed] = useState<ParsedProductBarcode | null>(null);
  const [photoUri, setPhotoUri] = useState('');
  const [lotCode, setLotCode] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [manufacturerDays, setManufacturerDays] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setParsed(null);
    setPhotoUri('');
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

  async function capturePhoto() {
    setBusy(true);
    setError('');
    try {
      const picture = await cameraRef.current?.takePictureAsync({ quality: 0.75 });
      if (!picture?.uri) throw new Error('NO_PHOTO');
      setPhotoUri(await persistEvidencePhoto(picture.uri));
    } catch {
      setError(copy.genericError);
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!parsed) return;
    if (!photoUri) {
      setError(copy.foodSafety.packagePhotoRequired);
      return;
    }
    if (!expiryDate.trim()) {
      setError(copy.foodSafety.packageExpiryRequired);
      return;
    }
    if (!isValidIsoDate(expiryDate)) {
      setError(copy.foodSafety.packageDateInvalid);
      return;
    }
    const days = manufacturerDays ? Number(manufacturerDays) : null;
    setBusy(true);
    setError('');
    try {
      const evidence = await savePackageEvidence(db, {
        itemId,
        barcodeValue: parsed.rawValue,
        barcodeFormat: parsed.format,
        gtin: parsed.gtin ?? '',
        lotCode: lotCode.trim(),
        packageExpiryDate: expiryDate.trim(),
        manufacturerDaysAfterOpen: days && Number.isInteger(days) && days > 0 ? days : null,
        photoUri,
        confirmedAt: getAppNow(settings).toISOString(),
      });
      onConfirmed(evidence);
    } catch {
      setError(copy.genericError);
    } finally {
      setBusy(false);
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
              {photoUri ? (
                <Image accessibilityLabel={copy.foodSafety.photoEvidence} source={{ uri: photoUri }} style={styles.camera} resizeMode="cover" />
              ) : (
                <CameraView
                  ref={cameraRef}
                  barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
                  facing="back"
                  onBarcodeScanned={parsed ? undefined : (result) => void handleBarcode(result)}
                  style={styles.camera}
                />
              )}
              <View style={styles.cameraFooter}>
                <ScanBarcode color={colors.secondary} size={sizes.iconMd} strokeWidth={2} />
                <Text style={styles.cameraHint}>{parsed ? copy.foodSafety.barcode : copy.foodSafety.noBarcodeYet}</Text>
              </View>
              <View style={styles.cameraActions}>
                {parsed ? (
                  <BigButton
                    label={copy.foodSafety.scanAgain}
                    onPress={() => {
                      setParsed(null);
                      setPhotoUri('');
                      setLotCode('');
                      setExpiryDate('');
                      setError('');
                    }}
                    variant="secondary"
                    style={styles.flex}
                  />
                ) : null}
                <BigButton
                  disabled={busy || !parsed}
                  label={photoUri ? copy.foodSafety.retakePhoto : copy.foodSafety.captureEvidence}
                  onPress={() => {
                    if (photoUri) setPhotoUri('');
                    else void capturePhoto();
                  }}
                  variant="secondary"
                  style={styles.flex}
                  leading={<Camera color={colors.ink} size={sizes.iconMd} strokeWidth={2} />}
                />
              </View>
            </Card>

            <ScrollView contentContainerStyle={styles.form}>
              {parsed ? (
                <>
                  <Card style={styles.detectedCard}>
                    <CheckCircle2 color={colors.primary} size={sizes.iconMd} strokeWidth={2} />
                    <Text style={styles.detectedText}>
                      {parsed.expiryDate || parsed.bestBeforeDate || parsed.lotCode
                        ? copy.foodSafety.packageDetailsDetected
                        : copy.foodSafety.barcodeOnlyNotice}
                    </Text>
                  </Card>
                  <Input editable={false} label={copy.foodSafety.barcode} value={parsed.rawValue} />
                  {parsed.gtin ? <Input editable={false} label={copy.foodSafety.gtin} value={parsed.gtin} /> : null}
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
                  {error ? <Text style={styles.error}>{error}</Text> : null}
                  <BigButton
                    disabled={busy || !photoUri}
                    label={copy.foodSafety.confirmPackage}
                    onPress={() => void confirm()}
                  />
                </>
              ) : (
                <Text style={styles.emptyText}>{copy.foodSafety.noBarcodeYet}</Text>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
}

async function persistEvidencePhoto(uri: string): Promise<string> {
  if (uri.startsWith('data:') || !FileSystem.documentDirectory) return uri;
  const directory = `${FileSystem.documentDirectory}package-evidence/`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const target = `${directory}package-${Date.now()}.jpg`;
  await FileSystem.copyAsync({ from: uri, to: target });
  return target;
}

function isValidIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

const styles = StyleSheet.create({
  screen: { flex: 1, gap: spacing.lg, padding: spacing.xl, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg },
  headerCopy: { flex: 1, gap: spacing.xs },
  title: { ...typography.h1, color: colors.ink },
  hint: { ...typography.body, color: colors.muted },
  close: { width: 180 },
  content: { flex: 1, minHeight: 0, flexDirection: 'row', gap: spacing.lg },
  cameraCard: { flex: 1.1, minWidth: 0, gap: spacing.sm, padding: spacing.md },
  camera: { flex: 1, minHeight: 300, borderRadius: radii.md, overflow: 'hidden', backgroundColor: colors.ink },
  cameraFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cameraHint: { ...typography.body, flex: 1, color: colors.muted },
  cameraActions: { flexDirection: 'row', gap: spacing.sm },
  form: { flexGrow: 1, gap: spacing.sm, paddingBottom: spacing.xl },
  permissionCard: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.xxl },
  body: { ...typography.body, maxWidth: 680, textAlign: 'center', color: colors.ink },
  detectedCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.sm, backgroundColor: colors.primarySoft },
  detectedText: { ...typography.caption, flex: 1, color: colors.primaryDark },
  emptyText: { ...typography.body, color: colors.muted },
  error: { ...typography.bodyStrong, color: colors.dangerDark },
  flex: { flex: 1 },
});
