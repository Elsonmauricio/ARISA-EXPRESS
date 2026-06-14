'use client';
import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Html, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import Plane3D from './Plane';

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="text-[10px] tracking-[0.3em] uppercase text-white/60">
        {progress.toFixed(0)}%
      </div>
    </Html>
  );
}

function FlowingBox({ offset = 0, color = '#A974FF', emissive = '#7C3AED' }) {
  const ref = useRef();
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2.2, -0.4, 0),
        new THREE.Vector3(-0.8, 0.2, 0.6),
        new THREE.Vector3(0.8, 0.2, -0.6),
        new THREE.Vector3(2.2, -0.4, 0),
      ]),
    []
  );
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = ((clock.getElapsedTime() * 0.18) + offset) % 1;
    const pos = curve.getPointAt(t);
    ref.current.position.copy(pos);
    ref.current.rotation.y = clock.getElapsedTime() * 0.3 + offset * 6;
    ref.current.rotation.x = clock.getElapsedTime() * 0.2;
  });
  return (
    <mesh ref={ref}>
      <boxGeometry args={[0.28, 0.28, 0.28]} />
      <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.35} metalness={0.3} roughness={0.5} />
    </mesh>
  );
}

function FlowPath() {
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2.2, -0.4, 0),
        new THREE.Vector3(-0.8, 0.2, 0.6),
        new THREE.Vector3(0.8, 0.2, -0.6),
        new THREE.Vector3(2.2, -0.4, 0),
      ]),
    []
  );
  const geom = useMemo(() => {
    const pts = curve.getPoints(120);
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [curve]);
  return (
    <group>
      <line geometry={geom}>
        <lineBasicMaterial color="#D4AF37" transparent opacity={0.7} />
      </line>
      <line geometry={geom} scale={1.005}>
        <lineBasicMaterial color="#A974FF" transparent opacity={0.35} />
      </line>
    </group>
  );
}

function FlyingPlane() {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.position.set(Math.cos(t * 0.4) * 2.2, 1.0 + Math.sin(t * 0.6) * 0.15, Math.sin(t * 0.4) * 2.2);
    ref.current.lookAt(0, 0.3, 0);
    ref.current.rotateY(-Math.PI / 2);
    ref.current.scale.setScalar(1.4);
  });
  return <Plane3D ref={ref} />;
}

export default function LogisticFlow3D() {
  return (
    <Canvas
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 1.3, 4.2], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
    >
      <Suspense fallback={<Loader />}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 4, 3]} intensity={1.1} color="#FFF6E0" />
        <pointLight position={[-3, 1, -2]} intensity={0.6} color="#A974FF" />
        <pointLight position={[3, -1, 2]} intensity={0.5} color="#D4AF37" />

        <FlowPath />

        {/* Caixas em fluxo (cores alternadas lilás/dourado) */}
        <FlowingBox offset={0.0}  color="#A974FF" emissive="#7C3AED" />
        <FlowingBox offset={0.2}  color="#D4AF37" emissive="#B89327" />
        <FlowingBox offset={0.4}  color="#BE93FF" emissive="#A974FF" />
        <FlowingBox offset={0.6}  color="#F6EBBF" emissive="#D4AF37" />
        <FlowingBox offset={0.8}  color="#A974FF" emissive="#7C3AED" />

        {/* Pad central (“hub”) */}
        <Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
          <mesh position={[0, 0.15, 0]}>
            <torusGeometry args={[0.35, 0.05, 16, 64]} />
            <meshStandardMaterial color="#D4AF37" emissive="#D4AF37" emissiveIntensity={0.6} metalness={0.7} roughness={0.2} />
          </mesh>
        </Float>

        {/* Avião a sobrevoar */}
        <FlyingPlane />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.6}
          minPolarAngle={Math.PI / 2.8}
          maxPolarAngle={Math.PI / 1.8}
        />
      </Suspense>
    </Canvas>
  );
}
