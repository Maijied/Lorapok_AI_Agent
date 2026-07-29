/* ============================================================
   LORAPOK AI — Website Interactive Features
   A product of Lorapok Labs · https://lorapok.tech
   ============================================================ */

(function () {
  'use strict';

  // ── Navbar Scroll Effect ──
  const navbar = document.getElementById('navbar');
  let lastScroll = 0;

  function handleNavScroll() {
    const scrollY = window.scrollY;
    if (scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    lastScroll = scrollY;
  }
  window.addEventListener('scroll', handleNavScroll, { passive: true });

  // ── Active Nav Link Highlighting ──
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  function highlightNavLink() {
    const scrollY = window.scrollY + 100;
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      if (scrollY >= top && scrollY < top + height) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('active');
          }
        });
      }
    });
  }
  window.addEventListener('scroll', highlightNavLink, { passive: true });

  // ── Mobile Hamburger Menu ──
  const hamburger = document.getElementById('nav-hamburger');
  const drawer = document.getElementById('nav-drawer');

  if (hamburger && drawer) {
    hamburger.addEventListener('click', function () {
      this.classList.toggle('open');
      drawer.classList.toggle('open');
      this.setAttribute('aria-expanded', drawer.classList.contains('open'));
      document.body.style.overflow = drawer.classList.contains('open') ? 'hidden' : '';
    });

    // Close drawer on nav link click
    drawer.querySelectorAll('.nav-link, .btn').forEach(link => {
      link.addEventListener('click', function () {
        hamburger.classList.remove('open');
        drawer.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // ── Typewriter Effect ──
  const typewriterEl = document.getElementById('typewriter-text');
  const phrases = [
    'Plan. Code. Execute.',
    'Commit. Deploy. Ship.',
    'Analyze. Refactor. Test.',
    'Debug. Optimize. Scale.'
  ];
  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typewriterTimeout;

  function typewrite() {
    if (!typewriterEl) return;
    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
      typewriterEl.textContent = currentPhrase.substring(0, charIndex - 1);
      charIndex--;
    } else {
      typewriterEl.textContent = currentPhrase.substring(0, charIndex + 1);
      charIndex++;
    }

    let delay = isDeleting ? 40 : 80;

    if (!isDeleting && charIndex === currentPhrase.length) {
      delay = 2500;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      delay = 400;
    }

    typewriterTimeout = setTimeout(typewrite, delay);
  }
  typewrite();

  // ── Hero Particle Canvas ──
  const canvas = document.getElementById('hero-particles');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    const symbols = ['{ }', '</>', '//', '=>', 'fn()', '[ ]', '&&', '||', '++', '::'];

    function resizeCanvas() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.symbol = symbols[Math.floor(Math.random() * symbols.length)];
        this.opacity = Math.random() * 0.15 + 0.05;
        this.size = Math.random() * 6 + 10;
        this.life = Math.random() * 500 + 300;
        this.age = 0;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.age++;
        if (this.age > this.life || this.x < -50 || this.x > canvas.width + 50 || this.y < -50 || this.y > canvas.height + 50) {
          this.reset();
        }
      }
      draw() {
        const fadeFactor = this.age < 30 ? this.age / 30 : this.age > this.life - 30 ? (this.life - this.age) / 30 : 1;
        ctx.globalAlpha = this.opacity * fadeFactor;
        ctx.font = this.size + 'px "JetBrains Mono", monospace';
        ctx.fillStyle = Math.random() > 0.5 ? '#7C3AED' : '#22D3EE';
        ctx.fillText(this.symbol, this.x, this.y);
      }
    }

    // Create particles
    const particleCount = Math.min(40, Math.floor(canvas.width / 40));
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    function animateParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      ctx.globalAlpha = 1;
      requestAnimationFrame(animateParticles);
    }
    animateParticles();
  }

  // ── Copy to Clipboard ──
  window.copyCode = function (text) {
    navigator.clipboard.writeText(text).then(function () {
      showToast('✓ Copied to clipboard!');
    }).catch(function () {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('✓ Copied to clipboard!');
    });
  };

  // Hero copy button
  const heroCopyBtn = document.getElementById('hero-copy-btn');
  if (heroCopyBtn) {
    heroCopyBtn.addEventListener('click', function () {
      window.copyCode('npm install -g lorapok-ai');
      this.classList.add('copied');
      setTimeout(() => this.classList.remove('copied'), 2000);
    });
  }

  // ── Toast Notification ──
  const toast = document.getElementById('toast');
  let toastTimer;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('show');
    }, 2500);
  }

  // ── Installation Tab Switching ──
  const tabs = document.querySelectorAll('.cli-tab');
  const panels = document.querySelectorAll('.cli-panel');

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      const targetTab = this.getAttribute('data-tab');
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      panels.forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      this.setAttribute('aria-selected', 'true');
      const targetPanel = document.getElementById('panel-' + targetTab);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });

  // ── Scroll Reveal (IntersectionObserver) ──
  const revealElements = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    // Fallback: show all immediately
    revealElements.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  // ── Stats Counter Animation ──
  const statValues = document.querySelectorAll('.hero-stat-value[data-count]');

  if ('IntersectionObserver' in window && statValues.length > 0) {
    const statsObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute('data-count'), 10);
          animateCounter(el, target);
          statsObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    statValues.forEach(function (el) {
      statsObserver.observe(el);
    });
  }

  function animateCounter(el, target) {
    let current = 0;
    const increment = Math.ceil(target / 60);
    const suffix = el.textContent.includes('+') ? '+' : '';

    function step() {
      current += increment;
      if (current >= target) {
        el.textContent = target + suffix;
        return;
      }
      el.textContent = current + suffix;
      requestAnimationFrame(step);
    }
    step();
  }

  // ── Smooth Scroll for Anchor Links ──
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height'), 10) || 72;
        const top = targetEl.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

})();
