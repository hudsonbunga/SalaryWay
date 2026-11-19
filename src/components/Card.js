import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RADIUS, SPACING, useAppTheme } from '../constants/theme';

export default function Card({ children, style, variant = 'default' }) {
  const theme = useAppTheme();

  const getVariantStyle = () => {
    switch (variant) {
      case 'outlined':
        return {
          borderWidth: 1.5,
          borderColor: theme.border,
          backgroundColor: theme.surface,
        };
      case 'elevated':
        return {
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.surface,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: theme.isDark ? 0.3 : 0.06,
          shadowRadius: 10,
          elevation: 3,
        };
      default:
        return {
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.surface,
        };
    }
  };

  return <View style={[styles.card, getVariantStyle(), style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.xl, // Modern curved Material 3 card corners
    padding: SPACING.lg,
  },
});
