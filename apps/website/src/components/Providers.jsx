import React, { useState } from 'react';

const activeProviders = [
  {
    icon: '✨',
    name: 'Google AI Studio',
    models: 'Gemini 3.6 Flash · Gemini 3.5 Flash-Lite · Gemini 2.0 Flash',
    badge: '100% Free Tier',
    badgeClass: 'free',
    bg: 'linear-gradient(135deg, rgba(66,133,244,0.15), rgba(156,39,176,0.15))'
  },
  {
    icon: '🔀',
    name: 'OpenRouter Engine',
    models: 'Claude 3.7 Sonnet · GPT-4o · DeepSeek R1 · Llama 3.3 70B',
    badge: 'Multi-Model Access',
    badgeClass: 'multi',
    bg: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.15))'
  },
  {
    icon: '🔍',
    name: 'Perplexity AI',
    models: 'Sonar · Sonar Pro · Sonar Reasoning',
    badge: 'Search Grounding',
    badgeClass: 'search',
    bg: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,191,36,0.15))'
  }
];

const devProviders = [
  { icon: '🟢', name: 'NVIDIA NIM', models: 'Llama 3 70B, Nemotron 4, Mistral NeMo', badge: 'In Development', badgeClass: 'dev' },
  { icon: '🌪️', name: 'Mistral AI', models: 'Codestral, Mistral Medium 3.5, Pixtral 12B', badge: 'In Development', badgeClass: 'dev' },
  { icon: '🤗', name: 'HuggingFace Inference', models: 'DeepSeek R1, Qwen2.5 Coder, Llama 3.3', badge: 'In Development', badgeClass: 'dev' },
  { icon: '▲', name: 'Vercel AI Gateway', models: 'Unified Multi-Provider Routing & Caching', badge: 'In Development', badgeClass: 'dev' },
  { icon: '⚡', name: 'Groq', models: 'Llama 3.3 70B (800+ tokens/sec inference)', badge: 'In Development', badgeClass: 'dev' },
  { icon: '🧠', name: 'Cerebras AI', models: 'Llama 3.3 70B (2000+ tokens/sec CS-3 engine)', badge: 'In Development', badgeClass: 'dev' },
  { icon: '🌊', name: 'Cloudflare Workers AI', models: 'Edge-hosted open models & Whisper', badge: 'In Development', badgeClass: 'dev' },
  { icon: '🔑', name: 'OpenAI', models: 'GPT-4o, GPT-4o-mini, o1-mini, o3-mini', badge: 'In Development', badgeClass: 'dev' },
  { icon: '🔮', name: 'Cohere', models: 'Command R+, Embed v3, Rerank v3', badge: 'In Development', badgeClass: 'dev' },
  { icon: '🛡️', name: 'OpenCode Zen & Kilo', models: 'Developer-first LLM Proxy Gateways', badge: 'In Development', badgeClass: 'dev' }
];

const creditProviders = [
  { icon: '💃', name: 'SambaNova Cloud', credit: '$5 Free Credits (3 Months)', models: 'DeepSeek V3.1/V3.2, Gemma 4, Llama 3.3 70B, GPT-OSS', badgeClass: 'credit' },
  { icon: '🇫🇷', name: 'Scaleway Generative APIs', credit: '1,000,000 Free Tokens + Audio', models: 'Gemma 3 27B, Llama 3.3 70B, Devstral, Whisper Large', badgeClass: 'credit' },
  { icon: '🚀', name: 'Hyperbolic', credit: '$1 Free Credits', models: 'DeepSeek V3/R1, Llama 3.3 70B, Qwen3 Coder 480B', badgeClass: 'credit' },
  { icon: '📦', name: 'Baseten', credit: '$30 Compute Credits', models: 'Any open-weights model pay-by-compute', badgeClass: 'credit' },
  { icon: '⚡', name: 'Modal', credit: '$30/month Starter Plan', models: 'Serverless ML & pay-by-compute inference', badgeClass: 'credit' },
  { icon: '🎇', name: 'Fireworks AI', credit: '$1 Free Credits', models: 'Fast open-model inference & fine-tuning', badgeClass: 'credit' },
  { icon: '☁️', name: 'Nebius AI', credit: '$1 Free Credits', models: 'Various high-performance open models', badgeClass: 'credit' },
  { icon: '🌟', name: 'Novita AI', credit: '$0.5 Credits (1 Year)', models: 'DeepSeek, Llama, and Qwen open models', badgeClass: 'credit' },
  { icon: '🧬', name: 'AI21 Labs', credit: '$10 Credits (3 Months)', models: 'Jamba 1.5 Large & Mini state-space models', badgeClass: 'credit' },
  { icon: '🌅', name: 'Upstage AI', credit: '$10 Credits (3 Months)', models: 'Solar Pro & Solar Mini reasoning models', badgeClass: 'credit' },
  { icon: '🧠', name: 'NLP Cloud', credit: '$15 Free Credits', models: 'Open models & text processing pipeline', badgeClass: 'credit' },
  { icon: '🌐', name: 'Alibaba Model Studio', credit: '1M Free Tokens (90 Days)', models: 'Qwen 2.5 Coder & Qwen Max series', badgeClass: 'credit' },
  { icon: '🔗', name: 'Inference.net', credit: '$1 - $25 Survey Credits', models: 'Distributed open-model inference', badgeClass: 'credit' }
];

export default function Providers() {
  const [tab, setTab] = useState('active');

  return (
    <section className="providers" id="providers">
      <div className="container">
        <div style={{ textAlign: 'center' }}>
          <span className="section-badge">🌐 Multi-Provider Matrix</span>
          <h2 className="section-title">
            Choose Your <span className="gradient-text">AI Powerhouse</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Lorapok AI natively supports Google AI Studio, OpenRouter, and Perplexity, with 20+ additional provider gateways in active development.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="providers-tabs">
          <button
            className={`provider-tab-btn ${tab === 'active' ? 'active' : ''}`}
            onClick={() => setTab('active')}
          >
            ✨ Active Ready ({activeProviders.length})
          </button>
          <button
            className={`provider-tab-btn ${tab === 'dev' ? 'active' : ''}`}
            onClick={() => setTab('dev')}
          >
            ⚙️ In Development ({devProviders.length})
          </button>
          <button
            className={`provider-tab-btn ${tab === 'credits' ? 'active' : ''}`}
            onClick={() => setTab('credits')}
          >
            🎁 Free Trial Credits ({creditProviders.length})
          </button>
        </div>

        {/* Grid Display */}
        <div className="providers-grid">
          {tab === 'active' && activeProviders.map((p, i) => (
            <div key={i} className="provider-card glass-card glass-card-interactive">
              <div className="provider-icon" style={{ background: p.bg }}>{p.icon}</div>
              <h3 className="provider-name">{p.name}</h3>
              <p className="provider-models">{p.models}</p>
              <span className={`provider-badge ${p.badgeClass}`}>{p.badge}</span>
            </div>
          ))}

          {tab === 'dev' && devProviders.map((p, i) => (
            <div key={i} className="provider-card glass-card glass-card-interactive">
              <div className="provider-icon" style={{ background: 'rgba(34,211,238,0.1)' }}>{p.icon}</div>
              <h3 className="provider-name">{p.name}</h3>
              <p className="provider-models">{p.models}</p>
              <span className={`provider-badge ${p.badgeClass}`}>{p.badge}</span>
            </div>
          ))}

          {tab === 'credits' && creditProviders.map((p, i) => (
            <div key={i} className="provider-card glass-card glass-card-interactive">
              <div className="provider-icon" style={{ background: 'rgba(245,158,11,0.1)' }}>{p.icon}</div>
              <h3 className="provider-name">{p.name}</h3>
              <p className="provider-models" style={{ fontWeight: 600, color: 'var(--accent-amber)' }}>{p.credit}</p>
              <p className="provider-models" style={{ fontSize: '0.8rem' }}>{p.models}</p>
              <span className={`provider-badge ${p.badgeClass}`}>Trial Credits</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
