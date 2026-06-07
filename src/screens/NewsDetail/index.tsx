import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, StatusBar, Linking, Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BACKEND_URL from '@/constants/api';
import { useAppTheme } from '@/context/AppThemeContext';

interface Article {
  title: string;
  date: string;
  category: string;
  image: string | null;
  paragraphs: string[];
  url: string;
}

export default function NewsDetail() {
  const { url } = useLocalSearchParams<{ url: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const { accent } = useAppTheme();

  useEffect(() => {
    if (!url) return;
    fetch(`${BACKEND_URL}/article?url=${encodeURIComponent(url)}`)
      .then(r => r.json())
      .then(d => {
        if (d.title) setArticle(d);
        else setError(d.message ?? 'Failed to load article.');
      })
      .catch(() => setError('Could not load article.'))
      .finally(() => setLoading(false));
  }, [url]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0D2137" />

      {/* top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>School News</Text>
        {article?.url ? (
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={() => Linking.openURL(article.url)}
            activeOpacity={0.8}
          >
            <Ionicons name="open-outline" size={18} color={accent} />
          </TouchableOpacity>
        ) : <View style={styles.shareBtn} />}
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={accent} />
          <Text style={styles.loadingText}>Loading article…</Text>
        </View>
      )}

      {!!error && !loading && (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#CBD5E0" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryText}>Go back</Text>
          </TouchableOpacity>
        </View>
      )}

      {article && !loading && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* hero image */}
          {article.image ? (
            <Image source={{ uri: article.image }} style={styles.heroImg} resizeMode="cover" />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="newspaper-outline" size={48} color="rgba(255,255,255,0.3)" />
            </View>
          )}

          {/* article content card */}
          <View style={styles.contentCard}>
            {/* category + date row */}
            <View style={styles.metaRow}>
              {!!article.category && (
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryText}>{article.category}</Text>
                </View>
              )}
              {!!article.date && (
                <View style={styles.dateRow}>
                  <Ionicons name="time-outline" size={12} color="#A0AEC0" />
                  <Text style={styles.dateText}>{article.date}</Text>
                </View>
              )}
            </View>

            {/* title */}
            <Text style={styles.title}>{article.title}</Text>

            {/* divider */}
            <View style={styles.divider} />

            {/* body paragraphs */}
            {article.paragraphs.map((para, i) => (
              <Text key={i} style={styles.para}>{para}</Text>
            ))}

            {/* open in browser */}
            <TouchableOpacity
              style={styles.openBrowserBtn}
              onPress={() => Linking.openURL(article.url)}
              activeOpacity={0.8}
            >
              <Ionicons name="globe-outline" size={15} color={accent} />
              <Text style={styles.openBrowserText}>Open full article in browser</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D2137' },

  /* top bar */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 52 : 40,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: '#0D2137',
    gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  topBarTitle: {
    flex: 1, color: '#fff', fontSize: 16, fontWeight: '700',
  },
  shareBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(78,205,196,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },

  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 12, padding: 32,
  },
  loadingText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  errorText:   { color: '#A0AEC0', fontSize: 14, textAlign: 'center' },
  retryBtn: {
    marginTop: 8, paddingHorizontal: 24, paddingVertical: 10,
    backgroundColor: '#14B8A6', borderRadius: 20,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  scroll: { flexGrow: 1 },

  heroImg: { width: '100%', height: 240 },
  heroPlaceholder: {
    width: '100%', height: 180,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },

  /* content card floats over dark header */
  contentCard: {
    flex: 1,
    backgroundColor: '#F7F8FA',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingHorizontal: 22,
    paddingTop: 28,
  },

  metaRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, marginBottom: 14,
  },
  categoryPill: {
    backgroundColor: '#ECFDF8',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
  },
  categoryText: { color: '#14B8A6', fontSize: 11, fontWeight: '700' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dateText: { color: '#A0AEC0', fontSize: 12 },

  title: {
    fontSize: 20, fontWeight: '800', color: '#1A202C',
    lineHeight: 28, letterSpacing: -0.3, marginBottom: 18,
  },

  divider: {
    height: 1, backgroundColor: '#E8ECF0', marginBottom: 20,
  },

  para: {
    fontSize: 15, color: '#4A5568',
    lineHeight: 26, marginBottom: 16,
  },

  openBrowserBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 8, paddingVertical: 14,
    borderTopWidth: 1, borderColor: '#E8ECF0',
  },
  openBrowserText: { fontSize: 13, fontWeight: '600', color: '#14B8A6' },
});
