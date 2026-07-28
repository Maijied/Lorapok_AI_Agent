import React from 'react';

export default function LarvaLogo({ size = 42, showText = true }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
      {/* Cybernetic Black Soldier Fly Larva Animated SVG Logo */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, rgba(0, 255, 136, 0.25) 0%, rgba(15, 23, 42, 0.95) 75%)',
          border: '2px solid #00FF88',
          boxShadow: '0 0 25px rgba(0, 255, 136, 0.45), inset 0 0 15px rgba(0, 229, 255, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          flexShrink: 0,
          overflow: 'hidden'
        }}
      >
        {/* Animated Cybernetic Larva SVG */}
        <svg width={size * 0.75} height={size * 0.75} viewBox="0 0 100 100" fill="none">
          {/* Segmented Dark Charcoal Armor Body */}
          <ellipse cx="50" cy="50" rx="34" ry="24" fill="#0F172A" stroke="#00FF88" strokeWidth="2.5" />
          <path d="M 30 36 Q 50 28 70 36" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" />
          <path d="M 26 50 Q 50 42 74 50" stroke="#00FF88" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 30 64 Q 50 56 70 64" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" />

          {/* Large Expressive Glowing Neon-Green Eyes */}
          <circle cx="38" cy="46" r="6.5" fill="#00FF88" />
          <circle cx="62" cy="46" r="6.5" fill="#00FF88" />
          <circle cx="40" cy="44" r="2" fill="#FFFFFF" />
          <circle cx="64" cy="44" r="2" fill="#FFFFFF" />

          {/* Cute Smiling Mouth */}
          <path d="M 44 58 Q 50 64 56 58" stroke="#00FF88" strokeWidth="2" strokeLinecap="round" />

          {/* Small Robotic Legs */}
          <line x1="22" y1="52" x2="14" y2="58" stroke="#00FF88" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="24" y1="62" x2="16" y2="70" stroke="#00FF88" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="78" y1="52" x2="86" y2="58" stroke="#00FF88" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="76" y1="62" x2="84" y2="70" stroke="#00FF88" strokeWidth="2.2" strokeLinecap="round" />
        </svg>

        {/* Status Pulse Dot */}
        <span
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#00FF88',
            boxShadow: '0 0 10px #00FF88',
            animation: 'pulseDot 2s infinite'
          }}
        />
      </div>

      {showText && (
        <span className="nav-brand-text lorapok-brand-font">
          Lorapok <span className="gradient-text">AI</span>
        </span>
      )}
    </div>
  );
}
