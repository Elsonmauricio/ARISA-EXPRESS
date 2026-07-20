import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface ParallaxOptions {
  /** Distância de deslocamento em px (positivo = sobe, negativo = desce). */
  distance?: number;
  /** Eixo do deslocamento. */
  axis?: 'x' | 'y';
  /** Suavização do scrub (1 = linear, >1 = mais suave). */
  scrub?: number;
  /** ScrollTrigger start. */
  start?: string;
  /** ScrollTrigger end. */
  end?: string;
  /** Profundidade relativa (0 = fixo, 1 = desloca bastante). Ignora distance se definido. */
  depth?: number;
  /** Direção invertida. */
  invert?: boolean;
}

/**
 * Aplica um efeito de parallax GSAP a um elemento ref enquanto a página faz scroll.
 * Devolve uma ref para colocar no elemento alvo.
 */
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
