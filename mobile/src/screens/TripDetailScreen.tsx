import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Share,
  StyleSheet, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { apiGet, apiPost, apiDelete, apiPatch } from '../utils/api';
import { cacheTripDetail, getCachedTripDetail } from '../utils/cache';
import { isOffline } from '../utils/network';
import { hasTripNotifications, cancelTripNotifications } from '../utils/notifications';
import { shareCalendar } from '../utils/calendarExport';
import OfflineBanner from '../components/OfflineBanner';
import SkeletonCard from '../components/SkeletonCard';
import ErrorState from '../components/ErrorState';
import { Trip, RootStackParamList } from '../types';
import { useTheme, makeCommon } from '../styles/theme';
import { geocodeCity } from '../utils/geocode';

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

const eventIcon: Record<string, string> = {
  drive: '🚗', stop: '📍', meal: '🍽', overnight: '🛏', activity: '🏛',
};

export default function TripDetailScreen({ route, navigation }: Props) {
  const c = useTheme();
  const common = makeCommon(c);

  const eventDotColor: Record<string, string> = {
    drive: c.sky, stop: c.orange, meal: c.green,
    overnight: c.purple, activity: '#7C3AED',
  };

  const { tripId } = route.params;
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [offline, setOffline] = useState(false);
  const [hasNotifs, setHasNotifs] = useState(false);
  const [error, setError] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [fbRating, setFbRating] = useState(0);
  const [fbWorked, setFbWorked] = useState('');
  const [fbDidnt, setFbDidnt] = useState('');
  const [fbNote, setFbNote] = useState('');
  const [fbSaving, setFbSaving] = useState(false);
  const [fbSaved, setFbSaved] = useState(false);
  const [fbUpdatedAt, setFbUpdatedAt] = useState<string | null>(null);
  const [mapCoords, setMapCoords] = useState<{
    origin: { lat: number; lon: number } | null;
    dest: { lat: number; lon: number } | null;
  } | null>(null);

  const load = useCallback(async () => {
    setError(false);
    const off = await isOffline();
    setOffline(off);
    let loadedTrip: Trip | null = null;
    if (off) {
      const cached = await getCachedTripDetail(tripId);
      if (cached) { setTrip(cached); loadedTrip = cached; }
    } else {
      const res = await apiGet<Trip>(`/trips/${tripId}`);
      if (res.success && res.data) {
        setTrip(res.data);
        loadedTrip = res.data;
        await cacheTripDetail(res.data);
      } else {
        const cached = await getCachedTripDetail(tripId);
        if (cached) { setTrip(cached); setOffline(true); loadedTrip = cached; } else { setError(true); }
      }
    }
    setLoading(false);
    setHasNotifs(await hasTripNotifications(tripId));
    const rqData = loadedTrip?.routeData?.routeRequest;
    if (rqData?.origin && rqData?.destination) {
      const [o, d] = await Promise.all([
        geocodeCity(rqData.origin),
        geocodeCity(rqData.destination),
      ]);
      setMapCoords({ origin: o, dest: d });
    }
  }, [tripId]);

  useEffect(() => {
    navigation.setOptions({ title: '' });
    load();
  }, [load, navigation]);

  useEffect(() => {
    if (trip) setNotes(trip.notes || '');
  }, [trip]);

  useEffect(() => {
    if (!tripId) return;
    apiGet<any>(`/trips/${tripId}/feedback`).then(r => {
      if (r.success && r.data) {
        setFbRating(r.data.rating);
        setFbWorked(r.data.whatWorked || '');
        setFbDidnt(r.data.whatDidnt || '');
        setFbNote(r.data.overallNote || '');
        setFbUpdatedAt(r.data.updatedAt);
      }
    }).catch(() => {});
  }, [tripId]);

  const handleSaveFeedback = async () => {
    if (fbRating < 1) { Alert.alert('Rate your trip', 'Tap a star first.'); return; }
    setFbSaving(true); setFbSaved(false);
    try {
      const r = await apiPost<any>(`/trips/${tripId}/feedback`, {
        rating: fbRating, whatWorked: fbWorked, whatDidnt: fbDidnt, overallNote: fbNote,
      });
      if (r.success && r.data) { setFbUpdatedAt(r.data.updatedAt); setFbSaved(true); }
      else Alert.alert('Error', r.error || 'Failed to save feedback');
    } catch { Alert.alert('Error', 'Failed to save feedback'); }
    finally { setFbSaving(false); }
  };

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

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!trip) return;
    const rqData = trip.routeData?.routeRequest;
    const message = [
      `🚗 ${trip.title}`,
      rqData ? `📅 ${rqData.departureDate} at ${rqData.departureTime || '08:00'}` : '',
      rqData ? `👥 ${rqData.travelers} traveler${rqData.travelers > 1 ? 's' : ''}` : '',
      `\nPlanned with TravelM8 — travelm8app.vercel.app`,
    ].filter(Boolean).join('\n');
    try {
      await Share.share({ message, title: trip.title });
    } catch {}
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, padding: 20 }}>
        <SkeletonCard />
      </View>
    );
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
    <ScrollView style={[s.root, { backgroundColor: c.bg }]} contentContainerStyle={s.content}>
      {/* Header */}
      <Text style={[s.title, { color: c.text1 }]}>{trip.title}</Text>
      <Text style={[s.subtitle, { color: c.text3 }]}>
        {rq
          ? `${fmtDate(rq.departureDate)} · ${rq.travelers} traveler${rq.travelers > 1 ? 's' : ''}`
          : fmtDate(trip.startDate)
        }
      </Text>

      {/* Route stats bar */}
      {rs && (
        <View style={[s.routeBar, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={s.routeStat}>
            <Text style={[s.routeVal, { color: c.text1 }]}>{rs.totalDistance}</Text>
            <Text style={[s.routeLbl, { color: c.text3 }]}>miles</Text>
          </View>
          <View style={[s.routeDivider, { backgroundColor: c.border }]} />
          <View style={s.routeStat}>
            <Text style={[s.routeVal, { color: c.text1 }]}>{fmtMins(rs.estimatedDriveTime)}</Text>
            <Text style={[s.routeLbl, { color: c.text3 }]}>drive time</Text>
          </View>
          {rs.majorCities?.length > 0 && (
            <>
              <View style={[s.routeDivider, { backgroundColor: c.border }]} />
              <View style={[s.routeStat, { flex: 1 }]}>
                <Text style={[s.routeLbl, { color: c.text3 }]}>via</Text>
                <Text style={[s.routeVal, { fontSize: 14, color: c.text1 }]} numberOfLines={1}>
                  {rs.majorCities.slice(0, 2).join(', ')}
                </Text>
              </View>
            </>
          )}
        </View>
      )}

      {/* Map View */}
      {mapCoords && (mapCoords.origin || mapCoords.dest) && (() => {
        const o = mapCoords.origin;
        const d = mapCoords.dest;
        const midLat = o && d ? (o.lat + d.lat) / 2 : (o?.lat ?? d!.lat);
        const midLon = o && d ? (o.lon + d.lon) / 2 : (o?.lon ?? d!.lon);
        const latDelta = o && d ? Math.abs(o.lat - d.lat) * 1.4 + 0.5 : 2;
        const lonDelta = o && d ? Math.abs(o.lon - d.lon) * 1.4 + 0.5 : 2;
        return (
          <View style={{ height: 180, borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
            <MapView
              style={{ flex: 1 }}
              provider={PROVIDER_DEFAULT}
              initialRegion={{ latitude: midLat, longitude: midLon, latitudeDelta: latDelta, longitudeDelta: lonDelta }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              {o && <Marker coordinate={{ latitude: o.lat, longitude: o.lon }} title="Start" pinColor="#F97316" />}
              {d && <Marker coordinate={{ latitude: d.lat, longitude: d.lon }} title="Destination" pinColor="#0EA5E9" />}
            </MapView>
          </View>
        );
      })()}

      {/* AI Panel */}
      {ai && (
        <View style={[common.card, { marginBottom: 12 }]}>
          <View style={s.aiHeader}>
            <View style={s.aiTitleRow}>
              <View style={[s.aiChip, { backgroundColor: c.orange }]}><Text style={s.aiChipText}>AI</Text></View>
              <Text style={[s.aiTitle, { color: c.text1 }]}>Copilot Analysis</Text>
            </View>
            <View style={[s.riskBadge, { backgroundColor: riskColors[ai.riskLevel]?.bg }]}>
              <Text style={[s.riskText, { color: riskColors[ai.riskLevel]?.text }]}>
                {ai.riskLevel.toUpperCase()} RISK
              </Text>
            </View>
          </View>
          <Text style={[s.aiSummary, { color: c.text2 }]}>{ai.tripSummary}</Text>
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
              <Text style={[s.aiTipLabel, { color: c.sky }]}>TOP TIP</Text>
              <Text style={[s.aiTipText, { color: c.text3 }]}>{ai.topTip}</Text>
            </View>
          )}
        </View>
      )}

      {/* Cost breakdown */}
      {fi?.totalEstimatedCost && (
        <View style={[common.card, { marginBottom: 12 }]}>
          <View style={s.costHeader}>
            <Text style={[s.costLabel, { color: c.text2 }]}>Total Estimated Cost</Text>
            <Text style={[s.costAmount, { color: c.text1 }]}>${fi.totalEstimatedCost.amount}</Text>
          </View>
          <View style={s.costBreakdown}>
            {fi.totalEstimatedCost.breakdown.motels > 0 && <Text style={[s.costChip, { color: c.text3, backgroundColor: c.bgMuted, borderColor: c.border }]}>🛏 ${fi.totalEstimatedCost.breakdown.motels}</Text>}
            {fi.totalEstimatedCost.breakdown.meals > 0 && <Text style={[s.costChip, { color: c.text3, backgroundColor: c.bgMuted, borderColor: c.border }]}>🍽 ${fi.totalEstimatedCost.breakdown.meals}</Text>}
            {fi.totalEstimatedCost.breakdown.activities > 0 && <Text style={[s.costChip, { color: c.text3, backgroundColor: c.bgMuted, borderColor: c.border }]}>🏛 ${fi.totalEstimatedCost.breakdown.activities}</Text>}
            {fi.totalEstimatedCost.breakdown.gas > 0 && <Text style={[s.costChip, { color: c.text3, backgroundColor: c.bgMuted, borderColor: c.border }]}>⛽ ${fi.totalEstimatedCost.breakdown.gas}</Text>}
          </View>
        </View>
      )}

      {/* Timeline */}
      {fi?.calendarEvents?.length > 0 && (
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={[common.sectionTitle, { marginBottom: 0 }]}>Itinerary</Text>
            <TouchableOpacity
              style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: c.border, backgroundColor: c.bgMuted }}
              onPress={async () => {
                try {
                  await shareCalendar(fi.calendarEvents, trip?.title || 'Road Trip');
                } catch { Alert.alert('Error', 'Could not export calendar'); }
              }}
            >
              <Text style={{ fontSize: 12, color: c.text3, fontWeight: '600' }}>📅 Export .ics</Text>
            </TouchableOpacity>
          </View>
          {fi.calendarEvents.map((ev: any, i: number) => (
            <View key={ev.id} style={s.event}>
              <Text style={[s.eventTime, { color: c.text3 }]}>{fmtTime(ev.startTime)}</Text>
              <View style={s.eventTrack}>
                <View style={[s.eventDot, { backgroundColor: eventDotColor[ev.type] || c.border }]} />
                {i < fi.calendarEvents.length - 1 && <View style={[s.eventLine, { backgroundColor: c.border }]} />}
              </View>
              <View style={s.eventBody}>
                <Text style={[s.eventTitle, { color: c.text1 }]}>{eventIcon[ev.type] || '📍'} {ev.title}</Text>
                {ev.description ? <Text style={[s.eventDesc, { color: c.text3 }]} numberOfLines={2}>{ev.description}</Text> : null}
                {ev.location ? <Text style={[s.eventLoc, { color: c.sky }]}>📍 {ev.location}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* No route data fallback */}
      {!rd && (
        <View style={[common.card, { alignItems: 'center', paddingVertical: 24 }]}>
          <Text style={{ fontSize: 13, color: c.text3 }}>No route data saved with this trip.</Text>
        </View>
      )}

      {/* Budget Tracker */}
      <TouchableOpacity
        style={[s.replanBtn, { backgroundColor: c.card, borderWidth: 1, borderColor: c.orange }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate('BudgetTracker', { tripId: trip.tripId, tripTitle: trip.title });
        }}
      >
        <Text style={[s.replanBtnText, { color: c.orange }]}>$ Budget Tracker</Text>
      </TouchableOpacity>

      {/* Re-plan */}
      {rq && (
        <TouchableOpacity
          style={[s.replanBtn, { backgroundColor: c.orange }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('RoutePlanner', { routeRequest: rq });
          }}
        >
          <Text style={s.replanBtnText}>↺ Re-plan This Route</Text>
        </TouchableOpacity>
      )}

      {/* Notes */}
      <View style={[common.card, { marginBottom: 12 }]}>
        <Text style={[common.sectionTitle, { marginBottom: 8 }]}>My Notes</Text>
        <TextInput
          style={[s.notesInput, { color: c.text1, backgroundColor: c.bgMuted, borderColor: c.border }]}
          placeholder="Add notes about this trip..."
          placeholderTextColor={c.text3}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <TouchableOpacity
          style={[s.notesSaveBtn, { backgroundColor: c.orange }]}
          onPress={async () => {
            setSavingNotes(true);
            await apiPatch(`/trips/${tripId}/notes`, { notes });
            setSavingNotes(false);
          }}
          disabled={savingNotes}
        >
          {savingNotes
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={s.notesSaveBtnText}>Save notes</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Post-trip feedback */}
      <View style={[common.card, { marginBottom: 12 }]}>
        <Text style={[common.sectionTitle, { marginBottom: 12 }]}>How did it go?</Text>
        <View style={s.fbStars}>
          {[1,2,3,4,5].map(n => (
            <TouchableOpacity key={n} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFbRating(n); }}>
              <Text style={[s.fbStar, { color: fbRating >= n ? '#F59E0B' : c.border }]}>★</Text>
            </TouchableOpacity>
          ))}
          {fbRating > 0 && (
            <Text style={[s.fbStarLabel, { color: '#F59E0B' }]}>
              {['','Rough','Okay','Good','Great','Amazing'][fbRating]}
            </Text>
          )}
        </View>
        <TextInput
          style={[s.fbInput, { color: c.text1, backgroundColor: c.bgMuted, borderColor: c.border }]}
          placeholder="What worked well?"
          placeholderTextColor={c.text3}
          value={fbWorked}
          onChangeText={setFbWorked}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
        />
        <TextInput
          style={[s.fbInput, { color: c.text1, backgroundColor: c.bgMuted, borderColor: c.border }]}
          placeholder="What would you change?"
          placeholderTextColor={c.text3}
          value={fbDidnt}
          onChangeText={setFbDidnt}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
        />
        <TextInput
          style={[s.fbInput, { color: c.text1, backgroundColor: c.bgMuted, borderColor: c.border }]}
          placeholder="Overall note…"
          placeholderTextColor={c.text3}
          value={fbNote}
          onChangeText={setFbNote}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
        />
        {fbUpdatedAt && (
          <Text style={[s.fbSavedLabel, { color: c.text3 }]}>Last saved {fmtDate(fbUpdatedAt)}</Text>
        )}
        <TouchableOpacity
          style={[s.notesSaveBtn, { backgroundColor: fbSaved ? '#16A34A' : c.orange }]}
          onPress={handleSaveFeedback}
          disabled={fbSaving}
        >
          {fbSaving
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={s.notesSaveBtnText}>{fbSaved ? '✓ Saved' : fbUpdatedAt ? 'Update feedback' : 'Save feedback'}</Text>
          }
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={s.shareBtn} onPress={handleShare}>
        <Text style={s.shareBtnText}>↗ Share Trip</Text>
      </TouchableOpacity>

      {/* Notifications */}
      {hasNotifs && (
        <TouchableOpacity style={s.notifBtn} onPress={handleCancelNotifs}>
          <Text style={s.notifBtnText}>🔔 Reminders scheduled — tap to cancel</Text>
        </TouchableOpacity>
      )}

      {/* Delete */}
      <TouchableOpacity style={[s.deleteBtn, { borderColor: c.border }]} onPress={handleDelete} disabled={deleting}>
        {deleting
          ? <ActivityIndicator color={c.red} size="small" />
          : <Text style={[s.deleteBtnText, { color: c.red }]}>🗑 Delete Trip</Text>
        }
      </TouchableOpacity>

      <Text style={[s.meta, { color: c.text3 }]}>Saved {fmtDate(trip.createdAt)}</Text>
    </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 20, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, marginBottom: 12 },
  backLink: { fontSize: 14 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 16 },
  routeBar: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14, padding: 16, marginBottom: 12, gap: 12,
  },
  routeStat: { flexDirection: 'column', gap: 2 },
  routeVal: { fontSize: 18, fontWeight: '700' },
  routeLbl: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 },
  routeDivider: { width: 1, height: 32 },
  aiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  aiTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiChip: { borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  aiChipText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  aiTitle: { fontSize: 15, fontWeight: '700' },
  riskBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  riskText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  aiSummary: { fontSize: 14, lineHeight: 20, marginBottom: 10 },
  aiAlert: { backgroundColor: '#FFFBEB', borderRadius: 8, padding: 10, marginBottom: 8 },
  aiAlertText: { fontSize: 13, color: '#92400E', lineHeight: 18 },
  aiTip: { flexDirection: 'row', gap: 8, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 8, padding: 10 },
  aiTipLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  aiTipText: { flex: 1, fontSize: 13, lineHeight: 18 },
  costHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  costLabel: { fontSize: 14, fontWeight: '600' },
  costAmount: { fontSize: 20, fontWeight: '800' },
  costBreakdown: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  costChip: {
    fontSize: 12,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
  },
  event: { flexDirection: 'row', gap: 10, marginBottom: 0 },
  eventTime: { width: 52, fontSize: 12, fontWeight: '600', paddingTop: 2, textAlign: 'right' },
  eventTrack: { alignItems: 'center', width: 14 },
  eventDot: { width: 10, height: 10, borderRadius: 5, marginTop: 3 },
  eventLine: { flex: 1, width: 2, marginVertical: 4, minHeight: 20 },
  eventBody: { flex: 1, paddingBottom: 16 },
  eventTitle: { fontSize: 14, fontWeight: '600', marginBottom: 3 },
  eventDesc: { fontSize: 13, lineHeight: 18, marginBottom: 3 },
  eventLoc: { fontSize: 12 },
  replanBtn: {
    marginTop: 24, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  replanBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  notifBtn: {
    marginTop: 10, borderWidth: 1, borderColor: '#FED7AA', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center', backgroundColor: '#FFF7ED',
  },
  notifBtnText: { fontSize: 14, color: '#C2410C', fontWeight: '600' },
  deleteBtn: {
    marginTop: 10, borderWidth: 1, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  deleteBtnText: { fontSize: 14, fontWeight: '600' },
  shareBtn: {
    marginTop: 10, borderWidth: 1, borderColor: '#BAE6FD', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center', backgroundColor: '#F0F9FF',
  },
  shareBtnText: { fontSize: 14, color: '#0369A1', fontWeight: '600' },
  meta: { textAlign: 'center', fontSize: 12, marginTop: 12 },
  notesInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, minHeight: 96, marginBottom: 10 },
  notesSaveBtn: { borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  notesSaveBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  fbStars: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 14 },
  fbStar: { fontSize: 30 },
  fbStarLabel: { fontSize: 14, fontWeight: '700', marginLeft: 6 },
  fbInput: { borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 14, minHeight: 60, marginBottom: 8, textAlignVertical: 'top' },
  fbSavedLabel: { fontSize: 12, textAlign: 'right', marginBottom: 8 },
});
