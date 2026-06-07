import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useAppTheme } from '@/context/AppThemeContext';

interface Props {
  name: string;
  department: string;
  status: string;
  matric: string;
  programme: string;
  level: string;
}

export default function HomeHeader({ name, department, status, matric, programme, level }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;
  const { accent, onAccent } = useAppTheme();

  const isActive = status.toUpperCase().includes('ACTIVE') &&
                   !status.toUpperCase().includes('INACTIVE');

  const dotColor  = isActive ? '#22C55E' : '#EF4444';
  const ringColor = isActive ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)';

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.9, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const initials    = name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase();
  const displayName = name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

  return (
    <View style={s.outer}>
      {/* decorative glow blobs */}
      <View style={[s.blob1, { backgroundColor: accent + '22' }]} />
      <View style={[s.blob2, { backgroundColor: accent + '10' }]} />

      {/* ── top row ── */}
      <View style={s.topRow}>
        <View style={[s.statusPill, {
          backgroundColor: isActive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.10)',
          borderColor:     isActive ? 'rgba(34,197,94,0.28)' : 'rgba(239,68,68,0.24)',
        }]}>
          <View style={s.beaconWrap}>
            <Animated.View style={[s.beaconRing, { backgroundColor: ringColor, transform: [{ scale: pulse }] }]} />
            <View style={[s.beaconDot, { backgroundColor: dotColor }]} />
          </View>
          <Text style={[s.statusText, { color: dotColor }]}>
            {isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>

        {!!matric && (
          <View style={s.matricChip}>
            <Text style={s.matricLabel}>ID</Text>
            <Text style={s.matricValue}>{matric}</Text>
          </View>
        )}
      </View>

      {/* ── avatar ── */}
      <View style={[s.avatarRing, { borderColor: accent + '55' }]}>
        <View style={[s.avatar, { backgroundColor: accent }]}>
          <Text style={[s.initials, { color: onAccent }]}>{initials}</Text>
        </View>
      </View>

      <Text style={s.name}>{displayName}</Text>

      {!!department && (
        <View style={[s.deptBadge, { borderColor: accent + '40' }]}>
          <Text style={[s.deptText, { color: accent }]}>{department.toUpperCase()}</Text>
        </View>
      )}

      {(!!programme || !!level) && (
        <View style={s.subRow}>
          {!!programme && <Text style={s.subChip}>{programme}</Text>}
          {!!programme && !!level && <View style={s.subDivider} />}
          {!!level     && <Text style={s.subChip}>{level}</Text>}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  outer: {
    paddingTop: 20,
    paddingBottom: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    overflow: 'hidden',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    backgroundColor: '#0D1E35',
  },

  blob1: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    top: -80, right: -60,
  },
  blob2: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    bottom: -60, left: -40,
  },

  topRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%', marginBottom: 20,
  },

  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
  },
  beaconWrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center' },
  beaconRing: { position: 'absolute', width: 12, height: 12, borderRadius: 6 },
  beaconDot:  { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },

  matricChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
  },
  matricLabel: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.8 },
  matricValue: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.8)', letterSpacing: 0.3 },

  avatarRing: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 2.5,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  initials: { fontSize: 26, fontWeight: '900' },
  name:     { color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginBottom: 12, letterSpacing: -0.3 },

  deptBadge: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6,
    borderWidth: 1, marginBottom: 12,
  },
  deptText: { fontSize: 11, fontWeight: '800', textAlign: 'center', letterSpacing: 0.5 },

  subRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  subChip:    { paddingHorizontal: 16, paddingVertical: 7, color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  subDivider: { width: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.14)' },
});
