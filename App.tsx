import { Suspense, useEffect, useState } from 'react';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { SafetyBanner } from './src/components/SafetyBanner';
import { initializeDatabase } from './src/database/initialize';
import { getAppSettings } from './src/database/settingsRepository';
import { LanguageProvider, useLanguage } from './src/i18n/LanguageContext';
import { LabelFlowScreen } from './src/screens/LabelFlowScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SettingsUnlockScreen } from './src/screens/SettingsUnlockScreen';
import { SetupWizard } from './src/screens/SetupWizard';
import { TodayScreen } from './src/screens/TodayScreen';
import { SettingsProvider } from './src/settings/SettingsContext';
import { colors } from './src/theme';
import type { AppSettings } from './src/types';

type Screen = 'label' | 'today' | 'settings-unlock' | 'settings';

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
  const [appSettings, setAppSettings] = useState<AppSettings>();

  useEffect(() => {
    let mounted = true;
    getAppSettings(db)
      .then((loadedSettings) => {
        if (mounted) setAppSettings(loadedSettings);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [db]);

  if (!appSettings) {
    return <LoadingApp message="Iniciando… · Starting…" />;
  }

  return (
    <SettingsProvider initialSettings={appSettings} onSettingsChange={setAppSettings}>
      <LanguageProvider language={appSettings.language}>
        {appSettings.setupComplete ? <LocalizedAppShell /> : <SetupWizard />}
      </LanguageProvider>
    </SettingsProvider>
  );
}

function LocalizedAppShell() {
  const { copy } = useLanguage();
  const [screen, setScreen] = useState<Screen>('label');
  const [labelsVersion, setLabelsVersion] = useState(0);
  const [configurationVersion, setConfigurationVersion] = useState(0);

  function closeSettings() {
    setConfigurationVersion((version) => version + 1);
    setScreen('label');
  }

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
          </View>
          <View style={styles.sidebarFooter}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.settings.open}
              onPress={() => setScreen('settings-unlock')}
              style={({ pressed }) => [styles.settingsButton, pressed && styles.navButtonPressed]}
            >
              <Text style={styles.settingsIcon}>⚙</Text>
              <Text style={styles.settingsLabel}>{copy.settings.title}</Text>
            </Pressable>
            <Text style={styles.offline}>{copy.offlineDatabase}</Text>
            <SafetyBanner compact />
          </View>
        </View>
        <View style={styles.content}>
          {screen === 'label' ? (
            <LabelFlowScreen
              key={configurationVersion}
              onPrinted={() => setLabelsVersion((version) => version + 1)}
            />
          ) : null}
          {screen === 'today' ? (
            <TodayScreen refreshKey={labelsVersion + configurationVersion} />
          ) : null}
          {screen === 'settings-unlock' ? (
            <SettingsUnlockScreen
              onUnlocked={() => setScreen('settings')}
              onCancel={() => setScreen('label')}
            />
          ) : null}
          {screen === 'settings' ? <SettingsScreen onClose={closeSettings} /> : null}
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

function LoadingApp({
  message = 'Iniciando banco offline… · Starting offline database…',
}: {
  message?: string;
}) {
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
  settingsButton: {
    minHeight: 58,
    paddingHorizontal: 12,
    paddingVertical: 9,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  settingsIcon: { color: colors.ink, fontSize: 25, fontWeight: '900' },
  settingsLabel: { flex: 1, color: colors.ink, fontSize: 16, fontWeight: '800' },
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
