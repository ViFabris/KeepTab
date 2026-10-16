import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { CalendarDays, Printer, Settings } from 'lucide-react-native';
import { Suspense, useEffect, useState } from 'react';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { Logo } from './src/components/Logo';
import { SafetyBanner } from './src/components/SafetyBanner';
import { initializeDatabase } from './src/database/initialize';
import { getAppSettings } from './src/database/settingsRepository';
import { LanguageProvider, useLanguage } from './src/i18n/LanguageContext';
import { LabelFlowScreen } from './src/screens/LabelFlowScreen';
import { LabelRasterizerHost } from './src/printing/LabelRasterizer';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SetupWizard } from './src/screens/SetupWizard';
import { TodayScreen } from './src/screens/TodayScreen';
import { SettingsProvider } from './src/settings/SettingsContext';
import { colors, radii, sizes, spacing, typography } from './src/theme';
import type { AppSettings } from './src/types';

void SplashScreen.preventAutoHideAsync();

type Screen = 'label' | 'today' | 'settings';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontError, fontsLoaded]);

  useEffect(() => {
    if (Platform.OS === 'android') NavigationBar.setStyle('dark');
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SQLiteProvider databaseName="keeptab.db" onInit={initializeDatabase} useSuspense>
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

  if (!appSettings) return <LoadingApp />;

  return (
    <SettingsProvider initialSettings={appSettings} onSettingsChange={setAppSettings}>
      <LanguageProvider language={appSettings.language}>
        <LabelRasterizerHost />
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
          <Logo size="small" />
          <View style={styles.navigation}>
            <NavButton
              icon={Printer}
              label={copy.navNewLabel}
              selected={screen === 'label'}
              onPress={() => setScreen('label')}
            />
            <NavButton
              icon={CalendarDays}
              label={copy.navToday}
              selected={screen === 'today'}
              onPress={() => setScreen('today')}
            />
          </View>
          <View style={styles.sidebarFooter}>
            <NavButton
              icon={Settings}
              label={copy.settings.title}
              selected={screen === 'settings'}
              onPress={() => setScreen('settings')}
            />
            <Text style={styles.offline}>{copy.offlineDatabase}</Text>
            <SafetyBanner compact />
          </View>
        </View>
        <View style={styles.content}>
          {screen === 'label' ? (
            <LabelFlowScreen key={configurationVersion} onPrinted={() => setLabelsVersion((version) => version + 1)} />
          ) : null}
          {screen === 'today' ? <TodayScreen refreshKey={labelsVersion + configurationVersion} /> : null}
          {screen === 'settings' ? <SettingsScreen onClose={closeSettings} /> : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

type IconComponent = typeof Printer;

function NavButton({ icon: Icon, label, selected, onPress }: {
  icon: IconComponent;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.navButton, selected && styles.navButtonSelected, pressed && styles.navButtonPressed]}
    >
      <Icon color={selected ? colors.background : colors.secondary} size={sizes.iconMd} strokeWidth={2} />
      <Text style={[styles.navLabel, selected && styles.navLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

function LoadingApp() {
  return (
    <View style={styles.loading}>
      <Logo size="medium" />
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  shell: { flex: 1, flexDirection: 'row', backgroundColor: colors.background },
  sidebar: {
    width: sizes.sidebar,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.background,
  },
  navigation: { marginTop: spacing.xxxl, gap: spacing.sm },
  navButton: {
    minHeight: sizes.tapMin,
    paddingHorizontal: spacing.md,
    justifyContent: 'flex-start',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.transparent,
    backgroundColor: colors.transparent,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  navButtonSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  navButtonPressed: { opacity: 0.8 },
  navLabel: { ...typography.bodyStrong, flex: 1, color: colors.ink },
  navLabelSelected: { color: colors.background },
  sidebarFooter: { flex: 1, justifyContent: 'flex-end', gap: spacing.sm },
  offline: { ...typography.caption, color: colors.primaryDark },
  content: { flex: 1, minWidth: 0 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl, backgroundColor: colors.background },
});
