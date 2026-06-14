// Renomeado de layot.tsx para Layout.tsx
import React, { useEffect } from 'react';
import '../index.css';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  useEffect(() => {
    // Função para verificar se os estilos globais (index.css) foram carregados corretamente
    const verifyCSS = () => {
      const bodyBg = window.getComputedStyle(document.body).backgroundColor;
      // No index.css definimos background: #000, que o navegador interpreta como rgb(0, 0, 0)
      if (bodyBg !== 'rgb(0, 0, 0)' && bodyBg !== '#000000') {
        console.error('❌ [ERRO DE ESTILO]: O arquivo index.css não foi carregado ou o Tailwind não está ativo.');
      } else {
        console.log('✅ [CSS Check]: Estilos globais carregados com sucesso.');
      }
    };

    verifyCSS();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white antialiased relative">
      {children}
    </div>
  );
}
