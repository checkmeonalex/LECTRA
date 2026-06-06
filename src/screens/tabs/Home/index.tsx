import React, { useEffect, useRef, useState } from 'react';
import {
  View, StyleSheet, Animated,
  ActivityIndicator, StatusBar, RefreshControl, Text, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StudentData } from '@/services/portal';
import HomeHeader   from '@/components/HomeHeader';
import QuickActions from '@/components/QuickActions';
import WeekStrip    from '@/components/WeekStrip';
import ClassCard    from '@/components/ClassCard';
import BottomNav    from '@/components/BottomNav';
import StickyHeader  from '@/components/StickyHeader';
import NewsSection   from '@/components/NewsSection';

const HEADER_SCROLL_THRESHOLD = 140;

export default function HomeScreen() {
  const [data, setData]             = useState<StudentData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  async function load() {
    const raw = await AsyncStorage.getItem('student_data');
    if (raw) setData(JSON.parse(raw));
  }

  useEffect(() => { load(); }, []);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (!data) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4ECDC4" />
      </View>
    );
  }

  const findField = (...keywords: string[]) =>
    data.fields?.find(f => keywords.some(k => f.label.toLowerCase().includes(k)))?.value ?? '';

  const name       = data.courseInfo?.['NAME'] ?? findField('name') ?? 'Student';
  const department =
    findField('department', 'dept') ||
    (data.courseInfo?.['DEPARTMENT'] ?? data.courseInfo?.['DEPT'] ?? '');
  const matric =
    findField('matric') ||
    (data.courseInfo?.['MATRIC NO'] ?? data.courseInfo?.['MATRIC NUMBER'] ?? '');
  const rawStatus =
    data.homeStatus?.['Student status'] ??
    data.homeStatus?.['Status'] ??
    data.homeStatus?.['Payment status'] ??
    Object.values(data.homeStatus ?? {}).find(v => /active/i.test(v)) ??
    '';
  const programme = findField('programme', 'program');
  const level     = data.homeStatus?.['Current level'] ?? findField('level') ?? '';

  const displayName = name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  const initials    = name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase();

  const stickyOpacity = scrollY.interpolate({
    inputRange: [HEADER_SCROLL_THRESHOLD, HEADER_SCROLL_THRESHOLD + 40],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const stickyTranslate = scrollY.interpolate({
    inputRange: [HEADER_SCROLL_THRESHOLD, HEADER_SCROLL_THRESHOLD + 40],
    outputRange: [-24, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0D2137" />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4ECDC4" />
        }
      >
        <HomeHeader
          name={name}
          department={department}
          status={rawStatus}
          matric={matric}
          programme={programme}
          level={level}
        />

        <View style={styles.body}>
          <QuickActions />
          <WeekStrip />
          <TimetableEmptyState />

          <NewsSection />

          {/* ── Activities ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeading}>Activities</Text>
          </View>
          <ActivitiesEmptyState />

          <View style={{ height: 24 }} />
        </View>
      </Animated.ScrollView>

      <StickyHeader
        initials={initials}
        name={displayName}
        level={level}
        opacity={stickyOpacity}
        translateY={stickyTranslate}
      />

      <BottomNav active={0} />
    </View>
  );
}

function CalendarIllustration() {
  return (
    <View style={calStyles.outer}>
      {/* calendar body */}
      <View style={calStyles.cal}>
        {/* binding clips */}
        <View style={calStyles.clips}>
          <View style={calStyles.clip} />
          <View style={calStyles.clip} />
        </View>
        {/* purple header */}
        <View style={calStyles.calHeader} />
        {/* content rows */}
        <View style={calStyles.calBody}>
          <View style={calStyles.row}>
            {[1,1,1,0,0,0,0].map((f,i) => (
              <View key={i} style={[calStyles.cell, f && calStyles.cellFilled]} />
            ))}
          </View>
          <View style={calStyles.row}>
            {[0,0,1,1,0,0,0].map((f,i) => (
              <View key={i} style={[calStyles.cell, f && calStyles.cellFilled]} />
            ))}
          </View>
          <View style={calStyles.row}>
            {[0,0,0,0,0,0,0].map((f,i) => (
              <View key={i} style={[calStyles.cell]} />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const calStyles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cal: {
    width: 72,
    borderRadius: 14,
    backgroundColor: '#fff',
    overflow: 'visible',
    shadowColor: '#6C63FF',
    shadowOpacity: 0.13,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 6,
  },
  clips: {
    position: 'absolute',
    top: -6,
    left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    zIndex: 2,
  },
  clip: {
    width: 8, height: 12,
    borderRadius: 4,
    backgroundColor: '#4A4580',
  },
  calHeader: {
    backgroundColor: '#6C63FF',
    height: 22,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  calBody: {
    padding: 8,
    gap: 5,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
  },
  cell: {
    width: 7, height: 7,
    borderRadius: 2,
    backgroundColor: '#EEF0F5',
  },
  cellFilled: {
    backgroundColor: '#C4BFEA',
  },
});

function TimetableEmptyState() {
  return (
    <View style={emptyStyles.wrap}>
      <CalendarIllustration />
      <Text style={emptyStyles.title}>Your timetable is empty</Text>
      <Text style={emptyStyles.sub}>Add your weekly schedule and Lectra{'\n'}will show today's classes here.</Text>
      <TouchableOpacity style={emptyStyles.btn} activeOpacity={0.85}>
        <Text style={emptyStyles.btnText}>Set up timetable</Text>
        <Ionicons name="chevron-forward" size={14} color="#6C63FF" />
      </TouchableOpacity>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 28,
    paddingBottom: 4,
  },
  title: {
    fontSize: 15, fontWeight: '700',
    color: '#2D3748',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  sub: {
    fontSize: 13, color: '#A0AEC0',
    textAlign: 'center', lineHeight: 20,
    marginBottom: 18,
  },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: '#F3F0FF',
    borderWidth: 1, borderColor: '#D4CFFF',
  },
  btnText: {
    fontSize: 13, fontWeight: '600', color: '#6C63FF',
  },
});

function ActivitiesEmptyState() {
  return (
    <View style={actStyles.wrap}>
      <Ionicons name="bonfire-outline" size={32} color="#C4BFEA" />
      <Text style={actStyles.title}>All quiet here 👀</Text>
      <Text style={actStyles.sub}>No school activities right now.{'\n'}Check back when things get buzzing on campus!</Text>
    </View>
  );
}

const actStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    marginBottom: 8,
    gap: 5,
  },
  title: {
    fontSize: 14, fontWeight: '700',
    color: '#4A5568',
  },
  sub: {
    fontSize: 12, color: '#B0AEC0',
    textAlign: 'center', lineHeight: 19,
  },
});

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F0F4F8' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F4F8' },
  scroll: { flexGrow: 1 },
  body:   { flex: 1, backgroundColor: '#F0F4F8' },
  sectionHeader: {
    paddingHorizontal: 20, marginTop: 24, marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 16, fontWeight: '800', color: '#2D3748',
  },
  coursesHeading: {
    fontSize: 16, fontWeight: '800', color: '#2D3748',
    paddingHorizontal: 20, marginTop: 4, marginBottom: 10,
  },
  empty: {
    textAlign: 'center', color: '#A0AEC0',
    fontSize: 14, marginTop: 32,
  },
});
