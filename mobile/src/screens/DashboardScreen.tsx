import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, RefreshControl, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { apiGet, apiDelete } from '../utils/api';
import { getStoredUser, clearAuth } from '../utils/auth';
import { cacheTrips, getCachedTrips } from '../utils/cache';
import { isOffline } from '../utils/network';
import OfflineBanner from '../components/OfflineBanner';
import SkeletonCard from '../components/SkeletonCard';
import { Trip, RootStackParamList } from '../types';
import { useTheme, makeCommon } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export default function DashboardScreen({ navigation }: Props) {
  const c = useTheme();
  const common = makeCommon(c);

  const [user, setUser] = useState<any>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [offline, setOffline] = useState(false);

  const loadData = useCallback(async () => {
    const u = await getStoredUser();
    setUser(u);
    const offline = await isOffline();
    setOffline(offline);
    if (offline) {
      const cached = await getCachedTrips();
      if (cached) setTrips(cached);
    } else {
      const r = await apiGet<{ trips: Trip[] }>('/trips?limit=10');
      if (r.success && r.data) {
        const list = r.data.trips || [];
        setTrips(list);
        await cacheTrips(list);
      } else {
        const cached = await getCachedTrips();
        if (cached) { setTrips(cached); setOffline(true); }
      }
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSignOut = async () => {
    await clearAuth();
    navigation.replace('Auth');
  };

  const handleSearch = () => {
    if (search.trim()) navigation.navigate('RoutePlanner');
  };

  const handleDeleteTrip = (tripId: string, title: string) => {
    Alert.alert('Delete trip?', `Remove "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const res = await apiDelete(`/trips/${tripId}`);
          if (res.success) setTrips(prev => prev.filter(t => t.tripId !== tripId));
          else Alert.alert('Error', 'Failed to delete');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, padding: 20 }}>
        <SkeletonCard /><SkeletonCard /><SkeletonCard />
      </View>
    );
  }

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <View style={{ flex: 1 }}>
    {offline && <OfflineBanner />}
    <FlatList
      style={[s.root, { backgroundColor: c.bg }]}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={c.orange} />}
      ListHeaderComponent={
        <>
          {/* Header */}
          <View style={s.header}>
            <View>
              <Text style={[s.greeting, { color: c.text3 }]}>Hey {firstName} 👋</Text>
              <Text style={[s.title, { color: c.text1 }]}>Where are you{'\n'}driving next?</Text>
            </View>
            <TouchableOpacity onPress={handleSignOut} style={s.signOutBtn}>
              <Text style={[s.signOutText, { color: c.text3 }]}>Sign out</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={s.searchRow}>
            <TextInput
              style={[s.searchInput, { color: c.text1, backgroundColor: c.card, borderColor: c.border }]}
              placeholder="Enter a destination…"
              placeholderTextColor={c.text3}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity style={[s.searchBtn, { backgroundColor: c.orange }]} onPress={() => navigation.navigate('RoutePlanner')}>
              <Text style={s.searchBtnText}>Plan →</Text>
            </TouchableOpacity>
          </View>

          {/* Quick actions */}
          <View style={s.actions}>
            <TouchableOpacity style={[s.actionBtn, { backgroundColor: c.card, borderColor: c.border }]} onPress={() => navigation.navigate('RoutePlanner')}>
              <Text style={s.actionIcon}>🗺️</Text>
              <Text style={[s.actionLabel, { color: c.text2 }]}>Plan Route</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.actionBtn, { backgroundColor: c.card, borderColor: c.border }]} onPress={() => navigation.navigate('TripList')}>
              <Text style={s.actionIcon}>📋</Text>
              <Text style={[s.actionLabel, { color: c.text2 }]}>My Trips</Text>
            </TouchableOpacity>
          </View>

          {/* Section header */}
          <Text style={[common.sectionTitle, { marginTop: 4 }]}>Recent trips</Text>

          {trips.length === 0 && (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🗺️</Text>
              <Text style={[s.emptyText, { color: c.text3 }]}>No trips yet.</Text>
              <TouchableOpacity onPress={() => navigation.navigate('RoutePlanner')}>
                <Text style={[s.emptyLink, { color: c.orange }]}>Plan your first road trip →</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      }
      data={trips}
      keyExtractor={t => t.tripId}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[s.tripCard, { backgroundColor: c.card, borderColor: c.border }]}
          onPress={() => navigation.navigate('TripDetail', { tripId: item.tripId })}
        >
          <View style={s.tripCardLeft}>
            <Text style={[s.tripTitle, { color: c.text1 }]} numberOfLines={1}>{item.title}</Text>
            <Text style={[s.tripMeta, { color: c.text3 }]}>{item.destination} · {fmtDate(item.startDate)}</Text>
          </View>
          <TouchableOpacity style={{ padding: 8 }} onPress={() => handleDeleteTrip(item.tripId, item.title)}>
            <Text style={{ fontSize: 18 }}>🗑</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  greeting: { fontSize: 15, marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '800', lineHeight: 32 },
  signOutBtn: { padding: 8 },
  signOutText: { fontSize: 13 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  searchInput: {
    flex: 1, borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
  },
  searchBtn: {
    borderRadius: 12,
    paddingHorizontal: 16, justifyContent: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  actionBtn: {
    flex: 1, borderWidth: 1,
    borderRadius: 14, padding: 16, alignItems: 'center', gap: 6,
  },
  actionIcon: { fontSize: 22 },
  actionLabel: { fontSize: 13, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 15, marginBottom: 8 },
  emptyLink: { fontSize: 14, fontWeight: '600' },
  tripCard: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12, padding: 14, marginBottom: 8,
  },
  tripCardLeft: { flex: 1 },
  tripTitle: { fontSize: 15, fontWeight: '600', marginBottom: 3 },
  tripMeta: { fontSize: 13 },
  chevron: { fontSize: 20, marginLeft: 8 },
});
