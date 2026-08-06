import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
const AirplaneBackground = React.lazy(() => import('./AirplaneBackground'));
import '../index.css';

interface LayoutProps {
  children: React.ReactNode;
  hideNavbar?: boolean;
}

export default function Layout({ children, hideNavbar = false }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#9A7DB2] text-slate-800 antialiased relative">
      {!hideNavbar && <Navbar />}
      {children}
      {location.pathname === '/' && (
        <React.Suspense fallback={null}>
          <AirplaneBackground />
        </React.Suspense>
      )}
    </div>
  );
}



