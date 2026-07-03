import React, { useState } from 'react';
import './DriverRotation.css';

interface Props {
  totalDistance: number;   // miles
  driveTimeMinutes: number;
}

interface Leg { driver: string; fromMile: number; toMile: number; durationMin: number; }

function buildSchedule(names: string[], totalMiles: number, totalMin: number, segMin: number): Leg[] {
  if (!names.length || totalMiles <= 0 || totalMin <= 0) return [];
  const numSegs = Math.ceil(totalMin / segMin);
  const milesPerSeg = totalMiles / numSegs;
  const legs: Leg[] = [];
  for (let i = 0; i < numSegs; i++) {
    const isLast = i === numSegs - 1;
    legs.push({
      driver: names[i % names.length],
      fromMile: Math.round(i * milesPerSeg),
      toMile: Math.round(isLast ? totalMiles : (i + 1) * milesPerSeg),
      durationMin: isLast ? (totalMin - i * segMin) : segMin,
    });
  }
  return legs;
}

function fmtDur(m: number) {
  const h = Math.floor(m / 60), min = m % 60;
  return h > 0 ? `${h}h${min > 0 ? ` ${min}m` : ''}` : `${min}m`;
}

export const DriverRotation: React.FC<Props> = ({ totalDistance, driveTimeMinutes }) => {
  const [open, setOpen] = useState(false);
  const [names, setNames] = useState(['', '']);
  const [segHours, setSegHours] = useState(2);

  const validNames = names.map(n => n.trim()).filter(Boolean);
  const legs = open && validNames.length >= 2
    ? buildSchedule(validNames, totalDistance, driveTimeMinutes, segHours * 60)
    : [];

  const addDriver = () => setNames(p => [...p, '']);
  const removeDriver = (i: number) => setNames(p => p.filter((_, idx) => idx !== i));
  const setName = (i: number, v: string) => setNames(p => p.map((n, idx) => idx === i ? v : n));

  return (
    <div className="dr-panel">
      <button className="dr-toggle" onClick={() => setOpen(o => !o)}>
        🚗 Driver rotation schedule
        <span className="dr-chevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="dr-body">
          <p className="dr-hint">Who's driving? Enter driver names. App splits the route into {segHours}h legs.</p>
          <div className="dr-inputs">
            {names.map((n, i) => (
              <div key={i} className="dr-name-row">
                <input
                  className="dr-name-input"
                  placeholder={`Driver ${i + 1}`}
                  value={n}
                  onChange={e => setName(i, e.target.value)}
                  maxLength={30}
                />
                {names.length > 2 && (
                  <button className="dr-remove" onClick={() => removeDriver(i)} aria-label="Remove driver">×</button>
                )}
              </div>
            ))}
            {names.length < 6 && (
              <button className="dr-add-driver" onClick={addDriver}>+ Add driver</button>
            )}
          </div>
          <div className="dr-seg-row">
            <label className="dr-seg-label">Swap every</label>
            {[1, 1.5, 2, 2.5, 3].map(h => (
              <button
                key={h}
                className={`dr-seg-chip${segHours === h ? ' dr-seg-chip-on' : ''}`}
                onClick={() => setSegHours(h)}
              >
                {h}h
              </button>
            ))}
          </div>
          {validNames.length < 2 && (
            <p className="dr-need-more">Enter at least 2 driver names to see the schedule.</p>
          )}
          {legs.length > 0 && (
            <div className="dr-schedule">
              {legs.map((leg, i) => (
                <div key={i} className={`dr-leg dr-leg-${i % validNames.length}`}>
                  <div className="dr-leg-driver">{leg.driver}</div>
                  <div className="dr-leg-info">
                    <span className="dr-leg-miles">Mile {leg.fromMile} → {leg.toMile}</span>
                    <span className="dr-leg-dur">{fmtDur(leg.durationMin)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
