import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image, Smile, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function GroupChat({ groupId, currentUser, messages, onNewMessage }) {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    setIsSending(true);
    
    await base44.entities.GroupMessage.create({
      group_id: groupId,
      sender_email: currentUser.email,
      sender_name: currentUser.full_name,
      sender_avatar: currentUser.avatar_url,
      content: newMessage.trim()
    });

    setNewMessage('');
    setIsSending(false);
    onNewMessage?.();
  };

  const groupedMessages = messages.reduce((groups, msg) => {
    const date = format(new Date(msg.created_date), 'yyyy-MM-dd');
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            {/* Date Separator */}
            <div className="flex items-center justify-center my-4">
              <div className="bg-slate-100 px-3 py-1 rounded-full">
                <span className="text-xs text-slate-500">
                  {format(new Date(date), "d 'de' MMMM", { locale: ptBR })}
                </span>
              </div>
            </div>

            {/* Messages */}
            <AnimatePresence>
              {msgs.map((msg) => {
                const isOwn = msg.sender_email === currentUser?.email;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 mb-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                  >
                    {!isOwn && (
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={msg.sender_avatar} />
                        <AvatarFallback className="bg-sky-100 text-sky-600 text-xs">
                          {msg.sender_name?.[0] || 'V'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-[70%] ${isOwn ? 'text-right' : ''}`}>
                      {!isOwn && (
                        <p className="text-xs text-slate-500 mb-1 ml-1">{msg.sender_name}</p>
                      )}
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isOwn
                            ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-br-md'
                            : 'bg-slate-100 text-slate-800 rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm break-words">{msg.content}</p>
                        {msg.image_url && (
                          <img 
                            src={msg.image_url} 
                            alt="Imagem" 
                            className="mt-2 rounded-lg max-w-full"
                          />
                        )}
                      </div>
                      <p className={`text-xs text-slate-400 mt-1 ${isOwn ? 'mr-1' : 'ml-1'}`}>
                        {format(new Date(msg.created_date), 'HH:mm')}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white">
        <div className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite uma mensagem..."
            className="flex-1 rounded-full bg-slate-50 border-none"
            disabled={isSending}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            size="icon"
            className="rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}