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
import ShipmentsPage from './pages/ShipmentsPage';
import Login from './pages/LoginPage';
import Register from './pages/RegisterPage';
import Profile from './pages/ProfilePage';
import Settings from './pages/SettingsPage';
import AdminDashboard from './pages/AdminDashboard';

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
      </Routes>
    </BrowserRouter>
  );
};

export default App;