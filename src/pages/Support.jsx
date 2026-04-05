import React, { useState } from 'react';
import { Mail, MessageCircle, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { useLanguage } from '../components/common/LanguageContext';

const faqs = [
  {
    q: "How do I create a plan?",
    a: "Tap the '+' button at the bottom navigation, select 'Create new Plan', fill in the details and publish it."
  },
  {
    q: "How does profile verification work?",
    a: "Go to your Profile page and tap 'Verify Your Profile'. You'll take a live selfie which will be compared to your profile photo to earn a blue verified badge."
  },
  {
    q: "Can I delete my account?",
    a: "Yes. Go to Settings → Delete Account. This action is permanent and removes all your data from Vybt."
  },
  {
    q: "How do I report a user or content?",
    a: "On any plan or user profile, tap the three-dot menu and select 'Report'. Our moderation team will review it promptly."
  },
  {
    q: "Why was my story removed?",
    a: "Stories are automatically checked for inappropriate content. If your story was removed, it may have violated our Community Guidelines."
  },
  {
    q: "How does the Ambassador Program work?",
    a: "Invite friends using your referral code. The more friends you bring to Vybt, the more perks you unlock as an Ambassador."
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#00fea3]/40 transition-all"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-white font-medium text-sm">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-[#00fea3] shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </div>
      {open && (
        <p className="mt-3 text-gray-400 text-sm leading-relaxed border-t border-white/10 pt-3">
          {a}
        </p>
      )}
    </button>
  );
}

export default function Support() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const {t} = useLanguage();
  const handleSubmit = (e) => {
    e.preventDefault();
    const mailto = `mailto:support@vybtapp.com?subject=${encodeURIComponent(formData.subject || 'Support Request')}&body=${encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`)}`;
    window.location.href = mailto;
    setSent(true);
  };

  return (
    <div 
      className="min-h-screen text-white"
      style={{background: 'var(--bg)'}}
    >
      {/* Header */}
      <div 
        className="sticky top-0 z-10 backdrop-blur-md border-b border-white/10 px-4 py-4 flex items-center gap-3"
        style={{background: 'var(--bg)', opacity: 0.9}}
      >
        <Link to={createPageUrl('Welcome')} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-300" />
        </Link>
        <span className="text-white font-bold text-lg">Support</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-10">

        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-[#00fea3]/10 border border-[#00fea3]/30 flex items-center justify-center mx-auto">
            <MessageCircle className="w-8 h-8 text-[#00fea3]" />
          </div>
          <h1 className="text-2xl font-bold">How can we help?</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Browse the FAQs below or send us a message — we typically respond within 24 hours.
          </p>
        </div>

        {/* Email Contact */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#00fea3]/5 border border-[#00fea3]/20">
          <div className="w-10 h-10 rounded-xl bg-[#00fea3]/10 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-[#00fea3]" />
          </div>
          <div>
            <p className="text-gray-400 text-xs">Email us directly</p>
            <a
              href="mailto:support@vybtapp.com"
              className="text-[#00fea3] font-semibold text-sm hover:underline"
            >
              support@vybtapp.com
            </a>
          </div>
        </div>

        {/* FAQ */}
        <div className="space-y-3">
          <h2 className="text-white font-bold text-base">Frequently Asked Questions</h2>
          {faqs.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}
        </div>

        {/* Contact Form */}
        <div className="space-y-4">
          <h2 className="text-white font-bold text-base">Send us a message</h2>

          {sent ? (
            <div className="p-6 rounded-2xl bg-[#00fea3]/10 border border-[#00fea3]/30 text-center space-y-2">
              <div className="text-3xl">✉️</div>
              <p className="text-[#00fea3] font-semibold">Message opened in your email app!</p>
              <p className="text-gray-400 text-sm">You can also email us directly at <span className="text-[#00fea3]">support@vybtapp.com</span></p>
              <button onClick={() => setSent(false)} className="text-gray-500 text-xs underline mt-2">Send another</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                required
                type="text"
                placeholder="Your name"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#00fea3]/50 transition-colors"
              />
              <input
                required
                type="email"
                placeholder="Your email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#00fea3]/50 transition-colors"
              />
              <input
                type="text"
                placeholder="Subject"
                value={formData.subject}
                onChange={e => setFormData({...formData, subject: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#00fea3]/50 transition-colors"
              />
              <textarea
                required
                rows={5}
                placeholder="Describe your issue or question..."
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#00fea3]/50 transition-colors resize-none"
              />
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[#00fea3] text-[#0b0b0b] font-bold text-sm hover:bg-[#00fea3]/90 transition-colors"
              >
                Send Message
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-gray-600 text-xs pb-6">© {new Date().getFullYear()} Vybt. {t.allRightsReserved}</p>
      </div>
    </div>
  );
}