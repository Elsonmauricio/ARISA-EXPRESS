import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TelemetryCard } from './TelemetryCard';
import { useT } from '../i18n/LanguageContext';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface StatItem {
  value: number;
  prefix: string;
  suffix: string;
  label: string;
  labelTone?: 'lilas' | 'white';
  tag?: string;
  tagTone?;
}

const getStats = (t: (key: string) => string): StatItem[] => [
  { value: 10000, prefix: '+', suffix: '', label: t('stats.1') },
  { value: 95, prefix: '+', suffix: '%', label: t('stats.2') },
  { value: 48, prefix: '', suffix: 'h', label: t('stats.3'), labelTone: 'lilas' },
  { value: 24, prefix: '', suffix: '/7', label: t('stats.4'), labelTone: 'white' },
];

interface CounterProps {
  value: number;
  prefix: string;
  suffix: string;
  delay?: number;
}

function Counter({ value, prefix, suffix, delay = 0 }: CounterProps): JSX.Element {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(`${prefix}0${suffix}`);

  useEffect(() => {
    if (!ref.current) return;
    const node = ref.current;
    const obj = { v: 0 };

    const tween = gsap.to(obj, {
      v: value,
      duration: 2.2,
      delay,
      ease: 'power2.out',
      onUpdate: () => {
        setDisplay(`${prefix}${Math.floor(obj.v).toLocaleString('pt-PT')}${suffix}`);
      },
      scrollTrigger: {
        trigger: node,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [value, prefix, suffix, delay]);

  return <span ref={ref}>{display}</span>;
}

export default function Stats(): JSX.Element {
  const { t } = useT();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.stat-item',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.12,
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="stats" className="relative py-20 w-full flex justify-center">
      <div className="container mx-auto px-4">
        <div
          ref={containerRef}
          className="glass-strong border-gradient rounded-3xl p-6 sm:p-10 md:p-14 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mx-auto max-w-5xl"
        >
          {getStats(t).map((s, i) => (
            <div key={i} className="stat-item">
              <TelemetryCard
                tag={s.tag}
                tagTone={s.tagTone}
                value={<Counter value={s.value} prefix={s.prefix} suffix={s.suffix} delay={i * 0.08} />}
                title={s.label}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}