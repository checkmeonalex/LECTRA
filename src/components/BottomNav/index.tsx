import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppTheme } from '@/context/AppThemeContext';

const TABS = [
  { icon: 'home',           activeIcon: 'home',   route: '/home'     },
  { icon: 'school-outline', activeIcon: 'school', route: '/academic' },
  { icon: 'apps-outline',   activeIcon: 'apps',   route: null        },
  { icon: 'person-outline', activeIcon: 'person', route: null        },
] as const;

interface Props { active?: number; }

export default function BottomNav({ active = 0 }: Props) {
  const { accent, surface, accentSoft, isDark } = useAppTheme();
  return (
    <View style={[styles.bar, { backgroundColor: surface, borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'transparent' }]}>
      {TABS.map((tab, i) => {
        const isActive = active === i;
        return (
          <TouchableOpacity
            key={i} style={styles.tab} activeOpacity={0.7}
            onPress={() => tab.route && router.replace(tab.route as any)}
          >
            {/* top progress line */}
            <View style={[styles.indicator, isActive && styles.indicatorActive]} />

            <View style={[styles.iconWrap, isActive && { backgroundColor: accentSoft }]}>
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={22}
                color={isActive ? accent : '#A0AEC0'}
              />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingBottom: 10,
    paddingHorizontal: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 12,
    elevation: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  indicator: {
    width: '60%', height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
    marginBottom: 6,
  },
  indicatorActive: {
    backgroundColor: '#14B8A6',
    shadowColor: '#14B8A6',
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  iconWrap:       { padding: 6, borderRadius: 14 },
  iconWrapActive: { backgroundColor: '#D9FBF6' },
});
