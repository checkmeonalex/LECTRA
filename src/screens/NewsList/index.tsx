import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator, StatusBar, Linking, Platform, Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BACKEND_URL from '@/constants/api';

interface NewsItem {
  title: string;
  date: string;
  href: string;
  image: string | null;
}

const SHOW_COUNT = 25;

export default function NewsList() {
  const [news, setNews]       = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    fetch(`${BACKEND_URL}/news`)
      .then(r => r.json())
      .then(d => Array.isArray(d) ? setNews(d) : setError('Could not load news.'))
      .catch(() => setError('Could not load news.'))
      .finally(() => setLoading(false));
  }, []);

  const displayed = news.slice(0, SHOW_COUNT);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0D2137" />

      {/* top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>School News</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      )}

      {!!error && !loading && (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={44} color="#CBD5E0" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && !error && (
        <FlatList
          data={displayed}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item, index }) => <NewsRow item={item} index={index} />}
          ListFooterComponent={
            <TouchableOpacity
              style={styles.seeMoreBtn}
              activeOpacity={0.8}
              onPress={() => Linking.openURL('https://yabatech.edu.ng/yabatechallnews.php')}
            >
              <Ionicons name="globe-outline" size={16} color="#6C63FF" />
              <Text style={styles.seeMoreText}>See more news on Yabatech website</Text>
              <Ionicons name="open-outline" size={14} color="#A0AEC0" />
            </TouchableOpacity>
          }
        />
      )}
    </View>
  );
}

function NewsRow({ item, index }: { item: NewsItem; index: number }) {
  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 350, delay: index * 40, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 350, delay: index * 40, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.75}
        onPress={() => router.push({ pathname: '/news-detail', params: { url: item.href } })}
      >
        {/* thumbnail */}
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback]}>
            <Ionicons name="newspaper-outline" size={22} color="#C4BFEA" />
          </View>
        )}

        {/* text */}
        <View style={styles.rowText}>
          <Text style={styles.rowTitle} numberOfLines={3}>{item.title}</Text>
          {!!item.date && (
            <View style={styles.rowMeta}>
              <Ionicons name="time-outline" size={11} color="#A0AEC0" />
              <Text style={styles.rowDate}>{item.date}</Text>
            </View>
          )}
        </View>

        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F8FA' },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0D2137',
    paddingTop: Platform.OS === 'ios' ? 52 : 40,
    paddingBottom: 14, paddingHorizontal: 16, gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  topBarTitle: { flex: 1, color: '#fff', fontSize: 17, fontWeight: '800' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { color: '#A0AEC0', fontSize: 14, textAlign: 'center' },

  list: { paddingTop: 12, paddingHorizontal: 16, paddingBottom: 32 },

  separator: { height: 1, backgroundColor: '#EEF0F5', marginLeft: 88 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, gap: 14,
    backgroundColor: '#fff',
  },

  thumb: {
    width: 68, height: 68, borderRadius: 14, flexShrink: 0,
  },
  thumbFallback: {
    backgroundColor: '#F3F0FF',
    alignItems: 'center', justifyContent: 'center',
  },

  rowText: { flex: 1 },
  rowTitle: {
    fontSize: 14, fontWeight: '600', color: '#1A202C',
    lineHeight: 20, marginBottom: 6,
  },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowDate: { fontSize: 11, color: '#A0AEC0' },

  seeMoreBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 8,
    paddingVertical: 18, paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1, borderColor: '#EEF0F5',
  },
  seeMoreText: {
    flex: 1, fontSize: 14, fontWeight: '600', color: '#6C63FF',
  },
});
