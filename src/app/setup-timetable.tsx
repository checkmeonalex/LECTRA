import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Platform, StatusBar, Alert, Modal,
  FlatList, KeyboardAvoidingView, Animated, Image, PanResponder,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppTheme } from '@/context/AppThemeContext';
import {
  useTimetable, DAY_KEYS, timeToMinutes, formatTime12,
  type DayKey, type TimetableSlot,
} from '@/context/TimetableContext';
import type { Course, StudentData } from '@/services/portal';

// ─── constants ────────────────────────────────────────────────────────────

const COLOURS = [
  '#14B8A6','#3B82F6','#F59E0B','#EC4899','#22C55E',
  '#EF4444','#8B5CF6','#F97316','#06B6D4','#84CC16',
];

const DAY_FULL: Record<DayKey, string> = {
  Mon:'Monday', Tue:'Tuesday', Wed:'Wednesday',
  Thu:'Thursday', Fri:'Friday', Sat:'Saturday',
};

// ─── utils ────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function toDate(t: string): Date {
  const [h, m] = t.split(':').map(Number);
  const d = new Date(); d.setHours(h, m, 0, 0); return d;
}
function fromDate(d: Date): string {
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
function addHour(t: string): string {
  const [h, m] = t.split(':').map(Number);
  return `${String(clamp(h + 1, 6, 21)).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

// ─── SlotCard (saved slot row in list) ────────────────────────────────────

function pravatarUrl(name: string) {
  return `https://i.pravatar.cc/80?u=${encodeURIComponent(name.trim().toLowerCase())}`;
}

const SWIPE_THRESHOLD = 55;
const EDIT_WIDTH      = 80; // single Edit button revealed on swipe-left

function SlotCard({ slot, color, cardBg, textColor, onRemove, onEdit }: {
  slot: TimetableSlot; color: string; cardBg: string; textColor: string; onRemove: () => void; onEdit: () => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen     = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        const base = isOpen.current ? -EDIT_WIDTH : 0;
        translateX.setValue(Math.min(0, Math.max(-EDIT_WIDTH, base + g.dx)));
      },
      onPanResponderRelease: (_, g) => {
        const base = isOpen.current ? -EDIT_WIDTH : 0;
        const dx   = base + g.dx;
        if (dx < -SWIPE_THRESHOLD) {
          Animated.spring(translateX, { toValue: -EDIT_WIDTH, useNativeDriver: true, tension: 80, friction: 12 }).start();
          isOpen.current = true;
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }).start();
          isOpen.current = false;
        }
      },
    })
  ).current;

  function closeRow() {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }).start();
    isOpen.current = false;
  }

  function handleEdit() {
    closeRow();
    setTimeout(onEdit, 180);
  }

  return (
    <View style={sc.wrap}>
      {/* ── Edit button revealed on swipe-left ── */}
      <View style={sc.actions}>
        <TouchableOpacity style={sc.editBtn} onPress={handleEdit} activeOpacity={0.8}>
          <Ionicons name="create-outline" size={22} color="#fff" />
          <Text style={sc.actionTxt}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* ── Swipeable card ── */}
      <Animated.View style={[sc.card, { backgroundColor: cardBg, transform: [{ translateX }] }]} {...panResponder.panHandlers}>
        {/* left: time */}
        <View style={sc.timeCol}>
          <Ionicons name={slot.isBreak ? 'cafe-outline' : 'time-outline'} size={13} color="#94A3B8" />
          <Text style={sc.t1}>{formatTime12(slot.startTime)}</Text>
          <Text style={sc.colon}>:</Text>
          <Text style={sc.t2}>{formatTime12(slot.endTime)}</Text>
        </View>

        {/* separator */}
        <View style={[sc.sep, { backgroundColor: color + '50' }]} />

        {/* right: info */}
        <View style={sc.info}>
          {!slot.isBreak && (
            <Text style={[sc.code, { color }]}>{slot.courseCode}</Text>
          )}
          <Text style={[sc.title, { color: textColor }]} numberOfLines={1}>
            {slot.isBreak ? 'Break Period' : slot.courseTitle}
          </Text>
          {!!slot.room && !slot.isBreak && <Text style={sc.sub}>{slot.room}</Text>}
          {!!slot.lecturer && !slot.isBreak && (
            <View style={sc.lecRow}>
              <Image source={{ uri: pravatarUrl(slot.lecturer) }} style={sc.avatar} />
              <Text style={[sc.lecName, { color: textColor }]}>{slot.lecturer}</Text>
            </View>
          )}
        </View>

        {/* trash icon — always visible on card face */}
        <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={18} color="#CBD5E1" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const sc = StyleSheet.create({
  wrap: { marginBottom: 10, borderRadius: 16, overflow: 'hidden' },

  // revealed action button
  actions: {
    position: 'absolute', right: 0, top: 0, bottom: 0,
    width: EDIT_WIDTH,
  },
  editBtn: {
    flex: 1, backgroundColor: '#3B82F6',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  actionTxt: { fontSize: 11, fontWeight: '700', color: '#fff' },

  // the swipeable card itself
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 14,
    shadowColor: '#000', shadowOpacity: 0.055,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 3,
  },
  timeCol: { width: 64, alignItems: 'center', gap: 2 },
  t1:    { fontSize: 10, fontWeight: '600', color: '#94A3B8', textAlign: 'center' },
  t2:    { fontSize: 10, fontWeight: '500', color: '#B0BAC9', textAlign: 'center' },
  colon: { fontSize: 10, color: '#CBD5E1' },
  sep:   { width: 1, alignSelf: 'stretch', borderRadius: 1 },
  info:  { flex: 1, gap: 2 },
  code:  { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  title: { fontSize: 13, fontWeight: '700' },
  sub:   { fontSize: 11, color: '#94A3B8' },
  lecRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 },
  avatar:   { width: 26, height: 26, borderRadius: 13, backgroundColor: '#E2E8F0' },
  lecName:  { fontSize: 11, fontWeight: '600' },
});

// ─── MAIN ─────────────────────────────────────────────────────────────────

export default function SetupTimetableScreen() {
  const insets = useSafeAreaInsets();
  const { accent, accentSoft, surface, background, text, textSecondary, border, isDark } = useAppTheme();
  const { slots, addSlot, removeSlot, updateSlot } = useTimetable();

  const [courses, setCourses]         = useState<Course[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayKey>('Mon');
  const [showForm, setShowForm]       = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);

  // form fields
  const [isBreak,      setIsBreak]      = useState(false);
  const [pickedCourse, setPicked]       = useState<Course | null>(null);
  const [room,         setRoom]         = useState('');
  const [lecturer,     setLecturer]     = useState('');
  const [startTime,    setStartTime]    = useState('08:00');
  const [endTime,      setEndTime]      = useState('09:00');
  const [showStart,    setShowStart]    = useState(false);
  const [showEnd,      setShowEnd]      = useState(false);
  const [showCourses,  setShowCourses]  = useState(false);

  const slideAnim = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    AsyncStorage.getItem('student_data').then(raw => {
      if (raw) setCourses((JSON.parse(raw) as StudentData).courses ?? []);
    });
  }, []);

  function openForm() {
    const daySlots = slots.filter(s => s.day === selectedDay);
    const last = daySlots[daySlots.length - 1];
    setEditingSlot(null);
    setIsBreak(false); setPicked(null); setRoom(''); setLecturer('');
    setStartTime(last ? last.endTime : '08:00');
    setEndTime(last ? addHour(last.endTime) : '09:00');
    setShowForm(true);
    Animated.spring(slideAnim, { toValue:0, useNativeDriver:true, tension:68, friction:11 }).start();
  }

  function openEdit(slot: TimetableSlot) {
    setEditingSlot(slot);
    setIsBreak(!!slot.isBreak);
    setPicked(courses.find(c => c.code === slot.courseCode) ?? null);
    setRoom(slot.room ?? '');
    setLecturer(slot.lecturer ?? '');
    setStartTime(slot.startTime);
    setEndTime(slot.endTime);
    setShowForm(true);
    Animated.spring(slideAnim, { toValue:0, useNativeDriver:true, tension:68, friction:11 }).start();
  }

  function closeForm() {
    Animated.timing(slideAnim, { toValue:500, duration:220, useNativeDriver:true })
      .start(() => { setShowForm(false); setEditingSlot(null); });
  }

  function save() {
    if (!isBreak && !pickedCourse) {
      Alert.alert('Select a course', 'Please choose a course for this slot.'); return;
    }
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      Alert.alert('Invalid time', 'End time must be after start time.'); return;
    }
    const newS = timeToMinutes(startTime), newE = timeToMinutes(endTime);
    // clash check — exclude the slot being edited
    const clash = slots
      .filter(s => s.day === selectedDay && s.id !== editingSlot?.id)
      .find(s => newS < timeToMinutes(s.endTime) && newE > timeToMinutes(s.startTime));
    if (clash) {
      Alert.alert('Time clash',
        `Overlaps with ${clash.isBreak ? 'Break' : clash.courseCode} `+
        `(${formatTime12(clash.startTime)} – ${formatTime12(clash.endTime)}).`
      ); return;
    }

    if (editingSlot) {
      updateSlot({
        ...editingSlot,
        courseCode:  isBreak ? 'BREAK'       : pickedCourse!.code,
        courseTitle: isBreak ? 'Break Period' : pickedCourse!.title,
        room, lecturer, startTime, endTime, isBreak,
      });
    } else {
      addSlot({
        id: uid(), day: selectedDay,
        courseCode:  isBreak ? 'BREAK'       : pickedCourse!.code,
        courseTitle: isBreak ? 'Break Period' : pickedCourse!.title,
        room, lecturer, startTime, endTime, isBreak,
      });
    }
    closeForm();
  }

  const daySlots   = slots.filter(s => s.day === selectedDay);
  const colourFor  = (code: string) => {
    const i = courses.findIndex(c => c.code === code);
    return COLOURS[((i < 0 ? 0 : i) % COLOURS.length)];
  };
  // courses not yet scheduled on ANY day (but include the one being edited)
  const scheduledCodes = new Set(
    slots.filter(s => !s.isBreak && s.id !== editingSlot?.id).map(s => s.courseCode)
  );
  const availableCourses = courses.filter(c => !scheduledCodes.has(c.code));

  return (
    <View style={[s.root, { backgroundColor: background, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={background} />

      {/* ── HEADER ── */}
      <View style={s.header}>
        <TouchableOpacity style={[s.iconBtn, { backgroundColor: surface }]} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={text} />
        </TouchableOpacity>
        <View style={s.headerText}>
          <Text style={[s.headerTitle, { color: text }]}>Class Schedule</Text>
          <Text style={[s.headerSub, { color: textSecondary }]}>Manage your weekly timetable</Text>
        </View>
        <TouchableOpacity style={[s.doneBtn, { backgroundColor: accent }]}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} activeOpacity={0.85}>
          <Text style={s.doneTxt}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* ── DAY TABS ── */}
      <View style={s.dayRow}>
        {DAY_KEYS.map(d => {
          const active = d === selectedDay;
          const count  = slots.filter(sl => sl.day === d).length;
          return (
            <TouchableOpacity
              key={d}
              style={[s.dayTab, { backgroundColor: surface }, active && { backgroundColor: accent }]}
              onPress={() => { setSelectedDay(d); setShowForm(false); slideAnim.setValue(500); setPicked(null); }}
              activeOpacity={0.8}
            >
              <Text style={[s.dayTabTxt, { color: active ? '#fff' : textSecondary }]}>{d}</Text>
              {count > 0 && (
                <View style={[s.dayBadge, { backgroundColor: active ? 'rgba(255,255,255,0.3)' : accentSoft }]}>
                  <Text style={[s.dayBadgeTxt, { color: active ? '#fff' : accent }]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── SLOT LIST ── */}
      <ScrollView
        style={s.list}
        contentContainerStyle={s.listContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {daySlots.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="calendar-outline" size={52} color="#CBD5E1" />
            <Text style={[s.emptyTitle, { color: textSecondary }]}>No classes on {DAY_FULL[selectedDay]}</Text>
            <Text style={[s.emptySub, { color: textSecondary }]}>Tap "Add Class" to get started.</Text>
          </View>
        ) : (
          daySlots.map(sl => (
            <SlotCard
              key={sl.id}
              slot={sl}
              color={sl.isBreak ? '#94A3B8' : colourFor(sl.courseCode)}
              cardBg={surface}
              textColor={text}
              onRemove={() => removeSlot(sl.id)}
              onEdit={() => openEdit(sl)}
            />
          ))
        )}
      </ScrollView>

      {/* ── ADD CLASS BUTTON ── */}
      {!showForm && (
        <View style={[s.fabWrap, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity
            style={[s.fab, { backgroundColor: accent }]}
            onPress={openForm}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={22} color="#fff" />
            <Text style={s.fabTxt}>Add Class</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── SLIDE-UP FORM ── */}
      {showForm && (
        <Animated.View style={[s.sheet, { backgroundColor: surface, transform:[{ translateY: slideAnim }], paddingBottom: insets.bottom + 8 }]}>
          {/* handle */}
          <View style={s.sheetHandle} />

          {/* title + close */}
          <View style={s.sheetHeader}>
            <Text style={[s.sheetTitle, { color: text }]}>{editingSlot ? 'Edit Slot' : `Add to ${DAY_FULL[selectedDay]}`}</Text>
            <TouchableOpacity onPress={closeForm} hitSlop={{ top:10,left:10,bottom:10,right:10 }}>
              <Ionicons name="close-circle" size={26} color="#CBD5E1" />
            </TouchableOpacity>
          </View>

          {/* Class / Break toggle */}
          <View style={[s.toggle, { backgroundColor: isDark ? '#1A1A1A' : '#F1F5F9' }]}>
            <TouchableOpacity
              style={[s.toggleOpt, !isBreak && { backgroundColor: accent }]}
              onPress={() => setIsBreak(false)} activeOpacity={0.8}
            >
              <Ionicons name="school-outline" size={15} color={!isBreak ? '#fff' : '#94A3B8'} />
              <Text style={[s.toggleTxt, !isBreak && { color:'#fff' }]}>Class</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.toggleOpt, isBreak && { backgroundColor:'#F59E0B' }]}
              onPress={() => setIsBreak(true)} activeOpacity={0.8}
            >
              <Text style={[s.toggleTxt, isBreak && { color:'#fff' }]}>☕  Break</Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable fields */}
          <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==='ios' ? 'padding' : undefined}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom:8 }}>

              {!isBreak && (
                <>
                  {/* Course picker */}
                  <Text style={s.label}>Course</Text>
                  <TouchableOpacity style={[s.picker, { backgroundColor: background, borderColor: border }]} onPress={() => setShowCourses(true)} activeOpacity={0.8}>
                    {pickedCourse ? (
                      <View style={{ flex:1 }}>
                        <Text style={[s.pickerCode, { color: accent }]}>{pickedCourse.code}</Text>
                        <Text style={[s.pickerTitle, { color: text }]} numberOfLines={1}>{pickedCourse.title}</Text>
                      </View>
                    ) : (
                      <Text style={s.pickerPlaceholder}>Select a course…</Text>
                    )}
                    <Ionicons name="chevron-down" size={18} color="#94A3B8" />
                  </TouchableOpacity>

                  {/* Room */}
                  <Text style={s.label}>Room / Venue</Text>
                  <TextInput
                    style={[s.input, { backgroundColor: background, borderColor: border, color: text }]}
                    value={room} onChangeText={setRoom}
                    placeholder="e.g. B3, Room 124" placeholderTextColor="#A0AEC0"
                  />

                  {/* Lecturer */}
                  <Text style={s.label}>Lecturer</Text>
                  <TextInput
                    style={[s.input, { backgroundColor: background, borderColor: border, color: text }]}
                    value={lecturer} onChangeText={setLecturer}
                    placeholder="e.g. Dr. Adeyemi" placeholderTextColor="#A0AEC0"
                  />
                </>
              )}

              {/* Time pickers */}
              <View style={s.timeRow}>
                <View style={{ flex:1 }}>
                  <Text style={s.label}>Starts at</Text>
                  <TouchableOpacity style={[s.timePill, { backgroundColor: background, borderColor: border }]} onPress={() => setShowStart(true)} activeOpacity={0.8}>
                    <Ionicons name="time-outline" size={16} color={accent} />
                    <Text style={[s.timePillTxt, { color: accent }]}>{formatTime12(startTime)}</Text>
                  </TouchableOpacity>
                </View>
                <Ionicons name="arrow-forward" size={16} color="#CBD5E1" style={{ marginTop:28 }} />
                <View style={{ flex:1 }}>
                  <Text style={s.label}>Ends at</Text>
                  <TouchableOpacity style={[s.timePill, { backgroundColor: background, borderColor: border }]} onPress={() => setShowEnd(true)} activeOpacity={0.8}>
                    <Ionicons name="time-outline" size={16} color="#F59E0B" />
                    <Text style={[s.timePillTxt, { color:'#F59E0B' }]}>{formatTime12(endTime)}</Text>
                  </TouchableOpacity>
                </View>
              </View>

            </ScrollView>
          </KeyboardAvoidingView>

          {/* Save button — always pinned */}
          <TouchableOpacity style={[s.saveBtn, { backgroundColor: editingSlot ? '#3B82F6' : accent }]} onPress={save} activeOpacity={0.85}>
            <Ionicons name={editingSlot ? 'create-outline' : 'checkmark-circle-outline'} size={20} color="#fff" />
            <Text style={s.saveTxt}>{editingSlot ? 'Update Slot' : 'Save Slot'}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── NATIVE TIME PICKERS ── */}
      {showStart && (
        <DateTimePicker
          mode="time" is24Hour={false}
          value={toDate(startTime)}
          display={Platform.OS==='ios' ? 'spinner' : 'clock'}
          onChange={(_: DateTimePickerEvent, date?: Date) => {
            setShowStart(false);
            if (!date) return;
            const t = fromDate(date);
            setStartTime(t);
            if (timeToMinutes(t) >= timeToMinutes(endTime)) setEndTime(addHour(t));
          }}
        />
      )}
      {showEnd && (
        <DateTimePicker
          mode="time" is24Hour={false}
          value={toDate(endTime)}
          display={Platform.OS==='ios' ? 'spinner' : 'clock'}
          onChange={(_: DateTimePickerEvent, date?: Date) => {
            setShowEnd(false);
            if (!date) return;
            const t = fromDate(date);
            if (timeToMinutes(t) > timeToMinutes(startTime)) setEndTime(t);
            else Alert.alert('Invalid time', 'End time must be after start time.');
          }}
        />
      )}

      {/* ── COURSE PICKER MODAL ── */}
      <Modal visible={showCourses} transparent animationType="slide"
        onRequestClose={() => setShowCourses(false)}>
        <TouchableOpacity style={cm.backdrop} activeOpacity={1} onPress={() => setShowCourses(false)} />
        <View style={[cm.sheet, { backgroundColor: surface, paddingBottom: insets.bottom + 16 }]}>
          <View style={[cm.handle, { backgroundColor: border }]} />
          <Text style={[cm.title, { color: text }]}>Your Courses</Text>
          {courses.length === 0
            ? <Text style={cm.empty}>No courses found. Please log in first.</Text>
            : availableCourses.length === 0
            ? <Text style={cm.empty}>All your courses have been added to the timetable.</Text>
            : (
              <FlatList
                data={availableCourses}
                keyExtractor={c => c.code}
                style={{ maxHeight: 340 }}
                renderItem={({ item, index }) => {
                  const col = COLOURS[index % COLOURS.length];
                  const sel = pickedCourse?.code === item.code;
                  return (
                    <TouchableOpacity
                      style={[cm.row, { borderBottomColor: border }, sel && { backgroundColor: accentSoft, borderRadius: 10, paddingHorizontal: 6 }]}
                      onPress={() => { setPicked(item); setShowCourses(false); }}
                      activeOpacity={0.8}
                    >
                      <View style={[cm.codePill, { backgroundColor: col + '18' }]}>
                        <Text style={[cm.code, { color: col }]}>{item.code}</Text>
                      </View>
                      <Text style={[cm.courseTitle, { color: text }]} numberOfLines={2}>{item.title}</Text>
                      {sel && <Ionicons name="checkmark-circle" size={20} color={accent} />}
                    </TouchableOpacity>
                  );
                }}
              />
            )
          }
          <TouchableOpacity style={[cm.cancel, { backgroundColor: background }]} onPress={() => setShowCourses(false)}>
            <Text style={[cm.cancelTxt, { color: textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

// ─── styles ────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex:1, backgroundColor:'#F7F8FA' },

  // header
  header: {
    flexDirection:'row', alignItems:'center', gap:12,
    paddingHorizontal:20, paddingTop:12, paddingBottom:14,
  },
  iconBtn: {
    width:38, height:38, borderRadius:12, backgroundColor:'#fff',
    alignItems:'center', justifyContent:'center',
    shadowColor:'#000', shadowOpacity:0.06, shadowOffset:{width:0,height:2}, shadowRadius:6, elevation:2,
  },
  headerText: { flex:1 },
  headerTitle: { fontSize:17, fontWeight:'800', color:'#1A202C' },
  headerSub:   { fontSize:12, color:'#A0AEC0', marginTop:1 },
  doneBtn:     { paddingHorizontal:18, paddingVertical:9, borderRadius:22 },
  doneTxt:     { fontSize:13, fontWeight:'800', color:'#fff' },

  // day tabs — horizontal pill strip
  dayRow: {
    flexDirection:'row', paddingHorizontal:16, gap:8, marginBottom:4,
  },
  dayTab: {
    flex:1, alignItems:'center', justifyContent:'center', gap:4,
    paddingVertical:10, borderRadius:14, backgroundColor:'#fff',
    shadowColor:'#000', shadowOpacity:0.04, shadowOffset:{width:0,height:1}, shadowRadius:3, elevation:1,
  },
  dayTabTxt:   { fontSize:12, fontWeight:'700', color:'#94A3B8' },
  dayBadge:    { width:16, height:16, borderRadius:8, alignItems:'center', justifyContent:'center' },
  dayBadgeTxt: { fontSize:9, fontWeight:'800' },

  // slot list
  list:        { flex:1 },
  listContent: { paddingHorizontal:16, paddingTop:12 },
  empty:       { alignItems:'center', paddingTop:56, gap:10 },
  emptyTitle:  { fontSize:15, fontWeight:'700', color:'#4A5568' },
  emptySub:    { fontSize:13, color:'#A0AEC0' },

  // FAB
  fabWrap: { alignItems:'center', paddingTop:12 },
  fab: {
    flexDirection:'row', alignItems:'center', gap:8,
    paddingHorizontal:32, paddingVertical:15, borderRadius:30,
    shadowColor:'#000', shadowOpacity:0.15, shadowOffset:{width:0,height:4}, shadowRadius:12, elevation:6,
  },
  fabTxt: { fontSize:15, fontWeight:'800', color:'#fff' },

  // slide-up sheet
  sheet: {
    position:'absolute', bottom:0, left:0, right:0,
    backgroundColor:'#fff', borderTopLeftRadius:28, borderTopRightRadius:28,
    paddingHorizontal:20, paddingTop:10,
    maxHeight:'88%',
    shadowColor:'#000', shadowOpacity:0.14, shadowOffset:{width:0,height:-4}, shadowRadius:20, elevation:20,
  },
  sheetHandle: { width:40, height:4, borderRadius:2, backgroundColor:'#E2E8F0', alignSelf:'center', marginBottom:14 },
  sheetHeader: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:18 },
  sheetTitle:  { fontSize:18, fontWeight:'800', color:'#1A202C' },

  // class/break toggle
  toggle:    { flexDirection:'row', backgroundColor:'#F1F5F9', borderRadius:14, padding:4, marginBottom:20, gap:4 },
  toggleOpt: { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, paddingVertical:10, borderRadius:10 },
  toggleTxt: { fontSize:13, fontWeight:'700', color:'#94A3B8' },

  // fields
  label: { fontSize:11, fontWeight:'700', color:'#94A3B8', textTransform:'uppercase', letterSpacing:0.8, marginBottom:7 },
  picker: {
    flexDirection:'row', alignItems:'center', gap:10,
    backgroundColor:'#F7F8FA', borderRadius:14, padding:14,
    marginBottom:16, borderWidth:1, borderColor:'#E5EAF0',
  },
  pickerCode:        { fontSize:11, fontWeight:'800' },
  pickerTitle:       { fontSize:13, fontWeight:'500', color:'#2D3748', marginTop:1 },
  pickerPlaceholder: { flex:1, fontSize:14, color:'#A0AEC0' },

  input: {
    backgroundColor:'#F7F8FA', borderRadius:14, padding:14,
    fontSize:14, color:'#1A202C', marginBottom:16,
    borderWidth:1, borderColor:'#E5EAF0',
  },

  timeRow:     { flexDirection:'row', alignItems:'flex-end', gap:10, marginBottom:8 },
  timePill: {
    flexDirection:'row', alignItems:'center', gap:8,
    backgroundColor:'#F7F8FA', borderRadius:14, padding:14,
    borderWidth:1, borderColor:'#E5EAF0',
  },
  timePillTxt: { fontSize:15, fontWeight:'800' },

  saveBtn: {
    flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10,
    paddingVertical:16, borderRadius:18, marginTop:12,
  },
  saveTxt: { fontSize:15, fontWeight:'800', color:'#fff' },
});

const cm = StyleSheet.create({
  backdrop:  { ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(0,0,0,0.45)' },
  sheet:     { position:'absolute', bottom:0, left:0, right:0, backgroundColor:'#fff', borderTopLeftRadius:28, borderTopRightRadius:28, paddingTop:12, paddingHorizontal:20 },
  handle:    { width:40, height:4, borderRadius:2, backgroundColor:'#E2E8F0', alignSelf:'center', marginBottom:16 },
  title:     { fontSize:17, fontWeight:'800', color:'#1A202C', marginBottom:12 },
  empty:     { textAlign:'center', color:'#A0AEC0', fontSize:14, paddingVertical:32 },
  row:       { flexDirection:'row', alignItems:'center', paddingVertical:13, borderBottomWidth:1, borderBottomColor:'#F1F5F9', gap:12 },
  rowSel:    { backgroundColor:'#F0FDFA', borderRadius:10, paddingHorizontal:6 },
  codePill:  { paddingHorizontal:8, paddingVertical:4, borderRadius:8 },
  code:      { fontSize:12, fontWeight:'800' },
  courseTitle: { flex:1, fontSize:13, fontWeight:'500', color:'#2D3748', lineHeight:18 },
  cancel:    { marginTop:14, alignItems:'center', paddingVertical:13, backgroundColor:'#F7F8FA', borderRadius:14 },
  cancelTxt: { fontSize:15, fontWeight:'700', color:'#4A5568' },
});
