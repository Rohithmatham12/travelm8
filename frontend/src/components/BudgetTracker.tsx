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
}

interface BudgetData {
  estimatedBudget: number | null;
  spendEntries: BudgetEntry[];
  totals: { total: number; byCategory: Record<Category, number> };
}

const CAT_LABELS: Record<Category, string> = {
  fuel: '⛽ Fuel', food: '🍔 Food', lodging: '🏨 Lodging', activities: '🎡 Activities', misc: '📦 Misc',
};
const CATEGORIES = Object.keys(CAT_LABELS) as Category[];

function fmt(n: number) { return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }); }
function fmtDate(s: string) { return new Date(s + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
function today() { return new Date().toISOString().slice(0, 10); }

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

  // Add-entry form state
  const [cat, setCat] = useState<Category>('food');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState(today());
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const [bRes, tRes] = await Promise.all([
      get<BudgetData>(`/trips/${tripId}/budget`),
      get<any>(`/trips/${tripId}`),
    ]);
    if (bRes.success && bRes.data) setData(bRes.data);
    if (tRes.success && tRes.data) setTripTitle(tRes.data.title || '');
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
    });
    if (r.success && r.data && data) {
      setData({ ...data, spendEntries: [...data.spendEntries, r.data.entry], totals: r.data.totals });
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
      setData({ ...data, spendEntries: data.spendEntries.filter(e => e.entryId !== entryId), totals: r.data.totals });
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
                  <span className="bt-entry-date">{fmtDate(e.date)}</span>
                </div>
                <span className="bt-entry-amt">{fmt(e.amount)}</span>
                <button className="bt-entry-del" onClick={() => removeEntry(e.entryId)} title="Remove">×</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default BudgetTracker;
