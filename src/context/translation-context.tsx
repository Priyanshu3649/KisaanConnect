
'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import en from '@/translations/en.json';
import hi from '@/translations/hi.json';

type Translations = typeof en;
type Language = 'en' | 'hi';

interface TranslationContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: keyof Translations, options?: { [key: string]: string | number }) => string;
}

const translations = { en, hi };

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    // You could persist language preference in localStorage
    const savedLang = localStorage.getItem('language') as Language | null;
    if (savedLang && ['en', 'hi'].includes(savedLang)) {
      setLanguage(savedLang);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: keyof Translations, options?: { [key: string]: string | number }) => {
    let text = translations[language][key] || translations['en'][key] || key;
    if (options) {
      Object.keys(options).forEach(optKey => {
        text = text.replace(`{{${optKey}}}`, String(options[optKey]));
      });
    }
    return text;
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
