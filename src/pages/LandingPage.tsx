import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Users, Target, BarChart3, Calendar, Phone, Handshake, ArrowRight, CheckCircle2, Menu, X, Package, Truck, Globe, Warehouse, ClipboardList, GitBranch } from 'lucide-react';
import '../styles/landing.css';
import { ThemeToggle } from '../components/ThemeToggle';

/* ── Animated Counter Hook ── */
function useCounter(end: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const step = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(eased * end));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.3 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return { count, ref };
}

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
          <circle className="ll-network-node-ring" cx={cx} cy={cy} r={10} style={{ animationDelay: `${i * 0.4}s` }} />
          <circle className="ll-network-node" cx={cx} cy={cy} r={3} style={{ animationDelay: `${i * 0.3}s` }} />
        </g>
      ))}
    </svg>
  );
}

/* ── Floating Supply Chain Icons ── */
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

/* ══════════  MAIN COMPONENT  ══════════ */
export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  /* Scroll-reveal observer */
  useEffect(() => {
    const els = document.querySelectorAll('.ll-reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
    }, { threshold: 0.15 });
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

  const stat1 = useCounter(500);
  const stat2 = useCounter(98);
  const stat3 = useCounter(2, 1500);
  const stat4 = useCounter(24);

  const features = [
    { icon: <Users size={24} />, title: 'Lead Intelligence', desc: 'Capture and nurture leads through your supply chain ecosystem with technical prioritization.', color: 'teal' },
    { icon: <Target size={24} />, title: 'Pipeline Orchestration', desc: 'Visual Kanban boards that map your entire vendor and client pipeline from first contact to contract.', color: 'amber' },
    { icon: <Calendar size={24} />, title: 'Meeting Command', desc: 'Coordinate meetings across stakeholders, suppliers, and distribution partners seamlessly.', color: 'purple' },
    { icon: <Phone size={24} />, title: 'Follow-up Management', desc: 'Never miss a follow-up. Smart reminders and automated sequences keep your supply chain relationships organized.', color: 'teal' },
    { icon: <BarChart3 size={24} />, title: 'Supply Analytics', desc: 'Real-time dashboards tracking conversion rates and supply chain performance metrics.', color: 'amber' },
    { icon: <Handshake size={24} />, title: 'Partner Collaboration', desc: 'Centralized workspace for teams to align on vendor negotiations and logistics coordination.', color: 'purple' },
  ];


  const companies = ['SwiftRoute', 'LogiCore', 'FleetNova', 'ChainSync', 'FreightPulse', 'VendorVault', 'SupplyEdge', 'CargoWise', 'ProcureHub', 'TradeLink'];

  return (
    <div className="landing-page">
      {/* ── NAVBAR ── */}
      <nav className="ll-navbar">
        <div className="ll-navbar-inner">
          <Link to="/" className="ll-logo">
            <div className="ll-logo-icon">
              <Package size={20} />
            </div>
            <span>Lead Link</span>
          </Link>
          <div className="ll-nav-links">
            <a href="#features">Features</a>
            <a href="#how">How It Works</a>

          </div>
          <div className="ll-nav-actions">
            <ThemeToggle
              className="ll-btn ll-btn-ghost"
              style={{ padding: 11, width: 44, justifyContent: 'center' }}
              aria-label="Toggle theme"
            />
            <Link to="/login" className="ll-btn ll-btn-ghost">Sign In</Link>
            <Link to="/login" className="ll-btn ll-btn-primary">Get Started</Link>
          </div>
          <button className="ll-mobile-toggle" onClick={() => setMobileOpen(true)}>
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`ll-mobile-menu ${mobileOpen ? 'open' : ''}`}>
        <button className="ll-mobile-close" onClick={() => setMobileOpen(false)}>
          <X size={28} />
        </button>
        <ThemeToggle
          className="ll-btn ll-btn-ghost"
          style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
          aria-label="Toggle theme"
        />
        <a href="#features" onClick={() => setMobileOpen(false)}>Features</a>
        <a href="#how" onClick={() => setMobileOpen(false)}>How It Works</a>

        <Link to="/login" onClick={() => setMobileOpen(false)}>Sign In</Link>
      </div>

      {/* ── HERO ── */}
      <section className="ll-hero">
        <div className="ll-hero-bg">
          <div className="ll-hero-orb ll-hero-orb-1" />
          <div className="ll-hero-orb ll-hero-orb-2" />
          <div className="ll-hero-orb ll-hero-orb-3" />
          <div className="ll-hero-grid" />
          <NetworkSVG />
        </div>

        <FloatingIcons />

        <div className="ll-hero-content">
          <div className="ll-hero-badge">
            <span className="ll-hero-badge-dot" />
            Lead Link — College Mini Project Showcase
          </div>

          <h1 className="ll-hero-title">
            Lead Link <span style={{ background: 'linear-gradient(135deg, #00D4AA, #6EE7B7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CRM</span>
          </h1>

          <p className="ll-hero-subtitle">
            A comprehensive CRM platform for lead management, procurement orchestration, and relationship visibility — built from the ground up.
          </p>

          <div className="ll-hero-ctas">
            <Link to="/login" className="ll-btn ll-btn-primary ll-btn-large">
              Get Started <ArrowRight size={18} />
            </Link>
            <a href="#features" className="ll-btn ll-btn-outline ll-btn-large">
              Explore Tech Stack
            </a>
          </div>

          <div className="ll-hero-stats-row">
            <div className="ll-hero-stat-item">
              <div className="ll-hero-stat-number">Lead</div>
              <div className="ll-hero-stat-label">Scoring</div>
            </div>
            <div className="ll-hero-stat-divider" />
            <div className="ll-hero-stat-item">
              <div className="ll-hero-stat-number">Pipeline</div>
              <div className="ll-hero-stat-label">Kanban</div>
            </div>
            <div className="ll-hero-stat-divider" />
            <div className="ll-hero-stat-item">
              <div className="ll-hero-stat-number">Vendor</div>
              <div className="ll-hero-stat-label">Tracking</div>
            </div>
          </div>
        </div>

        {/* Hero Dashboard Image */}
        <div className="ll-hero-image-wrapper">
          <div className="ll-hero-image-container">
            <img src="/images/hero-dashboard.png" alt="Lead Link CRM Supply Chain Dashboard" loading="eager" />
          </div>
          <div className="ll-hero-image-glow" />
        </div>
      </section>

      {/* ── TRUSTED BY ── */}
      <section className="ll-trusted">
        <p className="ll-trusted-label">Core Modules & Technical Foundation</p>
        <div className="ll-marquee-wrapper">
          <div className="ll-marquee-track">
            {[...companies, ...companies].map((c, i) => (
              <span key={i} className="ll-marquee-item">
                <span className="ll-marquee-dot" />
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="ll-features">
        <div className="ll-features-header ll-reveal">
          <p className="ll-section-label">Capabilities</p>
          <h2 className="ll-section-title">Built for Supply Chain Professionals</h2>
          <p className="ll-section-subtitle">
            Every feature designed to streamline vendor management, procurement workflows, and logistics coordination.
          </p>
        </div>

        <div className="ll-features-grid">
          {features.map((f, i) => (
            <div key={i} className={`ll-feature-card ll-reveal ll-reveal-delay-${(i % 3) + 1}`}>
              <div className={`ll-feature-icon ${f.color}`}>{f.icon}</div>
              <h3 className="ll-feature-title">{f.title}</h3>
              <p className="ll-feature-desc" style={{ textAlign: 'left' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="ll-stats">
        <div className="ll-stats-network-bg" />
        <div className="ll-stats::before" />
        <div className="ll-stats-grid">
          <div className="ll-stat-card ll-reveal">
            <div className="ll-stat-number teal">Neon DB</div>
            <div className="ll-stat-label">Serverless Database</div>
          </div>
          <div className="ll-stat-card ll-reveal ll-reveal-delay-1">
            <div className="ll-stat-number amber">Secure</div>
            <div className="ll-stat-label">JWT Authentication</div>
          </div>
          <div className="ll-stat-card ll-reveal ll-reveal-delay-2">
            <div className="ll-stat-number purple">Vite</div>
            <div className="ll-stat-label">React Framework</div>
          </div>
          <div className="ll-stat-card ll-reveal ll-reveal-delay-3">
            <div className="ll-stat-number white">Full</div>
            <div className="ll-stat-label">Admin Control</div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="ll-how">
        <div className="ll-how-header ll-reveal">
          <p className="ll-section-label">Process</p>
          <h2 className="ll-section-title">Three Steps to Streamlined Supply Chain CRM</h2>
          <p className="ll-section-subtitle">Get your entire procurement and vendor management pipeline running in minutes.</p>
        </div>

        <div className="ll-how-steps">
          {[
            { num: '01', title: 'Import Your Network', desc: 'Bulk-import your existing suppliers, vendors, and client contacts. Our system auto-enriches each profile with company data.', step: 'step-1' },
            { num: '02', title: 'Automate Workflows', desc: 'Set up follow-up sequences, meeting notifications, and pipeline stage triggers tailored to your supply chain processes.', step: 'step-2' },
            { num: '03', title: 'Scale & Optimize', desc: 'Use real-time analytics to identify bottlenecks, forecast procurement needs, and optimize your entire vendor lifecycle.', step: 'step-3' },
          ].map((s, i) => (
            <div key={i} className={`ll-step-card ll-reveal ll-reveal-delay-${i + 1}`}>
              <div className={`ll-step-number ${s.step}`}>{s.num}</div>
              <h3 className="ll-step-title">{s.title}</h3>
              <p className="ll-step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>


      {/* ── CTA ── */}
      <section className="ll-cta">
        <div className="ll-cta-bg" />
        <div className="ll-cta-content ll-reveal">
          <h2 className="ll-cta-title">Lead Link</h2>
          <p className="ll-cta-subtitle">A comprehensive CRM project developed to streamline supply chain and procurement workflows.</p>
          <div className="ll-cta-buttons">
            <Link to="/login" className="ll-btn ll-btn-primary ll-btn-large">
              Sign Up Now <ArrowRight size={18} />
            </Link>
            <a href="#features" className="ll-btn ll-btn-ghost ll-btn-large">Technical Docs</a>
          </div>
          <p className="ll-cta-note">Secure Sign-up · Neon DB Backend · React Frontend</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="ll-footer">
        <div className="ll-footer-inner">
          <div className="ll-footer-brand">
            <Link to="/" className="ll-nav-brand">
              <div className="ll-nav-logo"><Package size={18} /></div>
              <span>Lead Link</span>
            </Link>
            <p>A comprehensive CRM project developed to streamline supply chain and procurement workflows.</p>
          </div>
          <div>
            <h4 className="ll-footer-col-title">Product</h4>
            <ul className="ll-footer-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#how">How It Works</a></li>

            </ul>
          </div>
          <div>
            <h4 className="ll-footer-col-title">Company</h4>
            <ul className="ll-footer-links">
              <li><a href="#">About Us</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="ll-footer-col-title">Legal</h4>
            <ul className="ll-footer-links">
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">GDPR</a></li>
            </ul>
          </div>
        </div>

        <div className="ll-footer-bottom">
          <div>
            <p>© 2026 Lead Link CRM. All rights reserved.</p>
            <p style={{ fontSize: '0.72rem', marginTop: 4, color: 'var(--ll-muted-dim)' }}>
              Developed by: Prakyat, Gayatri, Yasti, Pallavi
            </p>
          </div>
          <div className="ll-footer-social">
            {['𝕏', 'in', 'GH'].map((label, i) => (
              <a key={i} href="#">{label}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
