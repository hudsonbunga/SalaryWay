/**
 * SalaryWay Indian Bank & UPI SMS Regex Parser
 * Parses incoming SMS from HDFC, SBI, ICICI, Axis, Kotak, PhonePe, Paytm, and GPay.
 * Extracts amounts, merchants, accounts, and maps them to the 5 budget categories.
 */

// Category Auto-Mapping Keywords
const CATEGORY_KEYWORDS = {
  essential: [
    'grocer', 'supermarket', 'dmart', 'd-mart', 'bigbasket', 'blinkit', 'zepto',
    'electricity', 'bescom', 'power', 'water', 'gas', 'indane', 'hpcl', 'iocl',
    'rent', 'maintenance', 'broadband', 'wifi', 'airtel', 'jio', 'vi',
    'hospital', 'pharmacy', 'apollo', 'medplus', '1mg', 'doctor', 'clinic',
    'petrol', 'fuel', 'metro', 'auto', 'uber', 'ola', 'rapido',
  ],
  lifestyle: [
    'swiggy', 'zomato', 'restaurant', 'cafe', 'starbucks', 'mcdonalds', 'kfc',
    'dominos', 'pizza', 'burger', 'bar', 'pub', 'dine',
    'amazon', 'flipkart', 'myntra', 'zara', 'h&m', 'shopping',
    'netflix', 'hotstar', 'prime', 'spotify', 'movie', 'pvr', 'inox', 'bookmyshow',
    'game', 'steam', 'playstation',
  ],
  debt: [
    'emi', 'loan', 'credit card', 'repayment', 'bajaj finance', 'hdfc bank card',
    'sbi card', 'icici credit', 'due amount', 'minimum due',
  ],
  savings: [
    'mutual fund', 'sip', 'zerodha', 'groww', 'coin', 'uti', 'nippon', 'hfdc mf',
    'ppf', 'recurring deposit', 'fixed deposit', 'nps',
  ],
  personal: [
    'udemy', 'coursera', 'course', 'books', 'kindle', 'gym', 'cult.fit', 'fitness',
    'education', 'institute', 'certif', 'workshop',
  ],
};

/**
 * Infer the budget category from merchant name or SMS body
 */
export function inferCategory(text) {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) {
      return category;
    }
  }
  return 'essential'; // Default conservative bucket
}

/**
 * Parse an Indian Bank / UPI transaction SMS
 * @param {string} smsText
 * @returns {Object|null} { isDebit, amountRupees, merchant, category, account, date }
 */
export function parseBankSMS(smsText) {
  if (!smsText || typeof smsText !== 'string') return null;

  const lower = smsText.toLowerCase();

  // Check if it's a debit or payment SMS
  const isDebit =
    lower.includes('debited') ||
    lower.includes('sent rs') ||
    lower.includes('paid rs') ||
    lower.includes('payment of rs') ||
    lower.includes('spent rs') ||
    lower.includes('withdrawn');

  if (!isDebit) {
    return null; // Ignore OTPs, promos, credits, balance alerts
  }

  // Extract Amount: matches "Rs. 1,234.50", "INR 500", "Rs 450", "Rs.250"
  const amountRegex = /(?:rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)/i;
  const amountMatch = smsText.match(amountRegex);

  if (!amountMatch) return null;

  const rawAmount = amountMatch[1].replace(/,/g, '');
  const amountRupees = parseFloat(rawAmount);

  if (isNaN(amountRupees) || amountRupees <= 0) return null;

  // Extract Merchant / Payee: looks for "to [Merchant]", "at [Merchant]", "vpa [UPI ID]"
  let merchant = 'UPI Merchant';
  const merchantRegex = /(?:to|at|vpa|info[:\s]+)\s*([A-Za-z0-9\s&'-]{3,25}?)(?:\s+(?:on|ref|upi|avl|bal|using|from|\.))/i;
  const merchantMatch = smsText.match(merchantRegex);

  if (merchantMatch && merchantMatch[1]) {
    const cleanMerchant = merchantMatch[1].trim();
    if (!cleanMerchant.toLowerCase().includes('a/c') && !cleanMerchant.toLowerCase().includes('account')) {
      merchant = cleanMerchant;
    }
  }

  // Extract Account ending (e.g. "A/c **1234" or "ending 4567")
  let account = '';
  const acctRegex = /(?:a\/c|acct|ending|card)\s*(?:no\.?)?\s*[*Xx]*(\d{4})/i;
  const acctMatch = smsText.match(acctRegex);
  if (acctMatch) {
    account = acctMatch[1];
  }

  const category = inferCategory(smsText);

  return {
    isDebit: true,
    amountRupees,
    merchant,
    title: `${merchant}`,
    category,
    paymentMethod: 'UPI',
    accountEnding: account,
    date: new Date().toISOString(),
    rawSnippet: smsText.slice(0, 80),
  };
}
