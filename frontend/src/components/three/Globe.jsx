'use client';
import { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

const EARTH_TEXTURE = 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg';
const BUMP_TEXTURE  = 'https://threejs.org/examples/textures/planets/earth_normal_2048.jpg';
const SPEC_TEXTURE  = 'https://threejs.org/examples/textures/planets/earth_specular_2048.jpg';

// lat/lon to 3D coords on sphere of radius r
export function latLonToVec3(lat, lon, r = 1) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -r * Math.sin(phi) * Math.cos(theta);
  const z =  r * Math.sin(phi) * Math.sin(theta);
  const y =  r * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

export default function Globe({ radius = 1.6 }) {
  const meshRef = useRef();
  const atmRef = useRef();
  const [map, bump, spec] = useLoader(THREE.TextureLoader, [EARTH_TEXTURE, BUMP_TEXTURE, SPEC_TEXTURE]);

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.05;
    if (atmRef.current)  atmRef.current.rotation.y  += delta * 0.03;
  });

  return (
    <group>
      {/* Earth */}
      <mesh ref={meshRef} castShadow receiveShadow>
        <sphereGeometry args={[radius, 96, 96]} />
        <meshPhongMaterial
          map={map}
          bumpMap={bump}
          bumpScale={0.04}
          specularMap={spec}
          specular={new THREE.Color('#222244')}
          shininess={18}
        />
      </mesh>
      {/* Inner glow halo */}
      <mesh ref={atmRef} scale={1.04}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshBasicMaterial color="#7C3AED" transparent opacity={0.06} side={THREE.BackSide} />
      </mesh>
      {/* Outer atmosphere */}
      <mesh scale={1.12}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshBasicMaterial color="#A974FF" transparent opacity={0.05} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}
