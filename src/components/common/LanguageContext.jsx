import React, { createContext, useContext, useState } from 'react';

export const translations = {
  pt: {
    name: 'Português',
    flag: '🇵🇹',
    // Onboarding
    continue: 'Continuar',
    whereAreYou: 'Onde estás? 📍',
    locationSubtitle: 'Vamos mostrar-te planos e pessoas perto de ti.',
    useMyLocation: 'Usar a minha localização',
    detecting: 'A detetar...',
    tapToDetect: 'Toca para detetar automaticamente',
    locationSetTo: 'Localização definida para',
    chooseLanguage: 'Escolhe o teu idioma 🌍',
    languageSubtitle: 'Seleciona o idioma em que queres usar a aplicação.',
    // Navigation
    home: 'Início',
    explore: 'Explorar',
    create: 'Criar',
    messages: 'Mensagens',
    profile: 'Perfil',
    // Home
    myPlans: 'Os Meus Planos',
    seeAll: 'Ver tudo',
    tonight: 'Esta Noite',
    noPlansTonight: 'Sem planos para esta noite em',
    createPlan: 'Criar um plano',
    upcomingPlans: 'Planos Futuros',
    forYou: 'Para Ti',
    // Profile
    myFriends: 'Os Meus Amigos',
    joinedPartyPlans: 'Planos que Participei',
    myExperienceStories: 'As Minhas Histórias',
    profileVerified: 'Perfil Verificado ✓',
    verifyProfile: 'Verificar o Meu Perfil',
    verifyBadge: 'Obtém um crachá azul para ganhar confiança',
    friends: 'Amigos',
    parties: 'Festas',
    stories: 'Histórias',
    // Settings
    settings: 'Definições',
    account: 'Conta',
    notifications: 'Notificações',
    manageAlerts: 'Gerir os teus alertas',
    language: 'Idioma',
    legalCommunity: 'Legal & Comunidade',
    communityGuidelines: 'Diretrizes da Comunidade',
    termsConditions: 'Termos e Condições',
    privacyPolicy: 'Política de Privacidade',
    support: 'Suporte',
    helpFaq: 'Ajuda & FAQ',
    session: 'Sessão',
    logOut: 'Terminar Sessão',
    deleteAccount: 'Eliminar Conta',
    deleteAccountSub: 'Remover permanentemente os teus dados',
    chooseLanguageTitle: 'Escolher Idioma',
    // Explore
    plans: 'Planos',
    people: 'Pessoas',
    map: 'Mapa',
    searchPlans: 'Pesquisar planos...',
    searchPeople: 'Pesquisar pessoas...',
    filters: 'Filtros',
  },
  en: {
    name: 'English',
    flag: '🇬🇧',
    // Onboarding
    continue: 'Continue',
    whereAreYou: 'Where are you? 📍',
    locationSubtitle: "We'll show you plans and people nearby.",
    useMyLocation: 'Use my current location',
    detecting: 'Detecting...',
    tapToDetect: 'Tap to detect automatically',
    locationSetTo: 'Location set to',
    chooseLanguage: 'Choose your language 🌍',
    languageSubtitle: 'Select the language you want to use the app in.',
    // Navigation
    home: 'Home',
    explore: 'Explore',
    create: 'Create',
    messages: 'Messages',
    profile: 'Profile',
    // Home
    myPlans: 'My Plans',
    seeAll: 'See all',
    tonight: 'Tonight',
    noPlansTonight: 'No plans for tonight in',
    createPlan: 'Create a plan',
    upcomingPlans: 'Upcoming Plans',
    forYou: 'For You',
    // Profile
    myFriends: 'My Friends',
    joinedPartyPlans: 'Joined Party Plans',
    myExperienceStories: 'My Experience Stories',
    profileVerified: 'Profile Verified ✓',
    verifyProfile: 'Verify Your Profile',
    verifyBadge: 'Get a blue badge to build trust',
    friends: 'Friends',
    parties: 'Parties',
    stories: 'Stories',
    // Settings
    settings: 'Settings',
    account: 'Account',
    notifications: 'Notifications',
    manageAlerts: 'Manage your alerts',
    language: 'Language',
    legalCommunity: 'Legal & Community',
    communityGuidelines: 'Community Guidelines',
    termsConditions: 'Terms and Conditions',
    privacyPolicy: 'Privacy Policy',
    support: 'Support',
    helpFaq: 'Help & FAQ',
    session: 'Session',
    logOut: 'Log Out',
    deleteAccount: 'Delete Account',
    deleteAccountSub: 'Permanently remove your data',
    chooseLanguageTitle: 'Choose Language',
    // Explore
    plans: 'Plans',
    people: 'People',
    map: 'Map',
    searchPlans: 'Search plans...',
    searchPeople: 'Search people...',
    filters: 'Filters',
  },
  es: {
    name: 'Español',
    flag: '🇪🇸',
    // Onboarding
    continue: 'Continuar',
    whereAreYou: '¿Dónde estás? 📍',
    locationSubtitle: 'Te mostraremos planes y personas cercanas.',
    useMyLocation: 'Usar mi ubicación actual',
    detecting: 'Detectando...',
    tapToDetect: 'Toca para detectar automáticamente',
    locationSetTo: 'Ubicación establecida en',
    chooseLanguage: 'Elige tu idioma 🌍',
    languageSubtitle: 'Selecciona el idioma en el que quieres usar la app.',
    // Navigation
    home: 'Inicio',
    explore: 'Explorar',
    create: 'Crear',
    messages: 'Mensajes',
    profile: 'Perfil',
    // Home
    myPlans: 'Mis Planes',
    seeAll: 'Ver todo',
    tonight: 'Esta Noche',
    noPlansTonight: 'Sin planes para esta noche en',
    createPlan: 'Crear un plan',
    upcomingPlans: 'Próximos Planes',
    forYou: 'Para Ti',
    // Profile
    myFriends: 'Mis Amigos',
    joinedPartyPlans: 'Planes a los que me uní',
    myExperienceStories: 'Mis Historias',
    profileVerified: 'Perfil Verificado ✓',
    verifyProfile: 'Verificar mi Perfil',
    verifyBadge: 'Obtén una insignia azul para generar confianza',
    friends: 'Amigos',
    parties: 'Fiestas',
    stories: 'Historias',
    // Settings
    settings: 'Ajustes',
    account: 'Cuenta',
    notifications: 'Notificaciones',
    manageAlerts: 'Gestiona tus alertas',
    language: 'Idioma',
    legalCommunity: 'Legal & Comunidad',
    communityGuidelines: 'Directrices de la Comunidad',
    termsConditions: 'Términos y Condiciones',
    privacyPolicy: 'Política de Privacidad',
    support: 'Soporte',
    helpFaq: 'Ayuda & FAQ',
    session: 'Sesión',
    logOut: 'Cerrar Sesión',
    deleteAccount: 'Eliminar Cuenta',
    deleteAccountSub: 'Eliminar permanentemente tus datos',
    chooseLanguageTitle: 'Elegir Idioma',
    // Explore
    plans: 'Planes',
    people: 'Personas',
    map: 'Mapa',
    searchPlans: 'Buscar planes...',
    searchPeople: 'Buscar personas...',
    filters: 'Filtros',
  },
  fr: {
    name: 'Français',
    flag: '🇫🇷',
    // Onboarding
    continue: 'Continuer',
    whereAreYou: 'Où es-tu ? 📍',
    locationSubtitle: 'Nous te montrerons des plans et des personnes à proximité.',
    useMyLocation: 'Utiliser ma position actuelle',
    detecting: 'Détection...',
    tapToDetect: 'Appuie pour détecter automatiquement',
    locationSetTo: 'Localisation définie sur',
    chooseLanguage: 'Choisis ta langue 🌍',
    languageSubtitle: "Sélectionne la langue dans laquelle tu veux utiliser l'app.",
    // Navigation
    home: 'Accueil',
    explore: 'Explorer',
    create: 'Créer',
    messages: 'Messages',
    profile: 'Profil',
    // Home
    myPlans: 'Mes Plans',
    seeAll: 'Voir tout',
    tonight: 'Ce Soir',
    noPlansTonight: 'Pas de plans ce soir à',
    createPlan: 'Créer un plan',
    upcomingPlans: 'Plans à Venir',
    forYou: 'Pour Toi',
    // Profile
    myFriends: 'Mes Amis',
    joinedPartyPlans: 'Plans rejoints',
    myExperienceStories: 'Mes Histoires',
    profileVerified: 'Profil Vérifié ✓',
    verifyProfile: 'Vérifier mon Profil',
    verifyBadge: 'Obtiens un badge bleu pour inspirer confiance',
    friends: 'Amis',
    parties: 'Fêtes',
    stories: 'Histoires',
    // Settings
    settings: 'Paramètres',
    account: 'Compte',
    notifications: 'Notifications',
    manageAlerts: 'Gérer tes alertes',
    language: 'Langue',
    legalCommunity: 'Légal & Communauté',
    communityGuidelines: 'Règles de la Communauté',
    termsConditions: "Conditions d'Utilisation",
    privacyPolicy: 'Politique de Confidentialité',
    support: 'Support',
    helpFaq: 'Aide & FAQ',
    session: 'Session',
    logOut: 'Se Déconnecter',
    deleteAccount: 'Supprimer le Compte',
    deleteAccountSub: 'Supprimer définitivement tes données',
    chooseLanguageTitle: 'Choisir la Langue',
    // Explore
    plans: 'Plans',
    people: 'Personnes',
    map: 'Carte',
    searchPlans: 'Rechercher des plans...',
    searchPeople: 'Rechercher des personnes...',
    filters: 'Filtres',
  },
  it: {
    name: 'Italiano',
    flag: '🇮🇹',
    // Onboarding
    continue: 'Continua',
    whereAreYou: 'Dove sei? 📍',
    locationSubtitle: 'Ti mostreremo piani e persone nelle vicinanze.',
    useMyLocation: 'Usa la mia posizione attuale',
    detecting: 'Rilevamento...',
    tapToDetect: 'Tocca per rilevare automaticamente',
    locationSetTo: 'Posizione impostata su',
    chooseLanguage: 'Scegli la tua lingua 🌍',
    languageSubtitle: "Seleziona la lingua in cui vuoi usare l'app.",
    // Navigation
    home: 'Home',
    explore: 'Esplora',
    create: 'Crea',
    messages: 'Messaggi',
    profile: 'Profilo',
    // Home
    myPlans: 'I Miei Piani',
    seeAll: 'Vedi tutto',
    tonight: 'Stasera',
    noPlansTonight: 'Nessun piano per stasera a',
    createPlan: 'Crea un piano',
    upcomingPlans: 'Piani in Arrivo',
    forYou: 'Per Te',
    // Profile
    myFriends: 'I Miei Amici',
    joinedPartyPlans: 'Piani a cui ho partecipato',
    myExperienceStories: 'Le Mie Storie',
    profileVerified: 'Profilo Verificato ✓',
    verifyProfile: 'Verifica il Mio Profilo',
    verifyBadge: 'Ottieni un badge blu per aumentare la fiducia',
    friends: 'Amici',
    parties: 'Feste',
    stories: 'Storie',
    // Settings
    settings: 'Impostazioni',
    account: 'Account',
    notifications: 'Notifiche',
    manageAlerts: 'Gestisci i tuoi avvisi',
    language: 'Lingua',
    legalCommunity: 'Legale & Comunità',
    communityGuidelines: 'Linee Guida della Comunità',
    termsConditions: 'Termini e Condizioni',
    privacyPolicy: 'Informativa sulla Privacy',
    support: 'Supporto',
    helpFaq: 'Aiuto & FAQ',
    session: 'Sessione',
    logOut: 'Esci',
    deleteAccount: "Elimina l'Account",
    deleteAccountSub: 'Rimuovi definitivamente i tuoi dati',
    chooseLanguageTitle: 'Scegli la Lingua',
    // Explore
    plans: 'Piani',
    people: 'Persone',
    map: 'Mappa',
    searchPlans: 'Cerca piani...',
    searchPeople: 'Cerca persone...',
    filters: 'Filtri',
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