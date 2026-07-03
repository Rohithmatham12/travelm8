import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const FEATURES = [
  {
    icon: '🧠',
    title: 'AI Co-pilot',
    desc: 'Fatigue warnings when any leg exceeds 4 hours. Late-arrival alerts when you\'ll hit your destination after 10pm.',
  },
  {
    icon: '⚠️',
    title: 'Trip Risk Score',
    desc: 'Low / medium / high risk rating per route — based on drive time, night driving, and stop density.',
  },
  {
    icon: '🗳️',
    title: 'Group Voting',
    desc: 'Share a session code. Everyone votes on stops. Real-time tally so nobody feels left out of the decision.',
  },
  {
    icon: '💰',
    title: 'Budget Tracker',
    desc: 'Estimated vs actual spend. Per-category breakdown: fuel, food, lodging, activities, misc.',
  },
  {
    icon: '📦',
    title: 'Offline Route Packet',
    desc: 'Download a self-contained HTML file with your stops, AI notes, itinerary, and budget. Works with no signal.',
  },
  {
    icon: '📅',
    title: 'Calendar Export',
    desc: 'One click to export your itinerary as an .ics file for Google Calendar, Apple Calendar, or Outlook.',
  },
];

const STEPS = [
  {
    n: '1',
    title: 'Plan your route',
    desc: 'Enter your start and destination. AI suggests rest stops, food, and overnight options along the way.',
  },
  {
    n: '2',
    title: 'Bring your crew',
    desc: 'Share a code. Everyone votes on stops from their phone. You see the tally update live.',
  },
  {
    n: '3',
    title: 'Hit the road',
    desc: 'Download your offline packet and budget tracker. Everything you need — even in the dead zones.',
  },
];

const LandingPage: React.FC = () => (
  <div className="lp">

    {/* ── Nav ── */}
    <nav className="lp-nav">
      <div className="lp-nav-inner">
        <div className="lp-logo">
          <div className="lp-logo-mark">TM8</div>
          <span className="lp-logo-name">Travel<span>M8</span></span>
        </div>
        <div className="lp-nav-actions">
          <Link to="/auth" className="btn btn-ghost btn-sm">Sign in</Link>
          <Link to="/auth" className="btn btn-primary btn-sm">Get started free</Link>
        </div>
      </div>
    </nav>

    {/* ── Hero ── */}
    <section className="lp-hero">
      <div className="lp-hero-inner">
        <div className="lp-badge">Road trip copilot — 100% free</div>
        <h1 className="lp-h1">
          The AI that rides<br />
          <span className="lp-h1-accent">shotgun with you</span>
        </h1>
        <p className="lp-sub">
          Not another itinerary generator. TravelM8 warns you about fatigue, late arrivals,
          and risky drives — then helps your crew agree on stops and tracks every dollar.
        </p>
        <div className="lp-hero-cta">
          <Link to="/auth" className="btn btn-primary btn-lg">Plan your first trip</Link>
          <a href="#features" className="btn btn-secondary btn-lg">See what it does</a>
        </div>
        <div className="lp-hero-stats">
          <div className="lp-stat"><span className="lp-stat-n">4h+</span><span className="lp-stat-l">fatigue threshold</span></div>
          <div className="lp-stat-div" />
          <div className="lp-stat"><span className="lp-stat-n">100%</span><span className="lp-stat-l">free forever</span></div>
          <div className="lp-stat-div" />
          <div className="lp-stat"><span className="lp-stat-n">offline</span><span className="lp-stat-l">route packets</span></div>
        </div>
      </div>
      <div className="lp-hero-glow" aria-hidden="true" />
    </section>

    {/* ── Features ── */}
    <section className="lp-features" id="features">
      <div className="lp-section-inner">
        <p className="lp-section-label">Features</p>
        <h2 className="lp-h2">Everything a road trip actually needs</h2>
        <div className="lp-features-grid">
          {FEATURES.map(f => (
            <div className="lp-feat-card" key={f.title}>
              <div className="lp-feat-icon">{f.icon}</div>
              <h3 className="lp-feat-title">{f.title}</h3>
              <p className="lp-feat-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── How it works ── */}
    <section className="lp-how">
      <div className="lp-section-inner">
        <p className="lp-section-label">How it works</p>
        <h2 className="lp-h2">Three steps, then you drive</h2>
        <div className="lp-steps">
          {STEPS.map((s, i) => (
            <div className="lp-step" key={i}>
              <div className="lp-step-n">{s.n}</div>
              <div className="lp-step-content">
                <h3 className="lp-step-title">{s.title}</h3>
                <p className="lp-step-desc">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── CTA band ── */}
    <section className="lp-cta-band">
      <div className="lp-section-inner lp-cta-inner">
        <h2 className="lp-cta-title">Ready for your next road trip?</h2>
        <p className="lp-cta-sub">No credit card. No install. Works on any device.</p>
        <Link to="/auth" className="btn btn-primary btn-lg">Get started free</Link>
      </div>
    </section>

    {/* ── Footer ── */}
    <footer className="lp-footer">
      <div className="lp-footer-inner">
        <div className="lp-logo">
          <div className="lp-logo-mark lp-logo-mark-sm">TM8</div>
          <span className="lp-logo-name lp-logo-name-sm">Travel<span>M8</span></span>
        </div>
        <p className="lp-footer-copy">Built on 100% free APIs. No credit card ever required.</p>
      </div>
    </footer>

  </div>
);

export default LandingPage;
