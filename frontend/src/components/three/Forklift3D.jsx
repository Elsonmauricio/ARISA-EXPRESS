// Adicione esta linha no topo do Forklift3D.jsx
import { useGLTF } from '@react-three/drei';

export function Forklift3D(props) {
  // O seu código do useGLTF na linha 5...
  const { scene } = useGLTF('/models/empilhadeira_generica_v1.glb'); 

  return <primitive object={scene} {...props} />;
}

// Opcional: fazer o pré-carregamento do modelo para melhor performance
useGLTF.preload('/models/empilhadeira_generica_v1.glb');