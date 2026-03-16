import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Settings, Plus, MessageCircle, Users, Image, Lock, Unlock, Loader2, X, Check, Trash2 } from 'lucide-react';
import PlanCard from '../components/feed/PlanCard';
import BottomNav from '../components/common/BottomNav';
import CommunityChat from '../components/community/CommunityChat';
import CommunityEditModal from '../components/community/CommunityEditModal';

export default function CommunityView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const communityId = urlParams.get('id');

  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('today'); // today | upcoming | stories | chat
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: community, isLoading: loadingCommunity } = useQuery({
    queryKey: ['community', communityId],
    queryFn: () => base44.entities.Community.filter({ id: communityId }).then(r => r[0]),
    enabled: !!communityId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['communityMembers', communityId],
    queryFn: () => base44.entities.CommunityMember.filter({ community_id: communityId }),
    enabled: !!communityId,
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['communityPlans', communityId],
    queryFn: () => base44.entities.PartyPlan.filter({ community_id: communityId }, '-date', 50),
    enabled: !!communityId,
  });

  const { data: allParticipants = [] } = useQuery({
    queryKey: ['allParticipants'],
    queryFn: () => base44.entities.PlanParticipant.list('-created_date', 200),
  });

  const { data: stories = [] } = useQuery({
    queryKey: ['communityStories', communityId],
    queryFn: async () => {
      const planIds = (await base44.entities.PartyPlan.filter({ community_id: communityId })).map(p => p.id);
      if (!planIds.length) return [];
      const all = await base44.entities.ExperienceStory.list('-created_date', 100);
      const now = new Date();
      return all.filter(s => planIds.includes(s.plan_id) && (s.expires_at ? new Date(s.expires_at) > now : (now - new Date(s.created_date)) < 24 * 3600 * 1000));
    },
    enabled: !!communityId,
  });

  const { data: userProfiles = [] } = useQuery({
    queryKey: ['userProfiles'],
    queryFn: () => base44.entities.UserProfile.list('-created_date', 100),
  });

  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['communityPlanRequests', communityId],
    queryFn: () => base44.entities.CommunityPlanRequest.filter({ community_id: communityId, status: 'pending' }),
    enabled: !!communityId,
  });

  const profilesMap = userProfiles.reduce((acc, p) => { acc[p.user_id] = p; return acc; }, {});

  const myMembership = members.find(m => m.user_id === currentUser?.id);
  const isAdmin = myMembership?.role === 'admin' || currentUser?.role === 'admin';
  const isMember = !!myMembership;

  const tc = community?.theme_color || '#00c6d2';

  const joinMutation = useMutation({
    mutationFn: () => base44.entities.CommunityMember.create({ community_id: communityId, user_id: currentUser.id, role: 'member', joined_at: new Date().toISOString() }),
    onSuccess: () => {
      base44.entities.Community.update(communityId, { member_count: (community?.member_count || 0) + 1 });
      queryClient.invalidateQueries(['communityMembers', communityId]);
      queryClient.invalidateQueries(['community', communityId]);
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => base44.entities.CommunityMember.delete(myMembership.id),
    onSuccess: () => {
      base44.entities.Community.update(communityId, { member_count: Math.max(0, (community?.member_count || 1) - 1) });
      queryClient.invalidateQueries(['communityMembers', communityId]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Schedule deletion in 24h, notify members
      const scheduledAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
      await base44.entities.Community.update(communityId, { deletion_scheduled_at: scheduledAt });
      // Notify all members
      for (const m of members) {
        if (m.user_id !== currentUser.id) {
          await base44.entities.Notification.create({
            user_id: m.user_id, type: 'plan_unsuccessful',
            title: `Community closing: ${community.name}`,
            message: `The community "${community.name}" will be deleted in 24 hours. 😢`,
          });
        }
      }
    },
    onSuccess: () => { setShowDeleteConfirm(false); navigate(-1); },
  });

  const approveRequest = useMutation({
    mutationFn: (req) => base44.entities.CommunityPlanRequest.update(req.id, { status: 'approved' }),
    onSuccess: () => queryClient.invalidateQueries(['communityPlanRequests', communityId]),
  });

  const rejectRequest = useMutation({
    mutationFn: (req) => base44.entities.CommunityPlanRequest.update(req.id, { status: 'rejected' }),
    onSuccess: () => queryClient.invalidateQueries(['communityPlanRequests', communityId]),
  });

  const now = new Date();
  const todayPlans = plans.filter(p => {
    if (!p.date) return false;
    const planDate = new Date(p.date);
    return planDate.toDateString() === now.toDateString();
  });
  const upcomingPlans = plans.filter(p => {
    if (!p.date) return false;
    const planDate = new Date(p.date);
    return planDate > now && planDate.toDateString() !== now.toDateString();
  });

  const canCreatePlan = () => {
    if (!isMember) return false;
    if (community?.plan_creation_policy === 'admins_only') return isAdmin;
    return true;
  };

  const handleCreatePlan = () => {
    navigate(createPageUrl('CreatePlan') + `?communityId=${communityId}`);
  };

  if (loadingCommunity) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#00c6d2' }} />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex flex-col items-center justify-center gap-4">
        <div className="text-5xl">😕</div>
        <p className="text-gray-400">Community not found</p>
        <button onClick={() => navigate(-1)} className="px-6 py-3 rounded-xl bg-gray-900 text-white">Go Back</button>
      </div>
    );
  }

  const TABS = [
    { key: 'today', label: "Today's Plans", emoji: '🔥' },
    { key: 'upcoming', label: 'Upcoming', emoji: '📅' },
    { key: 'stories', label: 'Stories', emoji: '📸' },
    { key: 'chat', label: 'Chat', emoji: '💬' },
  ];

  return (
    <div className="min-h-screen bg-[#0b0b0b] relative" style={{ paddingBottom: 'max(env(safe-area-inset-bottom,0px), 80px)' }}>
      {/* Background */}
      {community.background_image && (
        <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: `url(${community.background_image})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.08 }} />
      )}

      {/* Hero */}
      <div className="relative z-10">
        <div className="relative h-56 overflow-hidden">
          {community.cover_image
            ? <img src={community.cover_image} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-7xl" style={{ background: `linear-gradient(135deg, ${tc}44, #542b9b66)` }}>🏘️</div>}
          <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 30%, #0b0b0b 100%)` }} />

          {/* Back */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4" style={{ paddingTop: 'max(env(safe-area-inset-top,0px),16px)' }}>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 text-white" />
            </motion.button>
            {isAdmin && (
              <div className="flex gap-2">
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowEditModal(true)} className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </motion.button>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="px-5 -mt-8 relative z-10 pb-4">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-3">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-2xl font-black text-white">{community.name}</h1>
                <p className="text-gray-400 text-sm flex items-center gap-1 mt-0.5">
                  <span>📍</span>{community.city}
                  <span className="mx-1">•</span>
                  <Users className="w-3.5 h-3.5" />
                  <span>{community.member_count || members.length} members</span>
                </p>
              </div>
              {/* Join / Leave */}
              {!isMember ? (
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => joinMutation.mutate()}
                  disabled={joinMutation.isPending}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-[#0b0b0b]"
                  style={{ background: `linear-gradient(135deg, ${tc}, #542b9b)` }}>
                  {joinMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join 🚀'}
                </motion.button>
              ) : !isAdmin ? (
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => leaveMutation.mutate()}
                  className="px-4 py-2 rounded-xl text-sm text-gray-400 border border-gray-700">
                  Leave
                </motion.button>
              ) : null}
            </div>

            {community.description && <p className="text-gray-400 text-sm mt-2 leading-relaxed">{community.description}</p>}

            {/* Party type tags */}
            <div className="flex gap-1.5 flex-wrap mt-3">
              {community.party_types?.map((tag, i) => (
                <span key={i} className="px-2.5 py-1 rounded-full text-xs font-semibold text-[#0b0b0b]" style={{ background: tc }}>
                  {tag}
                </span>
              ))}
              {community.vibes?.slice(0, 3).map((v, i) => (
                <span key={i} className="px-2.5 py-1 rounded-full text-xs font-semibold text-white bg-white/10 border border-white/10">
                  {v}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Admin: pending plan requests */}
          {isAdmin && pendingRequests.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl p-4 mb-4 border" style={{ borderColor: `${tc}50`, background: `${tc}12` }}>
              <p className="font-bold text-white mb-3">⏳ Plan Requests ({pendingRequests.length})</p>
              {pendingRequests.map(req => {
                const planData = plans.find(p => p.id === req.plan_id);
                return (
                  <div key={req.id} className="flex items-center justify-between py-2 border-t border-white/5">
                    <p className="text-gray-300 text-sm truncate flex-1">{planData?.title || 'Unknown plan'}</p>
                    <div className="flex gap-2 ml-2">
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => approveRequest.mutate(req)} className="p-1.5 rounded-lg bg-green-500/20 text-green-400"><Check className="w-4 h-4" /></motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => rejectRequest.mutate(req)} className="p-1.5 rounded-lg bg-red-500/20 text-red-400"><X className="w-4 h-4" /></motion.button>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* Admin: delete */}
          {isAdmin && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 text-red-400 text-sm mb-4 px-3 py-2 rounded-xl border border-red-500/20 bg-red-500/5">
              <Trash2 className="w-4 h-4" /> Delete Community
            </motion.button>
          )}

          {/* Tab bar */}
          <div className="flex gap-1 bg-gray-900/80 rounded-2xl p-1 border border-gray-800">
            {TABS.map(tab => (
              <motion.button key={tab.key} whileTap={{ scale: 0.95 }} onClick={() => setActiveTab(tab.key)}
                className="relative flex-1 py-2 text-xs font-bold rounded-xl transition-all flex flex-col items-center gap-0.5"
                style={activeTab === tab.key ? { background: `${tc}30`, color: tc } : { color: '#6b7280' }}>
                {activeTab === tab.key && <motion.div layoutId="tab-bg" className="absolute inset-0 rounded-xl" style={{ background: `${tc}25` }} />}
                <span className="text-base relative z-10">{tab.emoji}</span>
                <span className="relative z-10 hidden sm:block">{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-4 mt-2">
          <AnimatePresence mode="wait">
            {activeTab === 'today' && (
              <motion.div key="today" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {canCreatePlan() && (
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreatePlan}
                    className="w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 mb-4 text-[#0b0b0b]"
                    style={{ background: `linear-gradient(135deg, ${tc}, #542b9b)` }}>
                    <Plus className="w-5 h-5" /> Create Plan for Today 🔥
                  </motion.button>
                )}
                {todayPlans.length === 0
                  ? <div className="text-center py-12"><div className="text-4xl mb-3">🌙</div><p className="text-gray-500">No plans today yet</p><p className="text-gray-600 text-sm">Be the first to create one! 🔥</p></div>
                  : <div className="grid gap-4">{todayPlans.map(plan => (
                    <PlanCard key={plan.id} plan={plan} participants={allParticipants.filter(p => p.plan_id === plan.id).map(p => profilesMap[p.user_id]).filter(Boolean)}
                      onClick={() => navigate(createPageUrl('PlanDetails') + `?id=${plan.id}`)} currentUserId={currentUser?.id} />
                  ))}</div>}
              </motion.div>
            )}

            {activeTab === 'upcoming' && (
              <motion.div key="upcoming" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {canCreatePlan() && (
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreatePlan}
                    className="w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 mb-4 text-[#0b0b0b]"
                    style={{ background: `linear-gradient(135deg, ${tc}, #542b9b)` }}>
                    <Plus className="w-5 h-5" /> Schedule a Plan 📅
                  </motion.button>
                )}
                {upcomingPlans.length === 0
                  ? <div className="text-center py-12"><div className="text-4xl mb-3">📅</div><p className="text-gray-500">No upcoming plans yet</p></div>
                  : <div className="grid gap-4">{upcomingPlans.map(plan => (
                    <PlanCard key={plan.id} plan={plan} participants={allParticipants.filter(p => p.plan_id === plan.id).map(p => profilesMap[p.user_id]).filter(Boolean)}
                      onClick={() => navigate(createPageUrl('PlanDetails') + `?id=${plan.id}`)} currentUserId={currentUser?.id} />
                  ))}</div>}
              </motion.div>
            )}

            {activeTab === 'stories' && (
              <motion.div key="stories" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {stories.length === 0
                  ? <div className="text-center py-12"><div className="text-4xl mb-3">📸</div><p className="text-gray-500">No stories yet</p><p className="text-gray-600 text-sm">Stories from plans will appear here 🎉</p></div>
                  : (
                    <div className="grid grid-cols-3 gap-1.5">
                      {stories.map(story => (
                        <motion.div key={story.id} whileTap={{ scale: 0.95 }} onClick={() => navigate(createPageUrl('StoryView') + `?id=${story.id}`)}
                          className="aspect-[9/16] rounded-xl overflow-hidden cursor-pointer relative">
                          {story.media_type === 'video'
                            ? <video src={story.media_url} className="w-full h-full object-cover" muted playsInline />
                            : <img src={story.media_url} alt="" className="w-full h-full object-cover" />}
                          <div className="absolute bottom-1 left-1"><div className="w-6 h-6 rounded-full overflow-hidden border border-white/30">
                            {profilesMap[story.user_id]?.photos?.[0]
                              ? <img src={profilesMap[story.user_id].photos[0]} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-[8px] text-white font-bold" style={{ background: tc }}>{profilesMap[story.user_id]?.display_name?.[0] || '?'}</div>}
                          </div></div>
                        </motion.div>
                      ))}
                    </div>
                  )}
              </motion.div>
            )}

            {activeTab === 'chat' && (
              <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <CommunityChat communityId={communityId} community={community} currentUser={currentUser} isMember={isMember} themeColor={tc} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="w-full max-w-lg bg-gray-900 rounded-t-3xl p-6 border-t border-red-500/30">
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">⚠️</div>
                <h3 className="text-xl font-black text-white">Delete Community?</h3>
                <p className="text-gray-400 text-sm mt-2">All members will be notified. The community will be deleted in <span className="text-red-400 font-bold">24 hours</span>.</p>
              </div>
              <div className="flex gap-3">
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-4 rounded-2xl bg-gray-800 text-white font-bold">Cancel</motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}
                  className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-bold flex items-center justify-center gap-2">
                  {deleteMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Trash2 className="w-5 h-5" />Delete</>}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showEditModal && (
        <CommunityEditModal community={community} onClose={() => setShowEditModal(false)}
          onSaved={() => { setShowEditModal(false); queryClient.invalidateQueries(['community', communityId]); }} />
      )}

      <BottomNav />
    </div>
  );
}