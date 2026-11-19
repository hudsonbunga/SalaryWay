/**
 * SalaryWay Design System & Theme Engine
 * Supports Light & Dark themes with fintech aesthetics.
 * Dark Mode palette adheres strictly to deep slate-charcoal specifications.
 */

export const COLORS = {
  // Core
  background: '#F7F8FA',
  surface: '#FFFFFF',
  primary: '#16A36A',
  primaryLight: '#E8F5EF',
  text: '#172033',
  textSecondary: '#788397',
  border: '#E8ECF0',

  // Categories
  essential: '#3986D7',
  essentialLight: '#EBF3FC',
  lifestyle: '#A78BFA',
  lifestyleLight: '#F3EFFE',
  debt: '#E5A044',
  debtLight: '#FDF3E4',
  savings: '#22A68A',
  savingsLight: '#E6F7F3',
  personal: '#D77B9C',
  personalLight: '#FCEEF4',

  // States
  danger: '#E05252',
  dangerLight: '#FDECEC',
  warning: '#E5A044',
  success: '#16A36A',

  // Dark theme placeholders
  darkBackground: '#121417',
  darkSurface: '#1C1F24',
  darkText: '#F3F4F6',
  darkBorder: '#2B3038',
};

export const LIGHT_THEME = {
  isDark: false,
  mode: 'light',
  background: '#F7F8FA',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#172033',
  textSecondary: '#788397',
  textTertiary: '#9CA3AF',
  border: '#E8ECF0',
  inputBg: '#F9FAFB',
  primary: '#16A36A',
  primaryDark: '#0D7A4E',
  primaryDarker: '#095837',
  primaryLight: '#E8F5EF',
  primaryText: '#16A36A',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E8ECF0',
  statusBarStyle: 'dark',
  statusBarBg: '#F7F8FA',

  // Header & Navigation
  topIconBg: '#FFFFFF',
  topIconBorder: '#E8ECF0',
  topIconColor: '#172033',
  tagline: '#788397',

  // Month selector
  monthSelectorBg: '#FFFFFF',
  monthSelectorBorder: '#E8ECF0',
  monthSelectorText: '#172033',
  monthSelectorIcon: '#16A36A',
  arrowBtnBg: '#F7F8FA',

  // Alert & Overspending Banner
  alertBg: '#FEF2F2',
  alertBorder: '#FECACA',
  alertText: '#991B1B',
  alertTitle: '#DC2626',
  alertIcon: '#DC2626',

  // Hero Card
  heroCardBg: '#FFFFFF',
  heroCardBorder: '#E8ECF0',
  salaryPillBg: '#E8F5EF',
  salaryPillText: '#16A36A',
  editSalaryAction: '#16A36A',
  salaryFigure: '#172033',
  metricLabel: '#788397',
  trackBg: '#EEF2F6',

  // Daily Safe-to-Spend Strip
  safeSpendBg: '#F0FDF4',
  safeSpendBorder: '#DCFCE7',
  safeSpendIconBox: '#DCFCE7',
  safeSpendIcon: '#16A36A',
  safeSpendTitle: '#16A36A',
  safeSpendSubtitle: '#788397',
  safeSpendAmount: '#16A36A',

  // Action Cards
  upiCardBg: '#16A36A',
  upiIconBox: '#FFFFFF',
  upiIconColor: '#16A36A',
  upiTitle: '#FFFFFF',
  upiSubtitle: '#D1FAE5',

  friendCardBg: '#FFFFFF',
  friendCardBorder: '#E8ECF0',
  friendIconBox: '#FDF3E4',
  friendIconColor: '#E5A044',
  friendTitle: '#172033',
  friendSubtitle: '#788397',

  // Budget Allocations
  overspentBg: '#FEF2F2',
  overspentBorder: '#FCA5A5',

  // FAB
  fabBg: '#16A36A',
  fabIcon: '#FFFFFF',

  // Categories
  essential: '#3986D7',
  essentialLight: '#EBF3FC',
  lifestyle: '#A78BFA',
  lifestyleLight: '#F3EFFE',
  debt: '#E5A044',
  debtLight: '#FDF3E4',
  savings: '#22A68A',
  savingsLight: '#E6F7F3',
  personal: '#D77B9C',
  personalLight: '#FCEEF4',

  danger: '#E05252',
  dangerLight: '#FDECEC',
  warning: '#E5A044',
  warningLight: '#FDF3E4',
  success: '#16A36A',
  successLight: '#E8F5EF',
};

export const DARK_THEME = {
  isDark: true,
  mode: 'dark',
  // 1. Base Surfaces & Navigation (Top Bar)
  background: '#121417', // Deep Matte Charcoal
  surface: '#1C1F24',    // Elevated Dark Slate
  card: '#1C1F24',
  text: '#F3F4F6',       // Crisp White
  textSecondary: '#9BA1A6', // Muted Cool Gray
  textTertiary: '#687076',  // Dim Gray
  border: '#2B3038',     // Subtle 1px border
  inputBg: '#15181C',    // Form field surface
  primary: '#10B981',    // Vibrant Emerald
  primaryDark: '#059669', // Rich Emerald Green
  primaryDarker: '#047857',
  primaryLight: '#132E25', // Dark Forest Tint
  primaryText: '#34D399',  // Mint Emerald
  tabBar: '#121417',
  tabBarBorder: '#2B3038',
  statusBarStyle: 'light',
  statusBarBg: '#121417',

  // Top Action Icons
  topIconBg: '#1C1F24',
  topIconBorder: '#2B3038',
  topIconColor: '#E6E8EB',
  tagline: '#9BA1A6',

  // Month Selector Bar ("November 2026")
  monthSelectorBg: '#1C1F24',
  monthSelectorBorder: '#2B3038',
  monthSelectorText: '#F3F4F6',
  monthSelectorIcon: '#34D399',
  arrowBtnBg: '#252A32',

  // 2. Alert Banner ("Overspending Warning")
  alertBg: '#2A1618',     // Deep Desaturated Maroon
  alertBorder: '#5C2328', // Muted Crimson
  alertTitle: '#F87171',  // Soft Coral Red
  alertIcon: '#F87171',
  alertText: '#FCA5A5',   // Pale Rose

  // 3. Main Hero Card ("Monthly Salary")
  heroCardBg: '#1C1F24',
  heroCardBorder: '#2B3038',
  salaryPillBg: '#132E25', // Dark Forest Tint
  salaryPillText: '#34D399', // Bright Mint
  editSalaryAction: '#34D399', // Bright Mint
  salaryFigure: '#FFFFFF', // Pure White
  metricLabel: '#8E959E',  // Neutral Slate Gray
  trackBg: '#2B3038',      // Progress bar track

  // 4. Daily Safe-to-Spend Strip
  safeSpendBg: '#1C1F24',
  safeSpendBorder: '#2B3038',
  safeSpendIconBox: '#252A32',
  safeSpendIcon: '#9BA1A6',
  safeSpendTitle: '#9BA1A6',
  safeSpendSubtitle: '#687076',
  safeSpendAmount: '#FFFFFF',

  // 5. Quick Action Cards (Side-by-Side)
  upiCardBg: '#059669',   // Rich Emerald Green
  upiIconBox: '#047857',  // Darker Emerald
  upiIconColor: '#FFFFFF',
  upiTitle: '#FFFFFF',
  upiSubtitle: '#D1FAE5',

  friendCardBg: '#1C1F24', // Elevated Dark Slate
  friendCardBorder: '#2B3038',
  friendIconBox: '#2D2418', // Warm Amber Tint
  friendIconColor: '#FBBF24', // Warm Gold
  friendTitle: '#F3F4F6',
  friendSubtitle: '#9BA1A6',

  // 6. Bottom Section ("Budget Allocations" & Floating Button)
  overspentBg: '#221719', // Subtle Dark Red-Tinted Slate
  overspentBorder: '#4C2226', // Deep crimson border

  // Floating Action Button (+)
  fabBg: '#10B981',       // Vibrant Emerald
  fabIcon: '#091510',     // Deep Forest Black

  // Categories
  essential: '#60A5FA',   // Soft Sky Blue
  essentialLight: '#182635', // Deep Navy Tint
  lifestyle: '#C084FC',
  lifestyleLight: '#2A1A38',
  debt: '#FBBF24',
  debtLight: '#2D2418',
  savings: '#34D399',
  savingsLight: '#132E25',
  personal: '#F472B6',
  personalLight: '#381628',

  danger: '#F87171',      // Soft Coral Red
  dangerLight: '#2A1618',
  warning: '#FBBF24',
  warningLight: '#2D2418',
  success: '#10B981',
  successLight: '#132E25',
};

export function getAppTheme(mode, systemScheme) {
  if (mode === 'dark') return DARK_THEME;
  if (mode === 'light') return LIGHT_THEME;
  // 'system'
  return systemScheme === 'dark' ? DARK_THEME : LIGHT_THEME;
}

/**
 * React hook to consume current active theme
 */
export function useAppTheme() {
  let systemScheme = 'light';
  try {
    const { useColorScheme } = require('react-native');
    systemScheme = useColorScheme() || 'light';
  } catch (_) {}

  try {
    const { useFinanceStore } = require('../store/useFinanceStore');
    const themeMode = useFinanceStore((state) => state.themeMode || 'system');
    return getAppTheme(themeMode, systemScheme);
  } catch (_) {
    return LIGHT_THEME;
  }
}

export const CATEGORIES = [
  { id: 'essential', name: 'Essential Expenses', icon: 'home', color: COLORS.essential, colorLight: COLORS.essentialLight, defaultPercent: 55 },
  { id: 'lifestyle', name: 'Lifestyle', icon: 'coffee', color: COLORS.lifestyle, colorLight: COLORS.lifestyleLight, defaultPercent: 5 },
  { id: 'debt', name: 'Debt Repayment', icon: 'credit-card', color: COLORS.debt, colorLight: COLORS.debtLight, defaultPercent: 10 },
  { id: 'savings', name: 'Savings', icon: 'trending-up', color: COLORS.savings, colorLight: COLORS.savingsLight, defaultPercent: 15 },
  { id: 'personal', name: 'Invest in Myself', icon: 'book-open', color: COLORS.personal, colorLight: COLORS.personalLight, defaultPercent: 15 },
];

export const SUBCATEGORIES = {
  essential: ['Rent', 'Groceries', 'Electricity', 'Water', 'Internet', 'Transport', 'Medical'],
  lifestyle: ['Restaurants', 'Shopping', 'Entertainment', 'Subscriptions', 'Personal'],
  debt: ['Loan EMI', 'Credit Card', 'Personal Loan', 'Other Debt'],
  savings: ['Emergency Fund', 'Short-term', 'Long-term'],
  personal: ['Education', 'Courses', 'Books', 'Skills', 'Fitness'],
};

export const PAYMENT_METHODS = ['UPI', 'Cash', 'Debit Card', 'Credit Card', 'Bank Transfer'];

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };

export const RADIUS = { sm: 8, md: 12, lg: 16, xl: 20, full: 999 };

export const FONT = {
  regular: { fontSize: 14, color: COLORS.text },
  medium: { fontSize: 16, fontWeight: '500', color: COLORS.text },
  semibold: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  bold: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  h1: { fontSize: 28, fontWeight: '700', color: COLORS.text },
  h2: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  h3: { fontSize: 18, fontWeight: '600', color: COLORS.text },
  caption: { fontSize: 12, color: COLORS.textSecondary },
};
