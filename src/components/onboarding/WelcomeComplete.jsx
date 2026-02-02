import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, MapPin, PartyPopper } from 'lucide-react';

export default function WelcomeComplete({ onExplore }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-8 py-8"
    >
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          repeatType: "reverse"
        }}
        className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[#00fea3] to-[#542b9b] flex items-center justify-center"
      >
        <PartyPopper className="w-12 h-12 text-white" />
      </motion.div>

      <div>
        <h1 className="text-4xl font-bold text-white mb-3">Welcome!</h1>
        <p className="text-xl text-[#00fea3] font-medium">Your account is ready</p>
      </div>

      <div className="space-y-4 max-w-xs mx-auto">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-900/50 border border-gray-800">
          <Sparkles className="w-6 h-6 text-[#00fea3]" />
          <span className="text-gray-300">Search for plans tonight?</span>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-900/50 border border-gray-800">
          <MapPin className="w-6 h-6 text-[#542b9b]" />
          <span className="text-gray-300">Explore all plans in your location</span>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onExplore}
        className="w-full max-w-xs mx-auto py-4 px-8 rounded-full bg-gradient-to-r from-[#00fea3] to-[#542b9b] text-white font-bold text-lg shadow-lg shadow-[#00fea3]/20"
      >
        Let's Go! 🎉
      </motion.button>
    </motion.div>
  );
}