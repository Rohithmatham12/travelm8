import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { apiPost } from '../utils/api';
import { setToken, setStoredUser } from '../utils/auth';
import { RootStackParamList } from '../types';
import { colors, common } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

export default function AuthScreen({ navigation }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const body = mode === 'login'
        ? { email: email.trim(), password }
        : { email: email.trim(), password, name: name.trim() || 'Traveler' };

      const res = await apiPost<any>(path, body);
      if (res.success && res.data?.token) {
        await setToken(res.data.token);
        await setStoredUser(res.data.user);
        navigation.replace('Dashboard');
      } else {
        Alert.alert('Error', res.error || 'Authentication failed');
      }
    } catch {
      Alert.alert('Error', 'Network error — check your connection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.hero}>
          <Text style={s.logo}>🚗</Text>
          <Text style={s.appName}>TravelM8</Text>
          <Text style={s.tagline}>Your road trip copilot</Text>
        </View>

        <View style={s.card}>
          <View style={s.tabs}>
            <TouchableOpacity
              style={[s.tab, mode === 'login' && s.tabActive]}
              onPress={() => setMode('login')}
            >
              <Text style={[s.tabText, mode === 'login' && s.tabTextActive]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.tab, mode === 'register' && s.tabActive]}
              onPress={() => setMode('register')}
            >
              <Text style={[s.tabText, mode === 'register' && s.tabTextActive]}>Create Account</Text>
            </TouchableOpacity>
          </View>

          {mode === 'register' && (
            <TextInput
              style={common.input}
              placeholder="Your name"
              placeholderTextColor={colors.text3}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          )}
          <TextInput
            style={common.input}
            placeholder="Email"
            placeholderTextColor={colors.text3}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={common.input}
            placeholder="Password"
            placeholderTextColor={colors.text3}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={common.btnPrimary} onPress={submit} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={common.btnPrimaryText}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  hero: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 48 },
  appName: { fontSize: 32, fontWeight: '800', color: colors.text1, marginTop: 8 },
  tagline: { fontSize: 15, color: colors.text3, marginTop: 4 },
  card: {
    backgroundColor: colors.card, borderRadius: 16,
    padding: 20, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  tabs: { flexDirection: 'row', marginBottom: 20, borderRadius: 10, backgroundColor: colors.bgMuted, padding: 3 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: colors.card, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.text3 },
  tabTextActive: { color: colors.text1 },
});
