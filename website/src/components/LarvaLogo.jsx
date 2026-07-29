import React from 'react';

export default function LarvaLogo({ size = 46, showText = true }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.85rem' }}>
      {/* Cybernetic Black Soldier Fly Larva Animated Container */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #1e293b 0%, #030711 85%)',
          border: '2px solid #00FF88',
          boxShadow: '0 0 25px rgba(0, 255, 136, 0.55), inset 0 0 15px rgba(0, 229, 255, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          flexShrink: 0,
          overflow: 'hidden',
          transition: 'all 0.3s ease'
        }}
        className="larva-logo-container"
      >
        {/* CSS Animations */}
        <style>{`
          @keyframes larvaEyeBlink {
            0%, 90%, 100% { transform: scaleY(1); }
            95% { transform: scaleY(0.1); }
          }
          @keyframes larvaLegCrawlLeft {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(-8deg) translateY(-1px); }
          }
          @keyframes larvaLegCrawlRight {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(8deg) translateY(-1px); }
          }
          @keyframes larvaPanelGlow {
            0%, 100% { opacity: 0.8; filter: drop-shadow(0 0 4px #00FF88); }
            50% { opacity: 1; filter: drop-shadow(0 0 10px #00FF88); }
          }
          @keyframes larvaAuraRotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .larva-eye {
            transform-origin: center;
            animation: larvaEyeBlink 4s infinite;
          }
          .larva-leg-l {
            transform-origin: 30px 50px;
            animation: larvaLegCrawlLeft 1.2s ease-in-out infinite;
          }
          .larva-leg-r {
            transform-origin: 70px 50px;
            animation: larvaLegCrawlRight 1.2s ease-in-out infinite;
          }
          .larva-panel {
            animation: larvaPanelGlow 2.5s ease-in-out infinite;
          }
          .larva-aura {
            animation: larvaAuraRotate 10s linear infinite;
          }
        `}</style>

        {/* Rotating Outer Cybernetic Ring */}
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className="larva-aura"
          style={{ position: 'absolute', top: 0, left: 0, opacity: 0.75, pointerEvents: 'none' }}
        >
          <circle cx="50" cy="50" r="46" fill="none" stroke="#00E5FF" strokeWidth="1.5" strokeDasharray="14 10" />
          <circle cx="50" cy="50" r="41" fill="none" stroke="#00FF88" strokeWidth="1.2" strokeDasharray="8 12" />
        </svg>

        {/* Cybernetic BSF Larva Vector Graphics */}
        <svg width={size * 0.82} height={size * 0.82} viewBox="0 0 100 100" fill="none">
          <defs>
            {/* Body Metallic Gradient */}
            <radialGradient id="larvaBodyGrad" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="60%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
            {/* Glowing Panel Gradient */}
            <linearGradient id="neonGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00FF88" />
              <stop offset="100%" stopColor="#00E5FF" />
            </linearGradient>
          </defs>

          {/* 1. Small Robotic Legs */}
          <g>
            <path className="larva-leg-l" d="M 22 45 L 10 38 M 20 54 L 8 54 M 22 63 L 10 70" stroke="#00FF88" strokeWidth="3" strokeLinecap="round" />
            <path className="larva-leg-r" d="M 78 45 L 90 38 M 80 54 L 92 54 M 78 63 L 90 70" stroke="#00FF88" strokeWidth="3" strokeLinecap="round" />
          </g>

          {/* 2. Plump Segmented Armor Body */}
          <ellipse cx="50" cy="52" rx="34" ry="26" fill="url(#larvaBodyGrad)" stroke="#00FF88" strokeWidth="2.5" />

          {/* 3. Glowing Neon-Green Panels (Segmentation Rings) */}
          <path className="larva-panel" d="M 24 38 Q 50 28 76 38" stroke="url(#neonGreenGrad)" strokeWidth="3" strokeLinecap="round" />
          <path className="larva-panel" d="M 18 52 Q 50 42 82 52" stroke="#00FF88" strokeWidth="3.5" strokeLinecap="round" />
          <path className="larva-panel" d="M 22 66 Q 50 56 78 66" stroke="url(#neonGreenGrad)" strokeWidth="3" strokeLinecap="round" />

          {/* 4. Large Expressive Glowing Pupil Eyes */}
          <g className="larva-eye">
            {/* Left Eye */}
            <circle cx="36" cy="46" r="8.5" fill="#00FF88" />
            <circle cx="36" cy="46" r="6" fill="#030711" />
            <circle cx="38" cy="44" r="2.8" fill="#FFFFFF" />

            {/* Right Eye */}
            <circle cx="64" cy="46" r="8.5" fill="#00FF88" />
            <circle cx="64" cy="46" r="6" fill="#030711" />
            <circle cx="66" cy="44" r="2.8" fill="#FFFFFF" />
          </g>

          {/* 5. Cute Friendly Smile */}
          <path d="M 43 60 Q 50 67 57 60" stroke="#00FF88" strokeWidth="2.8" strokeLinecap="round" />

          {/* 6. Cybernetic Antenna Head Ornaments */}
          <circle cx="35" cy="24" r="3" fill="#00E5FF" />
          <line x1="42" y1="32" x2="35" y2="24" stroke="#00E5FF" strokeWidth="2" />
          <circle cx="65" cy="24" r="3" fill="#00E5FF" />
          <line x1="58" y1="32" x2="65" y2="24" stroke="#00E5FF" strokeWidth="2" />
        </svg>
      </div>

      {showText && (
        <span className="nav-brand-text lorapok-brand-font" style={{ fontSize: '1.25rem' }}>
          Lorapok <span className="gradient-text">AI</span>
        </span>
      )}
    </div>
  );
}
