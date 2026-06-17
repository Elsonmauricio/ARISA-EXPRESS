'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { latLonToVec3 } from './Globe.jsx';
import Plane3D from './Plane.jsx';

function buildArc(start, end, height = 0.6, segments = 80) {
  const mid = start.clone().add(end).multiplyScalar(0.5);
  mid.setLength(mid.length() + height);
  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  return { curve, points: curve.getPoints(segments) };
}

export default function FlightArc({
  from = { lat: 38.72, lon: -9.14, label: 'Lisbon' },
  to   = { lat: -8.84, lon: 13.23, label: 'Luands' },
  radius = 1.62,
}) {
  const planeRef = useRef();

  const { curve, points, startVec, endVec } = useMemo(() => {
    const s = latLonToVec3(from.lat, from.lon, radius);
    const e = latLonToVec3(to.lat, to.lon, radius);
    const { curve, points } = buildArc(s, e, 0.55);
    return { curve, points, startVec: s, endVec: e };
  }, [from, to, radius]);

  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  useFrame(({ clock }) => {
    const t = (clock.getElapsedTime() * 0.06) % 1;
    const pos = curve.getPointAt(t);
    const next = curve.getPointAt(Math.min(t + 0.01, 1));
    if (planeRef.current) {
      planeRef.current.position.copy(pos);
      planeRef.current.lookAt(next);
      planeRef.current.rotateY(-Math.PI / 2);
      // Escala pequena conforme distância
      planeRef.current.scale.setScalar(0.75);
    }
  });

  return (
    <group>
      {/* Linha dourada principal */}
      <line geometry={geometry}>
        <lineBasicMaterial color="#FFD700" transparent opacity={0.8} />
      </line>
      {/* Linha lilás sobreposta para criar glow */}
      <line geometry={geometry} scale={1.002}>
        <lineBasicMaterial color="#FF00FF" transparent opacity={0.5} />
      </line>

      {/* Marker Lisboa */}
      <group position={startVec}>
        <mesh><sphereGeometry args={[0.025, 16, 16]} /><meshBasicMaterial color="#D4AF37" /></mesh>
        <mesh><sphereGeometry args={[0.05, 16, 16]} /><meshBasicMaterial color="#D4AF37" transparent opacity={0.25} /></mesh>
        <Html distanceFactor={6} center position={[0, 0.09, 0]}>
          <div className="text-[10px] tracking-widest uppercase text-white whitespace-nowrap px-2 py-0.5 rounded bg-black/70 border border-gold/40">
            {from.label}
          </div>
        </Html>
      </group>

      {/* Marker Luanda */}
      <group position={endVec}>
        <mesh><sphereGeometry args={[0.025, 16, 16]} /><meshBasicMaterial color="#A974FF" /></mesh>
        <mesh><sphereGeometry args={[0.05, 16, 16]} /><meshBasicMaterial color="#A974FF" transparent opacity={0.3} /></mesh>
        <Html distanceFactor={6} center position={[0, 0.09, 0]}>
          <div className="text-[10px] tracking-widest uppercase text-white whitespace-nowrap px-2 py-0.5 rounded bg-black/70 border border-lilac-400/40">
            {to.label}
          </div>
        </Html>
      </group>

      {/* Avião low-poly a seguir a curva */}
      <Plane3D ref={planeRef} />
    </group>
  );
}
