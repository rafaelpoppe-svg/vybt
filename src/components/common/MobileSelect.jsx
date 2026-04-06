import React, { useState, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from './LanguageContext';

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

export default function MobileSelect({
  value,
  onValueChange,
  placeholder,
  options = [],          // [{ value, label, disabled? }]
  triggerClassName,
  title,                 // optional drawer title
  disabled,
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const selectedLabel = options.find(o => o.value === value)?.label ?? placeholder;
  const resolvedPlaceholder = placeholder ?? t.searchAddress;

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className={triggerClassName}>
          <SelectValue placeholder={resolvedPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(o => (
            <SelectItem key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(
          'flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm disabled:opacity-50',
          triggerClassName
        )}
      >
        <span className={value ? 'text-white' : 'text-gray-500'}>{selectedLabel}</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>

      {/* Bottom Sheet */}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent 
          className="border-gray-800 pb-safe"
          style={{background: 'var(--bg-secondary)'}}
        >
          {title && (
            <DrawerHeader>
              <DrawerTitle className="text-white">{title}</DrawerTitle>
            </DrawerHeader>
          )}
          <div className="px-4 pb-6 space-y-1 max-h-[60vh] overflow-y-auto">
            {options.map(o => (
              <button
                key={o.value}
                disabled={o.disabled}
                onClick={() => {
                  onValueChange(o.value);
                  setOpen(false);
                }}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium transition-colors',
                  o.value === value
                    ? 'bg-[#00fea3]/15 text-[#00fea3]'
                    : 'text-white hover:bg-gray-800',
                  o.disabled && 'opacity-40 pointer-events-none'
                )}
              >
                <span>{o.label}</span>
                {o.value === value && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}