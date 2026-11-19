import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFinanceStore } from '../../store/useFinanceStore';
import { CATEGORIES, SPACING, RADIUS, useAppTheme } from '../../constants/theme';
import { formatINR } from '../../services/financialCalc';
import ProgressBar from '../../components/ProgressBar';
import MonthSelector from '../../components/MonthSelector';
import TactileTouch from '../../components/TactileTouch';

export default function InsightsScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const currentMonthKey = useFinanceStore((state) => state.currentMonthKey);
  const setCurrentMonth = useFinanceStore((state) => state.setCurrentMonth);
  const getCurrentMonthData = useFinanceStore((state) => state.getCurrentMonthData);

  const monthData = getCurrentMonthData();
  const { salaryPaise, allocations, transactions } = monthData;

  // Compute category spends
  const categorySpends = {};
  CATEGORIES.forEach((cat) => {
    categorySpends[cat.id] = 0;
  });

  let totalSpentPaise = 0;
  transactions.forEach((tx) => {
    if (tx.type === 'expense') {
      categorySpends[tx.category] = (categorySpends[tx.category] || 0) + tx.amountPaise;
      totalSpentPaise += tx.amountPaise;
    } else if (tx.type === 'refund') {
      categorySpends[tx.category] = (categorySpends[tx.category] || 0) - tx.amountPaise;
      totalSpentPaise -= tx.amountPaise;
    }
  });

  // Highest spending category
  let highestCat = CATEGORIES[0];
  let highestAmount = 0;
  CATEGORIES.forEach((cat) => {
    if (categorySpends[cat.id] > highestAmount) {
      highestAmount = categorySpends[cat.id];
      highestCat = cat;
    }
  });

  // Savings rate
  const savingsSpent = categorySpends['savings'] || 0;
  const savingsRate = salaryPaise > 0 ? ((savingsSpent / salaryPaise) * 100).toFixed(1) : 0;

  // Daily average
  const daysInMonth = 30;
  const dailyAveragePaise = Math.round(totalSpentPaise / daysInMonth);

  // Overall budget utilization
  const budgetUtilization = salaryPaise > 0 ? ((totalSpentPaise / salaryPaise) * 100).toFixed(1) : 0;

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: Math.max(insets.top, 28) }]}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <View style={styles.headerLeft}>
          <TactileTouch
            onPress={() => router.replace('/(tabs)')}
            style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Feather name="arrow-left" size={18} color={theme.text} />
          </TactileTouch>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Financial Insights</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Analytics & Discipline</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + SPACING.xl }]}
      >
        <MonthSelector
          currentMonthKey={currentMonthKey}
          onSelectMonth={setCurrentMonth}
        />

        {/* 4 Summary Stats Grid */}
        <View style={styles.statsGrid}>
          <View
            style={[
              styles.statBox,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={[styles.statIconBox, { backgroundColor: theme.isDark ? '#132E25' : theme.primaryLight }]}>
              <Feather name="activity" size={16} color={theme.primary} />
            </View>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Spent</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{formatINR(totalSpentPaise)}</Text>
            <Text style={[styles.statSub, { color: theme.textSecondary }]}>{budgetUtilization}% of salary</Text>
          </View>

          <View
            style={[
              styles.statBox,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={[styles.statIconBox, { backgroundColor: theme.isDark ? '#132E25' : '#E6F7F3' }]}>
              <Feather name="trending-up" size={16} color={theme.primaryText} />
            </View>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Savings Rate</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{savingsRate}%</Text>
            <Text style={[styles.statSub, { color: theme.textSecondary }]}>{formatINR(savingsSpent)} saved</Text>
          </View>

          <View
            style={[
              styles.statBox,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={[styles.statIconBox, { backgroundColor: theme.isDark ? '#252A32' : '#F3F4F6' }]}>
              <Feather name="calendar" size={16} color={theme.text} />
            </View>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Daily Average</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{formatINR(dailyAveragePaise)}</Text>
            <Text style={[styles.statSub, { color: theme.textSecondary }]}>Per day spend</Text>
          </View>

          <View
            style={[
              styles.statBox,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View
              style={[
                styles.statIconBox,
                {
                  backgroundColor: theme.isDark
                    ? (theme[`${highestCat.id}Light`] || '#182635')
                    : highestCat.colorLight,
                },
              ]}
            >
              <Feather
                name={highestCat.icon}
                size={16}
                color={theme.isDark ? (theme[highestCat.id] || highestCat.color) : highestCat.color}
              />
            </View>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Top Expense</Text>
            <Text style={[styles.statValue, { color: theme.text }]} numberOfLines={1}>
              {highestCat.name.split(' ')[0]}
            </Text>
            <Text style={[styles.statSub, { color: theme.textSecondary }]}>{formatINR(highestAmount)}</Text>
          </View>
        </View>

        {/* Intelligent Financial Feedback */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.text }]}>Smart Recommendations</Text>

          <View style={[styles.tipItem, { borderBottomColor: theme.border }]}>
            <Feather name="check-circle" size={18} color={theme.primary} />
            <View style={styles.tipTextContainer}>
              <Text style={[styles.tipTitle, { color: theme.text }]}>Savings Discipline</Text>
              <Text style={[styles.tipBody, { color: theme.textSecondary }]}>
                You allocated {formatINR(allocations.savings || 0)} to savings this month.
                Every rupee has a destination!
              </Text>
            </View>
          </View>

          <View style={[styles.tipItem, { borderBottomColor: theme.border }]}>
            <Feather
              name={
                (categorySpends.lifestyle || 0) > (allocations.lifestyle || 0)
                  ? 'alert-circle'
                  : 'smile'
              }
              size={18}
              color={
                (categorySpends.lifestyle || 0) > (allocations.lifestyle || 0)
                  ? theme.danger
                  : '#A78BFA'
              }
            />
            <View style={styles.tipTextContainer}>
              <Text style={[styles.tipTitle, { color: theme.text }]}>Lifestyle Check</Text>
              <Text style={[styles.tipBody, { color: theme.textSecondary }]}>
                Lifestyle expenses are at{' '}
                {allocations.lifestyle > 0
                  ? Math.round(((categorySpends.lifestyle || 0) / allocations.lifestyle) * 100)
                  : 0}
                % of budget. Target is 5% of monthly salary.
              </Text>
            </View>
          </View>
        </View>

        {/* Category Breakdown Bars */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.text }]}>Category Breakdown</Text>

          {CATEGORIES.map((cat) => {
            const allocated = allocations[cat.id] || 0;
            const spent = categorySpends[cat.id] || 0;
            const pct = allocated > 0 ? (spent / allocated) * 100 : 0;
            const isOver = spent > allocated;
            const catColor = theme.isDark ? (theme[cat.id] || cat.color) : cat.color;

            return (
              <View key={cat.id} style={styles.breakdownRow}>
                <View style={styles.breakdownHeader}>
                  <View style={styles.breakdownLeft}>
                    <View style={[styles.catDot, { backgroundColor: catColor }]} />
                    <Text style={[styles.catName, { color: theme.text }]}>{cat.name}</Text>
                  </View>
                  <Text
                    style={[
                      styles.catAmounts,
                      { color: isOver ? theme.danger : theme.textSecondary },
                    ]}
                  >
                    {formatINR(spent)} / {formatINR(allocated)}
                  </Text>
                </View>
                <ProgressBar
                  progress={pct}
                  color={catColor}
                  height={6}
                  isOverspent={isOver}
                />
              </View>
            );
          })}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statBox: {
    width: '47.5%',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 2,
  },
  statSub: {
    fontSize: 11,
  },
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  tipTextContainer: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  tipBody: {
    fontSize: 12,
    lineHeight: 17,
  },
  breakdownRow: {
    marginBottom: SPACING.md,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  catName: {
    fontSize: 13,
    fontWeight: '600',
  },
  catAmounts: {
    fontSize: 12,
    fontWeight: '600',
  },
});
