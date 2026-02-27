import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';

const sections = [
  {
    number: '1.',
    title: 'Acceptance of Terms',
    content: `By accessing or using Vybt (the "App" or "Platform"), you agree to be bound by these Terms & Conditions.\n\nIf you do not agree to these Terms, you must not use the Platform.\n\nThese Terms form a legally binding agreement between you ("User") and Vybt.`,
  },
  {
    number: '2.',
    title: 'Eligibility',
    content: `Vybt is intended for individuals who are:\n- At least 18 years old\n- Legally capable of entering into binding agreements\n\nBy creating an account, you confirm that you meet these requirements.\n\nVybt reserves the right to suspend or terminate accounts that violate this condition.`,
  },
  {
    number: '3.',
    title: 'Account Registration',
    content: `To use Vybt, you must create an account and provide accurate information.\n\nYou agree to:\n- Provide truthful information\n- Maintain the security of your account\n- Not share your login credentials\n- Immediately notify Vybt of unauthorized access\n\nYou are responsible for all activity under your account.`,
  },
  {
    number: '4.',
    title: 'Platform Purpose',
    content: `Vybt is a social discovery and planning platform designed to:\n- Allow users to create social plans\n- Join events or meetups\n- Connect with people based on shared vibes and location\n\nVybt does not organize physical events and is not responsible for offline interactions.`,
  },
  {
    number: '5.',
    title: 'User Conduct',
    content: `You agree not to:\n- Harass, threaten, or abuse other users\n- Post illegal, violent, or sexually explicit content\n- Promote drugs, weapons, or illegal activities\n- Impersonate another person\n- Create fake accounts\n- Use automated bots\n- Spam or advertise without authorization\n\nViolation of these rules may result in suspension or permanent removal.`,
  },
  {
    number: '6.',
    title: 'User-Generated Content',
    content: `Users may create:\n- Profiles\n- Plans\n- Messages\n- Photos\n- Vibe Tags\n\nBy posting content on Vybt, you grant Vybt a non-exclusive, worldwide, royalty-free license to use, display, and distribute such content solely for the purpose of operating and improving the Platform.\n\nYou remain the owner of your content.\n\nYou are solely responsible for the content you share.`,
  },
  {
    number: '7.',
    title: 'Offline Interactions Disclaimer',
    content: `Vybt connects people in real life.\n\nVybt does not:\n- Conduct background checks\n- Guarantee user identity\n- Supervise physical meetings\n- Ensure safety of events\n\nYou are responsible for your own safety and decisions.\n\nAlways meet in public places and exercise caution.`,
  },
  {
    number: '8.',
    title: 'Location Services',
    content: `Vybt may use your location to:\n- Display nearby plans\n- Enable proximity-based discovery\n\nYou may disable location permissions through your device settings.`,
  },
  {
    number: '9.',
    title: 'Payments (If Applicable)',
    content: `If Vybt introduces paid features:\n- All purchases will be processed through official app stores\n- Refund policies will follow Apple or Google policies\n- Prices may change at any time\n\nVybt does not process payment information directly.`,
  },
  {
    number: '10.',
    title: 'Intellectual Property',
    content: `All content owned by Vybt, including:\n- Logos\n- Design\n- Branding\n- Interface\n- Software\n\nIs protected by intellectual property laws.\n\nYou may not copy, distribute, or modify any Vybt-owned material without permission.`,
  },
  {
    number: '11.',
    title: 'Termination',
    content: `Vybt reserves the right to:\n- Suspend accounts\n- Remove content\n- Permanently ban users\n- Restrict access\n\nThis may occur without prior notice if Terms are violated.\n\nYou may delete your account at any time.`,
  },
  {
    number: '12.',
    title: 'Limitation of Liability',
    content: `To the maximum extent permitted by law, Vybt is not liable for:\n- User behavior\n- Offline incidents\n- Personal injury\n- Loss of property\n- Indirect or consequential damages\n\nThe Platform is provided "as is" and "as available".`,
  },
  {
    number: '13.',
    title: 'Data Protection',
    content: `Use of the Platform is also governed by our Privacy Policy.\n\nPlease review it carefully.`,
  },
  {
    number: '14.',
    title: 'Modifications to Terms',
    content: `Vybt may update these Terms at any time.\n\nUsers will be notified of significant changes.\n\nContinued use of the Platform constitutes acceptance of updated Terms.`,
  },
  {
    number: '15.',
    title: 'Governing Law',
    content: `These Terms are governed by the laws of Portugal.\n\nAny disputes shall be subject to the jurisdiction of the competent courts of that jurisdiction.`,
  },
  {
    number: '16.',
    title: 'Contact',
    content: `For legal inquiries:\n\n📧 support@vybtapp.com\n🌐 www.vybtapp.com`,
  },
];

export default function TermsConditions() {
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
        <h1 className="text-lg font-bold text-white">Terms & Conditions</h1>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6 pb-20">
        {/* Title block */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
            <span className="text-blue-400 text-xs font-semibold tracking-wide uppercase">Vybt</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Terms & Conditions</h2>
          <p className="text-gray-500 text-sm">Last updated: 27/02/2026</p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.number} className="bg-white/5 rounded-2xl p-5 border border-white/5">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-blue-400 font-bold text-sm min-w-[28px]">{section.number}</span>
                <h3 className="text-white font-semibold text-base">{section.title}</h3>
              </div>
              <div className="pl-[40px]">
                {section.content.split('\n').map((line, i) => (
                  <p key={i} className={`text-gray-400 text-sm leading-relaxed ${line === '' ? 'mt-2' : ''}`}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}