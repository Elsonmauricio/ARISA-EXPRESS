// Adicione esta linha no topo do Mailbox3D.jsx
import { useGLTF } from '@react-three/drei';

export function Mailbox3D(props) {
  const { scene } = useGLTF('/models/cardboard_box.glb'); 
  

  return (
    <primitive 
      object={scene} 
      // 📐 Reduza a escala aqui (ex: 0.1, 0.05 ou até 0.01 dependendo do tamanho)
      scale={2.5} 
      {...props} 
    />
  );
}

// Opcional: fazer o pré-carregamento do modelo para melhor performance
useGLTF.preload('/models/cardboard_box.glb');