import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, Dimensions, Image,
  KeyboardAvoidingView, Platform, ActivityIndicator, Animated, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { portalLogin } from '@/services/portal';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [matric,       setMatric]       = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [fieldError,   setFieldError]   = useState<'matric' | 'password' | null>(null);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  // floating bubbles
  const b1y = useRef(new Animated.Value(0)).current;
  const b2y = useRef(new Animated.Value(0)).current;
  const b3y = useRef(new Animated.Value(0)).current;
  const b4y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    function float(anim: Animated.Value, dist: number, dur: number) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: -dist, duration: dur,     useNativeDriver: true, }),
          Animated.timing(anim, { toValue:  dist, duration: dur,     useNativeDriver: true, }),
          Animated.timing(anim, { toValue:  0,    duration: dur / 2, useNativeDriver: true, }),
        ])
      ).start();
    }
    float(b1y, 10, 2200);
    float(b2y, 14, 2800);
    float(b3y, 8,  1900);
    float(b4y, 12, 3100);
  }, []);

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8,   duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8,  duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 40, useNativeDriver: true }),
    ]).start();
  }

  async function handleSignIn() {
    setError('');
    setFieldError(null);

    if (!matric.trim()) {
      setFieldError('matric');
      setError('Please enter your matric number.');
      shake(); return;
    }
    if (!password.trim()) {
      setFieldError('password');
      setError('Please enter your password.');
      shake(); return;
    }

    setLoading(true);
    try {
      const data = await portalLogin(matric.trim(), password);
      await AsyncStorage.setItem('student_data', JSON.stringify(data));
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err.message ?? 'Something went wrong. Please try again.';
      setError(msg);
      shake();
    } finally {
      setLoading(false);
    }
  }

  function clearError() {
    setError('');
    setFieldError(null);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* animated floating bubbles */}
      <Animated.View style={[styles.blob, { width: 44, height: 44, backgroundColor: '#F472B6', top: 90,  left: 40,  opacity: 0.85, transform: [{ translateY: b1y }] }]} />
      <Animated.View style={[styles.blob, { width: 32, height: 32, backgroundColor: '#6EE7B7', top: 68,  right: 60, opacity: 0.85, transform: [{ translateY: b2y }] }]} />
      <Animated.View style={[styles.blob, { width: 18, height: 18, backgroundColor: '#F472B6', top: 220, right: 32, opacity: 0.6,  transform: [{ translateY: b3y }] }]} />
      <Animated.View style={[styles.blob, { width: 14, height: 14, backgroundColor: '#6EE7B7', top: 260, left: 22,  opacity: 0.55, transform: [{ translateY: b4y }] }]} />

      {/* logo */}
      <View style={styles.logoWrap}>
        <View style={styles.logoGlow} />
        <Image
          source={require('../../assets/images/logo-trans.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.heading}>{"Let's get you\nsigned in!"}</Text>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.cardWrap}
      >
        <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>

          {/* ── inline error banner ── */}
          {!!error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText} numberOfLines={3}>{error}</Text>
              <TouchableOpacity onPress={clearError} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}

          {/* matric field */}
          <Text style={styles.label}>Matric Number</Text>
          <View style={[styles.field, fieldError === 'matric' && styles.fieldError]}>
            <Ionicons name="id-card-outline" size={18} color={fieldError === 'matric' ? '#EF4444' : '#BCBCBC'} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. 230805075"
              placeholderTextColor="#BCBCBC"
              autoCapitalize="characters"
              underlineColorAndroid="transparent"
              selectionColor="#111827"
              value={matric}
              onChangeText={v => { setMatric(v); clearError(); }}
            />
          </View>

          {/* password field */}
          <Text style={styles.label}>Password</Text>
          <View style={[styles.field, fieldError === 'password' && styles.fieldError]}>
            <Ionicons name="lock-closed-outline" size={18} color={fieldError === 'password' ? '#EF4444' : '#BCBCBC'} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.fieldInput}
              placeholder="Your portal password"
              placeholderTextColor="#BCBCBC"
              secureTextEntry={!showPassword}
              underlineColorAndroid="transparent"
              selectionColor="#111827"
              value={password}
              onChangeText={v => { setPassword(v); clearError(); }}
            />
            <TouchableOpacity onPress={() => setShowPassword(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>

        <TouchableOpacity activeOpacity={0.7} style={styles.forgotWrap} onPress={() => Linking.openURL('https://t.me/yabatechsupport')}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.signInBtn, loading && { opacity: 0.75 }]}
          activeOpacity={0.85}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.signInText}>Signing in…</Text>
            </View>
          ) : (
            <Text style={styles.signInText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}

const CARD_RADIUS = 32;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f1923' },

  blob: { position: 'absolute', borderRadius: 999 },

  logoWrap: {
    alignItems: 'center', justifyContent: 'center',
    marginTop: 64, marginBottom: 4,
  },
  logoGlow: {
    position: 'absolute',
    width: 210, height: 210, borderRadius: 105,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  logo: {
    width: 180, height: 180,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  heading: {
    color: '#ffffff', fontSize: 30, fontWeight: '800',
    textAlign: 'center', lineHeight: 40,
    marginTop: 16, marginBottom: 24, letterSpacing: -0.3,
  },

  cardWrap: { flex: 1, justifyContent: 'flex-end' },
  card: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: CARD_RADIUS, borderTopRightRadius: CARD_RADIUS,
    paddingHorizontal: 24, paddingTop: 22, paddingBottom: 4,
  },

  // error banner
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: 10,
    borderWidth: 1, borderColor: '#FECACA',
    paddingHorizontal: 12, paddingVertical: 8,
    marginBottom: 10,
  },
  errorText: { flex: 1, fontSize: 12, color: '#DC2626', lineHeight: 17 },

  label: {
    fontSize: 11, fontWeight: '700', color: '#6B7280',
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginBottom: 4,
  },
  field: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F5F5F5', borderRadius: 12,
    paddingHorizontal: 12, height: 48,
    marginBottom: 10,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  fieldError: {
    borderColor: '#EF4444', backgroundColor: '#FFF5F5',
  },
  fieldInput: {
    flex: 1, fontSize: 15, color: '#111',
    outlineWidth: 0,
  } as any,

  forgotWrap: { alignItems: 'center', paddingVertical: 10 },
  forgotText: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },

  signInBtn: {
    backgroundColor: '#111827', paddingVertical: 16,
    alignItems: 'center',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  signInText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});
