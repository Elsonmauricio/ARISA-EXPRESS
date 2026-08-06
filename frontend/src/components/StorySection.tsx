import { useRef, useEffect, useState, ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export interface StoryChapter {
  id: string;
  title: ReactNode;
  body: ReactNode;
  /** Tom visual do capÃ­tulo. */
  tone?: 'gold' | 'lilac' | 'white';
  /** PosiÃ§Ã£o horizontal do capÃ­tulo na secÃ§Ã£o. */
  align?: 'left' | 'center' | 'right';
}

interface StorySectionProps {
  chapters: StoryChapter[];
  /** Cena visual 3D/background renderizada atrÃ¡s dos capÃ­tulos. */
  visual?: ReactNode;
  /** Callback com o progresso global (0..1) do storytelling. */
  onProgress?: (p: number) => void;
  className?: string;
}

/**
 * ExperiÃªncia de storytelling scroll-driven:
 * a secÃ§Ã£o fica "pinnada" enquanto o utilizador faz scroll e os capÃ­tulos
 * (texto) trocam em crossfade. A cena visual em segundo plano lÃª a variÃ¡vel
 * CSS `--story-progress` (0..1) para se animar de forma sincronizada.
 */
export default function StorySection({ chapters, visual, onProgress, className = '' }: StorySectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);
  const [pinHeight, setPinHeight] = useState(chapters.length * window.innerHeight);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const build = (pin: boolean) => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: `+=${pinHeight}`,
            scrub: 1,
            pin,
            ...(pin ? { anticipatePin: 1 } : {}),
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
          end: `+=${pinHeight}`,
          scrub: true,
          onUpdate: (self) => {
            const p = String(self.progress);
            if (stageRef.current) stageRef.current.style.setProperty('--story-progress', p);
            onProgress?.(self.progress);
          },
        });
      };

      ScrollTrigger.matchMedia({
        "(min-width: 768px)": () => build(true),
        "(max-width: 767px)": () => build(false),
      });
    }, section);

    return () => ctx.revert();
  }, [chapters.length, pinHeight, onProgress]);

  return (
    <section
      ref={sectionRef}
      className={`relative h-screen w-full overflow-hidden ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#E8D9F5]/0 via-transparent to-[#E8D9F5]/10 z-[1]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#E8D9F5]/0 via-transparent to-[#E8D9F5]/20 z-[1]" />
      <div ref={stageRef} className="absolute inset-0 -z-10" style={{ ['--story-progress' as any]: 0 }}>
        {visual}
      </div>

      <div className="absolute top-0 left-0 right-0 h-[3px] bg-white z-20">
        <div ref={barRef} className="h-full origin-left bg-gradient-to-r from-gold via-lilac-500 to-lilac" style={{ transform: 'scaleX(0)' }} />
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
                <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-black leading-[1.05]">
                  <span className="text-gradient-lilac">{ch.title}</span>
                </h2>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">
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



