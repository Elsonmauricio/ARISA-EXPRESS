// src/App.tsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Hero from './components/Hero';
import About from './components/About';
import Services from './components/Services';
import Tracking from './components/Tracking';
import Stats from './components/Stats';
import Footer from './components/Footer';
import Reveal from './components/Reveal';
import Layout from './components/Layout';
import Contact from './components/Contact';
import Gallery  from './components/Gallery';
import AeroStripe from './components/AeroStripe';
import Seo from './components/Seo';
import Storytelling from './components/Storytelling';
import ParallaxLayer from './components/ParallaxLayer';
import { AnimatePresence } from 'framer-motion';
import { useLenis } from './hooks/useLenis';
import { LanguageProvider, useT } from './i18n/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';

function PageLoader() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#9A7DB2]">
      <div className="w-10 h-10 rounded-full border-2 border-t-gold border-[#4B2170]/30 animate-spin" />
    </div>
  );
}

const ShipmentsPage = lazy(() => import('./pages/ShipmentsPage'));
const Login = lazy(() => import('./pages/LoginPage'));
const Register = lazy(() => import('./pages/RegisterPage'));
const Profile = lazy(() => import('./pages/ProfilePage'));
const Settings = lazy(() => import('./pages/SettingsPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));

function HomePage() {
  const { lang } = useT();

  return (
    <Layout>
      <main className="relative z-10">
        <div id="main-wrapper">
          <Hero key={lang} />
          <div className="relative z-10 container mx-auto max-w-7xl px-4 -mt-4 sm:-mt-8">
            <AeroStripe />
          </div>

          <div className="hidden md:block">
            <Storytelling />
          </div>

          <Reveal y={80} duration={1}>
            <ParallaxLayer depth={0.12} className="will-change-transform">
              <About />
            </ParallaxLayer>
          </Reveal>
          <Reveal y={80} duration={1}><Services /></Reveal>
          <Reveal y={80} duration={1}><Stats /></Reveal>
          <Reveal y={80} duration={1}>
            <ParallaxLayer depth={0.1} className="will-change-transform">
              <Gallery />
            </ParallaxLayer>
          </Reveal>
          <Reveal y={80} duration={1}><Tracking /></Reveal>
          <Reveal y={80} duration={1}><Contact /></Reveal>
          <Reveal y={80} duration={1}><Footer /></Reveal>
        </div>
      </main>
    </Layout>
  );
}

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/encomendas" element={<ShipmentsPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registar" element={<Register />} />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/definicoes"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/termos" element={<Terms />} />
        <Route path="/privacidade" element={<Privacy />} />
      </Routes>
    </AnimatePresence>
  );
}

const App: React.FC = () => {
  useLenis();
  return (
    <LanguageProvider>
      <Seo />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<PageLoader />}>
          <AppRoutes />
        </Suspense>
      </BrowserRouter>
    </LanguageProvider>
  );
};

export default App;



