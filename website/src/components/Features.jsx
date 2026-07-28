import React from 'react';

const features = [
  { icon: '🧠', title: 'Multi-Provider AI Engine', desc: 'Native support for Google AI Studio (Gemini 3.6/3.5/2.0), OpenRouter, and Perplexity AI. Switch models instantly.', tag: 'Ready' },
  { icon: '🛡️', title: 'Dynamic Model Validator', desc: 'Automatic zero-quota model filtering, non-text modality exclusion, and runtime failure caching for seamless operation.', tag: 'Ready' },
  { icon: '📊', title: 'Token Capacity & Limit UI', desc: 'Real-time turn usage and available model context capacity tracking with visual progress indicators.', tag: 'Ready' },
  { icon: '⚡', title: 'Token-Saving Response Cache', desc: 'Persistent SHA-256 LLM response cache reducing token consumption and latency with intelligent deduplication.', tag: 'Ready' },
  { icon: '💻', title: 'Collapsible Bash Process Box', desc: 'Framed bash execution box with duration badges, exit status, and collapsible output for clean terminal UX.', tag: 'Ready' },
  { icon: '🤖', title: 'Interactive AI REPL', desc: 'Terminal-first interactive chat with context-aware workspace file injection and markdown rendering.', tag: 'Ready' },
  { icon: '📝', title: 'Proactive File Actions', desc: 'Proposes CREATE / UPDATE / DELETE file operations with interactive diff previews before committing changes.', tag: 'Ready' },
  { icon: '🔗', title: 'Full Git Suite', desc: 'Smart AI commits, branching, stashing, pushing, pulling, and log viewing — all from natural language commands.', tag: 'Ready' },
  { icon: '⚡', title: 'GitHub Actions Manager', desc: 'Monitor workflow runs, inspect jobs, view logs, and rerun failed CI/CD pipelines without leaving the terminal.', tag: 'Ready' },
  { icon: '🔐', title: 'GitHub Auth System', desc: 'Personal Access Tokens, OAuth Device Flow, and GitHub CLI integration with secure credential management.', tag: 'Ready' },
  { icon: '🎨', title: 'Terminal UI & Themes', desc: '12+ ASCII font themes, animated startup sequences, and markdown syntax highlighting for rich terminal experiences.', tag: 'Ready' },
  { icon: '📋', title: 'Plan & Execute Workflow', desc: 'Multi-step /plan workflow: Plan → Checklist → Execution → Summary with intelligent task decomposition.', tag: 'Ready' }
];

export default function Features() {
  return (
    <section className="features" id="features">
      <div className="container">
        <div style={{ textAlign: 'center' }}>
          <span className="section-badge">🚀 Core Capabilities</span>
          <h2 className="section-title">
            Everything You Need to <span class="gradient-text">Ship Faster</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            A complete AI engineering toolkit built for the modern developer workflow.
          </p>
        </div>

        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card glass-card glass-card-interactive">
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-description">{f.desc}</p>
              <span className="feature-tag">{f.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
