import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Html, useProgress } from '@react-three/drei';
import Globe from './Globe';
import FlightArc from './FlightArc';

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-lilac-500/20" />
          <div className="absolute inset-0 rounded-full border-2 border-t-gold border-r-lilac-400 animate-spin" />
        </div>
        <div className="text-xs tracking-[0.3em] uppercase text-white/70">
          {progress.toFixed(0)}% • a carregar
        </div>
      </div>
    </Html>
  );
}

export default function Scene3D() {
  return (
    <Canvas
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0.4, 4.6], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
    >
      <Suspense fallback={<Loader />}>
        <color attach="background" args={[0, 0, 0]} />

        {/* Luzes */}
        <ambientLight intensity={0.45} />
        <directionalLight position={[5, 3, 5]} intensity={1.4} color="#FFF6E0" />
        <pointLight position={[-4, -2, -3]} intensity={0.7} color="#A974FF" />
        <pointLight position={[3, 2, 3]} intensity={0.4} color="#D4AF37" />

        {/* Estrelas */}
        <Stars radius={50} depth={50} count={3500} factor={4} saturation={0} fade speed={0.4} />

        {/* Globo + arco */}
        <group rotation={[0.15, -0.4, 0]}>
          <Globe />
          <FlightArc />
        </group>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.4}
          minPolarAngle={Math.PI / 2.6}
          maxPolarAngle={Math.PI / 1.7}
        />
      </Suspense>
    </Canvas>
  );
}
