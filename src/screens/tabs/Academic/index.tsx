import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, StatusBar, TouchableOpacity, Animated, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { StudentData } from '@/services/portal';
import ClassCard from '@/components/ClassCard';
import { useAppTheme } from '@/context/AppThemeContext';

export default function AcademicScreen() {
  const [data, setData] = useState<StudentData | null>(null);
  const fade = useRef(new Animated.Value(0)).current;
  const { accent, accentSoft, onAccent, background, surface, text, textSecondary, isDark } = useAppTheme();

  useEffect(() => {
    AsyncStorage.getItem('student_data').then(raw => {
      if (raw) {
        setData(JSON.parse(raw));
        Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      }
    });
  }, []);

  if (!data) {
    return (
      <View style={[s.loader, { backgroundColor: background }]}>
        <ActivityIndicator size="large" color={accent} />
      </View>
    );
  }

  const findField = (...keys: string[]) =>
    data.fields?.find(f => keys.some(k => f.label.toLowerCase().includes(k)))?.value ?? '';

  const name        = data.courseInfo?.['NAME'] ?? findField('name') ?? 'Student';
  const department  = findField('department', 'dept');
  const courseCount = data.courses?.length ?? 0;
  const totalUnits  = data.totalUnits ?? 0;

  const rawStatus = data.homeStatus?.['Student status'] ??
    data.homeStatus?.['Status'] ??
    Object.values(data.homeStatus ?? {}).find(v => /active/i.test(v)) ?? '';
  const isActive = rawStatus.toUpperCase().includes('ACTIVE') &&
                   !rawStatus.toUpperCase().includes('INACTIVE');

  const session     = data.homeStatus?.['Current semester'] ?? data.homeStatus?.['Semester'] ?? '';
  const displayName = name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  const firstName   = displayName.split(' ')[0];
  const initials    = name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase();

  return (
    <View style={[s.root, { backgroundColor: background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={background} />

      <Animated.View style={{ flex: 1, opacity: fade }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

          {/* ── TOP NAV ── */}
          <View style={s.topNav}>
            <TouchableOpacity style={[s.backBtn, { backgroundColor: surface }]} onPress={() => router.back()} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={20} color={text} />
            </TouchableOpacity>
            <Text style={[s.pageTitle, { color: text }]}>Academic</Text>
            <TouchableOpacity style={[s.notifBtn, { backgroundColor: surface }]} activeOpacity={0.8}>
              <Ionicons name="notifications-outline" size={20} color={text} />
            </TouchableOpacity>
          </View>

          {/* ── PROFILE ROW ── */}
          <View style={s.profileRow}>
            <View style={s.avatar}>
              <Text style={[s.avatarText, { color: onAccent }]}>{initials}</Text>
            </View>
            <View style={s.profileInfo}>
              {!!session && <Text style={s.welcome}>{session}</Text>}
              <Text style={s.name}>{firstName}</Text>
              <Text style={s.dept} numberOfLines={1}>{department}</Text>
            </View>
          </View>

          {/* ── STAT CARDS ── */}
          <View style={s.cards}>
            {/* Courses */}
            <View style={[s.card, { backgroundColor: accent }]}>
              <View style={[s.cardIconWrap, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <Ionicons name="school" size={20} color="#fff" />
              </View>
              <Text style={[s.cardNum, { color: '#fff' }]}>{courseCount}</Text>
              <Text style={[s.cardLbl, { color: 'rgba(255,255,255,0.75)' }]}>Course</Text>
            </View>

            {/* Total Units */}
            <View style={[s.card, s.cardAmber]}>
              <View style={[s.cardIconWrap, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                <Ionicons name="layers" size={20} color="#fff" />
              </View>
              <Text style={[s.cardNum, { color: '#fff' }]}>{totalUnits}</Text>
              <Text style={[s.cardLbl, { color: 'rgba(255,255,255,0.8)' }]}>Credit Units</Text>
            </View>

            {/* Registered / Not Paid */}
            <View style={[s.card, s.cardWhite, { backgroundColor: surface }]}>
              <View style={[s.cardIconWrap, { backgroundColor: isActive ? accentSoft : '#FFF0F0' }]}>
                <Ionicons
                  name={isActive ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={isActive ? '#22C55E' : '#EF4444'}
                />
              </View>
              <Text style={[s.cardNum, { color: isActive ? '#22C55E' : '#EF4444' }]}>
                {isActive ? courseCount : '—'}
              </Text>
              <Text style={[s.cardLbl, { color: '#718096' }]}>
                {isActive ? 'Registered' : 'Not Paid'}
              </Text>
            </View>
          </View>

          {/* ── COURSES ── */}
          <View style={s.section}>
            <Text style={[s.sectionTitle, { color: text }]}>Registered Courses</Text>

            {courseCount > 0
              ? data.courses.map((course, i) => (
                  <ClassCard key={course.code} course={course} index={i} />
                ))
              : (
                <View style={s.empty}>
                  <Ionicons name="school-outline" size={40} color={accent} />
                  <Text style={s.emptyTitle}>No courses yet</Text>
                  <Text style={s.emptySub}>Your registered courses will appear here.</Text>
                </View>
              )
            }
            <View style={{ height: 24 }} />
          </View>

        </ScrollView>
      </Animated.View>

    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F7F8FA' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8FA' },
  scroll: { flexGrow: 1 },

  /* top nav */
  topNav: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 52 : 40,
    paddingHorizontal: 20, paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
  },
  pageTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: '#1A202C', letterSpacing: -0.2 },
  notifBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
  },

  /* profile */
  profileRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 16, paddingHorizontal: 20, marginBottom: 24,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#14B8A6',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  profileInfo: { flex: 1 },
  welcome: { fontSize: 13, color: '#A0AEC0', marginBottom: 2 },
  name:    { fontSize: 20, fontWeight: '800', color: '#1A202C', marginBottom: 2 },
  dept:    { fontSize: 13, color: '#718096' },

  /* cards */
  cards: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 20, marginBottom: 28,
  },
  card: {
    flex: 1, borderRadius: 20, padding: 14,
    alignItems: 'flex-start', gap: 8,
  },
  cardAmber: { backgroundColor: '#F59E0B' },
  cardWhite: {
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 }, shadowRadius: 8, elevation: 2,
  },
  cardIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  cardNum: { fontSize: 24, fontWeight: '900', lineHeight: 28 },
  cardLbl: { fontSize: 11, fontWeight: '600' },

  /* courses */
  section:      { flex: 1 },
  sectionTitle: {
    fontSize: 16, fontWeight: '800', color: '#1A202C',
    paddingHorizontal: 20, marginBottom: 12,
  },
  empty:      { alignItems: 'center', paddingTop: 48, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#4A5568' },
  emptySub:   { fontSize: 13, color: '#A0AEC0', textAlign: 'center' },
});
