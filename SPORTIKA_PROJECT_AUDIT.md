

## 15. Post-audit phase: authentication hardening and Selected Offers refinement

This section records the incremental work completed after the initial audit.

### Authentication security hardening completed

- Added bounded server-side fixed-window rate limiting for local registration and login.
- Registration limits are applied by socket address and normalized email identity.
- Login limits are applied by socket address and normalized email identity.
- Repeated requests receive a `429`-style tRPC `TOO_MANY_REQUESTS` error and a `Retry-After` response header.
- The implementation deliberately uses the server socket address rather than trusting a client-supplied `X-Forwarded-For` header.
- Successful login clears the email identity limiter while preserving the IP-level protection.
- Added `users.sessionVersion` with an additive migration.
- Newly issued local and Manus sessions carry the current session version.
- Logout increments the persisted session version and clears the browser cookie.
- Existing version-zero sessions continue to work until logout; tokens issued before a later version bump are rejected by protected APIs.
- Password recovery remains disabled because there is still no email/reset-token service.

The rate limiter is process-local. It is suitable for the current single-process development runtime, but a production multi-instance deployment should move counters to a shared store such as Redis or an equivalent managed rate-limiting service.

### Selected Offers changes completed

- Removed the visible Availability control from the collection UI.
- Retained Gender, Size, Color when more than one structured color facet exists, Sport / Activity, Product Type, Min Price, and Max Price.
- Removed Availability from client filter state and active-filter chips while leaving server-side stock validation intact.
- Strengthened sale eligibility to require `originalPrice > price` and at least one active in-stock variant.
- Preserved server-side forced in-stock behavior for `/collections/sale`.
- Added unit coverage for markdown eligibility and forced sale availability.
- Added a database-backed regression test covering combined sale filters and an impossible filter returning zero results.

### Additional phase verification

- `pnpm check`: passed.
- `pnpm test`: passed, 6 test files and 19 tests; the database-backed catalog test is skipped when the test runner has no `DATABASE_URL`.
- Database-backed `server/catalog-filters.test.ts` with the existing local database environment: passed, 3 tests.
- `pnpm build`: passed.
- Live Selected Offers page: verified in the preview; no Availability control is visible.
- Old session cookie after logout against protected `account.orders`: HTTP 401.
- Anonymous admin API: HTTP 403.

Additional files from this phase:

- `server/rate-limit.ts`
- `server/rate-limit.test.ts`
- `server/catalog-filters.test.ts`
- `drizzle/0005_youthful_ultimates.sql`
- `drizzle/meta/0005_snapshot.json`
- Updated `server/_core/sdk.ts`, `server/_core/oauth.ts`, `server/db.ts`, `server/routers.ts`, `drizzle/schema.ts`, `server/store.ts`, and `client/src/pages/Collection.tsx`.
