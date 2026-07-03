import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { get, post, del } from '../utils/api';
import { toast } from '../utils/toast';
import './BudgetTracker.css';

type Category = 'fuel' | 'food' | 'lodging' | 'activities' | 'misc';

interface BudgetEntry {
  entryId: string;
  category: Category;
  amount: number;
  description?: string;
  date: string;
  paidBy?: string;
}

interface BudgetData {
  estimatedBudget: number | null;
  spendEntries: BudgetEntry[];
  totals: { total: number; byCategory: Record<Category, number> };
}

interface Settlement { from: string; to: string; amount: number; }

const CAT_LABELS: Record<Category, string> = {
  fuel: '⛽ Fuel', food: '🍔 Food', lodging: '🏨 Lodging', activities: '🎡 Activities', misc: '📦 Misc',
};
const CATEGORIES = Object.keys(CAT_LABELS) as Category[];

function fmt(n: number) { return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }); }
function fmtDate(s: string) { return new Date(s + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
function today() { return new Date().toISOString().slice(0, 10); }

function calcSettleUp(entries: BudgetEntry[], travelers: number): { perPerson: { name: string; paid: number; owes: number; balance: number }[]; settlements: Settlement[] } {
  const tagged = entries.filter(e => e.paidBy);
  if (tagged.length === 0 || travelers < 2) return { perPerson: [], settlements: [] };

  const names = Array.from(new Set(tagged.map(e => e.paidBy!)));
  const total = tagged.reduce((s, e) => s + e.amount, 0);
  const share = total / travelers;

  const paid: Record<string, number> = {};
  for (const e of tagged) paid[e.paidBy!] = (paid[e.paidBy!] || 0) + e.amount;

  const perPerson = names.map(n => ({
    name: n, paid: paid[n] || 0, owes: share, balance: (paid[n] || 0) - share,
  }));

  // Minimum transactions — greedy debt settlement
  const creditors = perPerson.filter(p => p.balance > 0.01).map(p => ({ ...p })).sort((a, b) => b.balance - a.balance);
  const debtors = perPerson.filter(p => p.balance < -0.01).map(p => ({ ...p })).sort((a, b) => a.balance - b.balance);
  const settlements: Settlement[] = [];
  let ci = 0, di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const amount = Math.min(creditors[ci].balance, -debtors[di].balance);
    settlements.push({ from: debtors[di].name, to: creditors[ci].name, amount });
    creditors[ci].balance -= amount;
    debtors[di].balance += amount;
    if (creditors[ci].balance < 0.01) ci++;
    if (debtors[di].balance > -0.01) di++;
  }

  return { perPerson, settlements };
}

const SkeletonBudget = () => (
  <div className="bt-page">
    <div className="skeleton" style={{ height: 14, width: 80, borderRadius: 4, marginBottom: 20 }} />
    <div className="skeleton" style={{ height: 90, borderRadius: 14, marginBottom: 16 }} />
    <div className="skeleton" style={{ height: 180, borderRadius: 14, marginBottom: 16 }} />
    <div className="skeleton" style={{ height: 120, borderRadius: 14 }} />
  </div>
);

const BudgetTracker: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const [data, setData] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tripTitle, setTripTitle] = useState('');
  const [travelers, setTravelers] = useState(1);

  const [cat, setCat] = useState<Category>('food');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState(today());
  const [paidBy, setPaidBy] = useState('');
  const [adding, setAdding] = useState(false);

  // Known payer names for quick autocomplete
  const [knownNames, setKnownNames] = useState<string[]>([]);

  const load = useCallback(async () => {
    const [bRes, tRes] = await Promise.all([
      get<BudgetData>(`/trips/${tripId}/budget`),
      get<any>(`/trips/${tripId}`),
    ]);
    if (bRes.success && bRes.data) {
      setData(bRes.data);
      const names = Array.from(new Set(bRes.data.spendEntries.map((e: BudgetEntry) => e.paidBy).filter(Boolean) as string[]));
      setKnownNames(names);
    }
    if (tRes.success && tRes.data) {
      setTripTitle(tRes.data.title || '');
      setTravelers(tRes.data.travelers || 1);
    }
    setLoading(false);
  }, [tripId]);

  useEffect(() => { load(); }, [load]);

  const addEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('Enter a valid amount'); return;
    }
    setAdding(true);
    const r = await post<{ entry: BudgetEntry; totals: BudgetData['totals'] }>(`/trips/${tripId}/budget/entries`, {
      category: cat, amount: Number(amount), description: desc.trim() || undefined, date,
      paidBy: paidBy.trim() || undefined,
    });
    if (r.success && r.data && data) {
      const newEntries = [...data.spendEntries, r.data.entry];
      setData({ ...data, spendEntries: newEntries, totals: r.data.totals });
      if (paidBy.trim() && !knownNames.includes(paidBy.trim())) {
        setKnownNames(prev => [...prev, paidBy.trim()]);
      }
      setAmount(''); setDesc(''); setDate(today());
      toast.success('Entry added');
    } else {
      toast.error(r.error || 'Failed to add entry');
    }
    setAdding(false);
  };

  const removeEntry = async (entryId: string) => {
    if (!data) return;
    const r = await del<{ totals: BudgetData['totals'] }>(`/trips/${tripId}/budget/entries/${entryId}`);
    if (r.success && r.data) {
      const newEntries = data.spendEntries.filter(e => e.entryId !== entryId);
      setData({ ...data, spendEntries: newEntries, totals: r.data.totals });
    } else {
      toast.error('Failed to remove entry');
    }
  };

  if (loading) return <SkeletonBudget />;
  if (!data) return <div className="bt-page"><p className="bt-error">Failed to load budget.</p><Link to={`/trips/${tripId}`} className="bt-back">← Trip</Link></div>;

  const est = data.estimatedBudget;
  const spent = data.totals.total;
  const remaining = est !== null ? est - spent : null;
  const pct = est ? Math.min((spent / est) * 100, 100) : 0;
  const over = est !== null && spent > est;

  const { perPerson, settlements } = calcSettleUp(data.spendEntries, travelers);
  const hasSettleUp = settlements.length > 0 || perPerson.length > 0;

  return (
    <div className="bt-page">
      <Link to={`/trips/${tripId}`} className="bt-back">← {tripTitle || 'Trip'}</Link>
      <h1 className="bt-title">Budget Tracker</h1>

      {/* Summary card */}
      <div className="bt-summary">
        <div className="bt-summary-row">
          <div className="bt-summary-col">
            <span className="bt-summary-label">Estimated</span>
            <span className="bt-summary-val">{est !== null ? fmt(est) : '—'}</span>
          </div>
          <div className="bt-summary-col bt-summary-center">
            <span className="bt-summary-label">Spent</span>
            <span className={`bt-summary-val${over ? ' bt-over' : ''}`}>{fmt(spent)}</span>
          </div>
          <div className="bt-summary-col bt-summary-right">
            <span className="bt-summary-label">{over ? 'Over by' : 'Remaining'}</span>
            <span className={`bt-summary-val${over ? ' bt-over' : ' bt-under'}`}>
              {remaining !== null ? fmt(Math.abs(remaining)) : '—'}
            </span>
          </div>
        </div>
        {est !== null && (
          <div className="bt-progress-track">
            <div className={`bt-progress-fill${over ? ' bt-progress-over' : ''}`} style={{ width: `${pct}%` }} />
          </div>
        )}
        {est === null && (
          <p className="bt-no-estimate">No estimated budget set. <Link to={`/trips/${tripId}/edit`}>Edit trip →</Link></p>
        )}
      </div>

      {/* Category breakdown */}
      <div className="bt-card">
        <h2 className="bt-card-title">By Category</h2>
        {CATEGORIES.map(c => {
          const val = data.totals.byCategory[c] || 0;
          const pctCat = spent > 0 ? (val / spent) * 100 : 0;
          return (
            <div key={c} className="bt-cat-row">
              <span className="bt-cat-name">{CAT_LABELS[c]}</span>
              <div className="bt-cat-bar-track"><div className="bt-cat-bar-fill" style={{ width: `${pctCat}%` }} /></div>
              <span className="bt-cat-val">{fmt(val)}</span>
            </div>
          );
        })}
      </div>

      {/* Settle Up */}
      {hasSettleUp && (
        <div className="bt-card bt-settle">
          <h2 className="bt-card-title">💸 Settle Up</h2>
          <p className="bt-settle-note">Based on {travelers} traveler{travelers > 1 ? 's' : ''} — fair share is {fmt(spent / travelers)} each</p>
          <div className="bt-settle-people">
            {perPerson.map(p => (
              <div key={p.name} className="bt-settle-person">
                <span className="bt-settle-name">{p.name}</span>
                <span className="bt-settle-paid">paid {fmt(p.paid)}</span>
                <span className={`bt-settle-bal ${p.balance >= 0 ? 'bt-settle-pos' : 'bt-settle-neg'}`}>
                  {p.balance >= 0 ? `+${fmt(p.balance)} owed back` : `${fmt(-p.balance)} owes`}
                </span>
              </div>
            ))}
          </div>
          {settlements.length > 0 && (
            <>
              <div className="bt-settle-divider" />
              <h3 className="bt-settle-txns-title">Transactions to settle</h3>
              {settlements.map((s, i) => (
                <div key={i} className="bt-settle-txn">
                  <span className="bt-settle-txn-from">{s.from}</span>
                  <span className="bt-settle-txn-arrow">→</span>
                  <span className="bt-settle-txn-to">{s.to}</span>
                  <span className="bt-settle-txn-amt">{fmt(s.amount)}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Add entry */}
      <div className="bt-card">
        <h2 className="bt-card-title">Add Expense</h2>
        <form onSubmit={addEntry} className="bt-form">
          <select className="bt-select" value={cat} onChange={e => setCat(e.target.value as Category)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
          </select>
          <input className="bt-input" type="number" placeholder="Amount ($)" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
          <input className="bt-input bt-input-desc" type="text" placeholder="Description (optional)" value={desc} onChange={e => setDesc(e.target.value)} maxLength={100} />
          <input className="bt-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          <div className="bt-paid-by-row">
            <input
              className="bt-input bt-paid-by"
              type="text"
              placeholder="Who paid? (e.g. Alex)"
              value={paidBy}
              onChange={e => setPaidBy(e.target.value)}
              list="bt-payer-list"
              maxLength={40}
            />
            {knownNames.length > 0 && (
              <datalist id="bt-payer-list">
                {knownNames.map(n => <option key={n} value={n} />)}
              </datalist>
            )}
            <span className="bt-paid-by-hint">for Settle Up</span>
          </div>
          <button type="submit" className="bt-add-btn" disabled={adding}>{adding ? 'Adding…' : '+ Add'}</button>
        </form>
      </div>

      {/* Entry list */}
      <div className="bt-card">
        <h2 className="bt-card-title">All Expenses</h2>
        {data.spendEntries.length === 0 ? (
          <p className="bt-empty">No expenses logged yet.</p>
        ) : (
          <ul className="bt-entries">
            {[...data.spendEntries].reverse().map(e => (
              <li key={e.entryId} className="bt-entry">
                <span className="bt-entry-cat">{CAT_LABELS[e.category].split(' ')[0]}</span>
                <div className="bt-entry-body">
                  <span className="bt-entry-desc">{e.description || CAT_LABELS[e.category].slice(2)}</span>
                  <span className="bt-entry-meta">{fmtDate(e.date)}{e.paidBy ? ` · ${e.paidBy}` : ''}</span>
                </div>
                <span className="bt-entry-amt">{fmt(e.amount)}</span>
                <button className="bt-entry-del" onClick={() => removeEntry(e.entryId)} aria-label="Remove expense">×</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default BudgetTracker;
