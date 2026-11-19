import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFinanceStore } from '../../store/useFinanceStore';
import { CATEGORIES, SPACING, RADIUS, useAppTheme } from '../../constants/theme';
import { formatINR } from '../../services/financialCalc';
import TransactionItem from '../../components/TransactionItem';
import MonthSelector from '../../components/MonthSelector';
import TactileTouch from '../../components/TactileTouch';
import FloatingMajorButton from '../../components/FloatingMajorButton';

export default function TransactionsScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const currentMonthKey = useFinanceStore((state) => state.currentMonthKey);
  const setCurrentMonth = useFinanceStore((state) => state.setCurrentMonth);
  const getCurrentMonthData = useFinanceStore((state) => state.getCurrentMonthData);
  const deleteTransaction = useFinanceStore((state) => state.deleteTransaction);

  const monthData = getCurrentMonthData();
  const { transactions } = monthData;

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtering
  const filtered = transactions.filter((tx) => {
    const matchesCategory =
      selectedCategory === 'all' || tx.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.merchant && tx.merchant.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.subcategory && tx.subcategory.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const totalFilteredPaise = filtered.reduce((sum, tx) => {
    return tx.type === 'expense' ? sum + tx.amountPaise : sum - tx.amountPaise;
  }, 0);

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
          <Text style={[styles.headerTitle, { color: theme.text }]}>Transactions</Text>
        </View>
      </View>

      <View style={styles.container}>
        <MonthSelector
          currentMonthKey={currentMonthKey}
          onSelectMonth={setCurrentMonth}
        />

        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <Feather name="search" size={16} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search transactions or merchants..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => setSearchQuery('')}>
              <Feather name="x" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter Pills (Swipable, Icon-Enhanced, Crystal Clear) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          <TactileTouch
            style={[
              styles.filterPill,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
              selectedCategory === 'all' && {
                backgroundColor: theme.primary,
                borderColor: theme.primary,
              },
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <Feather
              name="grid"
              size={13}
              color={selectedCategory === 'all' ? '#FFFFFF' : theme.textSecondary}
            />
            <Text
              style={[
                styles.filterText,
                { color: theme.textSecondary },
                selectedCategory === 'all' && { color: '#FFFFFF', fontWeight: '700' },
              ]}
            >
              All
            </Text>
          </TactileTouch>

          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const catColor = theme.isDark ? (theme[cat.id] || cat.color) : cat.color;

            return (
              <TactileTouch
                key={cat.id}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                  isSelected && {
                    backgroundColor: catColor,
                    borderColor: catColor,
                  },
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Feather
                  name={cat.icon}
                  size={13}
                  color={isSelected ? '#FFFFFF' : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.filterText,
                    { color: theme.textSecondary },
                    isSelected && { color: '#FFFFFF', fontWeight: '700' },
                  ]}
                >
                  {cat.name}
                </Text>
              </TactileTouch>
            );
          })}
        </ScrollView>

        {/* Summary of current view */}
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryCount, { color: theme.textSecondary }]}>
            {filtered.length} {filtered.length === 1 ? 'transaction' : 'transactions'}
          </Text>
          <Text style={[styles.summaryTotal, { color: theme.textSecondary }]}>
            Total:{' '}
            <Text style={[styles.summaryAmount, { color: theme.text }]}>
              {formatINR(totalFilteredPaise)}
            </Text>
          </Text>
        </View>

        {/* Transactions List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            {
              flexGrow: 1,
              paddingBottom: Math.max(insets.bottom, 24) + 84,
            },
          ]}
        >
          <View
            style={[
              styles.listCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            {filtered.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Feather name="search" size={32} color={theme.textSecondary} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No Transactions Found</Text>
                <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                  {searchQuery ? 'Try adjusting your search query.' : 'Record your first expense!'}
                </Text>
              </View>
            ) : (
              filtered.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  onDelete={deleteTransaction}
                />
              ))
            )}
          </View>
        </ScrollView>
      </View>

      {/* Primary Floating Action Button (Standardized & Thumb-Zone Pinned) */}
      <FloatingMajorButton
        title="Add Transaction"
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: RADIUS.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    fontWeight: '700',
    fontSize: 13,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    height: 48,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  filterScroll: {
    marginBottom: SPACING.md,
  },
  filterContainer: {
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  filterPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  summaryCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  summaryTotal: {
    fontSize: 13,
  },
  summaryAmount: {
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: SPACING.xl,
  },
  listCard: {
    flexGrow: 1,
    minHeight: 280,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
    flex: 1,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
});
