import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { portalLogin } from '@/services/portal';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [matric, setMatric] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!matric.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter your matric number and password.');
      return;
    }
    setLoading(true);
    try {
      const data = await portalLogin(matric.trim(), password);
      await AsyncStorage.setItem('student_data', JSON.stringify(data));
      router.replace('/dashboard');
    } catch (err: any) {
      Alert.alert('Login Failed', err.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0f1923" />

      {/* ── decorative blobs ── */}
      <View style={[styles.blob, { width: 44, height: 44, backgroundColor: '#F472B6', top: 90, left: 44, opacity: 0.85 }]} />
      <View style={[styles.blob, { width: 32, height: 32, backgroundColor: '#6EE7B7', top: 72, right: 68, opacity: 0.85 }]} />
      <View style={[styles.blob, { width: 18, height: 18, backgroundColor: '#F472B6', top: 210, right: 36, opacity: 0.6 }]} />
      <View style={[styles.blob, { width: 14, height: 14, backgroundColor: '#6EE7B7', top: 270, left: 24, opacity: 0.55 }]} />
      <View style={[styles.blob, { width: 10, height: 10, backgroundColor: '#6EE7B7', top: 160, left: 110, opacity: 0.4 }]} />

      {/* ── avatar cluster ── */}
      <View style={styles.avatarCluster}>
        <View style={[styles.avatarBubble, styles.avatarLeft]}>
          <Text style={styles.avatarEmoji}>👦🏽</Text>
        </View>
        <View style={[styles.avatarBubble, styles.avatarRight]}>
          <Text style={styles.avatarEmoji}>👧🏻</Text>
        </View>
        <View style={[styles.avatarBubble, styles.avatarCenter]}>
          <Text style={styles.avatarEmoji}>👧🏽</Text>
        </View>
        <View style={styles.labelBadge}>
          <Text style={styles.labelText}>Dei</Text>
        </View>
      </View>

      {/* ── heading ── */}
      <Text style={styles.heading}>{"Let's get you\nsigned in!"}</Text>

      {/* ── bottom card ── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.cardWrap}
      >
        <View style={styles.card}>
          {/* matric field */}
          <View style={styles.field}>
            <TextInput
              style={[styles.fieldInput, { flex: 1 }]}
              placeholder="Matric Number"
              placeholderTextColor="#BCBCBC"
              autoCapitalize="characters"
              underlineColorAndroid="transparent"
              selectionColor="#111827"
              value={matric}
              onChangeText={setMatric}
            />
          </View>

          {/* password field */}
          <View style={styles.field}>
            <TextInput
              style={[styles.fieldInput, { flex: 1 }]}
              placeholder="Password"
              placeholderTextColor="#BCBCBC"
              secureTextEntry={!showPassword}
              underlineColorAndroid="transparent"
              selectionColor="#111827"
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {/* forgot password */}
          <TouchableOpacity activeOpacity={0.7} style={styles.forgotWrap}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        {/* sign in button lives outside the white card, at the very bottom */}
        <TouchableOpacity style={styles.signInBtn} activeOpacity={0.85} onPress={handleSignIn} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.signInText}>Sign In</Text>}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}

const CARD_RADIUS = 32;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f1923',
  },

  /* blobs */
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },

  /* avatar cluster */
  avatarCluster: {
    alignItems: 'center',
    marginTop: 110,
    height: 140,
  },
  avatarBubble: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1e2d3d',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#0f1923',
  },
  avatarEmoji: {
    fontSize: 36,
  },
  avatarLeft: {
    top: 0,
    left: width / 2 - 80,
  },
  avatarRight: {
    top: 0,
    left: width / 2 + 8,
  },
  avatarCenter: {
    top: 44,
    left: width / 2 - 36,
    zIndex: 2,
  },
  labelBadge: {
    position: 'absolute',
    top: 116,
    left: width / 2 - 20,
    backgroundColor: '#1e2d3d',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  labelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  /* heading */
  heading: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 42,
    marginTop: 24,
    marginBottom: 32,
    letterSpacing: -0.3,
  },

  /* card */
  cardWrap: {
    flex: 1,
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 0,
  },

  /* input fields */
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 14,
  },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    color: '#111',
    outlineWidth: 0,
  },
  eyeIcon: {
    fontSize: 18,
    paddingLeft: 8,
  },

  /* forgot */
  forgotWrap: {
    alignItems: 'center',
    marginTop: 4,
  },
  forgotText: {
    fontSize: 13,
    color: '#888',
  },

  /* sign in button */
  signInBtn: {
    backgroundColor: '#111827',
    marginHorizontal: 0,
    paddingVertical: 18,
    alignItems: 'center',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  signInText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
