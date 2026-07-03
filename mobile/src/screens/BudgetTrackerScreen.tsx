import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { apiGet, apiPost, apiDelete } from '../utils/api';
import { RootStackParamList } from '../types';
import { useTheme, makeCommon } from '../styles/theme';

type Category = 'fuel' | 'food' | 'lodging' | 'activities' | 'misc';
type Props = NativeStackScreenProps<RootStackParamList, 'BudgetTracker'>;

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

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}
function today() { return new Date().toISOString().slice(0, 10); }

export default function BudgetTrackerScreen({ route, navigation }: Props) {
  const { tripId, tripTitle } = route.params;
  const c = useTheme();
  const common = makeCommon(c);
  const s = styles(c);

  const [data, setData] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState<Category>('food');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const r = await apiGet<BudgetData>(`/trips/${tripId}/budget`);
    if (r.success && r.data) setData(r.data);
    setLoading(false);
  }, [tripId]);

  useEffect(() => {
    navigation.setOptions({ title: tripTitle ? `${tripTitle} — Budget` : 'Budget Tracker' });
    load();
  }, [load, navigation, tripTitle]);

  const addEntry = async () => {
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) { Alert.alert('Enter a valid amount'); return; }
    setAdding(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const r = await apiPost<{ entry: BudgetEntry; totals: BudgetData['totals'] }>(`/trips/${tripId}/budget/entries`, {
      category: cat, amount: amt, description: desc.trim() || undefined, date: today(),
    });
    if (r.success && r.data && data) {
      setData({ ...data, spendEntries: [...data.spendEntries, r.data.entry], totals: r.data.totals });
      setAmount(''); setDesc('');
    } else {
      Alert.alert('Error', r.error || 'Failed to add entry');
    }
    setAdding(false);
  };

  const removeEntry = (entryId: string) => {
    Alert.alert('Remove expense?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          const r = await apiDelete(`/trips/${tripId}/budget/entries/${entryId}`);
          if (r.success && data) {
            const entries = data.spendEntries.filter(e => e.entryId !== entryId);
            const byCategory = { ...data.totals.byCategory };
            const removed = data.spendEntries.find(e => e.entryId === entryId);
            if (removed) byCategory[removed.category] = (byCategory[removed.category] || 0) - removed.amount;
            const total = entries.reduce((s, e) => s + e.amount, 0);
            setData({ ...data, spendEntries: entries, totals: { total, byCategory } });
          }
        }
      },
    ]);
  };

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: c.bg, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: c.text3 }}>Loading…</Text>
    </View>
  );

  if (!data) return (
    <View style={{ flex: 1, backgroundColor: c.bg, padding: 20 }}>
      <Text style={{ color: c.text3 }}>Failed to load budget.</Text>
    </View>
  );

  const est = data.estimatedBudget;
  const spent = data.totals.total;
  const remaining = est !== null ? est - spent : null;
  const over = est !== null && spent > est;
  const pct = est ? Math.min(spent / est, 1) : 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
      {/* Summary */}
      <View style={[common.card, { marginBottom: 16 }]}>
        <View style={s.summaryRow}>
          <View style={s.summaryCol}>
            <Text style={s.summaryLabel}>Estimated</Text>
            <Text style={s.summaryVal}>{est !== null ? fmt(est) : '—'}</Text>
          </View>
          <View style={[s.summaryCol, { alignItems: 'center' }]}>
            <Text style={s.summaryLabel}>Spent</Text>
            <Text style={[s.summaryVal, over && { color: '#dc2626' }]}>{fmt(spent)}</Text>
          </View>
          <View style={[s.summaryCol, { alignItems: 'flex-end' }]}>
            <Text style={s.summaryLabel}>{over ? 'Over by' : 'Remaining'}</Text>
            <Text style={[s.summaryVal, { color: over ? '#dc2626' : '#16a34a' }]}>
              {remaining !== null ? fmt(Math.abs(remaining)) : '—'}
            </Text>
          </View>
        </View>
        {est !== null && (
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${pct * 100}%` as any, backgroundColor: over ? '#dc2626' : c.orange }]} />
          </View>
        )}
      </View>

      {/* Category breakdown */}
      <View style={[common.card, { marginBottom: 16 }]}>
        <Text style={common.sectionTitle}>By Category</Text>
        {CATEGORIES.map(cat => {
          const val = data.totals.byCategory[cat] || 0;
          const pctCat = spent > 0 ? val / spent : 0;
          return (
            <View key={cat} style={s.catRow}>
              <Text style={s.catName}>{CAT_LABELS[cat]}</Text>
              <View style={s.catBarTrack}>
                <View style={[s.catBarFill, { width: `${pctCat * 100}%` as any }]} />
              </View>
              <Text style={s.catVal}>{fmt(val)}</Text>
            </View>
          );
        })}
      </View>

      {/* Add entry */}
      <View style={[common.card, { marginBottom: 16 }]}>
        <Text style={common.sectionTitle}>Add Expense</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
          {CATEGORIES.map(c2 => (
            <TouchableOpacity
              key={c2}
              onPress={() => { setCat(c2); Haptics.selectionAsync(); }}
              style={[s.catChip, cat === c2 && { backgroundColor: c.orange, borderColor: c.orange }]}
            >
              <Text style={[s.catChipText, cat === c2 && { color: '#fff' }]}>{CAT_LABELS[c2]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TextInput
          style={[s.input, { color: c.text1, borderColor: c.border, backgroundColor: c.bgMuted }]}
          placeholder="Amount ($)"
          placeholderTextColor={c.text3}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />
        <TextInput
          style={[s.input, { color: c.text1, borderColor: c.border, backgroundColor: c.bgMuted, marginTop: 8 }]}
          placeholder="Description (optional)"
          placeholderTextColor={c.text3}
          value={desc}
          onChangeText={setDesc}
          maxLength={100}
        />
        <TouchableOpacity
          style={[s.addBtn, { backgroundColor: c.orange }, adding && { opacity: 0.5 }]}
          onPress={addEntry}
          disabled={adding}
        >
          <Text style={s.addBtnText}>{adding ? 'Adding…' : '+ Add Expense'}</Text>
        </TouchableOpacity>
      </View>

      {/* Entry list */}
      <View style={common.card}>
        <Text style={common.sectionTitle}>All Expenses</Text>
        {data.spendEntries.length === 0 ? (
          <Text style={{ color: c.text3, fontSize: 14 }}>No expenses logged yet.</Text>
        ) : (
          [...data.spendEntries].reverse().map(entry => (
            <TouchableOpacity key={entry.entryId} style={s.entry} onLongPress={() => removeEntry(entry.entryId)}>
              <Text style={s.entryCat}>{CAT_LABELS[entry.category].split(' ')[0]}</Text>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[s.entryDesc, { color: c.text2 }]} numberOfLines={1}>
                  {entry.description || CAT_LABELS[entry.category].slice(2)}
                </Text>
                <Text style={[s.entryDate, { color: c.text3 }]}>{entry.date}</Text>
              </View>
              <Text style={[s.entryAmt, { color: c.text1 }]}>{fmt(entry.amount)}</Text>
            </TouchableOpacity>
          ))
        )}
        {data.spendEntries.length > 0 && (
          <Text style={{ color: c.text3, fontSize: 11, marginTop: 8 }}>Long-press an entry to remove it.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = (c: ReturnType<typeof useTheme>) => StyleSheet.create({
  summaryRow: { flexDirection: 'row', marginBottom: 12 },
  summaryCol: { flex: 1 },
  summaryLabel: { fontSize: 10, color: c.text3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  summaryVal: { fontSize: 20, fontWeight: '800', color: c.text1 },
  progressTrack: { height: 8, backgroundColor: c.bgMuted, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  catName: { fontSize: 13, color: c.text2, width: 110 },
  catBarTrack: { flex: 1, height: 6, backgroundColor: c.bgMuted, borderRadius: 3, overflow: 'hidden', marginHorizontal: 8 },
  catBarFill: { height: 6, backgroundColor: c.orange, borderRadius: 3 },
  catVal: { fontSize: 13, fontWeight: '600', color: c.text2, width: 50, textAlign: 'right' },
  catChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: c.border, marginRight: 8, backgroundColor: c.bgMuted,
  },
  catChipText: { fontSize: 13, color: c.text2, fontWeight: '500' },
  input: {
    borderWidth: 1, borderRadius: 8, padding: Platform.OS === 'ios' ? 11 : 9,
    fontSize: 14,
  },
  addBtn: {
    marginTop: 12, padding: 12, borderRadius: 8,
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  entry: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: c.border,
  },
  entryCat: { fontSize: 18, marginRight: 10 },
  entryDesc: { fontSize: 14 },
  entryDate: { fontSize: 11, marginTop: 1 },
  entryAmt: { fontSize: 14, fontWeight: '700', marginLeft: 8 },
});
