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
import { SPACING, RADIUS, useAppTheme } from '../../constants/theme';
import Button from '../../components/Button';
import TactileTouch from '../../components/TactileTouch';

export default function AddLentModal() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const addLentRecord = useFinanceStore((state) => state.addLentRecord);
  const showToast = useFinanceStore((state) => state.showToast);

  const [personName, setPersonName] = useState('');
  const [phone, setPhone] = useState('');
  const [amountRupees, setAmountRupees] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    const trimmedName = personName.trim();
    const parsedAmount = parseFloat(amountRupees);

    if (!trimmedName) {
      showToast({
        type: 'warning',
        title: 'Required Field',
        message: "Please enter the friend or colleague's name.",
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

    addLentRecord({
      personName: trimmedName,
      phone: phone.trim(),
      amountRupees: parsedAmount,
      expectedReturnDate: expectedReturnDate.trim() || 'Next week',
      notes: notes.trim(),
    });

    showToast({
      type: 'success',
      title: 'Friend Ledger Saved',
      message: `₹${parsedAmount.toLocaleString('en-IN')} lent to ${trimmedName} recorded.`,
    });

    router.back();
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Given to Friend (To Friend)</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}
      >
        <View
          style={[
            styles.banner,
            {
              backgroundColor: theme.isDark ? '#2D2418' : '#FDF3E4',
              borderColor: theme.isDark ? '#451A03' : '#FED7AA',
            },
          ]}
        >
          <Feather name="info" size={16} color="#F59E0B" />
          <Text style={[styles.bannerText, { color: theme.isDark ? '#FCD34D' : '#B45309' }]}>
            Money given to friends is not wasted spending—it is tracked as money owed to you
            until recovered!
          </Text>
        </View>

        {/* Big Amount */}
        <View
          style={[
            styles.amountBox,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.currencySymbol, { color: '#F59E0B' }]}>₹</Text>
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

        {/* Person Name */}
        <Text style={[styles.label, { color: theme.textSecondary }]}>Friend / Person's Name</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBg,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          placeholder="e.g. Rahul, Priya, Vikram"
          placeholderTextColor={theme.textSecondary}
          value={personName}
          onChangeText={setPersonName}
        />

        {/* Phone Number for WhatsApp Nudge */}
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          Phone Number (Optional - for WhatsApp reminders)
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBg,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          placeholder="e.g. 9876543210"
          placeholderTextColor={theme.textSecondary}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        {/* Expected Return Date */}
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          Expected Return Date (Optional)
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBg,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          placeholder="e.g. 30 Nov 2026 or Next Payday"
          placeholderTextColor={theme.textSecondary}
          value={expectedReturnDate}
          onChangeText={setExpectedReturnDate}
        />

        {/* Reason / Notes */}
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          Reason / Notes (Optional)
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBg,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          placeholder="e.g. Group dinner split, concert ticket, urgent cash"
          placeholderTextColor={theme.textSecondary}
          value={notes}
          onChangeText={setNotes}
        />

        <Button
          title="Save Lent Record"
          onPress={handleSubmit}
          style={{ marginTop: SPACING.lg }}
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
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
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
    fontSize: 36,
    fontWeight: '800',
    minWidth: 120,
    textAlign: 'left',
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
});
