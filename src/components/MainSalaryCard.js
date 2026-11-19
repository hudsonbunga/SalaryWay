import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, useAppTheme } from '../constants/theme';
import { formatINR } from '../services/financialCalc';
import ProgressBar from './ProgressBar';
import TactileTouch from './TactileTouch';

export default function MainSalaryCard({
  salaryPaise,
  totalSpentPaise,
  totalAllocatedPaise,
  onEditSalary,
  onPress,
}) {
  const theme = useAppTheme();
  const remainingBudget = salaryPaise - totalSpentPaise;
  const isOverspent = remainingBudget < 0;
  const percentUsed = salaryPaise > 0 ? (totalSpentPaise / salaryPaise) * 100 : 0;

  const CardWrapper = onPress ? TactileTouch : View;
  const wrapperProps = onPress
    ? {
        onPress,
        scaleTo: 0.98,
        style: [
          styles.card,
          {
            backgroundColor: theme.heroCardBg,
            borderColor: theme.heroCardBorder,
          },
        ],
      }
    : {
        style: [
          styles.card,
          {
            backgroundColor: theme.heroCardBg,
            borderColor: theme.heroCardBorder,
          },
        ],
      };

  return (
    <CardWrapper {...wrapperProps}>
      {/* Top Tag & Insights Pill */}
      <View style={styles.topRow}>
        <View style={[styles.badge, { backgroundColor: theme.salaryPillBg }]}>
          <Text style={[styles.badgeText, { color: theme.salaryPillText }]}>
            MONTHLY SALARY
          </Text>
        </View>

        {onPress && (
          <View style={styles.insightBadge}>
            <Text style={[styles.insightBadgeText, { color: theme.primaryText }]}>
              Insights
            </Text>
            <Feather name="chevron-right" size={13} color={theme.primaryText} />
          </View>
        )}
      </View>

      {/* Big Salary Figure */}
      <View style={styles.salaryRow}>
        <Text style={[styles.salaryAmount, { color: theme.salaryFigure }]}>
          {formatINR(salaryPaise)}
        </Text>
        <Text style={[styles.currencySubtitle, { color: theme.textSecondary }]}>
          100% Directed
        </Text>
      </View>

      {/* Progress Bar of Overall Budget */}
      <View style={styles.progressRow}>
        <ProgressBar
          progress={percentUsed}
          color={theme.primary}
          height={8}
          isOverspent={isOverspent}
        />
      </View>

      {/* 3 Metric Columns: Allocated, Spent, Remaining */}
      <View style={[styles.metricsContainer, { borderTopColor: theme.border }]}>
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: theme.metricLabel }]}>
            Allocated
          </Text>
          <Text style={[styles.metricValue, { color: theme.text }]}>
            {formatINR(totalAllocatedPaise)}
          </Text>
        </View>

        <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />

        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: theme.metricLabel }]}>
            Total Spent
          </Text>
          <Text style={[styles.metricValue, { color: theme.text }]}>
            {formatINR(totalSpentPaise)}
          </Text>
        </View>

        <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />

        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: theme.metricLabel }]}>
            Remaining
          </Text>
          <Text
            style={[
              styles.metricValue,
              { color: isOverspent ? theme.danger : theme.text },
            ]}
          >
            {formatINR(remainingBudget)}
          </Text>
        </View>
      </View>
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: SPACING.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: RADIUS.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  insightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  insightBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  salaryRow: {
    marginVertical: SPACING.sm,
  },
  salaryAmount: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  currencySubtitle: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  progressRow: {
    marginVertical: SPACING.md,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 28,
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
  },
});
