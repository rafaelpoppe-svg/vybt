import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Video } from 'lucide-react';

const STORY_BORDER_COLORS = [
  ['#f43f5e', '#fb7185'],
  ['#a855f7', '#c084fc'],
  ['#3b82f6', '#60a5fa'],
  ['#f97316', '#fb923c'],
  ['#ec4899', '#f472b6'],
  ['#06b6d4', '#22d3ee'],
  ['#eab308', '#fbbf24'],
  ['#10b981', '#34d399'],
  ['#6366f1', '#818cf8'],
  ['#ef4444', '#f87171'],
];

function getColorsForId(id) {
  if (!id) return STORY_BORDER_COLORS[0];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return STORY_BORDER_COLORS[Math.abs(hash) % STORY_BORDER_COLORS.length];
}

// Círculo "Adicionar story"
function AddCircle({ happeningPlan, onClick }) {
  const isHappening = !!happeningPlan;
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 flex-shrink-0"
    >
      <div className="relative">
        {isHappening && (
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{ boxShadow: ['0 0 0 0px #00d4ff88', '0 0 0 8px #00d4ff00'] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'easeOut' }}
          />
        )}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: isHappening ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.08)',
            border: isHappening ? '2.5px solid #00d4ff' : '2.5px dashed rgba(255,255,255,0.6)',
          }}
        >
          {isHappening ? <Video className="w-6 h-6 text-[#00d4ff]" /> : <Plus className="w-6 h-6 text-white" />}
        </div>
      </div>
      <span className="text-[10px] text-gray-400 max-w-[64px] text-center leading-tight truncate">
        {isHappening ? '🔵 Live' : 'Add'}
      </span>
    </motion.button>
  );
}

function isPlanLiveNow(plan) {
  if (['ended', 'terminated', 'voting'].includes(plan.status)) return false;
  if (!plan.date || !plan.time) return false;
  const now = new Date();
  const start = new Date(`${plan.date}T${plan.time}:00`);
  const end = plan.end_time
    ? new Date(`${plan.date}T${plan.end_time}:00`)
    : new Date(start.getTime() + 8 * 60 * 60 * 1000);
  return now >= start && now <= end;
}

// Círculo de um PLANO (agrupa stories dos membros)
function PlanCircle({ plan, onClick, index }) {
  const colors = getColorsForId(plan.id);
  const planImage = plan.group_image || plan.cover_image;
  const themeColor = plan.theme_color || colors[0];
  const isHappening = isPlanLiveNow(plan);

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 280, damping: 22 }}
      className="flex flex-col items-center gap-1.5 flex-shrink-0"
    >
      <div className="relative">
        {isHappening && (
          <motion.div
            className="absolute inset-0 rounded-full z-0"
            animate={{ boxShadow: [`0 0 0 0px ${themeColor}88`, `0 0 0 6px ${themeColor}00`] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeOut' }}
          />
        )}
        <div
          className="w-16 h-16 rounded-full p-[2.5px] relative z-10"
          style={{
            background: `linear-gradient(135deg, ${themeColor}, ${themeColor}88)`,
            boxShadow: `0 0 12px ${themeColor}55`,
          }}
        >
          <div className="w-full h-full rounded-full bg-[#0b0b0b] p-[2px] overflow-hidden relative">
            {planImage ? (
              <img src={planImage} alt={plan.title} className="w-full h-full rounded-full object-cover" />
            ) : (
              <div
                className="w-full h-full rounded-full flex items-center justify-center text-xl"
                style={{ background: `${themeColor}33` }}
              >
                🎉
              </div>
            )}

          </div>
        </div>
        {/* Badge de "live" — fora da imagem */}
        {isHappening && (
          <div className="absolute -bottom-0.5 -right-0.5 bg-red-500 rounded-full w-4 h-4 flex items-center justify-center border-2 border-[#0b0b0b] z-20">
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
          </div>
        )}
      </div>
      <span className="text-[10px] text-gray-300 max-w-[64px] text-center leading-tight truncate">
        {plan.title}
      </span>
    </motion.button>
  );
}

// Círculo do utilizador (stories próprios)
function UserCircle({ story, user, isOwn, onClick }) {
  const colors = isOwn ? ['#00c6d2', '#542b9b'] : getColorsForId(story?.user_id);
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 flex-shrink-0"
    >
      <div
        className="w-16 h-16 rounded-full p-[2.5px]"
        style={{
          background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
          boxShadow: `0 0 12px ${colors[0]}55`,
        }}
      >
        <div className="w-full h-full rounded-full bg-[#0b0b0b] p-[2px] overflow-hidden relative">
          {user?.photos?.[0] ? (
            <img src={user.photos[0]} alt={user?.display_name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <div
              className="w-full h-full rounded-full flex items-center justify-center"
              style={{ background: `${colors[0]}33` }}
            >
              <span className="text-white font-bold text-lg">{user?.display_name?.[0] || '?'}</span>
            </div>
          )}
        </div>
      </div>
      <span className="text-[10px] text-gray-300 truncate leading-tight max-w-[64px] text-center">
        {isOwn ? 'You' : (user?.display_name || 'User')}
      </span>
    </motion.button>
  );
}

export default function HomeStoriesBar({
  // REMOVER stories = [],
  ownStories = [],
  friendStories = [],
  planStories = [],
  userProfiles = {},
  plans = [],
  onStoryClick,
  onPlanStoriesClick,
  onAddStory,
  currentUserId,
  happeningPlan = null,
}) {
  // Agrupar stories por plano REMOVER SE DER CERTO
  /*const planGroups = useMemo(() => {
    const byPlan = {};
    stories.forEach(s => {
      if (!s.plan_id) return;
      if (!byPlan[s.plan_id]) byPlan[s.plan_id] = [];
      byPlan[s.plan_id].push(s);
    });

    return Object.entries(byPlan)
      .map(([planId, planStories]) => {
        const plan = plans.find(p => p.id === planId);
        if (!plan) return null;
        const preview = planStories.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
        return { plan, stories: planStories, preview };
      })
      .filter(Boolean)
      .sort((a, b) => {
        // Live now primeiro
        const aLive = isPlanLiveNow(a.plan);
        const bLive = isPlanLiveNow(b.plan);
        if (aLive && !bLive) return -1;
        if (bLive && !aLive) return 1;
        return b.stories.length - a.stories.length;
      });
  }, [stories, plans]);*/

  const planGroups = useMemo(() => {
    const byPlan = {};
    planStories.forEach(s => {
      if (!byPlan[s.plan_id]) byPlan[s.plan_id] = [];
      byPlan[s.plan_id].push(s);
    });
    return Object.entries(byPlan)
      .map(([planId, ps]) => {
        const plan = plans.find(p => p.id === planId);
        if (!plan) return null;
        const preview = ps.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
        return { plan, stories: ps, preview };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (a.plan.status === 'happening' && b.plan.status !== 'happening') return -1;
        if (b.plan.status === 'happening' && a.plan.status !== 'happening') return 1;
        return b.stories.length - a.stories.length;
      });
  }, [planStories, plans]);

  // Stories próprios agrupados num único círculo (mais recente como preview) REMOVER SE DER CERTO
  /*const ownStories = stories
    .filter(s => s.user_id === currentUserId)
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));*/

  // Stories de amigos agrupados por utilizador (1 círculo por amigo)REMOVER SE DER CERTO
  /*const friendStoryGroups = useMemo(() => {
    const byUser = {};
    stories.forEach(s => {
      if (s.user_id === currentUserId) return; // próprios já tratados
      if (!friendUserIds || !friendUserIds.includes(s.user_id)) return; // só amigos
      if (!byUser[s.user_id]) byUser[s.user_id] = [];
      byUser[s.user_id].push(s);
    });
    return Object.entries(byUser).map(([userId, userStories]) => ({
      userId,
      stories: userStories.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)),
    }));
  }, [stories, currentUserId, friendUserIds]);*/

  const friendStoryGroups = useMemo(() => {
    const byUser = {};
    friendStories.forEach(s => {
      if (!byUser[s.user_id]) byUser[s.user_id] = [];
      byUser[s.user_id].push(s);
    });
    return Object.entries(byUser).map(([userId, userStories]) => ({
      userId,
      stories: userStories.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)),
    }));
  }, [friendStories]);

  // Total de stories para o contador REMOVER SE DER CERTO
  //const totalCount = planGroups.reduce((sum, g) => sum + g.stories.length, ownStories.length);
  const totalCount = ownStories.length + friendStories.length + planStories.length;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-white font-bold text-base tracking-wide">✨ Experiences</h2>
        <span className="text-gray-500 text-xs">{totalCount} stories</span>
      </div>

      <div className="flex gap-4 px-4 overflow-x-auto scrollbar-hide pb-1" data-hscroll="true">
        {/* Adicionar story */}
        <AddCircle happeningPlan={happeningPlan} onClick={onAddStory} />

        {/* Stories próprios — 1 único círculo */}
        {ownStories.length > 0 && (
          <UserCircle
            story={ownStories[0]}
            user={userProfiles[currentUserId]}
            isOwn
            onClick={() => onStoryClick(ownStories[0])}
          />
        )}

        {/* Stories de amigos — 1 círculo por amigo */}
        {friendStoryGroups.map(({ userId, stories: us }) => (
          <UserCircle
            key={userId}
            story={us[0]}
            user={userProfiles[userId]}
            onClick={() => onStoryClick(us[0])}
          />
        ))}

        {/* Planos com stories */}
        {planGroups.map(({ plan, stories: ps, preview }, idx) => (
          <PlanCircle
            key={plan.id}
            plan={plan}
            index={idx}
            onClick={() => onPlanStoriesClick(plan, ps)}
          />
        ))}
      </div>
    </div>
  );
}