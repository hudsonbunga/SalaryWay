import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFinanceStore } from '../../store/useFinanceStore';
import { CATEGORIES, SPACING, RADIUS, useAppTheme } from '../../constants/theme';
import { toRupees, toPaise, formatINR, allocateSalary } from '../../services/financialCalc';
import Button from '../../components/Button';
import TactileTouch from '../../components/TactileTouch';

export default function EditSalaryModal() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const getCurrentMonthData = useFinanceStore((state) => state.getCurrentMonthData);
  const updateSalary = useFinanceStore((state) => state.updateSalary);
  const showToast = useFinanceStore((state) => state.showToast);

  const monthData = getCurrentMonthData();
  const { salaryPaise, percentages } = monthData;

  const [salaryInput, setSalaryInput] = useState(String(toRupees(salaryPaise)));

  const parsedRupees = parseFloat(salaryInput) || 0;
  const previewPaise = toPaise(parsedRupees);
  const previewAllocations = allocateSalary(previewPaise, percentages);

  const handleSave = () => {
    if (parsedRupees <= 0) {
      showToast({
        type: 'warning',
        title: 'Invalid Salary',
        message: 'Please enter a valid monthly salary.',
      });
      return;
    }

    Alert.alert(
      'Confirm Salary Recalculation',
      `Set monthly salary to ${formatINR(previewPaise)}? Category allocations will recalculate for this month. Historical months remain unchanged.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            updateSalary(parsedRupees);
            showToast({
              type: 'success',
              title: 'Salary Updated',
              message: `Monthly salary set to ${formatINR(previewPaise)}.`,
            });
            router.back();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: Math.max(insets.top, 16) }]}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TactileTouch
          onPress={() => router.back()}
          style={[styles.closeBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="arrow-left" size={18} color={theme.text} />
        </TactileTouch>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Update Salary</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}
      >
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          When you enter your monthly salary, SalaryWay automatically recalculates your
          5-category budget. Historical monthly records will not be affected.
        </Text>

        {/* Salary Input */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.currencySymbol, { color: theme.primary }]}>₹</Text>
          <TextInput
            style={[styles.salaryInput, { color: theme.text }]}
            keyboardType="numeric"
            autoFocus
            value={salaryInput}
            onChangeText={setSalaryInput}
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        {/* Live Allocation Preview */}
        <Text style={[styles.previewTitle, { color: theme.text }]}>Live Allocation Breakdown</Text>
        <View
          style={[
            styles.previewCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          {CATEGORIES.map((cat) => {
            const catPaise = previewAllocations[cat.id] || 0;
            const dotColor = theme.isDark ? (theme[cat.id] || cat.color) : cat.color;

            return (
              <View
                key={cat.id}
                style={[styles.previewRow, { borderBottomColor: theme.border }]}
              >
                <View style={styles.previewLeft}>
                  <View style={[styles.dot, { backgroundColor: dotColor }]} />
                  <Text style={[styles.catName, { color: theme.text }]}>{cat.name}</Text>
                  <Text style={[styles.catPercent, { color: theme.textSecondary }]}>
                    ({percentages[cat.id]}%)
                  </Text>
                </View>
                <Text style={[styles.catAmount, { color: theme.text }]}>{formatINR(catPaise)}</Text>
              </View>
            );
          })}

          <View style={styles.previewTotalRow}>
            <Text style={[styles.totalLabel, { color: theme.primary }]}>Total 100% Allocated</Text>
            <Text style={[styles.totalValue, { color: theme.primary }]}>{formatINR(previewPaise)}</Text>
          </View>
        </View>

        <Button
          title="Save & Recalculate Budget"
          onPress={handleSave}
          style={{ marginTop: SPACING.xl }}
        />

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
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
    paddingTop: SPACING.sm,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.xl,
    borderWidth: 1,
    marginBottom: SPACING.xl,
  },
  currencySymbol: {
    fontSize: 34,
    fontWeight: '700',
    marginRight: 6,
  },
  salaryInput: {
    fontSize: 38,
    fontWeight: '800',
    minWidth: 160,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  previewCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  previewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  catName: {
    fontSize: 14,
    fontWeight: '600',
  },
  catPercent: {
    fontSize: 12,
  },
  catAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  previewTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
  },
});
