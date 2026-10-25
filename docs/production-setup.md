# SPORTIKA production setup checklist

The current site is a demonstration storefront. Demo catalog, stock, fixed-rate shipping and simulated unpaid orders are clearly labelled. This is not a configured live store.

Before commercial use, the operator must:

1. Replace demonstration product names, images, descriptions, sizes, SKUs, prices, discounts and inventory with verified supplier data; review every apparel/footwear product claim and product image rights.
2. Select and authorize the real store administrator through Manus OAuth, then confirm server-side admin access for the intended owner.
3. Configure a production payment provider and credentials, webhook/signature verification, idempotency, payout account, supported payment methods, currency and refund/cancellation procedures. Never put provider secrets in browser code. Until this is tested, checkout remains demo-only and orders are unpaid.
4. Configure the actual shipping price/free threshold, carrier, PIN-code serviceability, delivery estimates, tracking and return/refund eligibility. Remove any setting or copy that is not factually supported by the operator's service.
5. Configure transactional email and consent/marketing delivery through an authorized provider. The customer-facing newsletter capture form is intentionally withheld until delivery and consent handling can function end-to-end; backend storage remains for future authorized activation, and this application currently sends no email.
6. Review tax, company/contact identity, privacy/terms/returns/shipping legal wording, consumer disclosures, business obligations and payment-provider requirements with appropriate qualified professionals.
7. Set the durable production HTTPS origin in the server environment so canonical URLs and the XML sitemap can use a real public domain. Connect the domain and review site metadata and social previews.
8. Replace the footer's clearly labelled SPORTIKA platform-search links with official social-profile URLs only after the business provides and verifies its own accounts. Do not invent brand handles.
9. Verify production database backups, access controls, monitoring, incident procedures, order/inventory reconciliation, supplier stock updates, analytics consent, and end-to-end payment/shipping workflows in the provider's own test environment before launch.

The development and production versions use the same managed database. Treat demo records as persistent shared data. The storefront intentionally excludes demo orders from paid-revenue reporting and labels them as simulated/unpaid.
