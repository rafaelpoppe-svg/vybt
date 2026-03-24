import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Info, MoreVertical, MapPin, Clock, Flame, RefreshCw, Trash2 } from 'lucide-react';
import PartyTag from '../common/PartyTag';
import PlanCountdown from '../plan/PlanCountdown';
import { useLanguage } from '../common/LanguageContext';

export default function GroupChatHeader({
  plan, planStatus, isChatLocked, hasVoted, isAdmin, themeColor,
  onBack, onInfo, onAdminActions, onVote, onRenew, onDelete, onHighlight
}) {
  // Only community plans can be renewed
  const canRenew = !!plan?.community_id;
  const { t } = useLanguage();
  return (
    <header
      className="relative z-20 backdrop-blur-xl border-b border-gray-800/60"
      style={{ backgroundColor: `color-mix(in srgb, ${themeColor} 8%, #0b0b0b 92%)` }}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-2">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); onBack(); }}
          className="w-9 h-9 rounded-full bg-gray-900/80 flex items-center justify-center flex-shrink-0"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </motion.button>

        {/* Avatar */}
        <motion.div
          whileTap={{ scale: 0.9 }}
          onClick={onInfo}
          className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer"
          style={{ background: `linear-gradient(135deg, ${themeColor}40, #542b9b40)` }}
        >
          {plan?.group_image ? (
            <img src={plan.group_image} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg">🎉</div>
          )}
        </motion.div>

        {/* Title only — tags moved below */}
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-white truncate leading-tight">
            {plan?.title || '...'}
          </h1>
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 flex-shrink-0 relative z-30">
          {isAdmin && !plan?.is_highlighted && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onHighlight(); }}
              className="w-9 h-9 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center"
              title="Highlight Plan"
            >
              <Flame className="w-4 h-4 text-orange-400" />
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onInfo(); }}
            className="w-9 h-9 rounded-full bg-gray-900/80 flex items-center justify-center"
          >
            <Info className="w-4 h-4 text-white" />
          </motion.button>
          {isAdmin && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onAdminActions(); }}
              className="w-9 h-9 rounded-full bg-gray-900/80 flex items-center justify-center"
            >
              <MoreVertical className="w-4 h-4 text-white" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Tags row — full width, no overlap */}
      {plan?.tags?.length > 0 && (
        <div className="flex gap-1.5 px-4 pb-2 overflow-x-auto scrollbar-hide">
          {plan.tags.slice(0, 2).map((tag, i) => (
            <PartyTag key={i} tag={tag} size="sm" />
          ))}
        </div>
      )}

      {/* Meta row */}
      {plan && (
        <div className="px-4 pb-3 space-y-2">
          <PlanCountdown plan={plan} size="sm" />

          <div className="flex items-center gap-4 text-xs" style={{ color: themeColor }}>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Clock className="w-3 h-3" />
              <span>{plan.time}{plan.end_time && ` – ${plan.end_time}`}</span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{plan.location_address}</span>
            </div>
          </div>

          {/* Voting banner */}
          {planStatus === 'voting' && !hasVoted && !isAdmin && (
            <motion.button
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              whileTap={{ scale: 0.97 }}
              onClick={(e) => { e.stopPropagation(); onVote(); }}
              className="w-full py-2.5 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 text-sm font-semibold flex items-center justify-center gap-2"
            >
              <Flame className="w-4 h-4" />
              {t.votingOpen}
            </motion.button>
          )}

          {/* Awaiting admin decision banner (non-admin members) */}
          {planStatus === 'ended' && plan?.status !== 'terminated' && plan?.status !== 'renewed' && !isAdmin && (
            <div className="w-full py-2.5 rounded-xl bg-gray-800/60 border border-gray-700/50 text-gray-400 text-xs font-medium flex items-center justify-center gap-2">
              {t.awaitingAdminDecision}
            </div>
          )}

          {/* Admin actions — only after plan end time has passed */}
          {planStatus === 'ended' && isAdmin && plan?.status !== 'terminated' && plan?.status !== 'renewed' && (
            <div className="flex gap-2">
              {canRenew && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => { e.stopPropagation(); onRenew(); }}
                  className="flex-1 py-2.5 rounded-xl bg-[#00c6d2]/20 border border-[#00c6d2]/30 text-[#00c6d2] text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t.renewPlan}
                </motion.button>
              )}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className={`flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-semibold flex items-center justify-center gap-2`}
              >
                <Trash2 className="w-4 h-4" />
                {t.terminatePlan}
              </motion.button>
            </div>
          )}

          {/* Terminated banner */}
          {plan?.status === 'terminated' && (
            <div className="w-full py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold flex items-center justify-center gap-2">
              {t.terminatedBanner}
            </div>
          )}
        </div>
      )}
    </header>
  );
}