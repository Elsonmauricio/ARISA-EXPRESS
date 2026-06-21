// src/components/Layout.tsx
import React, { useEffect } from 'react';
import Navbar from './Navbar';
import '../index.css';

interface LayoutProps {
  children: React.ReactNode;
  hideNavbar?: boolean;
}

export default function Layout({ children, hideNavbar = false }: LayoutProps) {
  useEffect(() => {
    const verifyCSS = () => {
      const bodyBg = window.getComputedStyle(document.body).backgroundColor;
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
      {!hideNavbar && <Navbar />}
      {children}
    </div>
  );
}