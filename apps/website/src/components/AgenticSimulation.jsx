import React, { useState, useEffect, useRef } from 'react';
import { simulationScenarios } from '../data/simulationSteps';
import LarvaLogo from './LarvaLogo';

export default function AgenticSimulation() {
  const [activeScenarioId, setActiveScenarioId] = useState('refactor');
  const [displayedLines, setDisplayedLines] = useState([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const screenRef = useRef(null);

  const scenario = simulationScenarios.find(s => s.id === activeScenarioId) || simulationScenarios[0];

  // Reset simulation when scenario changes
  useEffect(() => {
    setDisplayedLines([]);
    setCurrentLineIndex(0);
    setIsPlaying(true);
  }, [activeScenarioId]);

  // Handle simulation typing progression
  useEffect(() => {
    if (!isPlaying) return;

    if (currentLineIndex >= scenario.steps.length) {
      // Loop after delay
      const loopTimer = setTimeout(() => {
        setDisplayedLines([]);
        setCurrentLineIndex(0);
      }, 3500);
      return () => clearTimeout(loopTimer);
    }

    const currentStep = scenario.steps[currentLineIndex];
    const timer = setTimeout(() => {
      setDisplayedLines(prev => [...prev, currentStep]);
      setCurrentLineIndex(prev => prev + 1);
    }, currentStep.delay || 400);

    return () => clearTimeout(timer);
  }, [currentLineIndex, isPlaying, scenario]);

  // Auto-scroll to bottom of terminal without expanding container height
  useEffect(() => {
    if (screenRef.current) {
      screenRef.current.scrollTop = screenRef.current.scrollHeight;
    }
  }, [displayedLines]);

  return (
    <div className="agent-terminal" style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
      {/* Chrome Header Bar */}
      <div className="terminal-header-bar">
        <div className="terminal-dots">
          <div className="terminal-dot red" />
          <div className="terminal-dot yellow" />
          <div className="terminal-dot green" />
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
          lorapok-ai — Agentic Coding Simulation
        </div>
        <div className="terminal-badge-live">
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)' }} />
          LIVE AGENT
        </div>
      </div>

      {/* Scenario Selection Bar */}
      <div className="terminal-controls">
        {simulationScenarios.map(sc => (
          <button
            key={sc.id}
            className={`scenario-btn ${activeScenarioId === sc.id ? 'active' : ''}`}
            onClick={() => setActiveScenarioId(sc.id)}
          >
            {sc.icon} {sc.label}
          </button>
        ))}
        <button
          className="scenario-btn"
          onClick={() => setIsPlaying(!isPlaying)}
          style={{ marginLeft: 'auto', opacity: 0.8 }}
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
      </div>

      {/* Terminal Output Body with Fixed Height (Zero Layout Shaking) & Animated Larva Background */}
      <div
        className="terminal-screen"
        ref={screenRef}
        style={{
          position: 'relative',
          height: '380px',
          minHeight: '380px',
          maxHeight: '380px',
          overflowY: 'auto',
          boxSizing: 'border-box'
        }}
      >
        {/* Animated Cybernetic Larva Background Watermark */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 0.12,
            pointerEvents: 'none',
            zIndex: 0,
            filter: 'drop-shadow(0 0 15px #00FF88)'
          }}
        >
          <LarvaLogo size={140} showText={false} />
        </div>

        {/* Console Text Lines */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {displayedLines.map((line, idx) => (
            <div key={idx} className={`term-line ${line.type}`}>
              {line.text}
            </div>
          ))}
          <span className="term-cursor" />
        </div>
      </div>
    </div>
  );
}
