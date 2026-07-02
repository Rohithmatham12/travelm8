import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { apiPost } from '../utils/api';
import { scheduleTripNotifications } from '../utils/notifications';
import { RouteStop, StopOptionSet, RootStackParamList } from '../types';
import { colors, common } from '../styles/theme';
import { getWeatherForTrip, DayWeather } from '../utils/weather';

type Props = NativeStackScreenProps<RootStackParamList, 'RouteResults'>;

const fmtMins = (m: number) =>
  m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 > 0 ? `${m % 60}m` : ''}`.trim() : `${m}m`;

const riskColors: Record<string, { bg: string; text: string }> = {
  low: { bg: '#DCFCE7', text: '#15803D' },
  medium: { bg: '#FEF9C3', text: '#A16207' },
  high: { bg: '#FEE2E2', text: '#DC2626' },
};

export default function RouteResultsScreen({ route, navigation }: Props) {
  const { routePlan, routeRequest } = route.params;
  const { routeSummary: rs, stopOptionSets, aiInsights: ai } = routePlan;

  const [selectedPois, setSelectedPois] = useState<Record<string, string>>({});
  const [selectedRests, setSelectedRests] = useState<Record<string, string>>({});
  const [selectedMotel, setSelectedMotel] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [weather, setWeather] = useState<DayWeather | null>(null);

  useEffect(() => {
    if (routeRequest.departureDate) {
      getWeatherForTrip(routeRequest.origin || rs.origin, routeRequest.departureDate)
        .then(w => { if (w) setWeather(w); });
    }
  }, []);

  const selectStop = (setId: string, type: 'poi' | 'rest', stopId: string) => {
    if (type === 'poi') setSelectedPois(p => ({ ...p, [setId]: stopId }));
    else setSelectedRests(p => ({ ...p, [setId]: stopId }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiPost<any>('/trips/save-route', {
        routeRequest,
        routePlan,
        finalItinerary: null,
      });
      if (res.success) {
        const tripId = res.data?.tripId;
        if (tripId) {
          scheduleTripNotifications(
            tripId,
            routeRequest.destination,
            routeRequest.departureDate,
            routeRequest.departureTime || '08:00',
            routePlan?.routeSummary?.estimatedDriveTime || 0,
          ).catch(() => {});
        }
        Alert.alert('Saved!', 'Trip saved to My Trips.', [
          { text: 'View trips', onPress: () => navigation.navigate('TripList') },
          { text: 'OK' },
        ]);
      } else {
        Alert.alert('Error', res.error || 'Failed to save');
      }
    } catch {
      Alert.alert('Error', 'Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    const pois = Object.values(selectedPois).filter(Boolean);
    const rests = Object.values(selectedRests).filter(Boolean);
    if (!pois.length && !rests.length && !selectedMotel) {
      Alert.alert('Select stops', 'Pick at least one stop to generate your itinerary.');
      return;
    }
    setFinalizing(true);
    try {
      const res = await apiPost<any>('/route/finalize', {
        routeRequest,
        selections: {
          routeId: 'route-1',
          selectedPois: pois,
          selectedRestaurants: rests,
          selectedMotel,
          departureTime: routeRequest.departureTime || '08:00',
        },
      });
      if (res.success && res.data) {
        const saveRes = await apiPost<any>('/trips/save-route', {
          routeRequest, routePlan, finalItinerary: res.data,
        });
        const tripId = saveRes.data?.tripId;
        if (tripId) {
          scheduleTripNotifications(
            tripId,
            routeRequest.destination,
            routeRequest.departureDate,
            routeRequest.departureTime || '08:00',
            routePlan?.routeSummary?.estimatedDriveTime || 0,
          ).catch(() => {});
        }
        Alert.alert('Itinerary ready!', 'Your trip has been saved with a full itinerary.', [
          { text: 'View trips', onPress: () => navigation.navigate('TripList') },
          { text: 'OK' },
        ]);
      } else {
        Alert.alert('Error', res.error || 'Failed to generate itinerary');
      }
    } catch {
      Alert.alert('Error', 'Network error');
    } finally {
      setFinalizing(false);
    }
  };

  const StopPicker = ({ set, type, stops, label }: {
    set: StopOptionSet; type: 'poi' | 'rest'; stops: RouteStop[]; label: string;
  }) => {
    if (!stops.length) return null;
    const selected = type === 'poi' ? selectedPois[set.setId] : selectedRests[set.setId];
    const selStop = stops.find(s => s.id === selected);

    return (
      <View style={s.stopCategory}>
        <Text style={s.stopCatLabel}>{label}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[s.stopChip, !selected && s.stopChipActive]}
            onPress={() => selectStop(set.setId, type, '')}
          >
            <Text style={[s.stopChipText, !selected && s.stopChipTextActive]}>Skip</Text>
          </TouchableOpacity>
          {stops.map(stop => (
            <TouchableOpacity
              key={stop.id}
              style={[s.stopChip, selected === stop.id && s.stopChipActive]}
              onPress={() => selectStop(set.setId, type, stop.id)}
            >
              <Text style={[s.stopChipText, selected === stop.id && s.stopChipTextActive]} numberOfLines={1}>
                {stop.name}{stop.rating ? ` ★${stop.rating.toFixed(1)}` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {selStop && (
          <View style={s.stopDetail}>
            <Text style={s.stopDetailDesc} numberOfLines={3}>{selStop.description}</Text>
            <View style={s.stopDetailMeta}>
              {selStop.openHours && <Text style={s.metaChip}>🕒 {selStop.openHours}</Text>}
              {selStop.priceEstimate != null && <Text style={s.metaChip}>💵 ${selStop.priceEstimate}</Text>}
              {selStop.estimatedTimeAtStop > 0 && <Text style={s.metaChip}>⏱ ~{selStop.estimatedTimeAtStop}min</Text>}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      {/* Route bar */}
      <View style={s.routeBar}>
        <Text style={s.routeTitle} numberOfLines={1}>{rs.origin} → {rs.destination}</Text>
        <View style={s.routeStats}>
          <Text style={s.routeStat}>{rs.totalDistance} mi</Text>
          <Text style={s.routeStatDiv}>·</Text>
          <Text style={s.routeStat}>{fmtMins(rs.estimatedDriveTime)} drive</Text>
          {rs.majorCities?.length > 0 && (
            <>
              <Text style={s.routeStatDiv}>·</Text>
              <Text style={s.routeStat} numberOfLines={1}>via {rs.majorCities.slice(0, 2).join(', ')}</Text>
            </>
          )}
        </View>
      </View>

      {/* Weather forecast */}
      {weather && (
        <View style={s.weatherCard}>
          <Text style={s.weatherEmoji}>{weather.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.weatherDesc}>{weather.description} on departure day</Text>
            <Text style={s.weatherTemp}>{weather.tempMin}°–{weather.tempMax}°F</Text>
          </View>
        </View>
      )}

      {/* AI Copilot */}
      {ai && (
        <View style={[common.card, { marginBottom: 16 }]}>
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

      {/* Stop zones */}
      {stopOptionSets.map(set => (
        <View key={set.setId} style={[common.card, { marginBottom: 12 }]}>
          <Text style={s.zoneLabel}>{set.label}</Text>
          <Text style={s.zoneMiles}>{set.distanceRange.from}–{set.distanceRange.to} mi from start</Text>
          <StopPicker set={set} type="poi" stops={set.pois} label="🏛 Places to Explore" />
          <StopPicker set={set} type="rest" stops={set.restaurants} label="🍽 Food Stop" />
          {set.motels.length > 0 && (
            <View style={s.stopCategory}>
              <Text style={s.stopCatLabel}>🛏 Overnight Stay</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[s.stopChip, !selectedMotel && s.stopChipActive]}
                  onPress={() => setSelectedMotel('')}
                >
                  <Text style={[s.stopChipText, !selectedMotel && s.stopChipTextActive]}>Skip</Text>
                </TouchableOpacity>
                {set.motels.map(m => (
                  <TouchableOpacity
                    key={m.id}
                    style={[s.stopChip, selectedMotel === m.id && s.stopChipActive]}
                    onPress={() => setSelectedMotel(m.id)}
                  >
                    <Text style={[s.stopChipText, selectedMotel === m.id && s.stopChipTextActive]} numberOfLines={1}>
                      {m.name}{m.priceEstimate != null ? ` · $${m.priceEstimate}` : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      ))}

      {/* Actions */}
      <TouchableOpacity
        style={[common.btnPrimary, { marginBottom: 10 }]}
        onPress={handleFinalize}
        disabled={finalizing}
      >
        {finalizing
          ? <ActivityIndicator color="#fff" />
          : <Text style={common.btnPrimaryText}>Generate Full Itinerary →</Text>
        }
      </TouchableOpacity>
      <TouchableOpacity style={common.btnSecondary} onPress={handleSave} disabled={saving}>
        {saving
          ? <ActivityIndicator color={colors.text2} />
          : <Text style={common.btnSecondaryText}>💾 Save Route (no itinerary)</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  routeBar: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 16, marginBottom: 12,
  },
  routeTitle: { fontSize: 16, fontWeight: '700', color: colors.text1, marginBottom: 6 },
  routeStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  routeStat: { fontSize: 13, color: colors.text3 },
  routeStatDiv: { fontSize: 13, color: colors.border },
  weatherCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 14, marginBottom: 10,
  },
  weatherEmoji: { fontSize: 32 },
  weatherDesc: { fontSize: 14, fontWeight: '600', color: colors.text2, marginBottom: 2 },
  weatherTemp: { fontSize: 13, color: colors.text3 },
  aiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  aiTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiChip: { backgroundColor: colors.orange, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  aiChipText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  aiTitle: { fontSize: 15, fontWeight: '700', color: colors.text1 },
  riskBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  riskText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  aiSummary: { fontSize: 14, color: colors.text2, lineHeight: 20, marginBottom: 10 },
  aiAlert: {
    backgroundColor: '#FFFBEB', borderRadius: 8, padding: 10, marginBottom: 8,
  },
  aiAlertText: { fontSize: 13, color: '#92400E', lineHeight: 18 },
  aiTip: {
    flexDirection: 'row', gap: 8, backgroundColor: '#EFF6FF',
    borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 8, padding: 10,
  },
  aiTipLabel: { fontSize: 10, fontWeight: '800', color: colors.sky, letterSpacing: 0.5 },
  aiTipText: { flex: 1, fontSize: 13, color: colors.text3, lineHeight: 18 },
  zoneLabel: { fontSize: 15, fontWeight: '700', color: colors.text1, marginBottom: 2 },
  zoneMiles: { fontSize: 12, color: colors.text3, marginBottom: 12 },
  stopCategory: { marginBottom: 12 },
  stopCatLabel: { fontSize: 13, fontWeight: '600', color: colors.text2, marginBottom: 8 },
  stopChip: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, marginRight: 6,
    backgroundColor: colors.card, maxWidth: 200,
  },
  stopChipActive: { borderColor: colors.orange, backgroundColor: '#FFF7ED' },
  stopChipText: { fontSize: 13, color: colors.text3 },
  stopChipTextActive: { color: colors.orange, fontWeight: '600' },
  stopDetail: {
    marginTop: 8, backgroundColor: colors.bgMuted,
    borderRadius: 10, padding: 12, borderLeftWidth: 3, borderLeftColor: colors.orange,
  },
  stopDetailDesc: { fontSize: 13, color: colors.text2, lineHeight: 18, marginBottom: 8 },
  stopDetailMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaChip: {
    fontSize: 12, color: colors.text3, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
});
