/**
 * SalaryWay Bank Integration Service (Demo Mode / Future-Ready Abstraction)
 * Designed around RBI Account Aggregator (AA) framework principles:
 * - Explicit user consent
 * - No plain-text bank credentials or UPI PIN collection
 * - Clear demonstration labeling
 * - Easy disconnect and consent revocation
 */

const DEMO_AA_FEED = [
  {
    id: 'demo-tx-1',
    title: 'Salary Credit - TechCorp Solutions',
    amountPaise: 5000000,
    type: 'income',
    category: null,
    merchant: 'TechCorp Solutions Pvt Ltd',
    paymentMethod: 'Bank Transfer',
    date: new Date().toISOString(),
    reconciled: false,
  },
  {
    id: 'demo-tx-2',
    title: 'D-Mart Supermarket',
    amountPaise: 385000,
    type: 'expense',
    category: 'essential',
    subcategory: 'Groceries',
    merchant: 'Avenue Supermarts Ltd',
    paymentMethod: 'UPI',
    date: new Date().toISOString(),
    reconciled: false,
  },
  {
    id: 'demo-tx-3',
    title: 'Zomato Online Order',
    amountPaise: 42000,
    type: 'expense',
    category: 'lifestyle',
    subcategory: 'Restaurants',
    merchant: 'Zomato',
    paymentMethod: 'UPI',
    date: new Date().toISOString(),
    reconciled: false,
  },
  {
    id: 'demo-tx-4',
    title: 'HDFC Home Loan EMI',
    amountPaise: 1500000,
    type: 'expense',
    category: 'debt',
    subcategory: 'Loan EMI',
    merchant: 'HDFC Bank Ltd',
    paymentMethod: 'Bank Transfer',
    date: new Date().toISOString(),
    reconciled: false,
  },
];

let isConnectedState = false;

export const BankIntegrationService = {
  isDemo: true,

  async connectAccountAggregator() {
    // Simulates an RBI Account Aggregator consent artifact handshake
    isConnectedState = true;
    return {
      success: true,
      provider: 'Demo Account Aggregator (RBI-AA Architecture Sandbox)',
      consentHandle: 'AA-CONSENT-DEMO-99120',
      connectedAt: new Date().toISOString(),
      message: 'Demo bank account securely connected in local sandbox mode.',
    };
  },

  async disconnect() {
    isConnectedState = false;
    return {
      success: true,
      message: 'Bank connection revoked and consent artifact deleted.',
    };
  },

  isConnected() {
    return isConnectedState;
  },

  getStatus() {
    return {
      connected: isConnectedState,
      provider: isConnectedState ? 'Demo Account Aggregator (Sandbox)' : null,
      mode: 'Local Demonstration Mode',
      hasRealBankAccess: false,
      regulatoryNotice: 'Compliant architecture: No banking credentials or UPI PINs are ever requested.',
    };
  },

  async fetchDemoTransactions() {
    if (!isConnectedState) {
      return { success: false, error: 'Bank account is not connected.' };
    }
    return {
      success: true,
      transactions: DEMO_AA_FEED,
      isDemo: true,
    };
  },
};
