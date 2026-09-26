# Zero-Mock & Production-Ready Code Rule

Always produce real, fully functional, production-ready code. Never write mocks, stubs, fake data files, or simulated API calls.

## Rules:
1. **No Mocks or Fake Stubs**:
   - Never create or import files like `mockData.ts` or placeholder fixtures for application features.
   - Never use fake network delays (`setTimeout`) or hardcoded promise resolutions.
   - Never leave UI handlers as empty no-ops (`e.preventDefault()`).

2. **Complete Full-Stack Delivery**:
   - **Frontend**: Connect all components directly to backend APIs (`/api/...`) or Server Actions with proper loading, validation, and error states.
   - **Backend**: Implement robust Next.js API routes with real validation, status codes, authentication, and error handling.
   - **Database**: Use a real persistent database with formal schemas, relations, migrations, and database seeders. Every write must persist to the database and every read must query the database.
