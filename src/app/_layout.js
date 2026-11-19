import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFinanceStore } from '../store/useFinanceStore';
import { useAppTheme, RADIUS } from '../constants/theme';
import AuthLockScreen from '../components/AuthLockScreen';
import SleekToast from '../components/SleekToast';

export default function RootLayout() {
  const initializeStore = useFinanceStore((state) => state.initializeStore);
  const security = useFinanceStore((state) => state.security);
  const theme = useAppTheme();

  const [showSplash, setShowSplash] = useState(true);
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(12)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const splashFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    initializeStore();

    // 9. Startup Logo, App Name, and Subtitle Sequence Animations
    Animated.sequence([
      Animated.spring(logoScale, {
        toValue: 1,
        speed: 20,
        bounciness: 8,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(titleY, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(400),
      Animated.timing(splashFade, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSplash(false);
    });
  }, []);

  // 4. First the full-screen loading/splash page with logo, name, and subtitle animation, then reveal app
  if (showSplash) {
    return (
      <SafeAreaProvider>
        <StatusBar style={theme.statusBarStyle} backgroundColor={theme.statusBarBg} />
        <View style={[styles.splashContainer, { backgroundColor: theme.background }]}>
          <Animated.View
            style={[
              styles.splashCenterContent,
              { opacity: splashFade },
            ]}
          >
            <Animated.View
              style={[
                styles.splashLogoBox,
                { backgroundColor: theme.primary, transform: [{ scale: logoScale }] },
              ]}
            >
              <Feather name="trending-up" size={38} color="#FFFFFF" />
            </Animated.View>

            <Animated.Text
              style={[
                styles.splashTitle,
                {
                  color: theme.text,
                  opacity: titleOpacity,
                  transform: [{ translateY: titleY }],
                },
              ]}
            >
              SalaryWay
            </Animated.Text>

            <Animated.Text
              style={[
                styles.splashSubtitle,
                { color: theme.tagline, opacity: subtitleOpacity },
              ]}
            >
              Give Every Rupee a Direction
            </Animated.Text>
          </Animated.View>
        </View>
      </SafeAreaProvider>
    );
  }

  // Adaptive System Dark Mode Authentication / PIN Lock Screen
  if (security?.pinEnabled && !security?.isUnlocked) {
    return (
      <SafeAreaProvider>
        <AuthLockScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={theme.statusBarStyle} backgroundColor={theme.statusBarBg} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          animation: 'slide_from_right', // Apple iOS-style push slide
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="category/[id]"
          options={{
            presentation: 'card',
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="modal/add-transaction"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="modal/edit-salary"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="modal/pay-upi"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="modal/export-statement"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="modal/add-lent"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="modal/daily-safe-spend"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
      <SleekToast />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashCenterContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogoBox: {
    width: 76,
    height: 76,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 16,
  },
  splashTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  splashSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 6,
    letterSpacing: 0.3,
  },
});
