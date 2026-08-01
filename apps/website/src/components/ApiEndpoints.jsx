import React from 'react';

const apiEndpoints = [
  { endpoint: '/health', method: 'GET', desc: 'Server health & system status' },
  { endpoint: '/api/models', method: 'GET', desc: 'List available AI models across providers' },
  { endpoint: '/api/chat', method: 'POST', desc: 'Send prompt to AI agent' },
  { endpoint: '/api/generate', method: 'POST', desc: 'Generate code snippets autonomously' },
  { endpoint: '/api/analyze', method: 'POST', desc: 'Analyze project codebase structure' },
  { endpoint: '/api/debug', method: 'POST', desc: 'Debug snippet or error stack trace' },
  { endpoint: '/api/files', method: 'GET', desc: 'List project directory files' },
  { endpoint: '/api/files/read', method: 'GET', desc: 'Read file contents' },
  { endpoint: '/api/git/status', method: 'GET', desc: 'Git working tree status' },
  { endpoint: '/api/git/commit', method: 'POST', desc: 'Commit staged changes' },
  { endpoint: '/api/git/log', method: 'GET', desc: 'Recent commit log history' },
  { endpoint: '/api/settings', method: 'GET / PUT', desc: 'Retrieve or update configuration' }
];

export default function ApiEndpoints() {
  return (
    <section className="api-section" id="api">
      <div className="container">
        <div style={{ textAlign: 'center' }}>
          <span className="section-badge">🌐 REST API Server</span>
          <h2 className="section-title">
            Built-in <span className="gradient-text">Express Web API</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Lorapok AI includes a built-in Express REST API on port 3847 for seamless integration with existing tools.
          </p>
        </div>

        <div className="api-table-wrapper glass-card">
          <table className="api-table">
            <thead>
              <tr>
                <th>Endpoint</th>
                <th>Method</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {apiEndpoints.map((ep, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-code)', fontWeight: 600 }}>{ep.endpoint}</td>
                  <td>
                    <span className={`method-badge ${ep.method.toLowerCase().includes('get') ? 'get' : ep.method.toLowerCase().includes('post') ? 'post' : 'put'}`}>
                      {ep.method}
                    </span>
                  </td>
                  <td>{ep.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
