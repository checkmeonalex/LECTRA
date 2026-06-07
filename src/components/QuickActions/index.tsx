import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppTheme } from '@/context/AppThemeContext';

export default function QuickActions() {
  const { accent, accentSoft, surface, text, isDark } = useAppTheme();
  const ACTIONS = [
    { label: 'Academic Info', icon: 'school-outline',    color: accent,     bg: accentSoft, route: '/(tabs)/profile' },
    { label: 'My Courses',    icon: 'book-outline',      color: '#FF6B6B', bg: '#FFEEEE', route: '/academic' },
    { label: 'Fee Status',    icon: 'card-outline',      color: '#00B894', bg: '#E6FAF5', route: null        },
    { label: 'Results',       icon: 'bar-chart-outline', color: '#FFB347', bg: '#FFF4E5', route: null        },
    { label: 'Timetable',     icon: 'calendar-outline',  color: '#74B9FF', bg: '#EAF4FF', route: '/setup-timetable' },
  ];
  const anims = useRef(ACTIONS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(70, anims.map(a =>
      Animated.spring(a, { toValue: 1, tension: 90, friction: 8, useNativeDriver: true })
    )).start();
  }, []);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.sectionLabel, { color: isDark ? '#64748B' : '#718096' }]}>Quick Access</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {ACTIONS.map((action, i) => (
          <Animated.View key={action.label} style={{ opacity: anims[i], transform: [{ scale: anims[i] }] }}>
            <TouchableOpacity
              style={[styles.pill, { backgroundColor: surface }]}
              activeOpacity={0.75}
              onPress={() => action.route && router.push(action.route as never)}
            >
              <View style={[styles.iconBox, { backgroundColor: action.bg }]}>
                <Ionicons name={action.icon as any} size={20} color={action.color} />
              </View>
              <Text style={[styles.pillLabel, { color: text }]}>{action.label}</Text>
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
    fontSize: 13, fontWeight: '700',
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
