# Survey Dispatch: Explorer 3 (Database Schema, Reviews/Ratings/Badges, Checkout/Bookings & Test Harness)

## Target
Investigate full-stack architecture for R3 (Reviews, Multi-Criteria Ratings, Explorer Badges) and R4 (Expedition Checkout, ACID Deposit Reservation, Booking Lifecycle), as well as existing tests.

## Key Investigation Items:
1. Examine database configuration and schema (`prisma/schema.prisma` or SQLite/Supabase/better-sqlite3 setup, migrations, seed data).
2. Examine existing models (User, Trail, Booking, Review, etc.). Check if reviews, badges, and payments/bookings are already partially defined or need schema extension.
3. Examine existing API route handlers (`src/app/api/...`), authentication (`/api/auth/...`, session handling, tokens/cookies), and admin/dashboard endpoints.
4. Examine `/dashboard` and `/admin` pages and how user badges and booking status transitions are displayed/managed.
5. Check pricing calculations (permits, taxes, deposit vs full payment, group pricing) and transaction handling.
6. Examine `tests/integration.test.mjs` and package.json test scripts. Run tests (mentally or note what they test) to understand pre-existing coverage and test runner setup.
7. Identify exact schema migrations, API routes, UI components, and test additions needed.
8. Review `c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\ORIGINAL_REQUEST.md` for R3, R4, and test criteria.

## Output
Write your comprehensive findings and recommendations to:
`c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\explorer_survey_3\handoff.md`
