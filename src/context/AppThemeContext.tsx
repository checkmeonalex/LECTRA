import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

export const THEME_ACCENTS = [
  '#14B8A6',
  '#3B82F6',
  '#22C55E',
  '#F59E0B',
  '#EC4899',
  '#EF4444',
] as const;

export type AppearanceMode = 'light' | 'dark' | 'system';

export const DEFAULT_ACCENT = THEME_ACCENTS[0];

const ACCENT_STORAGE_KEY = 'accent_color';
const APPEARANCE_STORAGE_KEY = 'appearance';

type ThemeContextValue = {
  accent: string;
  appearance: AppearanceMode;
  isDark: boolean;
  setAccent: (accent: string) => Promise<void>;
  setAppearance: (appearance: AppearanceMode) => Promise<void>;
  accentSoft: string;
  accentSoft2: string;
  accentSoft3: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textSecondary: string;
  border: string;
  onAccent: string;
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function withAlpha(color: string, alpha: string) {
  return color.startsWith('#') ? `${color}${alpha}` : color;
}

function getOnAccent(color: string) {
  const hex = color.replace('#', '');
  const full = hex.length === 3
    ? hex.split('').map(ch => ch + ch).join('')
    : hex.padEnd(6, '0');
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? '#0F172A' : '#FFFFFF';
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = useState<string>(DEFAULT_ACCENT);
  const [appearance, setAppearanceState] = useState<AppearanceMode>('system');
  const [ready, setReady] = useState(false);
  const scheme = useColorScheme();

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(ACCENT_STORAGE_KEY),
      AsyncStorage.getItem(APPEARANCE_STORAGE_KEY),
    ]).then(([savedAccent, savedAppearance]) => {
      if (savedAccent && THEME_ACCENTS.includes(savedAccent as typeof THEME_ACCENTS[number])) {
        setAccentState(savedAccent);
      }
      if (savedAppearance === 'light' || savedAppearance === 'dark' || savedAppearance === 'system') {
        setAppearanceState(savedAppearance);
      }
    }).finally(() => {
      setReady(true);
    });
  }, []);

  async function setAccent(accentColor: string) {
    setAccentState(accentColor);
    await AsyncStorage.setItem(ACCENT_STORAGE_KEY, accentColor);
  }

  async function setAppearance(mode: AppearanceMode) {
    setAppearanceState(mode);
    await AsyncStorage.setItem(APPEARANCE_STORAGE_KEY, mode);
  }

  const isDark = appearance === 'dark' || (appearance === 'system' && scheme === 'dark');

  const value = useMemo<ThemeContextValue>(() => ({
    accent,
    appearance,
    isDark,
    setAccent,
    setAppearance,
    accentSoft: withAlpha(accent, '14'),
    accentSoft2: withAlpha(accent, '1E'),
    accentSoft3: withAlpha(accent, '28'),
    background: isDark ? '#0A0A0A' : '#F7F8FA',
    surface: isDark ? '#141414' : '#FFFFFF',
    surfaceAlt: isDark ? '#1E1E1E' : '#F2F5FA',
    text: isDark ? '#F8FAFC' : '#1A202C',
    textSecondary: isDark ? '#94A3B8' : '#718096',
    border: isDark ? 'rgba(255,255,255,0.08)' : '#E5EAF0',
    onAccent: getOnAccent(accent),
    ready,
  }), [accent, appearance, isDark, ready]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      accent: DEFAULT_ACCENT,
      appearance: 'system' as AppearanceMode,
      isDark: false,
      setAccent: async () => {},
      setAppearance: async () => {},
      accentSoft: withAlpha(DEFAULT_ACCENT, '14'),
      accentSoft2: withAlpha(DEFAULT_ACCENT, '1E'),
      accentSoft3: withAlpha(DEFAULT_ACCENT, '28'),
      background: '#F7F8FA',
      surface: '#FFFFFF',
      surfaceAlt: '#F2F5FA',
      text: '#1A202C',
      textSecondary: '#718096',
      border: '#E5EAF0',
      onAccent: getOnAccent(DEFAULT_ACCENT),
      ready: false,
    };
  }
  return ctx;
}
