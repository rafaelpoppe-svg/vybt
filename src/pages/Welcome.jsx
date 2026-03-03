import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/components/common/LanguageContext';
import { ChevronDown, Shield, FileText, Lock, HelpCircle, Star, Users, Zap, MapPin } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Community Guidelines', page: 'CommunityGuidelines' },
  { label: 'Terms & Conditions', page: 'TermsConditions' },
  { label: 'Privacy Policy', page: 'PrivacyPolicy' },
  { label: 'Support', page: 'Support' },
];

const features = [
  {
    icon: MapPin,
    title: 'Discover Nearby Plans',
    desc: 'Find parties, events and social gatherings happening right now in your city.',
  },
  {
    icon: Users,
    title: 'Connect with Your Vibe',
    desc: 'Match with people who share your music taste and party style.',
  },
  {
    icon: Zap,
    title: 'Create & Join Instantly',
    desc: 'Create a plan in seconds or join one with a tap. No hassle.',
  },
  {
    icon: Star,
    title: 'Experience Stories',
    desc: 'Share your night with short stories visible to your crew.',
  },
];

export default function Welcome() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        if (user && user.role !== 'admin') {
          navigate(createPageUrl('Home'));
        }
      } catch (e) {
        // Not logged in
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#00fea3]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white bg-[#0b0b0b] overflow-x-hidden">

      {/* ── FIXED HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0b0b0b]/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698004f141dcfbdef518004d/4f0b92888_VybtLogoPng.png"
              alt="Vybt"
              className="w-9 h-9 object-contain"
            />
            <span className="text-2xl font-black bg-gradient-to-r from-[#00fea3] to-[#542b9b] bg-clip-text text-transparent">
              Vybt
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(link => (
              <Link
                key={link.page}
                to={createPageUrl(link.page)}
                className="text-gray-400 hover:text-[#00fea3] text-sm transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA + Mobile Menu */}
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => base44.auth.redirectToLogin()}
              className="px-5 py-2 rounded-full bg-[#00fea3] text-[#0b0b0b] font-bold text-sm hover:bg-[#00fea3]/90 transition-all"
            >
              {t.downloadNow || 'Get Started'}
            </motion.button>
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-gray-400"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <div className="space-y-1.5">
                <span className={`block w-5 h-0.5 bg-gray-400 transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`block w-5 h-0.5 bg-gray-400 transition-all ${menuOpen ? 'opacity-0' : ''}`} />
                <span className={`block w-5 h-0.5 bg-gray-400 transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-[#111] border-t border-white/5 px-4 py-4 space-y-3"
          >
            {NAV_LINKS.map(link => (
              <Link
                key={link.page}
                to={createPageUrl(link.page)}
                onClick={() => setMenuOpen(false)}
                className="block text-gray-300 hover:text-[#00fea3] text-sm py-1 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </motion.div>
        )}
      </header>

      {/* ── HERO ── */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20"
        style={{
          backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698004f141dcfbdef518004d/88ff4742f_image.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#0b0b0b]" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-2xl space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00fea3]/10 border border-[#00fea3]/30 text-[#00fea3] text-xs font-semibold tracking-widest uppercase">
            🎉 Social Planning App
          </div>
          <h1 className="text-5xl md:text-7xl font-black leading-tight">
            {t.welcomeHero?.split(',')[0]},<br />
            <span className="bg-gradient-to-r from-[#00fea3] to-[#542b9b] bg-clip-text text-transparent">
              {t.welcomeHero?.split(',')[1]?.trim() || 'mate!'}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 font-light leading-relaxed max-w-lg mx-auto">
            {t.welcomeSubtitle?.replace('\n', ' ') || "Join us: let's connect and create the best plans in your area!"}
          </p>

          {/* App Store Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <motion.button whileTap={{ scale: 0.95 }} className="hover:opacity-80 transition-opacity">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698004f141dcfbdef518004d/0606aa490_AppStore.png"
                alt="Download on the App Store"
                className="h-14 object-contain"
              />
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} className="hover:opacity-80 transition-opacity">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698004f141dcfbdef518004d/a7352df16_GooglePlay.png"
                alt="Get it on Google Play"
                className="h-14 object-contain"
              />
            </motion.button>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-gray-500"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 px-4 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-black mb-3">
            Everything you need for a <span className="text-[#00fea3]">great night</span>
          </h2>
          <p className="text-gray-400 text-base max-w-md mx-auto">
            Vybt puts the social back into social media. Real plans, real people, real vibes.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 border border-white/8 rounded-2xl p-6 hover:border-[#00fea3]/30 transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-[#00fea3]/10 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-[#00fea3]" />
              </div>
              <h3 className="font-bold text-white mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── LEGAL & SUPPORT LINKS ── */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl font-bold mb-2">Legal & Support</h2>
            <p className="text-gray-500 text-sm">Everything you need to know about using Vybt.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Shield, label: 'Community Guidelines', page: 'CommunityGuidelines', color: 'text-purple-400', bg: 'bg-purple-500/10' },
              { icon: FileText, label: 'Terms & Conditions', page: 'TermsConditions', color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { icon: Lock, label: 'Privacy Policy', page: 'PrivacyPolicy', color: 'text-teal-400', bg: 'bg-teal-500/10' },
              { icon: HelpCircle, label: 'Support & FAQ', page: 'Support', color: 'text-[#00fea3]', bg: 'bg-[#00fea3]/10' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Link
                  to={createPageUrl(item.page)}
                  className="flex flex-col items-center text-center gap-3 p-6 rounded-2xl bg-white/5 border border-white/8 hover:border-white/20 hover:bg-white/8 transition-all group"
                >
                  <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center`}>
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <span className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors">
                    {item.label}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698004f141dcfbdef518004d/4f0b92888_VybtLogoPng.png"
              alt="Vybt"
              className="w-7 h-7 object-contain"
            />
            <span className="font-bold text-gray-300">Vybt</span>
          </div>
          <div className="flex items-center gap-5 flex-wrap justify-center">
            {NAV_LINKS.map(link => (
              <Link
                key={link.page}
                to={createPageUrl(link.page)}
                className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <p className="text-gray-600 text-xs">© {new Date().getFullYear()} Vybt. {t.allRightsReserved || 'All rights reserved.'}</p>
        </div>
      </footer>
    </div>
  );
}