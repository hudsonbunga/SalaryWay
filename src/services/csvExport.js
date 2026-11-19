/**
 * SalaryWay CSV Export Service
 * Formats transaction records into standard Excel / Sheets compatible CSV
 * and launches the native Android Share Sheet via expo-sharing.
 */

import { toRupees, formatDate } from './financialCalc.js';

/**
 * Filter transactions based on date criteria
 * @param {Array} transactions
 * @param {Object} filter - { type: 'all' | 'month' | 'year' | 'custom', fromDate, toDate, monthKey, year }
 */
export function filterTransactionsForExport(transactions, filter = { type: 'all' }) {
  if (!transactions || transactions.length === 0) return [];

  return transactions.filter((tx) => {
    const txDate = new Date(tx.date);

    if (filter.type === 'month' && filter.monthKey) {
      const [y, m] = filter.monthKey.split('-');
      return (
        txDate.getFullYear() === parseInt(y, 10) &&
        txDate.getMonth() + 1 === parseInt(m, 10)
      );
    }

    if (filter.type === 'year' && filter.year) {
      return txDate.getFullYear() === parseInt(filter.year, 10);
    }

    if (filter.type === 'custom') {
      const start = filter.fromDate ? new Date(filter.fromDate) : null;
      const end = filter.toDate ? new Date(filter.toDate) : null;
      if (start && txDate < start) return false;
      if (end && txDate > end) return false;
      return true;
    }

    return true;
  });
}

/**
 * Convert transactions array to CSV string
 */
export function convertToCSV(transactions) {
  const headers = [
    'Transaction ID',
    'Date',
    'Title',
    'Category',
    'Subcategory',
    'Type',
    'Amount (INR)',
    'Payment Method',
    'Merchant / Person',
    'Description',
  ];

  const escapeCSV = (str) => {
    if (str === null || str === undefined) return '""';
    const clean = String(str).replace(/"/g, '""');
    return `"${clean}"`;
  };

  const rows = transactions.map((t) => [
    escapeCSV(t.id),
    escapeCSV(formatDate(t.date)),
    escapeCSV(t.title),
    escapeCSV(t.category || 'General'),
    escapeCSV(t.subcategory || ''),
    escapeCSV(t.type || 'expense'),
    escapeCSV(toRupees(t.amountPaise).toFixed(2)),
    escapeCSV(t.paymentMethod || 'UPI'),
    escapeCSV(t.merchant || ''),
    escapeCSV(t.description || ''),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

/**
 * Write CSV file and open the native Android Share dialog
 */
export async function exportAndShareCSV(transactions, filenamePrefix = 'SalaryWay_Statement') {
  try {
    const csvContent = convertToCSV(transactions);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${filenamePrefix}_${timestamp}.csv`;
    let fileUri = null;

    // 1. Try modern Expo File System API (SDK 54+ File & Paths)
    try {
      const { File, Paths } = require('expo-file-system');
      if (File && Paths && Paths.cache) {
        const file = new File(Paths.cache, filename);
        if (typeof file.create === 'function') {
          file.create({ overwrite: true });
        }
        if (typeof file.write === 'function') {
          await file.write(csvContent);
          fileUri = file.uri;
        } else if (typeof file.writeSync === 'function') {
          file.writeSync(csvContent);
          fileUri = file.uri;
        }
      }
    } catch (_newApiErr) {
      // Fall through to legacy API if new File/Paths API throws
    }

    // 2. Fallback to official expo-file-system/legacy API
    if (!fileUri) {
      try {
        const FileSystemLegacy = require('expo-file-system/legacy');
        if (FileSystemLegacy && FileSystemLegacy.cacheDirectory && typeof FileSystemLegacy.writeAsStringAsync === 'function') {
          fileUri = `${FileSystemLegacy.cacheDirectory}${filename}`;
          await FileSystemLegacy.writeAsStringAsync(fileUri, csvContent, {
            encoding: FileSystemLegacy.EncodingType?.UTF8 || 'utf8',
          });
        }
      } catch (_legacyErr) {
        // Fall through
      }
    }

    if (!fileUri) {
      return { success: false, error: 'Could not write CSV statement to storage' };
    }

    const Sharing = require('expo-sharing');
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Download SalaryWay Statement',
        UTI: 'public.comma-separated-values-text',
      });
      return { success: true, fileUri };
    } else {
      return { success: false, error: 'Sharing not available on this device' };
    }
  } catch (error) {
    console.warn('CSV Export Error:', error);
    return { success: false, error: error.message };
  }
}
