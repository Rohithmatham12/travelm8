import React, { useState, useEffect, useCallback } from 'react';
import { toast } from '../utils/toast';
import './Toaster.css';

interface ToastItem {
  id: number;
  msg: string;
  type: 'success' | 'error' | 'info';
  exiting: boolean;
}

let _id = 0;

const ICONS = { success: '✓', error: '✕', info: 'ℹ' };

export const Toaster: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
  }, []);

  useEffect(() => {
    toast._register((msg, type) => {
      const id = ++_id;
      setToasts(prev => [...prev, { id, msg, type, exiting: false }]);
      setTimeout(() => dismiss(id), 4000);
    });
    return () => toast._unregister();
  }, [dismiss]);

  return (
    <div className="toaster">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}${t.exiting ? ' toast-exit' : ''}`}>
          <span className="toast-icon">{ICONS[t.type]}</span>
          <span className="toast-msg">{t.msg}</span>
          <button className="toast-close" onClick={() => dismiss(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
};
