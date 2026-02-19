import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft, ChevronRight, LogOut, Trash2,
  Shield, FileText, Lock, Bell, HelpCircle, ShieldAlert
} from 'lucide-react';
import DeleteAccountModal from '../components/profile/DeleteAccountModal';

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
  const [currentUser, setCurrentUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
    <div className="min-h-screen bg-[#0b0b0b]">
      {/* Header */}
      <header
        className="sticky top-0 z-40 bg-[#0b0b0b]/95 backdrop-blur-lg border-b border-gray-800 flex items-center gap-4 px-4 py-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-gray-900"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </motion.button>
        <h1 className="text-xl font-bold text-white">Settings</h1>
      </header>

      <div className="px-4 py-6 space-y-6 pb-16">

        {/* Account */}
        <Section title="Account">
          <Row
            icon={Bell}
            iconColor="text-[#00fea3]"
            label="Notifications"
            sublabel="Manage your alerts"
            onClick={() => navigate(createPageUrl('NotificationSettings'))}
          />
        </Section>

        {/* Legal */}
        <Section title="Legal & Community">
          <Row
            icon={Shield}
            iconColor="text-purple-400"
            label="Community Guidelines"
            onClick={() => openUrl('https://vybt.app/community-guidelines')}
          />
          <Row
            icon={FileText}
            iconColor="text-blue-400"
            label="Terms and Conditions"
            onClick={() => openUrl('https://vybt.app/terms')}
          />
          <Row
            icon={Lock}
            iconColor="text-teal-400"
            label="Privacy Policy"
            onClick={() => openUrl('https://vybt.app/privacy')}
          />
        </Section>

        {/* Support */}
        <Section title="Support">
          <Row
            icon={HelpCircle}
            iconColor="text-yellow-400"
            label="Help & FAQ"
            onClick={() => openUrl('https://vybt.app/help')}
          />
        </Section>

        {/* Danger Zone */}
        <Section title="Session">
          <Row
            icon={LogOut}
            iconColor="text-gray-400"
            label="Log Out"
            onClick={() => base44.auth.logout()}
          />
          <Row
            icon={Trash2}
            label="Delete Account"
            sublabel="Permanently remove your data"
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