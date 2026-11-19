import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { RADIUS, SPACING, useAppTheme } from '../constants/theme';
import { formatINR, formatDate } from '../services/financialCalc';

const CATEGORY_ICONS = {
  essential: 'home',
  lifestyle: 'coffee',
  debt: 'credit-card',
  savings: 'trending-up',
  personal: 'book-open',
};

export default function TransactionItem({ transaction, onPress, onDelete }) {
  const theme = useAppTheme();
  const { title, amountPaise, category, subcategory, paymentMethod, type, date, merchant } =
    transaction;
  const isIncomeOrRefund = type === 'income' || type === 'refund';

  const iconName = CATEGORY_ICONS[category] || 'dollar-sign';
  const iconBg = theme.isDark ? (theme[`${category}Light`] || '#182635') : (theme[`${category}Light`] || '#EBF3FC');
  const iconColor = theme.isDark ? (theme[category] || '#60A5FA') : (theme[category] || '#3986D7');

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[styles.container, { borderBottomColor: theme.border }]}
      onPress={onPress}
    >
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Feather name={iconName} size={16} color={iconColor} />
      </View>

      <View style={styles.centerDetails}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.subRow}>
          <Text style={[styles.subText, { color: theme.textSecondary }]}>
            {merchant || subcategory || 'Expense'}
          </Text>
          <Text style={[styles.dot, { color: theme.textSecondary }]}>•</Text>
          <Text style={[styles.dateText, { color: theme.textSecondary }]}>
            {formatDate(date)}
          </Text>
        </View>
      </View>

      <View style={styles.rightDetails}>
        <Text
          style={[
            styles.amount,
            { color: isIncomeOrRefund ? theme.primary : theme.text },
          ]}
        >
          {isIncomeOrRefund ? '+' : '-'}
          {formatINR(amountPaise)}
        </Text>
        <View
          style={[
            styles.paymentBadge,
            {
              backgroundColor: theme.isDark ? '#252A32' : '#F3F4F6',
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.paymentText, { color: theme.textSecondary }]}>
            {paymentMethod || 'UPI'}
          </Text>
        </View>
      </View>

      {onDelete && (
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => onDelete(transaction.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="trash-2" size={14} color={theme.textSecondary} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  centerDetails: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subText: {
    fontSize: 12,
  },
  dot: {
    fontSize: 10,
  },
  dateText: {
    fontSize: 12,
  },
  rightDetails: {
    alignItems: 'flex-end',
    marginRight: SPACING.sm,
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  paymentBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  paymentText: {
    fontSize: 10,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 4,
  },
});
