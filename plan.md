# SPORTIKA implementation and design plan

## Product and implementation approach

SPORTIKA will be a clothing-first sportswear storefront on the initialized Manus Webdev stack: React 19, TypeScript, Vite, Tailwind CSS, Express, tRPC, Drizzle ORM, and the managed MySQL-compatible database. The storefront will use reusable route templates for collections, product detail, support pages, accounts, and administration. Catalog queries, server-side price/stock checks, cart mutations, newsletter signups, and demo order creation will be exposed through typed tRPC procedures. Database-backed catalog and order records will distinguish demonstration inventory and simulated payment status from verified commercial information.

The first client-demonstration build will prioritize a coherent end-to-end customer journey: clothing-forward homepage and navigation; searchable, filterable, sortable collections; product galleries and independent variants; a persistent guest cart and wishlist; address validation; configured flat/free-threshold shipping; and an explicitly labelled demo checkout that creates an unpaid/demo order without representing a real gateway charge. It will also provide database-backed customer/order and newsletter records, a protected admin surface for core catalog/inventory/order tasks, and working policy/support pages. The remaining requested account, return, refund, analytics, campaign, category and coupon capabilities will be implemented where supported by the available configuration; payment-provider, email-delivery, carrier, legal, domain, and administrator-account configuration will be documented rather than represented as active integrations.

Manus OAuth is the default account provider because no alternative was specified. Customer access will use the starter's validated application session and user identity, with server-side ownership checks. Admin procedures will check the persisted role on the server; the starter's owner identity promotion will be retained. Do not introduce a fake login or bypass authorization for Preview. The managed database is shared between development and published service, so migrations and seed behavior must be additive/idempotent, avoid destructive operations, and preserve operator edits. Never include payment secrets in the browser. Without verified gateway configuration, demo orders must carry an unmistakable demo/pending status and must not count as confirmed paid revenue.

## Project structure

- `client/src/App.tsx`: route table and global providers.
- `client/src/components/`: shared storefront shell, navigation, footer, product cards, filters, cart controls and accessible dialogs.
- `client/src/pages/`: homepage, collection/search/product templates, cart/checkout/confirmation, account/admin surfaces and support/legal content.
- `client/src/lib/`: typed tRPC client and shared client utilities.
- `client/src/index.css`: brand tokens, typography, layout primitives, responsive and reduced-motion rules.
- `server/routers.ts`: typed API routers and server-side validation/authorization.
- `server/db.ts`: managed DB connection and catalog/cart/order queries.
- `drizzle/schema.ts` and `drizzle/`: relational domain schema and committed migrations.
- `shared/`: shared route/product types and constants.
- `public/`: route manifest, favicon, sitemap/robots resources and other small static assets.
- `plan.md` and `TODO.md`: approved implementation/design decisions and outcome status.

## Design system

**Design movement:** contemporary performance-editorial retail: athletic campaign photography, Swiss-inspired typography and sharply cut retail modules.

**Core principles:** clothing leads every merchandising decision; editorial impact is balanced with fast product scanning; electric-lime accents signal action rather than decoration; every interactive state is legible and keyboard reachable.

**Color philosophy:** charcoal and warm white create a confident, premium foundation. Electric lime is the ownable SPORTIKA signal for key actions, price/availability emphasis and motion marks; gray neutrals keep catalog information calm and readable.

**Layout paradigm:** an editorial, asymmetrical storefront with a wide campaign canvas, offset collection cards, horizontal product rails and compact product-information columns. Collection discovery can use responsive grids, but surrounding pages should avoid repetitive centered-template composition.

**Signature elements:** a forward-leaning cut/chevron motion mark; lime micro-bars and angular section labels; large condensed uppercase campaign headlines paired with quiet product metadata.

**Interaction philosophy:** direct and quick, with useful feedback. Quick-add confirms the exact variant; stock limits and demo-payment status are explicit; drawers and dialogs remain dismissible and keyboard accessible.

**Animation:** brief, restrained reveals and hover shifts only; honor `prefers-reduced-motion`; no motion that delays navigation, hides content or makes prices/status hard to read.

**Typography:** use a condensed athletic display face for headlines and a highly legible sans-serif for body, labels and product metadata, with a reliable system fallback. Display type is uppercase and tightly tracked; body copy remains sentence case and comfortably sized.

**Brand essence:** accessible performance sportswear for training, sport and everyday movement, distinguished by clothing-first merchandising and energetic editorial presentation. Personality: bold, agile, focused.

**Brand voice:** short, direct, movement-oriented. Examples: “BUILT TO MOVE. MADE TO PERFORM.” and “YOUR GAME. YOUR GEAR.”

**Wordmark and logo:** custom SVG construction with a compact forward-motion chevron/stripe motif integrated with a geometric SPORTIKA wordmark; provide horizontal, compact and inverse variants without borrowing competitor trade dress.

**Signature brand color:** electric lime, used sparingly against charcoal and warm white.

## External configuration and material constraints

Managed database, server and project preview are enabled. Authentication requires the Manus OAuth callback/session contract; embedded HTTPS Preview requires the starter's fixed session cookie name and `SameSite=None; Secure`. The app must use relative browser URLs because Preview is proxied. Razorpay, COD, email delivery and shipping-carrier credentials/services are not configured, so only an explicitly simulated demo checkout and honest configured shipping rules may be shown. Product and campaign imagery unavailable from a supplier will be marked demonstration content and replaceable. The demo must not imply legal, fulfillment, stock, review, discount, payment or service claims that have not been configured.

## Serving and delivery

The Express server serves the Vite application and `/api/*` typed procedures on the initialized port 3000, with `/api/health` retained for readiness. The public static `/manus-routes.json` manifest will list all implemented page patterns. The existing container deployment defaults will be reused if publication is later authorized; building a preview is not equivalent to publishing or production readiness. Before delivery, document required production setup for an admin identity, gateway/webhooks, transactional email, shipping provider/serviceability, supplier imagery and stock, policies, domain, and business/legal settings.


## Reference observations

The supplied reference [inflashnow.in](https://inflashnow.in/) was reviewed for general structure: gender-based collection entry points, product collection sliders, trending/limited-edition grouping, FAQ and support/policy links, newsletter signup, wishlist/account/cart entry points, and a cart summary with quantity, coupon, shipping estimate and checkout. SPORTIKA uses these only as general e-commerce conventions; it does not reuse the reference identity, copy, product names, images, offers or proprietary content.


## Existing-site improvement follow-up (2026-10-25)

This follow-up is an incremental refinement, not a rebuild. Keep the existing React/TypeScript/Vite/Tailwind, Express/tRPC, Drizzle/MySQL, data model, routes, shared storefront shell, central catalog, cart provider, product gallery, and generated project imagery. No new framework, dependency, migration, live integration, payment, supplier order, or fulfillment service is required.

The main functional change is to split the existing checkout into the brief's five visible stages: Contact, Delivery address, Delivery/order review, Demo completion (no real payment credentials), and successful Order confirmation. Preserve the existing server-backed quote, form data, cart, idempotency fingerprint, demo-pending order state, and success redirect. The fifth stage is the existing `/order-confirmation/:orderId` destination and must identify a recorded session order before rendering success. Do not submit a demo order as a test because development and production share the managed database.

Make small storefront changes only where they directly improve the supplied brief: expose clear Shop Men/Shop Women/Explore Training Wear paths without adding a banner pile; keep the existing apparel-led sections and unbranded campaign photography; disable a color choice only when all of its variants are out of stock and make selected states accessible; keep existing category query/filter behavior and description/category-aware search. Remove the newsletter capture form from the footer while transactional email is unavailable rather than collecting an address into a list that cannot send; retain its backend/admin support for later authorized activation. Keep the current footer policies and clearly labelled business/search placeholders.

Use the current user-flow APIs and sample catalog; preserve server price/stock validation and avoid test writes. Validate with current type/unit/build checks, preview route/health and asset responses, screenshots at desktop/tablet/mobile, and read-only browser interactions including catalog, variants, cart and stages 1–4 of checkout. Review the order success gate in code; do not assert a real recorded-order success test without a safe isolated database. No route changes are planned, but keep `/manus-routes.json` checked against actual routing.

## Filter, account, authentication and admin refinement (2026-10-25)

This is another targeted follow-up to the existing React/Vite, Express/tRPC, Drizzle/MySQL storefront. Keep the current collection/product/cart/checkout and the existing protected `/admin` UI/API; do not create a duplicate storefront, auth system, or data model. Existing structured variant rows have real color/size/stock values, so retain color filtering but derive its choices from structured catalog variants rather than descriptions or an invented color list.

On `/collections/sale`, remove the visible Availability control only; default the offers query to products with at least one active, in-stock variant and preserve server-side cart/checkout stock validation. Keep Gender, Size, Sport/Activity, Product Type, Min Price, Max Price, sorting, combined catalog predicates, result count, clear-all and the existing design. Expose structured filters from real records; reject negative/invalid prices and `min > max` clearly without presenting stale results. Keep sale-collection filters in client state through sorting/pagination and preserve query parameters where the current route already supplies them.

Authentication remains the configured Manus OAuth/session contract, with the fixed `webdev_app_session` cookie, CSRF-bound OAuth state, server-resolved user identity and persistent user role. Add clear customer `/login` and `/signup` entry points that both route through OAuth (account registration follows successful provider authorization); do not collect/store a SPORTIKA password or offer fake email verification. Passwords and password recovery/reset are controlled by Manus, not this application's auth API, so explain that provider-owned boundary rather than claim a local reset flow. Keep logout a real session-clearing mutation. Add profile-display-name editing for the signed-in user's own account by reusing the existing nullable `users.name` column; update the OAuth upsert to fill missing names without overwriting a customer's non-null application display name. Preserve guest checkout and guest cart.

Extend the already server-protected `/admin` experience rather than replacing it. Use real DB counts for products and registered customers alongside existing order/pending/paid-revenue/low-stock metrics; add authorized searchable, minimal customer records without secrets. Retain existing admin product create/edit/archive/restore, structured variant/stock updates, offer pricing, image storage, order/status/tracking and settings APIs; expose and validate their working management path in the UI, including clear confirmation before archive. Selected Offers membership is controlled by a valid structured sale price/original price, not text. Never grant admin by submitted email or client role, expose private admin/customer details to guests, fabricate analytics/history, or represent demo orders as paid. Manus OAuth for the project owner is the established administrator provisioning path; other customer OAuth identities remain customers unless an already-authorized server-side operator promotes their role.

**Project structure:** `client/src/pages/Collection.tsx` owns the offer filter controls; `client/src/App.tsx` and `/manus-routes.json` own login/registration/provider-boundary routes; `client/src/pages/Info.tsx` owns the signed-in profile form; `client/src/pages/Admin.tsx` owns the protected customer/product/order surfaces; `server/routers.ts` owns validated protected tRPC APIs; `server/store.ts` and `server/db.ts` own real catalog/customer/profile queries and mutations; `drizzle/schema.ts` remains unchanged because the existing `users.name` column can safely hold the display name. Retain existing brand styles in `client/src/store.css` and document auth-provider limitations and owner-admin setup in `docs/production-setup.md`.

**Data and validation constraints:** development and publication share one managed database. Avoid schema migration/DDL if the existing profile column supports the outcome; never delete/reset/seed demo orders as tests, and do not create real customer/order records for verification. Use unit/contract checks and read-only Preview interactions for filters/navigation and route access; OAuth end-to-end is credential/provider-dependent, and the positive email/password, email-verification, local password-reset cases are intentionally out of scope because Manus OAuth owns those credentials. Refresh the synchronized development service if project configuration changes, keep relative browser URLs and existing embedded-Preview secure-cookie behavior, and checkpoint code to canonical `main` without publishing unless separately asked.
