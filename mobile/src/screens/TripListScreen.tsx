import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { apiGet } from '../utils/api';
import { cacheTrips, getCachedTrips } from '../utils/cache';
import { isOffline } from '../utils/network';
import OfflineBanner from '../components/OfflineBanner';
import { Trip, RootStackParamList } from '../types';
import { colors } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'TripList'>;

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function TripListScreen({ navigation }: Props) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    const off = await isOffline();
    setOffline(off);
    if (off) {
      const cached = await getCachedTrips();
      if (cached) setTrips(cached);
    } else {
      const res = await apiGet<{ trips: Trip[] }>('/trips?limit=50');
      if (res.success && res.data) {
        const list = res.data.trips || [];
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

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={colors.orange} /></View>;
  }

  return (
    <View style={{ flex: 1 }}>
    {offline && <OfflineBanner />}
    <FlatList
      style={s.root}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.orange} />}
      ListEmptyComponent={
        <View style={s.empty}>
          <Text style={s.emptyIcon}>🗺️</Text>
          <Text style={s.emptyText}>No saved trips yet.</Text>
          <TouchableOpacity onPress={() => navigation.navigate('RoutePlanner')}>
            <Text style={s.emptyLink}>Plan your first route →</Text>
          </TouchableOpacity>
        </View>
      }
      data={trips}
      keyExtractor={t => t.tripId}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={s.card}
          onPress={() => navigation.navigate('TripDetail', { tripId: item.tripId })}
        >
          <View style={s.cardLeft}>
            <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={s.cardMeta}>{fmtDate(item.startDate)} · {item.travelers} traveler{item.travelers > 1 ? 's' : ''}</Text>
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
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: colors.text3, marginBottom: 8 },
  emptyLink: { fontSize: 14, color: colors.orange, fontWeight: '600' },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: 14, marginBottom: 8,
  },
  cardLeft: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.text1, marginBottom: 3 },
  cardMeta: { fontSize: 13, color: colors.text3 },
  chevron: { fontSize: 20, color: colors.text3, marginLeft: 8 },
});
