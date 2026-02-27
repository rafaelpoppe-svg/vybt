import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const Section = ({ number, title, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: number * 0.04 }}
    className="mb-8"
  >
    <h2 className="text-lg font-bold text-[#00fea3] mb-3">
      {number}. {title}
    </h2>
    <div className="text-gray-300 text-sm leading-relaxed space-y-2">
      {children}
    </div>
  </motion.div>
);

const Bullets = ({ items }) => (
  <ul className="list-none space-y-1 mt-2">
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-2">
        <span className="text-[#00fea3] mt-0.5">•</span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

export default function CommunityGuidelines() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0b0b0b]/90 backdrop-blur-xl border-b border-white/5 px-4 py-4 flex items-center gap-3 safe-top">
        <button onClick={() => navigate(createPageUrl('Settings'))} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-lg font-bold text-white">Community Guidelines</h1>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-8 pb-20">
        {/* Title block */}
        <div className="mb-10 text-center">
          <div className="text-3xl font-black text-white mb-1">
            Community <span className="text-[#00fea3]">Guidelines</span>
          </div>
          <p className="text-gray-500 text-sm mt-1">Vybt · Last updated: 27/02/2026</p>
        </div>

        <Section number={1} title="Our Philosophy">
          <p>Vybt was built to connect people in real life through shared vibes, safe social plans, and meaningful experiences.</p>
          <p className="mt-2">We believe:</p>
          <Bullets items={[
            'The best vibes bring the right people together.',
            'Respect creates better nights.',
            'Safety comes before everything.',
          ]} />
          <p className="mt-3 text-gray-400">By using Vybt, you agree to follow these Community Guidelines.</p>
        </Section>

        <Section number={2} title="Respect First">
          <p>All users must treat others with respect. The following behavior is not allowed:</p>
          <Bullets items={[
            'Harassment or bullying',
            'Hate speech or discriminatory content',
            'Threats or intimidation',
            'Personal attacks',
            'Doxxing or sharing private information',
            'Repeated unwanted contact',
          ]} />
          <p className="mt-3 text-gray-400">Vybt is a social discovery platform — not a place for hostility.</p>
        </Section>

        <Section number={3} title="Age Requirement">
          <p>Vybt is strictly for users <span className="text-white font-semibold">18 years and older</span>.</p>
          <p className="mt-1">Any account suspected of belonging to a minor will be removed.</p>
        </Section>

        <Section number={4} title="Authentic Profiles Only">
          <p>You must:</p>
          <Bullets items={[
            'Use real and accurate information',
            'Not impersonate others',
            'Not create fake or misleading accounts',
          ]} />
          <p className="mt-3 text-gray-400">Impersonation, catfishing, or identity fraud will result in permanent suspension.</p>
        </Section>

        <Section number={5} title="Safe Social Plans">
          <p>When creating or joining plans:</p>
          <Bullets items={[
            'Be honest about the event details',
            'Do not mislead participants',
            'Avoid unsafe or illegal activities',
          ]} />
          <p className="mt-3 text-gray-400">Plans involving illegal substances, violence, or harmful behavior are strictly prohibited.</p>
        </Section>

        <Section number={6} title="Prohibited Content">
          <p>The following content is not allowed:</p>
          <Bullets items={[
            'Nudity or sexually explicit material',
            'Pornographic content',
            'Illegal activity promotion',
            'Drug distribution or sales',
            'Weapons sales',
            'Graphic violence',
            'Exploitative content',
            'Spam or scam activity',
          ]} />
          <p className="mt-3 text-gray-400">Vybt is designed for social connection — not adult or illegal services.</p>
        </Section>

        <Section number={7} title="Consent & Personal Boundaries">
          <p>Respect personal space and consent at all times.</p>
          <Bullets items={[
            'No unwanted advances',
            'No coercion',
            'No pressuring users into private meetings',
            'No sharing of private conversations without consent',
          ]} />
          <p className="mt-3 font-semibold text-white">If someone says no, it means no.</p>
        </Section>

        <Section number={8} title="Anti-Spam Policy">
          <p>The following is not permitted:</p>
          <Bullets items={[
            'Mass messaging',
            'Promotional spam',
            'Commercial advertising without authorization',
            'Referral abuse',
            'Automated bot accounts',
          ]} />
          <p className="mt-3 text-gray-400">Vybt is not a marketing funnel platform.</p>
        </Section>

        <Section number={9} title="Reporting & Moderation">
          <p>If you experience or witness behavior that violates these guidelines:</p>
          <Bullets items={[
            'Use the in-app report feature',
            'Contact support',
          ]} />
          <p className="mt-3">We reserve the right to:</p>
          <Bullets items={[
            'Remove content',
            'Suspend accounts',
            'Permanently ban users',
            'Report illegal activity to authorities',
          ]} />
          <p className="mt-3 text-gray-400">Moderation decisions are made to protect the community.</p>
        </Section>

        <Section number={10} title="Real-World Responsibility">
          <p>Vybt connects people offline. While we encourage safe social experiences:</p>
          <Bullets items={[
            'Users are responsible for their real-world decisions',
            'Always meet in public places',
            'Inform friends about plans',
            'Trust your instincts',
          ]} />
          <p className="mt-3 font-semibold text-white">Your safety comes first.</p>
        </Section>

        <Section number={11} title="Repeated Violations">
          <p>Accounts that repeatedly violate these guidelines may be:</p>
          <Bullets items={[
            'Temporarily suspended',
            'Permanently removed',
            'Blocked from re-registration',
          ]} />
          <p className="mt-3 text-gray-400">Severe violations may result in immediate permanent ban.</p>
        </Section>

        <Section number={12} title="Community Culture">
          <p>Vybt is about:</p>
          <Bullets items={['Energy', 'Connection', 'Respect', 'Shared experiences']} />
          <p className="mt-3">We are building a community where:</p>
          <Bullets items={[
            'Good vibes are mutual.',
            'Safety is non-negotiable.',
            'Respect is standard.',
          ]} />
        </Section>

        <Section number={13} title="Changes to Guidelines">
          <p>Vybt may update these guidelines as the platform evolves.</p>
          <p className="mt-1">Continued use of the platform means acceptance of the latest version.</p>
        </Section>

        {/* Closing note */}
        <div className="mt-10 p-5 rounded-2xl border border-[#00fea3]/20 bg-[#00fea3]/5">
          <p className="text-[#00fea3] font-bold mb-3 text-base">A Note from Vybt</p>
          <p className="text-gray-300 text-sm leading-relaxed">
            Vybt exists to bring people together — not to create chaos.
          </p>
          <p className="text-gray-300 text-sm leading-relaxed mt-2">
            If you're here to create real moments, share good energy, and respect others, <span className="text-white font-semibold">you belong here.</span>
          </p>
          <p className="text-gray-400 text-sm mt-2 italic">
            If not — this is not your platform.
          </p>
        </div>
      </div>
    </div>
  );
}