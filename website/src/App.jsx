import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import Providers from './components/Providers';
import CliCommands from './components/CliCommands';
import ApiEndpoints from './components/ApiEndpoints';
import Pricing from './components/Pricing';
import Ecosystem from './components/Ecosystem';
import AdminModal from './components/AdminModal';
import Footer from './components/Footer';

export default function App() {
  const [toastMessage, setToastMessage] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  return (
    <div className="app">
      <Navbar onOpenAdmin={() => setIsAdminOpen(true)} />
      <main>
        <Hero showToast={showToast} />
        <HowItWorks />
        <Features />
        <Providers />
        <CliCommands showToast={showToast} />
        <ApiEndpoints />
        <Pricing />
        <Ecosystem />
      </main>
      <Footer />

      <AdminModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />

      {/* Global Toast Notification */}
      <div className={`toast ${toastMessage ? 'show' : ''}`} role="alert">
        {toastMessage}
      </div>
    </div>
  );
}
