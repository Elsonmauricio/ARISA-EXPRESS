// src/components/Gallery.tsx
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Masonry from 'react-responsive-masonry';

gsap.registerPlugin(ScrollTrigger);

interface GalleryImage {
  url: string;
  title: string;
  category: string;
}

const galleryImages: GalleryImage[] = [
  {
    url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop',
    title: 'Armazém Luanda',
    category: 'Infraestrutura',
  },
  {
    url: 'https://images.unsplash.com/photo-1566443280617-35db331c54fb?w=800&h=800&fit=crop',
    title: 'Avião de Carga',
    category: 'Transporte',
  },
  {
    url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
    title: 'Centro de Distribuição',
    category: 'Infraestrutura',
  },
  {
    url: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&h=500&fit=crop',
    title: 'Equipa Profissional',
    category: 'Equipa',
  },
  {
    url: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&h=700&fit=crop',
    title: 'Gestão de Encomendas',
    category: 'Processos',
  },
  {
    url: 'https://images.unsplash.com/photo-1605732562742-3023a888e56e?w=800&h=600&fit=crop',
    title: 'Logística Moderna',
    category: 'Processos',
  },
];

export default function Gallery() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.gallery-item', {
        scrollTrigger: {
          trigger: '.gallery-grid',
          start: 'top 80%',
        },
        opacity: 0,
        scale: 0.8,
        stagger: 0.1,
        duration: 1,
        ease: 'power3.out',
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="galeria"
      ref={sectionRef}
      className="py-20 bg-gradient-to-br from-[#0a0015] via-black to-[#0a0015] relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#9b59b6] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#D4AF37] rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-[#9b59b6] to-[#D4AF37] bg-clip-text text-transparent">
            Nossa Galeria
          </h2>
          <p className="text-gray-300 text-xl max-w-3xl mx-auto">
            Conheça nossas instalações e processos de trabalho
          </p>
        </div>

        <div className="gallery-grid">
          <Masonry columnsCount={3} gutter="20px">
            {galleryImages.map((image, index) => (
              <div
                key={index}
                className="gallery-item group relative overflow-hidden rounded-2xl cursor-pointer"
              >
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-auto object-cover transform group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  <span className="text-[#D4AF37] text-sm font-semibold mb-2">
                    {image.category}
                  </span>
                  <h3 className="text-white text-xl font-bold">{image.title}</h3>
                </div>
              </div>
            ))}
          </Masonry>
        </div>
      </div>
    </section>
  );
}