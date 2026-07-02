import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { apiGet, apiDelete } from '../utils/api';
import { cacheTripDetail, getCachedTripDetail } from '../utils/cache';
import { isOffline } from '../utils/network';
import { hasTripNotifications, cancelTripNotifications } from '../utils/notifications';
import OfflineBanner from '../components/OfflineBanner';
import ErrorState from '../components/ErrorState';
import { Trip, RootStackParamList } from '../types';
import { colors, common } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'TripDetail'>;

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const fmtMins = (m: number) =>
  m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 > 0 ? `${m % 60}m` : ''}`.trim() : `${m}m`;

const riskColors: Record<string, { bg: string; text: string }> = {
  low: { bg: '#DCFCE7', text: '#15803D' },
  medium: { bg: '#FEF9C3', text: '#A16207' },
  high: { bg: '#FEE2E2', text: '#DC2626' },
};

const eventDotColor: Record<string, string> = {
  drive: colors.sky, stop: colors.orange, meal: colors.green,
  overnight: colors.purple, activity: '#7C3AED',
};

const eventIcon: Record<string, string> = {
  drive: '🚗', stop: '📍', meal: '🍽', overnight: '🛏', activity: '🏛',
};

export default function TripDetailScreen({ route, navigation }: Props) {
  const { tripId } = route.params;
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [offline, setOffline] = useState(false);
  const [hasNotifs, setHasNotifs] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    const off = await isOffline();
    setOffline(off);
    if (off) {
      const cached = await getCachedTripDetail(tripId);
      if (cached) setTrip(cached);
    } else {
      const res = await apiGet<Trip>(`/trips/${tripId}`);
      if (res.success && res.data) {
        setTrip(res.data);
        await cacheTripDetail(res.data);
      } else {
        const cached = await getCachedTripDetail(tripId);
        if (cached) { setTrip(cached); setOffline(true); } else { setError(true); }
      }
    }
    setLoading(false);
    setHasNotifs(await hasTripNotifications(tripId));
  }, [tripId]);

  useEffect(() => {
    navigation.setOptions({ title: '' });
    load();
  }, [load, navigation]);

  const handleCancelNotifs = () => {
    Alert.alert('Cancel reminders?', 'Remove departure and fatigue notifications for this trip.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          await cancelTripNotifications(tripId);
          setHasNotifs(false);
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete trip?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          setDeleting(true);
          const res = await apiDelete(`/trips/${tripId}`);
          if (res.success) navigation.goBack();
          else { Alert.alert('Error', 'Failed to delete'); setDeleting(false); }
        },
      },
    ]);
  };

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={colors.orange} /></View>;
  }

  if (error || !trip) {
    return <ErrorState message="Couldn't load trip" onRetry={load} />;
  }

  const rd = trip.routeData;
  const rq = rd?.routeRequest;
  const rp = rd?.routePlan;
  const fi = rd?.finalItinerary;
  const ai = rp?.aiInsights;
  const rs = rp?.routeSummary;

  return (
    <View style={{ flex: 1 }}>
    {offline && <OfflineBanner />}
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      {/* Header */}
      <Text style={s.title}>{trip.title}</Text>
      <Text style={s.subtitle}>
        {rq
          ? `${fmtDate(rq.departureDate)} · ${rq.travelers} traveler${rq.travelers > 1 ? 's' : ''}`
          : fmtDate(trip.startDate)
        }
      </Text>

      {/* Route stats bar */}
      {rs && (
        <View style={s.routeBar}>
          <View style={s.routeStat}>
            <Text style={s.routeVal}>{rs.totalDistance}</Text>
            <Text style={s.routeLbl}>miles</Text>
          </View>
          <View style={s.routeDivider} />
          <View style={s.routeStat}>
            <Text style={s.routeVal}>{fmtMins(rs.estimatedDriveTime)}</Text>
            <Text style={s.routeLbl}>drive time</Text>
          </View>
          {rs.majorCities?.length > 0 && (
            <>
              <View style={s.routeDivider} />
              <View style={[s.routeStat, { flex: 1 }]}>
                <Text style={s.routeLbl}>via</Text>
                <Text style={[s.routeVal, { fontSize: 14 }]} numberOfLines={1}>
                  {rs.majorCities.slice(0, 2).join(', ')}
                </Text>
              </View>
            </>
          )}
        </View>
      )}

      {/* AI Panel */}
      {ai && (
        <View style={[common.card, { marginBottom: 12 }]}>
          <View style={s.aiHeader}>
            <View style={s.aiTitleRow}>
              <View style={s.aiChip}><Text style={s.aiChipText}>AI</Text></View>
              <Text style={s.aiTitle}>Copilot Analysis</Text>
            </View>
            <View style={[s.riskBadge, { backgroundColor: riskColors[ai.riskLevel]?.bg }]}>
              <Text style={[s.riskText, { color: riskColors[ai.riskLevel]?.text }]}>
                {ai.riskLevel.toUpperCase()} RISK
              </Text>
            </View>
          </View>
          <Text style={s.aiSummary}>{ai.tripSummary}</Text>
          {ai.fatigueWarning && (
            <View style={s.aiAlert}>
              <Text style={s.aiAlertText}>⚠️ {ai.fatigueWarning}</Text>
            </View>
          )}
          {ai.lateArrivalNote && (
            <View style={[s.aiAlert, { backgroundColor: '#FEF2F2' }]}>
              <Text style={[s.aiAlertText, { color: '#991B1B' }]}>🌙 {ai.lateArrivalNote}</Text>
            </View>
          )}
          {ai.topTip && (
            <View style={s.aiTip}>
              <Text style={s.aiTipLabel}>TOP TIP</Text>
              <Text style={s.aiTipText}>{ai.topTip}</Text>
            </View>
          )}
        </View>
      )}

      {/* Cost breakdown */}
      {fi?.totalEstimatedCost && (
        <View style={[common.card, { marginBottom: 12 }]}>
          <View style={s.costHeader}>
            <Text style={s.costLabel}>Total Estimated Cost</Text>
            <Text style={s.costAmount}>${fi.totalEstimatedCost.amount}</Text>
          </View>
          <View style={s.costBreakdown}>
            {fi.totalEstimatedCost.breakdown.motels > 0 && <Text style={s.costChip}>🛏 ${fi.totalEstimatedCost.breakdown.motels}</Text>}
            {fi.totalEstimatedCost.breakdown.meals > 0 && <Text style={s.costChip}>🍽 ${fi.totalEstimatedCost.breakdown.meals}</Text>}
            {fi.totalEstimatedCost.breakdown.activities > 0 && <Text style={s.costChip}>🏛 ${fi.totalEstimatedCost.breakdown.activities}</Text>}
            {fi.totalEstimatedCost.breakdown.gas > 0 && <Text style={s.costChip}>⛽ ${fi.totalEstimatedCost.breakdown.gas}</Text>}
          </View>
        </View>
      )}

      {/* Timeline */}
      {fi?.calendarEvents?.length > 0 && (
        <View>
          <Text style={common.sectionTitle}>Itinerary</Text>
          {fi.calendarEvents.map((ev: any, i: number) => (
            <View key={ev.id} style={s.event}>
              <Text style={s.eventTime}>{fmtTime(ev.startTime)}</Text>
              <View style={s.eventTrack}>
                <View style={[s.eventDot, { backgroundColor: eventDotColor[ev.type] || colors.border }]} />
                {i < fi.calendarEvents.length - 1 && <View style={s.eventLine} />}
              </View>
              <View style={s.eventBody}>
                <Text style={s.eventTitle}>{eventIcon[ev.type] || '📍'} {ev.title}</Text>
                {ev.description ? <Text style={s.eventDesc} numberOfLines={2}>{ev.description}</Text> : null}
                {ev.location ? <Text style={s.eventLoc}>📍 {ev.location}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* No route data fallback */}
      {!rd && (
        <View style={[common.card, { alignItems: 'center', paddingVertical: 24 }]}>
          <Text style={{ fontSize: 13, color: colors.text3 }}>No route data saved with this trip.</Text>
        </View>
      )}

      {/* Re-plan */}
      {rq && (
        <TouchableOpacity
          style={s.replanBtn}
          onPress={() => navigation.navigate('RoutePlanner', { routeRequest: rq })}
        >
          <Text style={s.replanBtnText}>↺ Re-plan This Route</Text>
        </TouchableOpacity>
      )}

      {/* Notifications */}
      {hasNotifs && (
        <TouchableOpacity style={s.notifBtn} onPress={handleCancelNotifs}>
          <Text style={s.notifBtnText}>🔔 Reminders scheduled — tap to cancel</Text>
        </TouchableOpacity>
      )}

      {/* Delete */}
      <TouchableOpacity style={s.deleteBtn} onPress={handleDelete} disabled={deleting}>
        {deleting
          ? <ActivityIndicator color={colors.red} size="small" />
          : <Text style={s.deleteBtnText}>🗑 Delete Trip</Text>
        }
      </TouchableOpacity>

      <Text style={s.meta}>Saved {fmtDate(trip.createdAt)}</Text>
    </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  errorText: { fontSize: 16, color: colors.text3, marginBottom: 12 },
  backLink: { fontSize: 14, color: colors.orange },
  title: { fontSize: 22, fontWeight: '800', color: colors.text1, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.text3, marginBottom: 16 },
  routeBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 16, marginBottom: 12, gap: 12,
  },
  routeStat: { flexDirection: 'column', gap: 2 },
  routeVal: { fontSize: 18, fontWeight: '700', color: colors.text1 },
  routeLbl: { fontSize: 11, color: colors.text3, textTransform: 'uppercase', letterSpacing: 0.4 },
  routeDivider: { width: 1, height: 32, backgroundColor: colors.border },
  aiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  aiTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiChip: { backgroundColor: colors.orange, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  aiChipText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  aiTitle: { fontSize: 15, fontWeight: '700', color: colors.text1 },
  riskBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  riskText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  aiSummary: { fontSize: 14, color: colors.text2, lineHeight: 20, marginBottom: 10 },
  aiAlert: { backgroundColor: '#FFFBEB', borderRadius: 8, padding: 10, marginBottom: 8 },
  aiAlertText: { fontSize: 13, color: '#92400E', lineHeight: 18 },
  aiTip: { flexDirection: 'row', gap: 8, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 8, padding: 10 },
  aiTipLabel: { fontSize: 10, fontWeight: '800', color: colors.sky, letterSpacing: 0.5 },
  aiTipText: { flex: 1, fontSize: 13, color: colors.text3, lineHeight: 18 },
  costHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  costLabel: { fontSize: 14, fontWeight: '600', color: colors.text2 },
  costAmount: { fontSize: 20, fontWeight: '800', color: colors.text1 },
  costBreakdown: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  costChip: {
    fontSize: 12, color: colors.text3, backgroundColor: colors.bgMuted,
    borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
  },
  event: { flexDirection: 'row', gap: 10, marginBottom: 0 },
  eventTime: { width: 52, fontSize: 12, fontWeight: '600', color: colors.text3, paddingTop: 2, textAlign: 'right' },
  eventTrack: { alignItems: 'center', width: 14 },
  eventDot: { width: 10, height: 10, borderRadius: 5, marginTop: 3 },
  eventLine: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 4, minHeight: 20 },
  eventBody: { flex: 1, paddingBottom: 16 },
  eventTitle: { fontSize: 14, fontWeight: '600', color: colors.text1, marginBottom: 3 },
  eventDesc: { fontSize: 13, color: colors.text3, lineHeight: 18, marginBottom: 3 },
  eventLoc: { fontSize: 12, color: colors.sky },
  replanBtn: {
    marginTop: 24, backgroundColor: colors.orange, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  replanBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  notifBtn: {
    marginTop: 10, borderWidth: 1, borderColor: '#FED7AA', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center', backgroundColor: '#FFF7ED',
  },
  notifBtnText: { fontSize: 14, color: '#C2410C', fontWeight: '600' },
  deleteBtn: {
    marginTop: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  deleteBtnText: { fontSize: 14, color: colors.red, fontWeight: '600' },
  meta: { textAlign: 'center', fontSize: 12, color: colors.text3, marginTop: 12 },
});
