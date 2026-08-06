import React, { Suspense, useEffect, useState } from 'react';
import { Float } from '@react-three/drei';
import { GroupProps } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as THREE from 'three';

const MODEL_URL = '/models/cardboard_box.glb';
const DRACO_DECODER_PATH = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/';

let cachedScene: THREE.Group | null = null;
let cachedLoader: GLTFLoader | null = null;
let cachedDracoLoader: DRACOLoader | null = null;

function Mailbox3DInner(props: GroupProps) {
  const [gltfScene, setGltfScene] = useState<THREE.Group | null>(cachedScene);

  useEffect(() => {
    if (cachedScene) {
      setGltfScene(cachedScene);
      return;
    }

    if (!cachedLoader) {
      cachedLoader = new GLTFLoader();
      cachedDracoLoader = new DRACOLoader();
      cachedDracoLoader.setDecoderPath(DRACO_DECODER_PATH);
      cachedLoader.setDRACOLoader(cachedDracoLoader);
    }

    let cancelled = false;
    fetch(MODEL_URL)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load model');
        return res.arrayBuffer();
      })
      .then((data) => {
        if (cancelled) return;
        cachedLoader!.parse(data, '', (gltf) => {
          cachedScene = gltf.scene;
          setGltfScene(gltf.scene);
        });
      })
      .catch((err) => {
        console.error('Mailbox3D load error:', err);
        if (!cancelled) setGltfScene(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group dispose={null} {...props}>
        {gltfScene ? (
          <primitive object={gltfScene} scale={2.5} />
        ) : (
          <mesh>
            <boxGeometry args={[1.2, 1, 0.8]} />
            <meshStandardMaterial color="#C4A265" roughness={0.6} metalness={0.1} />
          </mesh>
        )}
      </group>
    </Float>
  );
}

export function Mailbox3D(props: GroupProps) {
  return (
    <Suspense fallback={null}>
      <Mailbox3DInner {...props} />
    </Suspense>
  );
}



