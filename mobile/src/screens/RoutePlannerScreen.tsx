import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { apiPost } from '../utils/api';
import { RouteResponse, RootStackParamList } from '../types';
import { useTheme, makeCommon } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RoutePlanner'>;

export default function RoutePlannerScreen({ navigation, route }: Props) {
  const c = useTheme();
  const common = makeCommon(c);

  const rq = route.params?.routeRequest;
  const [origin, setOrigin] = useState(rq?.origin ?? '');
  const [destination, setDestination] = useState(rq?.destination ?? '');
  const [date, setDate] = useState(rq?.departureDate ?? new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(rq?.departureTime ?? '08:00');
  const [travelers, setTravelers] = useState(rq?.travelers ? String(rq.travelers) : '1');
  const [motelBudget, setMotelBudget] = useState(rq?.budget?.motelPerNight ? String(rq.budget.motelPerNight) : '');
  const [mealBudget, setMealBudget] = useState(rq?.budget?.mealBudget ? String(rq.budget.mealBudget) : '');
  const [loading, setLoading] = useState(false);

  const handlePlan = async () => {
    if (!origin.trim() || !destination.trim()) {
      Alert.alert('Missing fields', 'Enter both origin and destination.');
      return;
    }
    const travelerCount = Number(travelers) || 1;
    if (travelerCount < 1 || travelerCount > 20) {
      Alert.alert('Invalid', 'Travelers must be between 1 and 20.');
      return;
    }

    setLoading(true);
    try {
      const budget: any = {};
      if (motelBudget) budget.motelPerNight = Number(motelBudget);
      if (mealBudget) budget.mealBudget = Number(mealBudget);

      const routeRequest = {
        origin: origin.trim(),
        destination: destination.trim(),
        departureDate: date,
        departureTime: time,
        travelers: travelerCount,
        ...(Object.keys(budget).length > 0 && { budget }),
        preferences: { stopFrequency: 'moderate' },
        needsOfflineMaps: true,
      };

      const res = await apiPost<RouteResponse>('/route/plan', routeRequest);
      if (res.success && res.data) {
        navigation.navigate('RouteResults', { routePlan: res.data, routeRequest });
      } else {
        Alert.alert('Error', res.error || 'Failed to plan route');
      }
    } catch {
      Alert.alert('Error', 'Network error — check your connection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[s.root, { backgroundColor: c.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Text style={[s.heading, { color: c.text1 }]}>Plan your route</Text>

        <Text style={common.label}>From</Text>
        <TextInput style={common.input} placeholder="Origin city or address" placeholderTextColor={c.text3} value={origin} onChangeText={setOrigin} />

        <Text style={common.label}>To</Text>
        <TextInput style={common.input} placeholder="Destination" placeholderTextColor={c.text3} value={destination} onChangeText={setDestination} />

        <View style={s.row}>
          <View style={s.half}>
            <Text style={common.label}>Date</Text>
            <TextInput style={common.input} placeholder="YYYY-MM-DD" placeholderTextColor={c.text3} value={date} onChangeText={setDate} />
          </View>
          <View style={s.half}>
            <Text style={common.label}>Depart</Text>
            <TextInput style={common.input} placeholder="HH:MM" placeholderTextColor={c.text3} value={time} onChangeText={setTime} />
          </View>
        </View>

        <View style={s.row}>
          <View style={s.half}>
            <Text style={common.label}>Travelers</Text>
            <TextInput style={common.input} placeholder="1" placeholderTextColor={c.text3} value={travelers} onChangeText={setTravelers} keyboardType="number-pad" />
          </View>
          <View style={s.half}>
            <Text style={common.label}>Motel/night ($)</Text>
            <TextInput style={common.input} placeholder="80" placeholderTextColor={c.text3} value={motelBudget} onChangeText={setMotelBudget} keyboardType="decimal-pad" />
          </View>
        </View>

        <Text style={common.label}>Meal budget / stop ($)</Text>
        <TextInput style={common.input} placeholder="15" placeholderTextColor={c.text3} value={mealBudget} onChangeText={setMealBudget} keyboardType="decimal-pad" />

        <TouchableOpacity
          style={[common.btnPrimary, loading && s.btnDisabled]}
          onPress={handlePlan}
          disabled={loading}
        >
          {loading
            ? <View style={s.loadingRow}><ActivityIndicator color="#fff" size="small" /><Text style={[common.btnPrimaryText, { marginLeft: 8 }]}>Planning your route…</Text></View>
            : <Text style={common.btnPrimaryText}>Plan My Route →</Text>
          }
        </TouchableOpacity>

        {loading && (
          <Text style={[s.loadingHint, { color: c.text3 }]}>AI is analyzing your route — takes ~20 seconds</Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: '800', marginBottom: 20 },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  btnDisabled: { opacity: 0.7 },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  loadingHint: { textAlign: 'center', fontSize: 13, marginTop: 12 },
});
