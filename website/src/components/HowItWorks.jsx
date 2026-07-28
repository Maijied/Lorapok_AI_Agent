import React, { useState, useEffect } from 'react';

const steps = [
  {
    number: 1,
    title: 'Install',
    code: 'npm i -g lorapok-ai',
    description: 'Install globally via npm or run instantly with npx. Zero configuration needed.',
    simLines: [
      { text: '$ npm i -g lorapok-ai', type: 'command' },
      { text: 'FETCH http://registry.npmjs.org/lorapok-ai...', type: 'dim' },
      { text: '✔ lorapok-ai@1.2.0 installed successfully in 1.4s', type: 'success' }
    ]
  },
  {
    number: 2,
    title: 'Launch',
    code: 'lorapok',
    description: 'Launch the CLI in any project directory. Lorapok auto-detects your workspace and Git repository.',
    simLines: [
      { text: '$ lorapok', type: 'command' },
      { text: '🐛 Lorapok AI v1.2.0 CLI Engine', type: 'system' },
      { text: '📂 Workspace: /home/user/my-project (Git: main)', type: 'info' }
    ]
  },
  {
    number: 3,
    title: 'Configure',
    code: 'export GEMINI_API_KEY=AIza...',
    description: 'Set your preferred AI provider key. Google AI Studio offers 100% free tier access.',
    simLines: [
      { text: '$ export GEMINI_API_KEY=AIzaSy...', type: 'command' },
      { text: '✨ Active Provider: Google AI Studio', type: 'success' },
      { text: '⚡ Gemini 3.6 Flash ready [Unlimited Free Tier]', type: 'info' }
    ]
  },
  {
    number: 4,
    title: 'Command',
    code: '"Refactor utils.js"',
    description: 'Type natural language requests. Lorapok builds plans, codes changes, tests, and commits.',
    simLines: [
      { text: '> "Refactor utils.js"', type: 'command' },
      { text: '🔍 Scanning 14 workspace files...', type: 'dim' },
      { text: '✅ Modified utils.js (+12/-20 lines) — 0 errors', type: 'success' }
    ]
  }
];

function MiniTerminal({ lines }) {
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleCount(prev => (prev >= lines.length ? 1 : prev + 1));
    }, 1800);
    return () => clearInterval(timer);
  }, [lines.length]);

  return (
    <div
      style={{
        background: '#0d1117',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-md)',
        padding: '0.85rem 1rem',
        textAlign: 'left',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.78rem',
        marginTop: '1.25rem',
        minHeight: '90px'
      }}
    >
      <div style={{ display: 'flex', gap: 4, marginBottom: 8, opacity: 0.7 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF5F57' }} />
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FEBC2E' }} />
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#28C840' }} />
      </div>
      {lines.slice(0, visibleCount).map((l, i) => (
        <div key={i} className={`term-line ${l.type}`} style={{ fontSize: '0.76rem', marginBottom: 2 }}>
          {l.text}
        </div>
      ))}
      <span className="term-cursor" style={{ height: 10, width: 6 }} />
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section className="how-it-works" id="how-it-works">
      <div className="container">
        <div style={{ textAlign: 'center' }}>
          <span className="section-badge">⚡ Interactive Quick Start</span>
          <h2 className="section-title">
            Up and Running in <span className="gradient-text">4 Steps</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            From installation to your first autonomous AI-powered code commit in under 2 minutes.
          </p>
        </div>

        <div className="steps-grid">
          {steps.map(s => (
            <div key={s.number} className="step-card glass-card glass-card-interactive">
              <div className="step-number">{s.number}</div>
              <h3 className="step-title">{s.title}</h3>
              <p className="step-description">{s.description}</p>
              <code className="step-code">{s.code}</code>
              <MiniTerminal lines={s.simLines} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
