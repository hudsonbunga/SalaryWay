# UI/UX Design Brief & Design System Specification
## SalaryWay — "Hybrid Apple iOS UX + Android Material 3 UI"

---

## 1. Design Philosophy

SalaryWay bridges two world-class mobile interaction paradigms:
1. **Apple iOS UX (Motion & Physics)**:
   - Fluid physics-based spring animations (`useNativeDriver: true`).
   - Micro-interactions that give tactile feedback: buttons scale down subtly (`0.96` to `0.97`) on touch-down and spring back on release.
   - Native-feeling modal bottom sheets that drag and dismiss smoothly along the finger's vertical velocity.
2. **Android Material 3 UI (Surfaces & Components)**:
   - Crisp surface tonal elevation with deliberate contrast ratios.
   - Full stadium pills (`borderRadius: RADIUS.full`), soft rounded cards (`RADIUS.lg = 16px`), and hairline borders (`borderWidth: 1`).
   - Clean, uncluttered forms with accessible label typography and clear focus outlines.

---

## 2. Color System & Design Tokens

SalaryWay implements an **Adaptive System Theme Engine** that automatically follows the device's OS preference (Light or Dark mode) while allowing manual user override.

### 2.1 Dark Mode Palette (Deep Matte Charcoal)
Rather than using harsh pure blacks (`#000000`), dark mode uses rich slate and charcoal tones to eliminate eye strain during evening financial tracking:

| Token Name | Hex Code | Description & Usage |
| :--- | :--- | :--- |
| `background` | `#121417` | Deep Matte Charcoal — Screen base background |
| `surface` | `#1C1F24` | Elevated Dark Slate — Card surfaces and modal containers |
| `surfaceElevated`| `#252A32` | Secondary elevated surface for inner chips and badges |
| `border` | `#2B3038` | Hairline border providing crisp separation between surfaces |
| `text` | `#F3F4F6` | Crisp Off-White — Primary headings and monetary amounts |
| `textSecondary` | `#9BA1A6` | Muted Cool Gray — Subtitles, dates, and metric labels |
| `primary` | `#10B981` | Emerald Mint — Primary action triggers, progress fills, badges |
| `primaryText` | `#34D399` | Mint Accent — Emphasized status text and links |
| `danger` | `#F87171` | Soft Coral Red — Overspending alerts, debt tags, negative balance |
| `alertBg` | `#2A1618` | Desaturated Maroon — Background for warning banners |
| `alertBorder` | `#5C2328` | Muted Crimson — Border for warning banners |

### 2.2 Light Mode Palette (Crisp Minimalist)

| Token Name | Hex Code | Description & Usage |
| :--- | :--- | :--- |
| `background` | `#F7F8FA` | Clean Soft Gray — Page background |
| `surface` | `#FFFFFF` | Crisp Pure White — Card surfaces and modals |
| `border` | `#E2E8F0` | Subtle Hairline Border |
| `text` | `#0F172A` | Deep Slate Navy — Primary text |
| `textSecondary` | `#64748B` | Neutral Slate Gray — Secondary text |
| `primary` | `#10B981` | Vivid Emerald Green — Primary actions |
| `danger` | `#EF4444` | Crimson Red — Negative indicators |
| `alertBg` | `#FEF2F2` | Pale Rose Tint — Alert container fill |
| `alertBorder` | `#FECACA` | Soft Pink Border |

### 2.3 The 5 Pocket Category Accents

| Category | Primary Color | Soft Background Tint | Icon | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Essential Expenses** | `#3B82F6` (Electric Blue) | `#EBF3FC` (Light) / `#182635` (Dark) | `home` | Rent, Groceries, Utilities |
| **Lifestyle** | `#F59E0B` (Warm Amber) | `#FEF3C7` (Light) / `#312716` (Dark) | `coffee`| Dining, Entertainment |
| **Debt Repayment** | `#EF4444` (Coral Red) | `#FEE2E2` (Light) / `#32181B` (Dark) | `credit-card` | Loans, EMIs, Cards |
| **Wealth & Savings** | `#10B981` (Mint Emerald) | `#D1FAE5` (Light) / `#132E25` (Dark) | `trending-up` | Emergency Fund, SIPs |
| **Invest in Myself** | `#8B5CF6` (Royal Violet)| `#EDE9FE` (Light) / `#261C3B` (Dark) | `book-open` | Books, Courses, Fitness |

---

## 3. Typography & Spacing Scale

### 3.1 Typography Scale

```
Display Large:   28px / 34px Line-Height  •  Font-Weight: 800  (Monthly Hero Figures)
Headline:        22px / 28px Line-Height  •  Font-Weight: 800  (Screen Titles)
Title Medium:    18px / 24px Line-Height  •  Font-Weight: 700  (Card Titles, Modals)
Body Regular:    14px / 20px Line-Height  •  Font-Weight: 500  (Transactions, Lists)
Label Compact:   12px / 16px Line-Height  •  Font-Weight: 600  (Badges, Metadata)
Micro:           10px / 14px Line-Height  •  Font-Weight: 700  (Payment Method Tags)
```

### 3.2 8-Point Spacing Grid

```javascript
export const SPACING = {
  xs: 4,      // Micro gaps, icon margins
  sm: 8,      // Inner padding, badge padding
  md: 16,     // Standard card padding, element separation
  lg: 20,     // Screen edge padding
  xl: 24,     // Section margins
  xxl: 32,    // Major layout dividers
  xxxl: 48,   // Empty state top margins
};
```

### 3.3 Border Radius Tokens

```javascript
export const RADIUS = {
  sm: 6,      // Small tags & badges
  md: 10,     // Action cards & input fields
  lg: 16,     // Standard cards & containers
  xl: 20,     // Modals & hero surfaces
  full: 9999, // Stadium pill buttons, FABs, circular avatars
};
```

---

## 4. Mobile Ergonomics & Safe-Area Rules

### 4.1 9:16 to 19.5:9 Screen Ratio Responsiveness
- All layout screens utilize fluid flex column structures with `paddingHorizontal: SPACING.lg`.
- Zero horizontal overflow: labels clamp with `numberOfLines={1}` and `ellipsizeMode="tail"`.
- Modals scale gracefully on compact displays without clipping primary action buttons.

### 4.2 The Lower Thumb Zone
- Primary triggers (such as `+ Add Expense`, `Download & Share Statement`, `Pay via UPI`) are anchored in the bottom-center thumb zone.
- Bottom clearance strictly accounts for system insets:
  $$\text{Bottom Offset} = \max(\text{insets.bottom}, 24) + \text{Padding}$$
  This prevents interactive elements from colliding with Android 3-button navigation bars or iOS home indicator pills.

---

## 5. Standardized Core Components

### 5.1 `<FloatingMajorButton>`
The primary action trigger across all major views:
- **Dimensions**: Fixed 42px stadium pill (`borderRadius: RADIUS.full`).
- **Tactile Feedback**: Spring scale animation on `pressIn` (`0.96`), spring return on `pressOut`.
- **Loading State**: Replaces title with a subtle `ActivityIndicator` and ignores subsequent rapid taps (debounce).
- **Error Guard**: Wraps execution in `try / catch` and surfaces user-friendly alert banners if dispatch fails.

### 5.2 `<TactileTouch>`
Universal touchable wrapper replacing raw `TouchableOpacity`:
- Applies physics-based scale-down micro-interaction (`0.97`) using React Native Reanimated.
- Configured with comfortable touch targets (`hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}`).

### 5.3 `<SleekToast>`
In-app non-blocking notification toast replacing system alert dialogs:
- Floats from the top safe area with an animated spring drop.
- Categorized by type: Success (Emerald), Warning (Amber), Error (Coral Red).
- Auto-dismisses after 3 seconds with swipe-to-dismiss gesture.
