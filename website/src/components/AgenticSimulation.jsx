import React, { useState, useEffect, useRef } from 'react';
import { simulationScenarios } from '../data/simulationSteps';

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

  // Auto-scroll to bottom of terminal
  useEffect(() => {
    if (screenRef.current) {
      screenRef.current.scrollTop = screenRef.current.scrollHeight;
    }
  }, [displayedLines]);

  return (
    <div className="agent-terminal">
      {/* Chrome Header Bar */}
      <div className="terminal-header-bar">
        <div className="terminal-dots">
          <div className="terminal-dot red" />
          <div className="terminal-dot yellow" />
          <div className="terminal-dot green" />
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
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

      {/* Terminal Output Body */}
      <div className="terminal-screen" ref={screenRef}>
        {displayedLines.map((line, idx) => (
          <div key={idx} className={`term-line ${line.type}`}>
            {line.text}
          </div>
        ))}
        <span className="term-cursor" />
      </div>
    </div>
  );
}
