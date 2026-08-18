import { useGLTF } from '@react-three/drei';
import { GroupProps } from '@react-three/fiber';

interface Shopping3DProps extends GroupProps {
  // Adicione quaisquer props específicas do seu componente aqui, se houver
}

export function Shopping3D(props: Shopping3DProps) {
  const { scene } = useGLTF('/models/carrito_de_compras__mid-poly.glb'); 

  return (
    <primitive 
      object={scene} 
      scale={0.3} 
      {...props} 
    />
  );
}


