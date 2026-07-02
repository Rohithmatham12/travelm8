import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { apiPost } from '../utils/api';
import { setToken, setStoredUser } from '../utils/auth';
import { RootStackParamList } from '../types';
import { useTheme, makeCommon } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

export default function AuthScreen({ navigation }: Props) {
  const c = useTheme();
  const common = makeCommon(c);

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
    <KeyboardAvoidingView style={[s.root, { backgroundColor: c.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.hero}>
          <Text style={s.logo}>🚗</Text>
          <Text style={[s.appName, { color: c.text1 }]}>TravelM8</Text>
          <Text style={[s.tagline, { color: c.text3 }]}>Your road trip copilot</Text>
        </View>

        <View style={[s.card, { backgroundColor: c.card }]}>
          <View style={[s.tabs, { backgroundColor: c.bgMuted }]}>
            <TouchableOpacity
              style={[s.tab, mode === 'login' && s.tabActive, mode === 'login' && { backgroundColor: c.card }]}
              onPress={() => setMode('login')}
            >
              <Text style={[s.tabText, { color: mode === 'login' ? c.text1 : c.text3 }]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.tab, mode === 'register' && s.tabActive, mode === 'register' && { backgroundColor: c.card }]}
              onPress={() => setMode('register')}
            >
              <Text style={[s.tabText, { color: mode === 'register' ? c.text1 : c.text3 }]}>Create Account</Text>
            </TouchableOpacity>
          </View>

          {mode === 'register' && (
            <TextInput
              style={common.input}
              placeholder="Your name"
              placeholderTextColor={c.text3}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          )}
          <TextInput
            style={common.input}
            placeholder="Email"
            placeholderTextColor={c.text3}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={common.input}
            placeholder="Password"
            placeholderTextColor={c.text3}
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
  root: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  hero: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 48 },
  appName: { fontSize: 32, fontWeight: '800', marginTop: 8 },
  tagline: { fontSize: 15, marginTop: 4 },
  card: {
    borderRadius: 16,
    padding: 20, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  tabs: { flexDirection: 'row', marginBottom: 20, borderRadius: 10, padding: 3 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 },
  tabText: { fontSize: 14, fontWeight: '600' },
});
