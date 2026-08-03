// src/components/Timeline.tsx
'use client';

import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Mailbox, Plane, Warehouse, Truck, Check, Package, MapPin, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useT } from '../i18n/LanguageContext';

export interface StepData {
  id?: string;
  icon: 'Mailbox' | 'Plane' | 'Warehouse' | 'Truck' | 'Check' | 'Package' | 'MapPin' | 'XCircle' | string;
  title: string;
  description: string;
  date: string;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Mailbox,
  Plane,
  Warehouse,
  Truck,
  Check,
  Package,
  MapPin,
  XCircle,
};

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.45,
      delayChildren: 0.2,
    },
  },
};

const dotVariants: Variants = {
  hidden: { scale: 0.4, opacity: 0 },
  show: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 220, damping: 18 },
  },
};

const lineVariants: Variants = {
  hidden: { scaleX: 0 },
  show: {
    scaleX: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

const contentVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

interface TimelineProps {
  steps: StepData[];
  currentStep?: number;
  className?: string;
}

export default function Timeline({
  steps = [],
  currentStep = 0,
  className = '',
}: TimelineProps) {
  const { t } = useT();
  if (!steps || steps.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8 text-sm">
        {t('timeline.vazio')}
      </div>
    );
  }

  const safeCurrentStep = Math.min(Math.max(0, currentStep), steps.length - 1);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={`relative ${className}`}
    >
      {/* Desktop */}
      <div className="hidden md:block">
        <div className="absolute top-7 left-0 right-0 h-px bg-gray-300" />
        <div className={`grid grid-cols-${Math.min(steps.length, 4)} gap-4`}>
          {steps.map((step, index) => {
            const reached = index <= safeCurrentStep;
            const isCurrent = index === safeCurrentStep;
            const Icon = ICON_MAP[step.icon] || Mailbox;

            return (
              <div key={step.id || index} className="relative flex flex-col items-center text-center">
                <motion.div
                  variants={dotVariants}
                  className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isCurrent
                      ? 'border-[#D4AF37] bg-[#D4AF37]/20 shadow-gold'
                      : reached
                        ? 'border-[#7B2FBF] bg-[#7B2FBF]/20'
                        : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  {reached && !isCurrent ? (
                    <Check className="w-5 h-5 text-[#7B2FBF]" />
                  ) : (
                    <Icon
                      className={`w-5 h-5 ${
                        isCurrent ? 'text-[#D4AF37]' : reached ? 'text-[#7B2FBF]' : 'text-gray-400'
                      }`}
                    />
                  )}
                </motion.div>
                <motion.div variants={contentVariants} className="mt-4 px-2">
                  <div
                    className={`text-sm font-semibold ${
                      isCurrent ? 'text-[#7B2FBF]' : reached ? 'text-[#4B2170]' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{step.description}</div>
                  <div className="text-[10px] tracking-widest uppercase text-gray-400 mt-1">
                    {step.date}
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden relative pl-10">
        <div className="absolute left-[1.6rem] top-2 bottom-2 w-px bg-gray-300" />
        {steps.map((step, index) => {
          const reached = index <= safeCurrentStep;
          const isCurrent = index === safeCurrentStep;
          const Icon = ICON_MAP[step.icon] || Mailbox;

          return (
            <div key={step.id || index} className="relative pb-8 last:pb-0">
              <motion.div
                variants={dotVariants}
                className={`absolute -left-[1.65rem] top-0 w-11 h-11 rounded-full flex items-center justify-center border-2 ${
                  isCurrent
                    ? 'border-[#D4AF37] bg-[#D4AF37]/20 shadow-gold'
                    : reached
                      ? 'border-[#7B2FBF] bg-[#7B2FBF]/20'
                      : 'border-gray-300 bg-gray-50'
                }`}
              >
                {reached && !isCurrent ? (
                  <Check className="w-4 h-4 text-[#7B2FBF]" />
                ) : (
                  <Icon
                    className={`w-4 h-4 ${
                      isCurrent ? 'text-[#D4AF37]' : reached ? 'text-[#7B2FBF]' : 'text-gray-400'
                    }`}
                  />
                )}
              </motion.div>
              <motion.div variants={contentVariants} className="ml-4">
                <div
                  className={`font-semibold text-sm ${
                    isCurrent ? 'text-[#7B2FBF]' : reached ? 'text-[#4B2170]' : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </div>
                <div className="text-xs text-gray-500">{step.description}</div>
                <div className="text-[10px] tracking-widest uppercase text-gray-400 mt-0.5">
                  {step.date}
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
