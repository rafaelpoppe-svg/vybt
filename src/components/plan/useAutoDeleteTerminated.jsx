import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook that checks for terminated plans older than 24h and deletes them.
 * Call this once per session in a top-level component (e.g. Home or Chat).
 */
export default function useAutoDeleteTerminated(plans = []) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!plans.length) return;

    const now = new Date();
    const terminated = plans.filter(p => {
      if (p.status !== 'terminated' || !p.terminated_at) return false;
      const diff = now - new Date(p.terminated_at);
      return diff >= 24 * 60 * 60 * 1000; // 24 hours
    });

    if (!terminated.length) return;

    (async () => {
      for (const plan of terminated) {
        // Delete participants, messages, then plan
        const [participants, messages] = await Promise.all([
          base44.entities.PlanParticipant.filter({ plan_id: plan.id }),
          base44.entities.ChatMessage.filter({ plan_id: plan.id, message_type: 'group' }),
        ]);
        await Promise.all([
          ...participants.map(p => base44.entities.PlanParticipant.delete(p.id)),
          ...messages.map(m => base44.entities.ChatMessage.delete(m.id)),
        ]);
        await base44.entities.PartyPlan.delete(plan.id);
      }
      queryClient.invalidateQueries(['allPlans']);
    })();
  }, [plans, queryClient]);
}