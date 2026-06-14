import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Services from './components/Services';
import Tracking from './components/Tracking';
import Stats from './components/Stats';
import Footer from './components/Footer';
import Reveal from './components/Reveal';
import Layout from './components/Layout'; 

const App: React.FC = () => {
  return (
    <Layout>
      <main className="relative">
        <Navbar />
        <Hero />

        <Reveal><About /></Reveal>
        <Reveal><Services /></Reveal>
        <Reveal><Stats /></Reveal>
        <Reveal><Tracking /></Reveal>
        <Reveal><Footer /></Reveal>
      </main>
    </Layout>
  );
};

export default App;