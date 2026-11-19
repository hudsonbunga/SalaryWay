import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  RefreshControl,
  Easing,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFinanceStore } from '../../store/useFinanceStore';
import { CATEGORIES, SPACING, RADIUS, useAppTheme } from '../../constants/theme';
import { calculateCategoryBalance, formatINR } from '../../services/financialCalc';
import { generateAlerts } from '../../services/notifications';
import MainSalaryCard from '../../components/MainSalaryCard';
import CategoryCard from '../../components/CategoryCard';
import TransactionItem from '../../components/TransactionItem';
import TactileTouch from '../../components/TactileTouch';
import FloatingMajorButton from '../../components/FloatingMajorButton';
import DailySafeSpendBanner from '../../components/DailySafeSpendBanner';

export default function HomeScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const currentMonthKey = useFinanceStore((state) => state.currentMonthKey);
  const setCurrentMonth = useFinanceStore((state) => state.setCurrentMonth);
  const getCurrentMonthData = useFinanceStore((state) => state.getCurrentMonthData);
  const deleteTransaction = useFinanceStore((state) => state.deleteTransaction);
  const lentRecords = useFinanceStore((state) => state.lentRecords);
  const showToast = useFinanceStore((state) => state.showToast);

  // Spanner Pull-Down Refresh State & Animation
  const [isRefreshing, setIsRefreshing] = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;

  const handleRefresh = () => {
    setIsRefreshing(true);
    spinAnim.setValue(0);
    const loop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 850,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();

    setTimeout(() => {
      loop.stop();
      setIsRefreshing(false);
      showToast({
        type: 'success',
        title: 'Finances Synced',
        message: 'All 5 pockets and safe-to-spend updated.',
      });
    }, 1100);
  };

  const monthData = getCurrentMonthData();
  const { salaryPaise, allocations, transactions } = monthData;

  // Month navigation & aesthetic display
  const [yearStr, monthStr] = currentMonthKey.split('-');
  const selectedYear = parseInt(yearStr, 10);
  const selectedMonth = parseInt(monthStr, 10);
  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const displayMonthName = MONTH_NAMES[selectedMonth - 1] || 'September';
  const today = new Date();
  const dayOfMonth = today.getDate();
  const displayDayAndYear = `${dayOfMonth} ${displayMonthName.substring(0, 3)} ${selectedYear}`;

  const handlePrevMonth = () => {
    let prevM = selectedMonth - 1;
    let prevY = selectedYear;
    if (prevM < 1) {
      prevM = 12;
      prevY -= 1;
    }
    setCurrentMonth(`${prevY}-${String(prevM).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    let nextM = selectedMonth + 1;
    let nextY = selectedYear;
    if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    }
    setCurrentMonth(`${nextY}-${String(nextM).padStart(2, '0')}`);
  };

  // Compute total spent
  let totalSpentPaise = 0;
  transactions.forEach((t) => {
    if (t.type === 'expense') totalSpentPaise += t.amountPaise;
    else if (t.type === 'refund') totalSpentPaise -= t.amountPaise;
  });

  // Calculate pending lent money
  const pendingLentPaise = lentRecords
    .filter((r) => r.status === 'pending')
    .reduce((sum, r) => sum + r.amountPaise, 0);

  // Daily Safe-to-Spend: Remaining budget / remaining days
  const remainingBudgetPaise = salaryPaise - totalSpentPaise;
  const daysInMonth = 30;
  const currentDay = new Date().getDate();
  const daysLeft = Math.max(1, daysInMonth - currentDay);
  const dailySafeSpendPaise = Math.max(0, Math.round(remainingBudgetPaise / daysLeft));

  // Calculate alerts
  const alerts = generateAlerts(monthData);

  // Compute category balances
  const categoryBalances = {};
  CATEGORIES.forEach((cat) => {
    const allocated = allocations[cat.id] || 0;
    const catTxs = transactions.filter((t) => t.category === cat.id);
    categoryBalances[cat.id] = calculateCategoryBalance(allocated, catTxs);
  });

  const recentTransactions = transactions.slice(0, 4);

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* 1. Base Surfaces & Navigation (Top Bar with Safe-Area Awareness: 24-48px) */}
      <View
        style={[
          styles.topHeader,
          {
            backgroundColor: theme.background,
            paddingTop: Math.max(insets.top, 28),
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <View style={styles.logoRow}>
            <View style={[styles.logoCircle, { backgroundColor: theme.primary }]}>
              <Feather name="trending-up" size={16} color="#FFFFFF" />
            </View>
            <Text style={[styles.brandTitle, { color: theme.text }]}>SalaryWay</Text>
          </View>
          <Text style={[styles.tagline, { color: theme.tagline }]}>
            Give Every Rupee a Direction
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TactileTouch
            onPress={() => router.push('/modal/export-statement')}
            style={[
              styles.headerIconButton,
              {
                backgroundColor: theme.topIconBg,
                borderColor: theme.topIconBorder,
              },
            ]}
          >
            <Feather name="download" size={17} color={theme.topIconColor} />
          </TactileTouch>

          <TactileTouch
            onPress={() => router.push('/(tabs)/profile')}
            style={[
              styles.headerIconButton,
              {
                backgroundColor: theme.topIconBg,
                borderColor: theme.topIconBorder,
              },
            ]}
          >
            <Feather name="user" size={18} color={theme.topIconColor} />
          </TactileTouch>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + SPACING.lg },
        ]}
      >
        {/* Spanner Pull-Down Loading Animation Indicator */}
        {isRefreshing && (
          <View
            style={[
              styles.spannerRefreshBox,
              {
                backgroundColor: theme.isDark ? '#1C1F24' : '#E8F5EF',
                borderColor: theme.isDark ? '#2B3038' : '#C6E7D6',
              },
            ]}
          >
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: spinAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              }}
            >
              <Feather name="tool" size={17} color={theme.primary} />
            </Animated.View>
            <Text style={[styles.spannerRefreshText, { color: theme.primaryText }]}>
              Syncing finances & safe-to-spend...
            </Text>
          </View>
        )}

        {/* Aesthetic Month & Date */}
        <View style={styles.aestheticMonthWrapper}>
          <View style={styles.aestheticMonthRow}>
            <TactileTouch
              style={[
                styles.monthNavBtn,
                {
                  backgroundColor: theme.isDark ? '#1C1F24' : '#F1F5F9',
                  borderColor: theme.border,
                },
              ]}
              onPress={handlePrevMonth}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Feather name="chevron-left" size={18} color={theme.primary} />
            </TactileTouch>

            <View style={styles.aestheticDateCenter}>
              <Text style={[styles.aestheticMonthTitle, { color: theme.primary }]}>
                {displayMonthName}
              </Text>
              <Text style={[styles.aestheticDateSubtitle, { color: theme.textSecondary }]}>
                {displayDayAndYear}
              </Text>
            </View>

            <TactileTouch
              style={[
                styles.monthNavBtn,
                {
                  backgroundColor: theme.isDark ? '#1C1F24' : '#F1F5F9',
                  borderColor: theme.border,
                },
              ]}
              onPress={handleNextMonth}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Feather name="chevron-right" size={18} color={theme.primary} />
            </TactileTouch>
          </View>
        </View>

        {/* 2. Alert Banner ("Overspending Warning") */}
        {alerts.length > 0 && (
          <View
            style={[
              styles.alertContainer,
              {
                backgroundColor: theme.alertBg,
                borderColor: theme.alertBorder,
              },
            ]}
          >
            <View style={styles.alertHeader}>
              <Feather
                name={alerts[0].type === 'danger' ? 'alert-triangle' : 'info'}
                size={16}
                color={theme.alertIcon}
              />
              <Text style={[styles.alertTitle, { color: theme.alertTitle }]}>
                {alerts[0].title}
              </Text>
            </View>
            <Text style={[styles.alertMessage, { color: theme.alertText }]}>
              {alerts[0].message}
            </Text>
          </View>
        )}

        {/* 3. Main Hero Card ("Monthly Salary") - Clicking opens Insights */}
        <MainSalaryCard
          salaryPaise={salaryPaise}
          totalSpentPaise={totalSpentPaise}
          totalAllocatedPaise={salaryPaise}
          onPress={() => router.push('/(tabs)/insights')}
        />

        {/* 4. Daily Safe-to-Spend Widget (Built From Scratch) */}
        <DailySafeSpendBanner
          dailySafeSpendPaise={dailySafeSpendPaise}
          daysLeft={daysLeft}
          onPress={() => router.push('/modal/daily-safe-spend')}
        />

        {/* 5. Quick Action Cards (Full-Width 50/50 Ergonomic Grid) */}
        <View style={styles.actionsGrid}>
          {/* Pay via UPI */}
          <TactileTouch
            style={[
              styles.actionCard,
              {
                flex: 1,
                minWidth: 0,
                backgroundColor: theme.upiCardBg,
                borderColor: theme.isDark ? '#047857' : 'transparent',
              },
            ]}
            onPress={() => router.push('/modal/pay-upi')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: theme.upiIconBox }]}>
              <Feather name="send" size={18} color={theme.upiIconColor} />
            </View>
            <View style={styles.actionTextContainer}>
              <Text
                numberOfLines={1}
                style={[styles.actionTitle, { color: theme.upiTitle }]}
              >
                Pay via UPI
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.actionSubtitle, { color: theme.upiSubtitle }]}
              >
                Launch GPay/PhonePe
              </Text>
            </View>
          </TactileTouch>

          {/* To Friend */}
          <TactileTouch
            style={[
              styles.actionCard,
              {
                flex: 1,
                minWidth: 0,
                backgroundColor: theme.friendCardBg,
                borderColor: theme.friendCardBorder,
              },
            ]}
            onPress={() => router.push('/(tabs)/goals')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: theme.friendIconBox }]}>
              <Feather name="users" size={18} color={theme.friendIconColor} />
            </View>
            <View style={styles.actionTextContainer}>
              <Text
                numberOfLines={1}
                style={[styles.actionTitle, { color: theme.friendTitle }]}
              >
                To Friend
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.actionSubtitle, { color: theme.friendSubtitle }]}
              >
                {pendingLentPaise > 0 ? `${formatINR(pendingLentPaise)} due` : 'All cleared'}
              </Text>
            </View>
          </TactileTouch>
        </View>

        {/* 6. Budget Allocations Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Budget Allocations
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            5 Pockets
          </Text>
        </View>

        {/* 5 Categories Cards */}
        {CATEGORIES.map((cat) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            balance={categoryBalances[cat.id]}
            onPress={() => router.push(`/category/${cat.id}`)}
          />
        ))}

        {/* Recent Transactions Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Recent Transactions
          </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
            <Text style={[styles.viewAllText, { color: theme.primaryText }]}>
              View All
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.transactionCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          {recentTransactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={32} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No transactions recorded this month.
              </Text>
            </View>
          ) : (
            recentTransactions.map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                onDelete={deleteTransaction}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Center "Add Expense" Button */}
      <FloatingMajorButton
        title="Add Expense"
        icon="plus"
        backgroundColor={theme.primary}
        onPress={() => router.push('/modal/add-transaction')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoCircle: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full, // Material 3 circular elevated icon button
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  alertContainer: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  alertMessage: {
    fontSize: 12,
    lineHeight: 16,
  },
  aestheticMonthWrapper: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    marginTop: SPACING.xs,
  },
  aestheticMonthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xl,
    width: '100%',
  },
  aestheticDateCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  aestheticMonthTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  aestheticDateSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionsGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    gap: 12,
    marginBottom: SPACING.lg,
  },
  actionCard: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    justifyContent: 'space-between',
    elevation: 0,
    shadowOpacity: 0,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  actionTextContainer: {
    width: '100%',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  transactionCard: {
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    fontSize: 13,
    marginTop: SPACING.sm,
  },
  spannerRefreshBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignSelf: 'center',
    marginBottom: SPACING.md,
    marginTop: SPACING.xs,
  },
  spannerRefreshText: {
    fontSize: 12.5,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
