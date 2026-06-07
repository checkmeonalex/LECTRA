import React, {
  createContext, useCallback, useContext, useEffect, useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type DayKey = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';

export interface TimetableSlot {
  id: string;
  day: DayKey;
  courseCode: string;
  courseTitle: string;
  room: string;
  lecturer: string;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  isBreak?: boolean;
}

interface TimetableContextValue {
  slots: TimetableSlot[];
  addSlot: (slot: TimetableSlot) => Promise<void>;
  removeSlot: (id: string) => Promise<void>;
  updateSlot: (slot: TimetableSlot) => Promise<void>;
  clearAll: () => Promise<void>;
  loaded: boolean;
}

const KEY = 'timetable_slots_v1';

const TimetableContext = createContext<TimetableContextValue | undefined>(undefined);

export function TimetableProvider({ children }: { children: React.ReactNode }) {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(raw => {
      if (raw) setSlots(JSON.parse(raw));
    }).finally(() => setLoaded(true));
  }, []);

  const persist = useCallback(async (next: TimetableSlot[]) => {
    setSlots(next);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  const addSlot = useCallback(async (slot: TimetableSlot) => {
    persist([...slots, slot].sort((a, b) => {
      if (a.day !== b.day) return a.day.localeCompare(b.day);
      return a.startTime.localeCompare(b.startTime);
    }));
  }, [slots, persist]);

  const removeSlot = useCallback(async (id: string) => {
    persist(slots.filter(s => s.id !== id));
  }, [slots, persist]);

  const updateSlot = useCallback(async (slot: TimetableSlot) => {
    persist(slots.map(s => s.id === slot.id ? slot : s).sort((a, b) => {
      if (a.day !== b.day) return a.day.localeCompare(b.day);
      return a.startTime.localeCompare(b.startTime);
    }));
  }, [slots, persist]);

  const clearAll = useCallback(async () => {
    persist([]);
  }, [persist]);

  return (
    <TimetableContext.Provider value={{ slots, addSlot, removeSlot, updateSlot, clearAll, loaded }}>
      {children}
    </TimetableContext.Provider>
  );
}

export function useTimetable() {
  const ctx = useContext(TimetableContext);
  if (!ctx) throw new Error('useTimetable must be inside TimetableProvider');
  return ctx;
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function formatTime12(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export const DAY_KEYS: DayKey[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
