import React from 'react';

const steps = [
  {
    number: 1,
    title: 'Install',
    code: 'npm i -g lorapok-ai',
    description: 'Install globally via npm or run instantly with npx. Zero configuration needed.'
  },
  {
    number: 2,
    title: 'Launch',
    code: 'lorapok',
    description: 'Launch the CLI in any project directory. Lorapok auto-detects your workspace and Git repository.'
  },
  {
    number: 3,
    title: 'Configure',
    code: 'export GEMINI_API_KEY=AIza...',
    description: 'Set your preferred AI provider key. Google AI Studio offers 100% free tier access.'
  },
  {
    number: 4,
    title: 'Command',
    code: '"Refactor utils.js"',
    description: 'Type natural language requests. Lorapok builds plans, codes changes, tests, and commits.'
  }
];

export default function HowItWorks() {
  return (
    <section className="how-it-works" id="how-it-works">
      <div className="container">
        <div style={{ textAlign: 'center' }}>
          <span className="section-badge">⚡ Quick Start Workflow</span>
          <h2 className="section-title">
            Up and Running in <span className="gradient-text">4 Logical Steps</span>
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
