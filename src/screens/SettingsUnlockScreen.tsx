import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { BigButton } from '../components/BigButton';
import { PageHeader } from '../components/PageHeader';
import { useLanguage } from '../i18n/LanguageContext';
import { PinInput } from '../settings/PinInput';
import { verifyAdminPin } from '../settings/pin';
import { colors } from '../theme';

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
      <View style={styles.card}>
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
          />
          <BigButton
            label={copy.settings.unlock}
            onPress={() => void unlock()}
            disabled={busy}
            style={styles.button}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  card: {
    width: '68%',
    maxWidth: 720,
    padding: 30,
    gap: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  pinWrap: { alignSelf: 'center', width: '70%' },
  actions: { flexDirection: 'row', gap: 14 },
  button: { flex: 1 },
  error: { color: colors.danger, fontSize: 17, fontWeight: '800', textAlign: 'center' },
});
