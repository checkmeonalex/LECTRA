import React from 'react';
import { View, Text, StyleSheet, Animated, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  initials: string;
  name: string;
  level: string;
  opacity: Animated.AnimatedInterpolation<number>;
  translateY: Animated.AnimatedInterpolation<number>;
}

function getShortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts[1];          // last name
  return parts[1];                                  // middle name
}

export default function StickyHeader({ initials, name, level, opacity, translateY }: Props) {
  const shortName = getShortName(name);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.bar, { opacity, transform: [{ translateY }] }]}
    >
      <View style={styles.avatar}>
        <Text style={styles.initials}>{initials}</Text>
      </View>

      <View style={styles.textCol}>
        <Text style={styles.greeting}>Hello,</Text>
        <Text style={styles.name}>{shortName}</Text>
      </View>

      {!!level && (
        <View style={styles.badge}>
          <Text style={styles.badgeText} numberOfLines={1}>{level}</Text>
        </View>
      )}

      <View style={styles.iconBtn}>
        <Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.7)" />
      </View>
    </Animated.View>
  );
}

const STATUS_BAR_HEIGHT =
  Platform.OS === 'web'     ? 0 :
  Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) :
  44;

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    backgroundColor: '#0D2137',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: STATUS_BAR_HEIGHT + 10,
    paddingBottom: 12,
    paddingHorizontal: 20,
    gap: 12,
    zIndex: 100,
  },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#4ECDC4',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(78,205,196,0.4)',
  },
  initials:  { color: '#0D2137', fontSize: 14, fontWeight: '800' },
  textCol:   { flex: 1 },
  greeting:  { color: 'rgba(255,255,255,0.5)', fontSize: 11, lineHeight: 14 },
  name:      { color: '#FFFFFF', fontSize: 15, fontWeight: '700', lineHeight: 18 },
  badge: {
    backgroundColor: 'rgba(78,205,196,0.18)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(78,205,196,0.3)',
  },
  badgeText: { color: '#4ECDC4', fontSize: 11, fontWeight: '700' },
  iconBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
});
