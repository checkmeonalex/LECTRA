import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StudentData } from '@/services/portal';
import ClassCard from '@/components/ClassCard';
import BottomNav from '@/components/BottomNav';

export default function AcademicScreen() {
  const [data, setData] = useState<StudentData | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('student_data').then(raw => {
      if (raw) setData(JSON.parse(raw));
    });
  }, []);

  if (!data) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F4F8" />

      {/* header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Registered Courses</Text>
        {data.totalUnits != null && (
          <View style={styles.unitsBadge}>
            <Text style={styles.unitsText}>{data.totalUnits} units</Text>
          </View>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {data.courses?.length > 0
          ? data.courses.map((course, i) => (
              <ClassCard key={course.code} course={course} index={i} />
            ))
          : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No courses found</Text>
              <Text style={styles.emptySub}>Your registered courses will appear here once available.</Text>
            </View>
          )
        }
        <View style={{ height: 24 }} />
      </ScrollView>

      <BottomNav active={1} />
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F0F4F8' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F4F8' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: '#F0F4F8',
  },
  heading: {
    fontSize: 22, fontWeight: '800', color: '#2D3748', letterSpacing: -0.3,
  },
  unitsBadge: {
    backgroundColor: '#ECEAFF',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: '#D4CFFF',
  },
  unitsText: { fontSize: 12, fontWeight: '700', color: '#6C63FF' },
  list: { paddingTop: 4 },
  emptyWrap: {
    alignItems: 'center', paddingTop: 60, paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 15, fontWeight: '700', color: '#4A5568', marginBottom: 6,
  },
  emptySub: {
    fontSize: 13, color: '#A0AEC0', textAlign: 'center', lineHeight: 20,
  },
});
