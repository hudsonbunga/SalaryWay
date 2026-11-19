import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFinanceStore } from '../../store/useFinanceStore';
import { SPACING, RADIUS, useAppTheme } from '../../constants/theme';
import { formatINR } from '../../services/financialCalc';
import { filterTransactionsForExport, exportAndShareCSV } from '../../services/csvExport';
import Button from '../../components/Button';
import TactileTouch from '../../components/TactileTouch';

export default function ExportStatementModal() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const currentMonthKey = useFinanceStore((state) => state.currentMonthKey);
  const getAllTransactions = useFinanceStore((state) => state.getAllTransactions);
  const showToast = useFinanceStore((state) => state.showToast);
  const allTransactions = getAllTransactions();

  const [filterType, setFilterType] = useState('month'); // 'month' | '3months' | 'year' | 'all'
  const [isExporting, setIsExporting] = useState(false);

  // Filter transactions based on selection
  let filtered = [];
  if (filterType === 'month') {
    filtered = filterTransactionsForExport(allTransactions, {
      type: 'month',
      monthKey: currentMonthKey,
    });
  } else if (filterType === '3months') {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 3);
    filtered = filterTransactionsForExport(allTransactions, {
      type: 'custom',
      fromDate: cutoff.toISOString(),
      toDate: new Date().toISOString(),
    });
  } else if (filterType === 'year') {
    const currentYear = new Date().getFullYear();
    filtered = filterTransactionsForExport(allTransactions, {
      type: 'year',
      year: currentYear,
    });
  } else {
    filtered = allTransactions;
  }

  const totalFilteredPaise = filtered.reduce((sum, t) => {
    return t.type === 'expense' ? sum + t.amountPaise : sum - t.amountPaise;
  }, 0);

  const handleExport = async () => {
    if (filtered.length === 0) {
      showToast({
        type: 'warning',
        title: 'No Records',
        message: 'No transactions found for the selected time range.',
      });
      return;
    }

    setIsExporting(true);
    const result = await exportAndShareCSV(filtered, `SalaryWay_${filterType}`);
    setIsExporting(false);

    if (result.success) {
      showToast({
        type: 'success',
        title: 'Statement Ready',
        message: 'CSV statement generated and ready to share or save.',
      });
    } else if (result.error) {
      showToast({
        type: 'error',
        title: 'Export Failed',
        message: result.error,
      });
    }
  };

  const periodOptionsRow1 = [
    { id: 'month', label: 'Current Month', icon: 'calendar' },
    { id: '3months', label: 'Last 3 Months', icon: 'clock' },
  ];

  const periodOptionsRow2 = [
    { id: 'year', label: 'This Year', icon: 'activity' },
    { id: 'all', label: 'All Time', icon: 'layers' },
  ];

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: Math.max(insets.top, 16) }]}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TactileTouch
          onPress={() => router.back()}
          style={[styles.closeBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="arrow-left" size={18} color={theme.text} />
        </TactileTouch>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Export CSV Statement</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + SPACING.xl }]}
      >
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          Download a clean, Excel-compatible CSV statement formatted with dates,
          categories, payment modes, and amounts in INR.
        </Text>

        {/* Range Selection Pills */}
        <Text style={[styles.label, { color: theme.textSecondary }]}>Select Statement Period</Text>

        <View style={styles.presetContainer}>
          {/* Row 1 */}
          <View style={styles.presetRow}>
            {periodOptionsRow1.map((item) => {
              const isSelected = filterType === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.75}
                  style={[
                    styles.presetCard,
                    {
                      backgroundColor: isSelected ? theme.primary : theme.surface,
                      borderColor: isSelected ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setFilterType(item.id)}
                >
                  <Feather
                    name={item.icon}
                    size={16}
                    color={isSelected ? '#FFFFFF' : theme.primary}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={[
                      styles.presetText,
                      {
                        color: isSelected ? '#FFFFFF' : theme.text,
                        fontWeight: isSelected ? '700' : '600',
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Row 2 */}
          <View style={styles.presetRow}>
            {periodOptionsRow2.map((item) => {
              const isSelected = filterType === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.75}
                  style={[
                    styles.presetCard,
                    {
                      backgroundColor: isSelected ? theme.primary : theme.surface,
                      borderColor: isSelected ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setFilterType(item.id)}
                >
                  <Feather
                    name={item.icon}
                    size={16}
                    color={isSelected ? '#FFFFFF' : theme.primary}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={[
                      styles.presetText,
                      {
                        color: isSelected ? '#FFFFFF' : theme.text,
                        fontWeight: isSelected ? '700' : '600',
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Statement Preview Card */}
        <View
          style={[
            styles.previewCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.previewTitle, { color: theme.textSecondary }]}>STATEMENT SUMMARY</Text>
          <View style={[styles.metricRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Total Transactions:</Text>
            <Text style={[styles.metricValue, { color: theme.text }]}>{filtered.length}</Text>
          </View>
          <View style={[styles.metricRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Net Total Amount:</Text>
            <Text style={[styles.metricValue, { color: theme.primaryText }]}>
              {formatINR(totalFilteredPaise)}
            </Text>
          </View>
          <View style={[styles.metricRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>File Format:</Text>
            <Text style={[styles.metricValue, { color: theme.text }]}>Microsoft Excel / CSV (.csv)</Text>
          </View>
        </View>

        {/* Export Button */}
        <Button
          title={isExporting ? 'Generating CSV...' : 'Download & Share Statement'}
          icon={<Feather name="download" size={16} color="#FFFFFF" />}
          onPress={handleExport}
          loading={isExporting}
          disabled={filtered.length === 0}
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
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: SPACING.sm + 2,
  },
  presetContainer: {
    gap: 10,
    marginBottom: SPACING.xl,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  presetCard: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  presetText: {
    fontSize: 13.5,
  },
  previewCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
  },
  previewTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: SPACING.md,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  metricLabel: {
    fontSize: 13,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
  },
});
