import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, Stars, ContactShadows } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const MODEL_URL = '/models/Arisa-express.glb';

function Airplane() {
  const group = useRef<THREE.Group>(null);
  const gltfRef = useRef<THREE.Group | null>(null);
  const [gltfScene, setGltfScene] = useState<THREE.Group | null>(null);
  const storyProgress = useRef(0);

  useEffect(() => {
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    loader.setDRACOLoader(dracoLoader);

    fetch(MODEL_URL)
      .then((res) => res.arrayBuffer())
      .then((data) => {
        loader.parse(data, '', 
          (gltf) => {
            gltfRef.current = gltf.scene;
            setGltfScene(gltf.scene);
            console.log('Model loaded successfully:', MODEL_URL);
          },
          (err) => console.error('Error parsing GLB:', err)
        );
      })
      .catch((err) => console.error('Error loading model:', err));
  }, []);

  useEffect(() => {
    const onStory = (e: Event) => {
      const d = (e as CustomEvent<number>).detail;
      if (typeof d === 'number') storyProgress.current = d;
    };
    window.addEventListener('storytelling:progress', onStory as EventListener);
    return () => window.removeEventListener('storytelling:progress', onStory as EventListener);
  }, []);

  useFrame((state) => {
    if (!group.current || !gltfScene) return;
    const t = state.clock.elapsedTime;
    group.current.rotation.y = t * 0.15;
    group.current.position.y = Math.sin(t * 0.6) * 0.15;
    const zoom = 1 - storyProgress.current * 0.25;
    group.current.scale.setScalar(THREE.MathUtils.lerp(group.current.scale.x, zoom, 0.05));
  });

  return (
    <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.6}>
      <group ref={group} dispose={null}>
        {gltfScene && <primitive object={gltfScene} scale={1.4} />}
      </group>
    </Float>
  );
}

function Scene() {
  return (
    <>
      <color attach="background" args={['#050509']} />
      <ambientLight intensity={0.5} />
      <spotLight position={[8, 10, 8]} angle={0.3} penumbra={1} intensity={1.5} color="#F6EBBF" />
      <pointLight position={[-8, -4, -4]} color="#7C3AED" intensity={1.0} />
      <pointLight position={[-6, 2, 0]} color="#60A5FA" intensity={40} distance={12} decay={2} />
      <pointLight position={[6, 2, 0]} color="#F472B6" intensity={40} distance={12} decay={2} />
      <pointLight position={[0, 3, -6]} color="#A78BFA" intensity={50} distance={12} decay={2} />
      <Suspense fallback={null}>
        <Airplane />
        <Stars radius={90} depth={50} count={2500} factor={3} saturation={0} fade speed={0.6} />
        <ContactShadows position={[0, -1.5, 0]} opacity={0.35} scale={10} blur={2.5} far={4} color="#7C3AED" />
      </Suspense>
    </>
  );
}

export default function AirplaneBackground() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapRef.current;
    if (!wrapper) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        wrapper,
        { yPercent: 0, scale: 1 },
        {
          yPercent: 10,
          scale: 1.05,
          ease: 'none',
          scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 1.2 },
        }
      );
    }, wrapper);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={wrapRef} className="fixed inset-0 z-0 overflow-hidden pointer-events-none will-change-transform">
      <Canvas dpr={[1, 1.8]} camera={{ position: [0, 0, 6], fov: 45 }}>
        <Scene />
      </Canvas>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_30%,_rgba(0,0,0,0.55)_100%)]" />
    </div>
  );
}
