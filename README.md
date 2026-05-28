# Loyalty Sarkar — Frontend

React + Vite admin panel for the Loyalty Sarkar program. Provides dashboards, customer management, tier settings, referral tools, and general settings.

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React 18 |
| Build tool | Vite 5 |
| Routing | React Router v6 |
| HTTP | Axios |
| Charts | Recharts |
| QR codes | qrcode.react |
| QR scanner | html5-qrcode |

---

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# VITE_API_URL is only needed when running without the Vite dev proxy
```

### 3. Start development server
```bash
npm run dev        # http://localhost:5173
```

The Vite dev server proxies `/api/*` → `http://localhost:3000` automatically (see `vite.config.js`), so the backend must be running locally.

### 4. Build for production
```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build locally
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend base URL — leave blank in dev (Vite proxy handles it). Set to the deployed API URL in production (e.g. `https://api.sarkar.store`). |

---

## Default Credentials (Development Only)

> Remove or change these before deploying to production.

| Field | Value |
|---|---|
| Phone | `9999999999` |
| Password | `Admin@123` |
| Role | Super Admin |

---

## Pages & Routes

| Route | Component | Access |
|---|---|---|
| `/login` | `Login` | Public |
| `/forgot-password` | `ForgotPassword` | Public |
| `/referral-join` | `ReferralJoin` | Public (customer-facing) |
| `/dashboard` | `Dashboard` | `dashboard` permission |
| `/transactions` | `Transactions` | `transactions` permission |
| `/analytics` | `Analytics` | `analytics` permission |
| `/customers` | `Customers` | `customers` permission |
| `/customers/:id` | `CustomerDetail` | `customers` permission |
| `/tier-settings` | `TierSettings` | `tier_settings` permission |
| `/role-management` | `RoleManagement` | `role_management` permission |
| `/referral-stats` | `ReferralStats` | Any authenticated user |
| `/join-loyalty` | `JoinLoyalty` | `join_loyalty` permission |
| `/scan-scanner` | `ScanScanner` | `scan_loyalty` permission |
| `/referral` | `ReferralPage` | `referral` permission |
| `/general-settings` | `GeneralSettings` | `general_settings` permission |

---

## Auth & Permissions

- JWT stored in `localStorage` via `AuthContext`
- `ProtectedRoute` wraps pages that need a specific permission key
- Super admin sees an extra **Super Admin** section in the sidebar with tools not exposed to regular admins
- Permissions are managed per-role in **Role Management**

---

## Project Structure

```
src/
├── components/
│   ├── AuthLayout.jsx      # Sidebar + Outlet wrapper for authenticated pages
│   ├── Layout.jsx
│   ├── ProtectedRoute.jsx  # Permission gate
│   └── Sidebar.jsx         # Navigation with role-based visibility
├── context/
│   └── AuthContext.jsx     # JWT auth state + hasPermission helper
├── pages/
│   ├── Dashboard.jsx
│   ├── Customers.jsx
│   ├── CustomerDetail.jsx
│   ├── Transactions.jsx
│   ├── Analytics.jsx
│   ├── TierSettings.jsx
│   ├── RoleManagement.jsx
│   ├── ReferralPage.jsx    # Referral link + QR generator (admin)
│   ├── ReferralJoin.jsx    # Customer sign-up page (public)
│   ├── ReferralStats.jsx   # Referral leaderboard
│   ├── GeneralSettings.jsx # Shopify config + referral points + reset cycle
│   ├── JoinLoyalty.jsx
│   ├── ScanScanner.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   └── ForgotPassword.jsx
├── index.css               # Global styles (Shopify palette)
└── App.jsx                 # Router setup
```

---

## Color Palette

The UI follows the Shopify admin color system:

| Token | Value | Usage |
|---|---|---|
| Primary green | `#008060` | Buttons, active states, badges |
| Sidebar bg | `#1a1a1a` | Navigation background |
| Page bg | `#f6f6f7` | Main content area |
| Surface | `#ffffff` | Cards |
| Border | `#e5e7eb` | Dividers, input borders |
