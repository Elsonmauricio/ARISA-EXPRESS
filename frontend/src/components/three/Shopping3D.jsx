'use client';
import React from 'react';

export default function Shopping3D() {
  return (
    <group scale={1.8} rotation={[0.15, -0.4, 0]}>
      {/* Corpo da Sacola (Lilás) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.7, 0.8, 0.4]} />
        <meshStandardMaterial color="#7C3AED" metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Dobra superior da Sacola */}
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[0.74, 0.06, 0.44]} />
        <meshStandardMaterial color="#9b59b6" />
      </mesh>
      {/* Alça (Dourada) */}
      <mesh position={[0, 0.6, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.18, 0.03, 8, 24, Math.PI]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Caixa de Presente (Cartão) dentro da sacola */}
      <group position={[0, -0.05, 0.05]}>
        <mesh>
          <boxGeometry args={[0.34, 0.34, 0.34]} />
          <meshStandardMaterial color="#CD853F" />
        </mesh>
        {/* Fita (Dourada) */}
        <mesh position={[0, 0.18, 0]}>
          <boxGeometry args={[0.36, 0.04, 0.04]} />
          <meshStandardMaterial color="#D4AF37" />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <boxGeometry args={[0.04, 0.04, 0.36]} />
          <meshStandardMaterial color="#D4AF37" />
        </mesh>
      </group>
    </group>
  );
}
