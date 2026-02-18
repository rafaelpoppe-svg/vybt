import React from 'react';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';
import { Toaster } from 'sonner';

export default function Layout({ children, currentPageName }) {
  return (
    <NotificationProvider>
      <Toaster position="top-center" theme="dark" />
      <div className="min-h-screen bg-[#0b0b0b]">
        <style>{`
          @media (prefers-color-scheme: light) {
            :root {
              color-scheme: dark;
            }
          }

          :root {
            --color-primary: #00fea3;
            --color-secondary: #542b9b;
            --color-background: #0b0b0b;
            --sat: env(safe-area-inset-top, 0px);
            --sab: env(safe-area-inset-bottom, 0px);
            --sal: env(safe-area-inset-left, 0px);
            --sar: env(safe-area-inset-right, 0px);
          }

          html, body {
            background-color: #0b0b0b;
            color: white;
            overscroll-behavior-y: none;
            -webkit-overflow-scrolling: touch;
            height: 100%;
          }

          /* Disable text selection globally for UI elements */
          * {
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
          }

          button, nav, header, a, label, 
          [role="button"], [role="tab"],
          .select-none {
            user-select: none;
            -webkit-user-select: none;
          }

          /* Allow selection for content areas */
          p, .bio-text, .selectable,
          input, textarea,
          [contenteditable] {
            user-select: text;
            -webkit-user-select: text;
          }

          /* Safe area top padding for sticky headers */
          .safe-top {
            padding-top: env(safe-area-inset-top, 0px);
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

          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }

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