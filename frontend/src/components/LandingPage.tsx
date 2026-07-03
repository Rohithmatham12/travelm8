import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const FEATURES = [
  {
    icon: '📊',
    title: 'Pre-trip cost estimate',
    desc: 'Enter your MPG and gas price. TravelM8 calculates your fuel, motel, and meal costs from the actual route distance — before you spend a dollar. Splitwise can\'t do this.',
  },
  {
    icon: '💸',
    title: 'Settle Up — automatic',
    desc: 'Tag who paid for each expense during the trip. Hit Settle Up: the app calculates exact payments to even it out. No group text, no spreadsheet.',
  },
  {
    icon: '🗳️',
    title: 'Crew stop voting',
    desc: 'Share a code. Everyone votes on stops from their phone. Live tally — no arguing about where to eat.',
  },
  {
    icon: '🌦️',
    title: 'Weather along your route',
    desc: 'Forecast at your origin and destination for your exact travel date. Google Maps doesn\'t surface this for road trips.',
  },
  {
    icon: '⛽',
    title: 'Gas stations along route',
    desc: 'See fuel stops within your route corridor before you leave — not just near your current location.',
  },
  {
    icon: '⚠️',
    title: 'Fatigue & safety warnings',
    desc: 'AI flags legs over 4 hours, late-night arrivals, and high-risk driving windows before you book anything.',
  },
];

const STEPS = [
  {
    n: '1',
    title: 'Plan your route together',
    desc: 'Enter your start and end. AI picks rest stops, food, and motels. Share a code — crew votes on stops from their phones.',
  },
  {
    n: '2',
    title: 'Drive with confidence',
    desc: 'AI warns you about fatigue, late arrivals, and bad timing. Weather forecast shows what\'s waiting at each end.',
  },
  {
    n: '3',
    title: 'Settle up automatically',
    desc: 'Log who paid for what during the trip. Hit Settle Up — the app calculates the minimum transactions to even it out.',
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
        <div className="lp-badge">The only road trip app built for groups</div>
        <h1 className="lp-h1">
          Know the cost before<br />
          <span className="lp-h1-accent">you leave the driveway.</span>
        </h1>
        <p className="lp-sub">
          Enter your route. TravelM8 estimates fuel, motels, and meals from your actual miles and MPG
          — then helps your crew vote on stops, tracks who paid what, and settles up after. Splitwise
          starts when the trip ends. TravelM8 starts when you plan it.
        </p>
        <div className="lp-hero-cta">
          <Link to="/auth" className="btn btn-primary btn-lg">Plan your first trip free</Link>
          <a href="#features" className="btn btn-secondary btn-lg">See what's different</a>
        </div>
        <div className="lp-hero-stats">
          <div className="lp-stat"><span className="lp-stat-n">Pre-trip</span><span className="lp-stat-l">cost estimate</span></div>
          <div className="lp-stat-div" />
          <div className="lp-stat"><span className="lp-stat-n">Auto</span><span className="lp-stat-l">settle up</span></div>
          <div className="lp-stat-div" />
          <div className="lp-stat"><span className="lp-stat-n">100%</span><span className="lp-stat-l">free forever</span></div>
        </div>
      </div>
      <div className="lp-hero-glow" aria-hidden="true" />
    </section>

    {/* ── USP callout ── */}
    <section className="lp-usp">
      <div className="lp-section-inner">
        <div className="lp-usp-grid">
          <div className="lp-usp-card">
            <span className="lp-usp-x">❌</span>
            <p><strong>Google Maps</strong> — routes for one person, no expense splitting, no group decisions</p>
          </div>
          <div className="lp-usp-card lp-usp-card-us">
            <span className="lp-usp-x">✅</span>
            <p><strong>TravelM8</strong> — your whole crew plans together, votes on stops, and settles up after</p>
          </div>
          <div className="lp-usp-card">
            <span className="lp-usp-x">❌</span>
            <p><strong>Splitwise</strong> — tracks expenses but knows nothing about your route or stops</p>
          </div>
          <div className="lp-usp-card">
            <span className="lp-usp-x">❌</span>
            <p><strong>Roadtrippers</strong> — solo POI discovery, no group collaboration, no budget splitting</p>
          </div>
        </div>
      </div>
    </section>

    {/* ── Features ── */}
    <section className="lp-features" id="features">
      <div className="lp-section-inner">
        <p className="lp-section-label">Features</p>
        <h2 className="lp-h2">What no other app does</h2>
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
        <h2 className="lp-cta-title">Your crew's next road trip deserves better than a group text</h2>
        <p className="lp-cta-sub">No credit card. No install. Free forever.</p>
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
