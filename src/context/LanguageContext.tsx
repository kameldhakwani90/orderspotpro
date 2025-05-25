"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { LanguageCode, TranslationKeys } from '@/lib/types';
import { translations } from '@/lib/translations';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: TranslationKeys, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (typeof window !== 'undefined') {
      const storedLang = localStorage.getItem('connectHostLang') as LanguageCode;
      return storedLang && translations[storedLang] ? storedLang : 'fr'; // Default to French
    }
    return 'fr'; // Default for SSR or if localStorage not available initially
  });

  useEffect(() => {
    // This effect runs once on the client after initial mount to sync with localStorage
    // if the initial SSR/CSR state was 'fr' but localStorage had something else.
    if (typeof window !== 'undefined') {
      const storedLang = localStorage.getItem('connectHostLang') as LanguageCode;
      if (storedLang && translations[storedLang] && storedLang !== language) {
        setLanguageState(storedLang);
      }
    }
  }, []); // Removed 'language' from dependency array to avoid potential loops if localStorage is out of sync with initial state.

  const setLanguage = useCallback((lang: LanguageCode) => {
    if (translations[lang]) {
      setLanguageState(lang);
      if (typeof window !== 'undefined') {
        localStorage.setItem('connectHostLang', lang);
        // Optionally, set lang attribute on <html> tag
        // document.documentElement.lang = lang;
        // document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; // Basic RTL handling
      }
    } else {
      console.warn(`LanguageProvider: Attempted to set unsupported language "${lang}". Defaulting to 'fr'.`);
      setLanguageState('fr');
      if (typeof window !== 'undefined') {
        localStorage.setItem('connectHostLang', 'fr');
        // document.documentElement.lang = 'fr';
        // document.documentElement.dir = 'ltr';
      }
    }
  }, []);

  const t = useCallback((key: TranslationKeys, params?: Record<string, string | number>): string => {
    let translation = translations[language]?.[key] || translations['fr']?.[key] || key;
    if (params) {
      Object.keys(params).forEach(paramKey => {
        translation = translation.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(params[paramKey]));
      });
    }
    return translation;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
