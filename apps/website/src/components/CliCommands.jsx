import React, { useState } from 'react';

const installMethods = [
  { id: 'npm', label: 'npm (Global)', cmd: 'npm install -g lorapok-ai\nlorapok', desc: 'Installs the CLI globally so you can run lorapok from any directory.' },
  { id: 'npx', label: 'npx (Instant)', cmd: 'npx lorapok-ai', desc: 'Run Lorapok instantly without installing. Perfect for one-off sessions.' },
  { id: 'docker', label: 'Docker Container', cmd: 'docker pull lorapoklabs/lorapok-ai\ndocker run -it lorapoklabs/lorapok-ai', desc: 'Runs inside an isolated Docker container with host volume mounting.' },
  { id: 'source', label: 'Local Development', cmd: 'npm install -g lorapok-ai\nlorapok --local', desc: 'Run locally for development.' }
];

export default function CliCommands({ showToast }) {
  const [activeTab, setActiveTab] = useState('npm');
  const current = installMethods.find(m => m.id === activeTab) || installMethods[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.cmd);
    showToast('✓ Copied to clipboard!');
  };

  return (
    <section className="cli-section" id="install">
      <div className="container">
        <div style={{ textAlign: 'center' }}>
          <span className="section-badge">📦 Installation Methods</span>
          <h2 className="section-title">
            Get Started in <span className="gradient-text">Seconds</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Choose your preferred installation method. All options get you to the same powerful CLI experience.
          </p>
        </div>

        <div className="cli-tabs">
          {installMethods.map(m => (
            <button
              key={m.id}
              className={`cli-tab ${activeTab === m.id ? 'active' : ''}`}
              onClick={() => setActiveTab(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="glass-card">
          <div className="cli-panel active">
            <div className="cli-command-name">{current.label}</div>
            <pre style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', position: 'relative', overflowX: 'auto' }}>
              <code style={{ color: 'var(--text-code)', fontSize: '0.9rem' }}>{current.cmd}</code>
              <button
                onClick={handleCopy}
                style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}
                title="Copy code"
              >
                📋
              </button>
            </pre>
            <p className="cli-command-desc" style={{ marginTop: '1rem' }}>{current.desc}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
