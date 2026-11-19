import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFinanceStore } from '../../store/useFinanceStore';
import { COLORS, SPACING, RADIUS, useAppTheme } from '../../constants/theme';
import { toPaise } from '../../services/financialCalc';
import TactileTouch from '../../components/TactileTouch';
import FloatingMajorButton from '../../components/FloatingMajorButton';
import {
  launchUPIPayment,
  parseUPIQRCode,
  formatMobileToVPA,
  detectUPIProvider,
  UPI_HANDLES,
} from '../../services/upiLauncher';

const POCKET_OPTIONS = [
  { id: 'essential', name: 'Essential', icon: 'home', color: COLORS.essential, colorLight: COLORS.essentialLight },
  { id: 'lifestyle', name: 'Lifestyle', icon: 'coffee', color: COLORS.lifestyle, colorLight: COLORS.lifestyleLight },
  { id: 'debt', name: 'Whom to Pay (Debt)', icon: 'credit-card', color: COLORS.debt, colorLight: COLORS.debtLight },
  { id: 'savings', name: 'Savings Vault', icon: 'trending-up', color: COLORS.savings, colorLight: COLORS.savingsLight },
  { id: 'personal', name: 'Personal Growth', icon: 'book-open', color: COLORS.personal, colorLight: COLORS.personalLight },
  { id: 'to_friend', name: 'To Friend', icon: 'users', color: '#BE185D', colorLight: '#FDF2F8' },
];

export default function PayUPIModal() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const addTransaction = useFinanceStore((state) => state.addTransaction);
  const addLentRecord = useFinanceStore((state) => state.addLentRecord);
  const debts = useFinanceStore((state) => state.debts);
  const recordDebtPayment = useFinanceStore((state) => state.recordDebtPayment);
  const showToast = useFinanceStore((state) => state.showToast);

  // Form states
  const [payeeInput, setPayeeInput] = useState(''); // Mobile number or custom VPA
  const [selectedProvider, setSelectedProvider] = useState('phonepe');
  const [resolvedVpa, setResolvedVpa] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [amountRupees, setAmountRupees] = useState('');
  const [selectedPocket, setSelectedPocket] = useState('lifestyle'); // 'essential' | 'lifestyle' | 'debt' | 'savings' | 'personal' | 'to_friend'
  const [selectedDebtId, setSelectedDebtId] = useState('');
  const [note, setNote] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');

  // QR Scanner Modal State
  const [showScanner, setShowScanner] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [scannedVerified, setScannedVerified] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();

  // Active debts for Whom to Pay link
  const activeDebts = debts.filter((d) => !d.isSettled && d.outstandingPaise > 0);

  // Determine if input is 10-digit mobile or custom VPA
  const isMobileNumber = /^[6-9]\d{9}$/.test(payeeInput.trim().replace(/\D/g, ''));

  useEffect(() => {
    const trimmed = payeeInput.trim();
    if (/^[6-9]\d{9}$/.test(trimmed)) {
      setResolvedVpa(formatMobileToVPA(trimmed, selectedProvider));
    } else if (trimmed.includes('@')) {
      setResolvedVpa(trimmed);
    } else {
      setResolvedVpa('');
    }
  }, [payeeInput, selectedProvider]);

  const detectedApp = resolvedVpa ? detectUPIProvider(resolvedVpa) : null;

  // Handle QR scanning
  const handleBarcodeScanned = ({ data }) => {
    if (!data) return;
    const parsed = parseUPIQRCode(data);
    if (parsed && parsed.vpa) {
      setShowScanner(false);
      setResolvedVpa(parsed.vpa);
      setPayeeInput(parsed.vpa);
      if (parsed.payeeName) {
        setPayeeName(parsed.payeeName);
      }
      if (parsed.amountRupees) {
        setAmountRupees(String(parsed.amountRupees));
      }
      if (parsed.note) {
        setNote(parsed.note);
      }
      setScannedVerified({
        payeeName: parsed.payeeName || 'Verified Merchant',
        vpa: parsed.vpa,
      });
      Alert.alert(
        'QR Code Scanned',
        `Successfully scanned:\n${parsed.payeeName || 'Merchant'}\nUPI ID: ${parsed.vpa}\nAll payment fields have been automatically filled!`
      );
    }
  };

  const handleSimulateSampleQR = () => {
    const sampleQR = 'upi://pay?pa=starbucks.coffee@hdfcbank&pn=Starbucks%20Coffee&am=350.00&cu=INR&tn=Cold%20Brew';
    handleBarcodeScanned({ data: sampleQR });
  };

  const handleOpenScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Camera Permission Required',
          'SalaryWay needs camera access to scan QR codes. You can also enter the recipient mobile number or UPI ID manually.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Grant Permission', onPress: () => requestPermission() },
          ]
        );
        return;
      }
    }
    setShowScanner(true);
  };

  const handleSelectDebt = (debt) => {
    setSelectedDebtId(debt.id);
    if (debt.creditorName && !payeeName) {
      setPayeeName(debt.creditorName);
    }
    if (debt.creditorVpa && !payeeInput) {
      setPayeeInput(debt.creditorVpa);
    }
  };

  const handlePay = async () => {
    const targetVpa = (resolvedVpa || payeeInput).trim();
    const cleanName = payeeName.trim() || (selectedPocket === 'to_friend' ? 'Friend' : 'Merchant');
    const parsedAmount = parseFloat(amountRupees);

    if (!targetVpa || !targetVpa.includes('@')) {
      showToast({
        type: 'warning',
        title: 'Invalid UPI ID',
        message: 'Please enter a valid 10-digit mobile number or UPI ID (e.g. 9876543210 or store@okhdfcbank).',
      });
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast({
        type: 'warning',
        title: 'Invalid Amount',
        message: 'Please enter a valid amount in Rupees.',
      });
      return;
    }

    // Launch native UPI payment intent
    const result = await launchUPIPayment({
      vpa: targetVpa,
      payeeName: cleanName,
      amountRupees: parsedAmount,
      note: note.trim() || (selectedPocket === 'to_friend' ? 'SalaryWay Friend Loan' : 'SalaryWay Payment'),
    });

    if (result.success) {
      if (selectedPocket === 'to_friend') {
        // Log as money given to someone / To Friend
        addLentRecord({
          personName: cleanName,
          phone: isMobileNumber ? payeeInput.trim() : targetVpa,
          amountRupees: parsedAmount,
          expectedReturnDate: expectedReturnDate.trim(),
          notes: note.trim() || 'Paid via SalaryWay UPI',
        });
        showToast({
          type: 'success',
          title: 'Saved to Friend Ledger',
          message: `₹${parsedAmount.toLocaleString('en-IN')} sent to ${cleanName} and logged under To Friend.`,
        });
      } else {
        // If linked to a specific debt in Whom to Pay
        if (selectedPocket === 'debt' && selectedDebtId) {
          recordDebtPayment(selectedDebtId, parsedAmount);
        }

        // Deduct from the chosen monthly pocket
        addTransaction({
          title: cleanName,
          amountPaise: toPaise(parsedAmount),
          category: selectedPocket,
          subcategory: selectedPocket === 'debt' ? 'Debt Payment' : 'UPI Payment',
          paymentMethod: 'UPI',
          type: 'expense',
          merchant: targetVpa,
          description: note.trim(),
          date: new Date().toISOString(),
        });

        showToast({
          type: 'success',
          title: 'Payment Successful',
          message: `₹${parsedAmount.toLocaleString('en-IN')} paid and logged under ${selectedPocket.toUpperCase()} pocket.`,
        });
      }

      router.back();
    } else {
      showToast({
        type: 'error',
        title: 'Payment Incomplete',
        message: result.error || 'No UPI application was available to complete this payment.',
      });
    }
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: Math.max(insets.top, 16) }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TactileTouch
          onPress={() => router.back()}
          style={[styles.closeBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="arrow-left" size={18} color={theme.text} />
        </TactileTouch>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Pay via UPI</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 + insets.bottom }]}
      >
        {/* Verification Banner if scanned from QR */}
        {scannedVerified && (
          <View style={styles.verifiedBanner}>
            <Feather name="check-circle" size={18} color="#16A34A" />
            <View style={{ flex: 1 }}>
              <Text style={styles.verifiedTitle}>QR Code Scanned & Verified</Text>
              <Text style={styles.verifiedSub}>
                {scannedVerified.payeeName} • {scannedVerified.vpa}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setScannedVerified(null)}>
              <Feather name="x" size={14} color="#6B7280" />
            </TouchableOpacity>
          </View>
        )}

        {/* Amount Input */}
        <View style={[styles.amountBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={styles.currencySymbol}>₹</Text>
          <TextInput
            style={[styles.amountInput, { color: theme.text }]}
            placeholder="0"
            placeholderTextColor="#64748B"
            keyboardType="decimal-pad"
            autoFocus
            value={amountRupees}
            onChangeText={setAmountRupees}
          />
        </View>

        {/* Payee Mobile or UPI ID */}
        <Text style={[styles.label, { color: theme.text }]}>Recipient Mobile Number or UPI ID</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
          placeholder="e.g. 9876543210 or store@okhdfcbank"
          placeholderTextColor="#64748B"
          autoCapitalize="none"
          value={payeeInput}
          onChangeText={setPayeeInput}
        />

        {/* If Mobile Number: App Handle Selector */}
        {isMobileNumber && (
          <View style={[styles.providerSection, { backgroundColor: theme.inputBg, borderColor: theme.border, borderWidth: 1 }]}>
            <Text style={[styles.providerLabel, { color: theme.textSecondary }]}>Which app does the recipient use?</Text>
            <View style={styles.handlesRow}>
              {UPI_HANDLES.map((h) => {
                const isSelected = selectedProvider === h.id;
                return (
                  <TouchableOpacity
                    key={h.id}
                    style={[
                      styles.handlePill,
                      { backgroundColor: theme.surface, borderColor: theme.border },
                      isSelected && { backgroundColor: h.color, borderColor: h.color },
                    ]}
                    onPress={() => setSelectedProvider(h.id)}
                  >
                    <Text
                      style={[
                        styles.handlePillText,
                        { color: theme.text },
                        isSelected && { color: '#FFFFFF', fontWeight: '700' },
                      ]}
                    >
                      {h.name} {h.handle}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Detected UPI App & Verification Preview */}
        {resolvedVpa ? (
          <View style={[styles.vpaPreviewCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.vpaPreviewHeader}>
              <View
                style={[
                  styles.vpaDot,
                  { backgroundColor: detectedApp ? detectedApp.color : COLORS.primary },
                ]}
              />
              <Text style={[styles.vpaPreviewTitle, { color: theme.text }]}>
                {detectedApp ? detectedApp.name : 'UPI Address'}
              </Text>
              <View style={styles.vpaVerifiedTag}>
                <Feather name="shield" size={11} color="#16A34A" />
                <Text style={styles.vpaVerifiedText}>NPCI Verified</Text>
              </View>
            </View>
            <Text style={[styles.resolvedVpaText, { color: theme.primaryText }]}>{resolvedVpa}</Text>
            <Text style={[styles.vpaHelperText, { color: theme.textSecondary }]}>
              Recipient name is confirmed by your UPI app before entering your UPI PIN.
            </Text>
          </View>
        ) : null}

        {/* Recipient / Merchant Name */}
        <Text style={[styles.label, { color: theme.text }]}>Recipient / Merchant Name (Optional)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
          placeholder="e.g. Rahul Sharma, Starbucks, Swiggy"
          placeholderTextColor="#64748B"
          value={payeeName}
          onChangeText={setPayeeName}
        />

        {/* Pocket Selection: 5 Categories + To Friend */}
        <Text style={[styles.label, { color: theme.text }]}>Deduct From Which Pocket?</Text>
        <View style={styles.categoryGrid}>
          {POCKET_OPTIONS.map((cat) => {
            const isSelected = selectedPocket === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryPill,
                  isSelected && {
                    backgroundColor: cat.colorLight,
                    borderColor: cat.color,
                  },
                ]}
                onPress={() => {
                  setSelectedPocket(cat.id);
                  if (cat.id !== 'debt') setSelectedDebtId('');
                }}
              >
                <Feather
                  name={cat.icon}
                  size={14}
                  color={isSelected ? cat.color : COLORS.textSecondary}
                />
                <Text
                  style={[
                    styles.categoryPillText,
                    isSelected && { color: cat.color, fontWeight: '700' },
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* If Whom to Pay (Debt) selected: optional debt linker */}
        {selectedPocket === 'debt' && activeDebts.length > 0 && (
          <View style={styles.debtSelectorBox}>
            <Text style={styles.debtSelectorTitle}>
              Link to Existing Loan (Optional):
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {activeDebts.map((d) => {
                  const isLinked = selectedDebtId === d.id;
                  return (
                    <TouchableOpacity
                      key={d.id}
                      style={[
                        styles.debtChip,
                        isLinked && styles.debtChipActive,
                      ]}
                      onPress={() => handleSelectDebt(d)}
                    >
                      <Text
                        style={[
                          styles.debtChipText,
                          isLinked && styles.debtChipTextActive,
                        ]}
                      >
                        {d.name} ({d.creditorName})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {/* If To Friend selected: friend return date */}
        {selectedPocket === 'to_friend' && (
          <View style={styles.friendNoticeCard}>
            <View style={styles.friendNoticeHeader}>
              <Feather name="users" size={15} color="#BE185D" />
              <Text style={styles.friendNoticeTitle}>To Friend Tracking Mode</Text>
            </View>
            <Text style={styles.friendNoticeText}>
              This amount is tracked in your "To Friend" ledger. It will NOT burn your monthly living budget envelopes!
            </Text>
            <Text style={[styles.label, { marginTop: SPACING.sm }]}>
              Expected Return Date (Optional)
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Next Salary Day, 30th Nov"
              value={expectedReturnDate}
              onChangeText={setExpectedReturnDate}
            />
          </View>
        )}

        {/* Note */}
        <Text style={[styles.label, { color: theme.text }]}>Payment Note (Optional)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
          placeholder="e.g. Lunch split, Groceries, Rent"
          placeholderTextColor="#64748B"
          value={note}
          onChangeText={setNote}
        />

        {/* Scanner Button remains in the page flow */}
        <TactileTouch
          style={[styles.scanStackBtn, { backgroundColor: theme.surface, borderColor: theme.primary, marginTop: SPACING.md }]}
          onPress={handleOpenScanner}
        >
          <Feather name="maximize" size={18} color={theme.primary} />
          <Text style={[styles.scanStackBtnText, { color: theme.primary }]}>Scan Any UPI QR Code</Text>
        </TactileTouch>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* 10. Standardized Floating Major Button at Bottom Center: Open UPI Apps & Pay (Hidden when scanner modal is open) */}
      {!showScanner && (
        <FloatingMajorButton
          title={
            selectedPocket === 'to_friend'
              ? 'Open UPI & Track to Friend'
              : selectedPocket === 'debt'
              ? 'Open UPI & Pay Debt'
              : 'Open UPI App & Pay'
          }
          icon="send"
          backgroundColor={theme.primary}
          onPress={handlePay}
        />
      )}

      {/* QR Code Scanner Modal */}
      <Modal
        visible={showScanner}
        animationType="slide"
        onRequestClose={() => setShowScanner(false)}
      >
        <View style={[styles.scannerContainer, { paddingTop: Math.max(insets.top, 24) }]}>
          <View style={styles.scannerTopBar}>
            <TouchableOpacity
              style={styles.scannerCloseBtn}
              onPress={() => setShowScanner(false)}
            >
              <Feather name="x" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Scan UPI QR Code</Text>
            <TouchableOpacity
              style={styles.scannerTorchBtn}
              onPress={() => setTorchEnabled((prev) => !prev)}
            >
              <Feather
                name={torchEnabled ? 'zap' : 'zap-off'}
                size={22}
                color={torchEnabled ? '#F59E0B' : '#FFFFFF'}
              />
            </TouchableOpacity>
          </View>

          {/* Camera View */}
          <View style={styles.cameraWrapper}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              enableTorch={torchEnabled}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={handleBarcodeScanned}
            />

            {/* Viewfinder Overlay */}
            <View style={styles.overlayFrame}>
              <View style={styles.viewFinder}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
              </View>
              <Text style={styles.scannerTip}>
                Align QR code within the frame to auto-fill
              </Text>
            </View>
          </View>

          {/* Scanner Bottom Action Controls */}
          <View style={styles.scannerBottomBar}>
            <TouchableOpacity
              style={styles.simulateBtn}
              onPress={handleSimulateSampleQR}
            >
              <Feather name="play-circle" size={16} color="#FFFFFF" />
              <Text style={styles.simulateBtnText}>Simulate Test Store QR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#DCFCE7',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  verifiedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  verifiedSub: {
    fontSize: 12,
    color: '#15803D',
    marginTop: 2,
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: 4,
  },
  amountInput: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.text,
    minWidth: 120,
    textAlign: 'left',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    marginTop: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 48,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  providerSection: {
    backgroundColor: '#F3F4F6',
    padding: SPACING.sm + 4,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  providerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  handlesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  handlePill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  handlePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },
  vpaPreviewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: SPACING.sm,
  },
  vpaPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vpaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  vpaPreviewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  vpaVerifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  vpaVerifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  resolvedVpaText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 4,
  },
  vpaHelperText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 15,
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
    backgroundColor: COLORS.surface,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  debtSelectorBox: {
    backgroundColor: '#FFFBEB',
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: SPACING.sm,
  },
  debtSelectorTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  debtChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCD34D',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
  },
  debtChipActive: {
    backgroundColor: COLORS.debt,
    borderColor: COLORS.debt,
  },
  debtChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },
  debtChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  friendNoticeCard: {
    backgroundColor: '#FDF2F8',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#FBCFE8',
    marginBottom: SPACING.sm,
  },
  friendNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  friendNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#BE185D',
  },
  friendNoticeText: {
    fontSize: 12,
    color: '#9D174D',
    lineHeight: 16,
  },
  // Stacked Action Buttons
  actionStack: {
    marginTop: SPACING.lg,
    gap: 10,
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: RADIUS.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  scanStackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    height: 50,
    borderRadius: RADIUS.full,
  },
  scanStackBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  floatingPayBottomWrap: {
    position: 'absolute',
    left: SPACING.lg,
    right: SPACING.lg,
    alignItems: 'center',
    zIndex: 99,
  },
  floatingPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 52,
    borderRadius: RADIUS.full,
  },
  floatingPayBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // Camera Scanner Styles
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scannerTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scannerCloseBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scannerTorchBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayFrame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewFinder: {
    width: 260,
    height: 260,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#22C55E',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scannerTip: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  scannerBottomBar: {
    padding: SPACING.xl,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
  },
  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#374151',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
  },
  simulateBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
