// src/components/Layout.tsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import AirplaneBackground from './AirplaneBackground';
import '../index.css';

interface LayoutProps {
  children: React.ReactNode;
  hideNavbar?: boolean;
}

export default function Layout({ children, hideNavbar = false }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-transparent text-white antialiased relative">
      {!hideNavbar && <Navbar />}
      {children}
      {location.pathname === '/' && <AirplaneBackground />}
    </div>
  );
}
