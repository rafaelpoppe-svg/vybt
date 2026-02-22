import React, { createContext, useContext, useState } from 'react';

export const translations = {
  pt: {
    name: 'Português',
    flag: '🇧🇷',
    continue: 'Continuar',
    whereAreYou: 'Onde estás? 📍',
    locationSubtitle: 'Vamos mostrar-te planos e pessoas perto de ti.',
    useMyLocation: 'Usar a minha localização',
    detecting: 'A detetar...',
    tapToDetect: 'Toca para detetar automaticamente',
    locationSetTo: 'Localização definida para',
    chooseLanguage: 'Escolhe o teu idioma 🌍',
    languageSubtitle: 'Seleciona o idioma em que queres usar a aplicação.',
  },
  en: {
    name: 'English',
    flag: '🇬🇧',
    continue: 'Continue',
    whereAreYou: 'Where are you? 📍',
    locationSubtitle: "We'll show you plans and people nearby.",
    useMyLocation: 'Use my current location',
    detecting: 'Detecting...',
    tapToDetect: 'Tap to detect automatically',
    locationSetTo: 'Location set to',
    chooseLanguage: 'Choose your language 🌍',
    languageSubtitle: 'Select the language you want to use the app in.',
  },
  es: {
    name: 'Español',
    flag: '🇪🇸',
    continue: 'Continuar',
    whereAreYou: '¿Dónde estás? 📍',
    locationSubtitle: 'Te mostraremos planes y personas cercanas.',
    useMyLocation: 'Usar mi ubicación actual',
    detecting: 'Detectando...',
    tapToDetect: 'Toca para detectar automáticamente',
    locationSetTo: 'Ubicación establecida en',
    chooseLanguage: 'Elige tu idioma 🌍',
    languageSubtitle: 'Selecciona el idioma en el que quieres usar la app.',
  },
  fr: {
    name: 'Français',
    flag: '🇫🇷',
    continue: 'Continuer',
    whereAreYou: 'Où es-tu ? 📍',
    locationSubtitle: 'Nous te montrerons des plans et des personnes à proximité.',
    useMyLocation: 'Utiliser ma position actuelle',
    detecting: 'Détection...',
    tapToDetect: 'Appuie pour détecter automatiquement',
    locationSetTo: 'Localisation définie sur',
    chooseLanguage: 'Choisis ta langue 🌍',
    languageSubtitle: "Sélectionne la langue dans laquelle tu veux utiliser l'app.",
  },
  it: {
    name: 'Italiano',
    flag: '🇮🇹',
    continue: 'Continua',
    whereAreYou: 'Dove sei? 📍',
    locationSubtitle: 'Ti mostreremo piani e persone nelle vicinanze.',
    useMyLocation: 'Usa la mia posizione attuale',
    detecting: 'Rilevamento...',
    tapToDetect: 'Tocca per rilevare automaticamente',
    locationSetTo: 'Posizione impostata su',
    chooseLanguage: 'Scegli la tua lingua 🌍',
    languageSubtitle: "Seleziona la lingua in cui vuoi usare l'app.",
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('app_language') || 'en';
  });

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('app_language', lang);
  };

  // Listen for external language changes (e.g. from Settings page)
  React.useEffect(() => {
    const handler = () => {
      const lang = localStorage.getItem('app_language') || 'en';
      setLanguage(lang);
    };
    window.addEventListener('languagechange', handler);
    return () => window.removeEventListener('languagechange', handler);
  }, []);

  const t = translations[language] || translations.en;

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, translations }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}