# Technical Requirements Document (TRD)
## SalaryWay — Architecture & Engineering Specification

---

## 1. System Architecture Overview

SalaryWay is built as an offline-first, client-side single-page mobile application using React Native, Expo, and Expo Router. The application maintains zero external cloud dependencies for core operations, storing state locally and interacting with native device capabilities (Camera, FileSystem, Share Sheet, and External Intents).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE LAYER                            │
│   Expo Router (Tabs & Modals)  │  Reanimated 4.7  │  TactileTouch      │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
┌────────────────────────────────────▼───────────────────────────────────┐
│                      STATE & HYDRATION LAYER                           │
│     Zustand 5.1 Store (Reactive In-Memory State & Optimistic UI)       │
│     AsyncStorage (Encrypted Key-Value Local Disk Persistence)          │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
┌────────────────────────────────────▼───────────────────────────────────┐
│                     DOMAIN & BUSINESS LOGIC                            │
│  Financial Precision Engine (Paise Math, 5-Pockets Allocation)        │
│  Daily Safe-to-Spend Pacing Algorithm  │  Zero-Debt Redirection Logic  │
│  SMS Debit Transaction Parser          │  NPCI UPI Deep Link Builder   │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
┌────────────────────────────────────▼───────────────────────────────────┐
│                     NATIVE RUNTIME INTEGRATION                         │
│  expo-file-system (SDK 54+ File/Paths) │  expo-sharing (System Sheet)  │
│  expo-camera (QR Code Scanning)        │  expo-linking (UPI Intents)   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack & Dependencies

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Runtime Framework** | React Native | `0.88.1` | Cross-platform mobile runtime |
| **Platform Ecosystem**| Expo SDK | `~58.0.26` | Native module tooling and EAS pipeline |
| **Navigation / Routing**| Expo Router | `~58.0.32` | File-based URL navigation with modal stack |
| **State Management** | Zustand | `^5.1.0` | Centralized reactive store with hydration |
| **Persistence** | Async-Storage | `2.2.0` | Key-value on-device persistent storage |
| **Animation Engine** | React Native Reanimated | `4.7.1` | 60fps UI thread spring & layout animations |
| **Safe Area Insets** | React Native Safe Area Context | `~5.11.1` | Dynamic notch and navigation bar handling |
| **Filesystem & Sharing**| Expo File System & Sharing | `~58.0.14` | Modern Object-Oriented `File` & native Share |
| **Hardware Access** | Expo Camera & Asset | `~58.0.14` | QR barcode scanning for offline bills |
| **Iconography** | @expo/vector-icons (Feather)| `^15.0.2` | Clean, lightweight icon primitives |

---

## 3. Financial Precision Engine & Math Specifications

### 3.1 Integer Paise Representation
To eliminate floating-point approximation bugs inherent in IEEE-754 standard (e.g., `0.1 + 0.2 === 0.30000000000000004`), **all financial amounts are strictly stored and computed as 64-bit integer paise** ($1\text{ INR} = 100\text{ paise}$):

$$\text{Paise} = \text{round}(\text{Rupees} \times 100)$$
$$\text{Rupees} = \frac{\text{Paise}}{100}$$

```javascript
export function toPaise(rupees) {
  if (typeof rupees !== 'number' || isNaN(rupees)) return 0;
  return Math.round(rupees * 100);
}

export function toRupees(paise) {
  if (typeof paise !== 'number' || isNaN(paise)) return 0;
  return paise / 100;
}
```

### 3.2 Indian Numbering System Formatting (`en-IN`)
Currency strings are formatted following the Reserve Bank of India (RBI) standard numbering system (Lakhs and Crores):

```javascript
export function formatINR(paise, options = { showPaise: false }) {
  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);
  const rupees = toRupees(absPaise);

  let formatted = '';
  if (options.showPaise) {
    formatted = rupees.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else {
    formatted = Math.round(rupees).toLocaleString('en-IN');
  }

  return `${isNegative ? '-' : ''}₹${formatted}`;
}
```

### 3.3 Strict 100% Allocation Invariant
The allocation engine guarantees that the sum of the 5 pocket allocations strictly equals the total salary without any residual or unaccounted paise:

$$\sum_{k \in \text{Categories}} \text{Allocation}_k = \text{Total Monthly Salary}$$

When debt is marked cleared (`debtPercentage === 0`), the surplus percentage is automatically redirected into *Wealth & Savings* ($15\% + 10\% = 25\%$), ensuring the total allocation remains strictly $100\%$.

### 3.4 Historical Month Snapshot Immutability
When a user updates their base salary or category percentages in the active month, previous historical months (e.g., `2026-01`, `2026-02`) remain completely unchanged and preserved in `months[monthKey]`.

---

## 4. Native Device Integrations

### 4.1 NPCI UPI Deep-Link Protocol
SalaryWay generates standard National Payments Corporation of India (NPCI) deep-links:

```
upi://pay?pa={vpa}&pn={payeeName}&am={amount}&cu=INR&tn={note}
```

- **Supported Handles**: PhonePe (`@ybl`), Google Pay (`@okaxis`, `@okhdfcbank`, `@okicici`), Paytm (`@paytm`), BHIM (`@upi`).
- **Auto-Phone Sanitization**: Converts raw 10-digit mobile numbers into valid provider VPAs.

### 4.2 Modern Filesystem & Sharing Pipeline (Expo SDK 54+)
Transactions are formatted into RFC-4180 standard CSV files with proper header and cell escaping.
The service uses modern `expo-file-system` classes with automatic fallback:

```javascript
// 1. Modern SDK 54+ File & Paths API
const { File, Paths } = require('expo-file-system');
const file = new File(Paths.cache, filename);
file.create({ overwrite: true });
await file.write(csvContent);
const fileUri = file.uri;

// 2. Legacy Fallback (if native module is older)
const FileSystemLegacy = require('expo-file-system/legacy');
await FileSystemLegacy.writeAsStringAsync(fileUri, csvContent);

// 3. Share Sheet Launch
await Sharing.shareAsync(fileUri, {
  mimeType: 'text/csv',
  dialogTitle: 'Download SalaryWay Statement',
  UTI: 'public.comma-separated-values-text',
});
```

### 4.3 Regex SMS Extraction Engine
Parses incoming transactional bank SMS alerts locally without cloud processing:
- **Amount Patterns**: `/(?:rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)/i`
- **Merchant Patterns**: `/(?:at|to|in favour of|vpa)\s+([A-Za-z0-9\s&._-]+?)(?:\s+on|\s+ref|\s+upi|\.|\s*$)/i`
- **Category Heuristics**: Automatically maps detected merchants (e.g., `Blinkit`, `Swiggy`, `Uber`, `Netflix`) to their respective budget pockets.

---

## 5. Security & Privacy Architecture

1. **Local Encryption**: Financial records and user credentials reside strictly on the user's encrypted device flash memory.
2. **PIN Authentication**: 4-digit master PIN hashed using client-side cryptographic hashing.
3. **Zero Telemetry**: No third-party analytical SDKs (Firebase Analytics, Mixpanel, Segment) tracking user financial metrics.
4. **Offline Sandboxing**: The app requires zero network permissions for storage, calculations, or reporting.

---

## 6. Verification & Automated Test Suite

The core financial engines are validated via a rigorous automated test suite ([scripts/run-tests.js](file:///c:/Users/hudso/Private/Projects/SalayWay/scripts/run-tests.js)) consisting of **18 test suites and 75 assertions**:

```bash
node scripts/run-tests.js
```

### Test Coverage Highlights:
- **Test 1**: 5-Category Allocation Math (₹50,000 exact sum).
- **Test 2**: Negative Balance & Utilization handling.
- **Test 4**: Zero-Debt Redirection invariant preservation.
- **Test 7**: Indian Number Formatting (Lakhs & Crores verification).
- **Test 8**: Historical Month Snapshot Preservation.
- **Test 9**: Duplicate Transaction Detection and rejection.
- **Test 11**: CSV Formatting and quote character sanitization.
- **Test 12**: Bank SMS Parsing across HDFC, SBI, Axis, Blinkit, Starbucks.
- **Test 13**: NPCI UPI URI construction.
- **Test 16**: QR Code matrix string decoding.
- **Test 18**: Dynamic Light/Dark Mode theme resolution.
