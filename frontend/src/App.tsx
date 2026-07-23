// src/App.tsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import { useLenis } from './hooks/useLenis';
import { LanguageProvider } from './i18n/LanguageContext';

// Code-splitting por rota: as páginas pesadas viram chunks separados,
// reduzindo o bundle inicial e o tempo de carregamento da landing.
const ShipmentsPage = lazy(() => import('./pages/ShipmentsPage'));
const Login = lazy(() => import('./pages/LoginPage'));
const Register = lazy(() => import('./pages/RegisterPage'));
const Profile = lazy(() => import('./pages/ProfilePage'));
const Settings = lazy(() => import('./pages/SettingsPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));

function PageLoader() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black">
      <div className="w-10 h-10 rounded-full border-2 border-t-gold border-lilac-500/20 animate-spin" />
    </div>
  );
}

function HomePage() {
  return (
    <Layout>
      <main className="relative z-10">
        <div id="main-wrapper">
          <Hero />
          <div className="relative z-10 container mx-auto px-4 -mt-4 sm:-mt-8">
            <AeroStripe />
          </div>

          {/* Storytelling 3D scroll-driven: a jornada da encomenda */}
          <Storytelling />

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

const App: React.FC = () => {
  useLenis();
  return (
    <LanguageProvider>
      <Seo />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/encomendas" element={<ShipmentsPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registar" element={<Register />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/definicoes" element={<Settings />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/termos" element={<Terms />} />
          <Route path="/privacidade" element={<Privacy />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </LanguageProvider>
  );
};

export default App;
