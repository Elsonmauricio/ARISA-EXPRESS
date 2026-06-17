'use client';
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const latLonToVec3 = (lat, lon, radius) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
};

export default function Globe() {
  const groupRef = useRef();
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Núcleo do Globo */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.5, 64, 64]} />
        <meshStandardMaterial 
          color="#050505" 
          roughness={0.1} 
          metalness={0.9}
          emissive="#7C3AED"
          emissiveIntensity={0.05}
        />
      </mesh>

      {/* Rede de Conectividade (Wireframe Dourado) */}
      <mesh>
        <sphereGeometry args={[1.52, 32, 32]} />
        <meshStandardMaterial 
          color="#D4AF37" 
          wireframe 
          transparent 
          opacity={0.15} 
        />
      </mesh>
    </group>
  );
}