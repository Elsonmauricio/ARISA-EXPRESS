// src/components/Layout.tsx
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import AirplaneBackground from './AirplaneBackground';
import '../index.css';
import { useT } from '../i18n/LanguageContext';

interface LayoutProps {
  children: React.ReactNode;
  hideNavbar?: boolean;
}

export default function Layout({ children, hideNavbar = false }: LayoutProps) {
  const { t } = useT();
  const location = useLocation();
  useEffect(() => {
    const verifyCSS = () => {
      const bodyBg = window.getComputedStyle(document.body).backgroundColor;
      if (bodyBg !== 'rgb(0, 0, 0)' && bodyBg !== '#000000') {
        console.error(t('layout.cssError'));
      } else {
        console.log(t('layout.cssOk'));
      }
    };
    verifyCSS();
  }, [t]);

  return (
    <div className="min-h-screen bg-transparent text-white antialiased relative">
      {!hideNavbar && <Navbar />}
      {children}
      {location.pathname === '/' && <AirplaneBackground />}
    </div>
  );
}
