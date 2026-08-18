import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Float, OrbitControls } from '@react-three/drei';
import { use3DIntersection } from '../hooks/use3DIntersection';

interface Lazy3DProps {
  children: React.ReactNode;
  className?: string;
  camera?: { position: readonly [number, number, number]; fov?: number };
  fallback?: React.ReactNode;
}

function Skeleton3D() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-lilac-500/5 to-gold/5 rounded-2xl">
      <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
    </div>
  );
}

export function Lazy3D({ children, className, camera, fallback }: Lazy3DProps) {
  const { ref, isVisible } = use3DIntersection();
  const defaultCamera = useMemo(() => {
    const cam = camera || { position: [0, 0, 4] as const, fov: 40 };
    return {
      position: cam.position as [number, number, number],
      fov: cam.fov
    };
  }, [camera]);

  return (
    <div ref={ref} className={className}>
      {isVisible ? (
        <Suspense fallback={fallback || <Skeleton3D />}>
          <Canvas camera={defaultCamera}>
            <ambientLight intensity={0.8} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
              {children}
            </Float>
            <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.8} />
          </Canvas>
        </Suspense>
      ) : (
        <Skeleton3D />
      )}
    </div>
  );
}
