import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RADIUS, useAppTheme } from '../constants/theme';

export default function ProgressBar({
  progress = 0,
  color,
  height = 8,
  style,
  isOverspent = false,
}) {
  const theme = useAppTheme();
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  const activeColor = isOverspent
    ? (theme.isDark ? '#EF4444' : theme.danger)
    : (color || theme.primary);

  return (
    <View
      style={[
        styles.track,
        {
          height,
          backgroundColor: theme.trackBg,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress}%`,
            backgroundColor: activeColor,
            height,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: RADIUS.full,
  },
});
