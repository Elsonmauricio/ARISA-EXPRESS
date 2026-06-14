import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const STATS = [
  { value: 10000, prefix: '+', suffix: '',   label: 'Encomendas entregues' },
  { value: 95,    prefix: '+', suffix: '%',  label: 'Clientes satisfeitos' },
  { value: 48,    prefix: '',  suffix: 'h',  label: 'Tempo médio Lisboa → Luanda' },
  { value: 24,    prefix: '',  suffix: '/7', label: 'Apoio ao cliente' },
];

function Counter({ value, prefix, suffix, delay = 0 }) {
  const ref = useRef(null);

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
        node.textContent = `${prefix}${Math.floor(obj.v).toLocaleString('pt-PT')}${suffix}`;
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

  return <span ref={ref}>{`${prefix}0${suffix}`}</span>;
}

export default function Stats() {
  const containerRef = useRef(null);

  // Animação de entrada do card contéiner (fade up via GSAP)
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
    <section className="relative py-20">
      <div className="container">
        <div
          ref={containerRef}
          className="glass-strong border-gradient rounded-3xl p-10 md:p-14 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {STATS.map((s, i) => (
            <div key={i} className="stat-item text-center md:text-left">
              <div className="font-display text-4xl md:text-5xl font-bold text-gradient-gold">
                <Counter value={s.value} prefix={s.prefix} suffix={s.suffix} delay={i * 0.08} />
              </div>
              <div className="mt-2 text-xs md:text-sm text-white/60 uppercase tracking-widest">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
