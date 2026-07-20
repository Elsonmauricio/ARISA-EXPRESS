// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Hero from './components/Hero';
import About from './components/About';
import Services from './components/Services.jsx';
import Tracking from './components/Tracking';
import Stats from './components/Stats.jsx';
import Footer from './components/Footer';
import Reveal from './components/Reveal.jsx';
import Layout from './components/Layout';
import Contact from './components/Contact';
import Gallery  from './components/Gallery';
import AeroStripe from './components/AeroStripe';
import Storytelling from './components/Storytelling';
import ParallaxLayer from './components/ParallaxLayer';
import { useLenis } from './hooks/useLenis';
import { LanguageProvider } from './i18n/LanguageContext';
import ShipmentsPage from './pages/ShipmentsPage';
import Login from './pages/LoginPage';
import Register from './pages/RegisterPage';
import Profile from './pages/ProfilePage';
import Settings from './pages/SettingsPage';
import AdminDashboard from './pages/AdminDashboard';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

function HomePage() {
  return (
    <Layout>
      <main className="relative z-10">
        <div id="main-wrapper">
          <Hero />
          <div className="relative z-10 container mx-auto px-4 -mt-4 sm:-mt-8">
            <AeroStripe />
          </div>

          {/* Storytelling 3D scroll-driven: a jornada Lisboa -> Luanda */}
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
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
      </BrowserRouter>
    </LanguageProvider>
  );
};

export default App;