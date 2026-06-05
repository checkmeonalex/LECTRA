import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StudentData } from '@/services/portal';

export default function DashboardScreen() {
  const [data, setData] = useState<StudentData | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('student_data').then(raw => {
      if (raw) setData(JSON.parse(raw));
    });
  }, []);

  if (!data || !data.fields?.length) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* ── Status cards from home page ── */}
      {data.homeStatus && Object.keys(data.homeStatus).length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Student Status</Text>
          <View style={styles.statusGrid}>
            {Object.entries(data.homeStatus).map(([label, value]) => {
              const isAlert = /unpaid|inactive|not registered/i.test(value);
              const isGood  = /active|paid|registered/i.test(value);
              return (
                <View key={label} style={[
                  styles.statusCard,
                  isAlert && styles.statusCardRed,
                  isGood  && styles.statusCardGreen,
                ]}>
                  <Text style={[styles.statusValue,
                    isAlert && styles.statusValueRed,
                    isGood  && styles.statusValueGreen,
                  ]}>{value}</Text>
                  <Text style={styles.statusLabel}>{label}</Text>
                </View>
              );
            })}
          </View>
        </>
      )}

      {/* ── Biodata ── */}
      <Text style={styles.sectionTitle}>Biodata</Text>
      <View style={styles.card}>
        {data.fields.map((f, i) => (
          <View key={i} style={[styles.row, i === data.fields.length - 1 && styles.rowLast]}>
            <Text style={styles.rowLabel}>{f.label}</Text>
            <Text style={styles.rowValue}>{f.value || '—'}</Text>
          </View>
        ))}
      </View>

      {/* ── Course Info ── */}
      {data.courseInfo && Object.keys(data.courseInfo).length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Current Semester</Text>
          <View style={styles.card}>
            {Object.entries(data.courseInfo).map(([label, value], i, arr) => (
              <View key={i} style={[styles.row, i === arr.length - 1 && styles.rowLast]}>
                <Text style={styles.rowLabel}>{label}</Text>
                <Text style={styles.rowValue}>{value}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* ── Courses ── */}
      <View style={styles.courseHeader}>
        <Text style={styles.sectionTitle}>Registered Courses</Text>
        {data.totalUnits != null && (
          <View style={styles.unitBadge}>
            <Text style={styles.unitBadgeText}>{data.totalUnits} units</Text>
          </View>
        )}
      </View>

      {data.courses?.length > 0 ? (
        <View style={styles.card}>
          {/* table header */}
          <View style={[styles.courseRow, styles.courseRowHead]}>
            <Text style={[styles.colCode, styles.headText]}>CODE</Text>
            <Text style={[styles.colTitle, styles.headText]}>TITLE</Text>
            <Text style={[styles.colUnit, styles.headText]}>UNIT</Text>
          </View>
          {data.courses.map((c, i) => (
            <View key={i} style={[styles.courseRow, i % 2 === 1 && styles.courseRowAlt]}>
              <Text style={styles.colCode}>{c.code}</Text>
              <View style={styles.colTitle}>
                <Text style={styles.courseTitle}>{c.title}</Text>
                <Text style={styles.courseStatus}>{c.status}</Text>
              </View>
              <Text style={styles.colUnit}>{c.unit}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No courses found for this semester.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  sectionTitle: {
    fontSize: 17, fontWeight: '800', color: '#111827',
    marginTop: 24, marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 16,
    overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB',
  },

  /* biodata / courseInfo rows */
  row: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderColor: '#F3F4F6',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: {
    fontSize: 12, color: '#6B7280', flex: 1,
  },
  rowValue: {
    fontSize: 13, fontWeight: '600', color: '#111827',
    flex: 1, textAlign: 'right',
  },

  /* course section header with badge */
  courseHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: 24, marginBottom: 10,
  },
  unitBadge: {
    backgroundColor: '#111827', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  unitBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  /* course table */
  courseRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderColor: '#F3F4F6',
  },
  courseRowHead: {
    backgroundColor: '#111827', borderBottomWidth: 0,
  },
  courseRowAlt: { backgroundColor: '#F9FAFB' },
  headText: { color: '#fff', fontWeight: '700', fontSize: 10, letterSpacing: 0.5 },

  colCode: { width: 72, fontSize: 12, fontWeight: '700', color: '#111827' },
  colTitle: { flex: 1, paddingHorizontal: 8 },
  colUnit: { width: 36, fontSize: 13, fontWeight: '700', color: '#111827', textAlign: 'center' },

  courseTitle: { fontSize: 12, color: '#111827', fontWeight: '500' },
  courseStatus: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },

  /* status grid */
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 4,
  },
  statusCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 14,
    minWidth: '47%',
    flex: 1,
  },
  statusCardGreen: { backgroundColor: '#DCFCE7' },
  statusCardRed:   { backgroundColor: '#FEE2E2' },
  statusValue: {
    fontSize: 13, fontWeight: '800', color: '#111827', marginBottom: 4,
  },
  statusValueGreen: { color: '#15803D' },
  statusValueRed:   { color: '#B91C1C' },
  statusLabel: {
    fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5,
  },

  emptyCard: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  emptyText: { color: '#9CA3AF', fontSize: 14 },
});
