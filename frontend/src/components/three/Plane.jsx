'use client';

/**
 * Plane3D — Modelo 3D estilizado de avião (low-poly procedural).
 * Construído com primitivas Three.js para evitar dependência de GLTF externo.
 * Look premium: fuselagem branca/dourada, asas lilás, motores com glow.
 */

import { forwardRef } from 'react';

const Plane3D = forwardRef(function Plane3D(props, ref) {
  return (
    <group ref={ref} {...props}>
      {/* Fuselagem principal */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.035, 0.16, 8, 16]} />
        <meshStandardMaterial color="#F6EBBF" emissive="#D4AF37" emissiveIntensity={0.2} metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Bico */}
      <mesh position={[0.11, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.035, 0.06, 16]} />
        <meshStandardMaterial color="#D4AF37" emissive="#D4AF37" emissiveIntensity={0.35} metalness={0.7} roughness={0.25} />
      </mesh>

      {/* Asas (par) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.07, 0.012, 0.26]} />
        <meshStandardMaterial color="#A974FF" emissive="#7C3AED" emissiveIntensity={0.3} metalness={0.4} roughness={0.4} />
      </mesh>

      {/* Estabilizador horizontal (cauda) */}
      <mesh position={[-0.085, 0.005, 0]}>
        <boxGeometry args={[0.04, 0.008, 0.11]} />
        <meshStandardMaterial color="#A974FF" emissive="#7C3AED" emissiveIntensity={0.3} metalness={0.4} roughness={0.4} />
      </mesh>

      {/* Leme vertical */}
      <mesh position={[-0.085, 0.04, 0]}>
        <boxGeometry args={[0.04, 0.06, 0.008]} />
        <meshStandardMaterial color="#D4AF37" emissive="#D4AF37" emissiveIntensity={0.3} metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Motores nas asas (com glow) */}
      {[-0.09, 0.09].map((z) => (
        <group key={z} position={[0.005, -0.018, z]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.018, 0.018, 0.06, 12]} />
            <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Glow do motor (lilás) */}
          <mesh position={[-0.035, 0, 0]}>
            <sphereGeometry args={[0.014, 12, 12]} />
            <meshBasicMaterial color="#A974FF" transparent opacity={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
});

export default Plane3D;
