import React, { useEffect, useRef } from 'react';

const floatingTerms = [
  '{ }', '</>', '//', '=>', 'fn()', '[ ]', '&&', '||', '++', '::',
  'lorapok', 'AI Agent', 'API Atlas', 'TabMan', 'LLDP Engine', 'MindNode',
  'Gemini 3.6', 'Ollama', 'LocalSync', 'LoraCon', '0x00FF88', 'async/await',
  'Cybernetic Larva', 'Vectors', 'Querycraft', 'LaraTest', 'Git Geek'
];

export default function GlobalParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.45;
        this.vy = (Math.random() - 0.5) * 0.45;
        this.term = floatingTerms[Math.floor(Math.random() * floatingTerms.length)];
        this.opacity = Math.random() * 0.12 + 0.04;
        this.size = Math.random() * 5 + 11;
        this.color = Math.random() > 0.5 ? '#00FF88' : Math.random() > 0.5 ? '#7C3AED' : '#22D3EE';
        this.life = Math.random() * 600 + 400;
        this.age = 0;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.age++;

        if (
          this.age > this.life ||
          this.x < -100 ||
          this.x > canvas.width + 100 ||
          this.y < -100 ||
          this.y > canvas.height + 100
        ) {
          this.reset();
        }
      }
      draw() {
        const fade =
          this.age < 40 ? this.age / 40 : this.age > this.life - 40 ? (this.life - this.age) / 40 : 1;
        ctx.globalAlpha = this.opacity * fade;
        ctx.font = `${this.size}px "JetBrains Mono", monospace`;
        ctx.fillStyle = this.color;
        ctx.fillText(this.term, this.x, this.y);
      }
    }

    const count = Math.min(60, Math.floor(window.innerWidth / 25));
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }

    let animationFrameId;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.85
      }}
    />
  );
}
