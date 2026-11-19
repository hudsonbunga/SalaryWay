# Product Requirements Document (PRD)
## SalaryWay — "Give Every Rupee a Direction"

---

## 1. Executive Summary & Vision

**SalaryWay** is a mobile-first, privacy-respecting personal finance operating system tailored for the Indian salaried workforce, young professionals, and gig-economy earners. 

Unlike traditional expense trackers that passively record transactions *after* money has been spent, SalaryWay enforces **proactive financial allocation**. Inspired by zero-based budgeting and adapted for Indian cash flows, it automatically segments income into **5 Purpose-Driven Pockets** on salary day, calculates a real-time **Daily Safe-to-Spend** allowance, tracks informal lending (**Udhaar / Whom to Pay**), and integrates directly with the **NPCI Unified Payments Interface (UPI)** ecosystem.

SalaryWay is built on an **Offline-First, Zero-Cloud-Surveillance** architecture: all financial data, bank SMS parsing, and allocations remain encrypted on the user's physical device.

---

## 2. Problem Statement & Market Opportunity

### 2.1 The Problem
1. **The Month-End Crunch**: Salaried individuals experience rapid liquidity depletion within the first 10–12 days of the month due to lack of daily pacing.
2. **Impulse UPI Spending**: One-tap UPI payments (Google Pay, PhonePe, Paytm) detach the emotional friction of paying cash, resulting in frequent micro-spends that destroy monthly savings.
3. **Privacy Invasions in Fintech**: Mainstream Indian financial apps upload personal SMS messages and bank transaction histories to remote servers for ad-targeting and credit profiling.
4. **Unrecovered Peer Loans ("Udhaar")**: Small informal peer-to-peer loans to friends and colleagues are routinely forgotten, creating unrecovered financial leakages.
5. **Debt Inertia**: Users lack a structured mechanism to redirect money once existing loans or credit card EMIs are settled.

### 2.2 The Solution
SalaryWay provides a structured, proactive guardrail:
- **Income Pre-Allocation**: Every rupee of monthly income is assigned to one of 5 defined pockets before spending begins.
- **Daily Safe-to-Spend Engine**: Dynamically calculates how much money the user can safely spend per day, updating in real time as expenses are recorded.
- **Whom to Pay & Lent Ledger**: Formalizes informal debt and receivables with scheduled settlement reminders.
- **Local On-Device Intelligence**: Regex-based bank SMS parsing and analytics performed 100% on-device with zero server transmission.

---

## 3. User Personas

| Attribute | Persona 1: Aditya (Corporate Software Engineer) | Persona 2: Priya (Product Designer / Freelancer) |
| :--- | :--- | :--- |
| **Age & Location** | 26, Bengaluru, Tier-1 Metro | 24, Pune, Tier-2 Tech Hub |
| **Income** | ₹65,000 / month (Fixed Salary) | ₹40,000 – ₹70,000 / month (Variable) |
| **Pain Point** | Blows through 70% of salary by week two on food delivery and social outings. | Struggles with tracking client payments, split bills, and investing consistently. |
| **Primary Goal** | Stay within a daily limit and systematically pay down education loan EMIs. | Channel 15% of income into emergency savings and upskilling courses. |

---

## 4. Core Product Features & Functional Requirements

### 4.1 The 5-Pocket Allocation System
Every monthly salary is split into 5 core buckets with a mathematical guarantee that the sum strictly equals 100%:
1. **Essential Expenses (55%)**: Rent, groceries, utility bills, commute, mandatory insurance.
2. **Lifestyle (5%)**: Dining out, coffee, OTT entertainment, weekend leisure.
3. **Debt Repayment (10%)**: Credit card bills, personal loans, vehicle EMIs.
4. **Wealth & Savings (15%)**: Emergency fund, recurring mutual fund SIPs, fixed deposits.
5. **Invest in Myself (15%)**: Professional certifications, books, gym memberships, physical health.

> **Feature Guardrail — Zero-Debt Redirection**: When the user has zero outstanding debt, the 10% debt allocation is automatically redirected into *Wealth & Savings* (increasing it to 25%) or *Invest in Myself*, maintaining the 100% total without manual recalculation.

### 4.2 Daily Safe-to-Spend (Pacing Engine)
- **Calculation Formula**:
  $$\text{Daily Safe Spend} = \max\left(0, \left\lfloor\frac{\text{Total Salary} - \text{Total Spent Month-to-Date}}{\max(1, \text{Days Remaining in Month})}\right\rfloor\right)$$
- **Home Widget**: Elevated card displaying real-time daily spending allowance, remaining days, and a tap trigger.
- **Dedicated Breakdown Modal**:
  - 3-column summary: *Daily Limit*, *Spent Today*, and *Remaining Today*.
  - Color-coded pacing track (Emerald green within budget, Coral red if overspent).
  - Itemized list of transactions logged on the current date.
  - Direct quick-actions: `+ Add Expense` and `All Transactions`.

### 4.3 Native UPI Payment & Settlement Gateway
- Direct deep linking into installed UPI apps (Google Pay, PhonePe, Paytm, BHIM) via NPCI standard URL scheme:
  `upi://pay?pa={VPA}&pn={MerchantName}&am={Amount}&cu=INR`
- Auto-formats phone numbers into standard provider VPAs (e.g., `9876543210@ybl`, `9876543210@okaxis`).
- Built-in UPI QR code decoder using camera scanner for instant bill payments.

### 4.4 Wealth & Obligations Hub
- **Savings Vault**: Discipline vault with monthly lock period to prevent impulse premature liquidation.
- **Whom to Pay (Debt Tracker)**: Records lenders, principal amounts, interest rates, and monthly EMI schedules with auto-settlement upon zero balance.
- **To Friend (Udhaar Ledger)**: Tracks peer loans given to friends/colleagues with expected return dates, notes, and one-tap recovery confirmation.

### 4.5 Data & Statement Export
- Generates clean, Excel-compatible CSV files formatted in Indian Rupees (INR) with complete metadata (Transaction ID, Date, Title, Category, Subcategory, Payment Method, Amount, Merchant).
- Native Android/iOS share sheet integration via `expo-sharing` allowing instant dispatch to WhatsApp, Email, or Google Drive.

### 4.6 Privacy, Security & Biometrics
- 4-digit PIN lock screen with optional biometric authentication (Fingerprint / Face ID).
- Zero cloud database dependency for baseline functionality; 100% of data is stored in device `AsyncStorage`.

---

## 5. Non-Functional Requirements (NFRs)

| Dimension | Specification |
| :--- | :--- |
| **Performance** | Cold app launch < 1.2s; UI interactions rendered at continuous 60fps+; sub-50ms tab transition latency. |
| **Offline Reliability** | 100% functional without an active cellular or Wi-Fi data connection. |
| **Data Integrity** | All monetary amounts stored as 64-bit integer paise (`1 INR = 100 paise`) to prevent IEEE-754 floating-point rounding errors. |
| **Platform Compatibility** | Android 9.0+ (API level 28+) and iOS 15.0+ across compact phones, standard displays, and large foldables/tablets. |
| **Ergonomics** | 9:16 to 19.5:9 responsive ratio scaling; primary actions positioned in the lower thumb zone with safe-area bottom insets. |

---

## 6. Success Metrics & Key Performance Indicators (KPIs)

1. **Transaction Logging Velocity**: Average time to record an expense $\le 4.5\text{ seconds}$.
2. **Month-End Budget Adherence**: Percentage of active users maintaining positive safe-to-spend balances by the 25th day of the month $\ge 70\%$.
3. **Informal Loan Recovery**: Percentage of recorded "To Friend" receivables recovered within 45 days $\ge 80\%$.
4. **Crash-Free Sessions**: Stability index $\ge 99.8\%$ across Android and iOS release channels.
