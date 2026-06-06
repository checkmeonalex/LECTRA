import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated, ActivityIndicator,
  Image, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import BACKEND_URL from '@/constants/api';

interface NewsItem {
  title: string;
  date: string;
  href: string;
  image: string | null;
}

const CARD_COLORS = ['#6C63FF','#FF6B6B','#4ECDC4','#FFB347','#74B9FF','#00B894'];

export default function NewsSection() {
  const [news, setNews]       = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const fade  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetch(`${BACKEND_URL}/news`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setNews(data.slice(0, 10));
        else setError('Could not load news.');
      })
      .catch(() => setError('Could not load news.'))
      .finally(() => {
        setLoading(false);
        Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      });
  }, []);

  return (
    <View style={styles.wrap}>
      {/* section heading */}
      <View style={styles.headRow}>
        <Text style={styles.heading}>School News</Text>
        <TouchableOpacity
          style={styles.seeAll}
          onPress={() => router.push('/all-news')}
          activeOpacity={0.7}
        >
          <Text style={styles.seeAllText}>See all</Text>
          <Ionicons name="chevron-forward" size={13} color="#6C63FF" />
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loaderRow}>
          <ActivityIndicator size="small" color="#6C63FF" />
        </View>
      )}

      {!!error && !loading && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {!loading && !error && (
        <Animated.View style={{ opacity: fade }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollRow}
          >
            {news.map((item, i) => (
              <NewsCard key={i} item={item} accent={CARD_COLORS[i % CARD_COLORS.length]} index={i} />
            ))}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

function NewsCard({ item, accent, index }: { item: NewsItem; accent: string; index: number }) {
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1, tension: 80, friction: 8,
      delay: index * 60, useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => router.push({ pathname: '/news-detail', params: { url: item.href } })}
      >
        {/* image or color placeholder */}
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.cardImg} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImg, styles.cardImgFallback, { backgroundColor: accent + '22' }]}>
            <Ionicons name="newspaper-outline" size={28} color={accent} />
          </View>
        )}

        {/* accent bar */}
        <View style={[styles.accentBar, { backgroundColor: accent }]} />

        {/* content */}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={3}>{item.title}</Text>
          {!!item.date && (
            <View style={styles.dateRow}>
              <Ionicons name="time-outline" size={11} color="#A0AEC0" />
              <Text style={styles.dateText}>{item.date}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 24 },

  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  heading: { fontSize: 16, fontWeight: '800', color: '#2D3748', letterSpacing: -0.2 },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontSize: 13, fontWeight: '600', color: '#6C63FF' },

  loaderRow: { alignItems: 'center', paddingVertical: 24 },
  errorText: { textAlign: 'center', color: '#A0AEC0', fontSize: 13, paddingVertical: 16 },

  scrollRow: { paddingHorizontal: 20, gap: 12 },

  card: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  cardImg: {
    width: '100%', height: 110,
  },
  cardImgFallback: {
    alignItems: 'center', justifyContent: 'center',
  },
  accentBar: { height: 3, width: '100%' },
  cardBody: { padding: 12 },
  cardTitle: {
    fontSize: 13, fontWeight: '700', color: '#2D3748',
    lineHeight: 19, marginBottom: 8,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 11, color: '#A0AEC0' },
});
