import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Music, PartyPopper, MapPin, Info } from 'lucide-react';
import VibeTag, { vibeConfig } from '../common/VibeTag';
import PartyTag, { partyTagConfig } from '../common/PartyTag';
import StripeCheckout from '../payment/StripeCheckout';
import { toast } from 'sonner';
import { useLanguage } from '../common/LanguageContext';

const vibeOptions = Object.keys(vibeConfig);
const partyTagOptions = Object.keys(partyTagConfig);

export default function HighlightStoryModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  planCity,
  isLoading = false 
}) {
  const [selectedVibes, setSelectedVibes] = useState([]);
  const [selectedPartyTypes, setSelectedPartyTypes] = useState([]);
  const { t } = useLanguage();

  const toggleVibe = (vibe) => {
    if (selectedVibes.includes(vibe)) {
      setSelectedVibes(selectedVibes.filter(v => v !== vibe));
    } else {
      setSelectedVibes([...selectedVibes, vibe]);
    }
  };

  const togglePartyType = (type) => {
    if (selectedPartyTypes.includes(type)) {
      setSelectedPartyTypes(selectedPartyTypes.filter(t => t !== type));
    } else {
      setSelectedPartyTypes([...selectedPartyTypes, type]);
    }
  };

  const handleSuccess = () => {
    onConfirm({
      targetVibes: selectedVibes,
      targetPartyTypes: selectedPartyTypes
    });
    toast.success(t.highlightStorySuccess);
  };

  const handleError = (msg) => {
    toast.error(msg || t.highlightError);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 max-h-[85vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#00c6d2]" />
                <h2 className="text-lg font-bold text-white">{t.highlightStoryTitle}</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-800">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-4 space-y-5">
              {/* Info */}
              <div className="p-3 rounded-xl bg-[#542b9b]/20 border border-[#542b9b]/30 flex items-start gap-3">
                <Info className="w-5 h-5 text-[#542b9b] flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-300">
                  <p className="font-medium text-white mb-1">{t.highlightStoryHowTitle}</p>
                  <p>{t.highlightStoryHowDesc.replace('{city}', planCity)}</p>
                </div>
              </div>

              {/* Location Info */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800">
                <MapPin className="w-4 h-4 text-[#00c6d2]" />
                <span className="text-sm text-gray-300">{t.highlightStoryTargeting} <span className="text-white font-medium">{planCity}</span></span>
              </div>

              {/* Target Vibes */}
              <div>
                <label className="text-gray-400 text-sm mb-2 flex items-center gap-1.5">
                  <Music className="w-4 h-4" />
                  {t.highlightStoryTargetVibes}
                </label>
                <p className="text-xs text-gray-500 mb-3">{t.highlightStoryTargetVibesDesc}</p>
                <div className="flex flex-wrap gap-2">
                  {vibeOptions.slice(0, -1).map(vibe => (
                    <VibeTag
                      key={vibe}
                      vibe={vibe}
                      size="sm"
                      interactive
                      selected={selectedVibes.includes(vibe)}
                      onClick={() => toggleVibe(vibe)}
                    />
                  ))}
                </div>
              </div>

              {/* Target Party Types */}
              <div>
                <label className="text-gray-400 text-sm mb-2 flex items-center gap-1.5">
                  <PartyPopper className="w-4 h-4" />
                  {t.highlightStoryTargetParty}
                </label>
                <p className="text-xs text-gray-500 mb-3">{t.highlightStoryTargetPartyDesc}</p>
                <div className="flex flex-wrap gap-2">
                  {partyTagOptions.map(tag => (
                    <PartyTag
                      key={tag}
                      tag={tag}
                      size="sm"
                      interactive
                      selected={selectedPartyTypes.includes(tag)}
                      onClick={() => togglePartyType(tag)}
                    />
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#00c6d2]/10 to-[#542b9b]/10 border border-[#00c6d2]/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{t.highlightCost}</p>
                    <p className="text-xs text-gray-400">{t.highlightOneTime}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#00c6d2]">€1.59</p>
                  </div>
                </div>
              </div>

              <StripeCheckout
                type="highlight_story"
                buttonLabel={t.highlightStoryPayBtn}
                onSuccess={handleSuccess}
                onError={handleError}
              />

              <p className="text-xs text-gray-500 text-center">
                {t.highlightTerms}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}