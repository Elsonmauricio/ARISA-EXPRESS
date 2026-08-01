import React, { Suspense, useLayoutEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Float, ContactShadows, Environment, Stars } from '@react-three/drei';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Camera } from 'three'; // Importar o tipo Camera do three

gsap.registerPlugin(ScrollTrigger);

function SceneContent(): React.ReactNode {
  const { camera } = useThree();

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

    tl.to((camera as Camera).position, { x: -3, y: 1.5, z: 7, ease: "power2.inOut" }, "about")
      .to((camera as Camera).rotation, { y: 0.5, ease: "power2.inOut" }, "about")
      .to((camera as Camera).position, { x: 0, y: 0, z: 3, ease: "expo.inOut" }, "tracking");

    return () => {
      if (ScrollTrigger.getById("main-trigger")) {
        ScrollTrigger.getById("main-trigger")?.kill();
      }
    };
  }, [camera]);

  return null;
}

export default function LogisticFlow3D(): JSX.Element {
  return (
    <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }}>
      <color attach="background" args={['#D8B9FF']} />

      <ambientLight intensity={0.2} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} castShadow color="#F6EBBF" />
      <pointLight position={[-10, -10, -10]} color="#b68dd6" intensity={1} />
      
      <Suspense fallback={null}>
        <SceneContent />
        <ContactShadows position={[0, -1.6, 0]} opacity={0.4} scale={10} blur={2.5} far={4} color="#ab7dce" />
        <Environment preset="city" />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0.9} fade speed={1} />
      </Suspense>

      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
    </Canvas>
  );
}



