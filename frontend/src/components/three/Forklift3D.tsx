import { useGLTF } from '@react-three/drei';
import { GroupProps } from '@react-three/fiber';

interface Forklift3DProps extends GroupProps {
  // Adicione quaisquer props específicas do seu componente aqui, se houver
}

export function Forklift3D(props: Forklift3DProps) {
  const { scene } = useGLTF('/models/empilhadeira_generica_v1.glb'); 

  return <primitive object={scene} {...props} />;
}


