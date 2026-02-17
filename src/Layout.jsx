import React from 'react';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';
import { Toaster } from 'sonner';

export default function Layout({ children, currentPageName }) {
  // Pages that should have the dark theme applied
  const darkPages = [
    'Home', 'Onboarding', 'Explore', 'CreatePlan', 'PlanDetails',
    'Profile', 'Chat', 'AddStory', 'EditProfile', 'Friends',
    'UserProfile', 'MyPlans', 'StoryView', 'MyStories'
  ];

  return (
    <NotificationProvider>
      <Toaster position="top-center" theme="dark" />
      <div className="min-h-screen bg-[#0b0b0b]">
      <style>{`
        :root {
          --color-primary: #00fea3;
          --color-secondary: #542b9b;
          --color-background: #0b0b0b;
        }
        
        body {
          background-color: #0b0b0b;
          color: white;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
        
        /* Hide scrollbar for mobile */
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Input styling for dark theme */
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
        }
      `}</style>
        {children}
      </div>
    </NotificationProvider>
  );
}