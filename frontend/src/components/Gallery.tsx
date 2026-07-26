// src/components/Gallery.tsx
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useT } from '../i18n/LanguageContext';
import entradaImg from '../assets/entrada.jpeg';
import portaImg from '../assets/porta.jpeg';
import cantoEsperaImg from '../assets/canto de espera.jpeg';
import cenarioAnaliseImg from '../assets/cenario de analise.jpeg';


gsap.registerPlugin(ScrollTrigger);

interface GalleryImage {
  url: string;
  title: string;
  category: string;
}

const getGalleryImages = (t) => ([
  {
    url: entradaImg,
    title: t('gallery.entrada'),
    category: t('gallery.cat.facilities'),
  },
  {
    url: portaImg,
    title: t('gallery.porta'),
    category: t('gallery.cat.facilities'),
  },
  {
    url: cantoEsperaImg,
    title: t('gallery.cantoEspera'),
    category: t('gallery.cat.conforto'),
  },
  {
    url: cenarioAnaliseImg,
    title: t('gallery.cenarioAnalise'),
    category: t('gallery.cat.analise'),
  },
]);

export default function Gallery() {
  const { t } = useT();
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (trackRef.current) {
      tweenRef.current = gsap.to(trackRef.current, {
        xPercent: -50,
        ease: 'none',
        duration: 30,
        repeat: -1,
      });
    }

    return () => {
      tweenRef.current?.kill();
    };
  }, []);

  return (
    <section
      id="gallery"
      className="py-20 bg-gradient-to-br from-[#0a0015] via-black to-[#0a0015] relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#9b59b6] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#D4AF37] rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#9b59b6] to-[#D4AF37] bg-clip-text text-transparent">
            {t('gallery.title')}
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
            {t('gallery.subtitle')}
          </p>
        </div>

        <div
          className="relative"
          onMouseEnter={() => tweenRef.current?.pause()}
          onMouseLeave={() => tweenRef.current?.resume()}
        >
          <div ref={trackRef} className="flex gap-5 w-max overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hidden">
            {[...getGalleryImages(t), ...getGalleryImages(t)].map((image, index) => (
              <div
                key={index}
                className="gallery-item group relative overflow-hidden rounded-2xl cursor-pointer flex-shrink-0 w-[calc(100vw-2rem)] sm:w-[320px] md:w-[360px] snap-center"
              >
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  <span className="text-[#D4AF37] text-sm font-semibold mb-2">
                    {image.category}
                  </span>
                  <h3 className="text-white text-xl font-bold">{image.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
