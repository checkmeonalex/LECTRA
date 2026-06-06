import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';

const DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];

function buildWeek() {
  const today = new Date();
  const sun   = new Date(today);
  sun.setDate(today.getDate() - today.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sun);
    d.setDate(sun.getDate() + i);
    return {
      short:   DAY_NAMES[i],
      date:    d.getDate(),
      month:   d.getMonth(),
      isToday: d.toDateString() === today.toDateString(),
    };
  });
}

interface Props { onSelect?: (dayIndex: number) => void; }

export default function WeekStrip({ onSelect }: Props) {
  const week     = buildWeek();
  const todayIdx = week.findIndex(d => d.isToday);
  const [sel, setSel] = useState(todayIdx >= 0 ? todayIdx : 1);

  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 500, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  function pick(i: number) {
    setSel(i);
    onSelect?.(i);
  }

  const selDay = week[sel];

  return (
    <Animated.View style={[styles.wrap, { opacity: fade, transform: [{ translateY: slide }] }]}>
      <View style={styles.strip}>
        {week.map((d, i) => {
          const active = sel === i;
          return (
            <TouchableOpacity key={i} style={styles.dayCol} onPress={() => pick(i)} activeOpacity={0.7}>
              <Text style={[styles.dayName, active && styles.dayNameActive]}>{d.short}</Text>
              <View style={[styles.bubble, active && styles.bubbleActive]}>
                <Text style={[styles.dateNum, active && styles.dateNumActive]}>{d.date}</Text>
              </View>
              {d.isToday && <View style={[styles.todayDot, active && styles.todayDotActive]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.selectedLabel}>
        {selDay.short}, {selDay.date} {MONTH_NAMES[selDay.month]}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  strip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCol: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  dayName: {
    fontSize: 12, fontWeight: '600',
    color: '#A0AEC0', letterSpacing: 0.2,
  },
  dayNameActive: {
    color: '#6C63FF',
  },
  bubble: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  bubbleActive: {
    backgroundColor: '#6C63FF',
    shadowColor: '#6C63FF',
    shadowOpacity: 0.45,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  dateNum:       { fontSize: 15, fontWeight: '700', color: '#4A5568' },
  dateNumActive: { color: '#FFFFFF' },
  todayDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: '#CBD5E0',
  },
  todayDotActive: { backgroundColor: '#6C63FF' },
  selectedLabel: {
    marginTop: 16,
    fontSize: 17, fontWeight: '800',
    color: '#2D3748', letterSpacing: -0.2,
  },
});
