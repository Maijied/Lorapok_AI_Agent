import React, { useState, useEffect } from 'react';

const larvaQuotes = [
  '🐛 Consuming bottlenecks in background...',
  '⚡ System 100% Optimized!',
  '✨ LLDP Pattern Active (#00FF88)',
  '🔍 186 Unit Tests Verified',
  '🛡️ Zero-Quota Filtering Active',
  '🚀 Lorapok AI Agent Ready!',
  '😋 Nom nom... Consuming bugs!'
];

export default function CyberneticLarvaMascot({ showToast }) {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isWiggling, setIsWiggling] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % larvaQuotes.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleClick = () => {
    setIsWiggling(true);
    const msg = larvaQuotes[Math.floor(Math.random() * larvaQuotes.length)];
    if (showToast) showToast(msg);
    setTimeout(() => setIsWiggling(false), 800);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.75rem',
        left: '1.75rem',
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        cursor: 'pointer',
        userSelect: 'none'
      }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Speech Bubble */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid #00FF88',
          borderRadius: '16px',
          padding: '0.5rem 0.9rem',
          fontSize: '0.78rem',
          fontWeight: 600,
          color: '#00FF88',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 0 20px rgba(0, 255, 136, 0.25)',
          transition: 'all 0.3s ease',
          transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
          maxWidth: '220px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {larvaQuotes[quoteIndex]}
      </div>

      {/* Cybernetic Black Soldier Fly Larva Vector Mascot */}
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 255, 136, 0.2) 0%, rgba(3, 7, 17, 0.9) 70%)',
          border: '2px solid #00FF88',
          boxShadow: '0 0 25px rgba(0, 255, 136, 0.4), inset 0 0 15px rgba(0, 229, 255, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          transform: `${isWiggling ? 'scale(1.2) rotate(12deg)' : isHovered ? 'scale(1.1) translateY(-4px)' : 'scale(1)'}`
        }}
      >
        {/* Larva Body Graphic */}
        <svg width="42" height="42" viewBox="0 0 100 100" fill="none">
          {/* Segmented Charcoal Armor Body */}
          <ellipse cx="50" cy="50" rx="34" ry="24" fill="#1A202C" stroke="#00FF88" strokeWidth="2.5" />
          <path d="M 30 36 Q 50 28 70 36" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" />
          <path d="M 26 50 Q 50 42 74 50" stroke="#00FF88" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 30 64 Q 50 56 70 64" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" />

          {/* Glowing Expressive Eyes */}
          <circle cx="38" cy="46" r="6" fill="#00FF88" />
          <circle cx="62" cy="46" r="6" fill="#00FF88" />
          <circle cx="40" cy="44" r="2" fill="#FFFFFF" />
          <circle cx="64" cy="44" r="2" fill="#FFFFFF" />

          {/* Cute Smiling Mouth */}
          <path d="M 44 58 Q 50 64 56 58" stroke="#00FF88" strokeWidth="2" strokeLinecap="round" />

          {/* Small Robotic Legs */}
          <line x1="22" y1="52" x2="14" y2="58" stroke="#00FF88" strokeWidth="2" strokeLinecap="round" />
          <line x1="24" y1="62" x2="16" y2="70" stroke="#00FF88" strokeWidth="2" strokeLinecap="round" />
          <line x1="78" y1="52" x2="86" y2="58" stroke="#00FF88" strokeWidth="2" strokeLinecap="round" />
          <line x1="76" y1="62" x2="84" y2="70" stroke="#00FF88" strokeWidth="2" strokeLinecap="round" />
        </svg>

        {/* Status Pulse Indicator */}
        <span
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: '#00FF88',
            boxShadow: '0 0 10px #00FF88',
            animation: 'pulseDot 2s infinite'
          }}
        />
      </div>
    </div>
  );
}
