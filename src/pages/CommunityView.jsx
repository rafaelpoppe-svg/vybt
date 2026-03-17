import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, X, Check, Trash2 } from 'lucide-react';
import PlanCard from '../components/feed/PlanCard';
import CommunityChat from '../components/community/CommunityChat';
import CommunityEditModal from '../components/community/CommunityEditModal';
import StoryViewOverlay from '../components/story/StoryViewOverlay';
import InviteToCommunityModal from '../components/community/InviteToCommunityModal';
import CommunityHero from '../components/community/CommunityHero';
import CommunityAbout from '../components/community/CommunityAbout';
import CommunityActivityFeed from '../components/community/CommunityActivityFeed';

const TABS = [
  { key: 'today', label: "Today", emoji: '🔥' },
  { key: 'upcoming', label: 'Upcoming', emoji: '📅' },
  { key: 'stories', label: 'Stories', emoji: '📸' },
  { key: 'chat', label: 'Chat', emoji: '💬' },
];

export default function CommunityView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const communityId = urlParams.get('id');

  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('today');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [overlayStoryId, setOverlayStoryId] = useState(null);
  const [tabsSticky, setTabsSticky] = useState(false);

  const scrollRef = useRef(null);
  const tabBarRef = useRef(null);
  const heroRef = useRef(null);
  const touchStartX = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  // Sticky tabs on scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => {
      const heroH = heroRef.current?.offsetHeight || 280;
      setTabsSticky(el.scrollTop > heroH - 60);
    };
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  // Swipe gesture between tabs
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) < 50) return;
    const idx = TABS.findIndex(t => t.key === activeTab);
    if (dx < 0 && idx < TABS.length - 1) setActiveTab(TABS[idx + 1].key);
    if (dx > 0 && idx > 0) setActiveTab(TABS[idx - 1].key);
    touchStartX.current = null;
  };

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

  const { data: friendships = [] } = useQuery({
    queryKey: ['myFriendshipsCommunity', currentUser?.id],
    queryFn: () => base44.entities.Friendship.filter({ user_id: currentUser?.id, status: 'accepted' }),
    enabled: !!currentUser?.id,
  });

  const { data: reverseFriendships = [] } = useQuery({
    queryKey: ['myReverseFriendshipsCommunity', currentUser?.id],
    queryFn: () => base44.entities.Friendship.filter({ friend_id: currentUser?.id, status: 'accepted' }),
    enabled: !!currentUser?.id,
  });

  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['communityPlanRequests', communityId],
    queryFn: () => base44.entities.CommunityPlanRequest.filter({ community_id: communityId, status: 'pending' }),
    enabled: !!communityId,
  });

  const profilesMap = userProfiles.reduce((acc, p) => { acc[p.user_id] = p; return acc; }, {});
  const friendIds = [...friendships.map(f => f.friend_id), ...reverseFriendships.map(f => f.user_id)];

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
      const scheduledAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
      await base44.entities.Community.update(communityId, { deletion_scheduled_at: scheduledAt });
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
  const todayPlans = plans.filter(p => p.date && new Date(p.date).toDateString() === now.toDateString());
  const upcomingPlans = plans.filter(p => p.date && new Date(p.date) > now && new Date(p.date).toDateString() !== now.toDateString());

  const canCreatePlan = () => {
    if (!isMember) return false;
    if (community?.plan_creation_policy === 'admins_only') return isAdmin;
    return true;
  };

  const handleCreatePlan = () => navigate(createPageUrl('CreatePlan') + `?communityId=${communityId}`);

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

  return (
    <div
      ref={scrollRef}
      data-scroll-root
      className="min-h-screen bg-[#0b0b0b] overflow-y-auto overflow-x-hidden relative"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom,0px), 100px)' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background texture */}
      {community.background_image && (
        <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: `url(${community.background_image})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.06 }} />
      )}

      <div className="relative z-10">
        {/* Hero */}
        <div ref={heroRef}>
          <CommunityHero
            community={community}
            isMember={isMember}
            isAdmin={isAdmin}
            tc={tc}
            joinMutation={joinMutation}
            leaveMutation={leaveMutation}
            onBack={() => navigate(-1)}
            onEdit={() => setShowEditModal(true)}
            onInvite={() => setShowInviteModal(true)}
            onReport={() => {/* TODO */}}
          />
        </div>

        {/* About / Stats (expandable) */}
        <CommunityAbout
          community={community}
          members={members}
          plans={plans}
          profilesMap={profilesMap}
          tc={tc}
          currentUser={currentUser}
        />

        {/* Activity Feed */}
        <CommunityActivityFeed
          plans={plans}
          members={members}
          profilesMap={profilesMap}
          tc={tc}
        />

        {/* Admin: pending plan requests */}
        {isAdmin && pendingRequests.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl p-4 mx-4 mb-3 border" style={{ borderColor: `${tc}50`, background: `${tc}12` }}>
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

        {/* Sticky Tab Bar */}
        <div
          ref={tabBarRef}
          className="transition-all duration-200 z-30"
          style={tabsSticky ? {
            position: 'sticky',
            top: 0,
            background: 'rgba(11,11,11,0.95)',
            backdropFilter: 'blur(16px)',
            borderBottom: `1px solid ${tc}30`,
            paddingTop: 'max(env(safe-area-inset-top,0px),0px)',
          } : {}}
        >
          <div className="flex gap-1 bg-gray-900/80 rounded-2xl p-1 border border-gray-800 mx-4 my-2">
            {TABS.map(tab => (
              <motion.button
                key={tab.key}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.key)}
                className="relative flex-1 py-2 text-xs font-bold rounded-xl transition-all flex flex-col items-center gap-0.5"
                style={activeTab === tab.key ? { background: `${tc}30`, color: tc } : { color: '#6b7280' }}
              >
                {activeTab === tab.key && (
                  <motion.div layoutId="tab-bg" className="absolute inset-0 rounded-xl" style={{ background: `${tc}25` }} />
                )}
                <span className="text-base relative z-10">{tab.emoji}</span>
                <span className="relative z-10 text-[10px]">{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-4 mt-1">
          <AnimatePresence mode="wait">
            {activeTab === 'today' && (
              <motion.div key="today" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                {todayPlans.length === 0
                  ? <div className="text-center py-16"><div className="text-5xl mb-3">🌙</div><p className="text-gray-500">No plans today yet</p><p className="text-gray-600 text-sm mt-1">Be the first to create one! 🔥</p></div>
                  : <div className="grid gap-4">{todayPlans.map(plan => (
                    <PlanCard key={plan.id} plan={plan}
                      participants={allParticipants.filter(p => p.plan_id === plan.id).map(p => profilesMap[p.user_id]).filter(Boolean)}
                      onClick={() => navigate(createPageUrl('PlanDetails') + `?id=${plan.id}`)} currentUserId={currentUser?.id} />
                  ))}</div>}
              </motion.div>
            )}

            {activeTab === 'upcoming' && (
              <motion.div key="upcoming" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                {upcomingPlans.length === 0
                  ? <div className="text-center py-16"><div className="text-5xl mb-3">📅</div><p className="text-gray-500">No upcoming plans yet</p></div>
                  : <div className="grid gap-4">{upcomingPlans.map(plan => (
                    <PlanCard key={plan.id} plan={plan}
                      participants={allParticipants.filter(p => p.plan_id === plan.id).map(p => profilesMap[p.user_id]).filter(Boolean)}
                      onClick={() => navigate(createPageUrl('PlanDetails') + `?id=${plan.id}`)} currentUserId={currentUser?.id} />
                  ))}</div>}
              </motion.div>
            )}

            {activeTab === 'stories' && (
              <motion.div key="stories" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                {stories.length === 0
                  ? <div className="text-center py-16"><div className="text-5xl mb-3">📸</div><p className="text-gray-500">No stories yet</p><p className="text-gray-600 text-sm mt-1">Stories from plans will appear here 🎉</p></div>
                  : (
                    <div className="grid grid-cols-3 gap-1.5">
                      {stories.map(story => (
                        <motion.div key={story.id} whileTap={{ scale: 0.95 }} onClick={() => setOverlayStoryId(story.id)}
                          className="aspect-[9/16] rounded-xl overflow-hidden cursor-pointer relative">
                          {story.media_type === 'video'
                            ? <video src={story.media_url} className="w-full h-full object-cover" muted playsInline />
                            : <img src={story.media_url} alt="" className="w-full h-full object-cover" />}
                          <div className="absolute bottom-1 left-1">
                            <div className="w-6 h-6 rounded-full overflow-hidden border border-white/30">
                              {profilesMap[story.user_id]?.photos?.[0]
                                ? <img src={profilesMap[story.user_id].photos[0]} alt="" className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center text-[8px] text-white font-bold" style={{ background: tc }}>{profilesMap[story.user_id]?.display_name?.[0] || '?'}</div>}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
              </motion.div>
            )}

            {activeTab === 'chat' && (
              <motion.div key="chat" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <CommunityChat communityId={communityId} community={community} currentUser={currentUser} isMember={isMember} themeColor={tc} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* FAB — Create Plan */}
      {canCreatePlan() && activeTab !== 'chat' && (
        <motion.button
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.05 }}
          onClick={handleCreatePlan}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${tc}, #542b9b)`, boxShadow: `0 4px 24px ${tc}60` }}
        >
          <Plus className="w-6 h-6 text-white" />
        </motion.button>
      )}

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
          onSaved={() => { setShowEditModal(false); queryClient.invalidateQueries(['community', communityId]); }}
          onDelete={() => setShowDeleteConfirm(true)} />
      )}

      <StoryViewOverlay storyId={overlayStoryId} onClose={() => setOverlayStoryId(null)} />

      <AnimatePresence>
        {showInviteModal && (
          <InviteToCommunityModal
            community={community}
            friends={friendIds}
            profilesMap={profilesMap}
            currentUser={currentUser}
            onClose={() => setShowInviteModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}