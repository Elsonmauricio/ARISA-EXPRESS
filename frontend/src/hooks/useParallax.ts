import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface ParallaxOptions {
  distance?: number;
  axis?: 'x' | 'y';
  scrub?: number;
  start?: string;
  end?: string;
  depth?: number;
  invert?: boolean;
}

export function useParallax<T extends HTMLElement = HTMLDivElement>(options: ParallaxOptions = {}) {
  const {
    distance,
    axis = 'y',
    scrub = 1,
    start = 'top bottom',
    end = 'bottom top',
    depth = 0.15,
    invert = false,
  } = options;

  const ref = useRef<T>(null);
  const sign = invert ? 1 : -1;
  const amount = distance ?? sign * depth * 240;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { [axis]: -amount },
        {
          [axis]: amount,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start,
            end,
            scrub,
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [amount, axis, scrub, start, end]);

  return ref;
}

export default useParallax;
