# ServiceHub Platform Frontend

A modern, production-grade Vite & React single page application (SPA) integrated with the ServiceHub multi-role marketplace backend.

---

## 🛠️ Features

* **Multi-Role Dashboards**:
  * **Customer Portal**: Service search catalog, address management, checkout with Razorpay and Wallet balance integration, billing invoices list, recurring subscriptions controls (Pause, Resume, Skip, Vacation, Renew), and live support tickets.
  * **Provider Console**: Business store settings, bank account credentials linking, KYC documentation upload logs, service SKU plans CRUD, expenses logger, payout settlements, customer reviews management, and manual scheduler recovery overrides.
  * **Admin Console**: Global platform statistics, KYC reviews, service catalog moderation, commission hierarchy rules, coupons CRUD, settlements approvals, system audit logs, and manual scheduler triggers.
* **Axios API Client**: Configured with request headers, error maps, locale context injection, and automated token refresh rotation via JWT refresh keys.
* **Multilingual Localization**: Native support for English, Hindi, and Marathi locales using `i18next` bundles.

---

## 🚀 Getting Started

### 1. Configure Environment Variables
Create a `.env` file in the root of the `frontend` folder:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=rzp_test_your_razorpay_key
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```
The output assets will be built in the `dist` folder.
