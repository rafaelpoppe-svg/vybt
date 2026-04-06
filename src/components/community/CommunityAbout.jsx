import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Users, CalendarDays, BarChart2, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '../community/LanguageContext';

export default function CommunityAbout({ community, members, plans, profilesMap, tc, currentUser }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const totalPlans = plans.length;
  const adminMembers = members.filter(m => m.role === 'admin');
  const recentMembers = [...members].sort((a, b) => new Date(b.joined_at || 0) - new Date(a.joined_at || 0)).slice(0, 8);

  const stats = [
    { icon: CalendarDays, label: t.plans, value: totalPlans },
    { icon: Users, label: t.members, value: community.member_count || members.length },
    { icon: BarChart2, label: t.active, value: plans.filter(p => p.status === 'happening' || p.status === 'upcoming').length },
  ];

  return (
    <div className="mx-4 mb-3">
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-white/8"
        style={{ background: `${tc}10` }}
      >
        <span className="text-white font-bold text-sm">{t.aboutCommunity}</span>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </motion.button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 rounded-b-2xl border border-t-0 border-white/8 space-y-4" style={{ background: `${tc}08` }}>
              {/* Description */}
              {community.description && (
                <p className="text-gray-300 text-sm leading-relaxed">{community.description}</p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                {stats.map((s, i) => (
                  <div key={i} className="rounded-xl p-3 text-center bg-white/5">
                    <s.icon className="w-4 h-4 mx-auto mb-1" style={{ color: tc }} />
                    <p className="text-white font-black text-lg leading-none">{s.value}</p>
                    <p className="text-gray-500 text-[10px] mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Policy */}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <MapPin className="w-3.5 h-3.5" style={{ color: tc }} />
                <span>{community.city}</span>
                <span className="mx-1">•</span>
                <span>{community.plan_creation_policy === 'admins_only' ? t.adminsCreatePlans : community.plan_creation_policy === 'approval_required' ? t.plansApproval : t.anyoneCreatePlans}</span>
              </div>

              {/* Members preview */}
              {recentMembers.length > 0 && (
                <div>
                  <p className="text-gray-400 text-xs mb-2 font-semibold">{t.members}</p>
                  <div className="flex flex-wrap gap-2">
                    {recentMembers.map(m => {
                      const profile = profilesMap[m.user_id];
                      if (!profile) return null;
                      return (
                        <motion.button
                          key={m.id}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => navigate(createPageUrl('UserProfile') + `?id=${m.user_id}`)}
                          className="flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-white/5 border border-white/8"
                        >
                          <div className="w-5 h-5 rounded-full overflow-hidden shrink-0">
                            {profile.photos?.[0]
                              ? <img src={profile.photos[0]} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-white" style={{ background: tc }}>{profile.display_name?.[0] || '?'}</div>}
                          </div>
                          <span className="text-white text-xs font-medium">{profile.display_name || t.user}</span>
                          {adminMembers.find(a => a.user_id === m.user_id) && (
                            <span className="text-[9px] px-1 rounded" style={{ background: `${tc}30`, color: tc }}>{t.admin}</span>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}