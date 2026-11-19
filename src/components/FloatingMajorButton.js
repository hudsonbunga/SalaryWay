import React, { useRef, useState } from 'react';
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Pressable,
  View,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { RADIUS, SPACING, useAppTheme } from '../constants/theme';

/**
 * FloatingMajorButton
 * Standardized floating primary action button for SalaryWay.
 * Adheres strictly to the 4 operational requirements:
 *  1. Pressed: Immediate visual and tactile spring micro-interaction
 *  2. Loading: Extra taps ignored with debounce & loading spinner
 *  3. Opening / Executing: Reliable synchronous or asynchronous dispatch
 *  4. If fails: Catches errors and displays a clear, informative message
 * 
 * Sits pinned at the center-bottom thumb zone with notch & navigation bar awareness.
 * Text and icon are mathematically centered with zero Android font padding offset.
 */
export default function FloatingMajorButton({
  title,
  icon,
  iconSize = 15,
  onPress,
  backgroundColor,
  textColor,
  disabled = false,
  loading = false,
  bottomOffset,
  style,
  textStyle,
  testID,
}) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [internalLoading, setInternalLoading] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const isBusy = loading || internalLoading;

  const handlePressIn = () => {
    if (disabled || isBusy) return;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
        speed: 36,
        bounciness: 4,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.88,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 26,
        bounciness: 6,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = async () => {
    if (disabled || isBusy) return;

    // 2. Extra taps ignored during execution
    setInternalLoading(true);

    try {
      // 3. Opening or executing
      if (onPress) {
        await onPress();
      }
    } catch (err) {
      // 4. If fails showing a message
      const errorMsg =
        typeof err === 'string'
          ? err
          : err?.message || 'Unable to complete the action. Please try again.';
      Alert.alert('Action Failed', errorMsg);
    } finally {
      setInternalLoading(false);
    }
  };

  const resolvedBg = backgroundColor || theme.primary;
  const resolvedTextColor =
    textColor ||
    (resolvedBg === theme.primary && theme.fabIcon === '#091510' ? '#091510' : '#FFFFFF');

  const resolvedBottom =
    bottomOffset !== undefined ? bottomOffset : Math.max(insets.bottom, 16) + 10;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.floatingContainer,
        { bottom: resolvedBottom },
      ]}
    >
      <Pressable
        testID={testID}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || isBusy}
        hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
        style={styles.pressable}
      >
        <Animated.View
          style={[
            styles.button,
            {
              backgroundColor: resolvedBg,
              opacity: disabled ? 0.45 : opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
            style,
          ]}
        >
          {isBusy ? (
            <ActivityIndicator size="small" color={resolvedTextColor} />
          ) : (
            <View style={styles.contentRow}>
              {icon && (
                <View style={styles.iconWrapper}>
                  {typeof icon === 'string' ? (
                    <Feather name={icon} size={iconSize} color={resolvedTextColor} />
                  ) : (
                    icon
                  )}
                </View>
              )}
              <Text
                numberOfLines={1}
                style={[
                  styles.buttonText,
                  { color: resolvedTextColor },
                  textStyle,
                ]}
              >
                {title}
              </Text>
            </View>
          )}
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    height: 42,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 13.5,
    fontWeight: '600',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    letterSpacing: 0.2,
  },
});
