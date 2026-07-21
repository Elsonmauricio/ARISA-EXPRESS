import { useRef, useEffect, ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export interface StoryChapter {
  id: string;
  kicker: string;
  title: ReactNode;
  body: ReactNode;
  /** Tom visual do capítulo. */
  tone?: 'gold' | 'lilac' | 'white';
  /** Posição horizontal do capítulo na secção. */
  align?: 'left' | 'center' | 'right';
}

interface StorySectionProps {
  chapters: StoryChapter[];
  /** Cena visual 3D/background renderizada atrás dos capítulos. */
  visual?: ReactNode;
  /** Callback com o progresso global (0..1) do storytelling. */
  onProgress?: (p: number) => void;
  className?: string;
}

/**
 * Experiência de storytelling scroll-driven:
 * a secção fica "pinnada" enquanto o utilizador faz scroll e os capítulos
 * (texto) trocam em crossfade. A cena visual em segundo plano lê a variável
 * CSS `--story-progress` (0..1) para se animar de forma sincronizada.
 */
export default function StorySection({ chapters, visual, onProgress, className = '' }: StorySectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${chapters.length * window.innerHeight}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      });

      if (barRef.current) {
        tl.fromTo(barRef.current, { scaleX: 0 }, { scaleX: 1, ease: 'none' }, 0);
      }

      chapterRefs.current.forEach((el, i) => {
        if (!el) return;
        const inner = el.querySelector('.story-inner') as HTMLElement | null;
        if (!inner) return;
        const at = i / chapters.length;
        const out = (i + 1) / chapters.length;
        tl.fromTo(inner, { opacity: 0, y: 40, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.18 }, at)
          .to(inner, { opacity: 0, y: -40, filter: 'blur(6px)', duration: 0.18 }, out - 0.16);
      });

      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: () => `+=${chapters.length * window.innerHeight}`,
        scrub: true,
        onUpdate: (self) => {
          const p = String(self.progress);
          if (stageRef.current) stageRef.current.style.setProperty('--story-progress', p);
          onProgress?.(self.progress);
        },
      });
    }, section);

    return () => ctx.revert();
  }, [chapters.length]);

  return (
    <section
      ref={sectionRef}
      className={`relative h-screen w-full overflow-hidden ${className}`}
    >
      <div ref={stageRef} className="absolute inset-0 -z-10" style={{ ['--story-progress' as any]: 0 }}>
        {visual}
      </div>

      <div className="absolute top-0 left-0 right-0 h-[3px] bg-white/5 z-20">
        <div ref={barRef} className="h-full origin-left bg-gradient-to-r from-gold via-lilac-500 to-white" style={{ transform: 'scaleX(0)' }} />
      </div>

      <div className="relative z-10 h-full w-full flex items-center">
        {chapters.map((ch, i) => {
          const align = ch.align ?? 'left';
          const posCls =
            align === 'left'
              ? 'left-0 right-auto md:left-[6%] text-left items-start'
              : align === 'right'
              ? 'right-0 left-auto md:right-[6%] text-right items-end'
              : 'left-1/2 -translate-x-1/2 text-center items-center';
          return (
            <div
              key={ch.id}
              ref={(el) => (chapterRefs.current[i] = el)}
              className={`absolute w-[min(36rem,92vw)] px-6 flex flex-col ${posCls}`}
              style={{ top: '50%', transform: align === 'center' ? 'translate(-50%, -50%)' : 'translateY(-50%)' }}
            >
              <div className="story-inner" style={{ opacity: i === 0 ? 1 : 0 }}>
                <span
                  className={`inline-block text-xs uppercase tracking-[0.35em] mb-5 ${
                    ch.tone === 'gold' ? 'text-gold' : ch.tone === 'lilac' ? 'text-lilac-300' : 'text-white/60'
                  }`}
                >
                  {ch.kicker}
                </span>
                <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.05]">
                  {ch.title}
                </h2>
                <p className="mt-6 text-base md:text-lg text-white/65 leading-relaxed max-w-xl">
                  {ch.body}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
