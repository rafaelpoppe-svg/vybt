import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/components/common/LanguageContext';
import { Shield, FileText, Lock, HelpCircle, MapPin, Users, Zap, Star, ArrowRight, ChevronDown } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Community', page: 'CommunityGuidelines' },
  { label: 'Terms', page: 'TermsConditions' },
  { label: 'Privacy', page: 'PrivacyPolicy' },
  { label: 'Support', page: 'Support' },
];

const features = [
  {
    icon: MapPin,
    emoji: '📍',
    title: 'Drop a plan, IRL',
    desc: "Parties, meetups, rooftops, food runs — whatever. If it's happening, it's on Vybt.",
    color: 'from-[#00fea3] to-[#00c4ff]',
    bg: 'bg-[#00fea3]/10',
  },
  {
    icon: Users,
    emoji: '🫂',
    title: 'Find your people',
    desc: 'Match with others who vibe with your music taste and party energy. No randoms, just real ones.',
    color: 'from-[#a855f7] to-[#ec4899]',
    bg: 'bg-purple-500/10',
  },
  {
    icon: Zap,
    emoji: '⚡',
    title: 'Join in seconds',
    desc: 'Tap once, you\'re in. That\'s it. No forms, no waiting, no cringe.',
    color: 'from-[#f59e0b] to-[#ef4444]',
    bg: 'bg-yellow-500/10',
  },
  {
    icon: Star,
    emoji: '🎬',
    title: 'Share the night',
    desc: 'Post your experience stories. Let the crew see what they missed (they\'ll be jealous).',
    color: 'from-[#10b981] to-[#3b82f6]',
    bg: 'bg-emerald-500/10',
  },
];

const floatingEmojis = ['🎉', '🔥', '🎶', '🎤', '💃', '🕺', '🍾', '✨', '🎊', '🥳'];

function FloatingEmoji({ emoji, delay, x, duration }) {
  return (
    <motion.div
      className="absolute text-2xl pointer-events-none select-none"
      style={{ left: `${x}%`, bottom: '-10%' }}
      animate={{ y: [0, -900], opacity: [0, 1, 1, 0], rotate: [0, 20, -20, 0] }}
      transition={{ duration, delay, repeat: Infinity, repeatDelay: Math.random() * 8 + 4, ease: 'easeOut' }}
    >
      {emoji}
    </motion.div>
  );
}

export default function Welcome() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        if (user && user.role !== 'admin') {
          navigate(createPageUrl('Home'));
        }
      } catch (e) {}
      finally { setLoading(false); }
    };
    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="rounded-full h-12 w-12 border-t-2 border-r-2 border-[#00fea3]"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white bg-[#0b0b0b] overflow-x-hidden">

      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0b0b0b]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-2 cursor-pointer"
            whileHover={{ scale: 1.05 }}
          >
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698004f141dcfbdef518004d/4f0b92888_VybtLogoPng.png"
              alt="Vybt"
              className="w-9 h-9 object-contain"
            />
            <span className="text-2xl font-black bg-gradient-to-r from-[#00fea3] to-[#542b9b] bg-clip-text text-transparent">
              Vybt
            </span>
          </motion.div>

          <nav className="hidden md:flex items-center justify-between flex-1 px-16 md:px-28 lg:px-32 xl:px-36">
            {NAV_LINKS.map(link => (
              <Link
                key={link.page}
                to={createPageUrl(link.page)}
                className="text-gray-400 hover:text-[#00fea3] text-sm transition-colors font-medium background"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0,254,163,0.4)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => base44.auth.redirectToLogin()}
              className="px-5 py-2 rounded-full bg-gradient-to-r from-[#00fea3] to-[#00c4a0] text-[#0b0b0b] font-bold text-sm transition-all"
            >
              Get in 🚀
            </motion.button>
            <button className="md:hidden p-2 text-gray-400" onClick={() => setMenuOpen(!menuOpen)}>
              <div className="space-y-1.5">
                <span className={`block w-5 h-0.5 bg-gray-400 transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`block w-5 h-0.5 bg-gray-400 transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
                <span className={`block w-5 h-0.5 bg-gray-400 transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
              </div>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#111] border-t border-white/5 px-4 overflow-hidden"
            >
              <div className="py-4 space-y-3">
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── HERO ── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20 overflow-hidden"
      >
        {/* Parallax BG */}
        <motion.div
          style={{ y: heroY }}
          className="absolute inset-0 z-0"
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698004f141dcfbdef518004d/88ff4742f_image.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-[#0b0b0b]" />
        </motion.div>

        {/* Floating emojis */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {floatingEmojis.map((emoji, i) => (
            <FloatingEmoji
              key={i}
              emoji={emoji}
              delay={i * 1.2}
              x={5 + i * 9}
              duration={6 + i * 0.5}
            />
          ))}
        </div>

        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#00fea3]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-[#542b9b]/15 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          style={{ opacity: heroOpacity }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="relative z-10 max-w-2xl space-y-6"
        >
          {/* Badge */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00fea3]/10 border border-[#00fea3]/30 text-[#00fea3] text-xs font-bold tracking-widest uppercase"
          >
            ✨ THE social plans app
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-5xl md:text-7xl font-black leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Hey Mate!
            <br />
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-[#00fea3] via-[#00c4ff] to-[#a855f7] bg-clip-text text-transparent">
                Join us
              </span>
              <motion.span
                className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-[#00fea3] to-[#a855f7] rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
              />
            </span>
            <span className="ml-3">🔥</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-lg md:text-xl text-gray-200 font-light leading-relaxed max-w-lg mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Discover plans near you, join the right crew and live the <span className="text-[#00fea3] font-semibold">best vibes you always wanted.</span>
          </motion.p>

          {/* CTA */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(0,254,163,0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => base44.auth.redirectToLogin()}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#00fea3] to-[#00c4a0] text-[#0b0b0b] font-black text-lg shadow-xl"
            >
              Jump in 🚀 <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>

          {/* App store buttons */}
          <motion.div
            className="flex items-center justify-center gap-4 pt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <motion.button whileTap={{ scale: 0.95 }} className="hover:opacity-80 transition-opacity">
              <img
                src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83&releaseDate=some-date"
                alt="Download on the App Store"
                className="h-12 object-contain"
              />
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} className="hover:opacity-80 transition-opacity">
              <img
                src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.svg"
                alt="Get it on Google Play"
                className="h-12 object-contain"
              />
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 text-gray-400"
        >
          <span className="text-xs font-medium tracking-widest uppercase opacity-60">scroll</span>
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </section>

      {/* ── MARQUEE STRIP ── */}
      <div className="overflow-hidden bg-[#00fea3]/5 border-y border-[#00fea3]/10 py-4">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          className="flex gap-12 whitespace-nowrap"
        >
          {[...Array(2)].map((_, j) => (
            ['🎉 Real Plans', '🔥 Real Vibes', '🫂 Real People', '💃 Real Nights', '✨ No Cringe', '🎶 Your Music', '📍 Your City', '🥳 Your Crew'].map((item, i) => (
              <span key={`${j}-${i}`} className="text-[#00fea3] text-sm font-bold tracking-wider">
                {item}
              </span>
            ))
          ))}
        </motion.div>
      </div>

      {/* ── FEATURES ── */}
      <section className="py-24 px-4 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-xs font-bold tracking-widest uppercase text-[#00fea3] mb-3 block">Why Vybt?</span>
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            Stop staying in,<br />
            <span className="bg-gradient-to-r from-[#00fea3] to-[#a855f7] bg-clip-text text-transparent">
              the night is calling 👀
            </span>
          </h2>
          <p className="text-gray-400 text-base max-w-md mx-auto">
            No more FOMO. Vybt is where plans actually happen.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              whileHover={{ scale: 1.03, y: -4 }}
              onHoverStart={() => setHoveredFeature(i)}
              onHoverEnd={() => setHoveredFeature(null)}
              className="relative group bg-white/5 border border-white/8 rounded-3xl p-6 cursor-default overflow-hidden transition-all hover:border-white/20"
            >
              {/* Glow on hover */}
              <motion.div
                className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
              />

              <div className={`w-12 h-12 rounded-2xl ${f.bg} flex items-center justify-center mb-4 text-2xl`}>
                {f.emoji}
              </div>
              <h3 className="font-black text-white mb-2 text-lg">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>

              {hoveredFeature === i && (
                <motion.div
                  layoutId="feature-glow"
                  className={`absolute bottom-3 right-3 w-8 h-8 rounded-full bg-gradient-to-br ${f.color} opacity-60 blur-sm`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── SOCIAL PROOF STRIP ── */}
      <section className="py-16 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-[#542b9b]/30 to-[#00fea3]/10 border border-white/10 p-10 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMCAwSDMwdi02aDZ2NnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
          <h2 className="text-3xl md:text-5xl font-black mb-4 relative">
            Your night starts<br />
            <span className="text-[#00fea3]">when you say so</span> ✨
          </h2>
          <p className="text-gray-300 text-lg mb-8 relative">
            Don't wait for someone else to organise. That's your job now.
          </p>
          <motion.button
            whileHover={{ scale: 1.07, boxShadow: '0 0 40px rgba(0,254,163,0.4)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => base44.auth.redirectToLogin()}
            className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-gradient-to-r from-[#00fea3] to-[#00c4a0] text-[#0b0b0b] font-black text-xl shadow-2xl relative"
          >
            I'm in 🎊
          </motion.button>
        </motion.div>
      </section>

      {/* ── LEGAL LINKS ── */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-xl font-bold mb-2 text-gray-300">The boring (but important) stuff 📋</h2>
            <p className="text-gray-500 text-sm">We know nobody reads this, but it's all here.</p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Shield, label: 'Community', sub: 'Guidelines', page: 'CommunityGuidelines', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'hover:border-purple-500/40' },
              { icon: FileText, label: 'Terms &', sub: 'Conditions', page: 'TermsConditions', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'hover:border-blue-500/40' },
              { icon: Lock, label: 'Privacy', sub: 'Policy', page: 'PrivacyPolicy', color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'hover:border-teal-500/40' },
              { icon: HelpCircle, label: 'Support', sub: '& FAQ', page: 'Support', color: 'text-[#00fea3]', bg: 'bg-[#00fea3]/10', border: 'hover:border-[#00fea3]/40' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ scale: 1.04 }}
              >
                <Link
                  to={createPageUrl(item.page)}
                  className={`flex flex-col items-center text-center gap-3 p-6 rounded-2xl bg-white/5 border border-white/8 ${item.border} hover:bg-white/8 transition-all group`}
                >
                  <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center`}>
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <span className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors leading-tight">
                    {item.label}<br />{item.sub}
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
          <motion.div className="flex items-center gap-2" whileHover={{ scale: 1.05 }}>
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698004f141dcfbdef518004d/4f0b92888_VybtLogoPng.png"
              alt="Vybt"
              className="w-7 h-7 object-contain"
            />
            <span className="font-black text-gray-300 bg-gradient-to-r from-[#00fea3] to-[#542b9b] bg-clip-text text-transparent">Vybt</span>
          </motion.div>
          <div className="flex items-center gap-5 flex-wrap justify-center">
            {NAV_LINKS.map(link => (
              <Link
                key={link.page}
                to={createPageUrl(link.page)}
                className="text-gray-500 hover:text-[#00fea3] text-xs transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <p className="text-gray-600 text-xs">© {new Date().getFullYear()} Vybt. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}