import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

export default function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View style={[s.card, { opacity }]}>
      <View style={s.title} />
      <View style={s.sub} />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#E7E5E4', borderRadius: 14,
    padding: 16, marginBottom: 10,
  },
  title: { height: 16, backgroundColor: '#D6D3D1', borderRadius: 6, width: '60%', marginBottom: 10 },
  sub: { height: 12, backgroundColor: '#D6D3D1', borderRadius: 6, width: '40%' },
});
