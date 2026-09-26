# Phase 4 Survey & Architecture Report: Database, Reviews, Badges, Checkout & Test Harness (R3 & R4)

**Explorer**: Explorer 3  
**Working Directory**: `c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\explorer_survey_3`  
**Targets**: Requirements R3 (Reviews, Multi-Criteria Ratings, Explorer Badges) and R4 (Expedition Checkout, ACID Deposit Reservation, Booking Lifecycle), Database Schema & Test Harness.

---

## 1. Observation

### 1.1 Database Configuration & Storage Architecture
- **Engine**: The application uses Node.js 22+ built-in synchronous SQLite engine (`DatabaseSync` from `node:sqlite`) implemented in `src/lib/db.ts:1`.
- **Database File**: Located at `data/himalayan_trails.db` (file size ~872 KB, active WAL mode `himalayan_trails.db-wal` ~3 MB).
- **Vercel Serverless Resilience**: In `src/lib/db.ts:8-27`, if `process.env.VERCEL === '1'`, the database path falls back to `/tmp/himalayan_trails_data/himalayan_trails.db` and copies the bundled seed DB to `/tmp`.
- **Foreign Keys & Concurrency**: Configured in `src/lib/db.ts:36-40`:
  ```typescript
  _db.exec('PRAGMA journal_mode = WAL;');
  _db.exec('PRAGMA foreign_keys = ON;');
  ```
- **Safe Schema Migrations**: Column additions in `src/lib/db.ts:193-197` and `250-254` use defensive SQL try-catch blocks:
  ```typescript
  try {
    db.exec("ALTER TABLE contact_messages ADD COLUMN status TEXT DEFAULT 'UNREAD';");
  } catch { /* Column already exists */ }
  ```
- **Currently Initialized Tables (11 tables)**:
  `users`, `trails`, `landmarks`, `itineraries`, `stories`, `weather_reports`, `bookings`, `contact_messages`, `inquiries`, `shared_trails`, `ranges`.
- **Missing Tables in SQLite**:
  There is currently **NO `reviews` table** and **NO `user_badges` table** in `src/lib/db.ts`.

### 1.2 Supabase Schema Mirror
- In `src/lib/supabase/schema.sql`, there is a basic `public.reviews` table (lines 177-185):
  ```sql
  CREATE TABLE IF NOT EXISTS public.reviews (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      trail_id TEXT NOT NULL REFERENCES public.trails(id) ON DELETE CASCADE,
      author_name TEXT NOT NULL,
      country TEXT,
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      comment TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );
  ```
- This table only contains a single flat `rating INTEGER` and lacks multi-criteria columns (`difficulty_rating`, `scenic_rating`, `safety_rating`, `photo_urls`, `is_verified`, `user_id`).
- Supabase schema also lacks a `user_badges` table.

### 1.3 TypeScript Types & Domain Models
- Located in `src/types/index.ts`:
  - `Trail` (lines 1-25): contains `rating: number`, `reviewsCount: number`, `elevationProfile`, `routeCoordinates`.
  - `Booking` (lines 114-127):
    ```typescript
    export interface Booking {
      id: string;
      trailId: string;
      userId?: string;
      fullName: string;
      email: string;
      phone: string;
      startDate: string;
      travelers: number;
      specialRequests?: string;
      totalPrice: number;
      status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
      createdAt: string;
    }
    ```
    *Gaps*: Lacks `paymentOption` ('DEPOSIT' | 'FULL'), `depositAmount`, `remainingBalance`, `basePrice`, `permitFee`, `taxAmount`, `receiptNumber`, and status values `'EXPEDITION_ACTIVE'` and `'COMPLETED'`.
  - **No `Review` or `Badge` or `UserBadge` interface** exists in `src/types/index.ts`.

### 1.4 Authentication & Session Management
- In `src/lib/auth.ts`:
  - Cryptographic scrypt password hashing: `hashPassword(password)` (line 6) generates 16-byte random salt and 64-byte scrypt key stored as `salt:hex`.
  - Constant-time verification: `crypto.timingSafeEqual` in `verifyPassword` (line 21).
  - Session Tokens: `createSessionToken` (line 30) generates HMAC-SHA256 signed token with 7-day expiration.
  - Verification: `verifySessionToken` (line 46) parses and validates HMAC signature against `process.env.SESSION_SECRET`.
  - Session Transport: HTTP-only cookie `himalayan_auth_session` or `Authorization: Bearer <token>`.
  - User Retrieval: `/api/auth/me` returns `{ user }` or `{ user: null }`.

### 1.5 Booking & Checkout APIs and Current Gaps
- `src/app/api/bookings/route.ts`:
  - `POST` accepts `{ trailId, fullName, email, phone, startDate, travelers, specialRequests }`.
  - Sets hardcoded `basePricePerPerson = 850` (line 39) with fallback `travelers * basePricePerPerson`.
  - Does **NOT** extract authenticated user from cookie `himalayan_auth_session`.
  - Does **NOT** calculate permits, group discounts, or taxes.
  - Does **NOT** support deposit vs full payment options.
- `src/app/api/user/bookings/route.ts`:
  - `GET` requires `himalayan_auth_session` cookie, verifies session token, queries `getBookingsByUserId(session.userId)` joining `trails.name` and `trails.slug`.
- `src/app/api/admin/bookings/[id]/route.ts`:
  - `PATCH` updates booking status.
  - `DELETE` removes booking.

### 1.6 UI Pages: Trail Detail, Dashboard & Admin
- **Trail Detail Page** (`src/app/trails/[id]/page.tsx`):
  - Shows trail details, stats, day-by-day itinerary, highlights, and inclusions/exclusions.
  - Right sidebar currently has an "Instant Inquiry Form" (`submitTrekInquiry` server action).
  - **Missing**: No review submission form, no dynamic rating breakdown bars, no direct "Book / Checkout" button.
- **Trekker Dashboard** (`src/app/dashboard/page.tsx`):
  - Displays Total Expeditions, Active Bookings, Total Expedition Value, and Booking Cards with "Print Voucher".
  - **Missing**: No Explorer Badges section displaying unlocked achievements (e.g. "Everest Pioneer", "Annapurna Master").
- **Admin Studio** (`src/app/admin/page.tsx`):
  - Booking status dropdown (lines 821-824) currently provides `<option value="CONFIRMED">`, `<option value="EXPEDITION_ACTIVE">`, `<option value="COMPLETED">`, `<option value="CANCELLED">`.
  - **Missing**: `<option value="PENDING">` is absent from the select options. No Reviews moderation view.

### 1.7 Existing Test Harness & Pre-Flight Status
- Running `npm test` runs Node test runner: `node --test tests/**/*.test.mjs`.
- File: `tests/integration.test.mjs` contains **10 test suites and 30 tests**.
- **Execution Result**: All 30 tests pass cleanly in ~371 ms (zero failures).
- Running `npx tsc --noEmit`: Exits with code 0 (zero TypeScript errors).
- Running `npm run health-check`: Exits with code 0, reporting all 11 tables and healthy DB status.

---

## 2. Logic Chain

### 2.1 Database Schema Extensions (R3 & R4)
1. **Observation**: SQLite is the primary persistent engine; `DatabaseSync` executes directly in process; `initializeSchema` runs on startup and handles existing tables safely.
2. **Inference**: Adding `reviews` and `user_badges` tables and altering `bookings` columns must be done defensively inside `initializeSchema(db)` in `src/lib/db.ts` using `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ... ADD COLUMN` wrapped in try-catch.
3. **Review Schema Design**:
   - `id TEXT PRIMARY KEY` (`rev_<timestamp>_<rand>`)
   - `trail_id TEXT NOT NULL REFERENCES trails(id) ON DELETE CASCADE`
   - `user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE`
   - `user_name TEXT NOT NULL`
   - `user_email TEXT NOT NULL`
   - `user_avatar TEXT`
   - `overall_rating REAL NOT NULL` (1 to 5)
   - `difficulty_rating INTEGER NOT NULL` (1 to 5)
   - `scenic_rating INTEGER NOT NULL` (1 to 5)
   - `safety_rating INTEGER NOT NULL` (1 to 5)
   - `comment TEXT NOT NULL`
   - `photos_json TEXT` (JSON array of photo URLs)
   - `is_verified INTEGER NOT NULL DEFAULT 0` (1 if user has booking for this trail)
   - `created_at TEXT NOT NULL`
4. **Explorer Badges Schema Design**:
   - `user_badges` table:
     - `id TEXT PRIMARY KEY` (`ubg_<timestamp>_<rand>`)
     - `user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE`
     - `badge_id TEXT NOT NULL`
     - `badge_name TEXT NOT NULL`
     - `badge_description TEXT NOT NULL`
     - `badge_icon TEXT NOT NULL`
     - `unlocked_at TEXT NOT NULL`
     - `UNIQUE(user_id, badge_id)`
5. **Booking Schema Extensions**:
   - Add columns to `bookings` table via migration:
     - `payment_option TEXT DEFAULT 'FULL'` ('DEPOSIT' or 'FULL')
     - `deposit_amount REAL DEFAULT 0`
     - `remaining_balance REAL DEFAULT 0`
     - `base_price REAL DEFAULT 0`
     - `permit_fee REAL DEFAULT 0`
     - `tax_amount REAL DEFAULT 0`
     - `receipt_number TEXT`
     - `invoice_breakdown TEXT` (JSON string)

### 2.2 Dynamic Aggregate Rating Recalculation (R3)
1. **Observation**: `trails` table stores `rating REAL` and `reviews_count INTEGER`.
2. **Reasoning**: When a review is inserted into `reviews`:
   - Compute `SELECT COUNT(*) as count, AVG(overall_rating) as avg_rating FROM reviews WHERE trail_id = ?`.
   - Execute `UPDATE trails SET rating = ROUND(avg_rating, 1), reviews_count = count WHERE id = ?`.
   - Also compute multi-criteria averages and distribution (5, 4, 3, 2, 1 stars) in a dedicated query function `getTrailReviews(trailId)`.
3. **Verification Criterion**: Submitting a review immediately updates the trail's average rating and total count in SQLite.

### 2.3 Explorer Badge Unlocking Rules (R3)
1. **Observation**: Badges must unlock when users complete bookings or submit verified reviews, and display on `/dashboard`.
2. **Badge Definitions**:
   - `everest_pioneer`: "Everest Pioneer" — Completed booking or verified review for Everest/Khumbu trails.
   - `annapurna_master`: "Annapurna Master" — Completed booking or verified review for Annapurna Circuit trails.
   - `manaslu_explorer`: "Manaslu Explorer" — Completed booking or verified review for Manaslu trails.
   - `high_altitude_legend`: "High Altitude Legend" — Completed booking or review for trails over 5,000m (EBC, Annapurna, Manaslu, Rolwaling).
   - `trail_blazer`: "Trail Blazer" — Submitted their first verified trail review.
   - `safety_sentinel`: "Safety Sentinel" — Submitted review providing safety & mountain condition ratings.
   - `expedition_veteran`: "Expedition Veteran" — Booked 2 or more expeditions.
3. **Trigger Points**:
   - On review creation: Check review criteria, award "Trail Blazer", "Safety Sentinel", and region badge.
   - On booking confirmation or status transition to `COMPLETED`: Award region badge, "High Altitude Legend", or "Expedition Veteran".

### 2.4 Expedition Checkout Pricing & ACID Transaction (R4)
1. **Observation**: Acceptance criteria mandates:
   - Date validation
   - Group pricing calculation
   - Regional permit fees
   - 13% taxes
   - Deposit (25%) vs full-payment (100%) options
   - ACID transaction persistence
   - Downloadable/printable receipt confirmation
2. **Exact Server-Side Pricing Rules**:
   - **Base Fare**: Derived from trail duration and baseline daily cost ($95/day) or itinerary estimated USD, e.g. 14 days = $1,330 base per person.
   - **Group Discounts**:
     - 1 person: 0% discount
     - 2–3 people: 5% discount on base fare
     - 4–6 people: 10% discount on base fare
     - 7+ people: 15% discount on base fare
   - **Regional Permit Fees** (per person):
     - *Everest*: Sagarmatha National Park ($30) + Khumbu Pasang Lhamu ($20) = $50
     - *Annapurna*: ACAP ($30) + TIMS ($20) = $50
     - *Langtang*: Langtang National Park ($30) + TIMS ($20) = $50
     - *Manaslu*: Manaslu Restricted Area Permit (RAP) ($100) + MCAP ($30) + ACAP ($30) = $160
     - *Mustang*: Upper Mustang Special Restricted Area Permit ($500) + ACAP ($30) = $530
     - *Rolwaling*: GCAP ($30) + TIMS ($20) = $50
   - **Taxes**: 13% Nepal Government Tourism VAT on (discounted base fare + permit fees).
   - **Total Expedition Price** = Discounted Base Fare + Permit Fees + 13% VAT.
   - **Deposit Calculation**:
     - `paymentOption === 'DEPOSIT'`: Deposit is 25% of Total Price (rounded). `remainingBalance = Total Price - Deposit`.
     - `paymentOption === 'FULL'`: Deposit is Total Price. `remainingBalance = 0`.
3. **ACID Transaction**:
   - Handled inside `createCheckoutBooking` in `src/lib/db.ts`:
     ```typescript
     db.exec('BEGIN TRANSACTION;');
     try {
       // Insert into bookings with receipt_number, deposit_amount, remaining_balance, status 'CONFIRMED'
       // Insert or evaluate badges
       db.exec('COMMIT;');
     } catch (err) {
       db.exec('ROLLBACK;');
       throw err;
     }
     ```

---

## 3. Caveats

1. **Third-Party Payment Gateways**: In accordance with the Zero-Mock standard, we do not integrate fake Stripe/PayPal simulator keys; rather, we implement genuine persistent backend ACID checkout transactions, real receipts, deposit/balance accounting, and server-side verification.
2. **Photo File Uploads**: For review photos, we support genuine image URL inputs (as currently supported across landmarks, stories, and trails) rather than setting up an external S3/Blob storage bucket that could fail without cloud credentials.
3. **Session Consistency**: Review submissions and user dashboard badges require authenticated users. Unauthenticated visitors must be prompted to log in or register before submitting reviews.

---

## 4. Conclusion & Concrete Implementation Roadmap

### 4.1 Required Database & Schema Additions (`src/lib/db.ts` & `src/lib/supabase/schema.sql`)
1. **In `src/lib/db.ts`**:
   - Add `CREATE TABLE IF NOT EXISTS reviews` with multi-criteria rating columns.
   - Add `CREATE TABLE IF NOT EXISTS user_badges` with `UNIQUE(user_id, badge_id)`.
   - Add migration `ALTER TABLE bookings ADD COLUMN ...` for `payment_option`, `deposit_amount`, `remaining_balance`, `base_price`, `permit_fee`, `tax_amount`, `receipt_number`, `invoice_breakdown`.
   - Add data access functions:
     - `createReview(...)`: validates ratings 1-5, inserts review, updates `trails.rating` and `trails.reviews_count`, evaluates badges.
     - `getTrailReviews(trailId: string)`: returns reviews, multi-criteria averages (difficulty, scenic, safety), and star breakdown percentages.
     - `getUserBadges(userId: string)`: returns unlocked badges for user profile.
     - `evaluateUserBadges(userId: string)`: checks bookings and reviews, awards any newly unlocked badges into `user_badges`.
     - `createCheckoutBooking(...)`: executes ACID transaction for checkout with deposit/full options, invoice breakdown, and receipt number.
2. **In `src/types/index.ts`**:
   - Add `Review`, `ReviewStats`, `RatingBreakdown`, `Badge`, `UserBadge`, `CheckoutRequest`, `InvoiceBreakdown`.
   - Extend `Booking` type with payment option and invoice fields.
3. **In `src/lib/supabase/schema.sql`**:
   - Update `reviews` table definition with multi-criteria columns.
   - Add `user_badges` table and RLS policies.
   - Update `bookings` table definition and status check constraint.

### 4.2 Required API Route Handlers (`src/app/api/...`)
1. **`src/app/api/reviews/route.ts`**:
   - `GET`: query reviews by `trailId`, returns reviews + breakdown + sub-criteria averages.
   - `POST`: authenticated endpoint (`himalayan_auth_session`), validates review, persists to SQLite, triggers dynamic trail score recalculation and badge evaluation, returns 201 Created.
2. **`src/app/api/user/badges/route.ts`**:
   - `GET`: authenticated endpoint returning user's unlocked badges and progress.
3. **`src/app/api/checkout/route.ts`**:
   - `POST`: validates expedition dates, party size, calculates permit fees by region, group discounts, 13% VAT, executes ACID transaction, persists booking with deposit or full payment, returns 201 Created with invoice breakdown and receipt.
4. **`src/app/api/admin/bookings/[id]/route.ts`**:
   - Ensure support for all 5 lifecycle statuses: `'PENDING'`, `'CONFIRMED'`, `'EXPEDITION_ACTIVE'`, `'COMPLETED'`, `'CANCELLED'`.
   - When transitioning to `'COMPLETED'`, trigger `evaluateUserBadges(booking.userId)`.

### 4.3 Required Frontend UI Components & Pages
1. **`src/components/reviews/TrailReviewsSection.tsx`**:
   - HeroUI-styled frosted glass component (`data-slot="base"`, `data-slot="header"`, `data-slot="content"`).
   - Dynamic aggregate rating score card with 5-star distribution progress bars.
   - Multi-criteria radar/metric badges: Scenic Beauty (1-5), Trail Difficulty (1-5), Safety & Conditions (1-5).
   - "Write a Verified Review" modal/drawer with interactive star ratings and photo links.
   - "Verified Adventurer" checkmark badge on reviews by confirmed trekkers.
2. **`src/app/trails/[id]/page.tsx`**:
   - Integrate `TrailReviewsSection`.
   - Add "Instant Checkout & Reserve" CTA button linking to `/checkout?trail=${trail.slug}` alongside the custom inquiry form.
3. **`src/app/checkout/page.tsx`**:
   - New dedicated checkout page with live price calculator, group discount indicator, regional permit breakdown, 13% VAT, deposit (25%) vs full payment toggle, and printable receipt confirmation.
4. **`src/app/dashboard/page.tsx`**:
   - Add "Explorer Badges & Mountain Honors" section showcasing badges with gold `#B68D40` borders and unlock timestamps.
   - Update booking cards to display Deposit Paid, Remaining Balance Due, and status badges.
5. **`src/app/admin/page.tsx`**:
   - Update booking status selector to include `<option value="PENDING">`.
   - Display payment option, deposit amount, and remaining balance.

### 4.4 Required Test Suite Additions (`tests/integration.test.mjs`)
Add 3 new test suites to `tests/integration.test.mjs`:
1. **Suite 11: Phase 4 Reviews, Multi-Criteria Ratings & Dynamic Aggregate Scores (R3)**:
   - Verifies `reviews` table schema exists with multi-criteria columns.
   - Tests submitting a review persists to SQLite.
   - Tests that trail average rating and review count recalculate automatically.
   - Tests validation rejecting blank reviews or invalid rating ranges.
2. **Suite 12: Phase 4 Explorer Badges & Achievement System (R3)**:
   - Verifies `user_badges` table schema exists.
   - Tests badge unlocking when completing bookings or submitting reviews.
   - Tests query returning user's earned badges.
3. **Suite 13: Phase 4 Expedition Checkout, ACID Deposit Reservation & Lifecycle (R4)**:
   - Tests pricing engine (group discount, region permit calculation, 13% tax).
   - Tests ACID transaction for deposit payment option and balance accounting.
   - Tests full booking lifecycle status transitions (`PENDING` -> `CONFIRMED` -> `EXPEDITION_ACTIVE` -> `COMPLETED`).
   - Tests receipt generation and invoice breakdown structure.

---

## 5. Verification Method

### Step 1: Pre-Flight TypeScript Check
```bash
npx tsc --noEmit
```
*Expected*: 0 errors.

### Step 2: Automated Integration Test Execution
```bash
npm test
```
*Expected*: All test suites pass cleanly with 100% success rate (including new Phase 4 suites 11, 12, and 13).

### Step 3: Production Build Verification
```bash
npm run build
```
*Expected*: Zero build errors, all Next.js App Router routes compiled cleanly.

### Step 4: Health Check Script
```bash
npm run health-check
```
*Expected*: Health check passes, reporting healthy DB with all tables (including `reviews` and `user_badges`).

### Step 5: End-to-End Operational Verification
1. User logs in at `/login`.
2. User visits `/trails/everest-base-camp`, navigates to `/checkout?trail=everest-base-camp`.
3. User selects party of 2, sees 5% group discount, $50/person permit fee, 13% VAT, selects 25% Deposit option.
4. User clicks "Confirm Reservation": booking is saved with receipt reference `REC-...`, deposit amount, and remaining balance.
5. User visits `/dashboard`: sees new booking with deposit details and "CONFIRMED" badge.
6. User leaves a 5-star multi-criteria review on `/trails/everest-base-camp`: trail rating updates dynamically; "Trail Blazer" and "Everest Pioneer" badges unlock and appear on `/dashboard`.
7. Admin visits `/admin`, switches booking status to `EXPEDITION_ACTIVE` then `COMPLETED`: reflects in user dashboard.
