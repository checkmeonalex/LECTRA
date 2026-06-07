import React, { useEffect, useRef, useState } from 'react';
import {
  View, StyleSheet, Animated, Image,
  ActivityIndicator, StatusBar, RefreshControl, Text, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StudentData } from '@/services/portal';
import HomeHeader   from '@/components/HomeHeader';
import QuickActions from '@/components/QuickActions';
import WeekStrip    from '@/components/WeekStrip';
import StickyHeader from '@/components/StickyHeader';
import NewsSection  from '@/components/NewsSection';
import { useAppTheme } from '@/context/AppThemeContext';
import { useTimetable, formatTime12, type DayKey } from '@/context/TimetableContext';

const HEADER_SCROLL_THRESHOLD = 140;

const DAY_SHORT: Record<number, DayKey> = { 0:'Mon', 1:'Tue', 2:'Wed', 3:'Thu', 4:'Fri', 5:'Sat' };
const WEEK_DAYS: DayKey[] = ['Mon','Tue','Wed','Thu','Fri','Sat'];

function pravatarUrl(name: string) {
  return `https://i.pravatar.cc/80?u=${encodeURIComponent(name.trim().toLowerCase())}`;
}

export default function HomeScreen() {
  const [data, setData]             = useState<StudentData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // WeekStrip: 0=Sun,1=Mon...6=Sat → WEEK_DAYS: 0=Mon...5=Sat, Sun=null(6)
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(() => {
    const dow = new Date().getDay();
    return dow === 0 ? 6 : dow - 1; // Sun→6(null), Mon→0, Tue→1...
  });
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const { accent, accentSoft, background, surface, text, textSecondary, isDark } = useAppTheme();
  const { slots, loaded } = useTimetable();

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
      <View style={[styles.loader, { backgroundColor: background }]}>
        <ActivityIndicator size="large" color={accent} />
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
    <View style={[styles.root, { backgroundColor: background, paddingTop: insets.top }]}>
      <LinearGradient
        colors={isDark ? ['#000000', '#000000', '#000000'] : [accentSoft, background, '#EEFDF8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { backgroundColor: 'transparent' }]}
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

        <View style={[styles.body, { backgroundColor: background }]}>
          <QuickActions />
          <WeekStrip onSelect={i => setSelectedDayIdx(i === 0 ? 6 : i - 1)} />

          <TimetableSection
            slots={slots}
            loaded={loaded}
            selectedDayKey={selectedDayIdx < 6 ? WEEK_DAYS[selectedDayIdx] : null}
            accent={accent}
            accentSoft={accentSoft}
            surface={surface}
            isDark={isDark}
          />

          {/* ── Activities ── */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionHeading, { color: text }]}>Activities</Text>
          </View>

          <ActivitiesEmptyState />

          <NewsSection />

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

    </View>
  );
}

function CalendarIllustration({ accent }: { accent: string }) {
  return (
    <View style={calStyles.outer}>
      {/* calendar body */}
      <View style={calStyles.cal}>
        {/* binding clips */}
        <View style={calStyles.clips}>
          <View style={calStyles.clip} />
          <View style={calStyles.clip} />
        </View>
        {/* themed header */}
        <View style={[calStyles.calHeader, { backgroundColor: accent }]} />
        {/* content rows */}
        <View style={calStyles.calBody}>
          <View style={calStyles.row}>
            {[1,1,1,0,0,0,0].map((f,i) => (
              <View key={i} style={[calStyles.cell, f ? calStyles.cellFilled : null]} />
            ))}
          </View>
          <View style={calStyles.row}>
            {[0,0,1,1,0,0,0].map((f,i) => (
              <View key={i} style={[calStyles.cell, f ? calStyles.cellFilled : null]} />
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
    shadowColor: '#14B8A6',
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
    backgroundColor: '#355C7D',
  },
  calHeader: {
    backgroundColor: '#14B8A6',
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

const SLOT_COLOURS = [
  '#14B8A6','#3B82F6','#F59E0B','#EC4899','#22C55E',
  '#EF4444','#8B5CF6','#F97316','#06B6D4','#84CC16',
];

function TimetableSection({ slots, loaded, selectedDayKey, accent, accentSoft, surface, isDark }: {
  slots: ReturnType<typeof useTimetable>['slots'];
  loaded: boolean;
  selectedDayKey: DayKey | null;
  accent: string;
  accentSoft: string;
  surface: string;
  isDark: boolean;
}) {
  const { text, textSecondary } = useAppTheme();

  if (!loaded) return null;

  // No slots at all → empty state
  if (slots.length === 0) {
    return (
      <View style={tsStyles.wrap}>
        <CalendarIllustration accent={accent} />
        <Text style={[tsStyles.emptyTitle, { color: text }]}>Your Timetable Is Empty</Text>
        <Text style={[tsStyles.emptySub, { color: textSecondary }]}>Add Your Weekly Schedule And Lectra{'\n'}Will Show Today's Classes Here.</Text>
        <TouchableOpacity
          style={[tsStyles.emptyBtn, { backgroundColor: accentSoft }]}
          activeOpacity={0.85}
          onPress={() => router.push('/setup-timetable')}
        >
          <Text style={[tsStyles.emptyBtnTxt, { color: accent }]}>Set Up Timetable</Text>
          <Ionicons name="chevron-forward" size={14} color={accent} />
        </TouchableOpacity>
      </View>
    );
  }

  // Sunday or no matching day key
  const daySlots = selectedDayKey ? slots.filter(s => s.day === selectedDayKey) : [];

  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  function colorFor(code: string, idx: number) {
    return SLOT_COLOURS[idx % SLOT_COLOURS.length];
  }

  function isActive(startTime: string, endTime: string) {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const s = sh * 60 + sm, e = eh * 60 + em;
    return nowMins >= s && nowMins < e;
  }

  return (
    <View style={tsStyles.wrap}>
      <View style={tsStyles.sectionHeader}>
        <Text style={[tsStyles.sectionTitle, { color: text }]}>
          {selectedDayKey ? `${selectedDayKey}'s Classes` : 'No classes on Sunday'}
        </Text>
        <TouchableOpacity onPress={() => router.push('/setup-timetable')} activeOpacity={0.8}>
          <Text style={[tsStyles.editLink, { color: accent }]}>Edit</Text>
        </TouchableOpacity>
      </View>

      {daySlots.length === 0 ? (
        <View style={tsStyles.noClassWrap}>
          <Ionicons name="sunny-outline" size={28} color="#CBD5E1" />
          <Text style={[tsStyles.noClassTxt, { color: textSecondary }]}>No classes scheduled</Text>
        </View>
      ) : (
        daySlots.map((slot, idx) => {
          const active = isActive(slot.startTime, slot.endTime);
          const color  = slot.isBreak ? '#94A3B8' : colorFor(slot.courseCode, idx);
          return (
            <View key={slot.id} style={[tsStyles.card, { backgroundColor: active ? '#DCFCE7' : surface }, active && tsStyles.cardActive]}>
              <View style={[tsStyles.colorBar, { backgroundColor: color }]} />
              <View style={tsStyles.timeCol}>
                <Text style={[tsStyles.timeText, active && tsStyles.timeTextActive]}>
                  {formatTime12(slot.startTime)}
                </Text>
                <Text style={[tsStyles.timeSep, active && { color: '#16A34A' }]}>–</Text>
                <Text style={[tsStyles.timeText, active && tsStyles.timeTextActive]}>
                  {formatTime12(slot.endTime)}
                </Text>
              </View>
              <View style={tsStyles.cardInfo}>
                {!slot.isBreak && (
                  <Text style={[tsStyles.cardCode, { color }]}>{slot.courseCode}</Text>
                )}
                <Text style={[tsStyles.cardTitle, { color: active ? '#14532D' : text }]} numberOfLines={1}>
                  {slot.isBreak ? 'Break' : slot.courseTitle}
                </Text>
                {!!slot.room && !slot.isBreak && (
                  <Text style={[tsStyles.cardSub, { color: active ? '#166534' : textSecondary }]}>{slot.room}</Text>
                )}
                {!!slot.lecturer && !slot.isBreak && (
                  <View style={tsStyles.lecRow}>
                    <Image source={{ uri: pravatarUrl(slot.lecturer) }} style={tsStyles.avatar} />
                    <Text style={[tsStyles.lecName, { color: active ? '#166534' : textSecondary }]}>{slot.lecturer}</Text>
                  </View>
                )}
              </View>
              {active && (
                <View style={tsStyles.nowBadge}>
                  <Text style={tsStyles.nowTxt}>NOW</Text>
                </View>
              )}
            </View>
          );
        })
      )}
    </View>
  );
}

const tsStyles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  editLink:     { fontSize: 13, fontWeight: '600' },

  card: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16,
    marginBottom: 10, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2,
  },
  cardActive: { backgroundColor: '#DCFCE7' },
  colorBar:   { width: 4, alignSelf: 'stretch' },
  timeCol: {
    width: 70, alignItems: 'center', paddingVertical: 14, gap: 1,
  },
  timeText:        { fontSize: 10, fontWeight: '600', color: '#94A3B8' },
  timeTextActive:  { color: '#16A34A' },
  timeSep:         { fontSize: 10, color: '#CBD5E1' },
  cardInfo:        { flex: 1, paddingVertical: 12, paddingRight: 12, gap: 2 },
  cardCode:        { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  cardTitle:       { fontSize: 13, fontWeight: '700' },
  cardTitleActive: { color: '#14532D' },
  cardSub:         { fontSize: 11 },
  lecRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  avatar:  { width: 22, height: 22, borderRadius: 11, backgroundColor: '#E2E8F0' },
  lecName: { fontSize: 11, fontWeight: '600' },
  nowBadge: {
    marginRight: 12, paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: '#16A34A', borderRadius: 8,
  },
  nowTxt: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  noClassWrap: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  noClassTxt:  { fontSize: 13, color: '#A0AEC0' },

  emptyTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6, letterSpacing: -0.2, textAlign: 'center' },
  emptySub:   { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 18 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 22,
    alignSelf: 'center',
  },
  emptyBtnTxt: { fontSize: 13, fontWeight: '600' },
});

function ActivitiesEmptyState() {
  const { text, textSecondary } = useAppTheme();
  return (
    <View style={actStyles.wrap}>
      <Ionicons name="bonfire-outline" size={32} color="#C4BFEA" />
      <Text style={[actStyles.title, { color: text }]}>All quiet here 👀</Text>
      <Text style={[actStyles.sub, { color: textSecondary }]}>No school activities right now.{'\n'}Check back when things get buzzing on campus!</Text>
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
  root:   { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flexGrow: 1 },
  body:   { flex: 1 },
  sectionHeader: {
    paddingHorizontal: 20, marginTop: 24, marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 16, fontWeight: '800',
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
