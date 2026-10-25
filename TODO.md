# SPORTIKA outcome tracker

Implementation status is evidence-based. The accepted project brief remains the source of truth; production-only prerequisites are called out explicitly rather than represented as active integrations.

## [x] 1. Brand identity, visual system, and responsive navigation

- Position SPORTIKA as modern sports apparel, training clothing, athletic footwear, and sports accessories; personality is athletic, energetic, bold, modern, performance-oriented, accessible, and professional.
- Use an original custom SPORTIKA wordmark/logo with bold modern athletic typography and a subtle motion-inspired symbol/custom letterform; maintain small-size legibility; provide horizontal header and compact mobile/favicon versions, light/dark contrast variants, and vector SVG where possible. Do not imitate Nike, Adidas, Puma, or another brand. Integrate the mark in header, footer, mobile navigation, and favicon.
- Use black/deep charcoal, white/warm off-white, electric lime, and neutral grays; bold athletic display type, clean sans-serif body, strong hierarchy, generous spacing, and restrained animation for a premium sports-retail identity rather than a generic template.
- Include SPORTIKA, Men, Women, Jerseys, Training Wear, Sports Shoes, Accessories, New Arrivals, Sale, Search, Account, Wishlist, and a cart with live item count. Use a sticky desktop header, accessible collection menus, and a responsive mobile drawer. Keep browser favicon separate from platform project-logo metadata.

## [x] 2. Clothing-first homepage and campaign merchandising

- Clothing is the primary focus: sports T-shirts, jerseys, training tops, sports polos, running/training shorts, track pants, sports leggings, sports bras, hoodies, tracksuits, training jackets, and men's/women's performance clothing are prominently merchandised. Secondary discoverable products include running/training/walking/court shoes, gym bags, sports socks, caps, water bottles, and training accessories; shoes and accessories occupy less visual space.
- Display configurable promotional copy, for example “TRAIN HARD. MOVE FREELY. WEAR SPORTIKA.” Only display real configured offers and shipping promises.
- Hero headline: “BUILT TO MOVE. MADE TO PERFORM.” Supporting copy: “Discover performance-driven sportswear designed for training, competition, and everyday movement.” Provide working primary CTA “SHOP SPORTSWEAR” and secondary CTA “EXPLORE NEW ARRIVALS.” Use high-quality sports-apparel photography with athletes wearing apparel; apparel is visually prominent.
- Include image-led cards for Sports T-shirts, Jerseys, Training Wear, Shorts and Track Pants, Leggings and Sports Bras, and Hoodies and Tracksuits; show six to eight featured products with functional controls; include clothing campaign “YOUR GAME. YOUR GEAR.” with curated collection links; show recently added apparel with working product links.
- Provide sport-based discovery for running, gym, football, basketball, badminton, and outdoor training, emphasizing clothing used for each sport; show a compact sports-shoe collection with a shoe-shopping link; show a smaller gym-bag/socks/caps/water-bottle/training-accessory section.
- Include brand story, configurable trust/service benefits, newsletter signup, and footer support, policies, social links, and category navigation.

## [x] 3. Structured page routes and navigation destinations

- Provide clean consistent routes (or framework-equivalent dynamic routes) for public `/`, `/collections`, `/collections/men`, `/collections/women`, `/collections/jerseys`, `/collections/training-wear`, `/collections/shorts-track-pants`, `/collections/shoes`, `/collections/accessories`, `/collections/new-arrivals`, `/collections/sale`, `/products/[slug]`, `/search`, `/cart`, `/checkout`, `/order-confirmation/[orderId]`, `/about`, `/contact`, `/faq`, `/shipping-policy`, `/return-policy`, `/privacy-policy`, and `/terms`;
- Provide customer `/account`, `/account/orders`, `/account/addresses`, `/account/wishlist`; admin `/admin`, `/admin/products`, `/admin/categories`, `/admin/inventory`, `/admin/orders`, `/admin/customers`, `/admin/coupons`, `/admin/analytics`, `/admin/settings`.
- Use reusable dynamic templates instead of duplicate hardcoded pages; use appropriate redirects where needed. All major navigation links lead to real pages or meaningful, clearly labelled placeholders. The public route manifest is valid JSON, contains the page patterns (not API/assets/404 routes), is served from the site origin, and remains synchronized with routes.

## [x] 4. Database-backed collections, filters, sorting, and search

- Each reusable collection page includes collection title and description, breadcrumbs, product count, responsive product grid, category-specific filters, sorting controls, active filter chips, clear-all, pagination or load-more, plus appropriate empty and loading states.
- Filters operate on actual database product data: category; gender/intended audience where relevant; size; color; price range; availability; sport/activity; and product type. Sorting supports featured, newest, price low-to-high, price high-to-low, and best-selling only when actual paid sales data exists. Do not fabricate bestseller rankings.
- Product search matches product name, category name/slug, and relevant product attributes; provide suggestions where feasible, clear-search, no-results state, and working links to matches. Search was checked against a category-slug-only term after the reviewer identified category matching as missing.
- Product cards show correct image, product name, current price, original price only when applicable, genuine configured discount badge where applicable, color swatches, available sizes where appropriate, wishlist control, Quick View or Quick Add, and correctly pass the selected variant into the cart.

## [x] 5. Product detail, variant behavior, and product discovery

- Reusable product-record-driven detail page includes a multi-image gallery, thumbnail navigation, zoom/enlargement, title and SKU, current price and applicable discount, product description, color selector, size selector, size guide, fit/fabric details, care instructions, quantity selector, variant-specific availability, Add to Cart, Buy Now, delivery PIN-code lookup or configured serviceability feedback, shipping/return information, related products, recently viewed products, and reviews/ratings only when genuine review data exists.
- Every sellable variant has its own SKU, stock quantity, size, color, and price where applicable. Selecting a variant updates availability and relevant details. Prevent unavailable variants and quantities above available stock from being added. Footwear uses appropriate shoe sizing.
- Use realistic fallback details only where necessary and clearly identify demonstration data versus verified product/supplier information.

## [x] 6. Wishlist and cart persistence, validation, and pricing

- Wishlist supports add/remove, persistent server-backed data for authenticated users, a usable guest wishlist when signed out, and a wishlist page with product links/actions. Guest wishlist stays on the device and is rendered without sign-in; saved slugs are resolved through the public catalog by-slug lookup. Authenticated records remain private.
- Cart supports add/remove/update-quantity; product image, name, size, color, and unit price; inventory validation; accurate subtotal; configured coupons; shipping and any configured applicable taxes; and final payable amount. Persist across navigation and refresh; restore/merge signed-in cart without duplicate lines.
- Provide empty cart, Continue Shopping, remove item, clear error messages, success feedback, and correct mobile behavior. Recheck price, coupon, stock, shipping, and totals on the server; do not rely only on client calculations for prices or discounts.

## [x] 7. Customer authentication, accounts, and privacy

- Implement secure customer registration/login/logout/session handling using the approved provider/configuration; support customer profile, saved addresses, order history, order details, wishlist, tracking, and eligible cancellation/return requests. Manus OAuth is used; sign-in is not simulated.
- Customers may access only their own personal data and orders. Protect private routes and sensitive DB operations through server-side authorization. Document credentials/configuration required if social login or email verification cannot be enabled.
- Session cookies remain `SameSite=None; Secure` for the HTTPS embedded Preview contract. Session authentication/logout behavior and cookie security are covered by existing unit tests; no fake customer is seeded.

## [x] 8. Four-stage checkout, payment safety, and confirmation

- Provide four clear stages: (1) collect full name, email, phone number, delivery address, city, state, and PIN code; validate required fields and give useful errors; (2) display delivery address, calculate shipping using configured rules, validate serviceability only if a shipping provider is connected, and display delivery estimates only when actual/configured data supports them; (3) offer only payment methods actually enabled by a configured suitable Indian gateway such as Razorpay, including UPI/cards where available, and Cash on Delivery only when enabled by the business; (4) after appropriate order/payment verification, display order reference, purchased products/variants, confirmed total, delivery information, and order-detail link.
- A live provider integration must create payment orders server-side, verify payment signature, handle verified webhooks, process idempotently, handle pending/success/failure/cancellation states, and never put provider secrets in browser code.
- With provider credentials unavailable, clearly identify checkout as DEMO/simulation; use an explicit demo order and unpaid/demo payment status; never claim a simulation was gateway-processed or create a falsely paid production order; allow the client to complete checkout/confirmation; preserve cart after checkout failure; prevent duplicate submissions. This project currently uses demo-only checkout, not Razorpay/COD/live payments.
- Bind retry keys to the same authenticated customer/guest identity, contact, complete delivery address, cart quantities, and coupon. Persist only a hash plus random UUID for the current session; rotate the request key when details change, reuse it after a same-payload reload/retry, and have the server reject any key reuse for a different payload rather than silently returning an order addressed elsewhere.

## [x] 9. Managed relational data, server validation, and order integrity

- Use the platform-managed relational database/backend. Schema includes users/profiles; products; categories/collections; product images; product variants/inventory; carts/cart items; wishlists; addresses; orders/order items; payment records; coupons; reviews; returns/refunds; newsletter subscriptions; and administrative settings, with appropriate relationships, indexes, constraints/access controls.
- Apply server-side validation, authorization, and transactions where needed. Store a snapshot of purchased product details and prices in order items so later catalog changes do not rewrite history. Keep catalog/cart/orders database-backed, consistent, and free from unnecessary infrastructure.
- Maintain clear demo versus live order/payment state. Count revenue only from confirmed paid live orders; exclude unpaid/demo orders from paid revenue. Preserve additive migrations and idempotent seed behavior because the managed database is shared by development and production.

## [x] 10. Protected administration and business operations

- Protected dashboard displays total orders, revenue from confirmed paid orders only, pending orders, best-selling products derived from actual order data, and low-stock products.
- Admin can create/edit products; upload images; set product names/descriptions/prices/categories; configure sizes/colors; manage SKU/variant inventory; publish/unpublish/archive products; configure genuine discounts; and manage product galleries.
- Admin can view orders, inspect order items/customer delivery details, update fulfillment, record shipment tracking, and manage cancellation requests and returns/refunds with appropriate authorization.
- Include category management, coupon configuration, customer support records, newsletter subscribers, basic sales/inventory analytics, homepage campaign and featured-product configuration, and store settings.
- Enforce server-side administrator-role checks for every admin operation; hiding controls in the frontend is not authorization. Revenue/bestseller metrics never present demo transactions as real sales.

## [x] 11. Variant inventory, shipping configuration, returns, and policies

- Track inventory per variant; validate availability before checkout; prevent overselling through atomic/transaction-safe updates; reserve/decrement stock according to order lifecycle; correctly restore stock for eligible cancellations; show low-stock indicators in admin.
- Provide configurable flat-rate shipping and free-shipping threshold. PIN-code serviceability, carrier integration, delivery estimate, and tracking are available/claimed only when supported by a connected provider and configured facts; never claim a carrier integration that does not exist.
- Support configurable return eligibility, request submission, return reason, request status, refund tracking, and administrative approval. Provide clear policies and do not advertise unconfigured delivery guarantees or return promises. Refund records are not described as a completed gateway refund unless a provider actually confirms it.
- Enforce the return state machine server-side and in the admin selector: `requested` → `approved` or `rejected`; `approved` → `received`; `received` → `refunded (record only)`; `rejected` and `refunded` are terminal. Revalidate and lock the current state in the transaction; do not allow premature refunds, reversing final decisions, or repeating associated order-state effects.

## [x] 12. Replaceable demonstration catalog, imagery, newsletter, and support

- Seed a coherent demonstration catalog of men's sports T-shirts, women's tops, jerseys, running shorts, track pants, leggings, training jackets, tracksuits, running shoes, training shoes, gym bags, and sports accessories, with consistent product names, INR prices, descriptions, image galleries, sizes, colors, and variant availability.
- Use high-quality appropriately licensed sports imagery; do not copy another retailer's images, branding, or proprietary content without permission. If supplier images or inventory are unavailable, clearly label catalog data as demonstration data and make it replaceable. Do not fabricate reviews, sales counts, or misleading scarcity.
- Newsletter validates email and consent, handles duplicate subscriptions, provides success/error feedback, and stores data where supported. Functional Contact, FAQ, Shipping, Returns, Privacy, and Terms pages are present. When email delivery is not configured, store submissions where appropriate and document the external email service required.

## [ ] 13. Complete production-origin SEO metadata and search readiness

- Provide unique titles/descriptions, canonical URLs, search-friendly product URLs, XML sitemap, robots configuration, and product structured data where appropriate. Optimize responsive imagery, lazy-load below the fold, use semantic accessible HTML, keyboard navigation, accessible focus states, adequate contrast, reduced-motion support, clear loading/error states, and appropriate logging. Optimize real mobile performance.
- Route-specific public metadata, product structured data, robots policy, product/category sitemap coverage, and real product/collection 404 behavior are implemented. Sitemap was expanded after review to include every active, non-archived product (without a 60-item page cap) and administrator-created categories. Private account/order pages remain noindex/private.
- **Open production dependency:** no durable production public HTTPS origin/domain is configured. To avoid inventing a canonical URL, canonical and absolute sitemap URLs are emitted only when the operator configures the real origin. Set `PUBLIC_ORIGIN`, connect the domain, and review social previews before marking this outcome complete.

## [x] 14. Client-demo readiness, validation, and production handoff

- Use the Manus-supported React, TypeScript, Tailwind, reusable UI, managed relational database, secure server logic, managed authentication and image storage, supported payment gateway only when configured, and environment variables for secrets. Keep UI, catalog, cart, auth, database, order/payment-verification, and administrative concerns separate; do not add unnecessary dependencies/infrastructure or replace working platform services without a clear reason.
- Prepare the project preview for a client demonstration and a coherent customer journey: browse clothing; search/filter/sort; inspect correct product galleries; choose clothing/footwear variants independently; use cart quantities and accurate server-quoted totals; enter validated delivery details; complete explicitly demo-labelled checkout without claiming a real payment; persist/display order details; and provide a usable protected admin surface.
- Acceptance includes authentication when configured; secure ownership/admin access; inventory consistency; working policy/support pages; responsive/accessibility support; and resolved major build/runtime errors. Existing non-mutating tests pass (2 test files, 6 tests); TypeScript checking and production build pass; read-only category-search and public guest-wishlist product lookup returned correct rows. No payment/order was submitted as a test against the shared managed database.
- Document production prerequisites before commercial launch: verified supplier catalog/images/prices/stock; intended administrator identity and access; payment credentials, signature/webhook and provider-test validation; transactional email; shipping/carrier/PIN/serviceability/tracking; tax; legally/business-approved policies and identity; a durable HTTPS domain/origin; and operational backup/access/monitoring/reconciliation controls. Do not claim production readiness merely because the site renders.


# Existing-site improvement follow-up

The follow-up brief changes the checkout requirement from the earlier four-stage plan to five explicit stages. Existing components, routes, data, and working behavior remain in place; the following outcomes track only the new audit and targeted refinements.

## [x] 15. Audit and protect the existing project

- Inspect the existing project, source code, components, routes, styling, database, and current functionality; identify features that already work, features that are incomplete, and missing requirements.
- Reuse the current framework, working components, existing design assets, and established project structure. Make targeted changes rather than replacing working code. Preserve existing working features unless a change is necessary to fix a problem. Do not attempt a risky full rewrite.
- Keep changes incremental. Preserve existing routes, APIs, database contracts, and sample data where possible; explain and choose the smallest safe implementation if any request would require a major architectural change. Reuse current cart state manager/backend instead of creating a duplicate.

## [x] 16. Refine the homepage shopping journey

- Organize the homepage as announcement bar if useful; SPORTIKA header with navigation, search, account, wishlist, and cart; compelling sportswear hero and clear shopping buttons; shop-by-category; new arrivals; bestseller only when verified or otherwise featured products; featured performance apparel; only factual performance/comfort/quality benefits; a campaign/editorial banner; newsletter only if it can function properly; and a comprehensive relevant-navigation/policy footer.
- Make the first screen compelling but not overwhelming. Include clear calls to action such as “Shop Men”, “Shop Women”, and “Explore Training Wear”. Avoid excessive/repeated banners, unnecessary sections, and generic filler. Use suitable existing project assets; if missing, use consistent legally usable imagery. Consider image loading performance.

## [x] 17. Confirm all collection/category behavior and category accuracy

- Provide dedicated functional Men, Women, Jerseys, Training Wear, Sports Shoes, Accessories, and Sale pages when sale is supported by product data. Each collection presents its title/short description, relevant banner/image where appropriate, consistent product grid/cards, product images/name/price/valid sale price, available colors/relevant variants, wishlist if implemented, product count, and clear empty state.
- Support price, newest, and meaningful popularity sorting; supported size, price, category, color, and availability filters; pagination/load-more if warranted. Ensure category navigation, filters, sort, and product links work. Men/Women and other collections must not show unrelated products; do not duplicate a small category to fill a grid; empty collections link to other collections.

## [x] 18. Improve reusable product detail and variant requirements

- Keep one reusable product detail template across all products: gallery with selectable thumbnails, appropriate enlarged/zoom interaction when feasible, name, price and applicable sale/discount, color/size selection as data supports, a size chart/guide, quantity, availability/stock status, prominent Add to Cart, wishlist if supported, description, only available material/fit/care/specifications, delivery/return information, and related products/recommendations.
- Variant selection updates selected state; unavailable variants are disabled; require valid size/color selection where relevant; reject unavailable/invalid variants/quantities; selected variant and quantity carry through to cart; show clear add-to-cart success feedback; keep product price/variant/availability consistent across views.
- Do not invent materials, performance claims, delivery promises, stock or return policies; use available or clearly marked demonstration data and neutral placeholders for missing details.

## [x] 19. Complete and verify cart behavior without a duplicate state system

- Cart is accessible from header and product pages; supports adding products, changing quantity, removing items, selected size/color, unit and line prices, trusted subtotal/final totals, configured delivery charges, empty-cart state, links back to shopping, and checkout.
- Preserve cart through navigation and refresh where practical, reuse existing guest/account cart storage and server cart. Prevent invalid quantities. Derive prices and totals from trusted catalog/backend quote data, not a client-submitted price. Ensure selected options and quantity remain consistent between product, cart and order review.

## [x] 20. Implement the follow-up brief’s five-step checkout and truthful confirmation

- Stage 1 Contact information collects the contact information needed for the chosen demo mode. Stage 2 Delivery address validates name, phone, street address, city, state, postal/PIN code, and any genuinely required address fields. Stage 3 Delivery and order review shows products, quantities, selected variants, subtotal, delivery charges and total. Stage 4 uses only an already configured/verified real payment integration; otherwise it is clearly labelled Demo Mode/demo completion, requests no real payment credentials/card details, never claims successful real payment or real supplier/fulfillment, and keeps demo orders distinct. Stage 5 displays order reference, item summary, total and truthful confirmation status only after a successfully recorded demo order.
- Validate required fields and give useful error messages. Preserve entered details when moving between steps. Provide a clear back button and progress indicator. Prevent duplicate order creation. Ensure review matches the cart. Handle empty carts and invalid requests safely. Keep checkout usable on mobile.
- Do not activate live payments, send real customer communications, or create external orders without configuration and authorization. Never falsely claim that payment succeeded or a real supplier/fulfillment order exists.

## [x] 21. Keep global navigation, search, account and wishlist honest and functional

- The logo returns home; category links open the correct collection; search opens a working search interface and returns matches from relevant product names, descriptions and categories with a useful no-results state; cart displays current count; account and wishlist links lead to working functionality or clearly marked placeholders rather than dead/misleading buttons.
- Mobile navigation opens, closes, and routes correctly. Reuse consistent shared navigation and footer across routes. Do not introduce unnecessary authentication for the demo; preserve and improve the existing configured account features.

## [x] 22. Preserve a single source of product truth and existing architecture

- Use centralized catalog/database records with a unique product ID/slug, name/description, category, images, price/optional sale price, sizes/colors/variant IDs, stock/availability, specifications where provided, featured/new-arrival flags, and related products where available.
- Avoid divergent hardcoded versions of the same product on different pages; reuse components for product cards, filters, galleries, size selectors, cart summaries, and buttons; keep frontend/backend validation consistent. Preserve existing database and API contracts where possible; never replace a working backend with hardcoded frontend data. Clearly identify existing demo data and preserve it. Avoid unnecessary dependencies, migrations, and architectural complexity.

## [x] 23. Keep trust, policies, footer and newsletter truthful

- Provide or retain Contact, Shipping/Delivery, Returns/Refunds, Privacy, Terms and Size Guide pages/sections; provide FAQ if useful. Do not fabricate a registered business address, phone, reviews, certifications, shipping promises, or legal claims. Missing business information must be clearly marked replaceable placeholders.
- Show a newsletter signup only when it can function properly; otherwise remove/hide the collection form until email delivery/configuration works. Do not collect customer details into an undisclosed non-working mailing list.

## [ ] 24. Validate responsive, accessible, performant, SEO-aware pages

- Check desktop, tablet and mobile. Check horizontal overflow, readable type, spacing, image crop, touch targets, functional mobile navigation, responsive product grids, labelled forms, visible keyboard focus, sufficient contrast, and clear validation/status messages. Avoid animations that interfere with shopping or accessibility.
- Use appropriately sized/optimized images, avoid unnecessary rerenders/dependencies, provide meaningful page titles/descriptions and clean URLs, useful product/collection headings and image alt text, and loading/error/empty states. Check broken links, console errors and missing assets. Claim SEO/analytics/payment/external integration only if implemented and verified.
- Follow-up evidence: reviewed desktop product presentation and tablet/mobile homepage composition; measured no horizontal overflow on Home at 390px and 768px, product detail at 390px, or checkout at 390px; opened and closed the mobile drawer; checked demo catalog image/stock states. Comprehensive performance-budget and every-link/browser-console checks remain open.

## [ ] 25. Verify the user’s listed shopping acceptance behaviors and report test limits

- Verify homepage navigation; each category opening the correct products; product cards opening correct product details; gallery and variant selectors; preventing invalid size/color choices; add-to-cart updating cart count; quantity/removal changing totals; cart persistence during navigation; required-field validation; order review matching selected products/prices; and that demo checkout never claims a real payment.
- Verify that confirmation is shown only after a recorded demo order; search/filter/sort if implemented; mobile navigation and product layouts; and no obvious broken links, runtime errors or major layout defects. Do not mark an acceptance behavior passed unless it was actually tested. Do not create a test order against the shared managed development/production database without explicit authorization; report that test as unverified if a safe test environment is unavailable.
- Follow-up evidence: verified lower/title-case catalog search, mobile menu open/close, in-stock versus out-of-stock color/size controls, representative no-overflow layouts, the demo checkout stages through review/completion, route manifest and health endpoint. No demo order was submitted; a positive persisted-order confirmation remains unverified because development and production share the managed database.

## [x] 26. Final handoff report

- Report a summary of main structural changes, pages/components modified, key features now working, tests actually performed and results, remaining bugs/incomplete features, and any payment/shipping/inventory/business configuration required before production.
- Direct the user to the project's Preview rather than publishing without authorization; report an updated preview only when the platform provides it. The finished store should feel coherent and professional, prioritizing functional shopping and consistency over unnecessary features.

# Filter, authentication, customer and admin follow-up

This approved follow-up refines the existing project in place. Preserve the existing storefront, React/TypeScript, Express/tRPC, Drizzle/MySQL models, product/cart/order APIs, OAuth/session provider and admin operations; do not rebuild or replace working features. Password credentials remain managed by Manus OAuth: do not implement local passwords, plaintext password storage or a pretend reset system. Make only safe provider-delegating recovery screens if Manus exposes no application reset API. The shared development/published MySQL database must not be used for test account, product, inventory or order writes.

## [ ] 27. Refine Selected Offers filters and catalog consistency

- On the existing Selected Offers page, remove the visible Availability dropdown because it only offers “In stock”. Do not remove inventory management, stock validation or backend availability checks. Continue hiding out-of-stock products by default if that is existing behavior; do not invent stock or variants. Retain Gender, Size, Sport / Activity, Product Type, Minimum Price and Maximum Price. Keep Color only when the structured catalog contains meaningful color variations; otherwise remove Color.
- Every retained filter must use actual structured product/variant data, not product-description text. Multiple filters must combine without one resetting another. Update the product count after changes. Validate minimum and maximum price, including invalid ranges, and clearly report invalid input instead of silently displaying stale results. Provide clear/reset-all behavior, a professional empty state, preserve selected filters where practical while sorting/browsing, and keep controls usable on desktop, tablet and mobile.
- Product cards and detail pages continue to display actual prices, colors, sizes and stock. Use the existing product model where possible; do not create fake product variations to make a filter appear functional. Keep out-of-stock variants unpurchasable and preserve existing server-side inventory validation.

## [ ] 28. Provide a real provider-backed customer authentication experience

- Provide SPORTIKA-styled Sign Up, Login, Forgot Password, Reset Password and Logout routes/actions using a secure established authentication mechanism compatible with this application. Validate required identity fields, provide clear success/error states, handle invalid credentials/provider failures and session expiry, redirect after login, support persistent sessions where appropriate, and properly invalidate the session on logout.
- The existing provider is Manus OAuth. Use its real OAuth/CSRF/session implementation. Do not fabricate a user, claim email/password registration, ask SPORTIKA to store the provider password, expose credentials, or claim local email verification/password recovery where the provider does not expose those capabilities. Sign-up and login must explain that identity creation/authentication occur with Manus. Forgot/reset screens must clearly direct users to the provider's own recovery flow when available and must not present a fake reset form. Never store passwords in plain text.
- Protect authenticated pages and backend operations, not only frontend controls. Registration/login must not assign an administrator role. Duplicate account handling and provider email verification remain provider-owned; disclose unavailable provider setup rather than claim an app-local feature.

## [ ] 29. Complete the customer account and customer-facing journey

- Provide an authenticated account area with profile details and working edit-profile capability, order history and order detail/status where orders exist, saved addresses and wishlist only where the existing functionality is supported, and logout. Show only features connected to real behavior; do not create misleading buttons or fabricated history. Users may view or update only their own personal records.
- Keep the customer experience separate from administration. Preserve public access to Home, men's and women's collections, Jerseys, Training Wear, Sports Shoes, Accessories, Selected Offers, product details, search, wishlist if implemented, cart, checkout, provider login/registration, My Account and order history where available.
- Visitors can browse without logging in. Signed-in users can manage their profile, use cart and existing checkout. Preserve guest checkout and guest cart. If authentication is ever required at checkout, preserve the cart and return to checkout after login. Customers never see admin controls, customer records, internal settings or reports. Every visible link, button and form has a working action or clear disabled state; do not create a second duplicate storefront.

## [ ] 30. Extend the existing protected admin dashboard with real store data and management

- Keep a dedicated, clearly distinct but branded `/admin` area and existing route conventions. The overview reports real total products, registered customers, total orders where order management exists, awaiting-processing orders, low stock, and sales only when real paid order/payment data exists. Clearly label demonstration information; never fabricate customers, orders, sales or analytics.
- Authorized administrators can view products; add, edit, archive/deactivate and restore products; manage product names/descriptions/categories/images/prices/sale prices/sizes/colors/variants/SKUs/stock; set supported featured/new-arrival flags; and manage genuine Selected Offers membership. Validate product data, positive prices, valid sale prices and non-negative stock; changes use the same catalog/inventory source of truth, reflect on the storefront, avoid duplicate records, and require confirmation for destructive actions. Prefer archival over permanent deletion of records referenced by orders.
- Inventory visibility shows stock by product/variant, low-stock and out-of-stock status; authorized quantity changes reject negatives and are validated on the server, update the same inventory used by product pages/cart/checkout, and cannot bypass server validation.
- Retain supported order list/detail, customer and item summaries, date, total, status and authorized status updates. Clearly distinguish demo orders from live orders; never show demo payment as successful live payment. Do not add fake historical orders.
- Provide an admin-only minimal customer list with search, basic account information, order history where available and account status only when supported. Do not expose password hashes, passwords, auth/reset tokens or secrets. Do not add suspension/deletion unless genuinely required and securely implemented.
- Provide useful settings only where supported (store information, currency/display settings, low-stock threshold and demo status); never expose API keys/database credentials. Preserve existing protected categories, coupons, support, newsletter, return, shipping, campaign and analytics capabilities.

## [ ] 31. Enforce server-side role-based access control and private-data boundaries

- Customer role can browse, manage only their own account and view only their own orders/personal data; customers cannot use admin APIs or pages. Administrator role can access only authorized operations and necessary customer information.
- Enforce permissions on the server/trusted provider for every sensitive read/mutation. Protect admin routes and APIs independently of the frontend. Never grant admin because of a submitted email, registration choice or client-side state/local storage. Use secure session/cookie settings; validate and authorize every operation; prevent ID changes from exposing another customer's account/orders; keep credentials in protected server-side environment/platform secrets; avoid private data in logs/API responses.
- Use the established provider/library; do not implement custom password cryptography. Establish the initial admin via the existing secure, documented owner-admin process and never hardcode default admin credentials. Identify exact required configuration for unavailable auth/email services and do not claim setup that has not occurred.

## [ ] 32. Preserve persistent backend/database behavior and safe data model

- Inspect and reuse current products, users, carts, orders, database, OAuth provider and APIs; do not replace a working DB/auth provider unnecessarily. Customer account/profile data persist. Product/inventory changes are reflected throughout storefront/cart/checkout; admin actions persist; order history is linked to its customer; no user can read or modify another customer's private data.
- Keep price, stock and order-total validation on the server; sensitive operations fail safely. Use minimal, documented migrations only if the existing schema cannot support the feature. If existing sample/front-end-only state is encountered, label prototype behavior honestly and add backend persistence only compatibly with the existing project.
- Keep development/published database contract, demonstration-vs-live payment/order state, product and order snapshots, and existing idempotent behavior. Do not write customer/order test records to the shared database.

## [ ] 33. Maintain SPORTIKA UI/UX and responsive/accessibility behavior

- Preserve black/charcoal, white/off-white, electric-lime and bold athletic typography; maintain the existing storefront and make only targeted changes. Storefront stays responsive; the admin has usable navigation and data tables that adapt on small screens or use deliberate horizontal scrolling.
- Forms provide loading, success, validation and error states. Destructive actions require confirmation; empty states are helpful; loading prevents duplicate submissions. Keyboard navigation, visible focus and appropriate contrast work. Do not add excessive animation or redesign unrelated pages.

## [ ] 34. Verify required filter, customer, admin and regression scenarios honestly

- Filters: Availability is no longer visible on Selected Offers; Color remains only when meaningful structured variants exist; gender, size, activity, type and price work; multiple filters combine; reset restores expected products; inventory still blocks out-of-stock items.
- Authentication: if provider/environment permits, verify registration, safe duplicate handling, valid sign-in, rejected invalid credentials, logout invalidates session, configured recovery behavior, own-account access, denial of another customer's data, and denial of customer access to admin routes/APIs. Report Manus OAuth/provider-dependent tests as blocked/unverified rather than fabricating identities.
- Admin: verify authorized administrator access and ordinary-customer denial; product creation/edits and inventory changes persist only in a safe isolated/test database; invalid price/stock are rejected; only real stored orders display; backend enforces every admin operation. Do not mutate the shared development/production database for testing.
- Regression: product browsing, detail, cart and checkout still work; representative mobile/desktop views have no major layout defects; no obvious broken links, runtime errors or exposed secrets remain. Do not claim a test passed unless it actually ran. Report credential/service configuration limits.

## [ ] 35. Deliver the requested implementation and disclose boundaries

- Handoff reports filter changes, authentication features, customer pages/features, admin capabilities, database/backend changes, security measures, tests/results, remaining setup, known limitations and a Preview URL only if the platform provides one. Preserve the current SPORTIKA website, use secure server-enforced functionality rather than visual-only mockups, finish each phase cleanly if scope cannot be completed in one pass, and leave no broken intermediate state.
