// src/components/three/RealisticPlane.jsx
import { forwardRef, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';

const RealisticPlane = forwardRef((props, ref) => {
  // Tenta carregar o modelo
  let scene = null;
  try {
    const { scene: loadedScene } = useGLTF('/models/airplane.glb');
    scene = loadedScene;
  } catch (e) {
    console.warn('Modelo de avião não encontrado. Usando fallback.');
  }

  if (scene) {
    const clonedScene = useMemo(() => scene.clone(), [scene]);
    // O scale será controlado pelo FlightArc via ref, por isso não definimos aqui
    return (
      <group ref={ref} {...props}>
        <primitive object={clonedScene} />
      </group>
    );
  }

  // Fallback: avião pequeno e realista
  return (
    <group ref={ref} {...props}>
      {/* Fuselagem (lilas) */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.04, 0.2, 8, 16]} />
        <meshStandardMaterial color="#A974FF" roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Bico */}
      <mesh position={[0.14, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.04, 0.07, 16]} />
        <meshStandardMaterial color="#d0d0d0" roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Asas */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.1, 0.015, 0.3]} />
        <meshStandardMaterial color="#D4AF37" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Pontas das asas (vermelho) */}
      <mesh position={[0, 0, 0.16]}>
        <boxGeometry args={[0.02, 0.015, 0.04]} />
        <meshStandardMaterial color="#cc0000" />
      </mesh>
      <mesh position={[0, 0, -0.16]}>
        <boxGeometry args={[0.02, 0.015, 0.04]} />
        <meshStandardMaterial color="#cc0000" />
      </mesh>
      {/* Estabilizador horizontal */}
      <mesh position={[-0.1, 0.005, 0]}>
        <boxGeometry args={[0.05, 0.01, 0.12]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.5} />
      </mesh>
      {/* Leme vertical */}
      <mesh position={[-0.1, 0.05, 0]}>
        <boxGeometry args={[0.04, 0.07, 0.01]} />
        <meshStandardMaterial color="#d0d0d0" roughness={0.4} />
      </mesh>
      {/* Janelas */}
      {[-0.06, -0.02, 0.02, 0.06].map((z) => (
        <mesh key={z} position={[0.04, 0.02, z]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshStandardMaterial color="#1a1a2e" emissive="#1a1a2e" emissiveIntensity={0.3} />
        </mesh>
      ))}
    </group>
  );
});

RealisticPlane.displayName = 'RealisticPlane';
useGLTF.preload('/models/airplane.glb');

export default RealisticPlane;