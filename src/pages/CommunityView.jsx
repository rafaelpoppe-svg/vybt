import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, X, Check, Trash2, CalendarDays, Camera, Users, Zap } from 'lucide-react';
import PlanCard from '../components/feed/PlanCard';
import CommunityEditModal from '../components/community/CommunityEditModal';
import StoryViewOverlay from '../components/story/StoryViewOverlay';
import InviteToCommunityModal from '../components/community/InviteToCommunityModal';
import CommunityHero from '../components/community/CommunityHero';
import CommunityAbout from '../components/community/CommunityAbout';
import CommunityStoriesGallery from '../components/community/CommunityStoriesGallery';
import CommunityMembersSpotlight from '../components/community/CommunityMembersSpotlight';
import CommunityActivityFeed from '../components/community/CommunityActivityFeed';
import CommunityNewMemberGuide from '../components/community/CommunityNewMemberGuide';
import CommunityChallengeBanner from '../components/community/CommunityChallengeBanner';
import CommunityCreateChallengeModal from '../components/community/CommunityCreateChallengeModal';
import CommunityChallengeDetail from '../components/community/CommunityChallengeDetail';
import LeaveCommunityModal from '../components/community/LeaveCommunityModal';

const TABS = [
  { key: 'plans', label: 'Plans', icon: <CalendarDays className="w-4 h-4" /> },
  { key: 'stories', label: 'Stories', icon: <Camera className="w-4 h-4" /> },
  { key: 'members', label: 'Members', icon: <Users className="w-4 h-4" /> },
  { key: 'activity', label: 'Activity', icon: <Zap className="w-4 h-4" /> },
];

export default function CommunityView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const communityId = urlParams.get('id');

  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('plans');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [overlayStoryId, setOverlayStoryId] = useState(null);
  const [showNewMemberGuide, setShowNewMemberGuide] = useState(false);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [showChallengeDetail, setShowChallengeDetail] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const scrollRef = useRef(null);
  const touchStartX = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
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
      const all = await base44.entities.ExperienceStory.list('-created_date', 200);
      return all.filter(s => planIds.includes(s.plan_id));
    },
    enabled: !!communityId,
  });

  // Live stories (last 24h) for the Stories tab active badge
  const liveStories = stories.filter(s => {
    const now = new Date();
    return s.expires_at ? new Date(s.expires_at) > now : (now - new Date(s.created_date)) < 24 * 3600 * 1000;
  });

  const { data: userProfiles = [] } = useQuery({
    queryKey: ['userProfiles'],
    queryFn: () => base44.entities.UserProfile.list('-created_date', 100),
  });

  const { data: activeChallenge } = useQuery({
    queryKey: ['communityChallenge', communityId],
    queryFn: async () => {
      const all = await base44.entities.CommunityChallenge.filter({ community_id: communityId, status: 'active' }, '-created_date', 1);
      return all[0] || null;
    },
    enabled: !!communityId,
  });

  const { data: myFriendships = [] } = useQuery({
    queryKey: ['myFriendships', currentUser?.id],
    queryFn: () => base44.entities.Friendship.filter({ user_id: currentUser?.id, status: 'accepted' }),
    enabled: !!currentUser?.id,
  });
  // Also fetch friendships where I am the friend_id
  const { data: friendshipsReceived = [] } = useQuery({
    queryKey: ['friendshipsReceived', currentUser?.id],
    queryFn: () => base44.entities.Friendship.filter({ friend_id: currentUser?.id, status: 'accepted' }),
    enabled: !!currentUser?.id,
  });

  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['communityPlanRequests', communityId],
    queryFn: () => base44.entities.CommunityPlanRequest.filter({ community_id: communityId, status: 'pending' }),
    enabled: !!communityId,
  });

  const profilesMap = userProfiles.reduce((acc, p) => { acc[p.user_id] = p; return acc; }, {});

  // All friend IDs (both directions), excluding already-members
  const memberIds = new Set(members.map(m => m.user_id));
  const friendIds = [
    ...myFriendships.map(f => f.friend_id),
    ...friendshipsReceived.map(f => f.user_id),
  ].filter((id, idx, arr) => arr.indexOf(id) === idx && !memberIds.has(id));

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
      // Show guide to new members
      const storageKey = `community_guide_${communityId}`;
      if (!localStorage.getItem(storageKey)) setShowNewMemberGuide(true);
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
  const upcomingPlans = plans.filter(p => p.date && new Date(p.date) >= new Date(now.toDateString())).sort((a, b) => new Date(a.date) - new Date(b.date));
  const pastPlans = plans.filter(p => p.date && new Date(p.date) < new Date(now.toDateString())).sort((a, b) => new Date(b.date) - new Date(a.date));

  // Group stories by plan
  const storiesByPlan = stories.reduce((acc, s) => {
    if (!acc[s.plan_id]) acc[s.plan_id] = [];
    acc[s.plan_id].push(s);
    return acc;
  }, {});

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
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom,0px), 24px)' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background texture */}
      {community.background_image && (
        <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: `url(${community.background_image})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.06 }} />
      )}

      <div className="relative z-10">
        {/* Hero */}
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
          onLeave={() => setShowLeaveModal(true)}
          onReport={() => {}}
        />

        {/* About (collapsible) */}
        <CommunityAbout
          community={community}
          members={members}
          plans={plans}
          profilesMap={profilesMap}
          tc={tc}
          currentUser={currentUser}
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

        {/* Tab Bar */}
        <div className="sticky top-0 z-30 bg-[#0b0b0b]/95 backdrop-blur-md border-b border-white/8 px-4 py-2">
          <div className="flex gap-1 bg-gray-900/80 rounded-2xl p-1 border border-gray-800">
            {TABS.map(tab => (
              <motion.button
                key={tab.key}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.key)}
                className="relative flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                style={activeTab === tab.key ? { background: `${tc}30`, color: tc } : { color: '#6b7280' }}
              >
                {activeTab === tab.key && (
                  <motion.div layoutId="cv-tab-bg" className="absolute inset-0 rounded-xl" style={{ background: `${tc}25` }} />
                )}
                <span className="relative z-10">{tab.icon}</span>
                <span className="relative z-10">{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-4 pt-4">
          <AnimatePresence mode="wait">

            {/* Plans Tab */}
            {activeTab === 'plans' && (
              <motion.div key="plans" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }} className="space-y-4">
                {/* Active Challenge Banner */}
                {activeChallenge && (
                  <CommunityChallengeBanner challenge={activeChallenge} tc={tc} onTap={() => setShowChallengeDetail(true)} />
                )}
                {upcomingPlans.length === 0 && pastPlans.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-5xl mb-3">🎉</div>
                    <p className="text-gray-400 font-semibold">No plans yet</p>
                    <p className="text-gray-600 text-sm mt-1">
                      {canCreatePlan() ? 'Create the first plan for this community!' : 'Plans will appear here once created.'}
                    </p>
                  </div>
                ) : (
                  <>
                    {upcomingPlans.length > 0 && (
                      <>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Upcoming & Today</p>
                        <div className="space-y-3">
                          {upcomingPlans.map(plan => (
                            <PlanCard key={plan.id} plan={plan}
                              participants={allParticipants.filter(p => p.plan_id === plan.id).map(p => profilesMap[p.user_id]).filter(Boolean)}
                              onClick={() => navigate(createPageUrl('PlanDetails') + `?id=${plan.id}`)}
                              currentUserId={currentUser?.id}
                              community={community} />
                          ))}
                        </div>
                      </>
                    )}
                    {pastPlans.length > 0 && (
                      <>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-2">Past Plans</p>
                        <div className="space-y-3 opacity-60">
                          {pastPlans.slice(0, 5).map(plan => (
                            <PlanCard key={plan.id} plan={plan}
                              participants={allParticipants.filter(p => p.plan_id === plan.id).map(p => profilesMap[p.user_id]).filter(Boolean)}
                              onClick={() => navigate(createPageUrl('PlanDetails') + `?id=${plan.id}`)}
                              currentUserId={currentUser?.id}
                              community={community} />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {/* Stories Tab */}
            {activeTab === 'stories' && (
              <motion.div key="stories" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
                {/* Active Challenge Banner */}
                {activeChallenge && (
                  <div className="mb-4">
                    <CommunityChallengeBanner challenge={activeChallenge} tc={tc} onTap={() => setShowChallengeDetail(true)} />
                  </div>
                )}
                {/* Live stories section */}
                {liveStories.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-green-400 text-xs font-bold uppercase tracking-wider">Live Now</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {liveStories.map(story => (
                        <motion.div key={story.id} whileTap={{ scale: 0.95 }} onClick={() => setOverlayStoryId(story.id)}
                          className="aspect-[9/16] rounded-xl overflow-hidden cursor-pointer relative">
                          {story.media_type === 'video'
                            ? <video src={story.media_url} className="w-full h-full object-cover" muted playsInline />
                            : <img src={story.media_url} alt="" className="w-full h-full object-cover" />}
                          <div className="absolute bottom-1.5 left-1.5">
                            <div className="w-6 h-6 rounded-full overflow-hidden border-2 border-green-400">
                              {profilesMap[story.user_id]?.photos?.[0]
                                ? <img src={profilesMap[story.user_id].photos[0]} alt="" className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center text-[8px] text-white font-bold" style={{ background: tc }}>{profilesMap[story.user_id]?.display_name?.[0] || '?'}</div>}
                            </div>
                          </div>
                          {story.is_highlighted && (
                            <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white" style={{ background: tc }}>⭐</div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All stories gallery */}
                <CommunityStoriesGallery
                  stories={stories}
                  plans={plans}
                  profilesMap={profilesMap}
                  tc={tc}
                  onStoryClick={setOverlayStoryId}
                />

                {stories.length === 0 && (
                  <div className="text-center py-20">
                    <div className="text-5xl mb-3">📸</div>
                    <p className="text-gray-400 font-semibold">No stories yet</p>
                    <p className="text-gray-600 text-sm mt-1">Members post stories from their plans</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <motion.div key="members" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
                <CommunityMembersSpotlight
                  members={members}
                  profilesMap={profilesMap}
                  plans={plans}
                  tc={tc}
                  currentUser={currentUser}
                />
              </motion.div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <motion.div key="activity" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
                {/* Active challenge or create button for admins */}
                {activeChallenge ? (
                  <div className="mb-4">
                    <CommunityChallengeBanner challenge={activeChallenge} tc={tc} onTap={() => setShowChallengeDetail(true)} />
                    {isAdmin && (
                      <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowCreateChallenge(true)}
                        className="w-full mt-2 py-2.5 rounded-xl text-xs font-bold border border-white/10 text-gray-400">
                        Replace with new challenge
                      </motion.button>
                    )}
                  </div>
                ) : isAdmin && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowCreateChallenge(true)}
                    className="w-full mb-4 py-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm border"
                    style={{ background: `${tc}15`, borderColor: `${tc}40`, color: tc }}
                  >
                    🏆 Launch a Story Challenge
                  </motion.button>
                )}
                <CommunityActivityFeed
                  community={community}
                  members={members}
                  plans={plans}
                  stories={stories}
                  profilesMap={profilesMap}
                  tc={tc}
                  isAdmin={isAdmin}
                  currentUser={currentUser}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* FAB — Create Plan */}
      {canCreatePlan() && activeTab === 'plans' && (
        <motion.button
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.05 }}
          onClick={handleCreatePlan}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="fixed bottom-8 right-5 z-40 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center"
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
        {showChallengeDetail && activeChallenge && (
          <CommunityChallengeDetail
            challenge={activeChallenge}
            communityId={communityId}
            profilesMap={profilesMap}
            isAdmin={isAdmin}
            currentUser={currentUser}
            tc={tc}
            onClose={() => setShowChallengeDetail(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNewMemberGuide && (
          <CommunityNewMemberGuide
            communityId={communityId}
            onClose={() => setShowNewMemberGuide(false)}
          />
        )}
      </AnimatePresence>

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

      <LeaveCommunityModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onConfirm={() => {
          setShowLeaveModal(false);
          leaveMutation.mutate();
        }}
        communityName={community.name}
        isLoading={leaveMutation.isPending}
      />
    </div>
  );
}