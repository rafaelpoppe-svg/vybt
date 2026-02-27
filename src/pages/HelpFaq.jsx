import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    number: '1.',
    question: 'What is Vybt?',
    answer: `Vybt is a social planning platform that helps people discover, create, and join real-life social plans based on shared vibes and location.\n\nIt's designed to connect the right people to the right experiences.\n\nBest Vibes Finds You.`,
  },
  {
    number: '2.',
    question: 'How does Vybt work?',
    answer: `1. Create your profile\n2. Select your Vibe Tags\n3. Discover plans near you\n4. Join a group or create your own plan\n5. Connect and go out\n\nVybt connects people before the night begins.`,
  },
  {
    number: '3.',
    question: 'Is Vybt free?',
    answer: `Yes. Vybt is free to download and use.\n\nSome premium features may be introduced in the future, but the core experience is free.`,
  },
  {
    number: '4.',
    question: 'How do I create a plan?',
    answer: `To create a plan:\n- Tap "Create Plan"\n- Choose a Party Type\n- Select Vibe Tags\n- Add date, time, and location\n- Publish\n\nOther users nearby will be able to discover and join your plan.`,
  },
  {
    number: '5.',
    question: 'How do I join a plan?',
    answer: `Simply browse available plans near you and tap "Join".\n\nOnce accepted (if approval is required), you will gain access to the group chat and participants list.`,
  },
  {
    number: '6.',
    question: 'How does location work?',
    answer: `Vybt uses your location to:\n- Show nearby plans\n- Match users within your selected area\n\nYou can disable location permissions at any time in your device settings, but some features may be limited.`,
  },
  {
    number: '7.',
    question: 'Is Vybt safe?',
    answer: `Vybt promotes safe social experiences.\n\nHowever:\n- We do not supervise offline meetings\n- We do not conduct background checks\n\nWe recommend:\n- Meeting in public places\n- Informing friends about your plans\n- Trusting your instincts\n\nIf something feels wrong, leave immediately.`,
  },
  {
    number: '8.',
    question: 'How do I report a user or plan?',
    answer: `If someone violates our Community Guidelines:\n- Go to the user profile or plan\n- Tap "Report"\n- Select the reason\n\nOur moderation team will review the case.`,
  },
  {
    number: '9.',
    question: 'Can I block someone?',
    answer: `Yes.\n\nYou can block any user from their profile page.\n\nBlocked users will no longer be able to contact or interact with you.`,
  },
  {
    number: '10.',
    question: 'How do I delete my account?',
    answer: `To delete your account:\n- Go to Profile\n- Open Settings\n- Select "Delete Account"\n\nThis action is permanent.`,
  },
  {
    number: '11.',
    question: 'I forgot my password. What should I do?',
    answer: `Use the "Forgot Password" option on the login screen and follow the instructions sent to your email.`,
  },
  {
    number: '12.',
    question: 'Can businesses promote events on Vybt?',
    answer: `Vybt is designed primarily for social plans between individuals.\n\nCommercial promotion is not allowed without authorization.\n\nIf you are interested in partnerships, contact:\n📧 partners@vybtapp.com`,
  },
  {
    number: '13.',
    question: "Why can't I see plans near me?",
    answer: `Possible reasons:\n- Location permissions disabled\n- Low activity in your area\n- App needs updating\n\nMake sure your location access is enabled and your app is updated.`,
  },
  {
    number: '14.',
    question: 'Does Vybt organize events?',
    answer: `No.\n\nVybt is a platform that enables users to create and join plans.\n\nVybt does not host or manage physical events.`,
  },
  {
    number: '15.',
    question: 'Who can use Vybt?',
    answer: `Vybt is strictly for users aged 18 and above.`,
  },
  {
    number: '16.',
    question: 'How do I contact support?',
    answer: `If you need assistance:\n\n📧 support@vybtapp.com\n🌐 www.vybtapp.com\n\nWe aim to respond as quickly as possible.`,
  },
  {
    number: '17.',
    question: 'How can I stay updated?',
    answer: `Follow us on Instagram and TikTok for updates, new features, and announcements.`,
  },
];

function FaqItem({ item }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left"
      >
        <span className="text-yellow-400 font-bold text-sm min-w-[28px]">{item.number}</span>
        <span className="text-white font-semibold text-sm flex-1">{item.question}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-4 pl-[52px] border-t border-white/5 pt-3">
          {item.answer.split('\n').map((line, i) => (
            <p key={i} className={`text-gray-400 text-sm leading-relaxed ${line === '' ? 'mt-2' : ''}`}>
              {line}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HelpFaq() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      {/* Header */}
      <div
        className="sticky top-0 z-10 bg-[#0b0b0b]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        <button
          onClick={() => navigate(createPageUrl('Settings'))}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-lg font-bold text-white">Help & FAQ</h1>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6 pb-20">
        {/* Title block */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 mb-4">
            <span className="text-yellow-400 text-xs font-semibold tracking-wide uppercase">Vybt</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Help & FAQ</h2>
          <p className="text-gray-500 text-sm">Tap a question to expand the answer.</p>
        </div>

        <div className="space-y-3">
          {faqs.map(item => (
            <FaqItem key={item.number} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}