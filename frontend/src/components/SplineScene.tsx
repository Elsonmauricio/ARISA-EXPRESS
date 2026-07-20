import { useEffect, useRef } from 'react';
import '@splinetool/viewer';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Cena exportada localmente (avião): ficheiro em /public/scene.splinecode
// Evita dependência de CORS/rede e o erro 403 do link my.spline.design.
const SCENE_URL = '/scene.splinecode';
// Fallback para cena pública (status 200) caso não exista o ficheiro local:
// const SCENE_URL = 'https://prod.spline.design/7p8MjvZD7PZzRnKf/scene.splinecode';

/**
 * Fundo 3D (Spline) em camada fixa atrás do conteúdo.
 * Este é o objeto 3D principal do site (cena 7p8MjvZD7PZzRnKf).
 * Reage ao scroll com parallax suave e, durante o storytelling, ao seu
 * progresso (0..1) para criar zoom/profundidade sincronizados com a narrativa.
 */
export default function SplineScene() {
  const wrapRef = useRef<HTMLDivElement>(null);

  // Progresso do storytelling (0..1) para sincronizar o zoom do objeto 3D.
  const storyProgress = useRef(0);

  useEffect(() => {
    const wrapper = wrapRef.current;
    if (!wrapper) return;

    const onStory = (e: Event) => {
      const detail = (e as CustomEvent<number>).detail;
      if (typeof detail === 'number') storyProgress.current = detail;
    };
    window.addEventListener('storytelling:progress', onStory as EventListener);

    // Parallax do fundo 3D ligado ao scroll da página.
    const ctx = gsap.context(() => {
      gsap.fromTo(
        wrapper,
        { yPercent: 0, scale: 1 },
        {
          yPercent: 12,
          scale: 1.08,
          ease: 'none',
          scrollTrigger: {
            trigger: document.body,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1.2,
          },
        }
      );
    }, wrapper);

    // rAF: aplica zoom suave do objeto 3D conforme o progresso do storytelling.
    let raf = 0;
    let curZoom = 1;
    const tick = () => {
      const targetZoom = 1 + storyProgress.current * 0.25;
      curZoom += (targetZoom - curZoom) * 0.06;
      gsap.set(wrapper, { scale: 1.08 * curZoom });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('storytelling:progress', onStory as EventListener);
      cancelAnimationFrame(raf);
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none will-change-transform"
    >
      {/* O web component <spline-viewer> carrega e renderiza a cena 3D. */}
      <spline-viewer
        url={SCENE_URL}
        loading-anim-type="none"
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      {/* Atmosfera: vinheta para manter legibilidade do conteúdo por cima da cena 3D */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_30%,_rgba(0,0,0,0.55)_100%)]" />
    </div>
  );
}
