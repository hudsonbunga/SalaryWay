import { create } from 'zustand';
import {
  toPaise,
  allocateSalary,
  validatePercentages,
  getMonthKey,
  generateId,
} from '../services/financialCalc';
import { loadData, saveData, clearData } from '../services/storage';

const DEFAULT_PERCENTAGES = {
  essential: 55,
  lifestyle: 5,
  debt: 10,
  savings: 15,
  personal: 15,
};

function createInitialMonth(monthKey, salaryRupees = 50000) {
  const salaryPaise = toPaise(salaryRupees);
  const allocations = allocateSalary(salaryPaise, DEFAULT_PERCENTAGES);
  const datePrefix = `${monthKey}-`;

  const seedTransactions = [
    {
      id: generateId(),
      title: 'Apartment Rent',
      amountPaise: 1800000,
      category: 'essential',
      subcategory: 'Rent',
      paymentMethod: 'Bank Transfer',
      type: 'expense',
      date: `${datePrefix}02T10:00:00.000Z`,
      merchant: 'Landlord',
    },
    {
      id: generateId(),
      title: 'Monthly Groceries',
      amountPaise: 450000,
      category: 'essential',
      subcategory: 'Groceries',
      paymentMethod: 'UPI',
      type: 'expense',
      date: `${datePrefix}05T14:30:00.000Z`,
      merchant: 'D-Mart Supermarket',
    },
    {
      id: generateId(),
      title: 'Electricity Bill',
      amountPaise: 220000,
      category: 'essential',
      subcategory: 'Electricity',
      paymentMethod: 'UPI',
      type: 'expense',
      date: `${datePrefix}07T11:15:00.000Z`,
      merchant: 'Power Discom',
    },
    {
      id: generateId(),
      title: 'Dinner with Team',
      amountPaise: 160000,
      category: 'lifestyle',
      subcategory: 'Restaurants',
      paymentMethod: 'Credit Card',
      type: 'expense',
      date: `${datePrefix}09T20:45:00.000Z`,
      merchant: 'Barbeque Nation',
    },
    {
      id: generateId(),
      title: 'Personal Loan EMI',
      amountPaise: 500000,
      category: 'debt',
      subcategory: 'Loan EMI',
      paymentMethod: 'Bank Transfer',
      type: 'expense',
      date: `${datePrefix}10T09:00:00.000Z`,
      merchant: 'HDFC Bank',
    },
    {
      id: generateId(),
      title: 'System Design Mastery Course',
      amountPaise: 350000,
      category: 'personal',
      subcategory: 'Courses',
      paymentMethod: 'UPI',
      type: 'expense',
      date: `${datePrefix}12T16:20:00.000Z`,
      merchant: 'Coursera / Platform',
    },
    {
      id: generateId(),
      title: 'Recurring Mutual Fund SIP',
      amountPaise: 500000,
      category: 'savings',
      subcategory: 'Long-term',
      paymentMethod: 'Bank Transfer',
      type: 'expense',
      date: `${datePrefix}15T08:00:00.000Z`,
      merchant: 'Zerodha Coin',
    },
  ];

  return {
    monthKey,
    salaryPaise,
    percentages: { ...DEFAULT_PERCENTAGES },
    allocations,
    transactions: seedTransactions,
  };
}

export const useFinanceStore = create((set, get) => ({
  isInitialized: false,
  currentMonthKey: getMonthKey(),
  months: {},

  // Enhanced Debts Tracker (Whom to Pay & Settled status)
  debts: [
    {
      id: 'debt-1',
      name: 'Personal Loan',
      creditorName: 'HDFC Bank Ltd',
      originalAmountPaise: 30000000,
      outstandingPaise: 14500000,
      monthlyEmiPaise: 500000,
      interestRate: 11.5,
      dueDate: 10,
      durationMonths: 24,
      type: 'Bank EMI',
      isPersonal: false,
      creditorPhone: '',
      creditorVpa: '',
      isSettled: false,
    },
    {
      id: 'debt-2',
      name: 'Credit Card Bill',
      creditorName: 'HDFC Credit Cards',
      originalAmountPaise: 7500000,
      outstandingPaise: 2400000,
      monthlyEmiPaise: 250000,
      interestRate: 36.0,
      dueDate: 20,
      durationMonths: 12,
      type: 'Credit Card',
      isPersonal: false,
      creditorPhone: '',
      creditorVpa: '',
      isSettled: false,
    },
    {
      id: 'debt-3',
      name: 'Emergency Loan from Uncle',
      creditorName: 'Uncle Ramesh',
      originalAmountPaise: 2000000,
      outstandingPaise: 1000000,
      monthlyEmiPaise: 500000,
      interestRate: 0,
      dueDate: 1,
      durationMonths: 6,
      type: 'Personal Debt',
      isPersonal: true,
      creditorPhone: '9876543210',
      creditorVpa: '9876543210@ybl',
      isSettled: false,
    },
  ],

  // Savings Bank Account Configuration (for post-unlock self transfer)
  savingsBankConfig: {
    hasSavingsAccount: false,
    savingsBankName: '',
    savingsBankVpa: '',
  },

  // Savings Goals
  savingsGoals: [
    {
      id: 'goal-1',
      name: 'Emergency Fund (6 Months)',
      targetPaise: 30000000,
      savedPaise: 18500000,
      targetDate: '2026-12-31',
    },
    {
      id: 'goal-2',
      name: 'New MacBook Pro',
      targetPaise: 17500000,
      savedPaise: 11000000,
      targetDate: '2026-06-30',
    },
    {
      id: 'goal-3',
      name: 'Goa Annual Vacation',
      targetPaise: 6000000,
      savedPaise: 4200000,
      targetDate: '2026-10-15',
    },
  ],

  // Money Given to Friends / Udhaar Tracker
  lentRecords: [
    {
      id: 'lent-1',
      personName: 'Rahul Verma',
      phone: '9876543210',
      amountPaise: 250000, // ₹2,500
      date: new Date().toISOString(),
      expectedReturnDate: '2026-11-30',
      notes: 'Group dinner & cab split',
      status: 'pending', // 'pending' | 'recovered'
      recoveredDate: null,
    },
    {
      id: 'lent-2',
      personName: 'Amit Sharma',
      phone: '9811223344',
      amountPaise: 500000, // ₹5,000
      date: new Date().toISOString(),
      expectedReturnDate: '2026-12-05',
      notes: 'Temporary bike repair loan',
      status: 'pending',
      recoveredDate: null,
    },
  ],

  // Time-Locked Monthly Savings Vault
  savingsVault: {
    isLocked: true,
    unlockDate: '1st of next month',
    brokenEarly: false,
    streakMonths: 4,
  },

  // App Security / PIN Lock
  security: {
    pinEnabled: false,
    pin: '',
    isUnlocked: true,
  },

  // User Profile
  user: {
    name: 'Aditya Sharma',
    email: 'aditya.sharma@example.com',
    occupation: 'Senior Software Engineer',
  },

  // Theme Mode: 'light' | 'dark' | 'system' (Default to system preference)
  themeMode: 'system',

  // Modern In-App Toast Notification (replaces native boring alert popups)
  toast: null,
  showToast: (toastData) => {
    set({
      toast: {
        id: Date.now(),
        ...(typeof toastData === 'string' ? { message: toastData, type: 'info' } : toastData),
      },
    });
  },
  hideToast: () => set({ toast: null }),

  updateUserProfile: (userData) => {
    set((state) => ({
      user: { ...state.user, ...userData },
    }));
    get().persist();
    return { success: true };
  },

  // Initialize store from local persistence
  initializeStore: async () => {
    try {
      const persisted = await loadData();
      const currentMonthKey = getMonthKey();

      if (persisted && persisted.months && Object.keys(persisted.months).length > 0) {
        if (!persisted.months[currentMonthKey]) {
          persisted.months[currentMonthKey] = createInitialMonth(currentMonthKey);
        }
        set({
          ...persisted,
          currentMonthKey,
          isInitialized: true,
        });
      } else {
        const initialMonths = {};
        initialMonths[currentMonthKey] = createInitialMonth(currentMonthKey);

        const stateToSave = {
          currentMonthKey,
          months: initialMonths,
          debts: get().debts,
          savingsGoals: get().savingsGoals,
          lentRecords: get().lentRecords,
          savingsVault: get().savingsVault,
          savingsBankConfig: get().savingsBankConfig,
          security: get().security,
          user: get().user,
          themeMode: get().themeMode,
        };
        await saveData(stateToSave);
        set({
          months: initialMonths,
          isInitialized: true,
        });
      }
    } catch (e) {
      console.warn('Failed to initialize finance store:', e);
      const currentMonthKey = getMonthKey();
      const initialMonths = {};
      initialMonths[currentMonthKey] = createInitialMonth(currentMonthKey);
      set({ months: initialMonths, isInitialized: true });
    }
  },

  persist: async () => {
    const state = get();
    await saveData({
      months: state.months,
      debts: state.debts,
      savingsGoals: state.savingsGoals,
      lentRecords: state.lentRecords,
      savingsVault: state.savingsVault,
      savingsBankConfig: state.savingsBankConfig,
      security: state.security,
      user: state.user,
      themeMode: state.themeMode,
      currentMonthKey: state.currentMonthKey,
    });
  },

  setCurrentMonth: (monthKey) => {
    const { months } = get();
    if (!months[monthKey]) {
      const newMonth = createInitialMonth(monthKey);
      set({
        currentMonthKey: monthKey,
        months: { ...months, [monthKey]: newMonth },
      });
      get().persist();
    } else {
      set({ currentMonthKey: monthKey });
    }
  },

  getCurrentMonthData: () => {
    const { months, currentMonthKey } = get();
    if (!months[currentMonthKey]) {
      return createInitialMonth(currentMonthKey);
    }
    return months[currentMonthKey];
  },

  getAllTransactions: () => {
    const { months } = get();
    let all = [];
    Object.values(months).forEach((m) => {
      if (m.transactions) {
        all = all.concat(m.transactions);
      }
    });
    // Sort descending by date
    return all.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  updateSalary: (newSalaryRupees) => {
    const { currentMonthKey, months } = get();
    const current = months[currentMonthKey] || createInitialMonth(currentMonthKey);
    const salaryPaise = toPaise(newSalaryRupees);
    const allocations = allocateSalary(salaryPaise, current.percentages);

    const updated = {
      ...months,
      [currentMonthKey]: {
        ...current,
        salaryPaise,
        allocations,
      },
    };

    set({ months: updated });
    get().persist();
  },

  updatePercentages: (newPercentages) => {
    const validation = validatePercentages(newPercentages);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const { currentMonthKey, months } = get();
    const current = months[currentMonthKey] || createInitialMonth(currentMonthKey);
    const allocations = allocateSalary(current.salaryPaise, newPercentages);

    const updated = {
      ...months,
      [currentMonthKey]: {
        ...current,
        percentages: newPercentages,
        allocations,
      },
    };

    set({ months: updated });
    get().persist();
    return { success: true };
  },

  redirectDebt: (targetCategory) => {
    const { currentMonthKey, months } = get();
    const current = months[currentMonthKey] || createInitialMonth(currentMonthKey);
    const debtPct = current.percentages.debt || 0;
    if (debtPct <= 0) return;

    const newPercentages = {
      ...current.percentages,
      debt: 0,
      [targetCategory]: (current.percentages[targetCategory] || 0) + debtPct,
    };

    get().updatePercentages(newPercentages);
  },

  addTransaction: (txData) => {
    const { currentMonthKey, months } = get();
    const current = months[currentMonthKey] || createInitialMonth(currentMonthKey);

    const isDuplicate = current.transactions.some(
      (t) =>
        t.title === txData.title &&
        t.amountPaise === txData.amountPaise &&
        t.date === txData.date
    );
    if (isDuplicate) {
      return { success: false, error: 'Transaction already exists' };
    }

    const newTx = {
      id: generateId(),
      title: txData.title,
      amountPaise: txData.amountPaise,
      category: txData.category,
      subcategory: txData.subcategory || 'General',
      paymentMethod: txData.paymentMethod || 'UPI',
      type: txData.type || 'expense',
      date: txData.date || new Date().toISOString(),
      merchant: txData.merchant || '',
      description: txData.description || '',
    };

    const updated = {
      ...months,
      [currentMonthKey]: {
        ...current,
        transactions: [newTx, ...current.transactions],
      },
    };

    set({ months: updated });
    get().persist();
    return { success: true, transaction: newTx };
  },

  deleteTransaction: (id) => {
    const { currentMonthKey, months } = get();
    const current = months[currentMonthKey];
    if (!current) return;

    const updated = {
      ...months,
      [currentMonthKey]: {
        ...current,
        transactions: current.transactions.filter((tx) => tx.id !== id),
      },
    };

    set({ months: updated });
    get().persist();
  },

  // ----------------------------------------------------
  // DEBTS & "WHOM TO PAY" MANAGEMENT
  // ----------------------------------------------------
  addDebt: (debtData) => {
    const newDebt = {
      id: generateId(),
      name: debtData.name.trim(),
      creditorName: debtData.creditorName ? debtData.creditorName.trim() : debtData.name.trim(),
      originalAmountPaise: toPaise(debtData.originalAmount),
      outstandingPaise: toPaise(debtData.outstanding),
      monthlyEmiPaise: toPaise(debtData.monthlyEmi || 0),
      interestRate: Number(debtData.interestRate) || 0,
      dueDate: Number(debtData.dueDate) || 5,
      durationMonths: Number(debtData.durationMonths) || 12,
      type: debtData.type || (debtData.isPersonal ? 'Personal Debt' : 'Bank EMI'),
      isPersonal: Boolean(debtData.isPersonal),
      creditorPhone: debtData.creditorPhone ? debtData.creditorPhone.trim() : '',
      creditorVpa: debtData.creditorVpa ? debtData.creditorVpa.trim() : '',
      isSettled: false,
    };
    set((state) => ({ debts: [...state.debts, newDebt] }));
    get().persist();
    return newDebt;
  },

  recordDebtPayment: (debtId, paymentRupees) => {
    const paymentPaise = toPaise(paymentRupees);
    set((state) => ({
      debts: state.debts.map((d) => {
        if (d.id !== debtId) return d;
        const newOutstanding = Math.max(0, d.outstandingPaise - paymentPaise);
        return {
          ...d,
          outstandingPaise: newOutstanding,
          isSettled: newOutstanding === 0,
        };
      }),
    }));
    get().persist();
  },

  settleDebt: (debtId) => {
    set((state) => ({
      debts: state.debts.map((d) =>
        d.id === debtId ? { ...d, outstandingPaise: 0, isSettled: true } : d
      ),
    }));
    get().persist();
  },

  deleteDebt: (debtId) => {
    set((state) => ({ debts: state.debts.filter((d) => d.id !== debtId) }));
    get().persist();
  },

  // ----------------------------------------------------
  // MONEY GIVEN TO SOMEONE (LENT / UDHAAR)
  // ----------------------------------------------------
  addLentRecord: (data) => {
    const record = {
      id: generateId(),
      personName: data.personName.trim(),
      phone: data.phone ? data.phone.trim() : '',
      amountPaise: toPaise(data.amountRupees),
      date: new Date().toISOString(),
      expectedReturnDate: data.expectedReturnDate || '',
      notes: data.notes || '',
      status: 'pending',
      recoveredDate: null,
    };
    set((state) => ({ lentRecords: [record, ...state.lentRecords] }));
    get().persist();
    return record;
  },

  markLentRecovered: (id) => {
    set((state) => ({
      lentRecords: state.lentRecords.map((r) =>
        r.id === id
          ? { ...r, status: 'recovered', recoveredDate: new Date().toISOString() }
          : r
      ),
    }));
    get().persist();
  },

  deleteLentRecord: (id) => {
    set((state) => ({
      lentRecords: state.lentRecords.filter((r) => r.id !== id),
    }));
    get().persist();
  },

  // ----------------------------------------------------
  // TIME-LOCKED SAVINGS VAULT
  // ----------------------------------------------------
  breakSavingsLock: () => {
    set((state) => ({
      savingsVault: {
        ...state.savingsVault,
        isLocked: false,
        brokenEarly: true,
      },
    }));
    get().persist();
  },

  relockSavings: () => {
    set((state) => ({
      savingsVault: {
        ...state.savingsVault,
        isLocked: true,
        brokenEarly: false,
      },
    }));
    get().persist();
  },

  setSavingsBankConfig: (config) => {
    set((state) => ({
      savingsBankConfig: {
        ...state.savingsBankConfig,
        ...config,
      },
    }));
    get().persist();
  },

  // ----------------------------------------------------
  // APP SECURITY & PIN
  // ----------------------------------------------------
  setAppPin: (pin) => {
    set((state) => ({
      security: { ...state.security, pin, pinEnabled: Boolean(pin) },
    }));
    get().persist();
  },

  togglePinEnabled: (enabled) => {
    set((state) => ({
      security: { ...state.security, pinEnabled: enabled },
    }));
    get().persist();
  },

  unlockApp: () => {
    set((state) => ({
      security: { ...state.security, isUnlocked: true },
    }));
  },

  lockApp: () => {
    set((state) => ({
      security: { ...state.security, isUnlocked: false },
    }));
  },

  // ----------------------------------------------------
  // THEME MANAGEMENT
  // ----------------------------------------------------
  setThemeMode: (mode) => {
    set({ themeMode: mode });
    get().persist();
  },

  toggleTheme: () => {
    const current = get().themeMode;
    const next = current === 'dark' ? 'light' : 'dark';
    set({ themeMode: next });
    get().persist();
  },

  // ----------------------------------------------------
  // SAVINGS GOALS
  // ----------------------------------------------------
  addSavingsGoal: (goalData) => {
    const newGoal = {
      id: generateId(),
      name: goalData.name,
      targetPaise: toPaise(goalData.target),
      savedPaise: toPaise(goalData.saved || 0),
      targetDate: goalData.targetDate || '2026-12-31',
    };
    set((state) => ({ savingsGoals: [...state.savingsGoals, newGoal] }));
    get().persist();
  },

  contributeSavingsGoal: (goalId, amountRupees) => {
    const amountPaise = toPaise(amountRupees);
    set((state) => ({
      savingsGoals: state.savingsGoals.map((g) =>
        g.id === goalId ? { ...g, savedPaise: g.savedPaise + amountPaise } : g
      ),
    }));
    get().persist();
  },

  deleteSavingsGoal: (goalId) => {
    set((state) => ({
      savingsGoals: state.savingsGoals.filter((g) => g.id !== goalId),
    }));
    get().persist();
  },

  resetAllData: async () => {
    await clearData();
    const currentMonthKey = getMonthKey();
    const initialMonths = { [currentMonthKey]: createInitialMonth(currentMonthKey) };
    set({
      currentMonthKey,
      months: initialMonths,
      debts: [
        {
          id: 'debt-1',
          name: 'Personal Loan',
          creditorName: 'HDFC Bank Ltd',
          originalAmountPaise: 30000000,
          outstandingPaise: 14500000,
          monthlyEmiPaise: 500000,
          interestRate: 11.5,
          dueDate: 10,
          type: 'Bank EMI',
          isPersonal: false,
          isSettled: false,
        },
      ],
      savingsGoals: [
        {
          id: 'goal-1',
          name: 'Emergency Fund',
          targetPaise: 30000000,
          savedPaise: 18500000,
          targetDate: '2026-12-31',
        },
      ],
      lentRecords: [],
    });
    await get().persist();
  },
}));
