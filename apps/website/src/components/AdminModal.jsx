import React from 'react';

export default function AdminModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(3, 7, 17, 0.85)',
        backdropFilter: 'blur(20px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          maxWidth: '420px',
          width: '100%',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          position: 'relative'
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '1.2rem',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>

        <img src="assets/logo.png" alt="Lorapok AI" style={{ width: 56, height: 56, borderRadius: '50%', margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          Admin <span className="gradient-text">Panel</span>
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Lorapok AI management dashboard
        </p>

        <div
          style={{
            display: 'inline-block',
            padding: '0.4rem 1.1rem',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: 'var(--accent-amber)',
            marginBottom: '1.5rem'
          }}
        >
          🚧 Coming Soon
        </div>

        <form onSubmit={e => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Email</label>
            <input
              type="email"
              placeholder="admin@lorapok.tech"
              disabled
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              disabled
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', opacity: 0.5 }}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
