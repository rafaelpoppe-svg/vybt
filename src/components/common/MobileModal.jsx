/**
 * MobileModal — Renders as a Dialog on desktop, Drawer (bottom sheet) on mobile.
 *
 * Usage:
 *   <MobileModal open={open} onClose={() => setOpen(false)} title="My Title">
 *     ...content...
 *   </MobileModal>
 */
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

export default function MobileModal({ open, onClose, title, children, className, contentClassName }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
        <DrawerContent 
          className={cn('border-gray-800', contentClassName)}
          style={{background: 'var(--bg-secondary)'}}
        >
          {title && (
            <DrawerHeader className="relative">
              <DrawerTitle className="text-white text-center">{title}</DrawerTitle>
              <DrawerClose asChild>
                <button className="absolute right-4 top-4 text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </DrawerClose>
            </DrawerHeader>
          )}
          <div className={cn('px-4 pb-8', className)}>
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className={cn('bg-[#141414] border-gray-800 text-white', contentClassName)}>
        {title && (
          <DialogHeader>
            <DialogTitle className="text-white">{title}</DialogTitle>
          </DialogHeader>
        )}
        <div className={className}>
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}