import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Pin, UserMinus, UserPlus, Share2, MoreVertical, 
  MessageSquare, Camera, Check, Loader2, Edit 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  currentUserId,
  isAdmin
}) {
  const [activeTab, setActiveTab] = useState('stories');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  if (!isOpen || !isAdmin) return null;

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    await onInviteUser(inviteEmail);
    setInviteEmail('');
    setInviting(false);
  };

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
            <h2 className="text-lg font-bold text-white">Admin Actions</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-800">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Edit Plan Button */}
          {onEditPlan && (
            <div className="p-3 border-b border-gray-800">
              <Button
                onClick={onEditPlan}
                className="w-full bg-[#542b9b] hover:bg-[#542b9b]/80 text-white"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar Plano
              </Button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-gray-800">
            {[
              { id: 'stories', label: 'Pin Stories', icon: Camera },
              { id: 'messages', label: 'Pin Messages', icon: MessageSquare },
              { id: 'members', label: 'Members', icon: UserMinus }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-1.5 ${
                  activeTab === tab.id 
                    ? 'text-[#00fea3] border-b-2 border-[#00fea3]' 
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
                  <p className="text-gray-500 text-center py-8">No stories to pin</p>
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
                          <p className="text-white text-sm font-medium">{user?.display_name || 'User'}</p>
                          <p className="text-gray-500 text-xs">
                            {isPinned ? '📌 Pinned' : 'Not pinned'}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant={isPinned ? 'outline' : 'default'}
                          onClick={() => isPinned ? onUnpinStory(story.id) : onPinStory(story.id)}
                          className={isPinned ? 'border-gray-700' : 'bg-[#00fea3] text-[#0b0b0b]'}
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
                  <p className="text-gray-500 text-center py-8">No messages to pin</p>
                ) : (
                  messages.slice(-20).map(msg => {
                    const user = profilesMap[msg.sender_id];
                    const isPinned = pinnedMessages.includes(msg.id);
                    return (
                      <div key={msg.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-800">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-400 text-xs">{user?.display_name || 'User'}</p>
                          <p className="text-white text-sm truncate">{msg.content}</p>
                        </div>
                        <Button
                          size="sm"
                          variant={isPinned ? 'outline' : 'default'}
                          onClick={() => isPinned ? onUnpinMessage(msg.id) : onPinMessage(msg.id)}
                          className={isPinned ? 'border-gray-700' : 'bg-[#00fea3] text-[#0b0b0b]'}
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
                {/* Invite Section */}
                <div className="p-4 rounded-xl bg-gray-800 space-y-3">
                  <div className="flex items-center gap-2 text-white font-medium">
                    <UserPlus className="w-4 h-4 text-[#00fea3]" />
                    Invite User
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Enter email or username"
                      className="flex-1 bg-gray-900 border-gray-700 text-white text-sm"
                    />
                    <Button
                      onClick={handleInvite}
                      disabled={inviting || !inviteEmail.trim()}
                      className="bg-[#00fea3] text-[#0b0b0b]"
                    >
                      {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Members List */}
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm font-medium">Members ({participants.length})</p>
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
                          <p className="text-white text-sm font-medium">{user?.display_name || 'User'}</p>
                          {isCreator && <p className="text-[#00fea3] text-xs">Admin</p>}
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