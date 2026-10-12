import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom';
  className?: string;
}

export default function Tooltip({ children, content, position = 'top', className }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className={cn("relative inline-flex items-center justify-center", className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: position === 'top' ? 10 : -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: position === 'top' ? 10 : -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute z-[100] px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap pointer-events-none shadow-xl border",
              "bg-[var(--tooltip-bg)] text-[var(--tooltip-text)] border-slate-200 dark:border-slate-700",
              position === 'top' ? "bottom-full mb-2" : "top-full mt-2"
            )}
          >
            {content}
            <div 
              className={cn(
                "absolute w-2 h-2 rotate-45 border-slate-200 dark:border-slate-700",
                "bg-[var(--tooltip-bg)]",
                position === 'top' 
                  ? "bottom-[-5px] left-1/2 -translate-x-1/2 border-r border-b" 
                  : "top-[-5px] left-1/2 -translate-x-1/2 border-l border-t"
              )} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}