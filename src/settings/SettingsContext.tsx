import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { saveAppSettings } from '../database/settingsRepository';
import type { AppSettings } from '../types';

interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => Promise<AppSettings>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({
  initialSettings,
  onSettingsChange,
  children,
}: {
  initialSettings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
  children: ReactNode;
}) {
  const db = useSQLiteContext();
  const [settings, setSettings] = useState(initialSettings);
  const settingsRef = useRef(initialSettings);

  useEffect(() => {
    settingsRef.current = initialSettings;
    setSettings(initialSettings);
  }, [initialSettings]);

  async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
    const previous = settingsRef.current;
    const next = { ...previous, ...patch };
    settingsRef.current = next;
    setSettings(next);
    onSettingsChange(next);
    try {
      await saveAppSettings(db, next);
      return next;
    } catch (error) {
      if (settingsRef.current === next) {
        settingsRef.current = previous;
        setSettings(previous);
        onSettingsChange(previous);
      }
      throw error;
    }
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (!value) {
    throw new Error('useSettings must be used inside SettingsProvider.');
  }
  return value;
}
