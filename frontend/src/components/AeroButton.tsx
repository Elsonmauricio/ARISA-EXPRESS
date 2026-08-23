import React from 'react';
import { motion } from 'framer-motion';

type AeroButtonVariant = 'gold' | 'ghost';

export function AeroButton({
  children,
  onClick,
  type = 'button',
  className = '',
  variant = 'gold',
  icon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  className?: string;
  variant?: AeroButtonVariant;
  icon?: React.ReactNode;
}) {
  const variantClasses =
    variant === 'gold'
      ? 'bg-aero-gold text-[#374151] hover:bg-aero-gold/80 shadow-[0_0_25px_rgba(245,158,11,0.25)]'
      : 'bg-transparent text-gold border border-gray-300 hover:border-aero-gold hover:text-aero-gold';

  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        inline-flex items-center gap-2 sm:gap-3 
        px-5 sm:px-7 py-3 sm:py-3.5 
        font-data text-[#1a1133] sm:text-[13px] font-bold uppercase tracking-wider 
        transition-all duration-300 
        rounded-full   /* <-- bordas completamente arredondadas */
        ${variantClasses} 
        ${className}
      `}
    >
      <span className="sq inline-block w-1.5 h-1.5 bg-current" aria-hidden="true" />
      {children}
      {icon}
    </motion.button>
  );
}