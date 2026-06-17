'use client';
import React from 'react';

export default function Forklift3D() {
  return (
    <group scale={1.8} rotation={[0.2, -0.5, 0]}>
      {/* Corpo principal (Amarelo) */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.6, 0.4, 0.4]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Cabine */}
      <mesh position={[-0.1, 0.5, 0]}>
        <boxGeometry args={[0.3, 0.3, 0.35]} />
        <meshStandardMaterial color="#1a1a1a" transparent opacity={0.7} />
      </mesh>
      {/* Mastro (Cinza) */}
      <mesh position={[0.35, 0.4, 0]}>
        <boxGeometry args={[0.05, 0.8, 0.3]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      {/* Garfos */}
      <mesh position={[0.5, 0.1, 0]}>
        <boxGeometry args={[0.3, 0.02, 0.25]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {/* Rodas */}
      {[-0.2, 0.2].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0.05, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.1, 12]} />
            <meshStandardMaterial color="#000" />
          </mesh>
          <mesh position={[x, 0.05, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.1, 12]} />
            <meshStandardMaterial color="#000" />
          </mesh>
        </group>
      ))}
      {/* Palete e Caixa */}
      <group position={[0.55, 0.15, 0]}>
        <mesh>
          <boxGeometry args={[0.35, 0.05, 0.35]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[0.25, 0.25, 0.25]} />
          <meshStandardMaterial color="#CD853F" />
        </mesh>
      </group>
    </group>
  );
}