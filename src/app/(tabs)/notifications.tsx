import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/AppThemeContext';

export default function NotificationsTab() {
  const { background, text, textSecondary, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.root, { backgroundColor: background, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      <View style={s.inner}>
        <Ionicons name="notifications-outline" size={52} color="#C4BFEA" />
        <Text style={[s.title, { color: text }]}>No notifications</Text>
        <Text style={[s.sub, { color: textSecondary }]}>You're all caught up!{'\n'}New alerts will show up here.</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1 },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 32 },
  title: { fontSize: 18, fontWeight: '800' },
  sub:   { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
