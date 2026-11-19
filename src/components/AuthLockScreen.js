import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { RADIUS, SPACING, useAppTheme } from '../constants/theme';
import { useFinanceStore } from '../store/useFinanceStore';
import TactileTouch from './TactileTouch';

export default function AuthLockScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const security = useFinanceStore((state) => state.security);
  const unlockApp = useFinanceStore((state) => state.unlockApp);

  const [enteredPin, setEnteredPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handlePressDigit = (digit) => {
    if (enteredPin.length >= 4) return;
    const nextPin = enteredPin + digit;
    setEnteredPin(nextPin);
    setErrorMessage('');

    if (nextPin.length === 4) {
      if (nextPin === security.pin) {
        unlockApp();
      } else {
        triggerShake();
        setErrorMessage('Incorrect PIN. Please try again.');
        setTimeout(() => {
          setEnteredPin('');
        }, 300);
      }
    }
  };

  const handleDelete = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setErrorMessage('');
  };

  const handleBiometricMock = () => {
    unlockApp();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          paddingTop: Math.max(insets.top, 28),
          paddingBottom: Math.max(insets.bottom, 24),
        },
      ]}
    >
      <StatusBar style={theme.statusBarStyle} backgroundColor={theme.statusBarBg} />
      
      {/* Brand Header */}
      <View style={styles.header}>
        <View style={[styles.logoCircle, { backgroundColor: theme.primary }]}>
          <Feather name="shield" size={24} color="#FFFFFF" />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>SalaryWay Security</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Enter your 4-digit PIN to access your vault
        </Text>
      </View>

      {/* 4-Digit Dots Indicator with Shake Animation */}
      <Animated.View
        style={[
          styles.dotsRow,
          { transform: [{ translateX: shakeAnim }] },
        ]}
      >
        {[0, 1, 2, 3].map((idx) => {
          const isFilled = enteredPin.length > idx;
          return (
            <View
              key={idx}
              style={[
                styles.dot,
                {
                  borderColor: isFilled ? theme.primary : theme.border,
                  backgroundColor: isFilled ? theme.primary : 'transparent',
                },
              ]}
            />
          );
        })}
      </Animated.View>

      {/* Error Message */}
      <Text style={[styles.errorText, { color: theme.danger }]}>
        {errorMessage || ' '}
      </Text>

      {/* 3x4 Material 3 Keypad with Apple-style Spring Feedback */}
      <View style={styles.keypad}>
        {[
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
        ].map((row, rIdx) => (
          <View key={rIdx} style={styles.keypadRow}>
            {row.map((digit) => (
              <TactileTouch
                key={digit}
                onPress={() => handlePressDigit(digit)}
                style={[
                  styles.keyBtn,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={[styles.keyDigit, { color: theme.text }]}>{digit}</Text>
              </TactileTouch>
            ))}
          </View>
        ))}

        {/* Bottom Keypad Row: Biometric, 0, Backspace */}
        <View style={styles.keypadRow}>
          <TactileTouch
            onPress={handleBiometricMock}
            style={[
              styles.keyBtn,
              {
                backgroundColor: 'transparent',
                borderColor: 'transparent',
              },
            ]}
          >
            <Feather name="user-check" size={24} color={theme.primaryText} />
          </TactileTouch>

          <TactileTouch
            onPress={() => handlePressDigit('0')}
            style={[
              styles.keyBtn,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.keyDigit, { color: theme.text }]}>0</Text>
          </TactileTouch>

          <TactileTouch
            onPress={handleDelete}
            style={[
              styles.keyBtn,
              {
                backgroundColor: 'transparent',
                borderColor: 'transparent',
              },
            ]}
          >
            <Feather name="delete" size={24} color={theme.text} />
          </TactileTouch>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginVertical: SPACING.xl,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: RADIUS.full,
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    height: 18,
  },
  keypad: {
    width: '100%',
    maxWidth: 320,
    marginBottom: SPACING.xl,
    gap: SPACING.md,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  keyBtn: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.full, // Material 3 circular elevated key
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  keyDigit: {
    fontSize: 26,
    fontWeight: '700',
  },
});
