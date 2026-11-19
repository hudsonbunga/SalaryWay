# SalaryWay — Engineering Implementation Plan & Roadmap

**Target Platform:** Android & iOS (React Native 0.88, Expo SDK 58, Expo Router)  
**Architecture:** Offline-First, Integer Paise Financial Core, Event-Driven SMS Ingestion  
**Version:** 1.0.0-rc  
**Last Updated:** November 2026

---

## 1. Phased Engineering Execution Roadmap

```
+---------------------------------------------------------------------------------------------------+
| [PHASE 1: Foundation & Financial Core] ---> [PHASE 2: UI/UX & Modal Overhaul] (COMPLETED)         |
| - Integer Paise Arithmetic (1 INR = 100p)   - Expo Router Route Refactor                          |
| - 5-Pocket Proportional Allocation          - Floating Action Buttons                             |
| - Zero-Debt Redirection Logic               - Modern Expo FileSystem SDK 54+ CSV Export           |
| - 75/75 Assertion Test Suite                - Daily Safe-to-Spend Native Sheet                    |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| [PHASE 3: Native SMS & UPI Pipeline] (CURRENT FOCUS)                                              |
| - Expo Config Plugin for Android READ_SMS & RECEIVE_SMS permissions                               |
| - Headless JS Background Task for real-time bank debit parsing                                    |
| - Sleek Toast banner with 5-second auto-record and instant undo                                   |
| - High-precision QR Scanner integration with fallback manual VPA parsing                          |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| [PHASE 4: Biometrics & Cloud Sync Engine]                                                         |
| - Expo LocalAuthentication (Fingerprint / Face ID / Android BiometricPrompt)                      |
| - Supabase Cloud Replica with Row Level Security (RLS)                                            |
| - Conflict-free offline outbox sync engine (Last-Write-Wins + Revision Vectors)                   |
| - AES-GCM Encrypted JSON backup and restore                                                       |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| [PHASE 5: Production Hardening & Store Release]                                                   |
| - EAS Cloud Build pipelines (Android APK / AAB, iOS IPA)                                          |
| - ProGuard & R8 code shrinking and Hermes bytecode precompilation                                 |
| - Google Play Financial App Declaration & Privacy Policy compliance                               |
| - Crashlytics & Zero-Telemetry diagnostic instrumentation                                         |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Detailed Milestone Specifications

### Milestone 1: Core Financial Logic & Storage (Completed)
- **Status:** Shipped & Verified (100% Pass Rate across 75 test assertions).
- **Deliverables:**
  - `src/services/financialCalc.js`: Integer paise math, `formatINR` using `Intl.NumberFormat('en-IN')`, zero-debt redirection algorithm, Daily Safe-to-Spend rolling balance engine.
  - `src/store/useFinanceStore.js`: Zustand 5 reactive store with AsyncStorage persistence, historical month isolation, and category spend tracking.
  - `scripts/run-tests.js`: 18 test suites validating money arithmetic, refunds, CSV output, SMS regexes, and theme resolution.

### Milestone 2: Mobile UI/UX & Modal Polish (Completed)
- **Status:** Shipped & Verified.
- **Deliverables:**
  - Modernized `src/services/csvExport.js` using object-oriented `File` & `Paths` API with legacy fallback, resolving Expo SDK 54+ deprecation warnings.
  - Refactored Daily Safe-to-Spend sheet to dedicated route `src/app/modal/daily-safe-spend.js` to eliminate double-close animation glitches.
  - Implemented ergonomic floating major action buttons (`FloatingMajorButton.js`) with haptic feedback, safe-area inset compliance, and responsive category transitions.
  - Unified tactile pressable system (`TactileTouch.js`) featuring micro-scale compression (`0.96x`) on tap.

### Milestone 3: Automated Ingestion & Deep Linking (In Progress)
- **Target Completion:** Sprint 3 (Next).
- **Core Tasks:**
  1. **Native SMS Broadcast Receiver**:
     - Author custom Expo config plugin (`plugins/withAndroidSms.js`) injecting `<uses-permission android:name="android.permission.RECEIVE_SMS" />`.
     - Register `HeadlessJsTaskService` to capture inbound transaction SMS from standard Indian bank sender headers (e.g., `AXISBK`, `HDFCBK`, `SBIINB`, `ICICIB`).
  2. **Deduplication Engine**:
     - Check inbound SMS amounts and timestamps against existing transactions to avoid double-counting transactions completed via in-app UPI deep link.
  3. **UPI Payment Flow Hardening**:
     - Add app chooser bottom sheet when multiple UPI applications (GPay, PhonePe, Paytm, CRED) are detected on device via `Intent.ACTION_VIEW`.

### Milestone 4: Biometrics & Encrypted Cloud Backup (Upcoming)
- **Target Completion:** Sprint 4.
- **Core Tasks:**
  1. **Biometric Security Gateway**:
     - Implement `src/components/AuthLockScreen.js` using `expo-local-authentication`.
     - Support app resume challenge with 30-second grace window to balance security and UX.
  2. **Encrypted Cloud Sync (Optional)**:
     - Supabase integration supporting email OTP and Apple/Google OAuth.
     - Outbox pattern queue in local SQLite executing atomic synchronization batches against PostgreSQL.
  3. **Zero-Knowledge Encrypted Export**:
     - Export user backup as AES-256-GCM encrypted `.swbak` file protected by user master passphrase.

### Milestone 5: Production Release & Store Distribution (Upcoming)
- **Target Completion:** Sprint 5.
- **Core Tasks:**
  1. **EAS Build Pipelines**:
     - Configure `eas.json` for preview and production channels.
     - Automated Hermes bytecode bundling and ProGuard rules.
  2. **Play Store Compliance**:
     - Submit Google Play SMS/Call Log Permission Declaration Form justifying automated expense tracking.
     - Implement privacy-compliant fallbacks if SMS permission is rejected by user.

---

## 3. Technical Risk Matrix & Mitigation Strategy

| Risk ID | Identified Risk | Impact | Likelihood | Mitigation Strategy |
|---|---|---|---|---|
| **RSK-01** | Google Play rejects native `RECEIVE_SMS` permission | High | Medium | Provide seamless manual SMS paste fallback and clipboard auto-detect modal already implemented in `src/app/modal/add-transaction.js`. |
| **RSK-02** | Floating point rounding error causing budget imbalances | Critical | Low | Strictly enforced integer paise across all stores, calculations, and UI displays (`1 INR = 100 paise`). Validated by 75 automated unit tests. |
| **RSK-03** | Modal gesture animation conflict (double close) | Medium | Low | Eliminated nested `PanResponder` handlers inside native modals; migrated to native Expo Router sheet modals (`presentation: 'modal'`). |
| **RSK-04** | Android navigation bar overlapping floating action buttons | High | Low | Dynamic safe-area padding calculation: `Math.max(insets.bottom, 24) + SPACING.xxl`. Buttons remain above system buttons on all aspect ratios. |
| **RSK-05** | Deprecated filesystem API failure on future Expo updates | Medium | Low | Updated `csvExport.js` to modern `File` and `Paths` API (`expo-file-system`) with backward-compatible legacy fallback. |

---

## 4. Quality Assurance & Release Sign-Off Checklist

### Automated Regression Testing
- [x] Run `node scripts/run-tests.js`: **75/75 test assertions passing**.
- [x] Run Babel AST syntax parser on entire `src/` directory: **0 syntax or parse errors**.
- [x] Validate zero debt redirection: 10% debt allocation shifts into savings vault when debt reaches ₹0.
- [x] Validate rolling daily limit math: $\text{Daily Limit} = \frac{\text{Remaining Lifestyle Budget}}{\text{Days Remaining in Month}}$.

### Device & Platform Testing (Android & iOS)
- [x] **Gesture Navigation**: Swiping back dismisses modals without double-triggering or stuttering.
- [x] **Keyboard Avoidance**: Input fields in Add Transaction and Add Udhaar remain fully visible when virtual keyboard opens.
- [x] **Dark / Light Theme Switching**: Zero flash of unstyled content (FOUC); all surface, border, and text tokens adapt instantly.
- [x] **Monospace Digits**: All financial amounts use monospace number styling to prevent layout jitter during count-ups.
- [x] **CSV Export & Share**: Generates valid Excel-compatible UTF-8 CSV and triggers native OS share sheet.

---

## 5. Deployment Commands

```bash
# 1. Run full test suite
node scripts/run-tests.js

# 2. Check TypeScript / Lint integrity
npx expo lint

# 3. Start local development server
npx expo start

# 4. Trigger EAS cloud build (Android APK / AAB)
npx eas-cli@latest build --platform android --profile preview

# 5. Trigger EAS cloud build (iOS)
npx eas-cli@latest build --platform ios --profile preview
```
