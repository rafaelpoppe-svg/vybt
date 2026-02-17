import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldAlert } from 'lucide-react';

export default function VerificationBadge({ isVerified, onClick }) {
  if (isVerified) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00fea3]/20 border border-[#00fea3]/30">
        <Shield className="w-4 h-4 text-[#00fea3]" />
        <span className="text-sm text-[#00fea3] font-medium">Verified</span>
      </div>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30"
    >
      <ShieldAlert className="w-4 h-4 text-red-400" />
      <span className="text-sm text-red-400 font-medium">Not Verified - Click to Verify</span>
    </motion.button>
  );
}