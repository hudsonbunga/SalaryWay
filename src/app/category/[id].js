import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFinanceStore } from '../../store/useFinanceStore';
import { CATEGORIES, SPACING, RADIUS, useAppTheme } from '../../constants/theme';
import { calculateCategoryBalance, formatINR } from '../../services/financialCalc';
import ProgressBar from '../../components/ProgressBar';
import TransactionItem from '../../components/TransactionItem';
import FloatingMajorButton from '../../components/FloatingMajorButton';

export default function CategoryDetailScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const category = CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];

  const getCurrentMonthData = useFinanceStore((state) => state.getCurrentMonthData);
  const deleteTransaction = useFinanceStore((state) => state.deleteTransaction);

  const monthData = getCurrentMonthData();
  const { allocations, transactions } = monthData;

  const allocatedPaise = allocations[category.id] || 0;
  const categoryTransactions = transactions.filter((t) => t.category === category.id);
  const balance = calculateCategoryBalance(allocatedPaise, categoryTransactions);
  const isOverspent = balance.remaining < 0;

  const catColor = theme.isDark ? (theme[category.id] || category.color) : category.color;
  const catBg = theme.isDark ? (theme[`${category.id}Light`] || '#182635') : category.colorLight;

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: Math.max(insets.top, 24) }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={18} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{category.name}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 84 },
        ]}
      >
        {/* Category Hero Card */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: isOverspent ? theme.overspentBg : theme.surface,
              borderColor: isOverspent ? theme.overspentBorder : theme.border,
            },
          ]}
        >
          <View style={styles.heroTop}>
            <View style={[styles.iconBox, { backgroundColor: catBg }]}>
              <Feather name={category.icon} size={22} color={catColor} />
            </View>
            <View style={styles.heroRight}>
              <Text style={[styles.heroRemainingLabel, { color: theme.textSecondary }]}>
                {isOverspent ? 'OVER BUDGET BY' : 'REMAINING BUDGET'}
              </Text>
              <Text
                style={[
                  styles.heroRemaining,
                  { color: isOverspent ? theme.danger : theme.text },
                ]}
              >
                {formatINR(Math.abs(balance.remaining))}
              </Text>
            </View>
          </View>

          {isOverspent && (
            <View
              style={[
                styles.overspentAlert,
                {
                  backgroundColor: theme.isDark ? '#2A1618' : '#FEE2E2',
                  borderColor: theme.isDark ? '#5C2328' : '#FECACA',
                },
              ]}
            >
              <Feather name="alert-triangle" size={14} color={theme.danger} />
              <Text style={[styles.overspentAlertText, { color: theme.danger }]}>
                This category has exceeded its allocated limit!
              </Text>
            </View>
          )}

          <View style={styles.heroProgress}>
            <ProgressBar
              progress={balance.percentUsed}
              color={catColor}
              height={8}
              isOverspent={isOverspent}
            />
          </View>

          <View style={[styles.heroMetrics, { borderTopColor: theme.border }]}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Budget Allocated</Text>
              <Text style={[styles.metricValue, { color: theme.text }]}>{formatINR(balance.allocated)}</Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Total Spent</Text>
              <Text style={[styles.metricValue, { color: theme.text }]}>{formatINR(balance.spent)}</Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Utilization</Text>
              <Text
                style={[
                  styles.metricValue,
                  { color: isOverspent ? theme.danger : theme.text },
                ]}
              >
                {Math.round(balance.percentUsed)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Transactions Section */}
        <View style={styles.txHeader}>
          <Text style={[styles.txTitle, { color: theme.text }]}>Category Transactions</Text>
          <Text style={[styles.txCount, { color: theme.textSecondary }]}>
            {categoryTransactions.length}{' '}
            {categoryTransactions.length === 1 ? 'record' : 'records'}
          </Text>
        </View>

        <View
          style={[
            styles.txCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          {categoryTransactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={32} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No expenses recorded yet.
              </Text>
            </View>
          ) : (
            categoryTransactions.map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                onDelete={deleteTransaction}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Major Button: Center Bottom */}
      <FloatingMajorButton
        title={`Add Expense to ${category.name}`}
        icon="plus"
        backgroundColor={catColor}
        onPress={() =>
          router.push({
            pathname: '/modal/add-transaction',
            params: { defaultCategory: category.id },
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },
  heroCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRight: {
    alignItems: 'flex-end',
  },
  heroRemainingLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroRemaining: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 2,
  },
  overspentAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.md,
    borderWidth: 1,
  },
  overspentAlertText: {
    fontSize: 12,
    fontWeight: '600',
  },
  heroProgress: {
    marginVertical: SPACING.lg,
  },
  heroMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    fontSize: 11,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  addExpenseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.xl,
  },
  addExpenseBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  txTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  txCount: {
    fontSize: 12,
  },
  txCard: {
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyText: {
    fontSize: 13,
    marginTop: SPACING.sm,
  },
});
