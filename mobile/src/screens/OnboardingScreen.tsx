import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Dimensions, Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useTheme, colors } from '../styles/theme';
import { requestNotificationPermission } from '../utils/notifications';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    key: '1',
    icon: '🗺️',
    title: 'Plan any road trip',
    desc: 'Enter origin and destination — TravelM8 maps your route, finds stops, and estimates drive time in seconds.',
    bg: '#FFF7ED',
    accent: colors.orange,
  },
  {
    key: '2',
    icon: '🤖',
    title: 'AI copilot on board',
    desc: 'Get fatigue warnings, late-arrival alerts, risk scores, and local tips for every stop — powered by AI.',
    bg: '#EFF6FF',
    accent: colors.sky,
  },
  {
    key: '3',
    icon: '💾',
    title: 'Save and re-plan',
    desc: 'Save your routes, view full itineraries, and re-plan any trip with one tap. Your road trips, always with you.',
    bg: '#F0FDF4',
    accent: colors.green,
  },
  {
    key: 'notify',
    icon: '🔔',
    title: 'Never miss a departure',
    desc: "Get reminded the night before and 1 hour before you hit the road. We'll also alert you when it's time for a break.",
    bg: '#FFF8DC',
    accent: '#F97316',
  },
];

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export default function OnboardingScreen({ navigation }: Props) {
  const c = useTheme();

  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const finish = async () => {
    await AsyncStorage.setItem('tm8_onboarded', '1');
    navigation.replace('Auth');
  };

  const next = async () => {
    if (activeIndex < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      await requestNotificationPermission();
      await finish();
    }
  };

  return (
    <View style={[s.root, { backgroundColor: c.bg }]}>
      <FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={i => i.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onMomentumScrollEnd={e => setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={[s.slide, { width }]}>
            <View style={[s.iconWrap, { backgroundColor: item.bg }]}>
              <Text style={s.icon}>{item.icon}</Text>
            </View>
            <Text style={[s.title, { color: c.text1 }]}>{item.title}</Text>
            <Text style={[s.desc, { color: c.text3 }]}>{item.desc}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={s.dots}>
        {SLIDES.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 24, 8], extrapolate: 'clamp' });
          const opacity = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
          return (
            <Animated.View
              key={i}
              style={[s.dot, { width: dotWidth, opacity, backgroundColor: SLIDES[activeIndex].accent }]}
            />
          );
        })}
      </View>

      {/* Actions */}
      <View style={s.actions}>
        <TouchableOpacity
          style={[s.nextBtn, { backgroundColor: SLIDES[activeIndex].accent }]}
          onPress={next}
        >
          <Text style={s.nextBtnText}>
            {activeIndex < SLIDES.length - 1 ? 'Next →' : 'Allow Notifications & Start'}
          </Text>
        </TouchableOpacity>
        {activeIndex < SLIDES.length - 1 && (
          <TouchableOpacity onPress={finish} style={s.skipBtn}>
            <Text style={[s.skipText, { color: c.text3 }]}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  slide: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, paddingBottom: 160,
  },
  iconWrap: {
    width: 140, height: 140, borderRadius: 70,
    alignItems: 'center', justifyContent: 'center', marginBottom: 36,
  },
  icon: { fontSize: 64 },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 16 },
  desc: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  dots: {
    position: 'absolute', bottom: 140, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  dot: { height: 8, borderRadius: 4 },
  actions: {
    position: 'absolute', bottom: 48, left: 32, right: 32, gap: 12,
  },
  nextBtn: {
    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
  },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: { fontSize: 15 },
});
