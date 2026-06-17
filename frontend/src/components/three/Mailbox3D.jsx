'use client';
import React from 'react';

export default function Mailbox3D() {
  return (
    <group scale={2} rotation={[0.2, 0.4, 0]}>
      {/* Poste */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.8, 12]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {/* Caixa de Correio (Roxa) */}
      <group position={[0, 0.45, 0.1]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.45, 20, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#7C3AED" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.075, 0]}>
          <boxGeometry args={[0.3, 0.15, 0.45]} />
          <meshStandardMaterial color="#7C3AED" />
        </mesh>
        {/* Bandeirinha (Vermelha) */}
        <mesh position={[0.16, 0.1, 0.1]} rotation={[0, 0, 0.2]}>
          <boxGeometry args={[0.02, 0.2, 0.05]} />
          <meshStandardMaterial color="#ff0000" />
        </mesh>
      </group>
      {/* Caixas de papelão ao lado */}
      <mesh position={[-0.3, -0.25, 0.1]} rotation={[0, 0.5, 0]}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial color="#CD853F" />
      </mesh>
      <mesh position={[0.25, -0.3, 0.3]} rotation={[0, -0.3, 0]}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color="#CD853F" />
      </mesh>
    </group>
  );
}