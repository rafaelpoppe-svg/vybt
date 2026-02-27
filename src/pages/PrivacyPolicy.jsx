import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';

const sections = [
  {
    number: '1.',
    title: 'Introduction',
    content: `Welcome to Vybt.\n\nVybt is a social platform designed to connect people through location-based plans, shared vibes, and real-world experiences. Your privacy matters to us.\n\nThis Privacy Policy explains:\n- What information we collect\n- How we use it\n- When and why we may share it\n- Your rights\n- How we protect your data\n\nBy using Vybt, you agree to the practices described in this Privacy Policy.`,
  },
  {
    number: '2.',
    title: 'Data Controller',
    content: `Vybt is the data controller responsible for the processing of personal data collected through the application and website.\n\nFor privacy-related inquiries, please contact:\n📧 support@vybtapp.com`,
  },
  {
    number: '3.',
    title: 'Information We Collect',
    content: `We collect only the information necessary to provide and improve our services.\n\n3.1 Information You Provide\n- Username\n- Email address\n- Profile photo\n- Gender (if provided)\n- Biography\n- Selected Vibe Tags\n- Created or joined plans\n- Messages sent within the platform\n\n3.2 Usage Information\n- Interaction activity within the app\n- Plans created, joined, or viewed\n- Preferences and settings\n- Engagement with features\n\n3.3 Location Data\nVybt may use location data to:\n- Display nearby plans\n- Enable city-based discovery\n- Match users within a selected radius\n\nLocation access can be disabled at any time in your device settings.\n\n3.4 Technical Data\n- Device type\n- Operating system\n- App version\n- Anonymous analytics data\n- Log data and performance information`,
  },
  {
    number: '4.',
    title: 'How We Use Your Information',
    content: `We use your information to:\n- Create and manage your account\n- Enable social plan creation and participation\n- Personalize recommendations\n- Improve platform performance\n- Ensure safety and prevent misuse\n- Comply with legal obligations\n\nVybt does not sell personal data to third parties.`,
  },
  {
    number: '5.',
    title: 'Data Sharing',
    content: `We may share data only when necessary with:\n- Hosting and infrastructure providers\n- Analytics services\n- Legal authorities when required by law\n\nAll service providers are subject to confidentiality and data protection obligations.`,
  },
  {
    number: '6.',
    title: 'Legal Basis for Processing (GDPR)',
    content: `We process personal data based on:\n- Contractual necessity (to provide the service)\n- User consent\n- Legitimate interest (security, improvement, fraud prevention)\n- Legal obligations`,
  },
  {
    number: '7.',
    title: 'Data Retention',
    content: `We retain personal data only for as long as necessary to:\n- Maintain active accounts\n- Fulfill legal requirements\n- Resolve disputes\n\nYou may request account deletion at any time.`,
  },
  {
    number: '8.',
    title: 'Your Rights',
    content: `Under the General Data Protection Regulation (GDPR), you have the right to:\n- Access your data\n- Correct inaccurate information\n- Request deletion ("right to be forgotten")\n- Restrict processing\n- Data portability\n- Object to processing\n\nTo exercise these rights, contact:\n📧 support@vybtapp.com`,
  },
  {
    number: '9.',
    title: 'Security Measures',
    content: `Vybt implements appropriate technical and organizational safeguards to protect personal data against:\n- Unauthorized access\n- Alteration\n- Disclosure\n- Loss or destruction\n\nHowever, no system can guarantee absolute security.`,
  },
  {
    number: '10.',
    title: 'User-Generated Content',
    content: `Vybt is a social platform.\n\nInformation you choose to make public (such as profile details, Vibe Tags, created plans, and participation in plans) may be visible to other users.\n\nPlease share responsibly.`,
  },
  {
    number: '11.',
    title: 'Age Restriction',
    content: `Vybt is intended for users aged 18 and older.\n\nWe do not knowingly collect personal data from minors. If we become aware of such data, we will take steps to remove it.`,
  },
  {
    number: '12.',
    title: 'Cookies and Tracking Technologies',
    content: `Our website may use cookies and similar technologies to:\n- Improve browsing experience\n- Collect statistical data\n- Ensure essential functionality\n\nUsers may manage cookies through browser settings.`,
  },
  {
    number: '13.',
    title: 'International Data Transfers',
    content: `If data is transferred outside the European Economic Area (EEA), we ensure appropriate safeguards in accordance with applicable data protection laws.`,
  },
  {
    number: '14.',
    title: 'Changes to This Policy',
    content: `We may update this Privacy Policy periodically.\n\nSignificant changes will be communicated within the app or website.\n\nWe encourage users to review this policy regularly.`,
  },
  {
    number: '15.',
    title: 'Contact Information',
    content: `For any privacy-related inquiries:\n\n📧 support@vybtapp.com\n🌐 www.vybtapp.com`,
  },
];

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0b0b0b]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
        <button
          onClick={() => navigate(createPageUrl('Settings'))}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-lg font-bold text-white">Privacy Policy</h1>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6 pb-20">
        {/* Title block */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00fea3]/10 border border-[#00fea3]/20 mb-4">
            <span className="text-[#00fea3] text-xs font-semibold tracking-wide uppercase">Vybt</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Privacy Policy</h2>
          <p className="text-gray-500 text-sm">Last updated: 27/02/2026</p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.number} className="bg-white/5 rounded-2xl p-5 border border-white/5">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-[#00fea3] font-bold text-sm min-w-[28px]">{section.number}</span>
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

        {/* Final Note */}
        <div className="mt-8 rounded-2xl p-5 border border-[#00fea3]/20 bg-gradient-to-br from-[#00fea3]/5 to-[#542b9b]/5">
          <p className="text-[#00fea3] font-semibold text-sm mb-2">A Note from Vybt</p>
          <p className="text-gray-300 text-sm leading-relaxed">
            Vybt exists to help people connect in real life through shared vibes and meaningful experiences.
          </p>
          <p className="text-gray-300 text-sm leading-relaxed mt-2">
            We build community — not data exploitation.
          </p>
          <p className="text-gray-400 text-sm leading-relaxed mt-2 italic">
            Your trust matters to us as much as your vibe.
          </p>
        </div>
      </div>
    </div>
  );
}