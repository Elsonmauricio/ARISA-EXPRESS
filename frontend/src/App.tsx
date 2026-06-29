// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
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
      <main className="relative">
        <div id="main-wrapper">
          <Navbar />
          <Hero />
          <Reveal><About /></Reveal>
          <Reveal><Services /></Reveal>
          <Reveal><Stats /></Reveal>
          <Reveal><Gallery /></Reveal>
          <Reveal><Tracking /></Reveal>
          <Reveal><Contact /></Reveal>
          <Reveal><Footer /></Reveal>
        </div>
      </main>
    </Layout>
  );
}

const App: React.FC = () => {
  return (
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
  );
};

export default App;