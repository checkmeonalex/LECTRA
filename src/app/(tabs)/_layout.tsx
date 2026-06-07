import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useAppTheme } from '@/context/AppThemeContext';

const TABS = [
  { name: 'index',         label: 'Home',          icon: 'home-outline',         iconActive: 'home'          },
  { name: 'timetable',     label: 'Timetable',     icon: 'calendar-outline',     iconActive: 'calendar'      },
  { name: 'notifications', label: 'Notifications', icon: 'notifications-outline', iconActive: 'notifications' },
  { name: 'profile',       label: 'Profile',       icon: 'person-outline',       iconActive: 'person'        },
] as const;

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { accent, accentSoft, surface, text, isDark, background: bg } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.outer, { backgroundColor: bg }]}>
    <View style={[styles.bar, { backgroundColor: surface, borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'transparent', paddingBottom: insets.bottom + 8 }]}>
      {state.routes.map((route, i) => {
        const tab      = TABS[i];
        const focused  = state.index === i;
        const onPress  = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <TouchableOpacity key={route.key} style={styles.tab} onPress={onPress} activeOpacity={0.7}>
            <View
              style={[
                styles.indicator,
                focused && {
                  backgroundColor: accent,
                  shadowColor: accent,
                  shadowOpacity: 0.5,
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 4,
                },
              ]}
            />
            <View
              style={[
                styles.iconWrap,
                focused && { backgroundColor: accentSoft },
              ]}
            >
              <Ionicons
                name={focused ? tab.iconActive : tab.icon}
                size={22}
                color={focused ? accent : '#A0AEC0'}
              />
            </View>
            <Text style={[styles.label, { color: focused ? accent : (isDark ? '#64748B' : '#A0AEC0') }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={props => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index"         options={{ title: 'Home' }} />
      <Tabs.Screen name="timetable"     options={{ title: 'Timetable' }} />
      <Tabs.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Tabs.Screen name="profile"       options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  outer: {
    // fills the corner gaps left by the rounded bar with the page background
  },
  bar: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 12,
    elevation: 12,
  },
  tab:           { flex: 1, alignItems: 'center', paddingTop: 0 },
  indicator: {
    width: '55%', height: 3, borderRadius: 2,
    backgroundColor: 'transparent', marginBottom: 5,
  },
  iconWrap:       { padding: 4, borderRadius: 12 },
  label:       { fontSize: 10, fontWeight: '600', color: '#A0AEC0', marginTop: 2 },
});
