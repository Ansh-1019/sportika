# SPORTIKA Supabase setup

SPORTIKA now uses the PostgreSQL Drizzle schema for its application database layer. The previous MySQL schema is preserved at `drizzle/schema.mysql.ts`, and the original MySQL SQL migrations remain under `drizzle/` as historical reference only. The active PostgreSQL baseline is `drizzle-pg/0000_fat_joseph.sql`.

## Required server configuration

Configure these values in the secure runtime environment, never in source code or the browser:

- `DATABASE_URL`: Supabase PostgreSQL connection string. Prefer the Supavisor pooler URL for the deployed runtime.
- `DATABASE_SSL`: optional. SSL is enabled by default; set this to `disable` only for an explicitly local PostgreSQL instance.
- Existing Manus authentication/runtime values remain required for account and admin flows, including `MANUS_PROJECT_ID`, `MANUS_JWT_SECRET`, and the configured Manus OAuth/API values.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are not currently required because SPORTIKA accesses PostgreSQL through the server-side Drizzle connection rather than the Supabase Data API or Storage. If a future feature uses the Supabase Data API, the anon key may be client-visible only where required; the service-role key must remain server-only.

## Migration procedure

1. Provision or identify the authorized Supabase project and obtain its PostgreSQL connection string.
2. Confirm the target is the intended isolated SPORTIKA database. Do not point this application at an unknown shared database.
3. Review `drizzle-pg/0000_fat_joseph.sql`.
4. Run `pnpm db:migrate:supabase` with `DATABASE_URL` supplied through secure runtime configuration.
5. Verify table counts, foreign keys, indexes, enum types, and the updated-at triggers before importing any approved data.

No migration or seed command has been run from this workspace because no Supabase credentials are available. No existing data was reset, overwritten, or imported.

## Data and authorization notes

The migration preserves users, products, categories, images, variants, carts, wishlists, addresses, coupons, orders, order items, payment records, returns, newsletter subscribers, admin settings, and support messages. Inventory reservation uses a PostgreSQL `UPDATE ... RETURNING` path under the existing transaction boundary.

The application uses server-side Drizzle queries and server-side authorization. Supabase Data API Row Level Security policies are therefore not part of this phase. If the Data API is introduced, enable RLS and add explicit ownership policies for customer-owned rows; RLS must supplement, not replace, backend authorization checks.

Demo checkout remains separate from real payment processing. No Razorpay credentials or live payment behavior were added in this phase.
