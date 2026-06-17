'use client';
import React from 'react';
import { Float } from '@react-three/drei';

export default function Container3D({ position, color = "#D4AF37", ...props }) {
  return (
    <Float speed={1.5} rotationIntensity={1} floatIntensity={1}>
      <mesh position={position} {...props}>
        <boxGeometry args={[0.4, 0.4, 1]} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.7} 
          roughness={0.2}
          emissive={color}
          emissiveIntensity={0.1}
        />
      </mesh>
    </Float>
  );
}