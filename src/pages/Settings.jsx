import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft, ChevronRight, LogOut, Trash2,
  Shield, FileText, Lock, Bell, HelpCircle, ShieldAlert, Globe, Check, Mail
} from 'lucide-react';
import DeleteAccountModal from '../components/profile/DeleteAccountModal';
import { useLanguage } from '../components/common/LanguageContext';

const LANGUAGES = [
  { code: 'pt', flag: '🇵🇹', name: 'Português' },
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'es', flag: '🇪🇸', name: 'Español' },
  { code: 'fr', flag: '🇫🇷', name: 'Français' },
  { code: 'it', flag: '🇮🇹', name: 'Italiano' },
];

const Section = ({ title, children }) => (
  <div>
    <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-2 px-1">{title}</p>
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-800">
      {children}
    </div>
  </div>
);

const Row = ({ icon: Icon, iconColor = 'text-[#00fea3]', label, sublabel, onClick, destructive }) => (
  <motion.button
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="w-full flex items-center gap-4 px-4 py-4"
  >
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${destructive ? 'bg-red-500/15' : 'bg-gray-800'}`}>
      <Icon className={`w-4 h-4 ${destructive ? 'text-red-400' : iconColor}`} />
    </div>
    <div className="flex-1 text-left">
      <p className={`font-medium text-sm ${destructive ? 'text-red-400' : 'text-white'}`}>{label}</p>
      {sublabel && <p className="text-xs text-gray-500 mt-0.5">{sublabel}</p>}
    </div>
    <ChevronRight className="w-4 h-4 text-gray-600" />
  </motion.button>
);

export default function Settings() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(() => localStorage.getItem('app_language') || 'en');

  const handleLanguageChange = (code) => {
    localStorage.setItem('app_language', code);
    setSelectedLanguage(code);
    setShowLanguagePicker(false);
    window.dispatchEvent(new Event('languagechange'));
  };

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => navigate('/'));
  }, []);

  const { data: profile } = useQuery({
    queryKey: ['myProfile', currentUser?.id],
    queryFn: () => base44.entities.UserProfile.filter({ user_id: currentUser.id }),
    select: (d) => d[0],
    enabled: !!currentUser?.id
  });

  const openUrl = (url) => window.open(url, '_blank');

  return (
    <div className="bg-[#0b0b0b] flex flex-col overflow-hidden" style={{ height: '100dvh', minHeight: '100dvh' }}>
      {/* Header */}
      <header
        className="flex-shrink-0 z-40 bg-[#0b0b0b]/95 backdrop-blur-lg border-b border-gray-800 flex items-center gap-4 px-4 py-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-gray-900"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </motion.button>
        <h1 className="text-xl font-bold text-white">{t.settings}</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 pb-16" style={{ WebkitOverflowScrolling: 'touch' }}>

        {/* Account */}
        <Section title={t.account}>
          <Row
            icon={Bell}
            iconColor="text-[#00fea3]"
            label={t.notifications}
            sublabel={t.manageAlerts}
            onClick={() => navigate(createPageUrl('NotificationSettings'))}
          />
          <Row
            icon={Globe}
            iconColor="text-blue-400"
            label={t.language}
            sublabel={LANGUAGES.find(l => l.code === selectedLanguage)?.name || 'English'}
            onClick={() => setShowLanguagePicker(true)}
          />
        </Section>

        {/* Language Picker Modal */}
        <AnimatePresence>
          {showLanguagePicker && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 flex items-end"
              onClick={() => setShowLanguagePicker(false)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="w-full bg-gray-900 rounded-t-3xl p-6 pb-10"
                onClick={e => e.stopPropagation()}
              >
                <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-6" />
                <h3 className="text-white font-bold text-lg mb-4">{t.chooseLanguageTitle}</h3>
                <div className="space-y-2">
                  {LANGUAGES.map(lang => (
                    <motion.button
                      key={lang.code}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${
                        selectedLanguage === lang.code
                          ? 'bg-[#00fea3]/15 border border-[#00fea3]/40'
                          : 'bg-gray-800 border border-transparent'
                      }`}
                    >
                      <span className="text-2xl">{lang.flag}</span>
                      <span className={`flex-1 text-left font-medium ${selectedLanguage === lang.code ? 'text-[#00fea3]' : 'text-white'}`}>
                        {lang.name}
                      </span>
                      {selectedLanguage === lang.code && (
                        <Check className="w-5 h-5 text-[#00fea3]" />
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legal */}
        <Section title={t.legalCommunity}>
          <Row
            icon={Shield}
            iconColor="text-purple-400"
            label={t.communityGuidelines}
            onClick={() => navigate(createPageUrl('CommunityGuidelines'))}
          />
          <Row
            icon={FileText}
            iconColor="text-blue-400"
            label={t.termsConditions}
            onClick={() => navigate(createPageUrl('TermsConditions'))}
          />
          <Row
            icon={Lock}
            iconColor="text-teal-400"
            label={t.privacyPolicy}
            onClick={() => navigate(createPageUrl('PrivacyPolicy'))}
          />
        </Section>

        {/* Support */}
        <Section title={t.support}>
          <Row
            icon={HelpCircle}
            iconColor="text-yellow-400"
            label={t.helpFaq}
            onClick={() => navigate(createPageUrl('HelpFaq'))}
          />
          <Row
            icon={Mail}
            iconColor="text-[#00fea3]"
            label="Support"
            sublabel="support@vybtapp.com"
            onClick={() => navigate(createPageUrl('Support'))}
          />
        </Section>

        {/* Admin */}
        {currentUser?.role === 'admin' && (
          <Section title={t.administration}>
            <Row
              icon={ShieldAlert}
              iconColor="text-red-400"
              label={t.moderationPanel}
              sublabel={t.moderationSub}
              onClick={() => navigate(createPageUrl('Moderation'))}
            />
          </Section>
        )}

        {/* Danger Zone */}
        <Section title={t.session}>
          <Row
            icon={LogOut}
            iconColor="text-gray-400"
            label={t.logOut}
            onClick={() => base44.auth.logout()}
          />
          <Row
            icon={Trash2}
            label={t.deleteAccount}
            sublabel={t.deleteAccountSub}
            destructive
            onClick={() => setShowDeleteModal(true)}
          />
        </Section>

        {/* App version */}
        <p className="text-center text-gray-700 text-xs pt-2">Vybt v1.0.0</p>
      </div>

      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        userId={currentUser?.id}
        profile={profile}
      />
    </div>
  );
}