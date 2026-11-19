import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFinanceStore } from '../../store/useFinanceStore';
import {
  CATEGORIES,
  SUBCATEGORIES,
  PAYMENT_METHODS,
  SPACING,
  RADIUS,
  useAppTheme,
} from '../../constants/theme';
import { toPaise } from '../../services/financialCalc';
import { parseBankSMS } from '../../services/smsParser';
import Button from '../../components/Button';
import TactileTouch from '../../components/TactileTouch';
import FloatingMajorButton from '../../components/FloatingMajorButton';

export default function AddTransactionModal() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const addTransaction = useFinanceStore((state) => state.addTransaction);
  const showToast = useFinanceStore((state) => state.showToast);

  const [title, setTitle] = useState('');
  const [amountRupees, setAmountRupees] = useState('');
  const [category, setCategory] = useState(params.defaultCategory || 'essential');
  const [subcategory, setSubcategory] = useState(
    SUBCATEGORIES[params.defaultCategory || 'essential'][0]
  );
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [type, setType] = useState('expense'); // 'expense' | 'income' | 'refund'
  const [merchant, setMerchant] = useState('');
  const [pastedSms, setPastedSms] = useState('');

  const handlePastedSms = (text) => {
    setPastedSms(text);
    if (!text.trim()) return;
    const parsed = parseBankSMS(text);
    if (parsed) {
      if (parsed.amountRupees) setAmountRupees(String(parsed.amountRupees));
      if (parsed.title) setTitle(parsed.title);
      if (parsed.merchant) setMerchant(parsed.merchant);
      if (parsed.category) {
        setCategory(parsed.category);
        if (SUBCATEGORIES[parsed.category]) {
          setSubcategory(SUBCATEGORIES[parsed.category][0]);
        }
      }
      setPaymentMethod('UPI');
      setType('expense');
    }
  };

  const handleCategoryChange = (catId) => {
    setCategory(catId);
    setSubcategory(SUBCATEGORIES[catId][0]);
  };

  const handleSubmit = () => {
    const trimmedTitle = title.trim();
    const parsedAmount = parseFloat(amountRupees);

    if (!trimmedTitle) {
      showToast({
        type: 'warning',
        title: 'Required Field',
        message: 'Please enter a transaction title.',
      });
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast({
        type: 'warning',
        title: 'Invalid Amount',
        message: 'Please enter a valid amount greater than ₹0.',
      });
      return;
    }

    const res = addTransaction({
      title: trimmedTitle,
      amountPaise: toPaise(parsedAmount),
      category,
      subcategory,
      paymentMethod,
      type,
      merchant: merchant.trim(),
    });

    if (res?.overspent) {
      showToast({
        type: 'warning',
        title: 'Pocket Overspent!',
        message: `This expense puts your ${res.category.toUpperCase()} envelope over budget!`,
      });
    } else {
      showToast({
        type: 'success',
        title: 'Transaction Saved',
        message: `₹${parsedAmount.toLocaleString('en-IN')} logged under ${category.toUpperCase()}.`,
      });
    }
    router.back();
  };

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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Record Transaction</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 + insets.bottom }]}
      >
        {/* Type Switcher */}
        <View
          style={[
            styles.typeSwitcher,
            {
              backgroundColor: theme.isDark ? '#1C1F24' : '#E5E7EB',
              borderColor: theme.border,
              borderWidth: theme.isDark ? 1 : 0,
            },
          ]}
        >
          {['expense', 'income', 'refund'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.typeBtn,
                type === t && [
                  styles.typeBtnActive,
                  { backgroundColor: theme.isDark ? '#252A32' : '#FFFFFF' },
                ],
              ]}
              onPress={() => setType(t)}
            >
              <Text
                style={[
                  styles.typeBtnText,
                  { color: theme.textSecondary },
                  type === t && { color: theme.text, fontWeight: '700' },
                ]}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Big Amount Input - Centered with Monospace Tabular Digits */}
        <View
          style={[
            styles.amountBox,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.currencySymbol, { color: theme.primary }]}>₹</Text>
          <TextInput
            style={[styles.amountInput, { color: theme.text }]}
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            keyboardType="decimal-pad"
            autoFocus
            value={amountRupees}
            onChangeText={setAmountRupees}
          />
        </View>

        {/* Transaction Title */}
        <Text style={[styles.label, { color: theme.textSecondary }]}>Transaction Title</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBg,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          placeholder="e.g. Swiggy, Electricity Bill, Books"
          placeholderTextColor={theme.textSecondary}
          value={title}
          onChangeText={setTitle}
        />

        {/* Merchant (Optional) */}
        <Text style={[styles.label, { color: theme.textSecondary }]}>Merchant / Payee (Optional)</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBg,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          placeholder="e.g. Avenue Supermarts, Amazon"
          placeholderTextColor={theme.textSecondary}
          value={merchant}
          onChangeText={setMerchant}
        />

        {/* Category Picker */}
        <Text style={[styles.label, { color: theme.textSecondary }]}>Category</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => {
            const isSelected = category === cat.id;
            const catBg = theme.isDark ? (theme[`${cat.id}Light`] || '#182635') : cat.colorLight;
            const catColor = theme.isDark ? (theme[cat.id] || cat.color) : cat.color;

            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                  isSelected && {
                    backgroundColor: catBg,
                    borderColor: catColor,
                  },
                ]}
                onPress={() => handleCategoryChange(cat.id)}
              >
                <Feather
                  name={cat.icon}
                  size={14}
                  color={isSelected ? catColor : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.categoryPillText,
                    { color: isSelected ? catColor : theme.text },
                    isSelected && { fontWeight: '700' },
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Subcategories Pills */}
        <Text style={[styles.label, { color: theme.textSecondary }]}>Subcategory</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.subcatScroll}
          contentContainerStyle={styles.subcatContainer}
        >
          {SUBCATEGORIES[category].map((sub) => {
            const isSelected = subcategory === sub;
            return (
              <TouchableOpacity
                key={sub}
                style={[
                  styles.subPill,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                  isSelected && {
                    backgroundColor: theme.primary,
                    borderColor: theme.primary,
                  },
                ]}
                onPress={() => setSubcategory(sub)}
              >
                <Text
                  style={[
                    styles.subPillText,
                    { color: theme.textSecondary },
                    isSelected && { color: '#FFFFFF', fontWeight: '700' },
                  ]}
                >
                  {sub}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Payment Method */}
        <Text style={[styles.label, { color: theme.textSecondary }]}>Payment Method</Text>
        <View style={styles.paymentRow}>
          {PAYMENT_METHODS.map((method) => {
            const isSelected = paymentMethod === method;
            return (
              <TouchableOpacity
                key={method}
                style={[
                  styles.methodPill,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                  isSelected && {
                    backgroundColor: theme.primary,
                    borderColor: theme.primary,
                  },
                ]}
                onPress={() => setPaymentMethod(method)}
              >
                <Text
                  style={[
                    styles.methodText,
                    { color: theme.textSecondary },
                    isSelected && { color: '#FFFFFF', fontWeight: '700' },
                  ]}
                >
                  {method}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Quick Bank SMS Auto-Fill (Placed at bottom) */}
        <View
          style={[
            styles.smsBanner,
            {
              backgroundColor: theme.isDark ? '#1C1F24' : '#F0FDF4',
              borderColor: theme.border,
              marginTop: SPACING.lg,
            },
          ]}
        >
          <View style={styles.smsBannerHeader}>
            <Feather name="message-square" size={14} color={theme.primary} />
            <Text style={[styles.smsBannerTitle, { color: theme.text }]}>
              Quick Auto-Fill via Bank Debit SMS
            </Text>
          </View>
          <TextInput
            style={[
              styles.smsTextInput,
              {
                backgroundColor: theme.inputBg,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            placeholder="Paste your bank debit SMS here..."
            placeholderTextColor={theme.textSecondary}
            value={pastedSms}
            onChangeText={handlePastedSms}
          />
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Floated Bottom Center "Save Transaction" Button */}
      <FloatingMajorButton
        title="Save Transaction"
        icon="check"
        backgroundColor={theme.primary}
        onPress={handleSubmit}
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
  smsBanner: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  smsBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  smsBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  smsTextInput: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm + 4,
    height: 40,
    fontSize: 13,
  },
  typeSwitcher: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  typeBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '700',
    marginRight: 4,
  },
  amountInput: {
    fontSize: 38,
    fontWeight: '800',
    minWidth: 140,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 48,
    fontSize: 14,
    marginBottom: SPACING.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs + 2,
    marginBottom: SPACING.sm,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subcatScroll: {
    maxHeight: 38,
    marginBottom: SPACING.sm,
  },
  subcatContainer: {
    gap: SPACING.sm,
  },
  subPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  subPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs + 2,
    marginBottom: SPACING.md,
  },
  methodPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  methodText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomFloatingSaveContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 99,
  },
  floatingSaveBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADIUS.full,
  },
  floatingSaveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
