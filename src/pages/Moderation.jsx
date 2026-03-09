import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Shield, AlertTriangle, Check, X, Loader2, Trash2, User, Flag, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STATUS_COLORS = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  reviewed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const TYPE_LABELS = {
  user: 'Utilizador',
  plan: 'Plano',
  story: 'História',
};

export default function Moderation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        if (user.role !== 'admin') navigate(createPageUrl('Home'));
      } catch (e) {
        navigate(createPageUrl('Home'));
      }
    };
    getUser();
  }, []);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => base44.entities.Report.list('-created_date', 100),
  });

  const { data: userProfiles = [] } = useQuery({
    queryKey: ['userProfilesModeration'],
    queryFn: () => base44.entities.UserProfile.list('-created_date', 200),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['allPlansModeration'],
    queryFn: () => base44.entities.PartyPlan.list('-created_date', 100),
  });

  const profilesMap = userProfiles.reduce((acc, p) => { acc[p.user_id] = p; return acc; }, {});
  const plansMap = plans.reduce((acc, p) => { acc[p.id] = p; return acc; }, {});

  const filteredReports = reports.filter(r => r.status === activeTab);
  const pendingCount = reports.filter(r => r.status === 'pending').length;

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Report.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['reports']);
      setSelectedReport(null);
      toast.success('Denúncia atualizada');
    }
  });

  const deleteContentMutation = useMutation({
    mutationFn: async ({ report }) => {
      if (report.type === 'plan' && report.reported_plan_id) {
        await base44.entities.PartyPlan.delete(report.reported_plan_id);
      } else if (report.type === 'story' && report.reported_plan_id) {
        // reported_plan_id used as story_id for stories
        await base44.entities.ExperienceStory.delete(report.reported_plan_id);
      }
      await base44.entities.Report.update(report.id, { status: 'resolved' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reports']);
      queryClient.invalidateQueries(['allPlans']);
      setSelectedReport(null);
      toast.success('Conteúdo removido e denúncia resolvida');
    }
  });

  const blockUserMutation = useMutation({
    mutationFn: async (report) => {
      // Block the reported user from the platform (admin action: mark as resolved + note)
      await base44.entities.Report.update(report.id, { status: 'resolved' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reports']);
      setSelectedReport(null);
      toast.success('Ação aplicada');
    }
  });

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00c6d2] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0b] pb-10">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0b0b0b]/95 backdrop-blur-lg border-b border-gray-800 px-4 py-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-gray-900">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#00c6d2]" />
            <h1 className="text-xl font-bold text-white">Moderação</h1>
          </div>
          {pendingCount > 0 && (
            <span className="ml-auto px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30">
              {pendingCount} pendentes
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {['pending', 'reviewed', 'resolved'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === tab ? 'bg-[#00c6d2] text-[#0b0b0b]' : 'bg-gray-900 text-gray-400'
              }`}
            >
              {tab === 'pending' ? 'Pendentes' : tab === 'reviewed' ? 'Em análise' : 'Resolvidas'}
              {tab === 'pending' && pendingCount > 0 && ` (${pendingCount})`}
            </button>
          ))}
        </div>
      </header>

      {/* Reports list */}
      <main className="p-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#00c6d2] animate-spin" />
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-16">
            <Flag className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma denúncia {activeTab === 'pending' ? 'pendente' : activeTab === 'reviewed' ? 'em análise' : 'resolvida'}</p>
          </div>
        ) : (
          filteredReports.map((report) => {
            const reporter = profilesMap[report.reporter_user_id];
            const reported = profilesMap[report.reported_user_id];
            const reportedPlan = report.reported_plan_id ? plansMap[report.reported_plan_id] : null;

            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3"
              >
                {/* Type + Status */}
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                    report.type === 'user' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                    report.type === 'story' ? 'bg-pink-500/20 text-pink-400 border-pink-500/30' :
                    'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  }`}>
                    {TYPE_LABELS[report.type] || report.type}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[report.status]}`}>
                    {report.status === 'pending' ? 'Pendente' : report.status === 'reviewed' ? 'Em análise' : 'Resolvida'}
                  </span>
                </div>

                {/* Reason */}
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-white text-sm font-medium">{report.reason}</p>
                </div>

                {/* Details */}
                {report.details && (
                  <p className="text-gray-400 text-xs bg-gray-800 rounded-xl p-3">{report.details}</p>
                )}

                {/* Reported content */}
                {reportedPlan && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-800">
                    <Eye className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300 text-sm truncate">{reportedPlan.title}</span>
                    <button
                      onClick={() => navigate(createPageUrl('PlanDetails') + `?id=${reportedPlan.id}`)}
                      className="ml-auto text-[#00c6d2] text-xs"
                    >
                      Ver
                    </button>
                  </div>
                )}

                {/* Reporter & Reported */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>Por: <span className="text-gray-300">{reporter?.display_name || 'Desconhecido'}</span></span>
                  </div>
                  {reported && (
                    <span>Sobre: <span className="text-gray-300">{reported.display_name}</span></span>
                  )}
                  <span>{format(new Date(report.created_date), 'dd/MM HH:mm')}</span>
                </div>

                {/* Actions */}
                {report.status === 'pending' && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      onClick={() => updateStatusMutation.mutate({ id: report.id, status: 'reviewed' })}
                      disabled={updateStatusMutation.isPending}
                      size="sm"
                      className="flex-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-600/30"
                      variant="outline"
                    >
                      Analisar
                    </Button>
                    <Button
                      onClick={() => updateStatusMutation.mutate({ id: report.id, status: 'resolved' })}
                      disabled={updateStatusMutation.isPending}
                      size="sm"
                      className="flex-1 bg-green-600/20 hover:bg-green-600/40 text-green-400 border border-green-600/30"
                      variant="outline"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Dispensar
                    </Button>
                    {(report.type === 'plan' || report.type === 'story') && report.reported_plan_id && (
                      <Button
                        onClick={() => deleteContentMutation.mutate({ report })}
                        disabled={deleteContentMutation.isPending}
                        size="sm"
                        className="flex-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30"
                        variant="outline"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Remover
                      </Button>
                    )}
                  </div>
                )}

                {report.status === 'reviewed' && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      onClick={() => updateStatusMutation.mutate({ id: report.id, status: 'resolved' })}
                      disabled={updateStatusMutation.isPending}
                      size="sm"
                      className="flex-1 bg-green-600/20 hover:bg-green-600/40 text-green-400 border border-green-600/30"
                      variant="outline"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Marcar como Resolvida
                    </Button>
                    {(report.type === 'plan' || report.type === 'story') && report.reported_plan_id && (
                      <Button
                        onClick={() => deleteContentMutation.mutate({ report })}
                        disabled={deleteContentMutation.isPending}
                        size="sm"
                        className="flex-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30"
                        variant="outline"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Remover Conteúdo
                      </Button>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </main>
    </div>
  );
}