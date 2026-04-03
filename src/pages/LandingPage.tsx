import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router';
import {
  Users, Phone, ClipboardCheck, Activity,
  ArrowRight, Shield, Database, GitBranch,
  CheckCircle2, ChevronLeft, ChevronRight, Layers, Target,
  Package, Truck, Globe, Warehouse, ClipboardList
} from 'lucide-react';
import '../styles/landing.css';
import { ThemeToggle } from '../components/ThemeToggle';
import { motion, AnimatePresence as FramerAnimatePresence } from 'framer-motion';

/* ── Animated SVG Network Component ── */
function NetworkSVG() {
  return (
    <svg className="ll-network-svg" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
      {/* Static connection lines */}
      <line className="ll-network-line" x1="100" y1="200" x2="350" y2="350" />
      <line className="ll-network-line" x1="350" y1="350" x2="600" y2="250" />
      <line className="ll-network-line" x1="600" y1="250" x2="850" y2="400" />
      <line className="ll-network-line" x1="850" y1="400" x2="1100" y2="300" />
      <line className="ll-network-line" x1="200" y1="500" x2="500" y2="550" />
      <line className="ll-network-line" x1="500" y1="550" x2="750" y2="450" />
      <line className="ll-network-line" x1="750" y1="450" x2="1000" y2="600" />
      <line className="ll-network-line" x1="350" y1="350" x2="500" y2="550" />
      <line className="ll-network-line" x1="600" y1="250" x2="750" y2="450" />
      <line className="ll-network-line" x1="850" y1="400" x2="1000" y2="600" />

      {/* Animated flowing lines */}
      <line className="ll-network-line-animated" x1="100" y1="200" x2="600" y2="250" />
      <line className="ll-network-line-animated" x1="600" y1="250" x2="1100" y2="300" style={{ animationDelay: '-1s' }} />
      <line className="ll-network-line-animated" x1="200" y1="500" x2="750" y2="450" style={{ animationDelay: '-2s' }} />

      {/* Pulsing nodes */}
      {[
        [100, 200], [350, 350], [600, 250], [850, 400], [1100, 300],
        [200, 500], [500, 550], [750, 450], [1000, 600]
      ].map(([cx, cy], i) => (
        <g key={i}>
          <circle className="ll-network-node-ring" cx={cx} cy={cy} r={14} style={{ animationDelay: `${i * 0.4}s` }} />
          <circle className="ll-network-node" cx={cx} cy={cy} r={4} style={{ animationDelay: `${i * 0.3}s` }} />
        </g>
      ))}
    </svg>
  );
}

/* ── Floating Background Icons ── */
function FloatingIcons() {
  return (
    <div className="ll-floating-icons">
      <div className="ll-floating-icon ll-fi-1">
        <Package size={24} color="#00D4AA" />
      </div>
      <div className="ll-floating-icon ll-fi-2">
        <Truck size={22} color="#F59E0B" />
      </div>
      <div className="ll-floating-icon ll-fi-3">
        <Globe size={24} color="#A78BFA" />
      </div>
      <div className="ll-floating-icon ll-fi-4">
        <Warehouse size={20} color="#00D4AA" />
      </div>
      <div className="ll-floating-icon ll-fi-5">
        <ClipboardList size={22} color="#F59E0B" />
      </div>
      <div className="ll-floating-icon ll-fi-6">
        <GitBranch size={20} color="#A78BFA" />
      </div>
    </div>
  );
}

/* ── Screenshot Carousel ── */
function ScreenshotCarousel() {
  const slides = [
    { src: '/images/hero-dashboard.png', label: 'Lead Dashboard' },
    { src: '/images/hero-dashboard.png', label: 'Kanban Pipeline' },
    { src: '/images/hero-dashboard.png', label: 'Lead Details & Interactions' },
    { src: '/images/hero-dashboard.png', label: 'Task Management' },
    { src: '/images/hero-dashboard.png', label: 'Role-Based Views' },
  ];

  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((prev: number) => (prev + 1) % slides.length);
    }, 4000);
  };

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const go = (dir: 1 | -1) => {
    setCurrent((prev: number) => (prev + dir + slides.length) % slides.length);
    resetTimer();
  };

  return (
    <div className="ll-carousel">
      <div className="ll-carousel-viewport">
        <div className="ll-carousel-track" style={{ transform: `translateX(-${current * 100}%)` }}>
          {slides.map((s, i) => (
            <div key={i} className="ll-carousel-slide">
              <img src={s.src} alt={s.label} loading={i === 0 ? 'eager' : 'lazy'} />
            </div>
          ))}
        </div>
        <button className="ll-carousel-btn ll-carousel-prev" onClick={() => go(-1)} aria-label="Previous slide">
          <ChevronLeft size={20} />
        </button>
        <button className="ll-carousel-btn ll-carousel-next" onClick={() => go(1)} aria-label="Next slide">
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="ll-carousel-indicators">
        {slides.map((s, i) => (
          <button
            key={i}
            className={`ll-carousel-dot ${i === current ? 'active' : ''}`}
            onClick={() => { setCurrent(i); resetTimer(); }}
          >
            <span className="ll-carousel-dot-label">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ══════════  MAIN COMPONENT  ══════════ */
export default function LandingPage() {
  /* Scroll-reveal observer */
  useEffect(() => {
    const els = document.querySelectorAll('.ll-reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* Sticky navbar */
  useEffect(() => {
    const handleScroll = () => {
      const nav = document.querySelector('.ll-navbar');
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    { icon: <Users size={22} />, title: 'Lead Management', desc: 'Create, assign, and track leads with structured ownership.' },
    { icon: <Target size={22} />, title: 'Kanban Pipeline', desc: 'Move leads across defined stages with visual workflow tracking.' },
    { icon: <Shield size={22} />, title: 'Role-Based Access', desc: 'ADMIN, MANAGER, SALES — enforced at server level.' },
    { icon: <Phone size={22} />, title: 'Interaction Tracking', desc: 'Log calls, emails, and meetings with timeline visibility.' },
    { icon: <ClipboardCheck size={22} />, title: 'Task Management', desc: 'Assign and track follow-ups linked directly to leads.' },
    { icon: <Activity size={22} />, title: 'Activity Monitoring', desc: 'Track last interactions and identify inactive leads.' },
  ];

  const capabilities = [
    '6-stage pipeline (NEW → CONTACTED → QUALIFIED → PROPOSAL → CONVERTED → LOST)',
    'Server-side RBAC enforcement per route and action',
    'Lead → Task → Interaction relational schema',
    'JWT-based authentication with secure session handling',
    'PostgreSQL database with Prisma ORM',
    'Automatic lastInteraction timestamp updates',
  ];

  const techStack = ['React', 'TypeScript', 'Vite', 'PostgreSQL', 'Prisma', 'JWT Auth', 'Node.js', 'Express', 'Neon DB', 'REST API'];

  return (
    <div className="landing-page">
      {/* ── NAVBAR ── */}
      <nav className="ll-navbar">
        <div className="ll-navbar-inner">
          <Link to="/" className="ll-logo">
            <div className="ll-logo-icon">
              <Layers size={18} />
            </div>
            <span>LeadLink</span>
          </Link>
          <div className="ll-nav-links">
            <a href="#features">Features</a>
            <a href="#capabilities">System</a>
            <a href="#why">Why LeadLink</a>
          </div>
          <div className="ll-nav-actions">
            <ThemeToggle
              className="ll-btn ll-btn-ghost"
              style={{ padding: 10, width: 40, justifyContent: 'center' }}
              aria-label="Toggle theme"
            />
            <Link to="/login" className="ll-btn ll-btn-ghost">Sign In</Link>
            <Link to="/login" className="ll-btn ll-btn-primary ll-hide-mobile">View Demo</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="ll-hero">
        <div className="ll-hero-bg">
          <div className="ll-hero-orb ll-hero-orb-1" />
          <div className="ll-hero-orb ll-hero-orb-2" />
          <div className="ll-hero-orb ll-hero-orb-3" />
          <div className="ll-hero-grid" />
          <NetworkSVG />
          <FloatingIcons />
        </div>

        <div className="ll-hero-content">
          <p className="ll-hero-supporting">
            Built with role-based access control, interaction tracking, and schema-driven workflows.
          </p>

          <h1 className="ll-hero-title">
            Structured CRM for<br />
            <span className="ll-hero-title-accent">Real Sales Execution</span>
          </h1>

          <p className="ll-hero-subtitle">
            Track leads, enforce roles, and manage pipelines with a system built on real backend logic.
          </p>

          <div className="ll-hero-ctas">
            <Link to="/login" className="ll-btn ll-btn-primary ll-btn-lg">
              View Demo <ArrowRight size={16} />
            </Link>
            <a href="#features" className="ll-btn ll-btn-outline ll-btn-lg">
              Explore Features
            </a>
          </div>
        </div>

        {/* Carousel */}
        <ScreenshotCarousel />
      </section>

      {/* ── TECH STACK STRIP ── */}
      <section className="ll-tech-strip">
        <div className="ll-tech-strip-inner">
          {[...techStack, ...techStack].map((t, i) => (
            <span key={i} className="ll-tech-item">
              <span className="ll-tech-dot" />
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="ll-section">
        <div className="ll-section-header ll-reveal">
          <span className="ll-section-label">Features</span>
          <h2 className="ll-section-title">What's Actually Built</h2>
          <p className="ll-section-subtitle">
            Every feature listed here is implemented and functional. No mockups, no roadmap items.
          </p>
        </div>

        <div className="ll-features-grid">
          {features.map((f, i) => (
            <div key={i} className={`ll-feature-card ll-reveal ll-reveal-delay-${(i % 3) + 1}`}>
              <div className="ll-feature-icon">{f.icon}</div>
              <h3 className="ll-feature-title">{f.title}</h3>
              <p className="ll-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SYSTEM CAPABILITIES ── */}
      <section id="capabilities" className="ll-capabilities">
        <div className="ll-section-header ll-reveal">
          <span className="ll-section-label">Under the Hood</span>
          <h2 className="ll-section-title">System Capabilities</h2>
          <p className="ll-section-subtitle">
            The architecture behind LeadLink — not marketing, just implementation facts.
          </p>
        </div>

        <div className="ll-capabilities-grid">
          {capabilities.map((cap, i) => (
            <div key={i} className={`ll-capability-item ll-reveal ll-reveal-delay-${(i % 3) + 1}`}>
              <CheckCircle2 size={16} className="ll-capability-check" />
              <span>{cap}</span>
            </div>
          ))}
        </div>

        <div className="ll-arch-cards ll-reveal">
          <div className="ll-arch-card">
            <Database size={20} />
            <div>
              <h4>PostgreSQL + Prisma</h4>
              <p>Schema-driven data layer with typed queries and migrations</p>
            </div>
          </div>
          <div className="ll-arch-card">
            <Shield size={20} />
            <div>
              <h4>JWT Authentication</h4>
              <p>Secure token-based auth with role enforcement middleware</p>
            </div>
          </div>
          <div className="ll-arch-card">
            <GitBranch size={20} />
            <div>
              <h4>REST API</h4>
              <p>Express routes with validation, error handling, and RBAC guards</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY LEADLINK ── */}
      <section id="why" className="ll-why">
        <div className="ll-why-content ll-reveal">
          <span className="ll-section-label">Why LeadLink</span>
          <h2 className="ll-section-title">Most CRMs are complex and overloaded.</h2>
          <p className="ll-why-body">
            LeadLink CRM focuses on what matters:
          </p>
          <ul className="ll-why-list">
            <li><CheckCircle2 size={16} /> Simplicity in workflow</li>
            <li><CheckCircle2 size={16} /> Structured data relationships</li>
            <li><CheckCircle2 size={16} /> Secure role-based access</li>
          </ul>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="ll-cta">
        <div className="ll-cta-content ll-reveal">
          <h2 className="ll-cta-title">See it in action.</h2>
          <p className="ll-cta-subtitle">LeadLink CRM — structured, secure, and actually built.</p>
          <div className="ll-cta-buttons">
            <Link to="/login" className="ll-btn ll-btn-primary ll-btn-lg">
              View Demo <ArrowRight size={16} />
            </Link>
            <a href="#features" className="ll-btn ll-btn-ghost ll-btn-lg">Explore Features</a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="ll-footer">
        <div className="ll-footer-inner">
          <div className="ll-footer-brand">
            <Link to="/" className="ll-logo">
              <div className="ll-logo-icon"><Layers size={16} /></div>
              <span>LeadLink</span>
            </Link>
            <p>CRM system built for structured lead tracking, pipeline management, and role-based access control.</p>
          </div>
          <div>
            <h4 className="ll-footer-col-title">Product</h4>
            <ul className="ll-footer-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#capabilities">System</a></li>
              <li><a href="#why">Why LeadLink</a></li>
            </ul>
          </div>
          <div>
            <h4 className="ll-footer-col-title">Stack</h4>
            <ul className="ll-footer-links">
              <li><a href="#capabilities">PostgreSQL</a></li>
              <li><a href="#capabilities">Prisma ORM</a></li>
              <li><a href="#capabilities">React + Vite</a></li>
            </ul>
          </div>
        </div>

        <div className="ll-footer-bottom">
          <div>
            <p>© 2026 LeadLink CRM. All rights reserved.</p>
            <p className="ll-footer-credits">
              Developed by Prakyat, Gayatri, Yasti, Pallavi
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
