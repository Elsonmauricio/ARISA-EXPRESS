import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Services from './components/Services.jsx';
import Tracking from './components/Tracking.jsx';
import Stats from './components/Stats.jsx';
import Footer from './components/Footer';
import Reveal from './components/Reveal.jsx';
import Layout from './components/Layout'; 
import Contact from './components/Contact';

const App: React.FC = () => {
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
};

export default App;