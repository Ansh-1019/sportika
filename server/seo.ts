import { getProduct, getStoreSettings, listCategories, listProducts, listSitemapProducts } from "./store";

const BRAND_IMAGE = "https://files.manuscdn.com/user_upload_by_module/session_file/310519664042364820/BNkfsdewRmbstmya.svg";
const STATIC_META: Record<string, { title: string; description: string; heading: string; body: string }> = {
  "/": { title: "SPORTIKA | Built to Move. Made to Perform.", description: "Performance-driven sportswear designed for training, competition, and everyday movement.", heading: "BUILT TO MOVE. MADE TO PERFORM.", body: "Discover performance-driven sportswear designed for training, competition, and everyday movement. Shop clothing-first sports T-shirts, jerseys, shorts, track pants, leggings, training jackets and tracksuits, with supporting sports shoes and accessories. Demonstration catalog: supplier details, inventory, payments and delivery services require business configuration." },
  "/about": { title: "About SPORTIKA | Clothing-First Sportswear", description: "Meet SPORTIKA, a clothing-first sportswear concept for training, competition and everyday movement.", heading: "Move first. Make it yours.", body: "SPORTIKA is a clothing-first sportswear concept built around the way people train, compete and move every day. This demonstration store shows a replaceable catalog and a proposed brand direction; supplier product information and commercial services still require verification." },
  "/contact": { title: "Contact SPORTIKA | Store Support", description: "Contact the SPORTIKA demonstration store about sample products and supported store operations.", heading: "Talk to SPORTIKA", body: "Send a message using the contact form. This demonstration store records support messages for administrator review; it does not send email until a transactional email provider is configured." },
  "/faq": { title: "SPORTIKA FAQs | Demo Store Information", description: "Answers about SPORTIKA demonstration products, demo checkout, shipping rules and supplier verification.", heading: "Frequently asked questions", body: "Are products verified? No. The visible range is sample catalog data pending supplier confirmation. Is checkout live? No; checkout creates a clearly labelled unpaid demonstration order. Are delivery dates confirmed? No. Carrier serviceability and estimates are not connected. Can administrators edit the store? Yes, an authorized administrator can manage product listings, inventory, campaigns and demonstration shipping rules." },
  "/shipping-policy": { title: "Shipping Information | SPORTIKA", description: "Review SPORTIKA demonstration shipping rules; live carrier and PIN-code serviceability are not connected.", heading: "Shipping information", body: "This demonstration store uses an administrator-configurable sample flat-rate and free-shipping threshold. It does not connect to a carrier, verify PIN-code serviceability or promise a delivery date. Final rates, taxes, coverage and timelines must be configured and verified by the business before launch." },
  "/return-policy": { title: "Returns Information | SPORTIKA", description: "Read about the sample SPORTIKA return-request workflow; eligibility and refund rules require business configuration.", heading: "Returns information", body: "Eligible signed-in customers may submit a return request on a delivered demonstration order for administrator review. This sample workflow is not a commercial returns promise. The business must publish approved eligibility, time limits, shipping, inspection and refund rules before launch." },
  "/privacy-policy": { title: "Privacy Notice | SPORTIKA Demo Store", description: "Learn what account, order, support and newsletter data the SPORTIKA demonstration store stores.", heading: "Privacy notice", body: "This demonstration application uses the configured Manus account identity, managed order and address records, support messages and consented newsletter subscriptions. Access to customer records is restricted by server-side ownership and administrator checks. Email marketing delivery is not connected. Final privacy disclosures, retention rules and controller details require business/legal review." },
  "/terms": { title: "Terms of Use | SPORTIKA Demo Store", description: "Review demonstration-store terms before using sample catalog and simulated checkout features.", heading: "Terms of use", body: "This is a client demonstration. Catalog descriptions, stock, prices, shipping and campaign settings are sample information; demo checkout is not a real payment or purchase contract. These draft terms are not legal advice and require review and replacement by the operating business before a public commercial launch." },
  "/cart": { title: "Shopping Cart | SPORTIKA", description: "Review your selected sample products and server-validated SPORTIKA demonstration cart totals.", heading: "Your movement, your cart", body: "Your cart and any personalized contents are loaded in the browser and are not embedded in this public HTML. Product prices, configured sample coupon rules and demonstration shipping are revalidated by the server during checkout." },
  "/checkout": { title: "Demo Checkout | SPORTIKA", description: "Complete a clearly labelled SPORTIKA demonstration order; no live payment gateway is connected.", heading: "Demo checkout", body: "Checkout validates your contact and delivery details, configured sample shipping and available variant stock. The payment step is a simulation: no card, UPI or COD payment is collected and no live gateway is connected." },
  "/search": { title: "Search Sportswear | SPORTIKA", description: "Search SPORTIKA's sample catalog of clothing, jerseys, sports shoes and training accessories.", heading: "Search SPORTIKA", body: "Search the demonstration catalog by product name, category, sport and product type. Search results are generated from the current catalog." },
  "/collections": { title: "Shop Sportswear Collections | SPORTIKA", description: "Browse clothing-first sportswear collections, jerseys, shoes and accessories from SPORTIKA.", heading: "Find your fit", body: "Explore men's and women's sportswear, jerseys, training wear, shorts and track pants, footwear and training accessories. Sample catalog records are replaceable and final supplier details remain to be confirmed." },
};
const COLLECTION_TITLES: Record<string, string> = {
  men: "Men's Sportswear", women: "Women's Sportswear", jerseys: "Sports Jerseys", "training-wear": "Training Wear",
  "shorts-track-pants": "Shorts & Track Pants", shoes: "Sports Shoes", accessories: "Training Accessories",
  "new-arrivals": "New Arrivals", sale: "Selected Demonstration Offers",
};
const COLLECTION_DESCRIPTIONS: Record<string, string> = {
  men: "Shop men's training tees, jerseys, shorts, track pants and sports clothing in the SPORTIKA demonstration catalog.",
  women: "Browse women's training tops, leggings, sports bras and activewear. Supplier specifications remain to be verified.",
  jerseys: "Browse unbranded sample jerseys and training layers; product details remain demonstration data.",
  "training-wear": "Explore sample sports T-shirts, tops, leggings, jackets, jerseys and tracksuits.",
  "shorts-track-pants": "Explore demonstration running shorts and track pants with variant-level sample sizing and stock.",
  shoes: "Browse sample sports shoe listings; sizing, materials and performance details require supplier verification.",
  accessories: "Explore sample training bags, socks, caps, bottles and other athletic accessories.",
  "new-arrivals": "See recently added clothing-first SPORTIKA sample products.",
  sale: "Browse configured sample catalog prices; offers are not commercial promises until confirmed by the business.",
};
const INFO_PATHS = new Set(Object.keys(STATIC_META));
const DYNAMIC_PRIVATE = /^\/(?:account|admin)(?:\/|$)|^\/order-confirmation(?:\/|$)/;
const ESCAPE = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const formatINR = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
const origin = () => { try { const parsed = new URL(process.env.PUBLIC_ORIGIN ?? ""); return parsed.protocol === "https:" && !parsed.username && !parsed.password ? parsed.origin : ""; } catch { return ""; } };

type SeoPage = { status: number; title: string; description: string; body: string; noindex: boolean; canonicalPath?: string; structuredData?: Record<string, unknown>; socialImage?: string; ogType?: "website" | "product" };
function productCards(items: Array<{slug:string;name:string;description:string;price:number;images:Array<{url:string;alt:string}>;variants:Array<{size:string;stock:number;price:number|null}>}>) {
  if (!items.length) return `<p>No matching products are currently listed in this demonstration catalog.</p>`;
  return `<ul class="seo-product-list">${items.map(item => { const prices = item.variants.map(variant => variant.price ?? item.price); const startsAt = prices.length ? Math.min(...prices) : item.price; const priceLabel = new Set(prices).size > 1 ? `From ${formatINR(startsAt)}` : formatINR(startsAt); return `<li><a href="/products/${encodeURIComponent(item.slug)}">${item.images[0] ? `<img src="${ESCAPE(item.images[0].url)}" alt="${ESCAPE(item.images[0].alt)}" loading="lazy" width="240" height="300">` : ""}<h2>${ESCAPE(item.name)}</h2></a><p>${ESCAPE(item.description)}</p><p>${ESCAPE(priceLabel)} · Demonstration listing</p><p>Available sample sizes: ${ESCAPE([...new Set(item.variants.filter(v => v.stock > 0).map(v => v.size))].join(", ") || "Check variant availability")}</p></li>`; }).join("")}</ul>`;
}
function publicLinks() {
  return `<nav aria-label="Explore SPORTIKA"><a href="/collections/men">Men</a> · <a href="/collections/women">Women</a> · <a href="/collections/training-wear">Training Wear</a> · <a href="/collections/jerseys">Jerseys</a> · <a href="/collections/shorts-track-pants">Shorts &amp; Track Pants</a> · <a href="/collections/shoes">Sports Shoes</a> · <a href="/collections/accessories">Accessories</a></nav>`;
}

export async function getSeoPage(requestUrl: string): Promise<SeoPage> {
  const url = new URL(requestUrl, "http://sportika.invalid");
  const pathname = decodeURIComponent(url.pathname);
  if (INFO_PATHS.has(pathname)) {
    const meta = STATIC_META[pathname];
    if (pathname === "/") {
      const [featured, categories] = await Promise.all([listProducts({ pageSize: 8, sort: "featured" }), listCategories()]);
      const categoryLinks = categories.map(category => `<li><a href="/collections/${encodeURIComponent(category.slug)}">${ESCAPE(category.name)}</a> — ${ESCAPE(category.description)}</li>`).join("");
      return { status: 200, title: meta.title, description: meta.description, noindex: false, canonicalPath: pathname,
        body: `<h1>${ESCAPE(meta.heading)}</h1><p>${ESCAPE(meta.body)}</p><p><a href="/collections">Shop sportswear</a> · <a href="/collections/new-arrivals">Explore new arrivals</a></p><h2>Shop sports clothing</h2><ul>${categoryLinks}</ul><h2>Featured sample products</h2>${productCards(featured.products)}${publicLinks()}` };
    }
    if (pathname === "/collections") {
      const [featured, categories] = await Promise.all([listProducts({ pageSize: 8, sort: "featured" }), listCategories()]);
      const links = categories.map(category => `<li><a href="/collections/${encodeURIComponent(category.slug)}">${ESCAPE(category.name)}</a> — ${ESCAPE(category.description)}</li>`).join("");
      return { status: 200, title: meta.title, description: meta.description, noindex: false, canonicalPath: pathname, body: `<h1>${ESCAPE(meta.heading)}</h1><p>${ESCAPE(meta.body)}</p><ul>${links}</ul>${productCards(featured.products)}${publicLinks()}` };
    }
    if (pathname === "/shipping-policy") {
      const settings = await getStoreSettings();
      const { flatRate, freeShippingThreshold } = settings.shipping;
      return { status: 200, title: meta.title, description: meta.description, noindex: false, canonicalPath: pathname,
        body: `<h1>${ESCAPE(meta.heading)}</h1><p>This demonstration store currently uses a configurable flat rate of ${ESCAPE(formatINR(flatRate))}, waived at a configured post-discount subtotal of ${ESCAPE(formatINR(freeShippingThreshold))}. These are sample store settings, not a commercial delivery promise.</p><p>${ESCAPE(meta.body)}</p>${publicLinks()}` };
    }
    if (pathname === "/search") {
      const q = url.searchParams.get("q")?.slice(0, 160) ?? "";
      const results = q ? await listProducts({ search: q, pageSize: 24 }) : null;
      return { status: 200, title: meta.title, description: meta.description, noindex: true, body: `<h1>${ESCAPE(meta.heading)}</h1><p>${ESCAPE(meta.body)}</p><form action="/search"><label for="seo-q">Search sample products</label><input id="seo-q" name="q" value="${ESCAPE(q)}"><button>Search</button></form>${results ? `<p>${results.total} matching products</p>${productCards(results.products)}` : ""}${publicLinks()}` };
    }
    return { status: 200, title: meta.title, description: meta.description, noindex: false, canonicalPath: pathname, body: `<h1>${ESCAPE(meta.heading)}</h1><p>${ESCAPE(meta.body)}</p>${pathname === "/contact" ? `<p><a href="/contact">Open the support form</a></p>` : ""}${publicLinks()}` };
  }
  if (pathname.startsWith("/collections/")) {
    const slug = pathname.split("/").filter(Boolean)[1] ?? "";
    const categories = COLLECTION_TITLES[slug] ? [] : await listCategories();
    const category = categories.find(item => item.slug === slug);
    const title = COLLECTION_TITLES[slug] ?? category?.name;
    if (!title) return { status: 404, title: "Collection Not Found | SPORTIKA", description: "That SPORTIKA collection does not exist.", noindex: true, body: `<h1>Collection not found</h1><p>This collection is not available.</p>${publicLinks()}` };
    const result = await listProducts({ collection: slug, pageSize: 24 });
    const description = COLLECTION_DESCRIPTIONS[slug] ?? category?.description ?? `Browse the ${title} collection in the SPORTIKA demonstration catalog; supplier details remain to be verified.`;
    return { status: 200, title: `${title} | SPORTIKA`, description, noindex: false, canonicalPath: pathname,
      body: `<h1>${ESCAPE(title)}</h1><p>${ESCAPE(description)}</p><p>${result.total} sample products</p>${productCards(result.products)}${publicLinks()}` };
  }
  if (pathname.startsWith("/products/")) {
    const slug = pathname.split("/").filter(Boolean)[1] ?? "";
    const product = await getProduct(slug);
    if (!product) return { status: 404, title: "Product Not Found | SPORTIKA", description: "This product is not in the SPORTIKA catalog.", noindex: true, body: `<h1>Product not found</h1><p>This product is not currently available in the SPORTIKA demonstration catalog.</p>${publicLinks()}` };
    const title = `${product.name} | SPORTIKA`;
    const description = `${product.description} Demonstration listing; supplier and availability details require verification.`;
    const gallery = product.images.map(image => `<img src="${ESCAPE(image.url)}" alt="${ESCAPE(image.alt)}" loading="lazy" width="360" height="450">`).join("");
    const variants = product.variants.map(variant => { const price = variant.price ?? product.price; return `<li>${ESCAPE(variant.color)} / ${ESCAPE(variant.size)} — ${ESCAPE(formatINR(price))} · ${variant.stock > 0 ? `${variant.stock} sample units shown` : "currently unavailable"}</li>`; }).join("");
    const prices = product.variants.map(variant => variant.price ?? product.price);
    const minimumPrice = prices.length ? Math.min(...prices) : product.price;
    const maximumPrice = prices.length ? Math.max(...prices) : product.price;
    const displayedPrice = minimumPrice === maximumPrice ? formatINR(minimumPrice) : `From ${formatINR(minimumPrice)}`;
    const configuredOrigin = origin();
    const structuredImages = product.images.map(image => {
      try {
        const parsed = image.url.startsWith("https://") ? new URL(image.url) : configuredOrigin ? new URL(image.url, configuredOrigin) : null;
        return parsed && parsed.protocol === "https:" && !parsed.username && !parsed.password ? parsed.toString() : "";
      } catch { return ""; }
    }).filter(Boolean);
    const structuredData: Record<string, unknown> = {
      "@context": "https://schema.org", "@type": "Product", name: product.name,
      description: `${product.description} Demonstration catalog item; commercial availability and supplier details are unverified.`,
      brand: { "@type": "Brand", name: "SPORTIKA" }, category: product.categoryName,
      additionalProperty: [{ "@type": "PropertyValue", name: "Catalog status", value: "Demonstration listing" }],
    };
    if (structuredImages.length) structuredData.image = structuredImages;
    return { status: 200, title, description, noindex: false, canonicalPath: pathname, structuredData, socialImage: structuredImages[0] ?? BRAND_IMAGE, ogType: "product",
      body: `<h1>${ESCAPE(product.name)}</h1><p>${ESCAPE(product.categoryName)} · ${ESCAPE(product.productType)} · ${ESCAPE(product.sport)}</p><p>${ESCAPE(displayedPrice)}${product.originalPrice && product.originalPrice > minimumPrice ? ` · original sample price ${ESCAPE(formatINR(product.originalPrice))}` : ""}</p><p>${ESCAPE(product.description)}</p><p>Demonstration product: details, inventory and supplier availability require confirmation.</p><div>${gallery}</div><h2>Sample sizes and availability</h2><ul>${variants}</ul><p><a href="/collections/${encodeURIComponent(product.categorySlug)}">Browse ${ESCAPE(product.categoryName)}</a></p>${publicLinks()}` };
  }
  if (DYNAMIC_PRIVATE.test(pathname)) {
    const confirmation = pathname.startsWith("/order-confirmation/");
    return { status: 200, title: confirmation ? "Order Confirmation | SPORTIKA" : pathname.startsWith("/admin") ? "Store Administration | SPORTIKA" : "My Account | SPORTIKA",
      description: "Private SPORTIKA account or administration page. Personal information is rendered only after application authorization.", noindex: true,
      body: `<h1>${confirmation ? "Order confirmation" : pathname.startsWith("/admin") ? "Store administration" : "Your SPORTIKA account"}</h1><p>${confirmation ? "Order information is not embedded in public HTML. Open the account session used to create the demonstration order." : "Sign in through the configured account provider to view private account or authorized administration information."}</p><p><a href="/">SPORTIKA home</a></p>` };
  }
  return { status: 404, title: "Page Not Found | SPORTIKA", description: "The requested SPORTIKA page could not be found.", noindex: true,
    body: `<h1>Page not found</h1><p>The requested page is not part of the SPORTIKA store.</p>${publicLinks()}` };
}

export function injectSeoHtml(template: string, page: SeoPage): string {
  const configuredOrigin = origin();
  const canonical = page.canonicalPath && configuredOrigin ? `${configuredOrigin}${page.canonicalPath}` : "";
  const tag = (selector: RegExp, replacement: string) => { template = template.replace(selector, replacement); };
  tag(/<title>[\s\S]*?<\/title>/i, `<title>${ESCAPE(page.title)}</title>`);
  tag(/<meta name="description"[^>]*>/i, `<meta name="description" content="${ESCAPE(page.description)}" />`);
  tag(/<meta name="keywords"[^>]*>/i, `<meta name="keywords" content="sportswear, training wear, sports clothing, athletic apparel" />`);
  tag(/<meta property="og:type"[^>]*>/i, `<meta property="og:type" content="${page.ogType ?? "website"}" />`);
  tag(/<meta property="og:title"[^>]*>/i, `<meta property="og:title" content="${ESCAPE(page.title)}" />`);
  tag(/<meta property="og:description"[^>]*>/i, `<meta property="og:description" content="${ESCAPE(page.description)}" />`);
  tag(/<meta property="og:site_name"[^>]*>/i, `<meta property="og:site_name" content="SPORTIKA" />`);
  tag(/<meta name="twitter:card"[^>]*>/i, `<meta name="twitter:card" content="summary_large_image" />`);
  tag(/<meta name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${ESCAPE(page.title)}" />`);
  tag(/<meta name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${ESCAPE(page.description)}" />`);
  const canonicalTags = canonical ? `<link rel="canonical" href="${ESCAPE(canonical)}"/><meta property="og:url" content="${ESCAPE(canonical)}"/>` : "";
  const robots = page.noindex ? `<meta name="robots" content="noindex, nofollow"/>` : "";
  const socialImage = page.socialImage ?? BRAND_IMAGE;
  const social = `<meta property="og:image" content="${ESCAPE(socialImage)}"/><meta name="twitter:image" content="${ESCAPE(socialImage)}"/>`;
  const jsonLd = page.structuredData ? `<script type="application/ld+json">${JSON.stringify(page.structuredData).replace(/</g, "\\u003c")}</script>` : "";
  const insertions = `${canonicalTags}${robots}${social}${jsonLd}`;
  if (/<\/head>/i.test(template)) template = template.replace(/<\/head>/i, `${insertions}</head>`);
  const fallback = `<main class="seo-fallback">${page.body}</main>`;
  return template.replace(/<noscript>[\s\S]*?<\/noscript>/i, `<noscript>${fallback}</noscript>`);
}

export async function sitemapXml(): Promise<string> {
  const base = origin();
  const urls = base ? ["/", "/collections", ...Object.keys(COLLECTION_TITLES).map(slug => `/collections/${slug}`), "/about", "/contact", "/faq", "/shipping-policy", "/return-policy", "/privacy-policy", "/terms"] : [];
  if (base) {
    const knownCollectionSlugs = new Set(Object.keys(COLLECTION_TITLES));
    const dynamicCategories = await listCategories();
    for (const category of dynamicCategories) if (!knownCollectionSlugs.has(category.slug)) urls.push(`/collections/${encodeURIComponent(category.slug)}`);
    const products = await listSitemapProducts();
    for (const item of products) urls.push(`/products/${encodeURIComponent(item.slug)}`);
  }
  const entries = urls.map(path => `<url><loc>${ESCAPE(`${base}${path}`)}</loc></url>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`;
}
export function robotsText() {
  const base = origin();
  return `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /account\nDisallow: /admin\nDisallow: /order-confirmation\n${base ? `Sitemap: ${base}/sitemap.xml\n` : ""}`;
}
