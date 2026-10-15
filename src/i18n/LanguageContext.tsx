import { createContext, type ReactNode, useContext } from 'react';

import type { AppCopy } from './index';
import { getCopy } from './index';
import type { Language } from '../types';

interface LanguageContextValue {
  language: Language;
  copy: AppCopy;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  language,
  children,
}: {
  language: Language;
  children: ReactNode;
}) {
  return (
    <LanguageContext.Provider value={{ language, copy: getCopy(language) }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const value = useContext(LanguageContext);
  if (!value) {
    throw new Error('useLanguage must be used inside LanguageProvider.');
  }
  return value;
}
