import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, StatusBar, TouchableOpacity, Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import type { StudentData } from '@/services/portal';
import ClassCard from '@/components/ClassCard';
import BottomNav from '@/components/BottomNav';

export default function AcademicScreen() {
  const [data, setData] = useState<StudentData | null>(null);
  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    AsyncStorage.getItem('student_data').then(raw => {
      if (raw) {
        setData(JSON.parse(raw));
        Animated.parallel([
          Animated.timing(fade,  { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(slide, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]).start();
      }
    });
  }, []);

  if (!data) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  const findField = (...keys: string[]) =>
    data.fields?.find(f => keys.some(k => f.label.toLowerCase().includes(k)))?.value ?? '';

  const name       = data.courseInfo?.['NAME'] ?? findField('name') ?? 'Student';
  const department = findField('department', 'dept');
  const level      = data.homeStatus?.['Current level'] ?? findField('level') ?? '';
  const programme  = findField('programme', 'program');
  const matric     = findField('matric');

  const rawStatus  = data.homeStatus?.['Student status'] ??
    data.homeStatus?.['Status'] ??
    Object.values(data.homeStatus ?? {}).find(v => /active/i.test(v)) ?? '';
  const isActive   = rawStatus.toUpperCase().includes('ACTIVE') &&
                     !rawStatus.toUpperCase().includes('INACTIVE');

  const courseCount = data.courses?.length ?? 0;
  const totalUnits  = data.totalUnits ?? 0;

  const displayName = name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  const initials    = name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase();
  const firstName   = displayName.split(' ')[0];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1060" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── HEADER ── */}
        <Animated.View style={[styles.header, { opacity: fade, transform: [{ translateY: slide }] }]}>
          {/* decorative circles */}
          <View style={styles.dec1} />
          <View style={styles.dec2} />

          {/* top row */}
          <View style={styles.topRow}>
            <View style={styles.levelPill}>
              <Text style={styles.levelText}>{level || 'Academic'}</Text>
              {!!programme && <Text style={styles.levelSub}> · {programme}</Text>}
            </View>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* profile row */}
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.profileText}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.nameText}>{firstName}</Text>
              <Text style={styles.deptText} numberOfLines={1}>{department || matric}</Text>
            </View>
          </View>

          {/* ── STAT CARDS ── */}
          <View style={styles.cards}>
            {/* Courses */}
            <View style={[styles.card, styles.cardDark]}>
              <View style={[styles.cardIcon, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <Ionicons name="book" size={18} color="#fff" />
              </View>
              <Text style={styles.cardNum}>{courseCount}</Text>
              <Text style={styles.cardLabel}>Courses</Text>
            </View>

            {/* Total Units */}
            <View style={[styles.card, styles.cardAmber]}>
              <View style={[styles.cardIcon, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                <Ionicons name="layers" size={18} color="#fff" />
              </View>
              <Text style={[styles.cardNum, { color: '#fff' }]}>{totalUnits}</Text>
              <Text style={[styles.cardLabel, { color: 'rgba(255,255,255,0.85)' }]}>Total Units</Text>
            </View>

            {/* Registered / Unregistered */}
            <View style={[styles.card, styles.cardLight]}>
              <View style={[styles.cardIcon, { backgroundColor: isActive ? '#EEF9F0' : '#FFF0F0' }]}>
                <Ionicons
                  name={isActive ? 'checkmark-circle' : 'close-circle'}
                  size={18}
                  color={isActive ? '#22C55E' : '#EF4444'}
                />
              </View>
              <Text style={[styles.cardNum, { color: isActive ? '#22C55E' : '#EF4444' }]}>
                {isActive ? courseCount : '—'}
              </Text>
              <Text style={[styles.cardLabel, { color: '#718096' }]}>
                {isActive ? 'Registered' : 'Not Paid'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── COURSE LIST ── */}
        <View style={styles.listWrap}>
          <Text style={styles.listHeading}>Registered Courses</Text>

          {courseCount > 0
            ? data.courses.map((course, i) => (
                <ClassCard key={course.code} course={course} index={i} />
              ))
            : (
              <View style={styles.emptyWrap}>
                <Ionicons name="school-outline" size={40} color="#C4BFEA" />
                <Text style={styles.emptyTitle}>No courses yet</Text>
                <Text style={styles.emptySub}>Your registered courses will appear here.</Text>
              </View>
            )
          }
          <View style={{ height: 24 }} />
        </View>
      </ScrollView>

      <BottomNav active={1} />
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F0F4F8' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F4F8' },
  scroll: { flexGrow: 1 },

  /* header */
  header: {
    backgroundColor: '#1A1060',
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 0,
    overflow: 'hidden',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  dec1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(108,99,255,0.18)', top: -60, right: -40,
  },
  dec2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(78,205,196,0.1)', bottom: 20, left: -30,
  },

  topRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 20,
  },
  levelPill: { flexDirection: 'row', alignItems: 'center' },
  levelText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  levelSub:  { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },

  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 28 },
  avatar: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: '#6C63FF',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarText:   { color: '#fff', fontSize: 18, fontWeight: '800' },
  profileText:  { flex: 1 },
  welcomeText:  { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 2 },
  nameText:     { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 2 },
  deptText:     { color: 'rgba(255,255,255,0.45)', fontSize: 12 },

  /* stat cards */
  cards: {
    flexDirection: 'row', gap: 10,
    marginBottom: -28,
    paddingBottom: 28,
  },
  card: {
    flex: 1, borderRadius: 20, padding: 14,
    alignItems: 'flex-start', gap: 6,
  },
  cardDark:  { backgroundColor: '#2D2480' },
  cardAmber: { backgroundColor: '#F59E0B' },
  cardLight: {
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 3,
  },
  cardIcon: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  cardNum:   { fontSize: 22, fontWeight: '900', color: '#fff', lineHeight: 26 },
  cardLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },

  /* list */
  listWrap:    { paddingTop: 44, flex: 1 },
  listHeading: {
    fontSize: 16, fontWeight: '800', color: '#2D3748',
    paddingHorizontal: 20, marginBottom: 12,
  },
  emptyWrap: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 32, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#4A5568' },
  emptySub:   { fontSize: 13, color: '#A0AEC0', textAlign: 'center', lineHeight: 20 },
});
