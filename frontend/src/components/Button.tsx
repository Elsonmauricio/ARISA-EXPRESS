import React from 'react';
import { motion } from 'framer-motion';
// Verifique se a pasta lib está em src/lib. Se sim, use ../
import { cn } from '../lib/utils';

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export function GoldButton({ children, className, onClick, type = 'button', disabled }: ButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative inline-flex items-center justify-center px-7 py-3.5 rounded-full',
        'text-white font-medium tracking-wide',
        'bg-gradient-to-r from-lilac-500 to-gold hover:from-lilac-600 hover:to-gold',
        'overflow-hidden group',
        disabled && 'opacity-50 cursor-not-allowed grayscale',
        className
      )}
    >
      <span className="relative z-10">{children}</span>
      <span className="absolute inset-0 bg-gold-grad opacity-0 group-hover:opacity-80 transition-opacity duration-500" />
    </motion.button>
  );
}

export function GhostButton({ children, className, onClick }: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'relative inline-flex items-center justify-center px-7 py-3.5 rounded-full',
        'border border-lilac-500/30 hover:border-lilac-400',
        'bg-white/[0.02] hover:bg-white/[0.06] hover:border-gold/60 transition-colors',
        className
      )}
    >
      {children}
    </motion.button>
  );
}
