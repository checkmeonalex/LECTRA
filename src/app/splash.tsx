import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SplashScreen() {
  const scale   = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    // After 3 seconds, check login state and navigate
    const timer = setTimeout(async () => {
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(async () => {
        const saved = await AsyncStorage.getItem('student_data');
        if (saved) {
          router.replace('/(tabs)');
        } else {
          router.replace('/login');
        }
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={s.root}>
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <Image
          source={require('../../assets/images/app_icon-trans.png')}
          style={s.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 180,
    height: 180,
  },
});
