import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Flame } from 'lucide-react';

export default function PlanCountdown({ plan, size = 'md' }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [status, setStatus] = useState('upcoming'); // upcoming, happening, voting, ended

  useEffect(() => {
    const calculateStatus = () => {
      const now = new Date();
      const startTime = new Date(`${plan.date}T${plan.time}`);
      const endTime = plan.end_time 
        ? new Date(`${plan.date}T${plan.end_time}`)
        : new Date(startTime.getTime() + 6 * 60 * 60 * 1000); // Default 6h
      
      // Handle end time crossing midnight
      if (endTime < startTime) {
        endTime.setDate(endTime.getDate() + 1);
      }

      const votingEnds = new Date(endTime.getTime() + 6 * 60 * 60 * 1000);

      if (now < startTime) {
        setStatus('upcoming');
        const diff = startTime - now;
        setTimeLeft(formatTimeDiff(diff));
      } else if (now >= startTime && now < endTime) {
        setStatus('happening');
        const diff = endTime - now;
        setTimeLeft(formatTimeDiff(diff));
      } else if (now >= endTime && now < votingEnds) {
        setStatus('voting');
        const diff = votingEnds - now;
        setTimeLeft(formatTimeDiff(diff));
      } else {
        setStatus('ended');
        setTimeLeft(null);
      }
    };

    calculateStatus();
    const interval = setInterval(calculateStatus, 1000);
    return () => clearInterval(interval);
  }, [plan]);

  const formatTimeDiff = (ms) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const sizes = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  if (status === 'happening') {
    return (
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className={`${sizes[size]} rounded-full bg-blue-500 text-white font-medium flex items-center gap-1.5`}
      >
        <Flame className="w-4 h-4 animate-pulse" />
        <span>Happening Now</span>
        {timeLeft && <span className="opacity-75">• {timeLeft}</span>}
      </motion.div>
    );
  }

  if (status === 'voting') {
    return (
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className={`${sizes[size]} rounded-full bg-orange-500 text-white font-medium flex items-center gap-1.5`}
      >
        <Clock className="w-4 h-4" />
        <span>Votação</span>
        {timeLeft && <span className="opacity-75">• {timeLeft}</span>}
      </motion.div>
    );
  }

  if (status === 'upcoming' && timeLeft) {
    return (
      <div className={`${sizes[size]} rounded-full bg-gray-800 text-gray-300 font-medium flex items-center gap-1.5`}>
        <Clock className="w-4 h-4" />
        <span>Starts in {timeLeft}</span>
      </div>
    );
  }

  return null;
}