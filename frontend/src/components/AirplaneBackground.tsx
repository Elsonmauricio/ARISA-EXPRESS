import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, Stars, ContactShadows } from '@react-three/drei';
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

function Airplane() {
  const group = useRef<THREE.Group>(null);
  const [gltfScene, setGltfScene] = useState<THREE.Group | null>(null);
  const storyProgress = useRef(0);
  const scrollProgress = useRef(0);
  const loaderRef = useRef<GLTFLoader | null>(null);
  const dracoLoaderRef = useRef<DRACOLoader | null>(null);
  const sceneRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    loader.setDRACOLoader(dracoLoader);
    loaderRef.current = loader;
    dracoLoaderRef.current = dracoLoader;

    let cancelled = false;
    fetch(MODEL_URL)
      .then((res) => res.arrayBuffer())
      .then((data) => {
        if (cancelled) return;
        loader.parse(data, '', 
          (gltf) => {
            sceneRef.current = gltf.scene;
            setGltfScene(gltf.scene);
            console.log('Model loaded successfully:', MODEL_URL);
          },
          (err) => console.error('Error parsing GLB:', err)
        );
      })
      .catch((err) => {
        if (!cancelled) console.error('Error loading model:', err);
      });

    return () => {
      cancelled = true;
      try {
        if (sceneRef.current) {
          sceneRef.current.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.geometry?.dispose();
              if (Array.isArray(child.material)) {
                child.material.forEach((m) => m.dispose());
              } else {
                child.material?.dispose();
              }
            }
          });
        }
        dracoLoaderRef.current?.dispose?.();
        loaderRef.current = null;
        dracoLoaderRef.current = null;
        sceneRef.current = null;
      } catch {
        // ignore cleanup errors
      }
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
      <color attach="background" args={['#D8B9FF']} />
      <ambientLight intensity={0.5} />
      <spotLight position={[8, 10, 8]} angle={0.3} penumbra={1} intensity={1.5} color="#F6EBBF" />
      <pointLight position={[-8, -4, -4]} color="#DDB8FA" intensity={1.0} />
      <pointLight position={[-6, 2, 0]} color="#60A5FA" intensity={40} distance={12} decay={2} />
      <pointLight position={[6, 2, 0]} color="#F472B6" intensity={40} distance={12} decay={2} />
      <pointLight position={[0, 3, -6]} color="#A78BFA" intensity={50} distance={12} decay={2} />
      <Suspense fallback={null}>
        <Airplane />
        <Stars radius={90} depth={50} count={isMobile ? 500 : 2500} factor={3} saturation={0.9} fade speed={0.6} />
        <ContactShadows position={[0, -1.5, 0]} opacity={isMobile ? 0.1 : 0.35} scale={isMobile ? undefined : 10} blur={isMobile ? 5 : 2.5} far={4} color="#DDB8FA" />
      </Suspense>
    </>
  );
}

export default function AirplaneBackground() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const r3fSceneRef = useRef<THREE.Scene | null>(null);
  const canvasDomRef = useRef<HTMLCanvasElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCreated = (state: any) => {
    if (state?.gl) {
      rendererRef.current = state.gl as THREE.WebGLRenderer;
      canvasDomRef.current = state.gl.domElement as HTMLCanvasElement;
    }
    if (state?.scene) {
      r3fSceneRef.current = state.scene as THREE.Scene;
    }
  };

  return (
    <div ref={wrapRef} id="airplane-background" className="fixed inset-0 z-0 overflow-hidden pointer-events-none will-change-transform">
      <ErrorBoundary fallback={null}>
        <Canvas 
          dpr={isMobile ? 1 : [1, 1.8]} 
          camera={{ position: [0, 0, 6], fov: 45 }}
          onCreated={handleCreated}
        >
          <Scene isMobile={isMobile} />
        </Canvas>
      </ErrorBoundary>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_30%,_rgba(26,17,51,0.35)_100%)]" />
    </div>
  );
}



