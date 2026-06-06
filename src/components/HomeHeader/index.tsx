import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface Props {
  name: string;
  department: string;
  status: string;
  matric: string;
  programme: string;
  level: string;
}

export default function HomeHeader({ name, department, status, matric, programme, level }: Props) {
  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(-24)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  const isActive = status.toUpperCase().includes('ACTIVE') &&
                   !status.toUpperCase().includes('INACTIVE');

  const dotColor  = isActive ? '#22C55E' : '#EF4444';
  const ringColor = isActive ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)';

  useEffect(() => {
    // entrance
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    // beacon pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.8, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const initials = name
    .split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase();

  const displayName = name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

  return (
    <Animated.View style={[styles.card, { opacity: fade, transform: [{ translateY: slide }] }]}>
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />

      {/* ── top row: status pill (left) + matric chip (right) ── */}
      <View style={styles.topRow}>
        {/* Status beacon */}
        <View style={[styles.statusPill, { backgroundColor: isActive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', borderColor: isActive ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)' }]}>
          <View style={styles.beaconWrap}>
            <Animated.View style={[styles.beaconRing, { backgroundColor: ringColor, transform: [{ scale: pulse }] }]} />
            <View style={[styles.beaconDot, { backgroundColor: dotColor }]} />
          </View>
          <Text style={[styles.statusText, { color: dotColor }]}>
            {isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>

        {/* Matric chip */}
        {!!matric && (
          <View style={styles.matricChip}>
            <Text style={styles.matricLabel}>ID</Text>
            <Text style={styles.matricValue}>{matric}</Text>
          </View>
        )}
      </View>

      {/* ── avatar ── */}
      <View style={styles.avatarRing}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
      </View>

      <Text style={styles.name}>{displayName}</Text>

      {!!department && (
        <View style={styles.deptBadge}>
          <Text style={styles.deptText}>{department}</Text>
        </View>
      )}

      {(!!programme || !!level) && (
        <View style={styles.subRow}>
          {!!programme && (
            <View style={styles.subChip}>
              <Text style={styles.subChipText}>{programme}</Text>
            </View>
          )}
          {!!programme && !!level && <View style={styles.subDivider} />}
          {!!level && (
            <View style={styles.subChip}>
              <Text style={styles.subChipText}>{level}</Text>
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0D2137',
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    overflow: 'hidden',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  circle1: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(78,205,196,0.08)', top: -70, right: -60,
  },
  circle2: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(116,185,255,0.06)', bottom: -50, left: -50,
  },
  circle3: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(78,205,196,0.12)', top: 20, left: 30,
  },

  /* top row */
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 18,
  },

  /* status beacon pill */
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  beaconWrap: {
    width: 12, height: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  beaconRing: {
    position: 'absolute',
    width: 12, height: 12, borderRadius: 6,
  },
  beaconDot: {
    width: 7, height: 7, borderRadius: 4,
  },
  statusText: {
    fontSize: 12, fontWeight: '700', letterSpacing: 0.2,
  },

  /* matric chip */
  matricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  matricLabel: {
    fontSize: 9, fontWeight: '800',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  matricValue: {
    fontSize: 11, fontWeight: '700',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.3,
  },

  /* avatar */
  avatarRing: {
    width: 86, height: 86, borderRadius: 43,
    backgroundColor: 'rgba(78,205,196,0.18)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 2, borderColor: 'rgba(78,205,196,0.4)',
  },
  avatar: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: '#4ECDC4',
    alignItems: 'center', justifyContent: 'center',
  },
  initials: { color: '#0D2137', fontSize: 26, fontWeight: '800' },
  name:     { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginBottom: 10 },

  /* dept */
  deptBadge: {
    backgroundColor: 'rgba(78,205,196,0.15)',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(78,205,196,0.3)',
    marginBottom: 10,
  },
  deptText: {
    color: '#4ECDC4', fontSize: 12, fontWeight: '600', textAlign: 'center',
  },

  /* programme + level row */
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  subChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  subChipText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  subDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});
