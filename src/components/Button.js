import React, { useRef } from 'react';
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Pressable,
} from 'react-native';
import { RADIUS, SPACING, useAppTheme } from '../constants/theme';

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}) {
  const theme = useAppTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 24,
      bounciness: 6,
    }).start();
  };

  const getContainerStyle = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: theme.isDark ? '#1C2433' : theme.primaryLight,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: theme.border,
        };
      case 'danger':
        return {
          backgroundColor: theme.danger,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      default:
        return {
          backgroundColor: theme.primary,
        };
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return {
          color: theme.primaryText,
          fontWeight: '700',
        };
      case 'outline':
        return {
          color: theme.text,
          fontWeight: '600',
        };
      case 'danger':
        return {
          color: '#FFFFFF',
          fontWeight: '700',
        };
      case 'ghost':
        return {
          color: theme.primaryText,
          fontWeight: '600',
        };
      default:
        return {
          color: theme.fabIcon === '#091510' ? '#091510' : '#FFFFFF',
          fontWeight: '700',
        };
    }
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
    >
      <Animated.View
        style={[
          styles.base,
          styles[size],
          getContainerStyle(),
          disabled && styles.disabled,
          { transform: [{ scale: scaleAnim }] },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            color={variant === 'primary' ? (theme.fabIcon === '#091510' ? '#091510' : '#FFF') : theme.primary}
            size="small"
          />
        ) : (
          <>
            {icon}
            <Text style={[styles.baseText, getTextStyle(), textStyle]}>{title}</Text>
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.full, // Material 3 rounded stadium pill
    gap: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sm: {
    paddingVertical: SPACING.xs + 3,
    paddingHorizontal: SPACING.md,
  },
  md: {
    paddingVertical: 11,
    paddingHorizontal: SPACING.lg,
  },
  lg: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  disabled: {
    opacity: 0.45,
    elevation: 0,
    shadowOpacity: 0,
  },
  baseText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    includeFontPadding: false,
    letterSpacing: 0.2,
  },
});
