import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Users, Sparkles, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function PlanCard({ plan, participants = [], onClick, featured = false }) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`rounded-2xl overflow-hidden cursor-pointer ${
        featured ? 'bg-gradient-to-br from-[#542b9b]/30 to-[#00fea3]/10' : 'bg-gray-900/50'
      } border border-gray-800 hover:border-gray-700 transition-all`}
    >
      {/* Cover Image */}
      <div className="relative h-40">
        {plan.cover_image ? (
          <img 
            src={plan.cover_image} 
            alt={plan.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#542b9b] to-[#00fea3]/50 flex items-center justify-center">
            <span className="text-4xl">🎉</span>
          </div>
        )}
        
        {plan.is_highlighted && (
          <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-[#542b9b]/80 backdrop-blur-sm flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#00fea3]" />
            <span className="text-[10px] text-white font-medium">Featured</span>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex gap-2 flex-wrap">
            {plan.tags?.slice(0, 3).map((tag, i) => (
              <span 
                key={i}
                className="px-2 py-0.5 rounded-full bg-[#00fea3]/20 text-[#00fea3] text-[10px] font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h3 className="text-white font-bold text-lg line-clamp-1">{plan.title}</h3>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{format(new Date(plan.date), 'EEE, MMM d')}</span>
            <Clock className="w-4 h-4 ml-2" />
            <span className="text-sm">{plan.time}</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-400">
            <MapPin className="w-4 h-4" />
            <span className="text-sm line-clamp-1">{plan.location_address}</span>
          </div>
        </div>

        {/* Participants */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-800">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {participants.slice(0, 3).map((p, i) => (
                <div 
                  key={i}
                  className="w-6 h-6 rounded-full bg-gray-700 border-2 border-gray-900 flex items-center justify-center"
                >
                  <span className="text-[10px] text-white">
                    {p.display_name?.[0] || '?'}
                  </span>
                </div>
              ))}
            </div>
            <span className="text-xs text-gray-500">
              {participants.length} going
            </span>
          </div>
          
          <div className="flex items-center gap-1 text-gray-500">
            <Users className="w-4 h-4" />
            <span className="text-xs">{plan.view_count || 0} views</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}