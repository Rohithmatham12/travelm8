import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props { message?: string; onRetry: () => void; }

export default function ErrorState({ message = "Couldn't load data", onRetry }: Props) {
  return (
    <View style={s.wrap}>
      <Text style={s.icon}>⚠️</Text>
      <Text style={s.msg}>{message}</Text>
      <TouchableOpacity style={s.btn} onPress={onRetry}>
        <Text style={s.btnText}>Try again</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#FAFAF9' },
  icon: { fontSize: 40, marginBottom: 12 },
  msg: { fontSize: 16, color: '#78716C', textAlign: 'center', marginBottom: 20 },
  btn: { backgroundColor: '#F97316', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
