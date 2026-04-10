import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../components/common/LanguageContext';

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
  const { t } = useLanguage();

  const faqs = [
    { number: '1.',  question: t.faqQ1,  answer: t.faqA1  },
    { number: '2.',  question: t.faqQ2,  answer: t.faqA2  },
    { number: '3.',  question: t.faqQ3,  answer: t.faqA3  },
    { number: '4.',  question: t.faqQ4,  answer: t.faqA4  },
    { number: '5.',  question: t.faqQ5,  answer: t.faqA5  },
    { number: '6.',  question: t.faqQ6,  answer: t.faqA6  },
    { number: '7.',  question: t.faqQ7,  answer: t.faqA7  },
    { number: '8.',  question: t.faqQ8,  answer: t.faqA8  },
    { number: '9.',  question: t.faqQ9,  answer: t.faqA9  },
    { number: '10.', question: t.faqQ10, answer: t.faqA10 },
    { number: '11.', question: t.faqQ11, answer: t.faqA11 },
    { number: '12.', question: t.faqQ12, answer: t.faqA12 },
    { number: '13.', question: t.faqQ13, answer: t.faqA13 },
    { number: '14.', question: t.faqQ14, answer: t.faqA14 },
    { number: '15.', question: t.faqQ15, answer: t.faqA15 },
    { number: '16.', question: t.faqQ16, answer: t.faqA16 },
    { number: '17.', question: t.faqQ17, answer: t.faqA17 },
  ];

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: 'var(--bg)' }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3"
        style={{ background: 'var(--bg)', opacity: 0.9, paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-lg font-bold text-white">{t.helpFaq}</h1>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6 pb-20">
        {/* Title block */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 mb-4">
            <span className="text-yellow-400 text-xs font-semibold tracking-wide uppercase">Vybt</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">{t.helpFaq}</h2>
          <p className="text-gray-500 text-sm">{t.faqSubtitle}</p>
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