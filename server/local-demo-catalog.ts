import { seedCategories, seedProducts, shippingRules } from "../shared/catalog";
import { effectiveAvailability, isSaleEligible } from "../shared/catalog-filters";
import type { CartLine, StoreCategory, StoreProduct } from "../shared/store-types";

type LocalProductFilters = {
  collection?: string; category?: string; gender?: string; size?: string; color?: string; sport?: string;
  productType?: string; minPrice?: number; maxPrice?: number; available?: boolean; search?: string;
  sort?: "featured" | "newest" | "price-asc" | "price-desc" | "best-selling"; page?: number; pageSize?: number;
};

export const isLocalDemoPreview = process.env.NODE_ENV !== "production" && !process.env.DATABASE_URL;

const categoryRows: StoreCategory[] = seedCategories.map((category, index) => ({ ...category, id: index + 1 }));
const categoryBySlug = new Map(categoryRows.map(category => [category.slug, category]));

const products: StoreProduct[] = seedProducts.map((seed, productIndex) => {
  const productId = productIndex + 1;
  const category = categoryBySlug.get(seed.category)!;
  return {
    id: productId,
    slug: seed.slug,
    name: seed.name,
    description: seed.description,
    categoryId: category.id,
    categorySlug: category.slug,
    categoryName: category.name,
    gender: seed.gender,
    productType: seed.productType,
    sport: seed.sport,
    price: seed.price,
    originalPrice: seed.originalPrice ?? null,
    featured: seed.featured ?? false,
    newArrival: seed.newArrival ?? false,
    active: true,
    archived: false,
    isDemo: true,
    createdAt: new Date(Date.UTC(2026, 0, productIndex + 1)),
    images: [{ url: seed.image, alt: seed.imageAlt }],
    variants: seed.variants.map((variant, variantIndex) => ({
      id: productId * 1000 + variantIndex + 1,
      productId,
      sku: `${seed.slug.toUpperCase().replace(/-/g, "").slice(0, 10)}-${variant.skuSuffix}`,
      size: variant.size,
      color: variant.color,
      colorHex: variant.colorHex,
      price: null,
      stock: variant.stock,
      active: true,
    })),
  };
});

export function localDemoCategories() {
  return categoryRows;
}

export function localDemoStorefront() {
  return {
    announcement: "DEMO PREVIEW · Read-only repository catalog; no database, account or payment writes are enabled",
    campaignEyebrow: "For the work you put in",
    campaignHeadline: "YOUR GAME. YOUR GEAR.",
    campaignBody: "This isolated preview uses the checked-in SPORTIKA demonstration catalog. Connect an authorized database before testing accounts, inventory or orders.",
    featuredProductIds: [],
  };
}

function collectionMatches(product: StoreProduct, collection?: string) {
  const slug = collection?.toLowerCase();
  if (!slug || slug === "collections" || slug === "all") return true;
  if (slug === "men") return product.gender === "Men" || product.gender === "Unisex";
  if (slug === "women") return product.gender === "Women" || product.gender === "Unisex";
  if (slug === "new-arrivals") return product.newArrival;
  if (slug === "sale") return isSaleEligible(product, product.variants);
  if (slug === "shoes" || slug === "accessories") return product.categorySlug === slug;
  return product.categorySlug === slug;
}

function matchingVariants(product: StoreProduct, filters: LocalProductFilters) {
  const availability = effectiveAvailability(filters.collection, filters.available);
  return product.variants.filter(variant => {
    if (!variant.active) return false;
    if (filters.size && variant.size !== filters.size) return false;
    if (filters.color && variant.color !== filters.color) return false;
    if (availability === true && variant.stock < 1) return false;
    if (availability === false && variant.stock !== 0) return false;
    return true;
  });
}

export function localDemoListProducts(filters: LocalProductFilters = {}) {
  if (filters.sort === "best-selling") throw new Error("Best-selling sort is unavailable until verified live paid sales exist");
  const term = filters.search?.trim().toLowerCase();
  let rows = products.filter(product => {
    if (!collectionMatches(product, filters.collection)) return false;
    if (filters.category && product.categorySlug !== filters.category) return false;
    if (filters.gender && product.gender !== filters.gender) return false;
    if (filters.sport && product.sport !== filters.sport) return false;
    if (filters.productType && product.productType !== filters.productType) return false;
    if (term && ![product.name, product.description, product.sport, product.productType, product.categoryName, product.categorySlug].some(value => value.toLowerCase().includes(term))) return false;
    const variants = matchingVariants(product, filters);
    if ((filters.size || filters.color || filters.available !== undefined || filters.collection?.toLowerCase() === "sale") && !variants.length) return false;
    const effectivePrices = variants.length ? variants.map(variant => variant.price ?? product.price) : [product.price];
    if (filters.minPrice !== undefined && Math.max(...effectivePrices) < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && Math.min(...effectivePrices) > filters.maxPrice) return false;
    return true;
  });
  if (filters.sort === "newest") rows = [...rows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  else if (filters.sort === "price-asc") rows = [...rows].sort((a, b) => a.price - b.price);
  else if (filters.sort === "price-desc") rows = [...rows].sort((a, b) => b.price - a.price);
  else rows = [...rows].sort((a, b) => Number(b.featured) - Number(a.featured) || b.createdAt.getTime() - a.createdAt.getTime());
  const total = rows.length;
  const pageSize = Math.min(Math.max(filters.pageSize ?? 24, 1), 60);
  const page = Math.max(filters.page ?? 1, 1);
  return { products: rows.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize };
}

export function localDemoFacets(collection?: string) {
  const visible = products.filter(product => collectionMatches(product, collection));
  const variants = visible.flatMap(product => product.variants.filter(variant => variant.active && (collection?.toLowerCase() !== "sale" || variant.stock > 0)));
  const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
  return {
    genders: unique(visible.map(product => product.gender)),
    sizes: unique(variants.map(variant => variant.size)),
    colors: unique(variants.map(variant => variant.color)),
    sports: unique(visible.map(product => product.sport)),
    productTypes: unique(visible.map(product => product.productType)),
  };
}

export function localDemoProduct(slug: string) {
  return products.find(product => product.slug === slug) ?? null;
}

export function localDemoProductsBySlugs(slugs: string[]) {
  const requested = [...new Set(slugs)].slice(0, 100);
  const bySlug = new Map(products.map(product => [product.slug, product]));
  return requested.flatMap(slug => { const product = bySlug.get(slug); return product ? [product] : []; });
}

export function localDemoSitemapProducts() {
  return products.map(product => ({ slug: product.slug })).sort((a, b) => a.slug.localeCompare(b.slug));
}

export function localDemoShipping() {
  return shippingRules;
}

export function localDemoQuote(lines: CartLine[], couponCode?: string) {
  if (!lines.length) throw new Error("Your cart is empty");
  const byVariant = new Map(products.flatMap(product => product.variants.map(variant => [variant.id, { product, variant }] as const)));
  const snapshot = lines.map(line => {
    const found = byVariant.get(line.variantId);
    if (!found || !found.variant.active) throw new Error("A selected option is no longer available");
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 25) throw new Error("Invalid quantity");
    if (found.variant.stock < line.quantity) throw new Error(`Only ${found.variant.stock} of ${found.product.name} (${found.variant.size}, ${found.variant.color}) remain`);
    const unitPrice = found.variant.price ?? found.product.price;
    return { variantId: line.variantId, name: found.product.name, variant: `${found.variant.color} / ${found.variant.size}`, image: found.product.images[0]?.url ?? "", quantity: line.quantity, unitPrice, lineTotal: unitPrice * line.quantity };
  });
  const subtotal = snapshot.reduce((sum, item) => sum + item.lineTotal, 0);
  const normalizedCoupon = couponCode?.trim().toUpperCase() || null;
  const discount = normalizedCoupon === "MOVE10" && subtotal >= 999 ? Math.floor(subtotal * 0.1) : normalizedCoupon ? 0 : 0;
  if (normalizedCoupon && (!discount || normalizedCoupon !== "MOVE10")) throw new Error("That coupon is invalid or the cart does not meet its minimum");
  const shipping = subtotal - discount >= shippingRules.freeShippingThreshold ? 0 : shippingRules.flatRate;
  return {
    items: snapshot,
    subtotal,
    discount,
    shipping,
    tax: 0,
    shippingRule: { flatRate: shippingRules.flatRate, freeShippingThreshold: shippingRules.freeShippingThreshold },
    total: subtotal - discount + shipping,
    couponCode: normalizedCoupon,
    paymentMode: "demo" as const,
    stockValidated: true,
    shippingNote: "Read-only local preview rule; no carrier or PIN-code serviceability integration is connected.",
  };
}
