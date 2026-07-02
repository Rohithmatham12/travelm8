import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { apiGet } from '../utils/api';
import { getStoredUser, clearAuth } from '../utils/auth';
import { cacheTrips, getCachedTrips } from '../utils/cache';
import { isOffline } from '../utils/network';
import OfflineBanner from '../components/OfflineBanner';
import ErrorState from '../components/ErrorState';
import { Trip, RootStackParamList } from '../types';
import { colors, common } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export default function DashboardScreen({ navigation }: Props) {
  const [user, setUser] = useState<any>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState(false);

  const loadData = useCallback(async () => {
    setError(false);
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
        if (cached) { setTrips(cached); setOffline(true); } else { setError(true); }
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

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  }

  if (error) {
    return <ErrorState message="Couldn't load trips" onRetry={loadData} />;
  }

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <View style={{ flex: 1 }}>
    {offline && <OfflineBanner />}
    <FlatList
      style={s.root}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.orange} />}
      ListHeaderComponent={
        <>
          {/* Header */}
          <View style={s.header}>
            <View>
              <Text style={s.greeting}>Hey {firstName} 👋</Text>
              <Text style={s.title}>Where are you{'\n'}driving next?</Text>
            </View>
            <TouchableOpacity onPress={handleSignOut} style={s.signOutBtn}>
              <Text style={s.signOutText}>Sign out</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={s.searchRow}>
            <TextInput
              style={s.searchInput}
              placeholder="Enter a destination…"
              placeholderTextColor={colors.text3}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity style={s.searchBtn} onPress={() => navigation.navigate('RoutePlanner')}>
              <Text style={s.searchBtnText}>Plan →</Text>
            </TouchableOpacity>
          </View>

          {/* Quick actions */}
          <View style={s.actions}>
            <TouchableOpacity style={s.actionBtn} onPress={() => navigation.navigate('RoutePlanner')}>
              <Text style={s.actionIcon}>🗺️</Text>
              <Text style={s.actionLabel}>Plan Route</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={() => navigation.navigate('TripList')}>
              <Text style={s.actionIcon}>📋</Text>
              <Text style={s.actionLabel}>My Trips</Text>
            </TouchableOpacity>
          </View>

          {/* Section header */}
          <Text style={[common.sectionTitle, { marginTop: 4 }]}>Recent trips</Text>

          {trips.length === 0 && (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🗺️</Text>
              <Text style={s.emptyText}>No trips yet.</Text>
              <TouchableOpacity onPress={() => navigation.navigate('RoutePlanner')}>
                <Text style={s.emptyLink}>Plan your first road trip →</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      }
      data={trips}
      keyExtractor={t => t.tripId}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={s.tripCard}
          onPress={() => navigation.navigate('TripDetail', { tripId: item.tripId })}
        >
          <View style={s.tripCardLeft}>
            <Text style={s.tripTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={s.tripMeta}>{item.destination} · {fmtDate(item.startDate)}</Text>
          </View>
          <Text style={s.chevron}>›</Text>
        </TouchableOpacity>
      )}
    />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  greeting: { fontSize: 15, color: colors.text3, marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text1, lineHeight: 32 },
  signOutBtn: { padding: 8 },
  signOutText: { fontSize: 13, color: colors.text3 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  searchInput: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: colors.text1, backgroundColor: colors.card,
  },
  searchBtn: {
    backgroundColor: colors.orange, borderRadius: 12,
    paddingHorizontal: 16, justifyContent: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  actionBtn: {
    flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 16, alignItems: 'center', gap: 6,
  },
  actionIcon: { fontSize: 22 },
  actionLabel: { fontSize: 13, fontWeight: '600', color: colors.text2 },
  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 15, color: colors.text3, marginBottom: 8 },
  emptyLink: { fontSize: 14, color: colors.orange, fontWeight: '600' },
  tripCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: 14, marginBottom: 8,
  },
  tripCardLeft: { flex: 1 },
  tripTitle: { fontSize: 15, fontWeight: '600', color: colors.text1, marginBottom: 3 },
  tripMeta: { fontSize: 13, color: colors.text3 },
  chevron: { fontSize: 20, color: colors.text3, marginLeft: 8 },
});
