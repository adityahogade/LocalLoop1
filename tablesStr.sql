-- ============================================================================
-- SERVICEHUB — COMPLETE MYSQL 8+ DATABASE SCHEMA (DDL)
-- All 31 tables, in FK-dependency-safe creation order.
-- Conventions:
--   * All monetary columns: DECIMAL(12,2) or DECIMAL(10,2) — never FLOAT/DOUBLE.
--   * All PKs: BIGINT UNSIGNED AUTO_INCREMENT.
--   * Engine: InnoDB (required for FK + transaction support). Charset: utf8mb4
--     (required for Hindi/Marathi text — utf8mb4_unicode_ci collation).
--   * ON DELETE policy (deliberate, not default-CASCADE-everywhere):
--       - CASCADE   : child rows are pure extensions/children of the parent
--                     and have no independent meaning once the parent is gone
--                     (e.g. addresses of a customer, plans of a service).
--       - RESTRICT  : parent cannot be deleted while children exist — used
--                     for every FINANCIAL / LEDGER / AUDIT table, and for any
--                     row that other rows depend on for historical integrity
--                     (payments, provider_earnings, orders, subscriptions,
--                     services referenced by past orders, etc.). In practice
--                     the application layer should soft-delete (status/
--                     is_active flags) rather than hard-delete these parents.
--       - SET NULL  : the FK is optional context, not identity — losing the
--                     parent should not block or cascade-delete the child
--                     (e.g. audit_logs.user_id for system actions,
--                     coupons on an order, commission_rules scoping).
--   * ON UPDATE CASCADE everywhere PKs are BIGINT surrogate keys (never
--     manually renumbered, so this is effectively inert but kept for
--     referential correctness).
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- I.1 AUTH
-- ============================================================================

CREATE TABLE roles (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(30) NOT NULL,
  description   VARCHAR(255) NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_roles_name UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
  id                    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_id               BIGINT UNSIGNED NOT NULL,
  full_name             VARCHAR(120) NOT NULL,
  email                 VARCHAR(150) NOT NULL,
  phone                 VARCHAR(15) NOT NULL,
  password_hash         VARCHAR(255) NOT NULL,
  preferred_language    ENUM('en','hi','mr') NOT NULL DEFAULT 'en',
  status                ENUM('active','suspended','deleted') NOT NULL DEFAULT 'active',
  email_verified_at     DATETIME NULL,
  phone_verified_at     DATETIME NULL,
  refresh_token_hash    VARCHAR(255) NULL,
  last_login_at         DATETIME NULL,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT uq_users_phone UNIQUE (phone),
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_users_role_status (role_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- I.2 CUSTOMER
-- ============================================================================

CREATE TABLE customers (
  id                   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id              BIGINT UNSIGNED NOT NULL,
  default_address_id   BIGINT UNSIGNED NULL,   -- FK added after addresses table exists (see ALTER below)
  date_of_birth        DATE NULL,
  referral_code        VARCHAR(20) NULL,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_customers_user UNIQUE (user_id),
  CONSTRAINT uq_customers_referral_code UNIQUE (referral_code),
  CONSTRAINT fk_customers_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE addresses (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id   BIGINT UNSIGNED NOT NULL,
  label         VARCHAR(30) NOT NULL,
  house_no      VARCHAR(50) NULL,
  building      VARCHAR(100) NULL,
  street        VARCHAR(150) NULL,
  area          VARCHAR(100) NOT NULL,
  city          VARCHAR(100) NOT NULL,
  state         VARCHAR(100) NOT NULL,
  pincode       VARCHAR(10) NOT NULL,
  latitude      DECIMAL(10,7) NULL,
  longitude     DECIMAL(10,7) NULL,
  is_default    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_addresses_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_addresses_customer (customer_id),
  INDEX idx_addresses_pincode (pincode),
  INDEX idx_addresses_area (area),
  INDEX idx_addresses_city (city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Deferred FK now that addresses exists (avoids circular creation-order issue)
ALTER TABLE customers
  ADD CONSTRAINT fk_customers_default_address FOREIGN KEY (default_address_id)
    REFERENCES addresses(id) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE wallets (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id   BIGINT UNSIGNED NOT NULL,
  balance       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_wallets_customer UNIQUE (customer_id),
  CONSTRAINT fk_wallets_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE wallet_transactions (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  wallet_id        BIGINT UNSIGNED NOT NULL,
  type             ENUM('credit','debit','refund') NOT NULL,
  amount           DECIMAL(12,2) NOT NULL,
  balance_after    DECIMAL(12,2) NOT NULL,
  reference_type   ENUM('order','subscription_payment','refund','manual_admin_adjustment') NOT NULL,
  reference_id     BIGINT UNSIGNED NULL,
  description      VARCHAR(255) NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_wallet_tx_wallet FOREIGN KEY (wallet_id) REFERENCES wallets(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,      -- ledger row must never vanish silently
  CONSTRAINT chk_wallet_tx_amount CHECK (amount > 0),
  INDEX idx_wallet_tx_wallet_created (wallet_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- I.3 PROVIDER
-- ============================================================================

CREATE TABLE providers (
  id                     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id                BIGINT UNSIGNED NOT NULL,
  business_name          VARCHAR(150) NOT NULL,
  business_description   TEXT NULL,
  logo_url               VARCHAR(255) NULL,
  kyc_status             ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  kyc_rejection_reason   VARCHAR(255) NULL,
  is_active              BOOLEAN NOT NULL DEFAULT TRUE,
  average_rating         DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_providers_user UNIQUE (user_id),
  CONSTRAINT fk_providers_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_providers_rating CHECK (average_rating BETWEEN 0 AND 5),
  INDEX idx_providers_kyc_status (kyc_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE kyc_documents (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  provider_id    BIGINT UNSIGNED NOT NULL,
  document_type  ENUM('id_proof','address_proof','bank_proof','business_license','other') NOT NULL,
  file_url       VARCHAR(255) NOT NULL,
  status         ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  reviewed_by    BIGINT UNSIGNED NULL,
  reviewed_at    DATETIME NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_kyc_docs_provider FOREIGN KEY (provider_id) REFERENCES providers(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_kyc_docs_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_kyc_docs_provider (provider_id),
  INDEX idx_kyc_docs_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE provider_bank_accounts (
  id                          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  provider_id                 BIGINT UNSIGNED NOT NULL,
  account_holder_name         VARCHAR(120) NOT NULL,
  account_number_encrypted    VARBINARY(255) NOT NULL,
  account_number_last4        CHAR(4) NOT NULL,
  ifsc_code                   VARCHAR(11) NOT NULL,
  bank_name                   VARCHAR(100) NOT NULL,
  verified                    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_bank_accounts_provider UNIQUE (provider_id),
  CONSTRAINT fk_bank_accounts_provider FOREIGN KEY (provider_id) REFERENCES providers(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE provider_availability (
  id                       BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  provider_id              BIGINT UNSIGNED NOT NULL,
  day_of_week              TINYINT UNSIGNED NOT NULL,
  start_time               TIME NOT NULL,
  end_time                 TIME NOT NULL,
  slot_duration_minutes    SMALLINT UNSIGNED NOT NULL DEFAULT 60,
  max_bookings_per_slot    SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  is_available             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_availability_provider FOREIGN KEY (provider_id) REFERENCES providers(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_availability_dow CHECK (day_of_week BETWEEN 0 AND 6),
  CONSTRAINT chk_availability_times CHECK (end_time > start_time),
  INDEX idx_availability_provider_dow (provider_id, day_of_week)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE provider_expenses (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  provider_id    BIGINT UNSIGNED NOT NULL,
  category       ENUM('fuel','ingredients','raw_materials','cleaning_supplies','staff_salary',
                       'maintenance','packaging','transportation','other') NOT NULL,
  amount         DECIMAL(12,2) NOT NULL,
  expense_date   DATE NOT NULL,
  description    VARCHAR(255) NULL,
  receipt_url    VARCHAR(255) NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_expenses_provider FOREIGN KEY (provider_id) REFERENCES providers(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,      -- financial record, preserve for audit
  CONSTRAINT chk_expenses_amount CHECK (amount > 0),
  INDEX idx_expenses_provider_date (provider_id, expense_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- I.4 CATALOG
-- ============================================================================

CREATE TABLE categories (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(50) NOT NULL,
  slug         VARCHAR(50) NOT NULL,
  icon_url     VARCHAR(255) NULL,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_categories_name UNIQUE (name),
  CONSTRAINT uq_categories_slug UNIQUE (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE services (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  provider_id       BIGINT UNSIGNED NOT NULL,
  category_id       BIGINT UNSIGNED NOT NULL,
  name              VARCHAR(150) NOT NULL,
  description       TEXT NULL,
  type              ENUM('subscription','one_time','both') NOT NULL,
  base_price        DECIMAL(10,2) NOT NULL,
  unit              VARCHAR(30) NOT NULL,
  attributes_json   JSON NULL,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  image_url         VARCHAR(255) NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_services_provider FOREIGN KEY (provider_id) REFERENCES providers(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,      -- past orders/subscriptions reference this service
  CONSTRAINT fk_services_category FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_services_price CHECK (base_price >= 0),
  INDEX idx_services_provider_cat_active (provider_id, category_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE service_plans (
  id                    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  service_id            BIGINT UNSIGNED NOT NULL,
  frequency             ENUM('daily','weekly','monthly','custom') NOT NULL,
  price                 DECIMAL(10,2) NOT NULL,
  min_quantity          DECIMAL(6,2) NOT NULL DEFAULT 1,
  billing_cycle_days    SMALLINT UNSIGNED NOT NULL,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_service_plans_service FOREIGN KEY (service_id) REFERENCES services(id)
    ON DELETE CASCADE ON UPDATE CASCADE,       -- plan has no meaning without its service
  CONSTRAINT chk_service_plans_price CHECK (price >= 0),
  CONSTRAINT chk_service_plans_min_qty CHECK (min_quantity > 0),
  INDEX idx_service_plans_service (service_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE service_areas (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  provider_id   BIGINT UNSIGNED NOT NULL,
  state         VARCHAR(100) NOT NULL,
  city          VARCHAR(100) NOT NULL,
  area          VARCHAR(100) NULL,
  pincode       VARCHAR(10) NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_service_areas_provider FOREIGN KEY (provider_id) REFERENCES providers(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT uq_service_areas_provider_pincode UNIQUE (provider_id, pincode),
  INDEX idx_service_areas_pincode (pincode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- I.5 SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE customer_subscriptions (
  id                     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id            BIGINT UNSIGNED NOT NULL,
  provider_id            BIGINT UNSIGNED NOT NULL,
  service_id             BIGINT UNSIGNED NOT NULL,
  service_plan_id        BIGINT UNSIGNED NOT NULL,
  address_id             BIGINT UNSIGNED NOT NULL,
  quantity               DECIMAL(6,2) NOT NULL,
  delivery_time_slot     ENUM('morning','evening','custom') NOT NULL,
  custom_time            TIME NULL,
  start_date             DATE NOT NULL,
  end_date               DATE NULL,
  status                 ENUM('active','paused','vacation','cancelled','expired') NOT NULL DEFAULT 'active',
  vacation_start         DATE NULL,
  vacation_end           DATE NULL,
  next_billing_date      DATE NOT NULL,
  created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_sub_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,      -- historical billing/delivery record must survive
  CONSTRAINT fk_sub_provider FOREIGN KEY (provider_id) REFERENCES providers(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_sub_service FOREIGN KEY (service_id) REFERENCES services(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_sub_service_plan FOREIGN KEY (service_plan_id) REFERENCES service_plans(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,      -- locks in the priced plan at subscribe time
  CONSTRAINT fk_sub_address FOREIGN KEY (address_id) REFERENCES addresses(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,      -- prevents deleting an address in active use
  CONSTRAINT chk_sub_quantity CHECK (quantity > 0),
  CONSTRAINT chk_sub_dates CHECK (end_date IS NULL OR end_date >= start_date),
  CONSTRAINT chk_sub_vacation CHECK (vacation_end IS NULL OR vacation_start IS NULL OR vacation_end >= vacation_start),
  INDEX idx_sub_status_next_billing (status, next_billing_date),
  INDEX idx_sub_customer_status (customer_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE subscription_deliveries (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  subscription_id  BIGINT UNSIGNED NOT NULL,
  delivery_date    DATE NOT NULL,
  status           ENUM('scheduled','out_for_delivery','delivered','skipped','cancelled') NOT NULL DEFAULT 'scheduled',
  quantity         DECIMAL(6,2) NOT NULL,
  delivered_at     DATETIME NULL,
  notes            VARCHAR(255) NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_sub_deliveries_subscription FOREIGN KEY (subscription_id) REFERENCES customer_subscriptions(id)
    ON DELETE CASCADE ON UPDATE CASCADE,       -- pure children of the subscription
  CONSTRAINT uq_sub_deliveries_sub_date UNIQUE (subscription_id, delivery_date),   -- MANDATORY idempotency guard
  INDEX idx_sub_deliveries_date_status (delivery_date, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE skipped_deliveries (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  subscription_id  BIGINT UNSIGNED NOT NULL,
  skip_date        DATE NOT NULL,
  reason           VARCHAR(255) NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_skipped_deliveries_subscription FOREIGN KEY (subscription_id) REFERENCES customer_subscriptions(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT uq_skipped_deliveries_sub_date UNIQUE (subscription_id, skip_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- subscription_payments references payments(id); payments table is created in I.7,
-- so this table's FK to payments is added via ALTER TABLE after payments exists.
CREATE TABLE subscription_payments (
  id                     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  subscription_id        BIGINT UNSIGNED NOT NULL,
  billing_period_start   DATE NOT NULL,
  billing_period_end     DATE NOT NULL,
  amount                 DECIMAL(10,2) NOT NULL,
  payment_id             BIGINT UNSIGNED NULL,
  status                 ENUM('pending','paid','failed','retrying') NOT NULL DEFAULT 'pending',
  due_date               DATE NOT NULL,
  retry_count            TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_sub_payments_subscription FOREIGN KEY (subscription_id) REFERENCES customer_subscriptions(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_sub_payments_amount CHECK (amount >= 0),
  CONSTRAINT chk_sub_payments_period CHECK (billing_period_end >= billing_period_start),
  CONSTRAINT uq_sub_payments_sub_period UNIQUE (subscription_id, billing_period_start),  -- Gap #7: renewal double-charge guard
  INDEX idx_sub_payments_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- I.6 ORDERS
-- ============================================================================

CREATE TABLE orders (
  id                       BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_number             VARCHAR(20) NOT NULL,
  customer_id              BIGINT UNSIGNED NOT NULL,
  provider_id              BIGINT UNSIGNED NOT NULL,
  address_id               BIGINT UNSIGNED NOT NULL,
  category_id              BIGINT UNSIGNED NOT NULL,
  status                   ENUM('pending','confirmed','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
  subtotal                 DECIMAL(12,2) NOT NULL,
  discount_amount          DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_amount             DECIMAL(12,2) NOT NULL,
  coupon_id                BIGINT UNSIGNED NULL,
  scheduled_date           DATE NOT NULL,
  scheduled_time_slot      VARCHAR(30) NULL,
  booking_details_json     JSON NULL,
  payment_id               BIGINT UNSIGNED NULL,   -- FK added via ALTER after payments exists
  cancelled_reason         VARCHAR(255) NULL,
  created_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_orders_order_number UNIQUE (order_number),
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_orders_provider FOREIGN KEY (provider_id) REFERENCES providers(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_orders_address FOREIGN KEY (address_id) REFERENCES addresses(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_orders_category FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  -- fk_orders_coupon added via ALTER after coupons table exists (ON DELETE SET NULL)
  CONSTRAINT chk_orders_amounts CHECK (subtotal >= 0 AND discount_amount >= 0 AND total_amount >= 0),
  INDEX idx_orders_customer_status (customer_id, status),
  INDEX idx_orders_provider_status (provider_id, status),
  INDEX idx_orders_scheduled_date (scheduled_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE order_items (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id      BIGINT UNSIGNED NOT NULL,
  service_id    BIGINT UNSIGNED NOT NULL,
  quantity      DECIMAL(6,2) NOT NULL,
  unit_price    DECIMAL(10,2) NOT NULL,
  line_total    DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,       -- line items have no meaning without the order
  CONSTRAINT fk_order_items_service FOREIGN KEY (service_id) REFERENCES services(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,      -- preserve which service was actually ordered
  CONSTRAINT chk_order_items_qty CHECK (quantity > 0),
  CONSTRAINT chk_order_items_price CHECK (unit_price >= 0 AND line_total >= 0),
  INDEX idx_order_items_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- I.7 PAYMENTS
-- ============================================================================

CREATE TABLE payments (
  id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id             BIGINT UNSIGNED NOT NULL,
  reference_type          ENUM('order','subscription_payment') NOT NULL,
  reference_id            BIGINT UNSIGNED NOT NULL,
  amount                  DECIMAL(12,2) NOT NULL,
  currency                CHAR(3) NOT NULL DEFAULT 'INR',
  razorpay_order_id       VARCHAR(50) NOT NULL,
  razorpay_payment_id     VARCHAR(50) NULL,
  razorpay_signature      VARCHAR(255) NULL,
  status                  ENUM('created','pending','paid','failed','refunded','partially_refunded') NOT NULL DEFAULT 'created',
  method                  VARCHAR(30) NULL,
  idempotency_key         VARCHAR(100) NOT NULL,
  paid_at                 DATETIME NULL,
  created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_payments_razorpay_order UNIQUE (razorpay_order_id),
  CONSTRAINT uq_payments_razorpay_payment UNIQUE (razorpay_payment_id),
  CONSTRAINT uq_payments_idempotency_key UNIQUE (idempotency_key),
  CONSTRAINT fk_payments_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,      -- financial record of record, never cascade-deleted
  CONSTRAINT chk_payments_amount CHECK (amount >= 0),
  INDEX idx_payments_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Deferred FKs now that payments exists
ALTER TABLE subscription_payments
  ADD CONSTRAINT fk_sub_payments_payment FOREIGN KEY (payment_id) REFERENCES payments(id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE orders
  ADD CONSTRAINT fk_orders_payment FOREIGN KEY (payment_id) REFERENCES payments(id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE refunds (
  id                    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  payment_id            BIGINT UNSIGNED NOT NULL,
  amount                DECIMAL(12,2) NOT NULL,
  reason                VARCHAR(255) NOT NULL,
  razorpay_refund_id    VARCHAR(50) NULL,
  status                ENUM('initiated','processed','failed') NOT NULL DEFAULT 'initiated',
  initiated_by          BIGINT UNSIGNED NOT NULL,
  processed_at          DATETIME NULL,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_refunds_razorpay_refund UNIQUE (razorpay_refund_id),
  CONSTRAINT fk_refunds_payment FOREIGN KEY (payment_id) REFERENCES payments(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_refunds_initiator FOREIGN KEY (initiated_by) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,      -- audit trail: who authorized the refund
  CONSTRAINT chk_refunds_amount CHECK (amount > 0),
  INDEX idx_refunds_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PROVIDER FINANCIALS (depend on payments — created here, after I.7)
-- ============================================================================

CREATE TABLE provider_settlements (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  provider_id         BIGINT UNSIGNED NOT NULL,
  period_start        DATE NOT NULL,
  period_end          DATE NOT NULL,
  total_earnings      DECIMAL(12,2) NOT NULL,
  status              ENUM('requested','approved','paid','rejected') NOT NULL DEFAULT 'requested',
  requested_at        DATETIME NOT NULL,
  processed_by        BIGINT UNSIGNED NULL,
  processed_at        DATETIME NULL,
  payout_reference    VARCHAR(100) NULL,
  rejection_reason    VARCHAR(255) NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_settlements_provider FOREIGN KEY (provider_id) REFERENCES providers(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,      -- financial/payout record, permanent
  CONSTRAINT fk_settlements_processor FOREIGN KEY (processed_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,      -- keep the settlement even if the admin account is later removed
  CONSTRAINT chk_settlements_period CHECK (period_end >= period_start),
  CONSTRAINT chk_settlements_amount CHECK (total_earnings >= 0),
  INDEX idx_settlements_provider (provider_id),
  INDEX idx_settlements_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE provider_earnings (
  id                          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  provider_id                 BIGINT UNSIGNED NOT NULL,
  source_type                 ENUM('order','subscription_delivery') NOT NULL,
  source_id                   BIGINT UNSIGNED NOT NULL,
  payment_id                  BIGINT UNSIGNED NOT NULL,
  gross_amount                DECIMAL(12,2) NOT NULL,
  commission_rate_applied     DECIMAL(5,2) NOT NULL,
  commission_amount           DECIMAL(12,2) NOT NULL,
  refund_amount                DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  net_earning                  DECIMAL(12,2) NOT NULL,
  earning_date                 DATE NOT NULL,
  settlement_id                 BIGINT UNSIGNED NULL,
  created_at                    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_earnings_provider FOREIGN KEY (provider_id) REFERENCES providers(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,      -- immutable financial ledger row, never deleted
  CONSTRAINT fk_earnings_payment FOREIGN KEY (payment_id) REFERENCES payments(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_earnings_settlement FOREIGN KEY (settlement_id) REFERENCES provider_settlements(id)
    ON DELETE SET NULL ON UPDATE CASCADE,      -- rejected settlement unlocks earnings (settlement_id -> NULL)
  CONSTRAINT chk_earnings_amounts CHECK (
    gross_amount >= 0 AND commission_amount >= 0 AND refund_amount >= 0
    AND commission_rate_applied BETWEEN 0 AND 100
  ),
  INDEX idx_earnings_provider_date (provider_id, earning_date),
  INDEX idx_earnings_settlement (settlement_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- I.8 BILLING
-- ============================================================================

CREATE TABLE coupons (
  id                     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code                   VARCHAR(30) NOT NULL,
  discount_type          ENUM('percentage','fixed') NOT NULL,
  discount_value         DECIMAL(10,2) NOT NULL,
  min_order_amount       DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_discount_amount    DECIMAL(10,2) NULL,
  start_date             DATE NOT NULL,
  end_date               DATE NOT NULL,
  usage_limit_total      INT UNSIGNED NULL,
  usage_limit_per_user   INT UNSIGNED NOT NULL DEFAULT 1,
  category_id            BIGINT UNSIGNED NULL,
  is_active              BOOLEAN NOT NULL DEFAULT TRUE,
  created_by             BIGINT UNSIGNED NOT NULL,
  created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_coupons_code UNIQUE (code),
  CONSTRAINT fk_coupons_category FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE SET NULL ON UPDATE CASCADE,      -- category removal shouldn't destroy the coupon, just broaden it
  CONSTRAINT fk_coupons_creator FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_coupons_value CHECK (discount_value > 0),
  CONSTRAINT chk_coupons_dates CHECK (end_date >= start_date),
  INDEX idx_coupons_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Deferred FK now that coupons exists
ALTER TABLE orders
  ADD CONSTRAINT fk_orders_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id)
    ON DELETE SET NULL ON UPDATE CASCADE;      -- coupon can be deactivated later without invalidating the order

CREATE TABLE coupon_usage (
  id                          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  coupon_id                   BIGINT UNSIGNED NOT NULL,
  customer_id                 BIGINT UNSIGNED NOT NULL,
  order_id                    BIGINT UNSIGNED NULL,
  subscription_payment_id     BIGINT UNSIGNED NULL,
  discount_applied            DECIMAL(10,2) NOT NULL,
  used_at                     DATETIME NOT NULL,
  CONSTRAINT fk_coupon_usage_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,      -- usage-limit ledger must survive even if coupon later deactivated
  CONSTRAINT fk_coupon_usage_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_coupon_usage_order FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_coupon_usage_sub_payment FOREIGN KEY (subscription_payment_id) REFERENCES subscription_payments(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_coupon_usage_discount CHECK (discount_applied >= 0),
  INDEX idx_coupon_usage_coupon_customer (coupon_id, customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE invoices (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  invoice_number    VARCHAR(20) NOT NULL,
  customer_id       BIGINT UNSIGNED NOT NULL,
  provider_id       BIGINT UNSIGNED NOT NULL,
  reference_type    ENUM('order','subscription_payment') NOT NULL,
  reference_id      BIGINT UNSIGNED NOT NULL,
  subtotal          DECIMAL(12,2) NOT NULL,
  discount          DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax               DECIMAL(12,2) NOT NULL DEFAULT 0,
  total             DECIMAL(12,2) NOT NULL,
  payment_status    ENUM('paid','unpaid','refunded') NOT NULL,
  pdf_url           VARCHAR(255) NULL,
  issued_at         DATETIME NOT NULL,
  CONSTRAINT uq_invoices_number UNIQUE (invoice_number),
  CONSTRAINT fk_invoices_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,      -- legal/financial document of record
  CONSTRAINT fk_invoices_provider FOREIGN KEY (provider_id) REFERENCES providers(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_invoices_amounts CHECK (subtotal >= 0 AND discount >= 0 AND tax >= 0 AND total >= 0),
  INDEX idx_invoices_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- I.9 COMMUNICATION
-- ============================================================================

CREATE TABLE reviews (
  id                     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id            BIGINT UNSIGNED NOT NULL,
  provider_id            BIGINT UNSIGNED NOT NULL,
  reference_type         ENUM('order','subscription') NOT NULL,
  reference_id           BIGINT UNSIGNED NOT NULL,
  rating                 TINYINT UNSIGNED NOT NULL,
  comment                TEXT NULL,
  provider_reply         TEXT NULL,
  provider_replied_at    DATETIME NULL,
  moderation_status      ENUM('visible','hidden','reported') NOT NULL DEFAULT 'visible',
  created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,      -- preserve provider's rating history/audit trail
  CONSTRAINT fk_reviews_provider FOREIGN KEY (provider_id) REFERENCES providers(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT uq_reviews_customer_reference UNIQUE (customer_id, reference_type, reference_id),
  INDEX idx_reviews_provider (provider_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notifications (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id           BIGINT UNSIGNED NOT NULL,
  type              VARCHAR(50) NOT NULL,
  title             VARCHAR(150) NULL,
  body              VARCHAR(500) NULL,
  reference_type    VARCHAR(30) NULL,
  reference_id      BIGINT UNSIGNED NULL,
  is_read           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,       -- purely personal to the user, delete with the account
  INDEX idx_notifications_user_read_created (user_id, is_read, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE support_tickets (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ticket_code    VARCHAR(20) NOT NULL,
  user_id        BIGINT UNSIGNED NOT NULL,
  subject        VARCHAR(150) NOT NULL,
  category       ENUM('order','subscription','payment','kyc','other') NOT NULL,
  priority       ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  status         ENUM('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_support_tickets_code UNIQUE (ticket_code),
  CONSTRAINT fk_support_tickets_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,      -- keep support history for audit even if account later suspended
  INDEX idx_support_tickets_user (user_id),
  INDEX idx_support_tickets_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE support_messages (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ticket_id         BIGINT UNSIGNED NOT NULL,
  sender_id         BIGINT UNSIGNED NOT NULL,
  message           TEXT NOT NULL,
  attachment_url    VARCHAR(255) NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_support_messages_ticket FOREIGN KEY (ticket_id) REFERENCES support_tickets(id)
    ON DELETE CASCADE ON UPDATE CASCADE,       -- message has no meaning without its ticket
  CONSTRAINT fk_support_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_support_messages_ticket (ticket_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- I.10 SECURITY & CONFIG
-- ============================================================================

CREATE TABLE audit_logs (
  id                 BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id            BIGINT UNSIGNED NULL,
  action             VARCHAR(100) NOT NULL,
  entity_type        VARCHAR(50) NOT NULL,
  entity_id          BIGINT UNSIGNED NOT NULL,
  old_values_json    JSON NULL,
  new_values_json    JSON NULL,
  ip_address         VARCHAR(45) NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,      -- system actions may have no user; never lose the log row
  INDEX idx_audit_logs_entity (entity_type, entity_id),
  INDEX idx_audit_logs_user_created (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE commission_rules (
  id                    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  scope                 ENUM('global','category','service') NOT NULL,
  category_id           BIGINT UNSIGNED NULL,
  service_id            BIGINT UNSIGNED NULL,
  commission_percent    DECIMAL(5,2) NOT NULL,
  effective_from        DATETIME NOT NULL,
  effective_to          DATETIME NULL,
  created_by            BIGINT UNSIGNED NOT NULL,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_commission_rules_category FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE SET NULL ON UPDATE CASCADE,      -- historical rule row must survive category deletion
  CONSTRAINT fk_commission_rules_service FOREIGN KEY (service_id) REFERENCES services(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_commission_rules_creator FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_commission_rules_percent CHECK (commission_percent BETWEEN 0 AND 100),
  CONSTRAINT chk_commission_rules_scope CHECK (
    (scope = 'global' AND category_id IS NULL AND service_id IS NULL) OR
    (scope = 'category' AND category_id IS NOT NULL AND service_id IS NULL) OR
    (scope = 'service' AND service_id IS NOT NULL)
  ),
  INDEX idx_commission_rules_scope (scope, category_id, service_id, effective_from)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE platform_settings (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `key`         VARCHAR(100) NOT NULL,
  value         TEXT NOT NULL,
  updated_by    BIGINT UNSIGNED NULL,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_platform_settings_key UNIQUE (`key`),
  CONSTRAINT fk_platform_settings_updater FOREIGN KEY (updated_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- END OF SCHEMA — 31 tables created.
-- Run `SHOW ENGINE INNODB STATUS` / `SELECT * FROM information_schema.TABLE_CONSTRAINTS
-- WHERE CONSTRAINT_SCHEMA = DATABASE();` after migration to verify all FK/UNIQUE/CHECK
-- constraints listed in Section I of the Master Blueprint are present.
-- ============================================================================


ALTER TABLE providers ADD COLUMN latitude DECIMAL(10, 8) NULL;
ALTER TABLE providers ADD COLUMN longitude DECIMAL(11, 8) NULL;
ALTER TABLE providers ADD COLUMN service_radius_km DECIMAL(10, 2) NULL DEFAULT 10.00;