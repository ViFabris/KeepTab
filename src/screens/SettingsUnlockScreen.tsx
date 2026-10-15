import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { ArrowLeft, LockKeyhole } from 'lucide-react-native';

import { BigButton } from '../components/BigButton';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { useLanguage } from '../i18n/LanguageContext';
import { PinInput } from '../settings/PinInput';
import { verifyAdminPin } from '../settings/pin';
import { colors, radii, sizes, spacing, typography } from '../theme';

export function SettingsUnlockScreen({
  onUnlocked,
  onCancel,
}: {
  onUnlocked: () => void;
  onCancel: () => void;
}) {
  const db = useSQLiteContext();
  const { copy } = useLanguage();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function unlock() {
    setBusy(true);
    setError('');
    try {
      if (await verifyAdminPin(db, pin)) {
        onUnlocked();
      } else {
        setError(copy.settings.wrongPin);
        setPin('');
      }
    } catch {
      setError(copy.genericError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Card style={styles.card}>
        <View style={styles.iconCircle}>
          <LockKeyhole color={colors.primary} size={sizes.iconXl} strokeWidth={2} />
        </View>
        <PageHeader title={copy.settings.unlockTitle} subtitle={copy.settings.unlockHint} />
        <View style={styles.pinWrap}>
          <PinInput label={copy.setup.pin} value={pin} onChange={setPin} />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.actions}>
          <BigButton
            label={copy.cancel}
            onPress={onCancel}
            variant="secondary"
            style={styles.button}
            leading={<ArrowLeft color={colors.ink} size={sizes.iconMd} strokeWidth={2} />}
          />
          <BigButton
            label={copy.settings.unlock}
            onPress={() => void unlock()}
            disabled={busy}
            style={styles.button}
            leading={<LockKeyhole color={colors.background} size={sizes.iconMd} strokeWidth={2} />}
          />
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, backgroundColor: colors.background },
  card: {
    width: '68%',
    maxWidth: 720,
    padding: spacing.xxl,
    gap: spacing.lg,
  },
  iconCircle: {
    width: sizes.control,
    height: sizes.control,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
  },
  pinWrap: { alignSelf: 'center', width: '70%' },
  actions: { flexDirection: 'row', gap: spacing.md },
  button: { flex: 1 },
  error: { ...typography.bodyStrong, color: colors.dangerDark, textAlign: 'center' },
});
