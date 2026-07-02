import { useColorScheme, StyleSheet } from 'react-native';

const light = {
  bg: '#FAFAF9',
  bgMuted: '#F5F5F4',
  card: '#FFFFFF',
  border: '#E7E5E4',
  text1: '#1C1917',
  text2: '#44403C',
  text3: '#78716C',
  orange: '#F97316',
  sky: '#0EA5E9',
  green: '#22C55E',
  purple: '#A855F7',
  red: '#EF4444',
};

const dark = {
  bg: '#0C0A09',
  bgMuted: '#1C1917',
  card: '#1C1917',
  border: '#292524',
  text1: '#FAFAF9',
  text2: '#D6D3D1',
  text3: '#78716C',
  orange: '#FB923C',
  sky: '#38BDF8',
  green: '#4ADE80',
  purple: '#C084FC',
  red: '#F87171',
};

export const colors = light; // keep static export for screens not yet migrated

export function useTheme() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? dark : light;
}

// common styles factory
export function makeCommon(c: typeof light) {
  return StyleSheet.create({
    input: {
      borderWidth: 1, borderColor: c.border, borderRadius: 12,
      padding: 14, fontSize: 15, color: c.text1, backgroundColor: c.card,
      marginBottom: 12,
    },
    btnPrimary: {
      backgroundColor: c.orange, borderRadius: 12,
      paddingVertical: 15, alignItems: 'center' as const, marginBottom: 10,
    },
    btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '700' as const },
    btnSecondary: {
      borderWidth: 1, borderColor: c.border, borderRadius: 12,
      paddingVertical: 15, alignItems: 'center' as const, marginBottom: 10,
    },
    btnSecondaryText: { fontSize: 15, color: c.text2, fontWeight: '600' as const },
    card: {
      backgroundColor: c.card, borderWidth: 1, borderColor: c.border,
      borderRadius: 14, padding: 16, marginBottom: 10,
    },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: c.text1, marginBottom: 12 },
    label: { fontSize: 13, fontWeight: '600', color: c.text3, marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  });
}

export const common = makeCommon(light);
