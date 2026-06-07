import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Alert, Platform, Modal, Animated, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useFocusEffect, useRouter } from 'expo-router';
import type { StudentData } from '@/services/portal';
import { DEFAULT_ACCENT, THEME_ACCENTS, useAppTheme, type AppearanceMode } from '@/context/AppThemeContext';

// ── Constants ──────────────────────────────────────────────────────────────

const APPEARANCE_OPTIONS: { mode: AppearanceMode; icon: any; label: string }[] = [
  { mode: 'light',  icon: 'sunny-outline',          label: 'Light'  },
  { mode: 'dark',   icon: 'moon-outline',            label: 'Dark'   },
  { mode: 'system', icon: 'phone-portrait-outline',  label: 'System' },
];

// ── Circular Progress ──────────────────────────────────────────────────────

function CircularProgress({
  size = 72, progress = 0, color = DEFAULT_ACCENT, playKey = 0, bgColor = '#fff',
  children,
}: { size?: number; progress?: number; color?: string; playKey?: number; bgColor?: string; children?: React.ReactNode }) {
  const strokeWidth = Math.round(size * 0.12);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, Number.isFinite(progress) ? progress : 0));
  const animatedPct = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animatedPct.stopAnimation();
    animatedPct.setValue(0);
    Animated.timing(animatedPct, {
      toValue: pct,
      duration: 750,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animatedPct, pct, playKey]);

  const dashOffset = animatedPct.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#EEF2F7"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{
        position: 'absolute', top: strokeWidth, left: strokeWidth,
        width: size - strokeWidth * 2, height: size - strokeWidth * 2,
        borderRadius: (size - strokeWidth * 2) / 2,
        backgroundColor: bgColor,
        alignItems: 'center', justifyContent: 'center',
      }}>
        {children}
      </View>
    </View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ── Helpers ────────────────────────────────────────────────────────────────

function getSemesterProgress(): { pct: number; label: string } {
  const now   = new Date();
  const start = new Date(now.getFullYear(), 2, 1);  // Mar 1
  const end   = new Date(now.getFullYear(), 6, 31); // Jul 31
  if (now < start) return { pct: 0, label: 'Not started' };
  if (now > end)   return { pct: 100, label: 'Completed' };

  const total   = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const pct = Math.round((elapsed / total) * 100);

  const msLeft     = end.getTime() - now.getTime();
  const daysLeft   = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
  const monthsLeft = Math.round(daysLeft / 30.4);
  const label      = monthsLeft <= 1
    ? `${daysLeft}d left`
    : `${monthsLeft} mo left`;

  return { pct, label };
}

function calcProfileCompletion(data: StudentData, isActive: boolean): { pct: number; missing: string[] } {
  const ff = (...ks: string[]) =>
    data.fields?.find(f => ks.some(k => f.label.toLowerCase().includes(k)))?.value ?? '';

  const checks: { label: string; pass: () => boolean }[] = [
    { label: 'Full Name',       pass: () => !!(data.courseInfo?.['NAME'] ?? ff('name')) },
    { label: 'Matric Number',   pass: () => !!ff('matric') },
    { label: 'Department',      pass: () => !!(ff('department') || ff('dept')) },
    { label: 'Level',           pass: () => !!(data.homeStatus?.['Current level'] || ff('level')) },
    { label: 'Programme',       pass: () => !!ff('programme', 'program') },
    { label: 'Gender / Sex',    pass: () => !!ff('gender', 'sex') },
    { label: 'Date of Birth',   pass: () => !!ff('birth', 'dob') },
    { label: 'State of Origin', pass: () => !!ff('state', 'origin') },
    { label: 'Phone Number',    pass: () => !!ff('phone', 'mobile', 'tel') },
    { label: 'Email',           pass: () => !!ff('email') },
  ];

  const missing = checks.filter(c => !c.pass()).map(c => c.label);
  let pct = Math.round(((checks.length - missing.length) / checks.length) * 100);
  if (!isActive) pct = Math.min(pct, 75);
  return { pct, missing };
}

// ── Screen ─────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const [data, setData]           = useState<StudentData | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [ringPlayKey, setRingPlayKey] = useState(0);
  const sheetY = useRef(new Animated.Value(600)).current;
  const nav    = useRouter();
  const insets = useSafeAreaInsets();
  const { accent, appearance, setAccent, setAppearance, onAccent, background, surface, surfaceAlt, text, textSecondary, border, isDark } = useAppTheme();

  useFocusEffect(
    useCallback(() => {
      setRingPlayKey(k => k + 1);
    }, [])
  );

  useEffect(() => {
    AsyncStorage.getItem('student_data').then(raw => {
      if (raw) setData(JSON.parse(raw));
    });
  }, []);

  function openSheet() {
    setSheetOpen(true);
    Animated.spring(sheetY, {
      toValue: 0, useNativeDriver: true,
      damping: 22, stiffness: 160,
    }).start();
  }

  function closeSheet() {
    Animated.timing(sheetY, {
      toValue: 600, duration: 220, useNativeDriver: true,
    }).start(() => setSheetOpen(false));
  }

  async function handleAccent(color: string) { await setAccent(color); }

  async function handleAppearance(mode: AppearanceMode) { await setAppearance(mode); }

  async function handleRefresh() {
    setRefreshing(true);
    const raw = await AsyncStorage.getItem('student_data');
    if (raw) setData(JSON.parse(raw));
    setTimeout(() => setRefreshing(false), 900);
  }

  function handleLogout() {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out', style: 'destructive',
        onPress: () => {
          AsyncStorage.removeItem('student_data').then(() => nav.replace('/'));
        },
      },
    ]);
  }

  if (!data) return <View style={[s.root, { backgroundColor: background }]} />;

  const findField = (...keys: string[]) =>
    data.fields?.find(f => keys.some(k => f.label.toLowerCase().includes(k)))?.value ?? '';

  const name       = data.courseInfo?.['NAME'] ?? findField('name') ?? 'Student';
  const department = findField('department', 'dept');
  const level      = data.homeStatus?.['Current level'] ?? '';
  const semester   = data.homeStatus?.['Current semester'] ?? data.homeStatus?.['Semester'] ?? '';
  const totalUnits = data.totalUnits ?? 0;
  const courses    = data.courses?.length ?? 0;

  const rawStatus = data.homeStatus?.['Student status'] ??
    Object.values(data.homeStatus ?? {}).find(v => /active/i.test(v)) ?? '';
  const isActive  = rawStatus.toUpperCase().includes('ACTIVE') &&
                    !rawStatus.toUpperCase().includes('INACTIVE');

  const displayName  = name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  const initials     = name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase();
  const { pct: sessionPct, label: sessionLabel } = getSemesterProgress();
  const { pct: profilePct, missing: missingFields } = calcProfileCompletion(data, isActive);
  const profileColor = profilePct < 100 ? '#EF4444' : '#22C55E';

  return (
    <View style={[s.root, { backgroundColor: background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

      {/* ── TOP BAR ── */}
      <View style={[s.topBar, { backgroundColor: background, paddingTop: insets.top + 12 }]}>
        <View style={{ width: 36 }} />
        <Text style={[s.topTitle, { color: text }]}>Profile</Text>
        <TouchableOpacity style={[s.iconBtn, { backgroundColor: surface }]} onPress={openSheet} activeOpacity={0.8}>
          <Ionicons name="settings-outline" size={18} color={textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── AVATAR + PENCIL BADGE ── */}
        <View style={s.profileSection}>
          <TouchableOpacity activeOpacity={0.85} style={s.avatarWrap}>
            <View style={[s.avatar, { backgroundColor: accent }]}>
              <Text style={[s.avatarText, { color: onAccent }]}>{initials}</Text>
            </View>
            <View style={[s.pencilBadge, { backgroundColor: accent }]}>
              <Ionicons name="pencil" size={11} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={[s.editHint, { color: textSecondary }]}>Tap to change photo</Text>
          <Text style={[s.displayName, { color: text }]}>{displayName}</Text>
          <Text style={[s.subInfo, { color: textSecondary }]}>{level || 'Student'}  •  {department || 'Yabatech'}</Text>
        </View>

        {/* ── THREE STAT CIRCLES ── */}
        <View style={[s.statCard, { backgroundColor: surface }]}>
          <View style={s.statItem}>
            <CircularProgress size={72} progress={sessionPct} color={accent} playKey={ringPlayKey} bgColor={surface}>
              <Text style={[s.circleVal, { color: accent }]}>{sessionPct}%</Text>
            </CircularProgress>
            <Text style={[s.statLabel, { color: text }]}>Session</Text>
            <View style={s.statSub}>
              <Ionicons name="calendar-outline" size={11} color={accent} />
              <Text style={[s.statSubText, { color: accent }]}>{sessionLabel}</Text>
            </View>
          </View>

          <View style={s.statItem}>
            <CircularProgress size={72} progress={0} color="#74B9FF" playKey={ringPlayKey} bgColor={surface}>
              <Text style={[s.circleVal, { color: '#74B9FF', fontSize: 12 }]}>N/A</Text>
            </CircularProgress>
            <Text style={[s.statLabel, { color: text }]}>Attendance</Text>
            <View style={s.statSub}>
              <Ionicons name="time-outline" size={11} color="#74B9FF" />
              <Text style={[s.statSubText, { color: '#74B9FF' }]}>--</Text>
            </View>
          </View>

          <View style={s.statItem}>
            <CircularProgress size={72} progress={profilePct} color={profileColor} playKey={ringPlayKey} bgColor={surface}>
              <Text style={[s.circleVal, { color: profileColor }]}>{profilePct}%</Text>
            </CircularProgress>
            <Text style={[s.statLabel, { color: text }]}>Profile</Text>
            <View style={s.statSub}>
              <Ionicons
                name={profilePct < 100 ? 'alert-circle' : 'checkmark-circle'}
                size={11} color={profileColor}
              />
              <Text style={[s.statSubText, { color: profileColor }]}>
                {profilePct < 100 ? (isActive ? 'Incomplete' : 'Not Paid') : 'Complete'}
              </Text>
            </View>
          </View>
        </View>

        {/* missing fields hint */}
        {missingFields.length > 0 && profilePct < 100 && isActive && (
          <View style={s.missingBanner}>
            <Ionicons name="information-circle-outline" size={15} color="#F59E0B" />
            <Text style={s.missingText}>
              Missing: <Text style={s.missingFields}>{missingFields.join(', ')}</Text>
            </Text>
          </View>
        )}

        {/* inactive warning */}
        {!isActive && (
          <View style={s.warningBanner}>
            <Ionicons name="alert-circle" size={16} color="#EF4444" />
            <Text style={s.warningText}>School fees unpaid — some features may be restricted.</Text>
          </View>
        )}

        {/* ── ACADEMIC OVERVIEW ── */}
        <Text style={[s.sectionTitle, { color: text }]}>Academic Overview</Text>
        <View style={[s.listCard, { backgroundColor: surface }]}>
          <StatRow icon="book-outline"     label="Courses Registered" value={String(courses)} accent={accent} text={text} textSecondary={textSecondary} border={border} />
          <StatRow icon="layers-outline"   label="Credit Units"       value={`${totalUnits}`} accent={accent} text={text} textSecondary={textSecondary} border={border} />
          <StatRow icon="school-outline"   label="Current Level"      value={level || '—'}    accent={accent} text={text} textSecondary={textSecondary} border={border} dot />
          <StatRow icon="calendar-outline" label="Semester"           value={semester || '—'} accent={accent} text={text} textSecondary={textSecondary} border={border} last />
        </View>

        {/* ── GROUPED BIODATA ── */}
        <BiodataGroups fields={data.fields ?? []} surface={surface} text={text} textSecondary={textSecondary} border={border} />

        {/* ── LOGOUT ── */}
        <View style={[s.listCard, { backgroundColor: surface }]}>
          <TouchableOpacity style={[s.logoutRow, { backgroundColor: isDark ? '#1A0000' : '#FFF5F5' }]} onPress={handleLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={s.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── SETTINGS BOTTOM SHEET ── */}
      <Modal visible={sheetOpen} transparent animationType="none" onRequestClose={closeSheet}>
        <View style={s.sheetContainer}>
          {/* dim overlay */}
          <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={closeSheet} />

          <Animated.View style={[s.sheet, { backgroundColor: surface, transform: [{ translateY: sheetY }] }]}>
            {/* handle */}
            <View style={[s.sheetHandle, { backgroundColor: border }]} />

            {/* ── Edit Profile Photo ── */}
            <Text style={[s.sheetSectionTitle, { color: textSecondary }]}>Profile Photo</Text>
            <TouchableOpacity style={[s.photoRow, { backgroundColor: surfaceAlt }]} activeOpacity={0.8}>
              <View style={[s.photoIconWrap, { backgroundColor: accent + '18' }]}>
                <View style={{ position: 'relative' }}>
                  <Ionicons name="person-circle-outline" size={36} color={accent} />
                  <View style={[s.photoPencil, { backgroundColor: accent }]}>
                    <Ionicons name="pencil" size={9} color="#fff" />
                  </View>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.photoLabel, { color: text }]}>Edit Profile Photo</Text>
                <Text style={[s.photoDesc, { color: textSecondary }]}>Upload a photo from your gallery or camera</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E0" />
            </TouchableOpacity>

            <View style={[s.sheetDivider, { backgroundColor: border }]} />

            {/* ── Appearance ── */}
            <Text style={[s.sheetSectionTitle, { color: textSecondary }]}>Appearance</Text>
            <View style={s.modeRow}>
              {APPEARANCE_OPTIONS.map(({ mode, icon, label }) => {
                const active = appearance === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    style={[s.modeBtn, { borderColor: border, backgroundColor: surfaceAlt }, active && { borderColor: accent, backgroundColor: accent + '18' }]}
                    onPress={() => handleAppearance(mode)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={icon} size={20} color={active ? accent : '#A0AEC0'} />
                    <Text style={[s.modeLabel, active && { color: accent, fontWeight: '700' }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[s.sheetDivider, { backgroundColor: border }]} />

            {/* ── Accent Color ── */}
            <Text style={[s.sheetSectionTitle, { color: textSecondary }]}>Accent Color</Text>
            <View style={s.colorRow}>
              {THEME_ACCENTS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[s.swatch, { backgroundColor: c }, accent === c && s.swatchActive]}
                  onPress={() => handleAccent(c)}
                  activeOpacity={0.85}
                >
                  {accent === c && <Ionicons name="checkmark" size={14} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>

            <View style={[s.sheetDivider, { backgroundColor: border }]} />

            {/* ── Refresh ── */}
            <TouchableOpacity
              style={[s.refreshBtn, { borderColor: accent + '40', backgroundColor: accent + '0D' }]}
              onPress={handleRefresh}
              activeOpacity={0.8}
            >
              <Ionicons
                name={refreshing ? 'sync' : 'refresh-outline'}
                size={20}
                color={accent}
              />
              <Text style={[s.refreshText, { color: accent }]}>
                {refreshing ? 'Refreshing…' : 'Refresh Data'}
              </Text>
            </TouchableOpacity>

            <View style={{ height: Platform.OS === 'ios' ? 28 : 16 }} />
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatRow({
  icon, label, value, accent, dot = false, last = false, text, textSecondary, border,
}: { icon: any; label: string; value: string; accent: string; dot?: boolean; last?: boolean; text: string; textSecondary: string; border: string }) {
  return (
    <>
      <View style={s.statRow}>
        <Ionicons name={icon} size={18} color={textSecondary} />
        <Text style={[s.statRowLabel, { color: textSecondary }]}>{label}</Text>
        <View style={s.statRowRight}>
          {dot && <View style={[s.accentDot, { backgroundColor: accent }]} />}
          <Text style={[s.statRowValue, { color: text }]}>{value}</Text>
          <Ionicons name="chevron-forward" size={14} color={textSecondary} />
        </View>
      </View>
      {!last && <View style={[s.rowDivider, { backgroundColor: border }]} />}
    </>
  );
}

const FIELD_GROUPS: { title: string; keys: string[] }[] = [
  {
    title: 'Personal Details',
    keys: ['name', 'gender', 'birth', 'dob', 'state', 'origin', 'lga', 'phone', 'mobile', 'tel', 'email'],
  },
  {
    title: 'Academic Details',
    keys: ['matric', 'department', 'dept', 'faculty', 'level', 'programme', 'program', 'mode', 'entry', 'status'],
  },
];

function BiodataGroups({ fields, surface, text, textSecondary, border }: { fields: { label: string; value: string }[]; surface: string; text: string; textSecondary: string; border: string }) {
  if (!fields.length) return null;

  const assigned = new Set<number>();
  const groups: { title: string; items: typeof fields }[] = [];

  for (const group of FIELD_GROUPS) {
    const items = fields.filter((f, i) => {
      if (assigned.has(i)) return false;
      const lower = f.label.toLowerCase();
      return group.keys.some(k => lower.includes(k));
    });
    items.forEach(f => assigned.add(fields.indexOf(f)));
    if (items.length) groups.push({ title: group.title, items });
  }

  const rest = fields.filter((_, i) => !assigned.has(i));
  if (rest.length) groups.push({ title: 'Other Info', items: rest });

  return (
    <>
      {groups.map(group => (
        <React.Fragment key={group.title}>
          <Text style={[s.sectionTitle, { color: text }]}>{group.title}</Text>
          <View style={[s.listCard, { backgroundColor: surface }]}>
            {group.items.map((field, i) => (
              <View key={i}>
                <View style={s.bioRow}>
                  <Text style={[s.bioLabel, { color: textSecondary }]}>{field.label}</Text>
                  <Text style={[s.bioValue, { color: text }]}>{field.value || '—'}</Text>
                </View>
                {i < group.items.length - 1 && <View style={[s.rowDivider, { backgroundColor: border }]} />}
              </View>
            ))}
          </View>
        </React.Fragment>
      ))}
    </>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 16 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 12,
  },
  topTitle: { fontSize: 17, fontWeight: '800', color: '#1A202C' },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
  },

  /* avatar */
  profileSection: { alignItems: 'center', paddingTop: 20, paddingBottom: 16 },
  avatarWrap:  { position: 'relative', marginBottom: 6 },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0.28, shadowOffset: { width: 0, height: 6 }, shadowRadius: 14, elevation: 5,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '800' },
  pencilBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#F7F8FA',
  },
  editHint:    { fontSize: 11, color: '#A0AEC0', marginBottom: 10 },
  displayName: { fontSize: 20, fontWeight: '800', color: '#1A202C', marginBottom: 4 },
  subInfo:     { fontSize: 13, color: '#A0AEC0' },

  /* stat card */
  statCard: {
    flexDirection: 'row', backgroundColor: '#fff',
    marginHorizontal: 20, borderRadius: 20,
    paddingVertical: 20, paddingHorizontal: 10,
    shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 3,
    marginBottom: 16,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 6 },
  circleVal: { fontSize: 14, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '700', color: '#4A5568' },
  statSub:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statSubText: { fontSize: 10, fontWeight: '600' },

  /* missing fields */
  missingBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginHorizontal: 20, marginBottom: 12,
    backgroundColor: '#FFFBEB', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 14,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  missingText:   { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },
  missingFields: { fontWeight: '700', color: '#B45309' },

  /* inactive warning */
  warningBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginBottom: 16,
    backgroundColor: '#FFF5F5', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 14,
    borderWidth: 1, borderColor: '#FED7D7',
  },
  warningText: { flex: 1, fontSize: 12, color: '#EF4444', fontWeight: '500', lineHeight: 16 },

  /* section title */
  sectionTitle: {
    fontSize: 17, fontWeight: '800', color: '#1A202C',
    paddingHorizontal: 20, marginBottom: 10, marginTop: 4,
  },

  /* list card */
  listCard: {
    backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 18,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 3 }, shadowRadius: 8, elevation: 2,
    marginBottom: 20, overflow: 'hidden',
  },
  statRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  statRowLabel: { flex: 1, fontSize: 14, color: '#4A5568', fontWeight: '500' },
  statRowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statRowValue: { fontSize: 15, fontWeight: '700', color: '#1A202C' },
  accentDot:    { width: 7, height: 7, borderRadius: 4 },
  rowDivider:   { height: 1, backgroundColor: '#F7F8FA', marginLeft: 46 },

  /* biodata */
  bioRow:   { paddingHorizontal: 16, paddingVertical: 12 },
  bioLabel: { fontSize: 11, color: '#A0AEC0', fontWeight: '500', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.4 },
  bioValue: { fontSize: 15, fontWeight: '700', color: '#1A202C' },

  /* logout */
  logoutRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, backgroundColor: '#FFF5F5',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },

  /* bottom sheet */
  sheetContainer: { flex: 1, justifyContent: 'flex-end' },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 22, paddingTop: 12,
    shadowColor: '#000', shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: -6 }, shadowRadius: 20, elevation: 16,
  },
  sheetHandle: {
    width: 44, height: 4, borderRadius: 2,
    backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 20,
  },
  sheetSectionTitle: {
    fontSize: 12, fontWeight: '700', color: '#A0AEC0',
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 12,
  },
  sheetDivider: { height: 1, backgroundColor: '#F0F4F8', marginVertical: 18 },

  /* profile photo row */
  photoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#FAFAFA', borderRadius: 16,
    padding: 14,
  },
  photoIconWrap: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  photoPencil: {
    position: 'absolute', bottom: -2, right: -2,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#fff',
  },
  photoLabel: { fontSize: 14, fontWeight: '700', color: '#1A202C', marginBottom: 3 },
  photoDesc:  { fontSize: 12, color: '#A0AEC0', lineHeight: 16 },

  /* appearance mode */
  modeRow: { flexDirection: 'row', gap: 10 },
  modeBtn: {
    flex: 1, alignItems: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E2E8F0',
    backgroundColor: '#FAFAFA',
  },
  modeLabel: { fontSize: 12, fontWeight: '600', color: '#A0AEC0' },

  /* accent swatches */
  colorRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  swatch: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  swatchActive: {
    borderWidth: 3, borderColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 4,
  },

  /* refresh */
  refreshBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16,
    borderRadius: 16, borderWidth: 1.5,
  },
  refreshText: { fontSize: 15, fontWeight: '700' },
});
