import React, { useState } from 'react';
import MarketingBanner from './components/MarketingBanner';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import Providers from './components/Providers';
import CliCommands from './components/CliCommands';
import ApiEndpoints from './components/ApiEndpoints';
import Pricing from './components/Pricing';
import ResearchPhilosophy from './components/ResearchPhilosophy';
import Ecosystem from './components/Ecosystem';
import AdminModal from './components/AdminModal';
import Footer from './components/Footer';
import GlobalParticleCanvas from './components/GlobalParticleCanvas';
import CyberneticLarvaMascot from './components/CyberneticLarvaMascot';

export default function App() {
  const [toastMessage, setToastMessage] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  return (
    <div className="app" style={{ position: 'relative' }}>
      {/* Global Background Particle Canvas */}
      <GlobalParticleCanvas />

      <Navbar onOpenAdmin={() => setIsAdminOpen(true)} />
      
      <MarketingBanner />

      <main style={{ position: 'relative', zIndex: 1 }}>
        <Hero showToast={showToast} />
        <HowItWorks />
        <Features />
        <Providers />
        <CliCommands showToast={showToast} />
        <ApiEndpoints />
        <Pricing />
        <ResearchPhilosophy />
        <Ecosystem />
      </main>

      <Footer />

      {/* Cybernetic Black Soldier Fly Larva Companion Mascot */}
      <CyberneticLarvaMascot showToast={showToast} />

      <AdminModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />

      {/* Global Toast Notification */}
      <div className={`toast ${toastMessage ? 'show' : ''}`} role="alert">
        {toastMessage}
      </div>
    </div>
  );
}
