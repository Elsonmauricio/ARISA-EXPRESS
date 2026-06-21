import React, { Suspense, useLayoutEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Float, ContactShadows, Environment, Stars } from '@react-three/drei';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import FlightArc from './FlightArc.jsx';
import EarthGlobe from './EarthGlobe.jsx';

gsap.registerPlugin(ScrollTrigger);

function SceneContent() {
  const { camera } = useThree();
  const sceneRef = useRef();

  useLayoutEffect(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#main-wrapper",
        id: "main-trigger",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5,
      }
    });

    tl.to(camera.position, { x: -3, y: 1.5, z: 7, ease: "power2.inOut" }, "about")
      .to(camera.rotation, { y: 0.5, ease: "power2.inOut" }, "about")
      .to(sceneRef.current.position, { y: -10, ease: "power2.in" }, "services")
      .to(camera.position, { x: 0, y: 0, z: 3, ease: "expo.inOut" }, "tracking");

    return () => {
      if (ScrollTrigger.getById("main-trigger")) ScrollTrigger.getById("main-trigger").kill();
    };
  }, [camera]);

  return (
    <group ref={sceneRef}>
      {/* Globo + Arco (com avião dentro) */}
      <group position={[0, 0, 0]} rotation={[0.1, 0, 0]}>
        <EarthGlobe />
        <FlightArc radius={1.5} />
      </group>

      {/* Removido o avião extra que estava aqui com scale={4} */}
    </group>
  );
}

export default function LogisticFlow3D() {
  return (
    <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }}>
      <color attach="background" args={['#000000']} />
      
      <ambientLight intensity={0.2} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} castShadow color="#F6EBBF" />
      <pointLight position={[-10, -10, -10]} color="#7C3AED" intensity={1} />
      
      <Suspense fallback={null}>
        <SceneContent />
        <ContactShadows position={[0, -1.6, 0]} opacity={0.4} scale={10} blur={2.5} far={4} color="#7C3AED" />
        <Environment preset="city" />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      </Suspense>

      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
    </Canvas>
  );
}