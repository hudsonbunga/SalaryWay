import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Linking,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFinanceStore } from '../../store/useFinanceStore';
import { COLORS, SPACING, RADIUS, useAppTheme } from '../../constants/theme';
import { formatINR, toRupees, toPaise } from '../../services/financialCalc';
import {
  launchUPIPayment,
  formatMobileToVPA,
  detectUPIProvider,
  UPI_HANDLES,
} from '../../services/upiLauncher';
import ProgressBar from '../../components/ProgressBar';
import Button from '../../components/Button';
import TactileTouch from '../../components/TactileTouch';
import FloatingMajorButton from '../../components/FloatingMajorButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function GoalsScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('savings'); // 'savings' | 'debt' | 'friend'
  const horizontalScrollRef = useRef(null);

  // Store bindings
  const savingsGoals = useFinanceStore((state) => state.savingsGoals);
  const contributeSavingsGoal = useFinanceStore((state) => state.contributeSavingsGoal);
  const deleteSavingsGoal = useFinanceStore((state) => state.deleteSavingsGoal);
  const addSavingsGoal = useFinanceStore((state) => state.addSavingsGoal);

  const debts = useFinanceStore((state) => state.debts);
  const recordDebtPayment = useFinanceStore((state) => state.recordDebtPayment);
  const settleDebt = useFinanceStore((state) => state.settleDebt);
  const deleteDebt = useFinanceStore((state) => state.deleteDebt);
  const addDebt = useFinanceStore((state) => state.addDebt);
  const redirectDebt = useFinanceStore((state) => state.redirectDebt);
  const getCurrentMonthData = useFinanceStore((state) => state.getCurrentMonthData);

  const lentRecords = useFinanceStore((state) => state.lentRecords);
  const markLentRecovered = useFinanceStore((state) => state.markLentRecovered);
  const deleteLentRecord = useFinanceStore((state) => state.deleteLentRecord);
  const addLentRecord = useFinanceStore((state) => state.addLentRecord);

  const savingsVault = useFinanceStore((state) => state.savingsVault);
  const breakSavingsLock = useFinanceStore((state) => state.breakSavingsLock);
  const relockSavings = useFinanceStore((state) => state.relockSavings);

  const savingsBankConfig = useFinanceStore((state) => state.savingsBankConfig);
  const setSavingsBankConfig = useFinanceStore((state) => state.setSavingsBankConfig);
  const showToast = useFinanceStore((state) => state.showToast);

  const monthData = getCurrentMonthData();
  const { allocations } = monthData;

  // Modal states: Savings Goal
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalSaved, setGoalSaved] = useState('');

  // Modal states: New Debt
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [debtType, setDebtType] = useState('friend'); // 'friend' | 'bank'
  const [debtName, setDebtName] = useState('');
  const [creditorName, setCreditorName] = useState('');
  const [friendPhone, setFriendPhone] = useState('');
  const [friendProvider, setFriendProvider] = useState('phonepe');
  const [customVpa, setCustomVpa] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtDuration, setDebtDuration] = useState('6'); // months
  const [debtDueDate, setDebtDueDate] = useState('5');
  const [debtEmi, setDebtEmi] = useState('');
  const [debtInterest, setDebtInterest] = useState('0');

  // Modal states: New "To Friend" Entry
  const [showFriendModal, setShowFriendModal] = useState(false);
  const [toFriendName, setToFriendName] = useState('');
  const [toFriendPhone, setToFriendPhone] = useState('');
  const [toFriendAmount, setToFriendAmount] = useState('');
  const [toFriendExpectedDate, setToFriendExpectedDate] = useState('');
  const [toFriendNotes, setToFriendNotes] = useState('');

  // Modal states: Pay Back Debt via UPI
  const [payBackTargetDebt, setPayBackTargetDebt] = useState(null);
  const [payBackMode, setPayBackMode] = useState('full'); // 'full' | 'emi' | 'custom'
  const [payBackCustomAmount, setPayBackCustomAmount] = useState('');

  // Modal states: Secondary Savings Bank Setup
  const [showSavingsBankModal, setShowSavingsBankModal] = useState(false);
  const [bankNameInput, setBankNameInput] = useState(savingsBankConfig?.savingsBankName || '');
  const [bankVpaInput, setBankVpaInput] = useState(savingsBankConfig?.savingsBankVpa || '');
  const [bankMobileInput, setBankMobileInput] = useState(savingsBankConfig?.savingsBankMobile || '');
  const [bankProvider, setBankProvider] = useState(savingsBankConfig?.savingsBankProvider || 'gpay');

  // Modal states: Quick Contribute Goal
  const [contributeGoalId, setContributeGoalId] = useState(null);
  const [contributeAmount, setContributeAmount] = useState('');

  // Summary Metrics
  const totalTargetPaise = savingsGoals.reduce((sum, g) => sum + g.targetPaise, 0);
  const totalSavedPaise = savingsGoals.reduce((sum, g) => sum + g.savedPaise, 0);
  const totalSavingsProgress =
    totalTargetPaise > 0 ? (totalSavedPaise / totalTargetPaise) * 100 : 0;

  const totalOutstandingPaise = debts
    .filter((d) => d.status === 'active')
    .reduce((sum, d) => sum + d.outstandingPaise, 0);
  const totalMonthlyEmiPaise = debts
    .filter((d) => d.status === 'active')
    .reduce((sum, d) => sum + d.monthlyEmiPaise, 0);

  const pendingLentPaise = lentRecords
    .filter((r) => r.status === 'pending')
    .reduce((sum, r) => sum + r.amountPaise, 0);
  const recoveredLentPaise = lentRecords
    .filter((r) => r.status === 'recovered')
    .reduce((sum, r) => sum + r.amountPaise, 0);

  // Time-locked Savings calculations
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth();
  const lastDayOfMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
  const daysLeftInMonth = Math.max(0, lastDayOfMonth - now.getDate());
  const isMonthEnded = daysLeftInMonth === 0;

  const isVaultUnlocked =
    isMonthEnded ||
    savingsVault.unlockStatus === 'unlocked' ||
    savingsVault.emergencyUnlocked;

  // Sync horizontal swipe with top tab selector
  const handleHorizontalScrollEnd = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / SCREEN_WIDTH);
    if (pageIndex === 0) setActiveTab('savings');
    else if (pageIndex === 1) setActiveTab('debt');
    else if (pageIndex === 2) setActiveTab('friend');
  };

  const handleSwitchTab = (tabKey, pageIndex) => {
    setActiveTab(tabKey);
    if (horizontalScrollRef.current) {
      horizontalScrollRef.current.scrollTo({
        x: pageIndex * SCREEN_WIDTH,
        animated: true,
      });
    }
  };

  // Handlers: Save Goal
  const handleSaveGoal = () => {
    if (!goalName.trim()) {
      showToast({
        type: 'warning',
        title: 'Required',
        message: 'Please enter a goal name.',
      });
      return;
    }
    const target = parseFloat(goalTarget);
    if (isNaN(target) || target <= 0) {
      showToast({
        type: 'warning',
        title: 'Invalid Target',
        message: 'Please enter a target amount greater than ₹0.',
      });
      return;
    }
    const saved = parseFloat(goalSaved) || 0;
    addSavingsGoal({
      name: goalName.trim(),
      targetPaise: toPaise(target),
      savedPaise: toPaise(saved),
      targetDate: '2026-12-31',
    });
    setGoalName('');
    setGoalTarget('');
    setGoalSaved('');
    setShowGoalModal(false);
    showToast({
      type: 'success',
      title: 'Goal Created',
      message: `"${goalName.trim()}" added to savings vault.`,
    });
  };

  // Handlers: Save Debt
  const handleSaveDebt = () => {
    if (!debtName.trim()) {
      showToast({
        type: 'warning',
        title: 'Required',
        message: 'Please enter a loan or obligation name.',
      });
      return;
    }
    const amount = parseFloat(debtAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast({
        type: 'warning',
        title: 'Invalid Amount',
        message: 'Please enter a valid loan amount.',
      });
      return;
    }

    let resolvedVpa = '';
    if (debtType === 'friend') {
      if (friendPhone.trim().length === 10) {
        resolvedVpa = formatMobileToVPA(friendPhone.trim(), friendProvider);
      } else if (customVpa.trim()) {
        resolvedVpa = customVpa.trim();
      }
    }

    addDebt({
      name: debtName.trim(),
      creditorName: creditorName.trim() || (debtType === 'friend' ? 'Friend' : 'Bank'),
      type: debtType,
      creditorPhone: friendPhone.trim(),
      creditorVpa: resolvedVpa,
      totalAmountPaise: toPaise(amount),
      durationMonths: parseInt(debtDuration, 10) || 6,
      dueDate: parseInt(debtDueDate, 10) || 5,
      monthlyEmiPaise: debtEmi ? toPaise(parseFloat(debtEmi)) : toPaise(amount / 6),
      interestRate: parseFloat(debtInterest) || 0,
    });

    setDebtName('');
    setCreditorName('');
    setFriendPhone('');
    setCustomVpa('');
    setDebtAmount('');
    setDebtDuration('6');
    setDebtDueDate('5');
    setDebtEmi('');
    setDebtInterest('0');
    setShowDebtModal(false);
    showToast({
      type: 'success',
      title: 'Obligation Added',
      message: `"${debtName.trim()}" added to Whom to Pay obligations.`,
    });
  };

  // Handlers: Save "To Friend"
  const handleSaveToFriend = () => {
    if (!toFriendName.trim()) {
      showToast({
        type: 'warning',
        title: 'Required',
        message: "Please enter the friend's name.",
      });
      return;
    }
    const amount = parseFloat(toFriendAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast({
        type: 'warning',
        title: 'Invalid Amount',
        message: 'Please enter a valid amount greater than ₹0.',
      });
      return;
    }

    addLentRecord({
      personName: toFriendName.trim(),
      phone: toFriendPhone.trim(),
      amountRupees: amount,
      expectedReturnDate: toFriendExpectedDate.trim() || 'Next salary day',
      notes: toFriendNotes.trim(),
    });

    setToFriendName('');
    setToFriendPhone('');
    setToFriendAmount('');
    setToFriendExpectedDate('');
    setToFriendNotes('');
    setShowFriendModal(false);
    showToast({
      type: 'success',
      title: 'Friend Ledger Updated',
      message: `₹${amount.toLocaleString('en-IN')} lent to ${toFriendName.trim()} recorded.`,
    });
  };

  // Handlers: Save Secondary Bank Details
  const handleSaveBankConfig = () => {
    let finalVpa = bankVpaInput.trim();
    if (!finalVpa && bankMobileInput.trim().length === 10) {
      finalVpa = formatMobileToVPA(bankMobileInput.trim(), bankProvider);
    }

    if (!finalVpa) {
      Alert.alert('Required', 'Please enter a secondary savings bank UPI ID or 10-digit mobile number.');
      return;
    }

    setSavingsBankConfig({
      hasSecondarySavingsBank: true,
      savingsBankName: bankNameInput.trim() || 'Secondary Savings Account',
      savingsBankVpa: finalVpa,
      savingsBankMobile: bankMobileInput.trim(),
      savingsBankProvider: bankProvider,
    });

    setShowSavingsBankModal(false);
    Alert.alert('Configured', 'Secondary Savings Bank account connected for 1-tap transfer!');
  };

  // Handlers: Execute Self-Transfer of Unlocked Savings
  const handleExecuteSavingsSelfTransfer = async () => {
    if (!savingsBankConfig?.hasSecondarySavingsBank || !savingsBankConfig?.savingsBankVpa) {
      setShowSavingsBankModal(true);
      return;
    }

    const currentSavingsBudgetRupees = toRupees(allocations.savings || 0);
    const success = await launchUPIPayment({
      pa: savingsBankConfig.savingsBankVpa,
      pn: savingsBankConfig.savingsBankName || 'My Savings Account',
      am: String(currentSavingsBudgetRupees),
      tn: 'SalaryWay Monthly Savings Transfer',
    });

    if (success) {
      relockSavings();
    }
  };

  // Handlers: Pay Back Debt via UPI
  const handleOpenPayBackModal = (debtItem) => {
    setPayBackTargetDebt(debtItem);
    setPayBackMode(debtItem.monthlyEmiPaise > 0 ? 'emi' : 'full');
    setPayBackCustomAmount('');
  };

  const handleExecutePayBack = async () => {
    if (!payBackTargetDebt) return;

    let payPaise = 0;
    if (payBackMode === 'full') {
      payPaise = payBackTargetDebt.outstandingPaise;
    } else if (payBackMode === 'emi') {
      payPaise = payBackTargetDebt.monthlyEmiPaise || payBackTargetDebt.outstandingPaise;
    } else {
      const custom = parseFloat(payBackCustomAmount);
      if (isNaN(custom) || custom <= 0) {
        Alert.alert('Invalid Amount', 'Please enter a valid payback amount.');
        return;
      }
      payPaise = toPaise(custom);
    }

    const payRupees = toRupees(payPaise);
    const targetVpa =
      payBackTargetDebt.creditorVpa ||
      (payBackTargetDebt.creditorPhone ? formatMobileToVPA(payBackTargetDebt.creditorPhone, 'phonepe') : '');

    if (!targetVpa) {
      Alert.alert('No UPI ID', 'Please enter or edit the payee’s UPI ID in debt settings.');
      return;
    }

    const launched = await launchUPIPayment({
      pa: targetVpa,
      pn: payBackTargetDebt.creditorName || payBackTargetDebt.name,
      am: String(payRupees),
      tn: `Repayment for ${payBackTargetDebt.name}`,
    });

    if (launched) {
      recordDebtPayment(payBackTargetDebt.id, payPaise);
      setPayBackTargetDebt(null);
      Alert.alert('Repayment Recorded', `₹${payRupees} paid towards ${payBackTargetDebt.name}!`);
    }
  };

  // Handlers: Quick Contribute Goal
  const handleQuickContribute = () => {
    const amt = parseFloat(contributeAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter an amount greater than ₹0.');
      return;
    }
    contributeSavingsGoal(contributeGoalId, toPaise(amt));
    setContributeGoalId(null);
    setContributeAmount('');
  };

  // Handlers: WhatsApp Nudge for Lent Friend
  const handleNudgeFriend = (record) => {
    const text = encodeURIComponent(
      `Hey ${record.personName}, gentle reminder regarding the ₹${toRupees(
        record.amountPaise
      )} sent on ${record.date}. Let me know whenever you're ready to clear it. Thanks!`
    );
    const cleanPhone = record.phone.replace(/[^0-9]/g, '');
    const url = cleanPhone ? `whatsapp://send?phone=91${cleanPhone}&text=${text}` : `whatsapp://send?text=${text}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) Linking.openURL(url);
        else showToast({ type: 'warning', title: 'WhatsApp', message: 'WhatsApp is not installed on this device.' });
      })
      .catch(() => showToast({ type: 'error', title: 'Error', message: 'Unable to launch WhatsApp.' }));
  };

  const isAnyModalOpen =
    showGoalModal ||
    showDebtModal ||
    showFriendModal ||
    Boolean(payBackTargetDebt) ||
    showSavingsBankModal ||
    Boolean(contributeGoalId);

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: Math.max(insets.top, 28) }]}>
      {/* Header */}
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
            <Text style={[styles.headerTitle, { color: theme.text }]}>Wealth & Obligations</Text>
            <Text style={[styles.headerSwipeHint, { color: theme.textSecondary }]}>
              Swipe left/right to switch sections
            </Text>
          </View>
        </View>
      </View>

      {/* Segmented Tab Switcher */}
      <View
        style={[
          styles.tabSwitcher,
          {
            backgroundColor: theme.isDark ? '#1C1F24' : '#E5E7EB',
            borderColor: theme.border,
            borderWidth: theme.isDark ? 1 : 0,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.switchTab,
            activeTab === 'savings' && [
              styles.switchTabActive,
              { backgroundColor: theme.isDark ? '#252A32' : '#FFFFFF' },
            ],
          ]}
          onPress={() => handleSwitchTab('savings', 0)}
          activeOpacity={0.7}
        >
          <Feather
            name="shield"
            size={14}
            color={activeTab === 'savings' ? theme.primary : theme.textSecondary}
          />
          <Text
            style={[
              styles.switchText,
              { color: theme.textSecondary },
              activeTab === 'savings' && [styles.switchTextActive, { color: theme.text }],
            ]}
          >
            Savings Vault
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.switchTab,
            activeTab === 'debt' && [
              styles.switchTabActive,
              { backgroundColor: theme.isDark ? '#252A32' : '#FFFFFF' },
            ],
          ]}
          onPress={() => handleSwitchTab('debt', 1)}
          activeOpacity={0.7}
        >
          <Feather
            name="credit-card"
            size={14}
            color={activeTab === 'debt' ? '#D97706' : theme.textSecondary}
          />
          <Text
            style={[
              styles.switchText,
              { color: theme.textSecondary },
              activeTab === 'debt' && [styles.switchTextActive, { color: theme.text }],
            ]}
          >
            Whom to Pay
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.switchTab,
            activeTab === 'friend' && [
              styles.switchTabActive,
              { backgroundColor: theme.isDark ? '#252A32' : '#FFFFFF' },
            ],
          ]}
          onPress={() => handleSwitchTab('friend', 2)}
          activeOpacity={0.7}
        >
          <Feather
            name="users"
            size={14}
            color={activeTab === 'friend' ? '#BE185D' : theme.textSecondary}
          />
          <Text
            style={[
              styles.switchText,
              { color: theme.textSecondary },
              activeTab === 'friend' && [styles.switchTextActive, { color: theme.text }],
            ]}
          >
            To Friend
          </Text>
        </TouchableOpacity>
      </View>

      {/* Swipeable Pager for all 3 sections */}
      <ScrollView
        ref={horizontalScrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled={true}
        onMomentumScrollEnd={handleHorizontalScrollEnd}
        style={{ flex: 1 }}
      >
        {/* ==================================================== */}
        {/* PAGE 0: SAVINGS VAULT & GOALS */}
        {/* ==================================================== */}
        <View style={{ width: SCREEN_WIDTH }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Time-Locked Vault Banner */}
            <View
              style={[
                styles.vaultCard,
                {
                  backgroundColor: theme.isDark ? '#132E25' : '#F0FDF4',
                  borderColor: theme.isDark ? '#064E3B' : '#86EFAC',
                },
              ]}
            >
              <View style={styles.vaultHeader}>
                <View style={styles.vaultLeft}>
                  <View
                    style={[
                      styles.vaultIconBox,
                      { backgroundColor: theme.isDark ? '#064E3B' : '#DCFCE7' },
                    ]}
                  >
                    <Feather
                      name={isVaultUnlocked ? 'unlock' : 'lock'}
                      size={20}
                      color={isVaultUnlocked ? theme.primary : '#D97706'}
                    />
                  </View>
                  <View>
                    <Text style={[styles.vaultTitle, { color: theme.primaryText }]}>
                      {isVaultUnlocked
                        ? 'VAULT UNLOCKED FOR MONTH-END'
                        : `DISCIPLINE VAULT: ${daysLeftInMonth} DAYS LOCKED`}
                    </Text>
                    <Text style={[styles.vaultSub, { color: theme.textSecondary }]}>
                      {isVaultUnlocked
                        ? 'Savings ready for transfer to your bank'
                        : 'Locked until month ends to prevent impulse spends'}
                    </Text>
                  </View>
                </View>

                {!isVaultUnlocked && (
                  <TouchableOpacity
                    style={styles.vaultActionBtn}
                    onPress={() => {
                      Alert.alert(
                        'Break Savings Lock?',
                        'Are you facing an emergency? Breaking the lock resets your discipline streak.',
                        [
                          { text: 'Keep Locked', style: 'cancel' },
                          {
                            text: 'Break for Emergency',
                            style: 'destructive',
                            onPress: breakSavingsLock,
                          },
                        ]
                      );
                    }}
                  >
                    <Text style={styles.vaultActionText}>Emergency</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={[styles.vaultMetrics, { borderTopColor: theme.isDark ? '#064E3B' : '#DCFCE7' }]}>
                <View>
                  <Text style={[styles.vaultMetricLabel, { color: theme.textSecondary }]}>
                    Locked Vault Balance
                  </Text>
                  <Text style={[styles.vaultMetricVal, { color: theme.primaryText }]}>
                    {formatINR(allocations.savings || 0)}
                  </Text>
                </View>
                <View style={styles.streakBadge}>
                  <Feather name="zap" size={13} color="#D97706" />
                  <Text style={styles.streakText}>
                    Streak: {savingsVault.consecutiveLockedMonths || 1} Mos
                  </Text>
                </View>
              </View>
            </View>

            {/* If Vault Unlocked: Alert & 1-Tap Transfer */}
            {isVaultUnlocked && (
              <View
                style={[
                  styles.transferAlertCard,
                  {
                    backgroundColor: theme.isDark ? '#1C1F24' : '#ECFDF5',
                    borderColor: theme.isDark ? '#2B3038' : '#6EE7B7',
                  },
                ]}
              >
                <View style={styles.transferAlertHeader}>
                  <Feather name="check-circle" size={20} color={theme.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.transferAlertTitle, { color: theme.text }]}>
                      Month Ended: Transfer to Savings Bank
                    </Text>
                    <Text style={[styles.transferAlertSub, { color: theme.textSecondary }]}>
                      {savingsBankConfig?.hasSecondarySavingsBank
                        ? `Transfer ${formatINR(allocations.savings || 0)} directly to your ${savingsBankConfig.savingsBankName} via UPI.`
                        : 'Do you have a separate savings bank account? Transfer your saved money now to keep it safe from daily spending.'}
                    </Text>
                  </View>
                </View>

                <View style={styles.transferActionsRow}>
                  <TouchableOpacity
                    style={[styles.selfTransferBtn, { backgroundColor: theme.primary }]}
                    onPress={handleExecuteSavingsSelfTransfer}
                    activeOpacity={0.8}
                  >
                    <Feather name="arrow-up-right" size={15} color="#FFFFFF" />
                    <Text style={styles.selfTransferBtnText}>
                      {savingsBankConfig?.hasSecondarySavingsBank
                        ? '1-Tap Transfer via UPI'
                        : 'Set Up Savings Bank'}
                    </Text>
                  </TouchableOpacity>

                  {savingsBankConfig?.hasSecondarySavingsBank && (
                    <TouchableOpacity
                      style={[styles.editBankBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                      onPress={() => setShowSavingsBankModal(true)}
                    >
                      <Feather name="settings" size={14} color={theme.text} />
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.leaveVirtualBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={relockSavings}
                  >
                    <Text style={[styles.leaveVirtualText, { color: theme.textSecondary }]}>
                      Leave in App
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Savings Goals Overview */}
            <View
              style={[
                styles.overviewCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text style={[styles.overviewTitle, { color: theme.primaryText }]}>
                TOTAL SAVINGS ACCUMULATED
              </Text>
              <Text style={[styles.overviewAmount, { color: theme.text }]}>
                {formatINR(totalSavedPaise)}
              </Text>
              <Text style={[styles.overviewSub, { color: theme.textSecondary }]}>
                Target: {formatINR(totalTargetPaise)} across {savingsGoals.length} goals
              </Text>

              <View style={styles.overviewProgress}>
                <ProgressBar
                  progress={totalSavingsProgress}
                  color={theme.primary}
                  height={8}
                />
              </View>
              <Text style={[styles.progressPercentText, { color: theme.textSecondary }]}>
                {Math.round(totalSavingsProgress)}% Completed
              </Text>
            </View>

            {/* Goals List */}
            {savingsGoals.map((goal) => {
              const pct =
                goal.targetPaise > 0 ? (goal.savedPaise / goal.targetPaise) * 100 : 0;
              return (
                <View
                  key={goal.id}
                  style={[
                    styles.goalCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View style={styles.goalHeader}>
                    <View style={styles.goalLeft}>
                      <View
                        style={[
                          styles.goalIconBox,
                          { backgroundColor: theme.isDark ? '#132E25' : COLORS.savingsLight },
                        ]}
                      >
                        <Feather name="target" size={16} color={theme.primaryText} />
                      </View>
                      <View>
                        <Text style={[styles.goalName, { color: theme.text }]}>{goal.name}</Text>
                        <Text style={[styles.goalDate, { color: theme.textSecondary }]}>
                          Target: {goal.targetDate}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => deleteSavingsGoal(goal.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Feather name="trash-2" size={15} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.goalAmountsRow}>
                    <Text style={[styles.goalSavedText, { color: theme.text }]}>
                      {formatINR(goal.savedPaise)}
                    </Text>
                    <Text style={[styles.goalTargetText, { color: theme.textSecondary }]}>
                      Target: {formatINR(goal.targetPaise)}
                    </Text>
                  </View>

                  <ProgressBar progress={pct} color={theme.primary} height={6} />

                  <View style={styles.goalFooter}>
                    <Text style={[styles.pctBadge, { color: theme.primaryText }]}>
                      {Math.round(pct)}%
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.contributeBtn,
                        { backgroundColor: theme.isDark ? '#132E25' : COLORS.primaryLight },
                      ]}
                      onPress={() => setContributeGoalId(goal.id)}
                    >
                      <Feather name="plus" size={12} color={theme.primaryText} />
                      <Text style={[styles.contributeBtnText, { color: theme.primaryText }]}>
                        Add Funds
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            <View style={{ height: 100 }} />
          </ScrollView>
        </View>

        {/* ==================================================== */}
        {/* PAGE 1: WHOM TO PAY (DEBTS & LOANS) */}
        {/* ==================================================== */}
        <View style={{ width: SCREEN_WIDTH }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Zero-Debt Victory Banner */}
            {debts.length === 0 || totalOutstandingPaise === 0 ? (
              <View
                style={[
                  styles.zeroDebtBanner,
                  {
                    backgroundColor: theme.isDark ? '#132E25' : '#F0FDF4',
                    borderColor: theme.isDark ? '#064E3B' : '#86EFAC',
                  },
                ]}
              >
                <View style={styles.zeroDebtHeader}>
                  <Feather name="check-circle" size={24} color={theme.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.zeroDebtTitle, { color: theme.primaryText }]}>
                      You are 100% Debt-Free!
                    </Text>
                    <Text style={[styles.zeroDebtSub, { color: theme.textSecondary }]}>
                      Redirect your 10% debt allocation ({formatINR(allocations.debt || 0)})
                      to accelerate wealth:
                    </Text>
                  </View>
                </View>

                <View style={styles.redirectActions}>
                  <TouchableOpacity
                    style={[styles.redirectBtn, { backgroundColor: theme.primary }]}
                    onPress={() => {
                      redirectDebt('savings');
                      Alert.alert('Redirected', '10% budget redirected to Savings!');
                    }}
                  >
                    <Text style={styles.redirectBtnText}>To Savings (25%)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.redirectBtn, { backgroundColor: '#8B5CF6' }]}
                    onPress={() => {
                      redirectDebt('lifestyle');
                      Alert.alert('Redirected', '10% budget redirected to Lifestyle!');
                    }}
                  >
                    <Text style={styles.redirectBtnText}>To Lifestyle (15%)</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View
                style={[
                  styles.overviewCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.isDark ? '#3D2817' : '#FED7AA',
                  },
                ]}
              >
                <Text style={[styles.overviewTitle, { color: '#F59E0B' }]}>
                  TOTAL OUTSTANDING DEBT
                </Text>
                <Text style={[styles.overviewAmount, { color: theme.text }]}>
                  {formatINR(totalOutstandingPaise)}
                </Text>
                <View style={[styles.debtMetaRow, { borderTopColor: theme.border }]}>
                  <View style={styles.debtMetaItem}>
                    <Text style={[styles.debtMetaLabel, { color: theme.textSecondary }]}>
                      Monthly EMIs
                    </Text>
                    <Text style={[styles.debtMetaValue, { color: theme.text }]}>
                      {formatINR(totalMonthlyEmiPaise)}
                    </Text>
                  </View>
                  <View style={[styles.debtDivider, { backgroundColor: theme.border }]} />
                  <View style={styles.debtMetaItem}>
                    <Text style={[styles.debtMetaLabel, { color: theme.textSecondary }]}>
                      Active Obligations
                    </Text>
                    <Text style={[styles.debtMetaValue, { color: theme.text }]}>
                      {debts.filter((d) => d.status === 'active').length}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Active Debts List */}
            {debts.map((debt) => {
              const isSettled = debt.status === 'settled';
              return (
                <View
                  key={debt.id}
                  style={[
                    styles.debtCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                    isSettled && [
                      styles.debtCardSettled,
                      { backgroundColor: theme.isDark ? '#181C24' : '#F9FAFB' },
                    ],
                  ]}
                >
                  <View style={styles.debtHeader}>
                    <View style={styles.debtLeft}>
                      <View
                        style={[
                          styles.debtIconBox,
                          {
                            backgroundColor: theme.isDark ? '#2D2418' : COLORS.debtLight,
                          },
                        ]}
                      >
                        <Feather
                          name={debt.type === 'friend' ? 'user' : 'credit-card'}
                          size={16}
                          color="#F59E0B"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.debtName, { color: theme.text }]}>{debt.name}</Text>
                        <Text style={[styles.debtCreditor, { color: theme.textSecondary }]}>
                          {debt.type === 'friend' ? 'Friend: ' : 'Lender: '}
                          {debt.creditorName}
                          {debt.creditorPhone ? ` • ${debt.creditorPhone}` : ''}
                        </Text>
                      </View>
                    </View>

                    {isSettled ? (
                      <View style={[styles.settledBadge, { backgroundColor: theme.isDark ? '#132E25' : '#DCFCE7' }]}>
                        <Text style={[styles.settledText, { color: theme.primaryText }]}>
                          Settled
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => deleteDebt(debt.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Feather name="trash-2" size={15} color={theme.textSecondary} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.debtFiguresRow}>
                    <View>
                      <Text style={[styles.debtLabel, { color: theme.textSecondary }]}>
                        Outstanding
                      </Text>
                      <Text style={[styles.debtFigure, { color: theme.text }]}>
                        {formatINR(debt.outstandingPaise)}
                      </Text>
                    </View>
                    {debt.monthlyEmiPaise > 0 && (
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.debtLabel, { color: theme.textSecondary }]}>
                          Monthly EMI
                        </Text>
                        <Text style={[styles.debtFigureEmi, { color: '#F59E0B' }]}>
                          {formatINR(debt.monthlyEmiPaise)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {!isSettled && (
                    <View style={styles.debtActionsRow}>
                      <TouchableOpacity
                        style={[styles.payBackUpiBtn, { backgroundColor: theme.primary }]}
                        onPress={() => handleOpenPayBackModal(debt)}
                        activeOpacity={0.8}
                      >
                        <Feather name="send" size={14} color="#FFFFFF" />
                        <Text style={styles.payBackUpiBtnText}>Pay Back via UPI</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.markSettledBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        onPress={() => {
                          Alert.alert(
                            'Settle Debt',
                            `Mark ${debt.name} as fully settled?`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Settle', onPress: () => settleDebt(debt.id) },
                            ]
                          );
                        }}
                      >
                        <Feather name="check" size={14} color={theme.textSecondary} />
                        <Text style={[styles.markSettledBtnText, { color: theme.textSecondary }]}>
                          Settled
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}

            <View style={{ height: 100 }} />
          </ScrollView>
        </View>

        {/* ==================================================== */}
        {/* PAGE 2: TO FRIEND (LENT / RECOVERY LEDGER) */}
        {/* ==================================================== */}
        <View style={{ width: SCREEN_WIDTH }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Overview Card */}
            <View
              style={[
                styles.overviewCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.isDark ? '#3D1C28' : '#FBCFE8',
                },
              ]}
            >
              <Text style={[styles.overviewTitle, { color: '#EC4899' }]}>
                PENDING TO RECOVER (TO FRIEND)
              </Text>
              <Text style={[styles.overviewAmount, { color: theme.text }]}>
                {formatINR(pendingLentPaise)}
              </Text>
              <Text style={[styles.overviewSub, { color: theme.textSecondary }]}>
                Recovered: {formatINR(recoveredLentPaise)} • Never lose track of money given to friends
              </Text>
            </View>

            {/* Lent Entries List */}
            {lentRecords.length === 0 ? (
              <View
                style={[
                  styles.emptyContainer,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Feather name="users" size={36} color={theme.textSecondary} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  No Pending Friend Udhaar
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                  When you pay for a friend, tap "To Friend" below. We'll track it and help you nudge them via WhatsApp!
                </Text>
              </View>
            ) : (
              lentRecords.map((record) => {
                const isRecovered = record.status === 'recovered';
                return (
                  <View
                    key={record.id}
                    style={[
                      styles.lentCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                      isRecovered && [
                        styles.lentCardRecovered,
                        { backgroundColor: theme.isDark ? '#181C24' : '#F9FAFB' },
                      ],
                    ]}
                  >
                    <View style={styles.lentHeader}>
                      <View style={styles.lentLeft}>
                        <View
                          style={[
                            styles.lentIconBox,
                            {
                              backgroundColor: theme.isDark ? '#381628' : '#FDF2F8',
                            },
                          ]}
                        >
                          <Feather name="user-check" size={16} color="#EC4899" />
                        </View>
                        <View>
                          <Text style={[styles.lentName, { color: theme.text }]}>
                            {record.personName}
                          </Text>
                          <Text style={[styles.lentDate, { color: theme.textSecondary }]}>
                            Given on {record.date} • Due: {record.expectedReturnDate}
                          </Text>
                        </View>
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.lentAmount, { color: theme.text }]}>
                          {formatINR(record.amountPaise)}
                        </Text>
                        <Text
                          style={[
                            styles.lentStatusText,
                            isRecovered ? styles.statusRecovered : styles.statusPending,
                          ]}
                        >
                          {isRecovered ? 'RECOVERED' : 'PENDING'}
                        </Text>
                      </View>
                    </View>

                    {record.notes ? (
                      <Text
                        style={[
                          styles.lentNotes,
                          {
                            backgroundColor: theme.inputBg,
                            color: theme.textSecondary,
                          },
                        ]}
                      >
                        {record.notes}
                      </Text>
                    ) : null}

                    <View style={styles.lentActionsRow}>
                      {!isRecovered && (
                        <>
                          <TouchableOpacity
                            style={[
                              styles.nudgeBtn,
                              { backgroundColor: theme.isDark ? '#132E25' : '#DCFCE7' },
                            ]}
                            onPress={() => handleNudgeFriend(record)}
                          >
                            <Feather name="message-circle" size={13} color={theme.primaryText} />
                            <Text style={[styles.nudgeBtnText, { color: theme.primaryText }]}>
                              WhatsApp Nudge
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.markRecoveredBtn, { backgroundColor: theme.primary }]}
                            onPress={() => markLentRecovered(record.id)}
                          >
                            <Feather name="check-circle" size={13} color="#FFFFFF" />
                            <Text style={styles.markRecoveredText}>Recovered</Text>
                          </TouchableOpacity>
                        </>
                      )}

                      <TouchableOpacity
                        style={styles.deleteLentBtn}
                        onPress={() => deleteLentRecord(record.id)}
                      >
                        <Feather name="trash-2" size={15} color={theme.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}

            <View style={{ height: 100 }} />
          </ScrollView>
        </View>
      </ScrollView>

      {/* Standardized Center-Bottom Floating Action Button (Hidden when modal sheets are open to prevent overlapping) */}
      {!isAnyModalOpen && (
        <FloatingMajorButton
          title={
            activeTab === 'savings'
              ? 'New Goal'
              : activeTab === 'debt'
              ? 'Add Loan'
              : 'To Friend'
          }
          icon={
            activeTab === 'savings'
              ? 'target'
              : activeTab === 'debt'
              ? 'credit-card'
              : 'user-plus'
          }
          backgroundColor={theme.fabBg}
          textColor={theme.fabIcon === '#091510' ? '#091510' : '#FFFFFF'}
          onPress={() => {
            if (activeTab === 'savings') setShowGoalModal(true);
            else if (activeTab === 'debt') setShowDebtModal(true);
            else setShowFriendModal(true);
          }}
        />
      )}

      {/* ==================================================== */}
      {/* 1. Add Goal Modal (Smooth Mobile Bottom Sheet) */}
      {/* ==================================================== */}
      <Modal
        visible={showGoalModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGoalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setShowGoalModal(false)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%' }}
          >
            <View
              style={[
                styles.modalSheet,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              {/* Pull-down Sheet Handle */}
              <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />

                {/* Header with Back & Close buttons */}
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    onPress={() => setShowGoalModal(false)}
                    style={[styles.modalNavBtn, { backgroundColor: theme.inputBg }]}
                    activeOpacity={0.7}
                  >
                    <Feather name="arrow-left" size={18} color={theme.text} />
                  </TouchableOpacity>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>New Savings Goal</Text>
                  <TouchableOpacity
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    onPress={() => setShowGoalModal(false)}
                    style={[styles.modalNavBtn, { backgroundColor: theme.inputBg }]}
                    activeOpacity={0.7}
                  >
                    <Feather name="x" size={18} color={theme.text} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Goal Name</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.inputBg,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="e.g. Emergency Fund, New Laptop"
                  placeholderTextColor={theme.textSecondary}
                  value={goalName}
                  onChangeText={setGoalName}
                />

                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Target Amount (₹)</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.inputBg,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="e.g. 50000"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                  value={goalTarget}
                  onChangeText={setGoalTarget}
                />

                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Already Saved (₹)</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.inputBg,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="e.g. 10000"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                  value={goalSaved}
                  onChangeText={setGoalSaved}
                />

                <Button
                  title="Create Goal"
                  onPress={handleSaveGoal}
                  style={{ marginTop: SPACING.md }}
                />
              </View>
            </KeyboardAvoidingView>
          </View>
      </Modal>

      {/* ==================================================== */}
      {/* 2. Add Debt Modal (Smooth Mobile Bottom Sheet) */}
      {/* ==================================================== */}
      <Modal
        visible={showDebtModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDebtModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setShowDebtModal(false)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%', maxHeight: '92%' }}
          >
            <View
              style={[
                styles.modalSheet,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />

                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    onPress={() => setShowDebtModal(false)}
                    style={[styles.modalNavBtn, { backgroundColor: theme.inputBg }]}
                    activeOpacity={0.7}
                  >
                    <Feather name="arrow-left" size={18} color={theme.text} />
                  </TouchableOpacity>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Add Loan / Debt</Text>
                  <TouchableOpacity
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    onPress={() => setShowDebtModal(false)}
                    style={[styles.modalNavBtn, { backgroundColor: theme.inputBg }]}
                    activeOpacity={0.7}
                  >
                    <Feather name="x" size={18} color={theme.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 24 }}
                >
                  {/* Borrow Source Toggle */}
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                    Where did you borrow from?
                  </Text>
                  <View style={styles.borrowTypeRow}>
                    <TouchableOpacity
                      style={[
                        styles.borrowTypePill,
                        {
                          backgroundColor: theme.inputBg,
                          borderColor: theme.border,
                        },
                        debtType === 'friend' && {
                          backgroundColor: theme.primary,
                          borderColor: theme.primary,
                        },
                      ]}
                      onPress={() => {
                        setDebtType('friend');
                        setDebtInterest('0');
                      }}
                    >
                      <Feather
                        name="user"
                        size={15}
                        color={debtType === 'friend' ? '#FFFFFF' : theme.text}
                      />
                      <Text
                        style={[
                          styles.borrowTypeText,
                          { color: theme.text },
                          debtType === 'friend' && { color: '#FFFFFF' },
                        ]}
                      >
                        Friend / Relative
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.borrowTypePill,
                        {
                          backgroundColor: theme.inputBg,
                          borderColor: theme.border,
                        },
                        debtType === 'bank' && {
                          backgroundColor: theme.primary,
                          borderColor: theme.primary,
                        },
                      ]}
                      onPress={() => setDebtType('bank')}
                    >
                      <Feather
                        name="credit-card"
                        size={15}
                        color={debtType === 'bank' ? '#FFFFFF' : theme.text}
                      />
                      <Text
                        style={[
                          styles.borrowTypeText,
                          { color: theme.text },
                          debtType === 'bank' && { color: '#FFFFFF' },
                        ]}
                      >
                        Bank / Loan App
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Loan Name */}
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Loan Name</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: theme.inputBg,
                        borderColor: theme.border,
                        color: theme.text,
                      },
                    ]}
                    placeholder={debtType === 'friend' ? 'e.g. Vacation Loan from Rohit' : 'e.g. HDFC Personal Loan'}
                    placeholderTextColor={theme.textSecondary}
                    value={debtName}
                    onChangeText={setDebtName}
                  />

                  {/* Creditor / Person Name */}
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                    {debtType === 'friend' ? "Friend's Name" : 'Bank / App Name (e.g. KreditBee, SBI)'}
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: theme.inputBg,
                        borderColor: theme.border,
                        color: theme.text,
                      },
                    ]}
                    placeholder={debtType === 'friend' ? 'e.g. Rohit Verma' : 'e.g. HDFC Bank, KreditBee'}
                    placeholderTextColor={theme.textSecondary}
                    value={creditorName}
                    onChangeText={setCreditorName}
                  />

                  {/* If Friend: Phone Number & UPI App Provider */}
                  {debtType === 'friend' && (
                    <View
                      style={[
                        styles.friendUpiBox,
                        {
                          backgroundColor: theme.inputBg,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                        Friend's 10-Digit Mobile Number
                      </Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: theme.surface,
                            borderColor: theme.border,
                            color: theme.text,
                          },
                        ]}
                        placeholder="e.g. 9876543210"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="phone-pad"
                        value={friendPhone}
                        onChangeText={setFriendPhone}
                      />

                      <Text style={[styles.providerHelper, { color: theme.textSecondary }]}>
                        Which UPI app does your friend use?
                      </Text>
                      <View style={styles.providerRow}>
                        {UPI_HANDLES.map((h) => {
                          const isSelected = friendProvider === h.id;
                          return (
                            <TouchableOpacity
                              key={h.id}
                              style={[
                                styles.providerPill,
                                {
                                  backgroundColor: theme.surface,
                                  borderColor: theme.border,
                                },
                                isSelected && { backgroundColor: h.color, borderColor: h.color },
                              ]}
                              onPress={() => setFriendProvider(h.id)}
                            >
                              <Text
                                style={[
                                  styles.providerPillText,
                                  { color: theme.text },
                                  isSelected && { color: '#FFFFFF', fontWeight: '700' },
                                ]}
                              >
                                {h.name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {friendPhone.trim().length === 10 && (
                        <View
                          style={[
                            styles.resolvedFriendVpa,
                            { backgroundColor: theme.isDark ? '#132E25' : '#DCFCE7' },
                          ]}
                        >
                          <Feather name="check-circle" size={14} color={theme.primary} />
                          <Text style={[styles.resolvedFriendVpaText, { color: theme.primaryText }]}>
                            Payback UPI ID: {formatMobileToVPA(friendPhone.trim(), friendProvider)}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Total Loan Amount */}
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                    Loan / Outstanding Amount (₹)
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: theme.inputBg,
                        borderColor: theme.border,
                        color: theme.text,
                      },
                    ]}
                    placeholder="e.g. 25000"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                    value={debtAmount}
                    onChangeText={setDebtAmount}
                  />

                  {/* Duration and Due Date Row */}
                  <View style={{ flexDirection: 'row', gap: SPACING.md }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                        Duration (Months)
                      </Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: theme.inputBg,
                            borderColor: theme.border,
                            color: theme.text,
                          },
                        ]}
                        placeholder="e.g. 6"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="numeric"
                        value={debtDuration}
                        onChangeText={setDebtDuration}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                        Due Day of Month
                      </Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: theme.inputBg,
                            borderColor: theme.border,
                            color: theme.text,
                          },
                        ]}
                        placeholder="e.g. 10"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="numeric"
                        value={debtDueDate}
                        onChangeText={setDebtDueDate}
                      />
                    </View>
                  </View>

                  {/* Monthly EMI and Interest Rate Row */}
                  <View style={{ flexDirection: 'row', gap: SPACING.md }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                        Monthly EMI (₹)
                      </Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: theme.inputBg,
                            borderColor: theme.border,
                            color: theme.text,
                          },
                        ]}
                        placeholder={debtType === 'friend' ? '0 (Flexible)' : 'e.g. 2500'}
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="numeric"
                        value={debtEmi}
                        onChangeText={setDebtEmi}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                        Interest Rate (%)
                      </Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: theme.inputBg,
                            borderColor: theme.border,
                            color: theme.text,
                          },
                        ]}
                        placeholder="e.g. 0"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="numeric"
                        value={debtInterest}
                        onChangeText={setDebtInterest}
                      />
                    </View>
                  </View>

                  <Button
                    title="Add Loan to Whom to Pay"
                    onPress={handleSaveDebt}
                    style={{ marginTop: SPACING.md }}
                  />
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
      </Modal>

      {/* ==================================================== */}
      {/* 3. Add "To Friend" Modal (Smooth Mobile Bottom Sheet) */}
      {/* ==================================================== */}
      <Modal
        visible={showFriendModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFriendModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setShowFriendModal(false)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%', maxHeight: '90%' }}
          >
            <View
              style={[
                styles.modalSheet,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />

                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    onPress={() => setShowFriendModal(false)}
                    style={[styles.modalNavBtn, { backgroundColor: theme.inputBg }]}
                    activeOpacity={0.7}
                  >
                    <Feather name="arrow-left" size={18} color={theme.text} />
                  </TouchableOpacity>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Given to Friend</Text>
                  <TouchableOpacity
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    onPress={() => setShowFriendModal(false)}
                    style={[styles.modalNavBtn, { backgroundColor: theme.inputBg }]}
                    activeOpacity={0.7}
                  >
                    <Feather name="x" size={18} color={theme.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Friend's Name</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: theme.inputBg,
                        borderColor: theme.border,
                        color: theme.text,
                      },
                    ]}
                    placeholder="e.g. Rahul, Amit, Priya"
                    placeholderTextColor={theme.textSecondary}
                    value={toFriendName}
                    onChangeText={setToFriendName}
                  />

                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                    Mobile Number (Optional)
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: theme.inputBg,
                        borderColor: theme.border,
                        color: theme.text,
                      },
                    ]}
                    placeholder="e.g. 9876543210"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="phone-pad"
                    value={toFriendPhone}
                    onChangeText={setToFriendPhone}
                  />

                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Amount Given (₹)</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: theme.inputBg,
                        borderColor: theme.border,
                        color: theme.text,
                      },
                    ]}
                    placeholder="e.g. 2500"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                    value={toFriendAmount}
                    onChangeText={setToFriendAmount}
                  />

                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                    Expected Return Date (Optional)
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: theme.inputBg,
                        borderColor: theme.border,
                        color: theme.text,
                      },
                    ]}
                    placeholder="e.g. Next Salary Day, 30th Nov"
                    placeholderTextColor={theme.textSecondary}
                    value={toFriendExpectedDate}
                    onChangeText={setToFriendExpectedDate}
                  />

                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                    Reason / Notes (Optional)
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: theme.inputBg,
                        borderColor: theme.border,
                        color: theme.text,
                      },
                    ]}
                    placeholder="e.g. Dinner bill split, Emergency ride"
                    placeholderTextColor={theme.textSecondary}
                    value={toFriendNotes}
                    onChangeText={setToFriendNotes}
                  />

                  <Button
                    title="Add to Friend Ledger"
                    onPress={handleSaveToFriend}
                    style={{ marginTop: SPACING.md }}
                  />
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
      </Modal>

      {/* ==================================================== */}
      {/* 4. Pay Back Debt via UPI Modal */}
      {/* ==================================================== */}
      <Modal
        visible={payBackTargetDebt !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPayBackTargetDebt(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPayBackTargetDebt(null)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%' }}
          >
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View
                style={[
                  styles.modalSheet,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />

                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    onPress={() => setPayBackTargetDebt(null)}
                    style={[styles.modalNavBtn, { backgroundColor: theme.inputBg }]}
                    activeOpacity={0.7}
                  >
                    <Feather name="arrow-left" size={18} color={theme.text} />
                  </TouchableOpacity>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>
                    Pay Back {payBackTargetDebt?.creditorName}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setPayBackTargetDebt(null)}
                    style={[styles.modalNavBtn, { backgroundColor: theme.inputBg }]}
                    activeOpacity={0.7}
                  >
                    <Feather name="x" size={18} color={theme.text} />
                  </TouchableOpacity>
                </View>

                <View
                  style={[
                    styles.payBackInfoBox,
                    {
                      backgroundColor: theme.inputBg,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.payBackLoanTitle, { color: theme.text }]}>
                    {payBackTargetDebt?.name}
                  </Text>
                  <Text style={[styles.payBackVpa, { color: theme.primaryText }]}>
                    UPI ID: {payBackTargetDebt?.creditorVpa || `${payBackTargetDebt?.creditorPhone}@ybl`}
                  </Text>
                  <Text style={[styles.payBackTotalText, { color: '#F59E0B' }]}>
                    Total Outstanding: {formatINR(payBackTargetDebt?.outstandingPaise || 0)}
                  </Text>
                </View>

                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Choose Payback Amount
                </Text>
                <View style={styles.payBackOptionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.payBackOptionPill,
                      { backgroundColor: theme.inputBg, borderColor: theme.border },
                      payBackMode === 'full' && { backgroundColor: theme.primary, borderColor: theme.primary },
                    ]}
                    onPress={() => setPayBackMode('full')}
                  >
                    <Text
                      style={[
                        styles.payBackOptionText,
                        { color: theme.text },
                        payBackMode === 'full' && { color: '#FFFFFF' },
                      ]}
                    >
                      Full ({formatINR(payBackTargetDebt?.outstandingPaise || 0)})
                    </Text>
                  </TouchableOpacity>

                  {payBackTargetDebt?.monthlyEmiPaise > 0 && (
                    <TouchableOpacity
                      style={[
                        styles.payBackOptionPill,
                        { backgroundColor: theme.inputBg, borderColor: theme.border },
                        payBackMode === 'emi' && { backgroundColor: theme.primary, borderColor: theme.primary },
                      ]}
                      onPress={() => setPayBackMode('emi')}
                    >
                      <Text
                        style={[
                          styles.payBackOptionText,
                          { color: theme.text },
                          payBackMode === 'emi' && { color: '#FFFFFF' },
                        ]}
                      >
                        EMI ({formatINR(payBackTargetDebt.monthlyEmiPaise)})
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.payBackOptionPill,
                      { backgroundColor: theme.inputBg, borderColor: theme.border },
                      payBackMode === 'custom' && { backgroundColor: theme.primary, borderColor: theme.primary },
                    ]}
                    onPress={() => setPayBackMode('custom')}
                  >
                    <Text
                      style={[
                        styles.payBackOptionText,
                        { color: theme.text },
                        payBackMode === 'custom' && { color: '#FFFFFF' },
                      ]}
                    >
                      Custom
                    </Text>
                  </TouchableOpacity>
                </View>

                {payBackMode === 'custom' && (
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: theme.inputBg,
                        borderColor: theme.border,
                        color: theme.text,
                        marginTop: SPACING.sm,
                      },
                    ]}
                    placeholder="Enter custom amount in ₹"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                    autoFocus
                    value={payBackCustomAmount}
                    onChangeText={setPayBackCustomAmount}
                  />
                )}

                <Button
                  title="Launch UPI & Pay Back"
                  onPress={handleExecutePayBack}
                  style={{ marginTop: SPACING.lg }}
                />
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      {/* ==================================================== */}
      {/* 5. Secondary Savings Bank Setup Modal */}
      {/* ==================================================== */}
      <Modal
        visible={showSavingsBankModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSavingsBankModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSavingsBankModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%' }}
          >
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View
                style={[
                  styles.modalSheet,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />

                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    onPress={() => setShowSavingsBankModal(false)}
                    style={[styles.modalNavBtn, { backgroundColor: theme.inputBg }]}
                    activeOpacity={0.7}
                  >
                    <Feather name="arrow-left" size={18} color={theme.text} />
                  </TouchableOpacity>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Savings Bank Setup</Text>
                  <TouchableOpacity
                    onPress={() => setShowSavingsBankModal(false)}
                    style={[styles.modalNavBtn, { backgroundColor: theme.inputBg }]}
                    activeOpacity={0.7}
                  >
                    <Feather name="x" size={18} color={theme.text} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Bank Name</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.inputBg,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="e.g. HDFC Bank, SBI, ICICI Bank"
                  placeholderTextColor={theme.textSecondary}
                  value={bankNameInput}
                  onChangeText={setBankNameInput}
                />

                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Savings Account UPI ID / VPA
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.inputBg,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="e.g. myaccount@oksbi or 9876543210@paytm"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                  value={bankVpaInput}
                  onChangeText={setBankVpaInput}
                />

                <Text style={[styles.providerHelper, { color: theme.textSecondary }]}>
                  Or Enter Registered Mobile Number:
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.inputBg,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="e.g. 9876543210"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="phone-pad"
                  value={bankMobileInput}
                  onChangeText={setBankMobileInput}
                />

                <View style={styles.providerRow}>
                  {UPI_HANDLES.map((h) => (
                    <TouchableOpacity
                      key={h.id}
                      style={[
                        styles.providerPill,
                        { backgroundColor: theme.inputBg, borderColor: theme.border },
                        bankProvider === h.id && { backgroundColor: h.color, borderColor: h.color },
                      ]}
                      onPress={() => setBankProvider(h.id)}
                    >
                      <Text
                        style={[
                          styles.providerPillText,
                          { color: theme.text },
                          bankProvider === h.id && { color: '#FFFFFF', fontWeight: '700' },
                        ]}
                      >
                        {h.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Button
                  title="Save Savings Bank Details"
                  onPress={handleSaveBankConfig}
                  style={{ marginTop: SPACING.lg }}
                />
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      {/* ==================================================== */}
      {/* 6. Quick Add Funds Modal */}
      {/* ==================================================== */}
      <Modal
        visible={contributeGoalId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setContributeGoalId(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setContributeGoalId(null)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%' }}
          >
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View
                style={[
                  styles.modalSheet,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />

                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    onPress={() => setContributeGoalId(null)}
                    style={[styles.modalNavBtn, { backgroundColor: theme.inputBg }]}
                    activeOpacity={0.7}
                  >
                    <Feather name="arrow-left" size={18} color={theme.text} />
                  </TouchableOpacity>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Add Savings Funds</Text>
                  <TouchableOpacity
                    onPress={() => setContributeGoalId(null)}
                    style={[styles.modalNavBtn, { backgroundColor: theme.inputBg }]}
                    activeOpacity={0.7}
                  >
                    <Feather name="x" size={18} color={theme.text} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Contribution Amount (₹)
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.inputBg,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="e.g. 5000"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                  autoFocus
                  value={contributeAmount}
                  onChangeText={setContributeAmount}
                />
                <Button
                  title="Confirm Deposit"
                  onPress={handleQuickContribute}
                  style={{ marginTop: SPACING.md }}
                />
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
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
  headerSwipeHint: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tabSwitcher: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: RADIUS.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  switchTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  switchTabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  switchText: {
    fontSize: 11,
    fontWeight: '700',
  },
  switchTextActive: {
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },
  primaryFab: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: RADIUS.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 100,
  },
  primaryFabText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  vaultCard: {
    borderWidth: 1.5,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  vaultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  vaultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  vaultIconBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  vaultSub: {
    fontSize: 11,
    marginTop: 1,
  },
  vaultActionBtn: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
  },
  vaultActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  vaultMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
  },
  vaultMetricLabel: {
    fontSize: 11,
  },
  vaultMetricVal: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  transferAlertCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1.5,
    marginBottom: SPACING.lg,
  },
  transferAlertHeader: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  transferAlertTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  transferAlertSub: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  transferActionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  selfTransferBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
  },
  selfTransferBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  editBankBtn: {
    borderWidth: 1,
    padding: 8,
    borderRadius: RADIUS.md,
  },
  leaveVirtualBtn: {
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
  },
  leaveVirtualText: {
    fontSize: 12,
    fontWeight: '600',
  },
  overviewCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  overviewTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  overviewAmount: {
    fontSize: 28,
    fontWeight: '800',
    marginVertical: 4,
  },
  overviewSub: {
    fontSize: 13,
  },
  overviewProgress: {
    marginVertical: SPACING.md,
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  goalCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  goalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  goalIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalName: {
    fontSize: 15,
    fontWeight: '700',
  },
  goalDate: {
    fontSize: 11,
    marginTop: 1,
  },
  goalAmountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginVertical: SPACING.xs,
  },
  goalSavedText: {
    fontSize: 16,
    fontWeight: '700',
  },
  goalTargetText: {
    fontSize: 12,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  pctBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  contributeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
  },
  contributeBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  zeroDebtBanner: {
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    marginBottom: SPACING.lg,
  },
  zeroDebtHeader: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'flex-start',
  },
  zeroDebtTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  zeroDebtSub: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  redirectActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  redirectBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  redirectBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  debtMetaRow: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
  },
  debtMetaItem: {
    flex: 1,
  },
  debtDivider: {
    width: 1,
    height: 24,
    marginHorizontal: SPACING.md,
  },
  debtMetaLabel: {
    fontSize: 11,
  },
  debtMetaValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  debtCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  debtCardSettled: {
    opacity: 0.65,
  },
  debtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  debtLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  debtIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  debtName: {
    fontSize: 15,
    fontWeight: '700',
  },
  debtCreditor: {
    fontSize: 12,
    marginTop: 1,
  },
  settledBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
  },
  settledText: {
    fontSize: 11,
    fontWeight: '700',
  },
  debtFiguresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginVertical: SPACING.sm,
  },
  debtLabel: {
    fontSize: 11,
  },
  debtFigure: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  debtFigureEmi: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  debtActionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  payBackUpiBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  payBackUpiBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  markSettledBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  markSettledBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  lentCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  lentCardRecovered: {
    opacity: 0.65,
  },
  lentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  lentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  lentIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lentName: {
    fontSize: 15,
    fontWeight: '700',
  },
  lentDate: {
    fontSize: 11,
    marginTop: 1,
  },
  lentAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
  lentStatusText: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
  statusPending: {
    color: '#F59E0B',
  },
  statusRecovered: {
    color: '#10B981',
  },
  lentNotes: {
    fontSize: 12,
    padding: 6,
    borderRadius: RADIUS.sm,
    marginVertical: SPACING.xs,
  },
  lentActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
  },
  nudgeBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
  },
  nudgeBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  markRecoveredBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
  },
  markRecoveredText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteLentBtn: {
    padding: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 100,
  },
  modalSheet: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxl,
    maxHeight: '92%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginVertical: SPACING.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    marginTop: SPACING.xs,
  },
  modalNavBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 4,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 48,
    fontSize: 14,
    marginBottom: SPACING.md,
  },
  borrowTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.md,
  },
  borrowTypePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  borrowTypeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  friendUpiBox: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  providerHelper: {
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '600',
  },
  providerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  providerPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  providerPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  resolvedFriendVpa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: RADIUS.sm,
    marginTop: 4,
  },
  resolvedFriendVpaText: {
    fontSize: 12,
    fontWeight: '700',
  },
  payBackInfoBox: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  payBackLoanTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  payBackVpa: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  payBackTotalText: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  payBackOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  payBackOptionPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  payBackOptionText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
