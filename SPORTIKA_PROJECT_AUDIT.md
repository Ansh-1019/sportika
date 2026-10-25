

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

## 16. Visual portability and backend integrity phase

### Portable storefront media completed

- Replaced all remaining storefront and demo-catalog `/manus-storage/async-images/...` references with six optimized local WebP assets under `client/public/assets/sportika/`.
- Added an original wide hero campaign image with a dark left text-safe area and athletes on the right, plus dedicated portrait visuals for training tees, jerseys, running/track, women’s training, and footwear/accessories.
- Added ten homepage collection cards covering the requested product and audience groupings: Sports T-shirts, Jerseys, Training Wear, Shorts & Track Pants, Leggings & Bras, Hoodies & Tracksuits, Sports Shoes, Accessories, Men, and Women.
- Updated sports-discipline cards and supporting footwear/accessories panels to use relevant local imagery and descriptive alt text.
- Existing seeded demo products are refreshed to local assets only when the database record is marked `isDemo`; non-demo or user-managed product records are not overwritten.

### Backend integrity hardening completed

- Checkout now verifies that every conditional stock decrement affects exactly one row; otherwise the transaction fails and rolls back before creating an order or payment record.
- Added database-backed checkout tests for insufficient stock preservation, concurrent finite-stock consumption, and idempotent duplicate submission behavior.
- Public tRPC error mapping now replaces database, SQL, schema, constraint, connection, and deadlock details with a generic retry message while preserving deliberate business-validation messages.
- Added additive indexes for `(productId, position)` image ordering and `(productId, active, stock)` inventory lookup patterns.
- Applied migration `drizzle/0006_stormy_apocalypse.sql` to the existing local database without reset or data deletion.

### Verification

- `pnpm check`: passed.
- `pnpm test`: passed, 6 test files and 19 tests; database checkout integration tests are skipped without `DATABASE_URL`.
- Database-backed `server/checkout-integrity.test.ts`: passed, 2 tests.
- `pnpm build`: passed; existing Vite warning about the platform config script and chunk-size advisory remain non-blocking.
- Local development health: `{"status":"ok"}`.
- Direct routes `/`, `/collections/sale`, `/products/apex-dry-training-tee`, `/login`, and `/admin`: HTTP 200.
- All six local WebP assets: HTTP 200.
- Catalog API: 18 seeded demo products returned, all with local `/assets/sportika/` image URLs.
- Live preview verified for the homepage hero/collection layout and the Apex Dry Training Tee detail page.

Additional files from this phase:

- `client/public/assets/sportika/hero-campaign.webp`
- `client/public/assets/sportika/tee-training.webp`
- `client/public/assets/sportika/jersey.webp`
- `client/public/assets/sportika/shorts-track.webp`
- `client/public/assets/sportika/womens-training.webp`
- `client/public/assets/sportika/footwear-accessories.webp`
- `server/checkout-integrity.test.ts`
- `drizzle/0006_stormy_apocalypse.sql`
- Updated `client/src/pages/Home.tsx`, `shared/catalog.ts`, `server/store.ts`, `server/routers.ts`, and `drizzle/schema.ts`.
