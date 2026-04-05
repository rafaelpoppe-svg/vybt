import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Pin, UserMinus, UserPlus, Share2, MoreVertical, 
  MessageSquare, Camera, Check, Loader2, Edit, Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '../common/LanguageContext';

export default function GroupAdminActions({
  onEditPlan,
  isOpen,
  onClose,
  participants = [],
  profilesMap = {},
  stories = [],
  messages = [],
  pinnedStories = [],
  pinnedMessages = [],
  onPinStory,
  onUnpinStory,
  onPinMessage,
  onUnpinMessage,
  onRemoveMember,
  onInviteUser,
  friends = [],
  currentUserId,
  isAdmin,
  planStatus,
  joinRequests = [],
  onApproveRequest,
  onDeclineRequest,
  isPrivate = false,
}) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('stories');
  const [sentInvites, setSentInvites] = useState({});

  if (!isOpen || !isAdmin) return null;

  const handleInviteFriend = async (friendId) => {
    if (sentInvites[friendId]) return;
    setSentInvites(prev => ({ ...prev, [friendId]: 'sending' }));
    await onInviteUser(friendId);
    setSentInvites(prev => ({ ...prev, [friendId]: 'sent' }));
  };

  // Friends not yet in the plan
  const participantIds = new Set(participants.map(p => p.user_id));
  const eligibleFriends = friends.filter(f => !participantIds.has(f.user_id));

  return (
    <AnimatePresence>
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
          className="w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 max-h-[85vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">{t.adminActions}</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-800">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Edit Plan Button */}
          {onEditPlan && (
            <div className="p-3 border-b border-gray-800">
              {(planStatus === 'voting' || planStatus === 'ended') ? (
                <div className="w-full py-3 px-4 rounded-xl bg-gray-800 border border-gray-700 text-center">
                  <p className="text-gray-400 text-sm font-medium flex items-center justify-center gap-2">
                    <Edit className="w-4 h-4 text-gray-600" />
                    {t.editPlan}
                  </p>
                  <p className="text-gray-600 text-xs mt-1">
                    {planStatus === 'voting'
                      ? t.editPlanUnavailableVoting
                      : t.editPlanUnavailableEnded}
                  </p>
                </div>
              ) : (
                <Button
                  onClick={onEditPlan}
                  className="w-full bg-[#542b9b] hover:bg-[#542b9b]/80 text-white"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {t.editPlan}
                </Button>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-gray-800 overflow-x-auto scrollbar-hide">
            {[
              { id: 'stories', label: 'Stories', icon: Camera },
              { id: 'messages', label: t.messages, icon: MessageSquare },
              { id: 'members', label: t.members, icon: UserMinus },
              ...(isPrivate ? [{ id: 'requests', label: `${t.requests}${joinRequests.length > 0 ? ` (${joinRequests.length})` : ''}`, icon: UserPlus }] : []),
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-1.5 ${
                  activeTab === tab.id 
                    ? 'text-[#00c6d2] border-b-2 border-[#00c6d2]' 
                    : 'text-gray-400'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4 max-h-96 overflow-y-auto">
            {/* Pin Stories Tab */}
            {activeTab === 'stories' && (
              <div className="space-y-2">
                {stories.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">{t.noStoriesToPin}</p>
                ) : (
                  stories.map(story => {
                    const user = profilesMap[story.user_id];
                    const isPinned = pinnedStories.includes(story.id);
                    return (
                      <div key={story.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-800">
                        <div className="w-12 h-16 rounded-lg overflow-hidden bg-gray-700">
                          <img src={story.media_url} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">{user?.display_name || t.user}</p>
                          <p className="text-gray-500 text-xs">
                            {isPinned ? t.pinned : t.notPinned}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant={isPinned ? 'outline' : 'default'}
                          onClick={() => isPinned ? onUnpinStory(story.id) : onPinStory(story.id)}
                          className={isPinned ? 'border-gray-700' : 'bg-[#00c6d2] text-[#0b0b0b]'}
                        >
                          <Pin className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Pin Messages Tab */}
            {activeTab === 'messages' && (
              <div className="space-y-2">
                {messages.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">{t.noMessagesToPin}</p>
                ) : (
                  messages.slice(-20).map(msg => {
                    const user = profilesMap[msg.sender_id];
                    const isPinned = pinnedMessages.includes(msg.id);
                    return (
                      <div key={msg.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-800">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-400 text-xs">{user?.display_name || t.user}</p>
                          <p className="text-white text-sm truncate">{msg.content}</p>
                        </div>
                        <Button
                          size="sm"
                          variant={isPinned ? 'outline' : 'default'}
                          onClick={() => isPinned ? onUnpinMessage(msg.id) : onPinMessage(msg.id)}
                          className={isPinned ? 'border-gray-700' : 'bg-[#00c6d2] text-[#0b0b0b]'}
                        >
                          <Pin className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <div className="space-y-4">
                {/* Invite Friends Section */}
                <div className="p-4 rounded-xl bg-gray-800 space-y-3">
                  <div className="flex items-center gap-2 text-white font-medium">
                    <UserPlus className="w-4 h-4 text-[#00c6d2]" />
                    Invite Friends
                  </div>
                  {eligibleFriends.length === 0 ? (
                    <p className="text-gray-500 text-xs text-center py-2">No friends to invite</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {eligibleFriends.map(friend => {
                        const status = sentInvites[friend.user_id];
                        return (
                          <div key={friend.user_id} className="flex items-center gap-3 p-2 rounded-xl bg-gray-900">
                            <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-gray-700">
                              {friend.photos?.[0]
                                ? <img src={friend.photos[0]} alt="" className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">{friend.display_name?.[0] || '?'}</span>
                                  </div>
                              }
                            </div>
                            <p className="flex-1 text-white text-sm truncate">{friend.display_name}</p>
                            <button
                              onClick={() => handleInviteFriend(friend.user_id)}
                              disabled={!!status}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-60 flex items-center gap-1 ${
                                status === 'sent'
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                  : 'bg-[#00c6d2]/20 text-[#00c6d2] border border-[#00c6d2]/40'
                              }`}
                            >
                              {status === 'sending' ? <Loader2 className="w-3 h-3 animate-spin" />
                                : status === 'sent' ? <><Check className="w-3 h-3" /> Sent</>
                                : <><Send className="w-3 h-3" /> Invite</>}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Members List */}
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm font-medium">{t.members} ({participants.length})</p>
                  {participants.map(p => {
                    const user = profilesMap[p.user_id];
                    const isCreator = p.is_admin;
                    const isSelf = p.user_id === currentUserId;
                    return (
                      <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-800">
                        <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                          {user?.photos?.[0] ? (
                            <img src={user.photos[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-white font-bold">{user?.display_name?.[0] || '?'}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">{user?.display_name || t.user}</p>
                          {isCreator && <p className="text-[#00c6d2] text-xs">Admin</p>}
                        </div>
                        {!isCreator && !isSelf && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onRemoveMember(p.user_id)}
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}