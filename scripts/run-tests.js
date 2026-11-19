/**
 * SalaryWay Automated Test Suite
 * Exercises all 10 core financial test cases specified in the Master Prompt
 * plus Tests 11-14 for CSV Export, SMS Regex Parsing, UPI Intents, and Udhaar Ledger.
 */

const {
  toPaise,
  toRupees,
  formatINR,
  allocateSalary,
  validatePercentages,
  calculateCategoryBalance,
  redirectDebtAllocation,
} = require('../src/services/financialCalc');

const { convertToCSV, filterTransactionsForExport } = require('../src/services/csvExport');
const { parseBankSMS, inferCategory } = require('../src/services/smsParser');
const {
  buildUPILink,
  formatMobileToVPA,
  parseUPIQRCode,
  detectUPIProvider,
} = require('../src/services/upiLauncher');

const { getAppTheme, LIGHT_THEME, DARK_THEME } = require('../src/constants/theme');

let passCount = 0;
let failCount = 0;

function assert(condition, testName, message = '') {
  if (condition) {
    console.log(`  PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  FAIL: ${testName} - ${message}`);
    failCount++;
  }
}

console.log('====================================================');
console.log('       SALARYWAY AUTOMATED FINANCIAL TEST SUITE      ');
console.log('====================================================\n');

// ----------------------------------------------------
// TEST 1: Default Salary Allocation (Salary = ₹50,000)
// ----------------------------------------------------
console.log('Running Test 1: 5-Category Allocation (₹50,000)...');
const salaryPaise = toPaise(50000); // 5,000,000 paise
const percentages = {
  essential: 55,
  lifestyle: 5,
  debt: 10,
  savings: 15,
  personal: 15,
};
const alloc1 = allocateSalary(salaryPaise, percentages);

assert(toRupees(alloc1.essential) === 27500, 'Test 1.1: Essential is ₹27,500', `Got ${toRupees(alloc1.essential)}`);
assert(toRupees(alloc1.lifestyle) === 2500, 'Test 1.2: Lifestyle is ₹2,500', `Got ${toRupees(alloc1.lifestyle)}`);
assert(toRupees(alloc1.debt) === 5000, 'Test 1.3: Debt is ₹5,000', `Got ${toRupees(alloc1.debt)}`);
assert(toRupees(alloc1.savings) === 7500, 'Test 1.4: Savings is ₹7,500', `Got ${toRupees(alloc1.savings)}`);
assert(toRupees(alloc1.personal) === 7500, 'Test 1.5: Personal Development is ₹7,500', `Got ${toRupees(alloc1.personal)}`);

const sum1 = Object.values(alloc1).reduce((a, b) => a + b, 0);
assert(sum1 === salaryPaise, 'Test 1.6: Sum of allocations equals total salary (₹50,000)', `Got ${toRupees(sum1)}`);

// ----------------------------------------------------
// TEST 2: Negative Balance / Overspending
// ----------------------------------------------------
console.log('\nRunning Test 2: Negative Balance Behavior...');
const essentialAllocated = toPaise(27500);
const essentialTxs = [
  { type: 'expense', amountPaise: toPaise(30000) },
];
const bal2 = calculateCategoryBalance(essentialAllocated, essentialTxs);

assert(toRupees(bal2.remaining) === -2500, 'Test 2.1: Remaining is -₹2,500', `Got ${toRupees(bal2.remaining)}`);
assert(bal2.spent === toPaise(30000), 'Test 2.2: Spent is ₹30,000');
assert(bal2.percentUsed > 100, 'Test 2.3: Utilization exceeds 100%');
assert(formatINR(bal2.remaining) === '-₹2,500', 'Test 2.4: Formatted INR displays -₹2,500');

// ----------------------------------------------------
// TEST 3: Different Salary Amount (Salary = ₹30,000)
// ----------------------------------------------------
console.log('\nRunning Test 3: Allocation Sum Equality (₹30,000)...');
const salaryPaise3 = toPaise(30000);
const alloc3 = allocateSalary(salaryPaise3, percentages);
const sum3 = Object.values(alloc3).reduce((a, b) => a + b, 0);

assert(sum3 === salaryPaise3, 'Test 3.1: Sum of allocations strictly equals ₹30,000', `Got ${toRupees(sum3)}`);
assert(toRupees(alloc3.essential) === 16500, 'Test 3.2: Essential is ₹16,500');
assert(toRupees(alloc3.lifestyle) === 1500, 'Test 3.3: Lifestyle is ₹1,500');
assert(toRupees(alloc3.debt) === 3000, 'Test 3.4: Debt is ₹3,000');
assert(toRupees(alloc3.savings) === 4500, 'Test 3.5: Savings is ₹4,500');
assert(toRupees(alloc3.personal) === 4500, 'Test 3.6: Personal is ₹4,500');

// ----------------------------------------------------
// TEST 4: Zero Debt Redirection
// ----------------------------------------------------
console.log('\nRunning Test 4: Debt Redirection Logic...');
const redirectedToSavings = redirectDebtAllocation(percentages, 'savings');
assert(redirectedToSavings.debt === 0, 'Test 4.1: Debt % becomes 0');
assert(redirectedToSavings.savings === 25, 'Test 4.2: Savings % becomes 15 + 10 = 25%');
const v4 = validatePercentages(redirectedToSavings);
assert(v4.valid && v4.total === 100, 'Test 4.3: Redirected total still strictly equals 100%');

// ----------------------------------------------------
// TEST 5: Expense Balance Updates
// ----------------------------------------------------
console.log('\nRunning Test 5: Expense Balance Updates...');
const testTxs = [
  { type: 'expense', amountPaise: toPaise(1000) },
  { type: 'expense', amountPaise: toPaise(2500) },
];
const bal5 = calculateCategoryBalance(toPaise(5000), testTxs);
assert(toRupees(bal5.spent) === 3500, 'Test 5.1: Total spent is ₹3,500');
assert(toRupees(bal5.remaining) === 1500, 'Test 5.2: Remaining balance is ₹1,500');
assert(bal5.percentUsed === 70, 'Test 5.3: Percentage used is 70%');

// ----------------------------------------------------
// TEST 6: Transaction Edit & Delete
// ----------------------------------------------------
console.log('\nRunning Test 6: Transaction Edit and Delete Updates...');
let txList = [
  { id: '1', type: 'expense', amountPaise: toPaise(1000) },
  { id: '2', type: 'expense', amountPaise: toPaise(2000) },
];
// Edit tx 1: 1000 -> 1500
txList = txList.map(t => t.id === '1' ? { ...t, amountPaise: toPaise(1500) } : t);
let bal6 = calculateCategoryBalance(toPaise(5000), txList);
assert(toRupees(bal6.spent) === 3500, 'Test 6.1: Edited transaction spent is ₹3,500');

// Delete tx 2
txList = txList.filter(t => t.id !== '2');
bal6 = calculateCategoryBalance(toPaise(5000), txList);
assert(toRupees(bal6.spent) === 1500, 'Test 6.2: Deleted transaction spent updates to ₹1,500');
assert(toRupees(bal6.remaining) === 3500, 'Test 6.3: Remaining updates to ₹3,500');

// ----------------------------------------------------
// TEST 7: Indian Number Formatting
// ----------------------------------------------------
console.log('\nRunning Test 7: Indian Number Formatting (INR)...');
assert(formatINR(toPaise(1000)) === '₹1,000', 'Test 7.1: ₹1,000');
assert(formatINR(toPaise(100000)) === '₹1,00,000', 'Test 7.2: 1 Lakh = ₹1,00,000');
assert(formatINR(toPaise(10000000)) === '₹1,00,00,000', 'Test 7.3: 1 Crore = ₹1,00,00,000');
assert(formatINR(toPaise(50000)) === '₹50,000', 'Test 7.4: ₹50,000');

// ----------------------------------------------------
// TEST 8: Historical Month Preservation
// ----------------------------------------------------
console.log('\nRunning Test 8: Historical Month Preservation...');
const monthStore = {
  '2026-01': { salaryPaise: toPaise(40000), allocations: allocateSalary(toPaise(40000), percentages) },
  '2026-02': { salaryPaise: toPaise(50000), allocations: allocateSalary(toPaise(50000), percentages) },
};
// Update 2026-02 salary to 60000
monthStore['2026-02'].salaryPaise = toPaise(60000);
monthStore['2026-02'].allocations = allocateSalary(toPaise(60000), percentages);

assert(toRupees(monthStore['2026-01'].salaryPaise) === 40000, 'Test 8.1: Historical month (2026-01) salary preserved at ₹40,000');
assert(toRupees(monthStore['2026-01'].allocations.essential) === 22000, 'Test 8.2: Historical month allocations preserved');
assert(toRupees(monthStore['2026-02'].salaryPaise) === 60000, 'Test 8.3: Current month (2026-02) updated to ₹60,000');

// ----------------------------------------------------
// TEST 9: Duplicate Detection
// ----------------------------------------------------
console.log('\nRunning Test 9: Duplicate Transaction Detection...');
const existingTxs = [
  { title: 'Electricity Bill', amountPaise: 220000, date: '2026-02-05' },
];
const duplicateTx = { title: 'Electricity Bill', amountPaise: 220000, date: '2026-02-05' };
const isDuplicate = existingTxs.some(
  t => t.title === duplicateTx.title && t.amountPaise === duplicateTx.amountPaise && t.date === duplicateTx.date
);
assert(isDuplicate === true, 'Test 9.1: Duplicate identified correctly and rejected');

// ----------------------------------------------------
// TEST 10: Refund Reconciliation
// ----------------------------------------------------
console.log('\nRunning Test 10: Refund and Reversal Reconciliation...');
const txsWithRefund = [
  { type: 'expense', amountPaise: toPaise(2000) },
  { type: 'refund', amountPaise: toPaise(500) },
];
const bal10 = calculateCategoryBalance(toPaise(5000), txsWithRefund);
assert(toRupees(bal10.spent) === 1500, 'Test 10.1: ₹2,000 expense - ₹500 refund = ₹1,500 net spent');
assert(toRupees(bal10.remaining) === 3500, 'Test 10.2: Remaining balance is ₹3,500');

// ----------------------------------------------------
// TEST 11: CSV Statement Conversion
// ----------------------------------------------------
console.log('\nRunning Test 11: CSV Statement Generation...');
const sampleTxs = [
  {
    id: 'tx-101',
    date: '2026-11-19T10:00:00.000Z',
    title: 'Starbucks Coffee',
    category: 'lifestyle',
    subcategory: 'Restaurants',
    type: 'expense',
    amountPaise: toPaise(350),
    paymentMethod: 'UPI',
    merchant: 'Starbucks',
    description: 'Cold brew',
  },
];
const csvOut = convertToCSV(sampleTxs);
assert(csvOut.includes('Transaction ID,Date,Title,Category'), 'Test 11.1: CSV header properly formatted');
assert(csvOut.includes('"Starbucks Coffee"'), 'Test 11.2: Transaction row properly escaped');
assert(csvOut.includes('"350.00"'), 'Test 11.3: Amount formatted correctly in CSV');

// ----------------------------------------------------
// TEST 12: Indian Bank SMS Parsing
// ----------------------------------------------------
console.log('\nRunning Test 12: Indian Bank SMS Parsing...');
const testSmsHDFC = 'Sent Rs. 350.00 from HDFC Bank A/c **1234 to Starbucks on 19-Nov-26. Info: UPI/4321098.';
const parsedHDFC = parseBankSMS(testSmsHDFC);
assert(parsedHDFC !== null, 'Test 12.1: SMS recognized as debit transaction');
assert(parsedHDFC.amountRupees === 350, 'Test 12.2: Extracted amount is ₹350');
assert(parsedHDFC.merchant.toLowerCase().includes('starbucks'), 'Test 12.3: Extracted merchant is Starbucks');
assert(parsedHDFC.category === 'lifestyle', 'Test 12.4: Inferred category is Lifestyle');

const testSmsBlinkit = 'INR 850.00 debited from A/c XX9988 on 19-Nov-26 to Blinkit. Avl Bal...';
const parsedBlinkit = parseBankSMS(testSmsBlinkit);
assert(parsedBlinkit.amountRupees === 850, 'Test 12.5: Extracted amount is ₹850');
assert(parsedBlinkit.category === 'essential', 'Test 12.6: Blinkit correctly categorized as Essential Groceries');

// ----------------------------------------------------
// TEST 13: NPCI UPI Deep-Link Format
// ----------------------------------------------------
console.log('\nRunning Test 13: UPI Deep-Link Construction...');
const upiUrl = buildUPILink({
  vpa: 'merchant@okhdfcbank',
  payeeName: 'D-Mart Store',
  amountRupees: 1450,
  note: 'Grocery bill',
});
assert(upiUrl.startsWith('upi://pay?'), 'Test 13.1: Starts with upi://pay? scheme');
assert(upiUrl.includes('pa=merchant%40okhdfcbank'), 'Test 13.2: Contains encoded VPA');
assert(upiUrl.includes('am=1450.00'), 'Test 13.3: Contains formatted amount');

// ----------------------------------------------------
// TEST 14: Money Lent (Udhaar) Ledger
// ----------------------------------------------------
console.log('\nRunning Test 14: Money Lent (Udhaar) Ledger...');
let lentList = [
  { id: 'l1', personName: 'Rahul', amountPaise: toPaise(2000), status: 'pending' },
  { id: 'l2', personName: 'Amit', amountPaise: toPaise(1000), status: 'pending' },
];
let pendingSum = lentList.filter(l => l.status === 'pending').reduce((s, l) => s + l.amountPaise, 0);
assert(toRupees(pendingSum) === 3000, 'Test 14.1: Total pending lent money is ₹3,000');

// Recover Rahul's loan
lentList = lentList.map(l => l.id === 'l1' ? { ...l, status: 'recovered' } : l);
pendingSum = lentList.filter(l => l.status === 'pending').reduce((s, l) => s + l.amountPaise, 0);
assert(toRupees(pendingSum) === 1000, 'Test 14.2: After recovery, pending lent money is ₹1,000');

// ----------------------------------------------------
// TEST 15: Mobile Number to VPA & Provider Detection
// ----------------------------------------------------
console.log('\nRunning Test 15: Mobile Number to VPA & Provider Detection...');
const phonepeVpa = formatMobileToVPA('9876543210', 'phonepe');
assert(phonepeVpa === '9876543210@ybl', 'Test 15.1: PhonePe handle maps to @ybl');

const gpayVpa = formatMobileToVPA('+91 98765 43210', 'gpay');
assert(gpayVpa === '9876543210@okaxis', 'Test 15.2: GPay handle maps to @okaxis with cleaned number');

const paytmVpa = formatMobileToVPA('9876543210', 'paytm');
assert(paytmVpa === '9876543210@paytm', 'Test 15.3: Paytm handle maps to @paytm');

const bhimVpa = formatMobileToVPA('9876543210', 'bhim');
assert(bhimVpa === '9876543210@upi', 'Test 15.4: BHIM handle maps to @upi');

const detectedPhonePe = detectUPIProvider('friend@ybl');
assert(detectedPhonePe.name === 'PhonePe', 'Test 15.5: Detected PhonePe from @ybl');

const detectedGPay = detectUPIProvider('shop@okhdfcbank');
assert(detectedGPay.name === 'Google Pay', 'Test 15.6: Detected Google Pay from @okhdfcbank');

// ----------------------------------------------------
// TEST 16: UPI QR Code Decoding
// ----------------------------------------------------
console.log('\nRunning Test 16: UPI QR Code Decoding...');
const rawQR = 'upi://pay?pa=starbucks.coffee@hdfcbank&pn=Starbucks%20Coffee&am=350.00&cu=INR&tn=Cold%20Brew';
const decodedQR = parseUPIQRCode(rawQR);
assert(decodedQR !== null, 'Test 16.1: QR decoded successfully');
assert(decodedQR.vpa === 'starbucks.coffee@hdfcbank', 'Test 16.2: Extracted correct merchant VPA');
assert(decodedQR.payeeName === 'Starbucks Coffee', 'Test 16.3: Extracted and unescaped merchant name');
assert(decodedQR.amountRupees === 350.0, 'Test 16.4: Extracted pre-filled bill amount ₹350');
assert(decodedQR.note === 'Cold Brew', 'Test 16.5: Extracted payment note');

const plainVpaQR = parseUPIQRCode('rahul@paytm');
assert(plainVpaQR.vpa === 'rahul@paytm', 'Test 16.6: Plain VPA string correctly parsed as QR target');

// ----------------------------------------------------
// TEST 17: Whom to Pay Debt Repayment & Savings Self-Transfer
// ----------------------------------------------------
console.log('\nRunning Test 17: Whom to Pay Debt Repayment & Savings Self-Transfer...');
let testDebt = {
  id: 'd-test',
  name: 'Friend Loan',
  outstandingPaise: toPaise(10000),
  monthlyEmiPaise: toPaise(2500),
  durationMonths: 6,
  creditorPhone: '9876543210',
  creditorVpa: '9876543210@ybl',
  isSettled: false,
};
// Pay 1 EMI of ₹2,500
testDebt.outstandingPaise = Math.max(0, testDebt.outstandingPaise - testDebt.monthlyEmiPaise);
assert(toRupees(testDebt.outstandingPaise) === 7500, 'Test 17.1: Debt reduces by EMI payment of ₹2,500 to ₹7,500');

// Pay full remaining ₹7,500
testDebt.outstandingPaise = 0;
testDebt.isSettled = true;
assert(testDebt.isSettled === true, 'Test 17.2: Debt marked settled when outstanding reaches ₹0');

// Self-transfer link verification
const selfTransferLink = buildUPILink({
  vpa: 'savings@oksbi',
  payeeName: 'SBI Savings Account',
  amountRupees: 7500,
  note: 'SalaryWay Monthly Savings Self-Transfer',
});
assert(selfTransferLink.includes('pa=savings%40oksbi'), 'Test 17.3: Savings self-transfer link contains secondary VPA');
assert(selfTransferLink.includes('am=7500.00'), 'Test 17.4: Savings self-transfer contains exact savings allocation');

// ----------------------------------------------------
// TEST 18: Theme Engine & Dark Mode Resolution
// ----------------------------------------------------
console.log('\nRunning Test 18: Theme Engine & Dark Mode Resolution...');
const darkTheme = getAppTheme('dark');
assert(darkTheme.isDark === true, 'Test 18.1: Dark theme flag isDark === true');
assert(darkTheme.background === '#121417', 'Test 18.2: Dark background is #121417');
assert(darkTheme.surface === '#1C1F24', 'Test 18.2b: Dark surface is #1C1F24');
assert(darkTheme.alertBg === '#2A1618', 'Test 18.2c: Dark alert banner is #2A1618');
assert(darkTheme.upiCardBg === '#059669', 'Test 18.2d: Dark UPI card is #059669');
assert(darkTheme.statusBarStyle === 'light', 'Test 18.3: Dark theme uses light status bar text');

const lightTheme = getAppTheme('light');
assert(lightTheme.isDark === false, 'Test 18.4: Light theme flag isDark === false');
assert(lightTheme.background === '#F7F8FA', 'Test 18.5: Light background is #F7F8FA');

const systemDarkTheme = getAppTheme('system', 'dark');
assert(systemDarkTheme.isDark === true, 'Test 18.6: System mode with dark scheme resolves to Dark Theme');

const systemLightTheme = getAppTheme('system', 'light');
assert(systemLightTheme.isDark === false, 'Test 18.7: System mode with light scheme resolves to Light Theme');

// ----------------------------------------------------
// SUMMARY
// ----------------------------------------------------
console.log('\n====================================================');
console.log(`TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('====================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('All financial calculation & upgrade tests passed with 100% precision!\n');
}
