# SalaryWay – Security Audit & Compliance Architecture

## Security Overview
SalaryWay is architected with a local-first, zero-trust financial data posture. All calculations, budget allocations, and transaction ledgers run entirely on-device without cloud exfiltration.

## 1. Credentials and Secret Keys
- **Zero API Keys in Repository**: No private tokens, API keys, or cloud database credentials are embedded in client source code.
- **Environment Variables**: Any future external endpoints will load via `EXPO_PUBLIC_` runtime environment variables.
- **Git Hygiene**: `.gitignore` strictly excludes `.env`, secrets, keystores, and build outputs.

## 2. Banking and Account Aggregator Compliance
- **No Password / PIN Collection**: Under no circumstances does the application request, intercept, or store net-banking passwords, debit card PINs, or UPI PINs.
- **RBI Account Aggregator (AA) Conformance**: The banking service is abstracted under a mock/sandbox layer adhering to RBI master directions on consent management.
- **Revocable Consent**: Users can revoke the demo consent handle at any time via Profile settings.

## 3. Data Storage & Cryptography
- **Local SQLite / AsyncStorage**: Data is persisted in the application's sandboxed local container on the device.
- **No Plaintext Leaks**: Sensitive loggers are stripped in release builds.

## 4. Input Validation & Calculation Integrity
- **Integer Paise Engine**: Prevents floating-point precision truncation and balance rounding errors.
- **100% Allocation Constraint**: Strict validation prevents negative allocations or unassigned money leaks.
- **Duplicate Prevention**: Ingestion pipelines check for duplicate transaction records before ledger commitment.
