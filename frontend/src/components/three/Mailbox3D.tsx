import { useGLTF } from '@react-three/drei';
import { GroupProps } from '@react-three/fiber';

interface Mailbox3DProps extends GroupProps {
  // Adicione quaisquer props específicas do seu componente aqui, se houver
}

export function Mailbox3D(props: Mailbox3DProps) {
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
