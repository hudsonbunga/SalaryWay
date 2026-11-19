import React, { useEffect, useRef } from 'react';
import {
  Text,
  StyleSheet,
  Animated,
  Pressable,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFinanceStore } from '../store/useFinanceStore';
import { RADIUS, SPACING, useAppTheme } from '../constants/theme';

export default function SleekToast() {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const toast = useFinanceStore((state) => state.toast);
  const hideToast = useFinanceStore((state) => state.hideToast);

  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    if (toast) {
      if (timerRef.current) clearTimeout(timerRef.current);

      // Slide in from top with Apple-style spring
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          speed: 26,
          bounciness: 6,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();

      const duration = toast.duration || 3000;
      timerRef.current = setTimeout(() => {
        dismiss();
      }, duration);
    } else {
      translateY.setValue(-80);
      opacity.setValue(0);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -80,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      hideToast();
    });
  };

  if (!toast) return null;

  const isDark = theme.isDark;
  const type = toast.type || 'info';

  let iconName = 'info';
  let iconColor = theme.primary;
  let bg = isDark ? '#1C1F24' : '#FFFFFF';
  let border = isDark ? '#2B3038' : '#E5E7EB';

  if (type === 'error' || type === 'warning' || type === 'required') {
    iconName = 'alert-circle';
    iconColor = isDark ? '#F87171' : '#DC2626';
    bg = isDark ? '#2A1618' : '#FEF2F2';
    border = isDark ? '#5C2328' : '#FECACA';
  } else if (type === 'success') {
    iconName = 'check-circle';
    iconColor = isDark ? '#34D399' : '#059669';
    bg = isDark ? '#132E25' : '#ECFDF5';
    border = isDark ? '#065F46' : '#A7F3D0';
  }

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.overlayContainer,
        {
          top: Math.max(insets.top, 24) + 6,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Pressable onPress={dismiss} style={styles.pressable}>
        <View
          style={[
            styles.toastCard,
            {
              backgroundColor: bg,
              borderColor: border,
            },
          ]}
        >
          <View style={[styles.iconWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
            <Feather name={iconName} size={18} color={iconColor} />
          </View>
          <View style={styles.textContainer}>
            {toast.title ? (
              <Text style={[styles.toastTitle, { color: isDark ? '#F3F4F6' : '#111827' }]}>
                {toast.title}
              </Text>
            ) : null}
            <Text
              style={[
                styles.toastMessage,
                { color: isDark ? '#D1D5DB' : '#374151' },
              ]}
              numberOfLines={2}
            >
              {toast.message}
            </Text>
          </View>
          <Feather name="x" size={14} color={isDark ? '#6B7280' : '#9CA3AF'} style={styles.closeIcon} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    left: SPACING.lg,
    right: SPACING.lg,
    alignItems: 'center',
    zIndex: 99999,
    elevation: 99999,
  },
  pressable: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  toastCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 8,
    gap: 10,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  toastMessage: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  closeIcon: {
    marginLeft: 4,
  },
});
