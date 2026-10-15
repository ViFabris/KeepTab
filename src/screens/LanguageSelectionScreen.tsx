import { StyleSheet, Text, View } from 'react-native';

import { BigButton } from '../components/BigButton';
import { colors } from '../theme';
import type { Language } from '../types';

export function LanguageSelectionScreen({
  onSelect,
  busy,
  error,
}: {
  onSelect: (language: Language) => void;
  busy: boolean;
  error?: string;
}) {
  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.brand}>KeepTab</Text>
        <Text style={styles.title}>Escolha o idioma</Text>
        <Text style={styles.subtitle}>Choose your language</Text>
        <View style={styles.options}>
          <BigButton
            label="Português (Brasil)"
            onPress={() => onSelect('pt-BR')}
            disabled={busy}
            style={styles.option}
          />
          <BigButton
            label="English"
            onPress={() => onSelect('en')}
            disabled={busy}
            variant="secondary"
            style={styles.option}
          />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Text style={styles.note}>
          Você poderá alterar depois. · You can change this later.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    backgroundColor: colors.background,
  },
  card: {
    width: '72%',
    maxWidth: 760,
    padding: 42,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    backgroundColor: colors.surface,
  },
  brand: { color: colors.primary, fontSize: 34, fontWeight: '900' },
  title: { marginTop: 24, color: colors.ink, fontSize: 40, fontWeight: '900' },
  subtitle: { marginTop: 5, color: colors.muted, fontSize: 24, fontWeight: '600' },
  options: { width: '100%', marginTop: 34, flexDirection: 'row', gap: 18 },
  option: { flex: 1, minHeight: 90 },
  note: { marginTop: 24, color: colors.muted, fontSize: 16, textAlign: 'center' },
  error: {
    marginTop: 18,
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.dangerSoft,
    color: colors.dangerDark,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});
