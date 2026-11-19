import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

/**
 * TactileTouch - Apple iOS-style spring micro-interaction
 * Provides subtle physics-based scale-down on press and spring-back on release.
 * Automatically propagates flex stretching to the outer Pressable container.
 */
export default function TactileTouch({
  children,
  onPress,
  style,
  containerStyle,
  scaleTo = 0.96,
  disabled = false,
  hitSlop,
  activeOpacity,
  ...props
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const flattenedStyle = StyleSheet.flatten(style) || {};
  const pressableStyle = {};

  if (flattenedStyle.position === 'absolute') {
    pressableStyle.position = 'absolute';
    if (flattenedStyle.top !== undefined) pressableStyle.top = flattenedStyle.top;
    if (flattenedStyle.bottom !== undefined) pressableStyle.bottom = flattenedStyle.bottom;
    if (flattenedStyle.left !== undefined) pressableStyle.left = flattenedStyle.left;
    if (flattenedStyle.right !== undefined) pressableStyle.right = flattenedStyle.right;
    if (flattenedStyle.zIndex !== undefined) pressableStyle.zIndex = flattenedStyle.zIndex;
    if (flattenedStyle.elevation !== undefined) pressableStyle.elevation = flattenedStyle.elevation;
  }

  if (flattenedStyle.flex !== undefined) {
    pressableStyle.flex = flattenedStyle.flex;
    if (flattenedStyle.minWidth !== undefined) pressableStyle.minWidth = flattenedStyle.minWidth;
    if (flattenedStyle.flexBasis !== undefined) pressableStyle.flexBasis = flattenedStyle.flexBasis;
  }

  if (flattenedStyle.width !== undefined) {
    pressableStyle.width = flattenedStyle.width;
  }
  if (flattenedStyle.alignSelf !== undefined) {
    pressableStyle.alignSelf = flattenedStyle.alignSelf;
  }

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: scaleTo,
      useNativeDriver: true,
      speed: 32,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 24,
      bounciness: 8,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      hitSlop={hitSlop}
      style={[pressableStyle, containerStyle]}
      {...props}
    >
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
