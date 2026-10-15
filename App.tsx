import { Suspense, useEffect, useState } from 'react';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { SafetyBanner } from './src/components/SafetyBanner';
import { initializeDatabase } from './src/database/initialize';
import { getLanguage, saveLanguage } from './src/database/settingsRepository';
import { getLanguageName } from './src/i18n';
import { LanguageProvider, useLanguage } from './src/i18n/LanguageContext';
import { LabelFlowScreen } from './src/screens/LabelFlowScreen';
import { LanguageSelectionScreen } from './src/screens/LanguageSelectionScreen';
import { StaffScreen } from './src/screens/StaffScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { colors } from './src/theme';
import type { Language } from './src/types';

type Screen = 'label' | 'today' | 'staff';

export default function App() {
  return (
    <SQLiteProvider
      databaseName="keeptab.db"
      onInit={initializeDatabase}
      useSuspense
    >
      <StatusBar style="dark" />
      <Suspense fallback={<LoadingApp />}>
        <AppShell />
      </Suspense>
    </SQLiteProvider>
  );
}

function AppShell() {
  const db = useSQLiteContext();
  const [language, setLanguage] = useState<Language | null | undefined>(undefined);
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [languageError, setLanguageError] = useState('');

  useEffect(() => {
    let mounted = true;
    getLanguage(db)
      .then((savedLanguage) => {
        if (mounted) setLanguage(savedLanguage);
      })
      .catch(() => {
        if (mounted) setLanguage(null);
      });
    return () => {
      mounted = false;
    };
  }, [db]);

  async function selectLanguage(selectedLanguage: Language) {
    setSavingLanguage(true);
    setLanguageError('');
    try {
      await saveLanguage(db, selectedLanguage);
      setLanguage(selectedLanguage);
    } catch {
      setLanguageError(
        'Não foi possível salvar o idioma. · Could not save the language.',
      );
    } finally {
      setSavingLanguage(false);
    }
  }

  if (language === undefined) {
    return <LoadingApp message="Iniciando… · Starting…" />;
  }

  if (language === null) {
    return (
      <LanguageSelectionScreen
        onSelect={(selectedLanguage) => void selectLanguage(selectedLanguage)}
        busy={savingLanguage}
        error={languageError}
      />
    );
  }

  return (
    <LanguageProvider language={language}>
      <LocalizedAppShell onChangeLanguage={() => setLanguage(null)} />
    </LanguageProvider>
  );
}

function LocalizedAppShell({ onChangeLanguage }: { onChangeLanguage: () => void }) {
  const { language, copy } = useLanguage();
  const [screen, setScreen] = useState<Screen>('label');
  const [labelsVersion, setLabelsVersion] = useState(0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.shell}>
        <View style={styles.sidebar}>
          <View>
            <Text style={styles.brand}>KeepTab</Text>
            <Text style={styles.tagline}>{copy.appTagline}</Text>
          </View>
          <View style={styles.navigation}>
            <NavButton
              label={copy.navNewLabel}
              selected={screen === 'label'}
              onPress={() => setScreen('label')}
            />
            <NavButton
              label={copy.navToday}
              selected={screen === 'today'}
              onPress={() => setScreen('today')}
            />
            <NavButton
              label={copy.navStaff}
              selected={screen === 'staff'}
              onPress={() => setScreen('staff')}
            />
          </View>
          <View style={styles.sidebarFooter}>
            <Pressable
              accessibilityRole="button"
              onPress={onChangeLanguage}
              style={({ pressed }) => [styles.languageButton, pressed && styles.navButtonPressed]}
            >
              <Text style={styles.languageTitle}>{copy.changeLanguage}</Text>
              <Text style={styles.languageValue}>{getLanguageName(language)}</Text>
            </Pressable>
            <Text style={styles.offline}>{copy.offlineDatabase}</Text>
            <SafetyBanner compact />
          </View>
        </View>
        <View style={styles.content}>
          {screen === 'label' ? (
            <LabelFlowScreen
              onPrinted={() => setLabelsVersion((version) => version + 1)}
              onOpenStaff={() => setScreen('staff')}
            />
          ) : null}
          {screen === 'today' ? <TodayScreen refreshKey={labelsVersion} /> : null}
          {screen === 'staff' ? <StaffScreen /> : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

function NavButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.navButton,
        selected && styles.navButtonSelected,
        pressed && styles.navButtonPressed,
      ]}
    >
      <Text style={[styles.navLabel, selected && styles.navLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

function LoadingApp({ message = 'Starting offline database…' }: { message?: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  shell: { flex: 1, flexDirection: 'row', backgroundColor: colors.background },
  sidebar: {
    width: 220,
    paddingHorizontal: 18,
    paddingVertical: 24,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.surface,
  },
  brand: { color: colors.ink, fontSize: 34, fontWeight: '900', letterSpacing: -1 },
  tagline: { marginTop: 2, color: colors.muted, fontSize: 16, fontWeight: '600' },
  navigation: { marginTop: 34, gap: 12 },
  navButton: {
    minHeight: 66,
    paddingHorizontal: 18,
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#f0f3f1',
  },
  navButtonSelected: { backgroundColor: colors.primary },
  navButtonPressed: { opacity: 0.8 },
  navLabel: { color: colors.ink, fontSize: 21, fontWeight: '800' },
  navLabelSelected: { color: '#ffffff' },
  sidebarFooter: { flex: 1, justifyContent: 'flex-end', gap: 12 },
  languageButton: {
    minHeight: 58,
    paddingHorizontal: 12,
    paddingVertical: 9,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    backgroundColor: colors.background,
  },
  languageTitle: { color: colors.muted, fontSize: 13, fontWeight: '800' },
  languageValue: { marginTop: 2, color: colors.ink, fontSize: 15, fontWeight: '800' },
  offline: { color: colors.primaryDark, fontSize: 14, fontWeight: '800' },
  content: { flex: 1, minWidth: 0 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: colors.background,
  },
  loadingText: { color: colors.ink, fontSize: 21, fontWeight: '700' },
});
