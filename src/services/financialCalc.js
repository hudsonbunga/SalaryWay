/**
 * SalaryWay Financial Calculation Service
 * All money stored as integer paise to avoid floating-point errors.
 * 1 rupee = 100 paise.
 */

/** Convert rupees to paise */
export function toPaise(rupees) {
  return Math.round(Number(rupees) * 100);
}

/** Convert paise to rupees */
export function toRupees(paise) {
  return paise / 100;
}

/**
 * Format paise as INR string with Indian numbering.
 * e.g., 5000000 paise → "₹50,000.00"
 */
export function formatINR(paise, showDecimal = false) {
  const rupees = toRupees(paise);
  const isNeg = rupees < 0;
  const abs = Math.abs(rupees);
  const parts = abs.toFixed(showDecimal ? 2 : 0).split('.');
  let intPart = parts[0];
  const decPart = parts[1];

  // Indian grouping: last 3, then groups of 2
  if (intPart.length > 3) {
    const last3 = intPart.slice(-3);
    const rest = intPart.slice(0, -3);
    const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    intPart = grouped + ',' + last3;
  }

  const formatted = decPart ? `${intPart}.${decPart}` : intPart;
  return `${isNeg ? '-' : ''}₹${formatted}`;
}

/**
 * Allocate salary into categories using integer paise.
 * Distributes rounding remainder to the largest category.
 * @param {number} salaryPaise - Total salary in paise
 * @param {Object} percentages - { essential: 55, lifestyle: 5, ... }
 * @returns {Object} { essential: paise, lifestyle: paise, ... }
 */
export function allocateSalary(salaryPaise, percentages) {
  const ids = Object.keys(percentages);
  const rawAllocations = {};
  let total = 0;

  ids.forEach((id) => {
    const amount = Math.floor((salaryPaise * percentages[id]) / 100);
    rawAllocations[id] = amount;
    total += amount;
  });

  // Distribute rounding remainder to the category with the largest percentage
  const remainder = salaryPaise - total;
  if (remainder !== 0) {
    const largest = ids.reduce((a, b) => (percentages[a] >= percentages[b] ? a : b));
    rawAllocations[largest] += remainder;
  }

  return rawAllocations;
}

/**
 * Validate allocation percentages total exactly 100.
 * @param {Object} percentages - { essential: 55, lifestyle: 5, ... }
 * @returns {{ valid: boolean, total: number, error?: string }}
 */
export function validatePercentages(percentages) {
  const values = Object.values(percentages);
  if (values.some((v) => v < 0)) {
    return { valid: false, total: 0, error: 'Negative allocations not allowed' };
  }
  const total = values.reduce((sum, v) => sum + v, 0);
  if (total !== 100) {
    return { valid: false, total, error: `Total is ${total}%, must be 100%` };
  }
  return { valid: true, total: 100 };
}

/**
 * Calculate category balance from transactions.
 * @param {number} allocatedPaise - Budget allocated to category
 * @param {Array} transactions - Array of transactions for this category
 * @returns {{ allocated, spent, remaining, percentUsed }}
 */
export function calculateCategoryBalance(allocatedPaise, transactions) {
  let spent = 0;
  transactions.forEach((t) => {
    if (t.type === 'expense') spent += t.amountPaise;
    else if (t.type === 'refund') spent -= t.amountPaise;
  });

  const remaining = allocatedPaise - spent;
  const percentUsed = allocatedPaise > 0 ? Math.round((spent / allocatedPaise) * 10000) / 100 : 0;

  return { allocated: allocatedPaise, spent, remaining, percentUsed };
}

/**
 * Redirect debt allocation to another category.
 * @param {Object} percentages - Current percentages
 * @param {string} targetCategory - Category to receive debt %
 * @returns {Object} New percentages with debt = 0
 */
export function redirectDebtAllocation(percentages, targetCategory) {
  const debtPercent = percentages.debt || 0;
  if (debtPercent === 0) return { ...percentages };
  return {
    ...percentages,
    debt: 0,
    [targetCategory]: (percentages[targetCategory] || 0) + debtPercent,
  };
}

/**
 * Generate a unique transaction ID.
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * Get current month key in YYYY-MM format.
 */
export function getMonthKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Format date as DD MMM YYYY.
 */
export function formatDate(dateStr) {
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Get display name for a month key.
 * "2025-01" → "January 2025"
 */
export function getMonthName(monthKey) {
  const [y, m] = monthKey.split('-');
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[parseInt(m, 10) - 1]} ${y}`;
}
