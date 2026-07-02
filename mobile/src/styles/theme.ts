import { StyleSheet } from 'react-native';

export const colors = {
  orange: '#F97316',
  orangeLight: '#FFF7ED',
  sky: '#0EA5E9',
  green: '#16A34A',
  red: '#DC2626',
  purple: '#7C3AED',
  bg: '#FAFAF9',
  bgMuted: '#F3F4F6',
  card: '#FFFFFF',
  border: '#E5E7EB',
  text1: '#111827',
  text2: '#374151',
  text3: '#6B7280',
};

export const common = StyleSheet.create({
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: colors.text1, backgroundColor: colors.card,
    marginBottom: 12,
  },
  btnPrimary: {
    backgroundColor: colors.orange, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnSecondary: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  btnSecondaryText: { color: colors.text2, fontSize: 14, fontWeight: '600' },
  card: {
    backgroundColor: colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text1, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', color: colors.text3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
});
