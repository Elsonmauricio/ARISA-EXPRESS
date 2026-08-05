import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, ContactShadows } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ErrorBoundary } from './ErrorBoundary';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const MODEL_URL = '/models/Arisa-express.glb';
const DRACO_DECODER_PATH = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/';

// Cache module-level para evitar recarregar o modelo 3D em cada montagem
let cachedScene: THREE.Group | null = null;
let cachedLoader: GLTFLoader | null = null;
let cachedDracoLoader: DRACOLoader | null = null;

function Airplane() {
  const group = useRef<THREE.Group>(null);
  const [gltfScene, setGltfScene] = useState<THREE.Group | null>(null);
  const storyProgress = useRef(0);
  const scrollProgress = useRef(0);

  useEffect(() => {
    if (cachedScene) {
      setGltfScene(cachedScene);
      return;
    }

    if (!cachedLoader) {
      cachedLoader = new GLTFLoader();
      cachedDracoLoader = new DRACOLoader();
      cachedDracoLoader.setDecoderPath(DRACO_DECODER_PATH);
      cachedLoader.setDRACOLoader(cachedDracoLoader);
    }

    let cancelled = false;
    fetch(MODEL_URL)
      .then((res) => res.arrayBuffer())
      .then((data) => {
        if (cancelled) return;
        cachedLoader!.parse(data, '',
          (gltf) => {
            cachedScene = gltf.scene;
            setGltfScene(gltf.scene);
          },
        );
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onStory = (e: Event) => {
      const d = (e as CustomEvent<number>).detail;
      if (typeof d === 'number') storyProgress.current = d;
    };
    window.addEventListener('storytelling:progress', onStory as EventListener);
    return () =>     window.removeEventListener('storytelling:progress', onStory as EventListener);
  }, []);

  useEffect(() => {
    const updateScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgress.current = docHeight > 0 ? scrollY / docHeight : 0;
    };
    window.addEventListener('scroll', updateScroll, { passive: true });
    updateScroll();
    return () => window.removeEventListener('scroll', updateScroll);
  }, []);

  useFrame((state) => {
    if (!group.current || !gltfScene) return;
    const t = state.clock.elapsedTime;
    
    const targetRotationY = scrollProgress.current * Math.PI * 2;
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetRotationY, 0.05);
    
    group.current.position.y = Math.sin(t * 0.6) * 0.15;
    const zoom = 1 - storyProgress.current * 0.25;
    group.current.scale.setScalar(THREE.MathUtils.lerp(group.current.scale.x, zoom, 0.05));
  });

  return (
    <Float speed={1.5} rotationIntensity={0} floatIntensity={0.6}>
      <group ref={group} dispose={null}>
        {gltfScene && <primitive object={gltfScene} scale={1.4} />}
      </group>
    </Float>
  );
}

function Scene({ isMobile }: { isMobile: boolean }) {
  return (
    <>
      <color attach="background" args={['#E8D9F5']} />
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 10, 5]} intensity={2.0} color="#ffffff" />
      <directionalLight position={[-5, 5, -5]} intensity={1.0} color="#ffffff" />
      <pointLight position={[0, 5, 0]} intensity={1.5} color="#ffffff" distance={20} decay={2} />
      <Suspense fallback={null}>
        <Airplane />
        <Stars radius={90} depth={50} count={isMobile ? 500 : 2500} factor={3} saturation={0.9} fade speed={0.6} />
        <ContactShadows position={[0, -1.5, 0]} opacity={isMobile ? 0.1 : 0.35} scale={isMobile ? undefined : 10} blur={isMobile ? 5 : 2.5} far={4} color="#ffffff" />
      </Suspense>
    </>
  );
}

export default function AirplaneBackground() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div id="airplane-background" className="fixed inset-0 z-0 overflow-hidden pointer-events-none will-change-transform">
      <ErrorBoundary fallback={null}>
         <Canvas 
           dpr={isMobile ? 1 : [1, 1.8]} 
           camera={{ position: [0, 0, 6], fov: 45 }}
         >
          <Scene isMobile={isMobile} />
        </Canvas>
      </ErrorBoundary>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_30%,_rgba(232,217,245,0.3)_100%)]" />
    </div>
  );
}
