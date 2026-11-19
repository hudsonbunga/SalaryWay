# Application Flow & User Journeys (APPFLOW)
## SalaryWay — Interaction Design & Routing Architecture

---

## 1. Route Hierarchy & Navigation Architecture

SalaryWay utilizes **Expo Router** with a combination of a persistent Tab Navigator and full-screen / card Modal presentations.

```
src/app/
├── _layout.js                     # Root Stack Navigator + Splash & Security Lock
├── (tabs)/
│   ├── _layout.js                 # 4-Tab Bottom Bar (Home, Transactions, Insights, Goals)
│   ├── index.js                   # Home Dashboard Screen
│   ├── transactions.js            # All Transactions & Category Filter Screen
│   ├── insights.js                # Financial Analytics & Spending Charts
│   ├── goals.js                   # Wealth & Obligations (Vault, Debt, Udhaar)
│   └── profile.js                 # User Settings, Preferences & Allocation Rules
├── category/
│   └── [id].js                    # Pocket Drilldown (Essential, Lifestyle, etc.)
└── modal/
    ├── daily-safe-spend.js        # Dedicated Daily Safe-to-Spend Pacing View
    ├── add-transaction.js         # New Expense / Income Logging
    ├── pay-upi.js                 # UPI Quick Pay, QR Scanner & Contact Handle
    ├── export-statement.js        # CSV Statement Generator & Share
    ├── edit-salary.js             # Base Salary & Allocation Editor
    └── add-lent.js                # Peer Money Lent ("To Friend") Logger
```

---

## 2. Complete Application Flowchart

```mermaid
flowchart TD
    Start([App Launch]) --> Splash[Animated Splash Screen]
    Splash --> PinCheck{PIN Lock Enabled?}

    PinCheck -- Yes --> LockScreen[AuthLockScreen]
    LockScreen --> VerifyPin{PIN Valid?}
    VerifyPin -- No --> LockError[Error Shake Animation]
    LockError --> LockScreen
    VerifyPin -- Yes --> MainTabs

    PinCheck -- No --> MainTabs[Main Dashboard / Home Tab]

    MainTabs --> HomeNode[Home Dashboard]
    MainTabs --> TxNode[Transactions Screen]
    MainTabs --> InsightsNode[Insights Analytics]
    MainTabs --> GoalsNode[Goals & Debt Hub]
    MainTabs --> ProfileNode[Profile & Settings]

    %% Home Actions
    HomeNode -->|Tap Safe-to-Spend| ModalDaily[Modal: Daily Safe-to-Spend]
    HomeNode -->|Tap Monthly Salary| InsightsNode
    HomeNode -->|Tap Pay via UPI| ModalUPI[Modal: Pay via UPI]
    HomeNode -->|Tap To Friend| GoalsNode
    HomeNode -->|Tap Category Card| CategoryDrill[Screen: Category Pocket]
    HomeNode -->|Tap Add Expense FAB| ModalAddTx[Modal: Add Transaction]
    HomeNode -->|Tap Statement Icon| ModalExport[Modal: Export CSV]

    %% Transactions Screen
    TxNode -->|Filter by Category| FilteredTxList[Updated Full-Height List]
    TxNode -->|Tap Add FAB| ModalAddTx
    TxNode -->|Swipe / Delete| DeleteTx[Confirm Deletion]

    %% Goals Screen
    GoalsNode -->|Switch Tab: Savings| VaultActions[Lock / Unlock Discipline Vault]
    GoalsNode -->|Switch Tab: Debt| DebtActions[Add Loan / Pay EMI]
    GoalsNode -->|Switch Tab: To Friend| ModalLent[Modal: Add Lent Record]
    ModalLent -->|Mark Recovered| ReconcileLent[Update Pending Receivables]

    %% Profile Screen
    ProfileNode -->|Change Theme| ToggleTheme[System / Light / Dark]
    ProfileNode -->|Edit Salary| ModalEditSalary[Modal: Edit Salary & Allocations]
    ProfileNode -->|Download CSV| ModalExport
```

---

## 3. Detailed User Journeys

### 3.1 Daily Safe-to-Spend Pacing Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Home as Home Screen (index.js)
    participant Modal as Daily Safe Spend Modal
    participant Store as useFinanceStore

    User->>Home: Views Daily Safe-to-Spend Banner (₹927 / day)
    User->>Home: Taps Banner
    Home->>Modal: router.push('/modal/daily-safe-spend')
    Note over Modal: Native slide-from-bottom transition
    Modal->>Store: getCurrentMonthData() & filter today's txs
    Store-->>Modal: Daily Limit, Spent Today, Remaining Today
    Modal->>User: Displays 3-column stats, progress pacing bar, & list
    
    alt Log Expense from Safe Spend
        User->>Modal: Taps "+ Add Expense"
        Modal->>Home: Dismisses Modal
        Home->>Modal: router.push('/modal/add-transaction')
    else View All History
        User->>Modal: Taps "All Transactions"
        Modal->>Home: Dismisses Modal
        Home->>Home: router.push('/(tabs)/transactions')
    else Dismiss Modal
        User->>Modal: Swipes down or taps '✕'
        Note over Modal: Single smooth 60fps dismiss (zero double-close)
    end
```

---

### 3.2 Instant UPI Payment & Deep-Linking Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Home as Home Screen
    participant UPIModal as Pay via UPI Modal
    participant NativeApp as External UPI App (GPay/PhonePe)
    participant Store as useFinanceStore

    User->>Home: Taps "Pay via UPI" Quick Card
    Home->>UPIModal: router.push('/modal/pay-upi')
    
    alt Manual VPA / Mobile Entry
        User->>UPIModal: Enters mobile number (e.g. 9876543210)
        UPIModal->>UPIModal: Auto-resolves to 9876543210@ybl (PhonePe)
    else QR Code Scan
        User->>UPIModal: Taps "Scan QR"
        UPIModal->>UPIModal: Decodes merchant VPA, name, and amount
    end

    User->>UPIModal: Taps "Launch UPI App & Pay"
    UPIModal->>NativeApp: Linking.openURL('upi://pay?pa=...&am=...')
    Note over NativeApp: User completes payment in bank app
    User->>UPIModal: Returns to SalaryWay
    UPIModal->>Store: addTransaction({ amount, category, paymentMethod: 'UPI' })
    Store-->>Home: Deducts from category balance & safe-to-spend
```

---

### 3.3 Peer Lending ("To Friend" Udhaar) Recovery Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Goals as Wealth & Obligations (goals.js)
    participant LentModal as Add Lent Modal (add-lent.js)
    participant Store as useFinanceStore

    User->>Goals: Navigates to "Goals & Debt" -> "To Friend" tab
    Goals->>User: Shows "Pending to Recover: ₹3,000"
    User->>Goals: Taps "+ To Friend" Button
    Goals->>LentModal: Opens bottom sheet
    User->>LentModal: Enters "Rahul", ₹1,000, "Dinner bill split"
    User->>LentModal: Taps "Add to Friend Ledger"
    LentModal->>Store: addLentRecord({ personName, amountPaise: 100000 })
    Store-->>Goals: Pending total updates to ₹4,000

    Note over User,Goals: Days later when friend repays money
    User->>Goals: Taps "Mark as Received" on Rahul's card
    Goals->>Store: markLentRecovered(recordId)
    Store->>Store: Updates status to 'recovered'
    Store-->>Goals: Pending total decreases to ₹3,000
    Store-->>Goals: Displays "Lent Money Recovered" SleekToast
```

---

### 3.4 CSV Statement Generation & Sharing Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant ExportModal as Export CSV Modal
    participant CSVService as csvExport.js
    participant FileSystem as expo-file-system (File/Paths)
    participant ShareSheet as expo-sharing
    participant Toast as SleekToast

    User->>ExportModal: Opens Export Statement from Header
    User->>ExportModal: Selects Period ("Current Month" / "This Year")
    ExportModal->>ExportModal: Previews Total Records (9) & Amount (₹40,350)
    User->>ExportModal: Taps "Download & Share Statement"
    ExportModal->>CSVService: exportAndShareCSV(transactions)
    CSVService->>CSVService: convertToCSV() format headers & rows
    CSVService->>FileSystem: new File(Paths.cache, filename).write(csv)
    CSVService->>ShareSheet: Sharing.shareAsync(fileUri)
    Note over ShareSheet: Opens native Android/iOS share dialog
    User->>ShareSheet: Dispatches to WhatsApp / Email / Drive
    CSVService-->>ExportModal: { success: true }
    ExportModal->>Toast: showToast({ title: "Statement Ready" })
```
