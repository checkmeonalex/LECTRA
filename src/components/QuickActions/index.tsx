import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ACTIONS = [
  { label: 'Academic Info', icon: 'school-outline',     color: '#6C63FF', bg: '#EEEEFF' },
  { label: 'My Courses',    icon: 'book-outline',       color: '#FF6B6B', bg: '#FFEEEE' },
  { label: 'Fee Status',    icon: 'card-outline',       color: '#00B894', bg: '#E6FAF5' },
  { label: 'Results',       icon: 'bar-chart-outline',  color: '#FFB347', bg: '#FFF4E5' },
  { label: 'Timetable',     icon: 'calendar-outline',   color: '#74B9FF', bg: '#EAF4FF' },
] as const;

export default function QuickActions() {
  const anims = useRef(ACTIONS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(70, anims.map(a =>
      Animated.spring(a, { toValue: 1, tension: 90, friction: 8, useNativeDriver: true })
    )).start();
  }, []);

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionLabel}>Quick Access</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {ACTIONS.map((action, i) => (
          <Animated.View key={action.label} style={{ opacity: anims[i], transform: [{ scale: anims[i] }] }}>
            <TouchableOpacity style={styles.pill} activeOpacity={0.75}>
              <View style={[styles.iconBox, { backgroundColor: action.bg }]}>
                <Ionicons name={action.icon} size={20} color={action.color} />
              </View>
              <Text style={styles.pillLabel}>{action.label}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 24, paddingBottom: 4 },
  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: '#718096',
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: 20, marginBottom: 14,
  },
  row: { paddingHorizontal: 16, gap: 10 },
  pill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14,
    gap: 8,
    shadowColor: '#000', shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
    elevation: 2,
  },
  iconBox: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  pillLabel: { fontSize: 13, fontWeight: '600', color: '#2D3748' },
});
