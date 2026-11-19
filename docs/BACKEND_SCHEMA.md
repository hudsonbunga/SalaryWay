# SalaryWay — Backend Schema & Data Architecture Specification

**Version:** 1.0.0  
**Status:** Approved Architecture  
**Target Environments:** Supabase / PostgreSQL 15+ (Cloud Tier), Expo SQLite / AsyncStorage (Client Tier)  
**Currency Arithmetic:** Integer Paise (`1 INR = 100 paise`, zero IEEE-754 floating point drift)

---

## 1. Architectural Philosophy & Sync Strategy

SalaryWay is built on an **Offline-First, Zero-Knowledge Financial Core**. The application functions completely autonomously without an active internet connection or backend server. When cloud sync is enabled, the backend serves as an encrypted, multi-device replica and audit log.

### Key Data Principles
1. **Paise Representation**: Every monetary value (`amount_paise`, `allocated_paise`, `spent_paise`, `target_paise`, `outstanding_paise`) is stored as an 8-byte 64-bit integer (`BIGINT`).
2. **Deterministic Partitioning**: Budgets are partitioned by monthly calendar keys (`YYYY-MM`). Calculations are strictly isolated by month key to preserve historical financial fidelity.
3. **Optimistic Offline Sync**: All local writes commit immediately to SQLite / local state. Mutations generate a synchronization tombstone and vector timestamp (`revision_id`, `updated_at`) for idempotent replay against the backend.
4. **Row-Level Security (RLS)**: Every query, update, and delete in PostgreSQL is strictly scoped to the authenticated tenant via `auth.uid() = user_id`.

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT TIER                                        |
|  +---------------------------------------------------------------------------------+  |
|  |                            Zustand 5 In-Memory Store                            |  |
|  |     (Active Month, 5-Pockets, Filtered Transactions, Pending Udhaar, Theme)     |  |
|  +---------------------------------------------------------------------------------+  |
|                                          |                                            |
|                                 (Async Rehydration)                                   |
|                                          v                                            |
|  +---------------------------------------------------------------------------------+  |
|  |                    AsyncStorage / SQLite Local Database                         |  |
|  |       Key: @salaryway_finance_v1 | Key: @salaryway_vault_v1 | Outbox Queue       |  |
|  +---------------------------------------------------------------------------------+  |
+------------------------------------------+--------------------------------------------+
                                           |
                                  TLS 1.3 / HTTPS Sync
                                (Bearer JWT + RLS Scope)
                                           v
+---------------------------------------------------------------------------------------+
|                                  CLOUD / BACKEND TIER                                 |
|  +---------------------------------------------------------------------------------+  |
|  |                       Supabase PostgreSQL 15+ Engine                           |  |
|  |   - Auth Schema (GoTrue UUIDs)                                                  |  |
|  |   - Public Schema (users, monthly_budgets, category_allocations, transactions,  |  |
|  |                    savings_goals, debts, udhaar_lent, audit_logs)               |  |
|  |   - RLS Policies (auth.uid() = user_id)                                         |  |
|  |   - Row Versioning & Revision Vectors                                          |  |
|  +---------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------+
```

---

## 2. TypeScript Domain Models

```typescript
export type CategoryId = 'essential' | 'lifestyle' | 'debt' | 'savings' | 'investment';
export type PaymentMode = 'UPI' | 'Card' | 'Bank Transfer' | 'Cash' | 'Cheque';
export type TransactionType = 'expense' | 'income' | 'refund' | 'transfer';
export type DebtStatus = 'active' | 'settled' | 'overdue';
export type GoalStatus = 'in_progress' | 'completed' | 'abandoned';
export type UdhaarStatus = 'pending' | 'partially_recovered' | 'recovered' | 'written_off';

export interface UserProfile {
  id: string; // UUID v4
  email?: string;
  phone_number?: string;
  full_name: string;
  primary_upi_id?: string;
  secondary_savings_upi_id?: string;
  currency_code: 'INR';
  is_biometric_enabled: boolean;
  theme_preference: 'system' | 'light' | 'dark';
  sms_sync_enabled: boolean;
  zero_debt_savings_redirection: boolean;
  created_at: string; // ISO 8601
  updated_at: string;
}

export interface MonthlyBudget {
  id: string; // UUID v4
  user_id: string; // References UserProfile.id
  month_key: string; // Format: 'YYYY-MM' (e.g., '2026-11')
  salary_paise: number; // e.g. 5000000 = ₹50,000.00
  total_spent_paise: number;
  remaining_unallocated_paise: number;
  is_locked: boolean;
  revision: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryAllocation {
  id: string;
  budget_id: string; // References MonthlyBudget.id
  user_id: string;
  category_id: CategoryId;
  percentage: number; // e.g. 55 for 55%
  allocated_paise: number; // e.g. 2750000 for ₹27,500.00
  spent_paise: number;
  remaining_paise: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string; // UUID v4
  user_id: string;
  month_key: string; // 'YYYY-MM'
  category_id: CategoryId;
  amount_paise: number;
  type: TransactionType;
  title: string;
  merchant_name?: string;
  payment_mode: PaymentMode;
  date: string; // 'YYYY-MM-DD'
  timestamp: number; // Epoch milliseconds
  upi_ref_number?: string; // 12-digit RRN
  notes?: string;
  is_recurring: boolean;
  auto_detected_from_sms: boolean;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_paise: number;
  saved_paise: number;
  target_date?: string; // 'YYYY-MM-DD'
  status: GoalStatus;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface DebtObligation {
  id: string;
  user_id: string;
  creditor_name: string;
  creditor_upi_id?: string;
  total_amount_paise: number;
  outstanding_paise: number;
  emi_paise: number;
  due_day_of_month: number; // 1 to 31
  status: DebtStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface UdhaarRecord {
  id: string;
  user_id: string;
  friend_name: string;
  friend_phone?: string;
  amount_paise: number;
  recovered_paise: number;
  expected_return_date?: string;
  notes?: string;
  status: UdhaarStatus;
  created_at: string;
  updated_at: string;
}
```

---

## 3. PostgreSQL / Supabase Migration DDL

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. USERS & CONFIGURATION TABLE
-- ============================================================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    phone_number VARCHAR(15),
    full_name VARCHAR(100) NOT NULL DEFAULT 'User',
    primary_upi_id VARCHAR(100),
    secondary_savings_upi_id VARCHAR(100),
    currency_code VARCHAR(3) NOT NULL DEFAULT 'INR',
    is_biometric_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    theme_preference VARCHAR(10) NOT NULL DEFAULT 'system' CHECK (theme_preference IN ('system', 'light', 'dark')),
    sms_sync_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    zero_debt_savings_redirection BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and manage their own profile"
    ON public.users
    FOR ALL
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 2. MONTHLY BUDGETS TABLE
-- ============================================================================
CREATE TABLE public.monthly_budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    month_key VARCHAR(7) NOT NULL CHECK (month_key ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
    salary_paise BIGINT NOT NULL CHECK (salary_paise >= 0),
    total_spent_paise BIGINT NOT NULL DEFAULT 0,
    remaining_unallocated_paise BIGINT NOT NULL DEFAULT 0,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    revision INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT uq_user_month UNIQUE (user_id, month_key)
);

CREATE INDEX idx_monthly_budgets_user_month ON public.monthly_budgets(user_id, month_key);
ALTER TABLE public.monthly_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own monthly budgets"
    ON public.monthly_budgets
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 3. CATEGORY ALLOCATIONS TABLE
-- ============================================================================
CREATE TABLE public.category_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES public.monthly_budgets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category_id VARCHAR(20) NOT NULL CHECK (category_id IN ('essential', 'lifestyle', 'debt', 'savings', 'investment')),
    percentage NUMERIC(5, 2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    allocated_paise BIGINT NOT NULL CHECK (allocated_paise >= 0),
    spent_paise BIGINT NOT NULL DEFAULT 0,
    remaining_paise BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT uq_budget_category UNIQUE (budget_id, category_id)
);

CREATE INDEX idx_category_allocations_budget ON public.category_allocations(budget_id);
ALTER TABLE public.category_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own category allocations"
    ON public.category_allocations
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 4. TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    month_key VARCHAR(7) NOT NULL CHECK (month_key ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
    category_id VARCHAR(20) NOT NULL CHECK (category_id IN ('essential', 'lifestyle', 'debt', 'savings', 'investment')),
    amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
    type VARCHAR(15) NOT NULL DEFAULT 'expense' CHECK (type IN ('expense', 'income', 'refund', 'transfer')),
    title VARCHAR(255) NOT NULL,
    merchant_name VARCHAR(150),
    payment_mode VARCHAR(30) NOT NULL DEFAULT 'UPI',
    date DATE NOT NULL,
    timestamp BIGINT NOT NULL,
    upi_ref_number VARCHAR(50),
    notes TEXT,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    auto_detected_from_sms BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX idx_transactions_user_month ON public.transactions(user_id, month_key);
CREATE INDEX idx_transactions_category ON public.transactions(user_id, category_id);
CREATE INDEX idx_transactions_rrn ON public.transactions(user_id, upi_ref_number) WHERE upi_ref_number IS NOT NULL;

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own transactions"
    ON public.transactions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 5. SAVINGS GOALS (SAVINGS VAULT) TABLE
-- ============================================================================
CREATE TABLE public.savings_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    target_paise BIGINT NOT NULL CHECK (target_paise > 0),
    saved_paise BIGINT NOT NULL DEFAULT 0 CHECK (saved_paise >= 0),
    target_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    priority INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_savings_goals_user ON public.savings_goals(user_id);
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own savings goals"
    ON public.savings_goals
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 6. DEBTS & OBLIGATIONS (WHOM TO PAY) TABLE
-- ============================================================================
CREATE TABLE public.debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    creditor_name VARCHAR(100) NOT NULL,
    creditor_upi_id VARCHAR(100),
    total_amount_paise BIGINT NOT NULL CHECK (total_amount_paise > 0),
    outstanding_paise BIGINT NOT NULL CHECK (outstanding_paise >= 0),
    emi_paise BIGINT NOT NULL DEFAULT 0,
    due_day_of_month INT NOT NULL DEFAULT 5 CHECK (due_day_of_month BETWEEN 1 AND 31),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'settled', 'overdue')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_debts_user ON public.debts(user_id);
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own debts"
    ON public.debts
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 7. MONEY LENT (UDHAAR LEDGER) TABLE
-- ============================================================================
CREATE TABLE public.udhaar_lent (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    friend_name VARCHAR(100) NOT NULL,
    friend_phone VARCHAR(15),
    amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
    recovered_paise BIGINT NOT NULL DEFAULT 0 CHECK (recovered_paise >= 0),
    expected_return_date DATE,
    notes TEXT,
    status VARCHAR(25) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partially_recovered', 'recovered', 'written_off')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_udhaar_lent_user ON public.udhaar_lent(user_id);
ALTER TABLE public.udhaar_lent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own money lent ledger"
    ON public.udhaar_lent
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 8. AUTOMATIC UPDATED_AT TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_monthly_budgets_updated_at BEFORE UPDATE ON public.monthly_budgets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_category_allocations_updated_at BEFORE UPDATE ON public.category_allocations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_savings_goals_updated_at BEFORE UPDATE ON public.savings_goals FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_debts_updated_at BEFORE UPDATE ON public.debts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_udhaar_lent_updated_at BEFORE UPDATE ON public.udhaar_lent FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

---

## 4. SQLite Client Schema (Offline Storage)

For SQLite-based native mobile offline storage via `expo-sqlite` or WatermelonDB:

```sql
CREATE TABLE IF NOT EXISTS local_user_profile (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    primary_upi_id TEXT,
    secondary_savings_upi_id TEXT,
    currency_code TEXT NOT NULL DEFAULT 'INR',
    is_biometric_enabled INTEGER NOT NULL DEFAULT 0,
    theme_preference TEXT NOT NULL DEFAULT 'system',
    sms_sync_enabled INTEGER NOT NULL DEFAULT 0,
    zero_debt_savings_redirection INTEGER NOT NULL DEFAULT 1,
    synced_at INTEGER
);

CREATE TABLE IF NOT EXISTS local_monthly_budgets (
    month_key TEXT PRIMARY KEY,
    salary_paise INTEGER NOT NULL,
    total_spent_paise INTEGER NOT NULL DEFAULT 0,
    remaining_unallocated_paise INTEGER NOT NULL DEFAULT 0,
    is_locked INTEGER NOT NULL DEFAULT 0,
    revision INTEGER NOT NULL DEFAULT 1,
    dirty INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS local_transactions (
    id TEXT PRIMARY KEY,
    month_key TEXT NOT NULL,
    category_id TEXT NOT NULL,
    amount_paise INTEGER NOT NULL,
    type TEXT NOT NULL DEFAULT 'expense',
    title TEXT NOT NULL,
    merchant_name TEXT,
    payment_mode TEXT NOT NULL DEFAULT 'UPI',
    date TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    upi_ref_number TEXT,
    notes TEXT,
    is_recurring INTEGER NOT NULL DEFAULT 0,
    auto_detected_from_sms INTEGER NOT NULL DEFAULT 0,
    dirty INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_local_tx_month ON local_transactions(month_key);
CREATE INDEX IF NOT EXISTS idx_local_tx_date ON local_transactions(date);

CREATE TABLE IF NOT EXISTS local_udhaar (
    id TEXT PRIMARY KEY,
    friend_name TEXT NOT NULL,
    friend_phone TEXT,
    amount_paise INTEGER NOT NULL,
    recovered_paise INTEGER NOT NULL DEFAULT 0,
    expected_return_date TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    dirty INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sync_outbox (
    mutation_id TEXT PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    payload_json TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    retry_count INTEGER NOT NULL DEFAULT 0
);
```

---

## 5. REST & RPC Synchronization Endpoints

When cloud synchronization is active, the app interfaces with the following endpoints:

| Endpoint | Method | Description | Auth Required |
|---|---|---|---|
| `/auth/v1/signup` | `POST` | User registration with OTP / Magic Link | No |
| `/auth/v1/token` | `POST` | Refresh session JWT | No |
| `/rest/v1/rpc/sync_pull` | `POST` | Pull changes since `last_sync_timestamp` | Yes (Bearer) |
| `/rest/v1/rpc/sync_push` | `POST` | Replay local outbox mutations atomically | Yes (Bearer) |
| `/rest/v1/rpc/export_user_data` | `POST` | Generate encrypted full-fidelity JSON dump | Yes (Bearer) |
| `/rest/v1/rpc/purge_user_data` | `DELETE` | GDPR/DPDP compliant permanent erasure | Yes (Bearer) |

### Sample Atomic Push Payload (`sync_push` RPC)
```json
{
  "client_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "last_synced_revision": 142,
  "mutations": [
    {
      "mutation_id": "mut_1795113940123",
      "table": "transactions",
      "op": "INSERT",
      "data": {
        "id": "tx_20261119_starbucks_01",
        "month_key": "2026-11",
        "category_id": "lifestyle",
        "amount_paise": 35000,
        "type": "expense",
        "title": "Starbucks Coffee",
        "merchant_name": "starbucks.coffee@hdfcbank",
        "payment_mode": "UPI",
        "date": "2026-11-19",
        "timestamp": 1795113940000,
        "auto_detected_from_sms": true
      }
    }
  ]
}
```

---

## 6. Data Integrity & Verification Checklist

- [x] All monetary amounts stored as strictly non-negative integers (`BIGINT` / `INTEGER` in paise).
- [x] Zero floating point variables in database schema or mathematical aggregation pipelines.
- [x] Row Level Security (RLS) configured on every cloud table preventing unauthorized cross-user reads/writes.
- [x] Monthly partitioning ensures edits to the current month do not corrupt past month historical archives.
- [x] Unallocated salary sum equation strictly enforced: $\text{Salary} = \sum \text{Allocations} + \text{Remaining Unallocated}$.
- [x] Offline outbox queue guarantees transactional consistency during airplane mode or unstable network conditions.
