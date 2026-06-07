import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppTheme } from '@/context/AppThemeContext';
import {
  useTimetable, DAY_KEYS, formatTime12, timeToMinutes,
  type DayKey, type TimetableSlot,
} from '@/context/TimetableContext';

// ─── helpers ──────────────────────────────────────────────────────────────

const WEEK_DAY_MAP: Record<number, DayKey> = {
  1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat',
};

function nowMins() { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
function isActive(s: TimetableSlot) {
  const n = nowMins();
  return n >= timeToMinutes(s.startTime) && n < timeToMinutes(s.endTime);
}
function todayKey(): DayKey | null { return WEEK_DAY_MAP[new Date().getDay()] ?? null; }

function buildWeekDates() {
  const today = new Date();
  const dow   = today.getDay();
  const mon   = new Date(today);
  mon.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  return DAY_KEYS.map((key, i) => {
    const d = new Date(mon); d.setDate(mon.getDate() + i);
    return { day: key, date: d.getDate() };
  });
}

// Stable face photo from pravatar — same seed always gives same face
function pravatarUrl(name: string) {
  const seed = encodeURIComponent(name.trim().toLowerCase());
  return `https://i.pravatar.cc/80?u=${seed}`;
}

// ─── ClassCard ────────────────────────────────────────────────────────────
//
//  Exact layout from reference image 2:
//
//  ╔═══════════════════════════════════════╗
//  ║  🕐            Social Studies        ║
//  ║  8:30 AM       B3, Room 124          ║
//  ║    :                                 ║
//  ║  10:00 AM  [JG]  Mrs. Goodman        ║
//  ╚═══════════════════════════════════════╝

function ClassCard({ slot, active }: { slot: TimetableSlot; active: boolean }) {
  const { surface, text, textSecondary, isDark } = useAppTheme();
  const normalBg = active ? '#B9FACA' : surface;
  const breakBg  = isDark ? '#111' : '#F8FAFC';

  if (slot.isBreak) {
    return (
      <View style={[C.card, { backgroundColor: breakBg }]}>
        <View style={C.left}>
          <Ionicons name="cafe-outline" size={14} color="#94A3B8" />
          <Text style={C.t1}>{formatTime12(slot.startTime)}</Text>
          <Text style={C.colon}>:</Text>
          <Text style={C.t2}>{formatTime12(slot.endTime)}</Text>
        </View>
        <View style={C.sep} />
        <View style={C.right}>
          <Text style={C.breakLbl}>Break</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[C.card, { backgroundColor: normalBg }]}>
      {/* ── LEFT: clock + times ── */}
      <View style={C.left}>
        <Ionicons name="time-outline" size={14} color={active ? '#15803D' : '#94A3B8'} />
        <Text style={[C.t1, active && C.tActive]}>{formatTime12(slot.startTime)}</Text>
        <Text style={[C.colon, active && C.colonActive]}>:</Text>
        <Text style={[C.t2, active && C.tActive]}>{formatTime12(slot.endTime)}</Text>
      </View>

      {/* ── SEPARATOR ── */}
      <View style={[C.sep, active && C.sepActive]} />

      {/* ── RIGHT: title / room / lecturer ── */}
      <View style={C.right}>
        <Text style={[C.title, { color: active ? '#14532D' : text }]} numberOfLines={2}>
          {slot.courseTitle}
        </Text>
        {!!slot.room && (
          <Text style={[C.room, { color: active ? '#166534' : textSecondary }]}>{slot.room}</Text>
        )}
        {!!slot.lecturer && (
          <View style={C.lecRow}>
            <Image
              source={{ uri: pravatarUrl(slot.lecturer) }}
              style={C.avatar}
            />
            <Text style={[C.lecName, { color: active ? '#166534' : textSecondary }]}>{slot.lecturer}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const C = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 18,
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.055,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    elevation: 3,
  },
  cardNormal: { backgroundColor: '#FFFFFF' },
  cardActive: { backgroundColor: '#B9FACA' },   // green card — matches reference
  cardBreak:  { backgroundColor: '#F8FAFC', shadowOpacity: 0.02 },

  // left column — fixed width, clock icon + start : end
  left: { width: 68, alignItems: 'center', gap: 2, paddingTop: 1 },
  t1:   { fontSize: 11, fontWeight: '600', color: '#94A3B8', textAlign: 'center' },
  t2:   { fontSize: 11, fontWeight: '500', color: '#B0BAC9', textAlign: 'center' },
  colon:{ fontSize: 11, color: '#CBD5E1', fontWeight: '400' },
  tActive:     { color: '#14532D', fontWeight: '700' },
  colonActive: { color: '#4ADE80' },

  // thin vertical separator
  sep:       { width: 1, alignSelf: 'stretch', backgroundColor: '#EEF2F6', borderRadius: 1 },
  sepActive: { backgroundColor: 'rgba(0,0,0,0.06)' },

  // right column — course info
  right:     { flex: 1, gap: 3, justifyContent: 'center' },
  title:     { fontSize: 15, fontWeight: '700', color: '#1A202C', lineHeight: 21 },
  titleActive: { color: '#14532D' },
  room:        { fontSize: 12, color: '#718096', fontWeight: '500' },
  roomActive:  { color: '#166534' },

  // lecturer row
  lecRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 7 },
  avatar:   { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E2E8F0' },
  lecName:  { fontSize: 12, fontWeight: '600', color: '#4A5568' },
  lecNameActive: { color: '#166534' },

  breakLbl: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
});

// ─── SCREEN ───────────────────────────────────────────────────────────────

export default function TimetableScreen() {
  const insets     = useSafeAreaInsets();
  const { accent, accentSoft, background, surface, text, textSecondary, isDark } = useAppTheme();
  const { slots, loaded }      = useTimetable();

  const weekDates = buildWeekDates();
  const tKey      = todayKey();
  const [selectedDay, setSelectedDay] = useState<DayKey>(tKey ?? 'Mon');
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const daySlots = slots.filter(s => s.day === selectedDay);
  const isToday  = selectedDay === tKey;
  const now      = nowMins();
  const hasAny   = slots.length > 0;

  let nowIdx = -1;
  if (isToday) {
    nowIdx = daySlots.findIndex(s => isActive(s));
    if (nowIdx === -1)
      nowIdx = daySlots.findIndex(s => timeToMinutes(s.startTime) > now);
  }

  if (!loaded) return <View style={[S.root, { backgroundColor: background, paddingTop: insets.top }]} />;

  // ── Empty ─────────────────────────────────────────────────────────────────
  if (!hasAny) {
    return (
      <View style={[S.root, { backgroundColor: background, paddingTop: insets.top }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={S.emptyHead}>
          <Text style={[S.pageTitle, { color: text }]}>My Schedule</Text>
          <TouchableOpacity style={[S.iconBtn, { backgroundColor: surface }]} activeOpacity={0.8}>
            <Ionicons name="calendar-outline" size={20} color={text} />
          </TouchableOpacity>
        </View>
        <View style={S.emptyBody}>
          <View style={[S.emptyCircle, { backgroundColor: accentSoft }]}>
            <Ionicons name="calendar-outline" size={48} color={accent} />
          </View>
          <Text style={[S.emptyTitle, { color: text }]}>Your Timetable Is Empty</Text>
          <Text style={[S.emptySub, { color: textSecondary }]}>Build Your Weekly Schedule{'\n'}And It'll Live Here.</Text>
          <TouchableOpacity
            style={[S.setupBtn, { backgroundColor: accent }]}
            onPress={() => router.push('/setup-timetable')}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={S.setupBtnTxt}>Set Up Timetable</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[S.root, { backgroundColor: background, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[0]}>

        {/* ══ STICKY HEADER ══════════════════════════════════════════════ */}
        <View style={[S.header, { backgroundColor: background }]}>

          {/* Title + edit button */}
          <View style={S.titleRow}>
            <Text style={[S.pageTitle, { color: text }]}>My Schedule</Text>
            <TouchableOpacity
              style={[S.iconBtn, { backgroundColor: surface }]}
              onPress={() => router.push('/setup-timetable')}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-outline" size={20} color={text} />
            </TouchableOpacity>
          </View>

          {/* ── WEEK STRIP ─────────────────────────────────────────────── */}
          {/* Wrap in a fixed-height View so cells never stretch */}
          <View style={S.stripWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={S.stripContent}
              alwaysBounceHorizontal={false}
            >
              {weekDates.map(({ day, date }) => {
                const sel = day === selectedDay;
                const isT = day === tKey;
                return (
                  <TouchableOpacity
                    key={day}
                    style={[S.dayCell, { backgroundColor: sel ? accent : surface }, sel && { backgroundColor: accent }]}
                    onPress={() => setSelectedDay(day)}
                    activeOpacity={0.75}
                  >
                    {/* day label e.g. "Mon" */}
                    <Text style={[S.dayLbl, { color: sel ? 'rgba(255,255,255,0.75)' : (isT ? accent : textSecondary) }]}>
                      {day}
                    </Text>
                    {/* date number */}
                    <Text style={[S.dateNum, { color: sel ? '#fff' : (isT ? accent : text) }]}>
                      {date}
                    </Text>
                    {/* today dot when not selected */}
                    {isT && !sel && <View style={[S.todayDot, { backgroundColor: accent }]} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

        </View>
        {/* ══ END STICKY HEADER ═══════════════════════════════════════════ */}

        {/* ── SLOT LIST ── */}
        <View style={S.list}>
          {daySlots.length === 0 ? (
            <View style={S.noClass}>
              <Ionicons name="moon-outline" size={44} color="#CBD5E1" />
              <Text style={[S.noClassTxt, { color: textSecondary }]}>No classes on {selectedDay}</Text>
              <TouchableOpacity
                style={[S.addBtn, { borderColor: accent }]}
                onPress={() => router.push('/setup-timetable')}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={16} color={accent} />
                <Text style={[S.addBtnTxt, { color: accent }]}>Add classes</Text>
              </TouchableOpacity>
            </View>
          ) : (
            daySlots.map((slot, i) => (
              <React.Fragment key={slot.id}>
                {/* "Now" divider line */}
                {isToday && i === nowIdx && (
                  <View style={S.nowRow}>
                    <View style={[S.nowLine, { backgroundColor: accent }]} />
                    <Text style={[S.nowTxt, { color: accent }]}>Now</Text>
                    <View style={[S.nowLine, { backgroundColor: accent }]} />
                  </View>
                )}
                <ClassCard slot={slot} active={isToday && isActive(slot)} />
              </React.Fragment>
            ))
          )}

          {daySlots.length > 0 && (
            <TouchableOpacity
              style={[S.editRow, { borderColor: accent + '55' }]}
              onPress={() => router.push('/setup-timetable')}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={15} color={accent} />
              <Text style={[S.editTxt, { color: accent }]}>Edit timetable</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: insets.bottom + 32 }} />
        </View>

      </ScrollView>
    </View>
  );
}

// ─── styles ────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F8FA' },

  // ── empty state
  emptyHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
  },
  emptyBody:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  emptyCircle: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle:  { fontSize: 18, fontWeight: '800', color: '#2D3748' },
  emptySub:    { fontSize: 14, color: '#A0AEC0', textAlign: 'center', lineHeight: 22 },
  setupBtn:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 28, shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 6 },
  setupBtnTxt: { fontSize: 15, fontWeight: '800', color: '#fff' },

  // ── sticky header
  header: {
    backgroundColor: '#F7F8FA',
    paddingTop: 12,
    paddingBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2,
  },
  titleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 16,
  },
  pageTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.4 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
  },

  // ── week strip
  // Fixed-height wrapper prevents the horizontal ScrollView from stretching
  stripWrap: { height: 90, justifyContent: 'center' },
  stripContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    height: 90,           // same as wrapper — cells never stretch vertically
  },
  dayCell: {
    width: 48,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 }, shadowRadius: 4, elevation: 1,
  },
  dayLbl:      { fontSize: 11, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.3 },
  dayLblSel:   { color: 'rgba(255,255,255,0.75)' },
  dateNum:     { fontSize: 20, fontWeight: '900', marginTop: 3 },
  dateNumSel:  { color: '#FFFFFF' },
  todayDot:    { width: 5, height: 5, borderRadius: 3, marginTop: 4 },

  // ── slot list
  list: { paddingHorizontal: 16, paddingTop: 20 },

  // "Now" separator ─── Now ───
  nowRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  nowLine: { flex: 1, height: 1.5, borderRadius: 1 },
  nowTxt:  { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  // no class
  noClass:    { alignItems: 'center', paddingTop: 60, gap: 12 },
  noClassTxt: { fontSize: 15, fontWeight: '700', color: '#4A5568' },
  addBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5 },
  addBtnTxt:  { fontSize: 13, fontWeight: '700' },

  // edit CTA at bottom
  editRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6, paddingVertical: 14, borderRadius: 16, borderWidth: 1.5 },
  editTxt: { fontSize: 13, fontWeight: '700' },
});
