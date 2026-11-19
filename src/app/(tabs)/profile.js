import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFinanceStore } from '../../store/useFinanceStore';
import { COLORS, CATEGORIES, SPACING, RADIUS, useAppTheme } from '../../constants/theme';
import { formatINR, toPaise } from '../../services/financialCalc';
import { BankIntegrationService } from '../../services/bankIntegration';
import { parseBankSMS } from '../../services/smsParser';
import Button from '../../components/Button';
import TactileTouch from '../../components/TactileTouch';

export default function ProfileScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const themeMode = useFinanceStore((state) => state.themeMode || 'system');
  const setThemeMode = useFinanceStore((state) => state.setThemeMode);

  const user = useFinanceStore((state) => state.user);
  const updateUserProfile = useFinanceStore((state) => state.updateUserProfile);
  const getCurrentMonthData = useFinanceStore((state) => state.getCurrentMonthData);
  const updatePercentages = useFinanceStore((state) => state.updatePercentages);
  const redirectDebt = useFinanceStore((state) => state.redirectDebt);
  const resetAllData = useFinanceStore((state) => state.resetAllData);
  const addTransaction = useFinanceStore((state) => state.addTransaction);

  const security = useFinanceStore((state) => state.security);
  const setAppPin = useFinanceStore((state) => state.setAppPin);
  const showToast = useFinanceStore((state) => state.showToast);

  const monthData = getCurrentMonthData();
  const { salaryPaise, percentages } = monthData;

  const [allocState, setAllocState] = useState(
    percentages || {
      essential: 55,
      lifestyle: 5,
      debt: 10,
      savings: 15,
      personal: 15,
    }
  );

  React.useEffect(() => {
    if (percentages) {
      setAllocState(percentages);
    }
  }, [percentages]);

  const [bankConnected, setBankConnected] = useState(BankIntegrationService.isConnected());
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');

  // Profile editing state
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editOccupation, setEditOccupation] = useState(user.occupation);
  const [editEmail, setEditEmail] = useState(user.email);

  // SMS Tester Modal & Rich Detected Popup State
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [detectedSmsData, setDetectedSmsData] = useState(null);
  const [testSmsText, setTestSmsText] = useState(
    'Sent Rs. 340.00 from HDFC Bank A/c **1234 to Swiggy on 19-Nov-26. Info: UPI/4321098'
  );

  const handleBankToggle = async () => {
    if (bankConnected) {
      await BankIntegrationService.disconnect();
      setBankConnected(false);
      showToast({ type: 'info', title: 'Disconnected', message: 'Demo Account Aggregator consent has been revoked.' });
    } else {
      const res = await BankIntegrationService.connectAccountAggregator();
      setBankConnected(true);
      showToast({ type: 'success', title: 'Connected (Demo)', message: res.message });
    }
  };

  const handleImportBankFeed = async () => {
    if (!bankConnected) {
      showToast({ type: 'warning', title: 'Notice', message: 'Connect the demo bank aggregator first.' });
      return;
    }
    const res = await BankIntegrationService.fetchDemoTransactions();
    if (res.success) {
      let imported = 0;
      res.transactions.forEach((tx) => {
        const added = addTransaction(tx);
        if (added.success) imported++;
      });
      showToast({ type: 'success', title: 'Import Complete', message: `Imported ${imported} transactions from demo feed.` });
    }
  };

  const handleSaveAllocations = () => {
    const res = updatePercentages(allocState);
    if (!res.success) {
      showToast({ type: 'warning', title: 'Invalid Allocation', message: res.error });
      return;
    }
    setShowAllocModal(false);
    showToast({ type: 'success', title: 'Allocations Saved', message: 'Category budget percentages updated!' });
  };

  const handleRedirectDebt = (target) => {
    Alert.alert(
      'Redirect Debt Allocation',
      `Move 10% debt allocation to ${target === 'savings' ? 'Savings' : 'Invest in Myself'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            redirectDebt(target);
            showToast({ type: 'success', title: 'Debt Redirected', message: `10% allocation redirected to ${target === 'savings' ? 'Savings' : 'Invest in Myself'}.` });
          },
        },
      ]
    );
  };

  const handleSavePin = () => {
    if (pinInput.length !== 4) {
      showToast({ type: 'warning', title: 'Invalid PIN', message: 'Please enter a 4-digit numeric PIN.' });
      return;
    }
    setAppPin(pinInput);
    setShowPinModal(false);
    setPinInput('');
    showToast({ type: 'success', title: 'Security Enabled', message: 'App lock PIN has been configured.' });
  };

  const handleSaveProfile = () => {
    if (!editName.trim()) {
      showToast({ type: 'warning', title: 'Required', message: 'Please enter your name.' });
      return;
    }
    updateUserProfile({
      name: editName.trim(),
      occupation: editOccupation.trim(),
      email: editEmail.trim(),
    });
    setShowEditProfileModal(false);
    showToast({ type: 'success', title: 'Profile Updated', message: 'Your personal details have been saved.' });
  };

  const handleTestSmsParse = () => {
    const parsed = parseBankSMS(testSmsText);
    if (!parsed) {
      showToast({ type: 'warning', title: 'SMS Parsing', message: 'No debit transaction detected in this message.' });
      return;
    }
    setShowSmsModal(false);
    setDetectedSmsData(parsed);
  };

  const handleConfirmSmsRecord = () => {
    if (!detectedSmsData) return;
    addTransaction({
      title: detectedSmsData.title,
      amountPaise: toPaise(detectedSmsData.amountRupees),
      category: detectedSmsData.category,
      subcategory: 'SMS Auto-Capture',
      paymentMethod: 'UPI',
      type: 'expense',
      merchant: detectedSmsData.merchant,
      date: detectedSmsData.date,
    });
    setDetectedSmsData(null);
    showToast({ type: 'success', title: 'Expense Recorded', message: 'Expense logged automatically into your pocket!' });
  };

  const handleReset = () => {
    Alert.alert(
      'Reset All Data',
      'Are you sure you want to restore default demo data? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetAllData();
            Alert.alert('Reset Complete', 'Default demo financial data restored.');
          },
        },
      ]
    );
  };

  const totalAlloc = Object.values(allocState).reduce((a, b) => Number(a) + Number(b), 0);

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: Math.max(insets.top, 28) }]}>
      <View style={[styles.header, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
        <TactileTouch
          onPress={() => router.replace('/(tabs)')}
          style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="arrow-left" size={18} color={theme.text} />
        </TactileTouch>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings & Profile</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + SPACING.xl }]}
      >
        {/* User Card with Edit Profile Capability */}
        <View style={[styles.userCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.avatarBox, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>
              {(user.name || 'AS')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.text }]}>{user.name}</Text>
            <Text style={[styles.userRole, { color: theme.textSecondary }]}>{user.occupation}</Text>
            <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{user.email}</Text>
          </View>

          <TactileTouch
            style={[
              styles.editProfileBtn,
              {
                backgroundColor: theme.isDark ? '#252A32' : '#F1F5F9',
                borderColor: theme.border,
              },
            ]}
            onPress={() => {
              setEditName(user.name);
              setEditOccupation(user.occupation);
              setEditEmail(user.email);
              setShowEditProfileModal(true);
            }}
          >
            <Feather name="edit-2" size={13} color={theme.text} />
            <Text style={[styles.editProfileBtnText, { color: theme.text }]}>Edit</Text>
          </TactileTouch>
        </View>

        {/* Appearance & Theme (Fixed Width, Precision Alignment, Professional Finish) */}
        <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance & Theme</Text>
          <View
            style={[
              styles.themeSelectorRow,
              {
                backgroundColor: theme.isDark ? '#1C1F24' : '#F1F5F9',
                borderColor: theme.border,
              },
            ]}
          >
            {[
              { id: 'light', label: 'Light', icon: 'sun' },
              { id: 'dark', label: 'Dark', icon: 'moon' },
              { id: 'system', label: 'System', icon: 'smartphone' },
            ].map((opt) => {
              const isSelected = themeMode === opt.id;
              return (
                <TactileTouch
                  key={opt.id}
                  style={[
                    styles.themeOptionBtn,
                    isSelected && [
                      styles.themeOptionActive,
                      { backgroundColor: theme.primary },
                    ],
                  ]}
                  onPress={() => setThemeMode(opt.id)}
                >
                  <Feather
                    name={opt.icon}
                    size={15}
                    color={isSelected ? '#FFFFFF' : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.themeOptionText,
                      { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                      isSelected && { fontWeight: '700' },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TactileTouch>
              );
            })}
          </View>
        </View>

        {/* Data & Statements */}
        <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Data & Statements</Text>

          <TactileTouch
            style={[styles.settingRow, { borderBottomColor: theme.border }]}
            onPress={() => router.push('/modal/export-statement')}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconWrap, { backgroundColor: theme.isDark ? '#132E25' : '#E6F7F3' }]}>
                <Feather name="file-text" size={17} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>Download Statements (CSV)</Text>
                <Text style={[styles.settingValue, { color: theme.textSecondary }]}>Custom date range, month, or year</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={theme.textSecondary} />
          </TactileTouch>
        </View>

        {/* Budget & Allocation Rules */}
        <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Budget & Allocation Rules</Text>

          <TactileTouch
            style={[styles.settingRow, { borderBottomColor: theme.border }]}
            onPress={() => router.push('/modal/edit-salary')}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconWrap, { backgroundColor: theme.isDark ? '#132E25' : '#E6F7F3' }]}>
                <Feather name="dollar-sign" size={17} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>Monthly Salary</Text>
                <Text style={[styles.settingValue, { color: theme.textSecondary }]}>{formatINR(salaryPaise)}</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={theme.textSecondary} />
          </TactileTouch>

          <TactileTouch
            style={[styles.settingRow, { borderBottomColor: theme.border }]}
            onPress={() => {
              setAllocState({ ...percentages });
              setShowAllocModal(true);
            }}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconWrap, { backgroundColor: theme.isDark ? '#132E25' : '#E6F7F3' }]}>
                <Feather name="sliders" size={17} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>Category Percentages</Text>
                <Text style={[styles.settingValue, { color: theme.textSecondary }]}>
                  {percentages.essential}% / {percentages.lifestyle}% /{' '}
                  {percentages.debt}% / {percentages.savings}% / {percentages.personal}%
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={theme.textSecondary} />
          </TactileTouch>

          {/* Zero Debt Redirection Shortcut */}
          {percentages.debt > 0 && (
            <View
              style={[
                styles.redirectBox,
                {
                  backgroundColor: theme.isDark ? '#132E25' : '#F0FDF4',
                  borderColor: theme.isDark ? '#064E3B' : '#DCFCE7',
                },
              ]}
            >
              <Text style={[styles.redirectTitle, { color: theme.primary }]}>No Active Debt?</Text>
              <Text style={[styles.redirectSub, { color: theme.textSecondary }]}>
                Redirect your {percentages.debt}% debt budget to other goals:
              </Text>
              <View style={styles.redirectButtonsRow}>
                <TactileTouch
                  style={[styles.redirectPill, { backgroundColor: theme.primary }]}
                  onPress={() => handleRedirectDebt('savings')}
                >
                  <Text style={styles.redirectPillText}>+ To Savings</Text>
                </TactileTouch>
                <TactileTouch
                  style={[styles.redirectPill, { backgroundColor: theme.primary }]}
                  onPress={() => handleRedirectDebt('personal')}
                >
                  <Text style={styles.redirectPillText}>+ To Invest in Myself</Text>
                </TactileTouch>
              </View>
            </View>
          )}
        </View>

        {/* Automation: Bank SMS Auto-Capture */}
        <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Smart Automation</Text>

          <TactileTouch
            style={[styles.settingRow, { borderBottomColor: theme.border }]}
            onPress={() => setShowSmsModal(true)}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconWrap, { backgroundColor: theme.isDark ? '#2D2418' : '#FEF3C7' }]}>
                <Feather name="cpu" size={17} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>Bank SMS Auto-Capture</Text>
                <Text style={[styles.settingValue, { color: theme.textSecondary }]}>
                  Simulate or test auto-parsing of bank debits
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={theme.textSecondary} />
          </TactileTouch>
        </View>

        {/* Security & App Lock */}
        <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Security & Privacy</Text>

          <TactileTouch
            style={[styles.settingRow, { borderBottomColor: theme.border }]}
            onPress={() => setShowPinModal(true)}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconWrap, { backgroundColor: theme.isDark ? '#132E25' : '#E6F7F3' }]}>
                <Feather name="lock" size={17} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>App Lock PIN</Text>
                <Text style={[styles.settingValue, { color: theme.textSecondary }]}>
                  {security.pinEnabled ? 'PIN Lock Active' : 'Disabled (Tap to set)'}
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={theme.textSecondary} />
          </TactileTouch>

          <TactileTouch style={[styles.settingRow, { borderBottomWidth: 0 }]} onPress={handleReset}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconWrap, { backgroundColor: theme.isDark ? '#2A1618' : '#FEE2E2' }]}>
                <Feather name="refresh-cw" size={17} color={COLORS.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingLabel, { color: COLORS.danger }]}>
                  Reset to Demo Data
                </Text>
                <Text style={[styles.settingValue, { color: theme.textSecondary }]}>Restores default initial state</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={theme.textSecondary} />
          </TactileTouch>
        </View>

        {/* App Info Footer */}
        <View style={styles.footerInfo}>
          <Text style={[styles.appTitle, { color: theme.text }]}>SalaryWay v1.0.0</Text>
          <Text style={[styles.appTagline, { color: theme.textSecondary }]}>Give Every Rupee a Direction</Text>
          <Text style={styles.appBuild}>SDK 58 • Android APK Ready</Text>
        </View>
      </ScrollView>

      {/* 1. Allocation Edit Modal */}
      <Modal visible={showAllocModal} transparent animationType="slide" onRequestClose={() => setShowAllocModal(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View
                style={[
                  styles.modalSheet,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    paddingBottom: Math.max(insets.bottom, 24),
                  },
                ]}
              >
                <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />

                <View style={styles.modalHeader}>
                  <Text style={[styles.modalSheetTitle, { color: theme.text }]}>Adjust Allocations</Text>
                  <TactileTouch
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    onPress={() => setShowAllocModal(false)}
                    style={[styles.modalNavBtn, { backgroundColor: theme.inputBg }]}
                  >
                    <Feather name="x" size={18} color={theme.text} />
                  </TactileTouch>
                </View>

                <Text style={[styles.modalSub, { color: theme.textSecondary }]}>
                  Total must equal exactly 100%. Current sum:{' '}
                  <Text
                    style={{
                      fontWeight: '700',
                      color: totalAlloc === 100 ? theme.primary : COLORS.danger,
                    }}
                  >
                    {totalAlloc}%
                  </Text>
                </Text>

                {CATEGORIES.map((cat) => (
                  <View key={cat.id} style={styles.allocInputRow}>
                    <View style={styles.allocInputLeft}>
                      <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                      <Text style={[styles.allocCatName, { color: theme.text }]}>{cat.name}</Text>
                    </View>
                    <View style={styles.allocInputRight}>
                      <TextInput
                        style={[
                          styles.allocTextInput,
                          {
                            backgroundColor: theme.inputBg,
                            borderColor: theme.border,
                            color: theme.text,
                          },
                        ]}
                        keyboardType="numeric"
                        value={String(allocState[cat.id] ?? 0)}
                        onChangeText={(val) =>
                          setAllocState((prev) => ({
                            ...prev,
                            [cat.id]: parseInt(val, 10) || 0,
                          }))
                        }
                      />
                      <Text style={[styles.percentSymbol, { color: theme.textSecondary }]}>%</Text>
                    </View>
                  </View>
                ))}

                <Button
                  title="Save Allocations"
                  onPress={handleSaveAllocations}
                  disabled={totalAlloc !== 100}
                  style={{ marginTop: SPACING.lg }}
                />
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* 2. PIN Setup Modal */}
      <Modal visible={showPinModal} transparent animationType="fade" onRequestClose={() => setShowPinModal(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View
                style={[
                  styles.modalSheet,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    paddingBottom: Math.max(insets.bottom, 24),
                  },
                ]}
              >
                <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />

                <View style={styles.modalHeader}>
                  <Text style={[styles.modalSheetTitle, { color: theme.text }]}>Set App Lock PIN</Text>
                  <TactileTouch
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    onPress={() => setShowPinModal(false)}
                    style={[styles.modalNavBtn, { backgroundColor: theme.inputBg }]}
                  >
                    <Feather name="x" size={18} color={theme.text} />
                  </TactileTouch>
                </View>

                <Text style={[styles.modalSub, { color: theme.textSecondary }]}>
                  Enter a 4-digit PIN to secure your financial statements.
                </Text>

                <TextInput
                  style={[
                    styles.allocTextInput,
                    {
                      width: 140,
                      height: 52,
                      fontSize: 26,
                      alignSelf: 'center',
                      marginVertical: SPACING.lg,
                      backgroundColor: theme.inputBg,
                      borderColor: theme.border,
                      color: theme.text,
                      borderRadius: RADIUS.lg,
                    },
                  ]}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  autoFocus
                  value={pinInput}
                  onChangeText={setPinInput}
                  placeholder="••••"
                  placeholderTextColor={theme.textSecondary}
                />

                <Button
                  title="Save PIN Lock"
                  onPress={handleSavePin}
                  disabled={pinInput.length !== 4}
                  style={{ marginTop: SPACING.sm }}
                />
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* 3. SMS Simulator Modal */}
      <Modal visible={showSmsModal} transparent animationType="slide" onRequestClose={() => setShowSmsModal(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View
                style={[
                  styles.modalSheet,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    paddingBottom: Math.max(insets.bottom, 24),
                  },
                ]}
              >
                <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />

                <View style={styles.modalHeader}>
                  <Text style={[styles.modalSheetTitle, { color: theme.text }]}>Bank SMS Auto-Capture</Text>
                  <TactileTouch
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    onPress={() => setShowSmsModal(false)}
                    style={[styles.modalNavBtn, { backgroundColor: theme.inputBg }]}
                  >
                    <Feather name="x" size={18} color={theme.text} />
                  </TactileTouch>
                </View>

                <Text style={[styles.modalSub, { color: theme.textSecondary }]}>
                  Paste any Indian bank debit SMS to test how SalaryWay extracts the amount and assigns the pocket:
                </Text>

                <TextInput
                  style={[
                    styles.smsInput,
                    {
                      backgroundColor: theme.inputBg,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  multiline
                  numberOfLines={4}
                  value={testSmsText}
                  onChangeText={setTestSmsText}
                  placeholderTextColor={theme.textSecondary}
                />

                <Button
                  title="Parse & Auto-Log Expense"
                  onPress={handleTestSmsParse}
                  style={{ marginTop: SPACING.md }}
                />
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Custom Animated Fintech-Grade "SMS Detected!" Popup Modal */}
      <Modal
        visible={detectedSmsData !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setDetectedSmsData(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setDetectedSmsData(null)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>

          {detectedSmsData && (
            <View
              style={[
                styles.smsDetectedSheet,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              {/* Top Accent Icon & Badge */}
              <View style={styles.smsDetectedHeader}>
                <View style={[styles.smsVerifiedIconBox, { backgroundColor: theme.isDark ? '#132E25' : '#E8F5EF' }]}>
                  <Feather name="shield" size={22} color={theme.primary} />
                </View>
                <View style={[styles.smsLiveBadge, { backgroundColor: theme.primary }]}>
                  <Text style={styles.smsLiveBadgeText}>SMS AUTO-DETECTED</Text>
                </View>
              </View>

              {/* Big Detected Amount */}
              <View style={styles.smsAmountCenter}>
                <Text style={[styles.smsAmountText, { color: theme.text }]}>
                  ₹{detectedSmsData.amountRupees}
                </Text>
                <Text style={[styles.smsAmountSub, { color: theme.textSecondary }]}>
                  Debited from your bank account
                </Text>
              </View>

              {/* Details Card */}
              <View
                style={[
                  styles.smsDetailsCard,
                  {
                    backgroundColor: theme.isDark ? '#15181C' : '#F8FAFC',
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={styles.smsDetailRow}>
                  <Text style={[styles.smsDetailLabel, { color: theme.textSecondary }]}>Merchant / Payee</Text>
                  <View style={styles.smsDetailValBox}>
                    <Feather name="check-circle" size={13} color={theme.primary} />
                    <Text style={[styles.smsDetailVal, { color: theme.text }]}>
                      {detectedSmsData.merchant || 'Merchant'}
                    </Text>
                  </View>
                </View>

                <View style={[styles.smsDetailDiv, { backgroundColor: theme.border }]} />

                <View style={styles.smsDetailRow}>
                  <Text style={[styles.smsDetailLabel, { color: theme.textSecondary }]}>Assigned Pocket</Text>
                  <View style={[styles.smsPocketBadge, { backgroundColor: theme.isDark ? '#1C1F24' : '#E6F7F3' }]}>
                    <Text style={[styles.smsPocketText, { color: theme.primary }]}>
                      {detectedSmsData.category.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={[styles.smsDetailDiv, { backgroundColor: theme.border }]} />

                <View style={styles.smsDetailRow}>
                  <Text style={[styles.smsDetailLabel, { color: theme.textSecondary }]}>Payment Title</Text>
                  <Text style={[styles.smsDetailVal, { color: theme.text }]}>
                    {detectedSmsData.title}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.smsActionButtonsRow}>
                <TactileTouch
                  style={[
                    styles.smsActionPrimaryBtn,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={handleConfirmSmsRecord}
                >
                  <Feather name="check" size={18} color="#FFFFFF" />
                  <Text style={styles.smsActionPrimaryText}>Auto-Record to Pocket</Text>
                </TactileTouch>

                <TactileTouch
                  style={[
                    styles.smsActionSecondaryBtn,
                    {
                      backgroundColor: theme.isDark ? '#252A32' : '#F1F5F9',
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => setDetectedSmsData(null)}
                >
                  <Text style={[styles.smsActionSecondaryText, { color: theme.textSecondary }]}>
                    Dismiss
                  </Text>
                </TactileTouch>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfileModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setShowEditProfileModal(false)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%' }}
          >
            <View style={[styles.modalSheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Profile</Text>
                <TactileTouch
                  onPress={() => setShowEditProfileModal(false)}
                  style={[styles.modalNavBtn, { backgroundColor: theme.inputBg }]}
                >
                  <Feather name="x" size={18} color={theme.text} />
                </TactileTouch>
              </View>

              <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>Full Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter full name"
                placeholderTextColor={theme.textSecondary}
              />

              <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>Occupation / Role</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                value={editOccupation}
                onChangeText={setEditOccupation}
                placeholder="e.g. Senior Software Engineer"
                placeholderTextColor={theme.textSecondary}
              />

              <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>Email Address</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Enter email address"
                placeholderTextColor={theme.textSecondary}
              />

              <Button
                title="Save Profile"
                onPress={handleSaveProfile}
                style={{ marginTop: SPACING.lg }}
              />
            </View>
          </KeyboardAvoidingView>
        </View>
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
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    marginBottom: SPACING.md,
    gap: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
  },
  userRole: {
    fontSize: 12,
    marginTop: 1,
  },
  userEmail: {
    fontSize: 12,
    marginTop: 1,
  },
  sectionCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    letterSpacing: -0.2,
  },
  themeSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 48,
    padding: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginTop: SPACING.sm,
  },
  themeOptionBtn: {
    flex: 1,
    minWidth: 0,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: RADIUS.full,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  editProfileBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  smsDetectedSheet: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderWidth: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  smsDetectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  smsVerifiedIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smsLiveBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
  },
  smsLiveBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  smsAmountCenter: {
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  smsAmountText: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  smsAmountSub: {
    fontSize: 12,
    marginTop: 2,
  },
  smsDetailsCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    marginVertical: SPACING.md,
  },
  smsDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  smsDetailLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  smsDetailValBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  smsDetailVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  smsDetailDiv: {
    width: '100%',
    height: 1,
    marginVertical: SPACING.sm,
  },
  smsPocketBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
  },
  smsPocketText: {
    fontSize: 11,
    fontWeight: '700',
  },
  smsActionButtonsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  smsActionPrimaryBtn: {
    flex: 2,
    height: 48,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  smsActionPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  smsActionSecondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  smsActionSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  themeOptionActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 3,
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  settingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingValue: {
    fontSize: 12,
    marginTop: 2,
  },
  redirectBox: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.md,
    borderWidth: 1,
  },
  redirectTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  redirectSub: {
    fontSize: 12,
    marginVertical: 4,
  },
  redirectButtonsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  redirectPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
  },
  redirectPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  footerInfo: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  appTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  appTagline: {
    fontSize: 12,
    marginTop: 2,
  },
  appBuild: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
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
    marginBottom: SPACING.xs,
  },
  modalNavBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  modalSub: {
    fontSize: 13,
    marginBottom: SPACING.md,
  },
  allocInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  allocInputLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  allocCatName: {
    fontSize: 14,
    fontWeight: '600',
  },
  allocInputRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  allocTextInput: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    width: 56,
    height: 40,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 14,
  },
  percentSymbol: {
    fontSize: 14,
    fontWeight: '600',
  },
  smsInput: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    fontSize: 13,
    textAlignVertical: 'top',
    minHeight: 88,
  },
});
