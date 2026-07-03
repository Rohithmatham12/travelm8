import React, { useState } from 'react';
import { post } from '../utils/api';
import './PackingList.css';

interface Category { name: string; items: string[]; }
interface Props { tripId: string; }

export const PackingList: React.FC<Props> = ({ tripId }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true); setError(null);
    const r = await post<{ categories: Category[] }>(`/trips/${tripId}/packing-list`, {});
    if (r.success && r.data?.categories?.length) {
      setCategories(r.data.categories);
      setGenerated(true);
    } else {
      setError('Failed to generate. Try again.');
    }
    setLoading(false);
  };

  const toggle = (key: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const total = categories.reduce((s, c) => s + c.items.length, 0);
  const done = checked.size;

  return (
    <div className="pl-section">
      <div className="pl-header">
        <h2 className="td-section-title">🎒 Packing List</h2>
        {generated && total > 0 && (
          <span className="pl-progress">{done}/{total} packed</span>
        )}
      </div>
      {!generated ? (
        <div className="pl-empty">
          <p className="pl-empty-text">AI generates a packing list tailored to your destination, duration, and trip type.</p>
          <button className="pl-generate-btn" onClick={generate} disabled={loading}>
            {loading ? '⟳ Generating…' : '✨ Generate packing list'}
          </button>
          {error && <p className="pl-error">{error}</p>}
        </div>
      ) : (
        <>
          {categories.map(cat => (
            <div key={cat.name} className="pl-category">
              <h3 className="pl-cat-title">{cat.name}</h3>
              <ul className="pl-items">
                {cat.items.map(item => {
                  const key = `${cat.name}::${item}`;
                  return (
                    <li key={key} className={`pl-item${checked.has(key) ? ' pl-item-done' : ''}`}>
                      <label className="pl-label">
                        <input
                          type="checkbox"
                          className="pl-check"
                          checked={checked.has(key)}
                          onChange={() => toggle(key)}
                        />
                        <span>{item}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          <button className="pl-regen-btn" onClick={generate} disabled={loading}>
            {loading ? '⟳ Regenerating…' : '↺ Regenerate'}
          </button>
        </>
      )}
    </div>
  );
};
