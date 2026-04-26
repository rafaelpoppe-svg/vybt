import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Sparkles, Flame, Globe, Shield, Infinity, Star } from 'lucide-react';
import StripeCheckout from './StripeCheckout';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const BENEFITS = [
  { icon: Infinity, color: '#00c6d2', title: 'Highlights de Planos Ilimitados', desc: 'Destaca todos os teus planos sem custo extra' },
  { icon: Sparkles, color: '#a855f7', title: 'Highlights de Stories Ilimitados', desc: 'Promove os teus stories para toda a plataforma' },
  { icon: Globe, color: '#f59e0b', title: 'Explorar Qualquer Cidade', desc: 'Vê planos e utilizadores em qualquer cidade' },
  { icon: Zap, color: '#00c6d2', title: 'Badge VybtPlus Exclusivo', desc: 'Destaca-te com o badge ⚡ no teu perfil' },
  { icon: Star, color: '#ec4899', title: 'Prioridade no Mapa', desc: 'Os teus planos aparecem em destaque no mapa' },
  { icon: Shield, color: '#22c55e', title: 'Suporte Prioritário', desc: 'Acesso a suporte dedicado e rápido' },
];

export default function VybtPlusModal({ isOpen, onClose, onSuccess }) {
  const [paid, setPaid] = useState(false);

  const handleSuccess = async () => {
    try {
      await base44.functions.invoke('activateVybtPlus', {});
      setPaid(true);
      toast.success('⚡ VybtPlus ativado! Bem-vindo ao próximo nível!');
      onSuccess?.();
      onClose();
    } catch (e) {
      toast.error('Erro ao ativar VybtPlus. Contacta o suporte.');
    }
  };

  const handleError = (msg) => {
    toast.error(msg || 'Erro no pagamento');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 38 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[430px] rounded-t-3xl overflow-hidden max-h-[92vh] flex flex-col"
            style={{ background: 'linear-gradient(160deg, #0d0d1a 0%, #1a0a2e 50%, #0d0d1a 100%)' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-700" />
            </div>

            {/* Header */}
            <div className="px-5 pt-3 pb-4 flex-shrink-0 relative overflow-hidden">
              {/* Glow */}
              <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(ellipse at 50% 0%, #00c6d2 0%, transparent 70%)' }} />
              <button onClick={onClose} className="absolute top-3 right-5 p-2 rounded-full bg-white/10">
                <X className="w-4 h-4 text-gray-400" />
              </button>
              <div className="text-center relative z-10 pt-2">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-3" style={{ background: 'linear-gradient(135deg, #00c6d2, #542b9b)' }}>
                  <Zap className="w-4 h-4 text-white" />
                  <span className="text-white font-black text-sm tracking-wider">VYBT PLUS</span>
                </div>
                <h2 className="text-2xl font-black text-white leading-tight">Eleva a tua experiência</h2>
                <p className="text-gray-400 text-sm mt-1">Destaca-te na plataforma com benefícios exclusivos</p>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 space-y-3 pb-2">
              {/* Benefits */}
              <div className="space-y-2">
                {BENEFITS.map((b, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${b.color}20` }}>
                      <b.icon className="w-4 h-4" style={{ color: b.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm">{b.title}</p>
                      <p className="text-gray-500 text-xs">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price card */}
              <div className="p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(0,198,210,0.12), rgba(84,43,155,0.12))', border: '1px solid rgba(0,198,210,0.25)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold">VybtPlus Mensal</p>
                    <p className="text-gray-400 text-xs">Renovação automática • Cancela quando quiseres</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-white">€4.99</p>
                    <p className="text-gray-400 text-xs">/mês</p>
                  </div>
                </div>
              </div>

              {/* Stripe checkout */}
              <StripeCheckout
                type="vybt_plus_monthly"
                buttonLabel="⚡ Ativar VybtPlus — €4.99/mês"
                onSuccess={handleSuccess}
                onError={handleError}
              />

              <p className="text-xs text-gray-600 text-center pb-4">
                Ao subscrever, aceitas os nossos Termos de Serviço. O acesso é válido por 30 dias após o pagamento.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}