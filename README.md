# SalaryWay (Give Every Rupee a Direction)

[![Expo SDK 58](https://img.shields.io/badge/Expo-SDK%2058-blue.svg)](https://expo.dev)
[![React Native 0.88](https://img.shields.io/badge/React%20Native-0.88-61DAFB.svg)](https://reactnative.dev)
[![Tests Passing](https://img.shields.io/badge/Tests-75%2F75%20Passing-brightgreen.svg)](scripts/run-tests.js)
[![Architecture](https://img.shields.io/badge/Architecture-Offline--First-orange.svg)](docs/TRD.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**SalaryWay** is a modern, privacy-first mobile personal finance application built specifically for Indian salaried professionals. It implements an automated **5-Pocket Budgeting System** with integer-paise arithmetic, zero-debt redirection, an intelligent Daily Safe-to-Spend engine, automated bank debit SMS parsing, a money-lent (Udhaar) ledger, and deep-linked UPI payments.

---

## Architecture & Specification Documentation Suite

Comprehensive architectural, product, and engineering documentation is maintained in the [`docs/`](docs/) directory:

| Document | Description |
|---|---|
| **[Product Requirements Document (PRD)](docs/PRD.md)** | Core vision, user personas, 5-pocket budgeting model, Daily Safe-to-Spend logic, and success metrics. |
| **[Technical Requirements Document (TRD)](docs/TRD.md)** | Technology stack, integer paise arithmetic, security model, offline persistence, and test architecture. |
| **[Appflow & Sequence Diagrams](docs/APPFLOW.md)** | Screen hierarchy, routing tree, and Mermaid sequence diagrams for core user journeys. |
| **[UI/UX Design Brief](docs/UI_UX_DESIGN_BRIEF.md)** | Apple motion physics, Material 3 ergonomics, dark/light color systems, and accessible typography. |
| **[Backend Schema & Data Architecture](docs/BACKEND_SCHEMA.md)** | TypeScript domain interfaces, PostgreSQL / Supabase migration DDL with RLS, and SQLite offline schema. |
| **[Implementation Plan & Roadmap](docs/IMPLEMENTATION_PLAN.md)** | Phased engineering roadmap, technical risk mitigation matrix, and release sign-off checklist. |

---

## Key Features

### 1. 5-Pocket Financial Allocation Model
Every rupee of monthly salary is automatically divided into 5 distinct pockets upon salary day:
1. **Essential Expenses (55%)**: Rent, groceries, electricity bills, transit, and loan obligations.
2. **Lifestyle & Guilt-Free (5%)**: Dining out, weekend movies, coffee, and discretionary purchases.
3. **Debt Repayment / EMIs (10%)**: Credit card bills, personal loans, and education loans.
4. **Savings Vault & Emergency (15%)**: Liquid savings, recurring deposits, and goal-directed funds.
5. **Invest in Myself (15%)**: Courses, books, fitness, certifications, and career skills.

### 2. Zero-Debt Savings Redirection
When all debt obligations and EMIs reach ₹0, the 10% debt allocation is automatically redirected into the **Savings Vault & Emergency** pocket, increasing overall savings to **25%** without user intervention.

### 3. Daily Safe-to-Spend Engine
Calculates dynamic, real-time daily spending limits from the Lifestyle pocket to eliminate month-end financial anxiety:
$$\text{Daily Safe Limit} = \frac{\text{Remaining Lifestyle Budget}}{\text{Days Left in Current Month}}$$

### 4. Direct UPI Deep Linking & QR Scanner
- Generates NPCI-compliant `upi://pay` deep-links pre-populated with merchant VPA, unescaped payee name, and exact amount.
- Direct-launches installed UPI applications (Google Pay, PhonePe, Paytm, BHIM) with a single tap.
- Integrated camera scanner for instant UPI QR code decoding.

### 5. Money Lent (Udhaar) Tracker
A dedicated tracking ledger for informal loans to friends and colleagues, displaying real-time pending receivables and one-tap recovery logging.

### 6. Excel-Compatible CSV Statement Export
Instant export of filtered transaction histories to Excel-compatible CSV statements utilizing the modern object-oriented `File` and `Paths` API (`expo-file-system`).

### 7. Zero Floating Point Drift
All monetary operations throughout the engine, storage layer, and UI are executed strictly in **integer paise** ($1\text{ INR} = 100\text{ paise}$), completely eliminating IEEE-754 floating point inaccuracies.

---

## Project Structure

```
SalaryWay/
├── docs/                               # Architecture & specification suite
│   ├── PRD.md                          # Product Requirements Document
│   ├── TRD.md                          # Technical Requirements Document
│   ├── APPFLOW.md                      # Navigation flow & sequence diagrams
│   ├── UI_UX_DESIGN_BRIEF.md           # Visual design system & token specs
│   ├── BACKEND_SCHEMA.md               # PostgreSQL DDL & SQLite schema
│   └── IMPLEMENTATION_PLAN.md          # Phased roadmap & release checklist
├── scripts/
│   └── run-tests.js                    # 75-assertion financial test suite
├── src/
│   ├── app/                            # Expo Router screen navigation tree
│   │   ├── (tabs)/                     # Primary tab navigation
│   │   │   ├── index.js                # Home dashboard
│   │   │   ├── transactions.js         # Transaction feed & category filters
│   │   │   ├── goals.js                # Wealth & Obligations (Vault & Udhaar)
│   │   │   ├── insights.js             # Financial charts & metrics
│   │   │   ├── profile.js              # User profile & theme settings
│   │   │   └── _layout.js              # Tab bar configuration
│   │   ├── modal/                      # Native presentation sheets
│   │   │   ├── daily-safe-spend.js     # Daily Safe-to-Spend breakdown
│   │   │   ├── add-transaction.js      # Manual & SMS transaction entry
│   │   │   ├── add-lent.js             # Udhaar entry sheet
│   │   │   ├── pay-upi.js              # UPI launcher & QR scanner
│   │   │   ├── edit-salary.js          # Monthly salary adjustment
│   │   │   └── export-statement.js     # Excel CSV statement generator
│   │   ├── category/
│   │   │   └── [id].js                 # Deep dive into individual pockets
│   │   └── _layout.js                  # Root layout & modal declarations
│   ├── components/                     # Reusable UI component library
│   │   ├── FloatingMajorButton.js      # Bottom-centered ergonomic action button
│   │   ├── TactileTouch.js             # Physics-based interactive pressable
│   │   ├── MainSalaryCard.js           # Top hero salary card
│   │   ├── CategoryCard.js             # 5-pocket visual balance cards
│   │   ├── TransactionItem.js          # Formatted transaction row item
│   │   ├── MonthSelector.js            # Calendar month navigator
│   │   ├── SleekToast.js               # Auto-detected SMS toast notification
│   │   └── AuthLockScreen.js           # Biometric lock overlay
│   ├── constants/
│   │   └── theme.js                    # Light/Dark design tokens
│   ├── services/                       # Application domain services
│   │   ├── financialCalc.js            # Integer math & INR formatting
│   │   ├── csvExport.js                # Modern Expo FileSystem exporter
│   │   ├── upiLauncher.js              # NPCI UPI deep-linking & QR parsing
│   │   ├── smsParser.js                # Bank debit SMS regex parser
│   │   └── storage.js                  # Persistent storage adapter
│   └── store/
│       └── useFinanceStore.js          # Zustand 5 global state engine
├── app.json                            # Expo configuration
├── package.json                        # Node dependencies & scripts
└── README.md                           # Repository overview
```

---

## Quickstart & Local Development

### Prerequisites
- Node.js 18.x or 20.x
- npm / yarn / bun
- Expo CLI (`npx expo`)
- Expo Go on your mobile device (or Android Studio / Xcode emulator)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/hudsonbunga/SalaryWay.git
cd SalaryWay
npm install
```

### 2. Run Financial Test Suite
SalaryWay includes an automated financial regression suite with 75 assertion checks covering integer math, zero-debt redirection, Indian number formatting, SMS parsing, and theme engine:
```bash
node scripts/run-tests.js
```

### 3. Start Development Server
```bash
npx expo start
```
Scan the QR code with your mobile camera (iOS) or the Expo Go app (Android).

---

## Verification & Quality Assurances

| Verification Target | Command | Result |
|---|---|---|
| Financial Test Suite | `node scripts/run-tests.js` | **75/75 Passed (0 Failed)** |
| AST Syntax Validation | Babel AST parse on `src/` | **0 Syntax Errors** |
| TypeScript / Linter | `npx expo lint` | **Clean** |

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
