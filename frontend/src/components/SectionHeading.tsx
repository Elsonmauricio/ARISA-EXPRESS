import React from 'react';
import { motion } from 'framer-motion';

interface SectionHeadingProps {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  align?: 'left' | 'center';
}

export default function SectionHeading({ eyebrow, title, subtitle, align = 'left' }: SectionHeadingProps) {
  const alignCls = align === 'center' ? 'text-center mx-auto' : 'text-left mr-auto';
  return (
    <div className={`max-w-3xl ${alignCls}`}>
      {eyebrow && (
        <motion.span
          initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="inline-block text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-gold mb-3 sm:mb-4"
        >
          {eyebrow}
        </motion.span>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gold leading-[1.05]"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-4 text-sm sm:text-base md:text-lg text-white/70 leading-relaxed"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}



