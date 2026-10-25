import { and, asc, desc, eq, gte, inArray, like, lte, or, sql, type SQL } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  addresses, adminSettings, cartItems, carts, categories, coupons, newsletterSubscribers,
  orderItems, orders, paymentRecords, productImages, products, productVariants,
  returnRequests, supportMessages, users, wishlistItems,
} from "../drizzle/schema";
import { seedCategories, seedProducts, shippingRules } from "../shared/catalog";
import { effectiveAvailability } from "../shared/catalog-filters";
import type { CartLine, CheckoutAddress, OrderSummary, StoreCategory, StoreProduct } from "../shared/store-types";
import { getDb } from "./db";
import {
  isLocalDemoPreview, localDemoCategories, localDemoFacets, localDemoListProducts, localDemoProduct,
  localDemoProductsBySlugs, localDemoQuote, localDemoShipping, localDemoSitemapProducts, localDemoStorefront,
} from "./local-demo-catalog";

let seeded = false;
let seedPromise: Promise<void> | undefined;

async function dbOrThrow() {
  const db = await getDb();
  if (!db) throw new Error("Managed database is unavailable");
  return db;
}

export async function ensureSeeded() {
  if (seeded) return;
  if (!seedPromise) seedPromise = seedDemoData();
  try { await seedPromise; seeded = true; }
  catch (error) { seedPromise = undefined; throw error; }
}

async function seedDemoData() {
  const db = await dbOrThrow();
  const categoryRows = await db.select().from(categories);
  const categoryMap = new Map(categoryRows.map(row => [row.slug, row.id]));
  for (const category of seedCategories) {
    if (categoryMap.has(category.slug)) continue;
    await db.insert(categories).values(category);
    const [created] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, category.slug)).limit(1);
    if (created) categoryMap.set(category.slug, created.id);
  }
  for (const item of seedProducts) {
    const [existing] = await db.select({ id: products.id, isDemo: products.isDemo }).from(products).where(eq(products.slug, item.slug)).limit(1);
    if (existing) {
      if (existing.isDemo && item.image.startsWith("/assets/sportika/")) {
        await db.update(productImages).set({ url: item.image, alt: item.imageAlt }).where(and(eq(productImages.productId, existing.id), eq(productImages.position, 0)));
      }
      continue;
    }
    const categoryId = categoryMap.get(item.category);
    if (!categoryId) continue;
    await db.insert(products).values({
      slug: item.slug, name: item.name, description: item.description, categoryId, gender: item.gender,
      productType: item.productType, sport: item.sport, price: item.price, originalPrice: item.originalPrice ?? null,
      featured: item.featured ?? false, newArrival: item.newArrival ?? false, active: true, isDemo: true,
    });
    const [created] = await db.select({ id: products.id }).from(products).where(eq(products.slug, item.slug)).limit(1);
    if (!created) continue;
    await db.insert(productImages).values({ productId: created.id, url: item.image, alt: item.imageAlt, position: 0 });
    await db.insert(productVariants).values(item.variants.map(variant => ({
      productId: created.id, sku: `${item.slug.toUpperCase().replace(/-/g, "").slice(0, 10)}-${variant.skuSuffix}`,
      size: variant.size, color: variant.color, colorHex: variant.colorHex, price: null, stock: variant.stock, active: true,
    })));
  }
  const [coupon] = await db.select({ id: coupons.id }).from(coupons).where(eq(coupons.code, "MOVE10")).limit(1);
  if (!coupon) await db.insert(coupons).values({ code: "MOVE10", discountType: "percent", discountValue: 10, minimumSubtotal: 999, active: true });
  const [shipping] = await db.select({ id: adminSettings.id }).from(adminSettings).where(eq(adminSettings.settingKey, "shipping_rules")).limit(1);
  if (!shipping) await db.insert(adminSettings).values({ settingKey: "shipping_rules", settingValue: JSON.stringify(shippingRules) });
}

async function readShippingRules() {
  if (isLocalDemoPreview) return localDemoShipping();
  const db = await dbOrThrow();
  const [row] = await db.select().from(adminSettings).where(eq(adminSettings.settingKey, "shipping_rules")).limit(1);
  if (!row) return shippingRules;
  try {
    const value = JSON.parse(row.settingValue) as { flatRate?: number; freeShippingThreshold?: number };
    return {
      flatRate: Number.isFinite(value.flatRate) && Number(value.flatRate) >= 0 ? Number(value.flatRate) : shippingRules.flatRate,
      freeShippingThreshold: Number.isFinite(value.freeShippingThreshold) && Number(value.freeShippingThreshold) >= 0 ? Number(value.freeShippingThreshold) : shippingRules.freeShippingThreshold,
      configuredForDemo: true,
    };
  } catch { return shippingRules; }
}

export async function getStoreSettings() {
  if (isLocalDemoPreview) return { shipping: localDemoShipping(), paymentMode: "demo" as const, taxConfigured: false, carrierConfigured: false, emailConfigured: false, bestSellingAvailable: false };
  const [shipping, db] = await Promise.all([readShippingRules(), dbOrThrow()]);
  const paidItems = await db.select({ productId: orderItems.productId }).from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(eq(orders.mode, "live"), eq(orders.paymentStatus, "paid"), sql`${orderItems.productId} IS NOT NULL`)).limit(1);
  return { shipping, paymentMode: "demo", taxConfigured: false, carrierConfigured: false, emailConfigured: false, bestSellingAvailable: paidItems.length > 0 };
}

export async function updateStoreShipping(input: { flatRate: number; freeShippingThreshold: number }) {
  const db = await dbOrThrow();
  const value = JSON.stringify({ ...input, configuredForDemo: true });
  const [existing] = await db.select().from(adminSettings).where(eq(adminSettings.settingKey, "shipping_rules")).limit(1);
  if (existing) await db.update(adminSettings).set({ settingValue: value }).where(eq(adminSettings.settingKey, "shipping_rules"));
  else await db.insert(adminSettings).values({ settingKey: "shipping_rules", settingValue: value });
  return { updated: true };
}

export async function listCategories(): Promise<StoreCategory[]> {
  if (isLocalDemoPreview) return localDemoCategories();
  await ensureSeeded();
  const db = await dbOrThrow();
  return db.select({ id: categories.id, slug: categories.slug, name: categories.name, description: categories.description }).from(categories).orderBy(asc(categories.name));
}

export async function getCatalogFacets(collection?: string) {
  if (isLocalDemoPreview) return localDemoFacets(collection);
  await ensureSeeded();
  const db = await dbOrThrow();
  const slug = collection?.toLowerCase();
  const conditions: SQL[] = [eq(products.active, true), eq(products.archived, false)];
  if (slug === "men" || slug === "women") {
    const audience = slug === "men" ? "Men" : "Women";
    const audienceCondition = or(eq(products.gender, audience), eq(products.gender, "Unisex"));
    if (audienceCondition) conditions.push(audienceCondition);
  } else if (slug === "new-arrivals") conditions.push(eq(products.newArrival, true));
  else if (slug === "sale") {
    conditions.push(sql`${products.originalPrice} IS NOT NULL`);
    conditions.push(sql`EXISTS (SELECT 1 FROM ${productVariants} WHERE ${productVariants.productId} = ${products.id} AND ${productVariants.active} = true AND ${productVariants.stock} > 0)`);
  } else if (slug === "shoes" || slug === "accessories") conditions.push(eq(categories.slug, slug));
  else if (slug && slug !== "collections" && slug !== "all") conditions.push(eq(categories.slug, slug));

  const records = await db.select({ id: products.id, gender: products.gender, sport: products.sport, productType: products.productType })
    .from(products).innerJoin(categories, eq(products.categoryId, categories.id)).where(and(...conditions));
  const ids = records.map(product => product.id);
  const variantConditions: SQL[] = [eq(productVariants.active, true)];
  if (ids.length) variantConditions.push(inArray(productVariants.productId, ids));
  else return { genders: [], sizes: [], colors: [], sports: [], productTypes: [] };
  if (slug === "sale") variantConditions.push(gte(productVariants.stock, 1));
  const variants = await db.select({ size: productVariants.size, color: productVariants.color }).from(productVariants)
    .where(and(...variantConditions)).orderBy(asc(productVariants.size), asc(productVariants.color));
  const unique = (values: string[]) => [...new Set(values.map(value => value.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
  return {
    genders: unique(records.map(product => product.gender)),
    sizes: unique(variants.map(variant => variant.size)),
    colors: unique(variants.map(variant => variant.color)),
    sports: unique(records.map(product => product.sport)),
    productTypes: unique(records.map(product => product.productType)),
  };
}

export type ProductFilters = {
  collection?: string; category?: string; gender?: string; size?: string; color?: string; sport?: string;
  productType?: string; minPrice?: number; maxPrice?: number; available?: boolean; search?: string;
  sort?: "featured" | "newest" | "price-asc" | "price-desc" | "best-selling"; page?: number; pageSize?: number;
};

type ProductRow = {
  id: number; slug: string; name: string; description: string; categoryId: number; categorySlug: string;
  categoryName: string; gender: string; productType: string; sport: string; price: number; originalPrice: number | null;
  featured: boolean; newArrival: boolean; active: boolean; archived: boolean; isDemo: boolean; createdAt: Date;
};

async function hydrateProducts(rows: ProductRow[], includeInactiveVariants = false): Promise<StoreProduct[]> {
  if (!rows.length) return [];
  const db = await dbOrThrow();
  const ids = rows.map(row => row.id);
  const [imageRows, variantRows] = await Promise.all([
    db.select().from(productImages).where(inArray(productImages.productId, ids)).orderBy(asc(productImages.position)),
    db.select().from(productVariants).where(includeInactiveVariants ? inArray(productVariants.productId, ids) : and(inArray(productVariants.productId, ids), eq(productVariants.active, true))).orderBy(asc(productVariants.id)),
  ]);
  return rows.map(row => ({
    ...row,
    images: imageRows.filter(image => image.productId === row.id).map(image => ({ url: image.url, alt: image.alt })),
    variants: variantRows.filter(variant => variant.productId === row.id),
  }));
}

export async function listProducts(filters: ProductFilters = {}) {
  if (isLocalDemoPreview) return localDemoListProducts(filters);
  await ensureSeeded();
  const db = await dbOrThrow();
  const conditions: SQL[] = [eq(products.active, true)];
  const collection = filters.collection?.toLowerCase();
  if (collection === "men" || collection === "women") {
    const audience = collection === "men" ? "Men" : "Women";
    const audienceFilter = or(eq(products.gender, audience), eq(products.gender, "Unisex"));
    if (audienceFilter) conditions.push(audienceFilter);
  }
  else if (collection === "new-arrivals") conditions.push(eq(products.newArrival, true));
  else if (collection === "sale") {
    conditions.push(sql`${products.originalPrice} IS NOT NULL AND ${products.originalPrice} > ${products.price}`);
    conditions.push(sql`EXISTS (SELECT 1 FROM ${productVariants} WHERE ${productVariants.productId} = ${products.id} AND ${productVariants.active} = true AND ${productVariants.stock} > 0)`);
  }
  else if (collection === "shoes" || collection === "accessories") conditions.push(eq(categories.slug, collection));
  else if (collection && collection !== "collections" && collection !== "all") conditions.push(eq(categories.slug, collection));
  if (filters.category) conditions.push(eq(categories.slug, filters.category));
  if (filters.gender) conditions.push(eq(products.gender, filters.gender));
  if (filters.sport) conditions.push(eq(products.sport, filters.sport));
  if (filters.productType) conditions.push(eq(products.productType, filters.productType));
  const effectiveAvailabilityForQuery = effectiveAvailability(collection, filters.available);
  const priceVariantConditions: SQL[] = [eq(productVariants.productId, products.id), eq(productVariants.active, true)];
  if (filters.size) priceVariantConditions.push(eq(productVariants.size, filters.size));
  if (filters.color) priceVariantConditions.push(eq(productVariants.color, filters.color));
  if (effectiveAvailabilityForQuery === true) priceVariantConditions.push(gte(productVariants.stock, 1));
  if (effectiveAvailabilityForQuery === false) priceVariantConditions.push(eq(productVariants.stock, 0));
  const priceVariantWhere = and(...priceVariantConditions)!;
  const effectivePrice = sql<number>`COALESCE((SELECT MIN(COALESCE(${productVariants.price}, ${products.price})) FROM ${productVariants} WHERE ${priceVariantWhere}), ${products.price})`;
  if (filters.minPrice !== undefined) conditions.push(gte(effectivePrice, filters.minPrice));
  if (filters.maxPrice !== undefined) conditions.push(lte(effectivePrice, filters.maxPrice));
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim().toLowerCase()}%`;
    const searchCondition = or(
      like(sql`LOWER(${products.name})`, term), like(sql`LOWER(${products.description})`, term),
      like(sql`LOWER(${products.sport})`, term), like(sql`LOWER(${products.productType})`, term),
      like(sql`LOWER(${categories.name})`, term), like(sql`LOWER(${categories.slug})`, term),
    );
    if (searchCondition) conditions.push(searchCondition);
  }
  const sort = filters.sort ?? "featured";
  let orderBy = [desc(products.featured), desc(products.createdAt)];
  if (sort === "newest") orderBy = [desc(products.createdAt)];
  if (sort === "price-asc") orderBy = [asc(effectivePrice)];
  if (sort === "price-desc") orderBy = [desc(effectivePrice)];
  let rows = await db.select({
    id: products.id, slug: products.slug, name: products.name, description: products.description,
    categoryId: products.categoryId, categorySlug: categories.slug, categoryName: categories.name,
    gender: products.gender, productType: products.productType, sport: products.sport, price: products.price,
    originalPrice: products.originalPrice, featured: products.featured, newArrival: products.newArrival,
    active: products.active, archived: products.archived, isDemo: products.isDemo, createdAt: products.createdAt,
  }).from(products).innerJoin(categories, eq(products.categoryId, categories.id)).where(and(...conditions)).orderBy(...orderBy);
  if (filters.size || filters.color || effectiveAvailabilityForQuery !== undefined) {
    const variantConditions: SQL[] = [eq(productVariants.active, true)];
    if (filters.size) variantConditions.push(eq(productVariants.size, filters.size));
    if (filters.color) variantConditions.push(eq(productVariants.color, filters.color));
    if (effectiveAvailabilityForQuery === true) variantConditions.push(gte(productVariants.stock, 1));
    if (effectiveAvailabilityForQuery === false) variantConditions.push(eq(productVariants.stock, 0));
    const matches = await db.select({ productId: productVariants.productId }).from(productVariants).where(and(...variantConditions));
    const ids = new Set(matches.map(item => item.productId));
    rows = rows.filter(row => ids.has(row.id));
  }
  if (sort === "best-selling") {
    const sales = await db.select({ productId: orderItems.productId, units: sql<number>`sum(${orderItems.quantity})`.as("units") })
      .from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(eq(orders.mode, "live"), eq(orders.paymentStatus, "paid")))
      .groupBy(orderItems.productId).orderBy(desc(sql`sum(${orderItems.quantity})`));
    if (!sales.length) throw new Error("Best-selling sort is unavailable until verified live paid sales exist");
    const ranks = new Map(sales.map((item, index) => [item.productId, index]));
    rows = [...rows].sort((a, b) => (ranks.get(a.id) ?? 999999) - (ranks.get(b.id) ?? 999999));
  }
  const total = rows.length;
  const pageSize = Math.min(Math.max(filters.pageSize ?? 24, 1), 60);
  const page = Math.max(filters.page ?? 1, 1);
  const paged = rows.slice((page - 1) * pageSize, page * pageSize);
  return { products: await hydrateProducts(paged), total, page, pageSize };
}

export async function getProduct(slug: string) {
  if (isLocalDemoPreview) return localDemoProduct(slug);
  await ensureSeeded();
  const db = await dbOrThrow();
  const [row] = await db.select({
    id: products.id, slug: products.slug, name: products.name, description: products.description, categoryId: products.categoryId,
    categorySlug: categories.slug, categoryName: categories.name, gender: products.gender, productType: products.productType,
    sport: products.sport, price: products.price, originalPrice: products.originalPrice, featured: products.featured,
    newArrival: products.newArrival, active: products.active, archived: products.archived, isDemo: products.isDemo, createdAt: products.createdAt,
  }).from(products).innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.slug, slug), eq(products.active, true), eq(products.archived, false))).limit(1);
  return row ? (await hydrateProducts([row]))[0] ?? null : null;
}

export async function getProductsBySlugs(slugs: string[]) {
  const requested = [...new Set(slugs)].slice(0, 100);
  if (!requested.length) return [];
  if (isLocalDemoPreview) return localDemoProductsBySlugs(requested);
  await ensureSeeded();
  const db = await dbOrThrow();
  const rows = await db.select({
    id: products.id, slug: products.slug, name: products.name, description: products.description,
    categoryId: products.categoryId, categorySlug: categories.slug, categoryName: categories.name,
    gender: products.gender, productType: products.productType, sport: products.sport, price: products.price,
    originalPrice: products.originalPrice, featured: products.featured, newArrival: products.newArrival,
    active: products.active, archived: products.archived, isDemo: products.isDemo, createdAt: products.createdAt,
  }).from(products).innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(inArray(products.slug, requested), eq(products.active, true), eq(products.archived, false)));
  const bySlug = new Map((await hydrateProducts(rows)).map(product => [product.slug, product]));
  return requested.flatMap(slug => { const product = bySlug.get(slug); return product ? [product] : []; });
}

export async function listSitemapProducts() {
  if (isLocalDemoPreview) return localDemoSitemapProducts();
  await ensureSeeded();
  const db = await dbOrThrow();
  return db.select({ slug: products.slug }).from(products)
    .where(and(eq(products.active, true), eq(products.archived, false))).orderBy(asc(products.slug));
}

export async function getUserWishlist(userId: number) {
  await ensureSeeded();
  const db = await dbOrThrow();
  return db.select({ productId: wishlistItems.productId, slug: products.slug }).from(wishlistItems)
    .innerJoin(products, eq(wishlistItems.productId, products.id)).where(eq(wishlistItems.userId, userId));
}

export async function toggleWishlist(userId: number, productId: number) {
  const db = await dbOrThrow();
  const [existing] = await db.select({ id: wishlistItems.id }).from(wishlistItems)
    .where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId))).limit(1);
  if (existing) await db.delete(wishlistItems).where(eq(wishlistItems.id, existing.id));
  else await db.insert(wishlistItems).values({ userId, productId });
  return { added: !existing };
}

export async function readUserCart(userId: number): Promise<CartLine[]> {
  const db = await dbOrThrow();
  const [cart] = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
  if (!cart) return [];
  return db.select({ variantId: cartItems.variantId, quantity: cartItems.quantity }).from(cartItems).where(eq(cartItems.cartId, cart.id));
}

export async function saveUserCart(userId: number, lines: CartLine[]) {
  const db = await dbOrThrow();
  await db.transaction(async tx => {
    let [cart] = await tx.select().from(carts).where(eq(carts.userId, userId)).limit(1);
    if (!cart) {
      await tx.insert(carts).values({ userId });
      [cart] = await tx.select().from(carts).where(eq(carts.userId, userId)).limit(1);
    }
    if (!cart) throw new Error("Could not create cart");
    await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
    const merged = new Map<number, number>();
    for (const line of lines) if (Number.isInteger(line.quantity) && line.quantity > 0) merged.set(line.variantId, Math.min(25, (merged.get(line.variantId) ?? 0) + line.quantity));
    for (const [variantId, quantity] of merged) {
      const [variant] = await tx.select().from(productVariants).where(and(eq(productVariants.id, variantId), eq(productVariants.active, true))).limit(1);
      if (variant && variant.stock >= quantity) await tx.insert(cartItems).values({ cartId: cart.id, variantId, quantity });
    }
  });
  return { saved: true };
}

export async function listAddresses(userId: number) {
  const db = await dbOrThrow();
  return db.select().from(addresses).where(eq(addresses.userId, userId)).orderBy(desc(addresses.isDefault), desc(addresses.id));
}

export async function addAddress(userId: number, address: Omit<CheckoutAddress, "email"> & { label?: string; isDefault?: boolean }) {
  const db = await dbOrThrow();
  await db.transaction(async tx => {
    if (address.isDefault) await tx.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
    await tx.insert(addresses).values({ userId, label: address.label ?? "Home", recipientName: address.customerName, phone: address.phone,
      line1: address.addressLine1, line2: address.addressLine2 ?? null, city: address.city, state: address.state, pinCode: address.pinCode, isDefault: address.isDefault ?? false });
  });
  return { saved: true };
}

function normalizeCartLines(lines: CartLine[]): CartLine[] {
  const quantities = new Map<number, number>();
  for (const line of lines) {
    if (!Number.isInteger(line.variantId) || line.variantId < 1 || !Number.isInteger(line.quantity) || line.quantity < 1) throw new Error("Invalid cart line");
    const quantity = (quantities.get(line.variantId) ?? 0) + line.quantity;
    if (quantity > 25) throw new Error("The maximum quantity of one variant is 25");
    quantities.set(line.variantId, quantity);
  }
  if (quantities.size > 60) throw new Error("The cart has too many lines");
  return [...quantities].map(([variantId, quantity]) => ({ variantId, quantity }));
}

async function validateCartLines(executor: any, lines: CartLine[]) {
  if (!lines.length) throw new Error("Your cart is empty");
  const snapshot: Array<{ variantId: number; productId: number; sku: string; name: string; variant: string; image: string; quantity: number; unitPrice: number; lineTotal: number }> = [];
  let subtotal = 0;
  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 25) throw new Error("Invalid quantity");
    const [variant] = await executor.select().from(productVariants)
      .where(and(eq(productVariants.id, line.variantId), eq(productVariants.active, true))).for("update").limit(1);
    if (!variant) throw new Error("A selected option is no longer available");
    const [product] = await executor.select().from(products).where(and(eq(products.id, variant.productId), eq(products.active, true))).limit(1);
    if (!product) throw new Error("A selected product is no longer available");
    if (variant.stock < line.quantity) throw new Error(`Only ${variant.stock} of ${product.name} (${variant.size}, ${variant.color}) remain`);
    const unitPrice = variant.price ?? product.price;
    const lineTotal = unitPrice * line.quantity;
    subtotal += lineTotal;
    const [image] = await executor.select().from(productImages).where(eq(productImages.productId, product.id)).orderBy(asc(productImages.position)).limit(1);
    snapshot.push({ variantId: variant.id, productId: product.id, sku: variant.sku, name: product.name,
      variant: `${variant.color} / ${variant.size}`, image: image?.url ?? "", quantity: line.quantity, unitPrice, lineTotal });
  }
  return { snapshot, subtotal };
}

async function calculateCoupon(executor: any, couponCode: string | undefined, subtotal: number) {
  let discount = 0;
  let normalizedCoupon: string | null = null;
  if (couponCode?.trim()) {
    const code = couponCode.trim().toUpperCase();
    const [coupon] = await executor.select().from(coupons).where(eq(coupons.code, code)).limit(1);
    if (!coupon || !coupon.active || (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) || (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) || subtotal < coupon.minimumSubtotal) {
      throw new Error("That coupon is invalid or the cart does not meet its minimum");
    }
    discount = coupon.discountType === "percent" ? Math.floor(subtotal * coupon.discountValue / 100) : Math.min(subtotal, coupon.discountValue);
    normalizedCoupon = coupon.code;
  }
  return { discount, normalizedCoupon };
}

export async function quoteCart(lines: CartLine[], couponCode?: string) {
  if (isLocalDemoPreview) return localDemoQuote(lines, couponCode);
  await ensureSeeded();
  const db = await dbOrThrow();
  const { snapshot, subtotal } = await validateCartLines(db, normalizeCartLines(lines));
  const { discount, normalizedCoupon } = await calculateCoupon(db, couponCode, subtotal);
  const configuredShipping = await readShippingRules();
  const shipping = subtotal - discount >= configuredShipping.freeShippingThreshold ? 0 : configuredShipping.flatRate;
  const tax = 0;
  return { items: snapshot.map(item => ({ variantId: item.variantId, name: item.name, variant: item.variant, image: item.image,
    quantity: item.quantity, unitPrice: item.unitPrice, lineTotal: item.lineTotal })), subtotal, discount, shipping, tax,
    shippingRule: { flatRate: configuredShipping.flatRate, freeShippingThreshold: configuredShipping.freeShippingThreshold },
    total: subtotal - discount + shipping + tax, couponCode: normalizedCoupon, paymentMode: "demo" as const,
    stockValidated: true, shippingNote: "Demonstration shipping rule; no carrier or PIN-code serviceability integration is connected." };
}

async function findIdempotentDemoOrder(executor: any, idempotencyKey: string, userId: number | null, lines: CartLine[], details: CheckoutAddress, couponCode?: string): Promise<OrderSummary | null> {
  const [order] = await executor.select().from(orders).where(eq(orders.idempotencyKey, idempotencyKey)).limit(1);
  if (!order) return null;
  const expectedLines = normalizeCartLines(lines).map(line => `${line.variantId}:${line.quantity}`).sort();
  const savedItems = await executor.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  const actualLines = savedItems.map((item: typeof orderItems.$inferSelect) => `${item.variantId}:${item.quantity}`).sort();
  const requestedCoupon = couponCode?.trim().toUpperCase() || null;
  const normalizeText = (value: string | null | undefined) => (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
  const normalizePhone = (value: string | null | undefined) => (value ?? "").replace(/\D/g, "");
  const sameDetails = order.userId === userId
    && normalizeText(order.customerName) === normalizeText(details.customerName)
    && normalizeText(order.email) === normalizeText(details.email)
    && normalizePhone(order.phone) === normalizePhone(details.phone)
    && normalizeText(order.addressLine1) === normalizeText(details.addressLine1)
    && normalizeText(order.addressLine2) === normalizeText(details.addressLine2)
    && normalizeText(order.city) === normalizeText(details.city)
    && normalizeText(order.state) === normalizeText(details.state)
    && normalizeText(order.pinCode) === normalizeText(details.pinCode);
  if (!sameDetails || JSON.stringify(expectedLines) !== JSON.stringify(actualLines) || order.couponCode !== requestedCoupon) {
    throw new Error("This checkout key was already used with different account, contact, delivery, cart or coupon details. No duplicate was created; update the details and retry.");
  }
  return { id: order.id, orderNumber: order.orderNumber, customerName: order.customerName, email: order.email, phone: order.phone,
    addressLine1: order.addressLine1, addressLine2: order.addressLine2, city: order.city, state: order.state, pinCode: order.pinCode,
    subtotal: order.subtotal, discount: order.discount, shipping: order.shipping, tax: order.tax, total: order.total, couponCode: order.couponCode,
    mode: "demo", status: order.status, paymentStatus: order.paymentStatus, trackingReference: order.trackingReference, createdAt: order.createdAt,
    items: savedItems.map((item: typeof orderItems.$inferSelect) => ({ sku: item.skuSnapshot, name: item.productNameSnapshot, variant: item.variantSnapshot,
      image: item.imageSnapshot, quantity: item.quantity, unitPrice: item.unitPrice, lineTotal: item.lineTotal })) };
}

export async function createDemoOrder(userId: number | null, details: CheckoutAddress, lines: CartLine[], couponCode: string | undefined, idempotencyKey: string) {
  await ensureSeeded();
  const db = await dbOrThrow();
  const existingOrder = await findIdempotentDemoOrder(db, idempotencyKey, userId, lines, details, couponCode);
  if (existingOrder) return existingOrder;
  const id = randomUUID();
  const orderNumber = `SP-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;
  const configuredShipping = await readShippingRules();
  try {
    return await db.transaction(async tx => {
      const { snapshot, subtotal } = await validateCartLines(tx, normalizeCartLines(lines));
      const { discount, normalizedCoupon } = await calculateCoupon(tx, couponCode, subtotal);
      const shipping = subtotal - discount >= configuredShipping.freeShippingThreshold ? 0 : configuredShipping.flatRate;
      const tax = 0;
      for (const item of snapshot) {
        const [updated] = await tx.update(productVariants).set({ stock: sql`${productVariants.stock} - ${item.quantity}` })
          .where(and(eq(productVariants.id, item.variantId), gte(productVariants.stock, item.quantity)));
        if (updated.affectedRows !== 1) throw new Error("Inventory changed while preparing the order");
      }
      if (normalizedCoupon) await tx.update(coupons).set({ usedCount: sql`${coupons.usedCount} + 1` }).where(eq(coupons.code, normalizedCoupon));
      await tx.insert(orders).values({ id, orderNumber, idempotencyKey, userId, customerName: details.customerName.trim(), email: details.email.trim().toLowerCase(), phone: details.phone.trim(),
        addressLine1: details.addressLine1.trim(), addressLine2: details.addressLine2?.trim() || null, city: details.city.trim(), state: details.state.trim(), pinCode: details.pinCode.trim(),
        subtotal, discount, shipping, tax, total: subtotal - discount + shipping + tax, couponCode: normalizedCoupon, mode: "demo", status: "pending", paymentStatus: "demo_pending" });
      await tx.insert(orderItems).values(snapshot.map(item => ({ orderId: id, productId: item.productId, variantId: item.variantId, skuSnapshot: item.sku,
        productNameSnapshot: item.name, variantSnapshot: item.variant, imageSnapshot: item.image, quantity: item.quantity, unitPrice: item.unitPrice, lineTotal: item.lineTotal })));
      const total = subtotal - discount + shipping + tax;
      await tx.insert(paymentRecords).values({ orderId: id, provider: "demo", status: "demo_simulated", amount: total });
      if (userId) {
        const [cart] = await tx.select().from(carts).where(eq(carts.userId, userId)).limit(1);
        if (cart) await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
      }
      return { id, orderNumber, customerName: details.customerName, email: details.email, phone: details.phone,
        addressLine1: details.addressLine1, addressLine2: details.addressLine2 ?? null, city: details.city, state: details.state, pinCode: details.pinCode,
        subtotal, discount, shipping, tax, total, couponCode: normalizedCoupon, mode: "demo" as const, status: "pending", paymentStatus: "demo_pending",
        trackingReference: null, createdAt: new Date(), items: snapshot.map(({ sku, name, variant, image, quantity, unitPrice, lineTotal }) => ({ sku, name, variant, image, quantity, unitPrice, lineTotal })) } satisfies OrderSummary;
    });
  } catch (error) {
    // A duplicate request can lose a stock race or hit the unique key after the first commit.
    // Return the already-committed order instead of making the user place it again.
    const committedOrder = await findIdempotentDemoOrder(db, idempotencyKey, userId, lines, details, couponCode);
    if (committedOrder) return committedOrder;
    throw error;
  }
}

export async function listUserOrders(userId: number) {
  const db = await dbOrThrow();
  const orderRows = await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  return Promise.all(orderRows.map(async order => ({ ...order, items: await db.select().from(orderItems).where(eq(orderItems.orderId, order.id)) })));
}

export async function getOwnedOrder(userId: number, orderId: string) {
  const db = await dbOrThrow();
  const [order] = await db.select().from(orders).where(and(eq(orders.userId, userId), eq(orders.id, orderId))).limit(1);
  if (!order) return null;
  return { ...order, items: await db.select().from(orderItems).where(eq(orderItems.orderId, order.id)) };
}

export async function updateUserDisplayName(userId: number, name: string) {
  const normalized = name.trim();
  if (normalized.length < 2 || normalized.length > 80) throw new Error("Display name must be between 2 and 80 characters");
  const db = await dbOrThrow();
  await db.update(users).set({ name: normalized }).where(eq(users.id, userId));
  return { updated: true, name: normalized };
}

export async function requestReturn(userId: number, orderId: string, reason: string) {
  const db = await dbOrThrow();
  const [order] = await db.select().from(orders).where(and(eq(orders.userId, userId), eq(orders.id, orderId))).limit(1);
  if (!order || order.status !== "delivered") throw new Error("Return requests can only be submitted on a delivered order; final policy eligibility requires business configuration");
  const [duplicate] = await db.select({ id: returnRequests.id }).from(returnRequests).where(and(eq(returnRequests.orderId, orderId), eq(returnRequests.userId, userId), eq(returnRequests.status, "requested"))).limit(1);
  if (duplicate) throw new Error("A return request is already awaiting review");
  await db.insert(returnRequests).values({ orderId, userId, reason: reason.trim(), status: "requested" });
  await db.update(orders).set({ status: "return_requested" }).where(eq(orders.id, orderId));
  return { submitted: true };
}

export async function subscribeNewsletter(email: string, consent: boolean) {
  if (!consent) throw new Error("Consent is required");
  const db = await dbOrThrow();
  const normalized = email.trim().toLowerCase();
  const [existing] = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, normalized)).limit(1);
  if (existing) {
    if (existing.status === "unsubscribed") await db.update(newsletterSubscribers).set({ status: "subscribed", consent: true }).where(eq(newsletterSubscribers.id, existing.id));
    return { subscribed: true, alreadySubscribed: existing.status === "subscribed" };
  }
  await db.insert(newsletterSubscribers).values({ email: normalized, consent: true, status: "subscribed" });
  return { subscribed: true, alreadySubscribed: false };
}

export async function saveSupportMessage(input: { name: string; email: string; subject: string; message: string; consent: boolean }) {
  if (!input.consent) throw new Error("Consent is required before saving a support message");
  const db = await dbOrThrow();
  await db.insert(supportMessages).values({ name: input.name.trim(), email: input.email.trim().toLowerCase(), subject: input.subject.trim(), message: input.message.trim(), consent: true, status: "open" });
  return { saved: true };
}

export async function adminOverview() {
  const db = await dbOrThrow();
  const [orderCount] = await db.select({ value: sql<number>`count(*)`.as("value") }).from(orders);
  const [pendingCount] = await db.select({ value: sql<number>`count(*)`.as("value") }).from(orders).where(eq(orders.status, "pending"));
  const [paidRevenue] = await db.select({ value: sql<number>`coalesce(sum(${orders.total}),0)`.as("value") }).from(orders).where(and(eq(orders.mode, "live"), eq(orders.paymentStatus, "paid")));
  const [productCount] = await db.select({ value: sql<number>`count(*)`.as("value") }).from(products).where(eq(products.archived, false));
  const [customerCount] = await db.select({ value: sql<number>`count(*)`.as("value") }).from(users).where(eq(users.role, "user"));
  const lowStock = await db.select({ variantId: productVariants.id, sku: productVariants.sku, size: productVariants.size, color: productVariants.color, stock: productVariants.stock, productName: products.name })
    .from(productVariants).innerJoin(products, eq(productVariants.productId, products.id)).where(and(eq(productVariants.active, true), lte(productVariants.stock, 4))).orderBy(asc(productVariants.stock)).limit(20);
  return { productCount: Number(productCount?.value ?? 0), customerCount: Number(customerCount?.value ?? 0), orderCount: Number(orderCount?.value ?? 0), pendingCount: Number(pendingCount?.value ?? 0), paidRevenue: Number(paidRevenue?.value ?? 0), lowStock };
}

export async function adminListOrders() {
  const db = await dbOrThrow();
  const orderRows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(100);
  return Promise.all(orderRows.map(async order => ({ ...order, items: await db.select().from(orderItems).where(eq(orderItems.orderId, order.id)) })));
}

export async function adminSetOrderStatus(orderId: string, status: "processing" | "shipped" | "delivered" | "cancelled", trackingReference?: string) {
  const db = await dbOrThrow();
  await db.transaction(async tx => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).for("update").limit(1);
    if (!order) throw new Error("Order not found");
    if (order.status === status) return;
    const allowedTransitions: Record<string, string[]> = { pending: ["processing", "cancelled"], processing: ["shipped", "cancelled"], shipped: ["delivered"], delivered: [], cancelled: [], return_requested: [], returned: [] };
    if (!allowedTransitions[order.status]?.includes(status)) throw new Error(`Order cannot transition from ${order.status} to ${status}`);
    if (status === "cancelled") {
      if (order.mode === "live" && order.paymentStatus === "paid") throw new Error("Refund a live payment through the configured provider before cancellation");
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
      for (const item of items) {
        if (!item.variantId) continue;
        const [variant] = await tx.select().from(productVariants).where(eq(productVariants.id, item.variantId)).for("update").limit(1);
        if (variant) await tx.update(productVariants).set({ stock: variant.stock + item.quantity }).where(eq(productVariants.id, variant.id));
      }
    }
    await tx.update(orders).set({ status, trackingReference: trackingReference ?? order.trackingReference }).where(eq(orders.id, orderId));
  });
  return { updated: true };
}

export async function adminProducts() {
  await ensureSeeded();
  const db = await dbOrThrow();
  const rows = await db.select({ id: products.id, slug: products.slug, name: products.name, description: products.description,
    categoryId: products.categoryId, categorySlug: categories.slug, categoryName: categories.name, gender: products.gender,
    productType: products.productType, sport: products.sport, price: products.price, originalPrice: products.originalPrice,
    featured: products.featured, newArrival: products.newArrival, active: products.active, archived: products.archived,
    isDemo: products.isDemo, createdAt: products.createdAt }).from(products).innerJoin(categories, eq(products.categoryId, categories.id)).orderBy(desc(products.createdAt)).limit(200);
  return hydrateProducts(rows, true);
}

export async function adminCreateProduct(input: { name: string; slug: string; description: string; categorySlug: string; gender: string; productType: string; sport: string; price: number; originalPrice?: number; images: string[]; sizes: string[]; color: string }) {
  const db = await dbOrThrow();
  const [category] = await db.select().from(categories).where(eq(categories.slug, input.categorySlug)).limit(1);
  if (!category) throw new Error("Choose a valid category");
  const slug = input.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-");
  await db.transaction(async tx => {
    await tx.insert(products).values({ slug, name: input.name.trim(), description: input.description.trim(), categoryId: category.id,
      gender: input.gender, productType: input.productType, sport: input.sport, price: input.price, originalPrice: input.originalPrice && input.originalPrice > input.price ? input.originalPrice : null, active: true, isDemo: true });
    const [product] = await tx.select().from(products).where(eq(products.slug, slug)).limit(1);
    if (!product) throw new Error("Product could not be created");
    await tx.insert(productImages).values(input.images.map((url, position) => ({ productId: product.id, url, alt: `${input.name} demonstration image ${position + 1}`, position })));
    await tx.insert(productVariants).values(input.sizes.map((size, index) => ({ productId: product.id,
      sku: `${slug.replace(/-/g, "").toUpperCase().slice(0, 10)}-${index + 1}`, size, color: input.color, colorHex: "#242724", stock: 10, active: true })));
  });
  return { created: true };
}

export async function adminUpdateProduct(input: {
  id: number; name?: string; description?: string; price?: number; originalPrice?: number | null; active?: boolean;
  categorySlug?: string; gender?: string; productType?: string; sport?: string; featured?: boolean; newArrival?: boolean; archived?: boolean; images?: string[];
}) {
  const db = await dbOrThrow();
  const [current] = await db.select().from(products).where(eq(products.id, input.id)).limit(1);
  if (!current) throw new Error("Product not found");
  const patch: Partial<typeof products.$inferInsert> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.description !== undefined) patch.description = input.description.trim();
  if (input.price !== undefined) patch.price = input.price;
  if (input.originalPrice !== undefined) {
    const currentPrice = input.price ?? current.price;
    patch.originalPrice = input.originalPrice !== null && input.originalPrice > currentPrice ? input.originalPrice : null;
  }
  if (input.active !== undefined) patch.active = input.active;
  if (input.archived !== undefined) { patch.archived = input.archived; if (input.archived) patch.active = false; }
  if (input.gender !== undefined) patch.gender = input.gender;
  if (input.productType !== undefined) patch.productType = input.productType;
  if (input.sport !== undefined) patch.sport = input.sport;
  if (input.featured !== undefined) patch.featured = input.featured;
  if (input.newArrival !== undefined) patch.newArrival = input.newArrival;
  if (input.categorySlug !== undefined) {
    const [category] = await db.select().from(categories).where(eq(categories.slug, input.categorySlug)).limit(1);
    if (!category) throw new Error("Choose a valid category");
    patch.categoryId = category.id;
  }
  await db.transaction(async tx => {
    if (Object.keys(patch).length) await tx.update(products).set(patch).where(eq(products.id, input.id));
    if (input.images) {
      if (!input.images.length) throw new Error("A published product must keep at least one image");
      await tx.delete(productImages).where(eq(productImages.productId, input.id));
      await tx.insert(productImages).values(input.images.map((url, position) => ({ productId: input.id, url, alt: `${input.name ?? current.name} demonstration image ${position + 1}`, position })));
    }
  });
  return { updated: true };
}
export async function adminUpdateVariant(input: { id: number; sku: string; size: string; color: string; colorHex: string; stock: number; price?: number | null; active: boolean }) {
  const db = await dbOrThrow();
  const [variant] = await db.select().from(productVariants).where(eq(productVariants.id, input.id)).limit(1);
  if (!variant) throw new Error("Product variant not found");
  await db.update(productVariants).set({ sku: input.sku.trim(), size: input.size.trim(), color: input.color.trim(), colorHex: input.colorHex.trim(), stock: input.stock, active: input.active,
    ...(input.price !== undefined ? { price: input.price } : {}) }).where(eq(productVariants.id, input.id));
  return { updated: true };
}
export async function adminUpdateStock(variantId: number, stock: number) {
  const db = await dbOrThrow();
  await db.update(productVariants).set({ stock }).where(eq(productVariants.id, variantId));
  return { updated: true };
}
export async function adminCreateCategory(input: { name: string; slug: string; description: string }) {
  const db = await dbOrThrow();
  await db.insert(categories).values({ name: input.name.trim(), slug: input.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-"), description: input.description.trim() });
  return { created: true };
}
export async function adminListCoupons() { const db = await dbOrThrow(); return db.select().from(coupons).orderBy(asc(coupons.code)); }
export async function adminCreateCoupon(input: { code: string; discountType: "percent" | "fixed"; discountValue: number; minimumSubtotal: number }) {
  const db = await dbOrThrow();
  if (input.discountType === "percent" && input.discountValue > 100) throw new Error("Percentage discount cannot exceed 100");
  await db.insert(coupons).values({ code: input.code.trim().toUpperCase(), discountType: input.discountType, discountValue: input.discountValue, minimumSubtotal: input.minimumSubtotal, active: true });
  return { created: true };
}
export async function adminUpdateCoupon(input: { id: number; active?: boolean; discountType?: "percent" | "fixed"; discountValue?: number; minimumSubtotal?: number }) {
  const db = await dbOrThrow();
  if (input.discountType === "percent" && input.discountValue !== undefined && input.discountValue > 100) throw new Error("Percentage discount cannot exceed 100");
  const patch: Partial<typeof coupons.$inferInsert> = {};
  if (input.active !== undefined) patch.active = input.active;
  if (input.discountType !== undefined) patch.discountType = input.discountType;
  if (input.discountValue !== undefined) patch.discountValue = input.discountValue;
  if (input.minimumSubtotal !== undefined) patch.minimumSubtotal = input.minimumSubtotal;
  await db.update(coupons).set(patch).where(eq(coupons.id, input.id));
  return { updated: true };
}

export async function adminCustomers(search?: string) {
  const db = await dbOrThrow();
  const term = search?.trim().toLocaleLowerCase();
  const whereTerm = term ? or(like(sql`LOWER(COALESCE(${users.name}, ''))`, `%${term}%`), like(sql`LOWER(COALESCE(${users.email}, ''))`, `%${term}%`)) : undefined;
  const rows = await db.select({ id: users.id, name: users.name, email: users.email, createdAt: users.createdAt })
    .from(users).where(and(eq(users.role, "user"), whereTerm)).orderBy(desc(users.createdAt)).limit(100);
  if (!rows.length) return [];
  const ids = rows.map(customer => customer.id);
  const orderSummaries = await db.select({ userId: orders.userId, orderCount: sql<number>`count(*)`, lastOrderAt: sql<Date | null>`max(${orders.createdAt})` })
    .from(orders).where(inArray(orders.userId, ids)).groupBy(orders.userId);
  const summaries = new Map(orderSummaries.filter(item => item.userId !== null).map(item => [item.userId as number, { orderCount: Number(item.orderCount), lastOrderAt: item.lastOrderAt }]));
  return rows.map(customer => ({ ...customer, ...(summaries.get(customer.id) ?? { orderCount: 0, lastOrderAt: null }) }));
}
export async function adminNewsletter() { const db = await dbOrThrow(); return db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.createdAt)).limit(200); }
export async function adminSupportMessages() { const db = await dbOrThrow(); return db.select().from(supportMessages).orderBy(desc(supportMessages.createdAt)).limit(200); }
export async function setSupportMessageStatus(id: number, status: "open" | "resolved") { const db = await dbOrThrow(); await db.update(supportMessages).set({ status }).where(eq(supportMessages.id, id)); return { updated: true }; }

export async function adminReturnRequests() {
  const db = await dbOrThrow();
  return db.select({ id: returnRequests.id, orderId: returnRequests.orderId, userId: returnRequests.userId, reason: returnRequests.reason,
    status: returnRequests.status, refundAmount: returnRequests.refundAmount, createdAt: returnRequests.createdAt,
    orderNumber: orders.orderNumber, customerName: orders.customerName, email: orders.email })
    .from(returnRequests).innerJoin(orders, eq(returnRequests.orderId, orders.id)).orderBy(desc(returnRequests.createdAt)).limit(100);
}
type ReturnRequestStatus = "requested" | "approved" | "rejected" | "received" | "refunded";
const returnStatusTransitions: Record<ReturnRequestStatus, readonly ReturnRequestStatus[]> = {
  requested: ["approved", "rejected"], approved: ["received"], received: ["refunded"], rejected: [], refunded: [],
};
export async function setReturnRequestStatus(id: number, status: "approved" | "rejected" | "received" | "refunded", refundAmount?: number) {
  const db = await dbOrThrow();
  return db.transaction(async tx => {
    const [request] = await tx.select().from(returnRequests).where(eq(returnRequests.id, id)).limit(1).for("update");
    if (!request) throw new Error("Return request not found");
    if (!returnStatusTransitions[request.status].includes(status)) {
      throw new Error(`Return request cannot move from ${request.status} to ${status}`);
    }
    if (refundAmount !== undefined && status !== "refunded") throw new Error("A refund amount can only be recorded in the final return step");
    if (refundAmount !== undefined && (refundAmount < 0 || !Number.isInteger(refundAmount))) throw new Error("Refund amount must be a non-negative whole INR amount");
    const [order] = await tx.select().from(orders).where(eq(orders.id, request.orderId)).limit(1).for("update");
    if (!order || order.status !== "return_requested") throw new Error("The linked order is not awaiting a return decision");
    if (status === "refunded" && refundAmount !== undefined && refundAmount > order.total) throw new Error("Recorded refund cannot exceed the order total");
    await tx.update(returnRequests).set({ status, ...(refundAmount !== undefined ? { refundAmount } : {}) })
      .where(and(eq(returnRequests.id, id), eq(returnRequests.status, request.status)));
    if (status === "rejected") await tx.update(orders).set({ status: "delivered" }).where(and(eq(orders.id, request.orderId), eq(orders.status, "return_requested")));
    if (status === "refunded") await tx.update(orders).set({ status: "returned" }).where(and(eq(orders.id, request.orderId), eq(orders.status, "return_requested")));
    return { updated: true };
  });
}
export async function adminUpdateTracking(orderId: string, trackingReference: string) {
  const db = await dbOrThrow();
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) throw new Error("Order not found");
  await db.update(orders).set({ trackingReference: trackingReference.trim() || null }).where(eq(orders.id, orderId));
  return { updated: true };
}

const defaultStorefrontConfig = {
  announcement: "DEMO STORE · Product, inventory, payment and delivery details are samples pending business setup",
  campaignEyebrow: "For the work you put in",
  campaignHeadline: "YOUR GAME. YOUR GEAR.",
  campaignBody: "Find the layers, jerseys and training essentials built around your movement. This sample collection is ready for verified product details and supplier imagery.",
  featuredProductIds: [] as number[],
};
export async function getStorefrontConfig() {
  if (isLocalDemoPreview) return localDemoStorefront();
  const db = await dbOrThrow();
  const [row] = await db.select().from(adminSettings).where(eq(adminSettings.settingKey, "storefront_config")).limit(1);
  if (!row) return defaultStorefrontConfig;
  try {
    const value = JSON.parse(row.settingValue) as Partial<typeof defaultStorefrontConfig>;
    return { ...defaultStorefrontConfig, ...value, featuredProductIds: Array.isArray(value.featuredProductIds) ? value.featuredProductIds.filter(Number.isInteger) : [] };
  } catch { return defaultStorefrontConfig; }
}
export async function getAdminSettings() { return { ...(await getStoreSettings()), storefront: await getStorefrontConfig() }; }
export async function updateStorefrontConfig(input: { announcement: string; campaignEyebrow: string; campaignHeadline: string; campaignBody: string; featuredProductIds: number[] }) {
  const db = await dbOrThrow();
  const settingValue = JSON.stringify(input);
  const [row] = await db.select().from(adminSettings).where(eq(adminSettings.settingKey, "storefront_config")).limit(1);
  if (row) await db.update(adminSettings).set({ settingValue }).where(eq(adminSettings.settingKey, "storefront_config"));
  else await db.insert(adminSettings).values({ settingKey: "storefront_config", settingValue });
  return { updated: true };
}

export async function cancelUserDemoOrder(userId: number, orderId: string) {
  const db = await dbOrThrow();
  await db.transaction(async tx => {
    const [order] = await tx.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.userId, userId))).for("update").limit(1);
    if (!order) throw new Error("Order not found");
    if (order.mode !== "demo" || order.paymentStatus !== "demo_pending" || order.status !== "pending") throw new Error("Only unpaid pending demonstration orders can be cancelled here");
    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    for (const item of items) {
      if (!item.variantId) continue;
      const [variant] = await tx.select().from(productVariants).where(eq(productVariants.id, item.variantId)).for("update").limit(1);
      if (variant) await tx.update(productVariants).set({ stock: variant.stock + item.quantity }).where(eq(productVariants.id, variant.id));
    }
    await tx.update(orders).set({ status: "cancelled" }).where(eq(orders.id, orderId));
  });
  return { cancelled: true };
}
