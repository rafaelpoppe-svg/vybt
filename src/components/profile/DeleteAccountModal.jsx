import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';

export default function DeleteAccountModal({ isOpen, onClose, userId, profile }) {
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);

  const CONFIRM_WORD = 'DELETE';
  const canDelete = confirmation === CONFIRM_WORD;

  const handleDelete = async () => {
    if (!canDelete) return;
    setLoading(true);
    try {
      // Delete user profile and related data
      if (profile?.id) {
        await base44.entities.UserProfile.delete(profile.id);
      }
      base44.auth.logout('/');
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            className="border border-red-900/40 rounded-2xl p-6 w-full max-w-sm space-y-5"
            style={{background: 'var(--bg)'}}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">Delete Account</h2>
                  <p className="text-gray-500 text-xs">This action is permanent</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1 text-gray-600 hover:text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-2">
              <p className="text-red-300 text-sm font-medium">Your account will be permanently deleted:</p>
              <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
                <li>Profile and photos</li>
                <li>All stories and plan history</li>
                <li>Friendships and messages</li>
              </ul>
            </div>

            {/* Confirmation */}
            <div className="space-y-2">
              <p className="text-gray-400 text-sm">
                Type <span className="text-red-400 font-mono font-bold">{CONFIRM_WORD}</span> to confirm:
              </p>
              <Input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value.toUpperCase())}
                placeholder="Type DELETE"
                className="bg-gray-900 border-gray-700 text-white font-mono tracking-widest"
                autoCapitalize="characters"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-gray-700 text-gray-300 bg-transparent"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={!canDelete || loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-40"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Forever'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}