'use client';
import React, { Suspense, useLayoutEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Float, ContactShadows, Environment, Stars } from '@react-three/drei';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Plane3D from './Plane.jsx';
import Globe from './Globe.jsx';
import FlightArc from './FlightArc.jsx';

gsap.registerPlugin(ScrollTrigger);

function SceneContent() {
  const { camera } = useThree();
  const sceneRef = useRef();

  useLayoutEffect(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#main-wrapper", // Selector do contentor pai que engloba as secções
        id: "main-trigger",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5,
      }
    });

    // Passo 2: Mover câmara para "Sobre Nós"
    tl.to(camera.position, { x: -3, y: 1.5, z: 7, ease: "power2.inOut" }, "about")
      .to(camera.rotation, { y: 0.5, ease: "power2.inOut" }, "about");

    // Passo 3: "Serviços" - Globo afunda e aceleração
    tl.to(sceneRef.current.position, { y: -10, opacity: 0, ease: "power2.in" }, "services");

    // Passo 4: "Rastreamento" - Zoom na encomenda (ou centro)
    tl.to(camera.position, { x: 0, y: 0, z: 3, ease: "expo.inOut" }, "tracking");

    return () => {
      if (ScrollTrigger.getById("main-trigger")) ScrollTrigger.getById("main-trigger").kill();
    };
  }, [camera]);

  return (
    <group ref={sceneRef}>
      {/* Globo e Arcos */}
      <group position={[-3.2, -0.4, 0]}>
        <Globe />
        <FlightArc />
      </group>

      {/* Estrada Low-Poly Cinza */}
      <group position={[2, -1.5, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[20, 2.5]} />
          <meshStandardMaterial color="#222" roughness={1} flatShading />
        </mesh>
        
        {/* Camião Roxo (Camião 1) */}
        <group position={[-4, 0.25, 0.4]}>
          <mesh><boxGeometry args={[1.2, 0.4, 0.4]} /><meshStandardMaterial color="#7C3AED" /></mesh>
          <mesh position={[0.7, -0.1, 0]}><boxGeometry args={[0.3, 0.3, 0.35]} /><meshStandardMaterial color="#333" /></mesh>
        </group>

        {/* Camião Amarelo (Camião 2) */}
        <group position={[-2, 0.25, -0.3]}>
          <mesh><boxGeometry args={[1.2, 0.4, 0.4]} /><meshStandardMaterial color="#D4AF37" /></mesh>
          <mesh position={[0.7, -0.1, 0]}><boxGeometry args={[0.3, 0.3, 0.35]} /><meshStandardMaterial color="#333" /></mesh>
        </group>

        {/* Carrinha Roxa (Carrinha 1) */}
        <group position={[0.5, 0.15, 0.2]}>
          <mesh><boxGeometry args={[0.5, 0.3, 0.25]} /><meshStandardMaterial color="#7C3AED" /></mesh>
        </group>

        {/* Paletes com Caixas */}
        <group position={[2.5, 0.1, -0.1]}>
          <mesh><boxGeometry args={[0.4, 0.05, 0.4]} /><meshStandardMaterial color="#8B4513" /></mesh>
          <mesh position={[0, 0.15, 0]}><boxGeometry args={[0.3, 0.3, 0.3]} /><meshStandardMaterial color="#CD853F" /></mesh>
        </group>

        {/* Carrinhas Adicionais */}
        <group position={[4.5, 0.15, 0.4]}><mesh><boxGeometry args={[0.5, 0.3, 0.25]} /><meshStandardMaterial color="#7C3AED" /></mesh></group>
        <group position={[7, 0.15, -0.2]}><mesh><boxGeometry args={[0.5, 0.3, 0.25]} /><meshStandardMaterial color="#5B21B6" /></mesh></group>
      </group>

      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <group position={[1.5, 1, 1]}>
          <Plane3D scale={4} rotation={[0, Math.PI / 1.5, 0]} />
        </group>
      </Float>
    </group>
  );
}

export default function LogisticFlow3D() {
  return (
    <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }}>
      <color attach="background" args={['#000000']} />
      
      {/* Iluminação de Estúdio Premium */}
      <ambientLight intensity={0.2} />
      <spotLight 
        position={[10, 10, 10]} 
        angle={0.15} 
        penumbra={1} 
        intensity={1.5} 
        castShadow 
        color="#F6EBBF"
      />
      <pointLight position={[-10, -10, -10]} color="#7C3AED" intensity={1} />
      
      <Suspense fallback={null}>
        <SceneContent />
        <ContactShadows 
          position={[0, -1.6, 0]} 
          opacity={0.4} 
          scale={10} 
          blur={2.5} 
          far={4} 
          color="#7C3AED"
        />

        <Environment preset="city" />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      </Suspense>

      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
    </Canvas>
  );
}