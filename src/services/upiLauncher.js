/**
 * SalaryWay UPI Deep-Link & Intent Service
 * Formats NPCI-compliant UPI deep links, decodes QR codes, handles mobile number mapping,
 * and triggers the Android system payment app chooser.
 */

export const UPI_HANDLES = [
  { id: 'phonepe', name: 'PhonePe', handle: '@ybl', color: '#5F259F', iconName: 'smartphone' },
  { id: 'gpay', name: 'Google Pay', handle: '@okaxis', color: '#1A73E8', iconName: 'credit-card' },
  { id: 'paytm', name: 'Paytm', handle: '@paytm', color: '#00BAF2', iconName: 'dollar-sign' },
  { id: 'bhim', name: 'BHIM UPI', handle: '@upi', color: '#00796B', iconName: 'zap' },
];

/**
 * Detect provider from VPA suffix
 */
export function detectUPIProvider(vpa) {
  if (!vpa || typeof vpa !== 'string') return null;
  const lower = vpa.toLowerCase();
  if (lower.includes('@ybl') || lower.includes('@ibl') || lower.includes('@axl')) {
    return { name: 'PhonePe', color: '#5F259F', handle: '@ybl' };
  }
  if (lower.includes('@okaxis') || lower.includes('@okhdfcbank') || lower.includes('@oksbi') || lower.includes('@okicici')) {
    return { name: 'Google Pay', color: '#1A73E8', handle: '@okaxis' };
  }
  if (lower.includes('@paytm')) {
    return { name: 'Paytm', color: '#00BAF2', handle: '@paytm' };
  }
  if (lower.includes('@upi')) {
    return { name: 'BHIM UPI', color: '#00796B', handle: '@upi' };
  }
  return { name: 'Standard UPI', color: '#16A36A', handle: '' };
}

/**
 * Format NPCI UPI deep link URL
 * @param {Object} params - { vpa, payeeName, amountRupees, note }
 */
export function buildUPILink({ vpa, payeeName = 'Merchant', amountRupees, note = 'SalaryWay Payment' }) {
  const cleanVpa = encodeURIComponent(vpa.trim());
  const cleanName = encodeURIComponent(payeeName.trim());
  const cleanNote = encodeURIComponent(note.trim());
  const formattedAmount = parseFloat(amountRupees || 0).toFixed(2);

  return `upi://pay?pa=${cleanVpa}&pn=${cleanName}&am=${formattedAmount}&cu=INR&tn=${cleanNote}`;
}

/**
 * Map a 10-digit mobile number to a specific payment app's VPA handle
 */
export function formatMobileToVPA(mobile, provider = 'phonepe') {
  const cleanNum = mobile.replace(/[^0-9]/g, '').slice(-10);
  const found = UPI_HANDLES.find((h) => h.id === provider) || UPI_HANDLES[0];
  return `${cleanNum}${found.handle}`;
}

/**
 * Parse a scanned UPI QR code string
 * Example: upi://pay?pa=merchant@upi&pn=Store%20Name&am=250.00&cu=INR&tn=Bill
 */
export function parseUPIQRCode(qrData) {
  if (!qrData || typeof qrData !== 'string') return null;

  if (qrData.startsWith('upi://pay?')) {
    const queryString = qrData.slice(10);
    const params = {};
    queryString.split('&').forEach((pair) => {
      const [key, val] = pair.split('=');
      if (key && val) {
        params[key] = decodeURIComponent(val.replace(/\+/g, ' '));
      }
    });

    return {
      vpa: params.pa || '',
      payeeName: params.pn || 'UPI Merchant',
      amountRupees: params.am ? parseFloat(params.am) : null,
      note: params.tn || 'Store Purchase',
      category: params.mc || '',
    };
  }

  // If the QR is just a plain VPA (e.g. 9876543210@paytm or shop@okhdfcbank)
  if (qrData.includes('@') && !qrData.includes(' ')) {
    return {
      vpa: qrData.trim(),
      payeeName: qrData.split('@')[0],
      amountRupees: null,
      note: 'Payment',
    };
  }

  return null;
}

/**
 * Launch native Android UPI payment application chooser
 */
export async function launchUPIPayment(params) {
  try {
    const { Linking, Alert } = require('react-native');
    const url = buildUPILink(params);
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
      return { success: true };
    } else {
      try {
        await Linking.openURL(url);
        return { success: true };
      } catch (err) {
        Alert.alert(
          'No UPI App Found',
          'Could not find a supported UPI application (PhonePe, Google Pay, Paytm, or BHIM) on this device.'
        );
        return { success: false, error: 'No UPI app installed' };
      }
    }
  } catch (error) {
    console.warn('UPI Launch Error:', error);
    try {
      const { Alert } = require('react-native');
      Alert.alert('Payment Error', error.message || 'Unable to open UPI app');
    } catch (_) {}
    return { success: false, error: error.message };
  }
}
