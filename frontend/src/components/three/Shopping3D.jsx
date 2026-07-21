// Adicione esta linha no topo do Shopping3D.jsx
import { useGLTF } from '@react-three/drei';

export function Shopping3D(props) {
  const { scene } = useGLTF('/models/carrito_de_compras__mid-poly.glb'); 

  return (
    <primitive 
      object={scene} 
      // 📐 Reduza a escala aqui (ex: 0.1, 0.05 ou até 0.01 dependendo do tamanho)
      scale={0.3} 
      {...props} 
    />
  );
}

// Opcional: fazer o pré-carregamento do modelo para melhor performance
useGLTF.preload('/models/carrito_de_compras__mid-poly.glb');