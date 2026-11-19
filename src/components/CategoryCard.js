import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { RADIUS, SPACING, useAppTheme } from '../constants/theme';
import { formatINR } from '../services/financialCalc';
import ProgressBar from './ProgressBar';

export default function CategoryCard({ category, balance, onPress }) {
  const theme = useAppTheme();
  const { allocated, spent, remaining, percentUsed } = balance;
  const isOverspent = remaining < 0;

  // Dynamic category icon colors according to theme
  const iconBg = theme.isDark ? (theme[`${category.id}Light`] || '#1C2433') : category.colorLight;
  const iconColor = theme.isDark ? (theme[category.id] || category.color) : category.color;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.container,
        {
          backgroundColor: isOverspent ? theme.overspentBg : theme.surface,
          borderColor: isOverspent ? theme.overspentBorder : theme.border,
        },
      ]}
      onPress={onPress}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.leftHeader}>
          <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
            <Feather name={category.icon} size={18} color={iconColor} />
          </View>
          <View>
            <Text style={[styles.categoryName, { color: theme.text }]}>{category.name}</Text>
            <Text style={[styles.percentageText, { color: theme.textSecondary }]}>
              {category.defaultPercent}% allocated
            </Text>
          </View>
        </View>

        <View style={styles.rightHeader}>
          <Text
            style={[
              styles.remainingAmount,
              { color: isOverspent ? theme.danger : theme.text },
            ]}
          >
            {formatINR(remaining)}
          </Text>
          <Text
            style={[
              styles.remainingLabel,
              { color: isOverspent ? theme.danger : theme.textSecondary },
            ]}
          >
            {isOverspent ? 'Over budget' : 'Remaining'}
          </Text>
        </View>
      </View>

      {/* Overspending banner if applicable */}
      {isOverspent && (
        <View
          style={[
            styles.warningBanner,
            {
              backgroundColor: theme.isDark ? '#2A1618' : '#FEF2F2',
              borderColor: theme.isDark ? '#5C2328' : '#FECACA',
            },
          ]}
        >
          <Feather name="alert-circle" size={13} color={theme.danger} />
          <Text style={[styles.warningText, { color: theme.danger }]}>
            Overspent by {formatINR(Math.abs(remaining))}
          </Text>
        </View>
      )}

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <ProgressBar
          progress={percentUsed}
          color={iconColor}
          height={6}
          isOverspent={isOverspent}
        />
      </View>

      {/* Bottom Metrics */}
      <View style={styles.footer}>
        <Text style={[styles.metricText, { color: theme.textSecondary }]}>
          Spent:{' '}
          <Text style={[styles.metricValue, { color: theme.text }]}>
            {formatINR(spent)}
          </Text>
        </Text>
        <Text style={[styles.metricText, { color: theme.textSecondary }]}>
          Budget:{' '}
          <Text style={[styles.metricValue, { color: theme.text }]}>
            {formatINR(allocated)}
          </Text>
        </Text>
        <Text
          style={[
            styles.metricText,
            {
              color: isOverspent ? theme.danger : theme.textSecondary,
              fontWeight: isOverspent ? '700' : '500',
            },
          ]}
        >
          {Math.round(percentUsed)}%
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700',
  },
  percentageText: {
    fontSize: 12,
    marginTop: 1,
  },
  rightHeader: {
    alignItems: 'flex-end',
  },
  remainingAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
  remainingLabel: {
    fontSize: 11,
    marginTop: 1,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
    marginVertical: SPACING.xs,
  },
  warningText: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressSection: {
    marginVertical: SPACING.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  metricText: {
    fontSize: 12,
  },
  metricValue: {
    fontWeight: '700',
  },
});
