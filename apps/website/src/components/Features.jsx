import React from 'react';

const features = [
  { icon: '🤖', title: 'Autonomous Agent Directives', desc: 'Plan & Agent modes operate fully autonomously. The engine parses ACTION blocks and orchestrates bash and file operations seamlessly.', tag: 'New' },
  { icon: '🧠', title: 'Multi-Provider AI Engine', desc: 'Native support for Google AI Studio (Gemini 3.6/3.5/2.0), OpenRouter, and Perplexity AI. Switch models instantly.', tag: 'Ready' },
  { icon: '🛡️', title: 'Tier-Sanitized Model Routing', desc: 'Dynamic model validator filters out paid models in free environments and caches runtime failures for seamless fallback.', tag: 'Ready' },
  { icon: '💾', title: 'Smart Session Checkpointing', desc: 'SessionStore and CheckpointManager persist conversation context securely without exhausting token limits.', tag: 'New' },
  { icon: '✨', title: 'Perfected UI Separators', desc: 'Segmented output rendering separates suggestions, status bars, and UI dividers for an immaculate terminal experience.', tag: 'New' },
  { icon: '💻', title: 'Collapsible Bash Process Box', desc: 'Framed bash execution box with duration badges, exit status, and collapsible output for clean terminal UX.', tag: 'Ready' },
  { icon: '📝', title: 'Proactive Diff Rendering', desc: 'File operations are visualized with Git-style inline diff previews before changes are permanently committed.', tag: 'Ready' },
  { icon: '🔗', title: 'Full Git Suite', desc: 'Smart AI commits, branching, stashing, pushing, pulling, and log viewing — all from natural language commands.', tag: 'Ready' },
  { icon: '⚡', title: 'GitHub Actions Manager', desc: 'Monitor workflow runs, inspect jobs, view logs, and rerun failed CI/CD pipelines without leaving the terminal.', tag: 'Ready' },
  { icon: '🔐', title: 'Secure Credential Store', desc: 'Personal Access Tokens, OAuth Device Flow, and GitHub CLI integration mapped perfectly into safe local keychains.', tag: 'Ready' },
  { icon: '🎨', title: 'Theming & Syntax Highlighting', desc: '12+ ASCII font themes, animated startup sequences, and markdown syntax highlighting for rich terminal experiences.', tag: 'Ready' },
  { icon: '⚡', title: 'Token-Saving Response Cache', desc: 'Persistent SHA-256 LLM response cache reducing token consumption and latency with intelligent deduplication.', tag: 'Ready' }
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
