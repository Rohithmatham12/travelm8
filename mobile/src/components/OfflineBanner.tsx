import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function OfflineBanner() {
  return (
    <View style={s.banner}>
      <Text style={s.text}>📡 You're offline — showing saved data</Text>
    </View>
  );
}

const s = StyleSheet.create({
  banner: {
    backgroundColor: '#1F2937', paddingVertical: 8, paddingHorizontal: 16,
    alignItems: 'center',
  },
  text: { color: '#F9FAFB', fontSize: 13, fontWeight: '500' },
});
