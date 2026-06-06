import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Course } from '@/services/portal';

const PALETTE = [
  '#6C63FF','#FF6B6B','#4ECDC4','#FFB347',
  '#74B9FF','#FD79A8','#00B894','#FDCB6E',
  '#E17055','#0984E3','#00CEC9','#6C5CE7',
];

interface Props {
  course: Course;
  index: number;
}

export default function ClassCard({ course, index }: Props) {
  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 400, delay: index * 75, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 400, delay: index * 75, useNativeDriver: true }),
    ]).start();
  }, []);

  const color = PALETTE[index % PALETTE.length];

  return (
    <Animated.View style={[styles.card, { opacity: fade, transform: [{ translateX: slide }] }]}>
      <View style={[styles.accent, { backgroundColor: color }]} />

      <View style={styles.codeCol}>
        <View style={[styles.codePill, { backgroundColor: color + '18' }]}>
          <Text style={[styles.codeText, { color }]}>{course.code}</Text>
        </View>
      </View>

      <View style={styles.middle}>
        <Text style={styles.title} numberOfLines={2}>{course.title}</Text>
        <View style={styles.statusRow}>
          <Ionicons name="ellipse" size={6} color={color} />
          <Text style={[styles.status, { color }]}>{course.status}</Text>
        </View>
      </View>

      <View style={[styles.unitCircle, { backgroundColor: color + '18', borderColor: color + '40' }]}>
        <Text style={[styles.unitNum, { color }]}>{course.unit}</Text>
        <Text style={[styles.unitLabel, { color }]}>units</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  accent: {
    width: 4,
    borderRadius: 2,
    alignSelf: 'stretch',
    marginRight: 12,
  },
  codeCol: { marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  codePill: {
    paddingHorizontal: 8, paddingVertical: 5,
    borderRadius: 8,
  },
  codeText: { fontSize: 12, fontWeight: '800' },
  middle: { flex: 1 },
  title: { fontSize: 13, fontWeight: '600', color: '#2D3748', marginBottom: 5, lineHeight: 18 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  status: { fontSize: 11, fontWeight: '500' },
  unitCircle: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, marginLeft: 8,
  },
  unitNum:   { fontSize: 15, fontWeight: '800', lineHeight: 18 },
  unitLabel: { fontSize: 9, fontWeight: '600', marginTop: -1 },
});
