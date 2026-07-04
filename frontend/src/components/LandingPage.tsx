import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const BEFORE = [
  { icon: '🗺️', app: 'Google Maps', does: 'routing' },
  { icon: '💰', app: 'Splitwise', does: 'expenses — after the trip' },
  { icon: '🌤', app: 'Weather app', does: 'forecasts (you check it manually)' },
  { icon: '💬', app: 'Group chat', does: 'decisions, packing, arguments' },
  { icon: '📝', app: 'Notes app', does: 'packing list' },
];

const AFTER = [
  '✅ Route planning with AI stop suggestions',
  '✅ Pre-trip fuel, motel & meal cost estimate',
  '✅ Budget tracker + automatic settle up',
  '✅ Weather at origin & destination',
  '✅ Crew voting on stops — live tally',
  '✅ AI packing list',
  '✅ Driver rotation schedule',
  '✅ Trip Safety Score',
];

const FEATURES = [
  {
    icon: '🛡️',
    title: 'Trip Safety Score',
    desc: 'Every route gets a 0–100 safety score. AI checks drive time, departure hour, and rest stop frequency. No other app tells you a route is dangerous before you drive it.',
    badge: 'Unique to TravelM8',
  },
  {
    icon: '📊',
    title: 'Pre-trip cost estimate',
    desc: 'Enter your MPG and gas price. TravelM8 calculates exact fuel, motel, and meal costs from the route distance — before you spend a dollar. Splitwise can\'t do this.',
    badge: null,
  },
  {
    icon: '💸',
    title: 'Settle up automatically',
    desc: 'Tag who paid for each expense. Hit Settle Up — the app calculates the minimum transactions to even it out. No group text, no spreadsheet.',
    badge: null,
  },
  {
    icon: '🗳️',
    title: 'Crew stop voting',
    desc: 'Share a 6-digit code. Everyone votes on stops from their phone. Live tally updates instantly. No more "whatever you want" arguments.',
    badge: null,
  },
  {
    icon: '🎒',
    title: 'AI packing list',
    desc: 'One tap generates a packing list tailored to your destination, trip length, and group size. Check items off as you pack.',
    badge: null,
  },
  {
    icon: '🚗',
    title: 'Driver rotation',
    desc: 'Enter driver names. TravelM8 builds a round-robin schedule splitting the route into 2-hour legs. Who drives when — settled before you leave.',
    badge: null,
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
        <div className="lp-badge">100% free · no credit card</div>
        <h1 className="lp-h1">
          Stop using 4 apps<br />
          <span className="lp-h1-accent">for one road trip.</span>
        </h1>
        <p className="lp-sub">
          Google Maps. Splitwise. Weather app. Group chat. You're already using four apps and the
          trip hasn't started. TravelM8 replaces all of them — built specifically for road trips
          with a crew.
        </p>
        <div className="lp-hero-cta">
          <Link to="/auth" className="btn btn-primary btn-lg">Plan your first trip free</Link>
          <a href="#compare" className="btn btn-secondary btn-lg">See the difference</a>
        </div>
        <div className="lp-hero-stats">
          <div className="lp-stat"><span className="lp-stat-n">Safety</span><span className="lp-stat-l">score per route</span></div>
          <div className="lp-stat-div" />
          <div className="lp-stat"><span className="lp-stat-n">Pre-trip</span><span className="lp-stat-l">cost estimate</span></div>
          <div className="lp-stat-div" />
          <div className="lp-stat"><span className="lp-stat-n">100%</span><span className="lp-stat-l">free forever</span></div>
        </div>
      </div>
      <div className="lp-hero-glow" aria-hidden="true" />
    </section>

    {/* ── 4 apps → 1 comparison ── */}
    <section className="lp-compare" id="compare">
      <div className="lp-section-inner">
        <p className="lp-section-label">The problem</p>
        <h2 className="lp-h2">Your crew is already using 5 apps. None of them talk to each other.</h2>
        <div className="lp-compare-grid">
          <div className="lp-compare-col lp-compare-before">
            <div className="lp-compare-col-header">
              <span className="lp-compare-badge lp-compare-badge-before">Before TravelM8</span>
            </div>
            {BEFORE.map(b => (
              <div key={b.app} className="lp-compare-row">
                <span className="lp-compare-icon">{b.icon}</span>
                <div>
                  <strong>{b.app}</strong>
                  <span className="lp-compare-does"> — {b.does}</span>
                </div>
              </div>
            ))}
            <div className="lp-compare-pain">
              Result: 47 unread group chat messages and nobody knows who owes what.
            </div>
          </div>

          <div className="lp-compare-arrow">→</div>

          <div className="lp-compare-col lp-compare-after">
            <div className="lp-compare-col-header">
              <span className="lp-compare-badge lp-compare-badge-after">TravelM8</span>
            </div>
            {AFTER.map(a => (
              <div key={a} className="lp-compare-row lp-compare-row-after">
                <span>{a}</span>
              </div>
            ))}
            <div className="lp-compare-win">
              One app. Whole crew. No arguments.
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ── Safety Score callout ── */}
    <section className="lp-score-callout">
      <div className="lp-section-inner lp-score-inner">
        <div className="lp-score-text">
          <div className="lp-badge" style={{ marginBottom: 16 }}>Only on TravelM8</div>
          <h2 className="lp-h2" style={{ marginBottom: 12 }}>Every route gets a Safety Score.</h2>
          <p className="lp-sub" style={{ marginBottom: 0 }}>
            Google Maps will route you through the night without warning. TravelM8 checks drive
            time, departure hour, and rest stop frequency — then gives your route a 0–100 safety
            score with specific risk flags. Know before you leave whether the route is safe.
          </p>
        </div>
        <div className="lp-score-demo">
          <div className="lp-score-card">
            <div className="lp-score-ring" style={{ '--score-color': '#d97706' } as React.CSSProperties}>
              <span className="lp-score-num">72</span>
              <span className="lp-score-denom">/100</span>
            </div>
            <div className="lp-score-label" style={{ color: '#d97706' }}>Moderate</div>
            <div className="lp-score-risks">
              <div className="lp-score-risk">⚠ Drive exceeds 6 hours</div>
              <div className="lp-score-risk">⚠ Evening departure</div>
            </div>
            <div className="lp-score-tip">💡 Add a rest stop to improve your score</div>
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
              {f.badge && <span className="lp-feat-badge">{f.badge}</span>}
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
          {[
            { n: '1', title: 'Plan together', desc: 'Enter origin, destination, departure date. AI picks rest stops and motels. Share a 6-digit code — crew votes on stops from their phones.' },
            { n: '2', title: 'Check the safety score', desc: 'Your route gets a 0–100 safety score before you commit. Fatigue warnings, late-arrival flags, risk level. Adjust stops until the score is green.' },
            { n: '3', title: 'Drive and settle up', desc: 'Track who paid for gas, food, motels during the trip. Hit Settle Up when you\'re home — minimum transactions, no arguments.' },
          ].map((s, i) => (
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
        <h2 className="lp-cta-title">Close those 4 tabs. Open TravelM8.</h2>
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
