import React, { ElementType } from 'react';
import useParallax from '../hooks/useParallax';

interface ParallaxLayerProps {
  children: React.ReactNode;
  className?: string;
  /** Profundidade do parallax (0 = quase fixo, 1 = move muito). */
  depth?: number;
  axis?: 'x' | 'y';
  invert?: boolean;
  as?: ElementType;
  distance?: number;
}

/**
 * Wrapper que aplica um efeito de parallax GSAP a um grupo de elementos,
 * criando sensaÃ§Ã£o de profundidade (camadas a velocidades diferentes).
 */
export default function ParallaxLayer({
  children,
  className = '',
  depth = 0.2,
  axis = 'y',
  invert = false,
  as,
  distance,
}: ParallaxLayerProps) {
  const ref = useParallax<HTMLDivElement>({ depth, axis, invert, distance });
  const Tag = (as || 'div') as ElementType;
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}



