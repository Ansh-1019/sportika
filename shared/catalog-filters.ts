export function priceRangeError(minPrice?: number, maxPrice?: number): string | null {
  if (minPrice !== undefined && (!Number.isFinite(minPrice) || !Number.isInteger(minPrice) || minPrice < 0)) {
    return "Minimum price must be a non-negative whole number.";
  }
  if (maxPrice !== undefined && (!Number.isFinite(maxPrice) || !Number.isInteger(maxPrice) || maxPrice < 0)) {
    return "Maximum price must be a non-negative whole number.";
  }
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    return "Minimum price cannot be greater than maximum price.";
  }
  return null;
}

export function safeInternalReturnTo(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f]/.test(value)) {
    return "/";
  }

  try {
    const target = new URL(value, "https://sportika.invalid");
    if (target.origin !== "https://sportika.invalid") return "/";
    return `${target.pathname}${target.search}${target.hash}` || "/";
  } catch {
    return "/";
  }
}

export type SaleVariant = { active: boolean; stock: number };

export function isSaleEligible(product: { price: number; originalPrice: number | null }, variants: SaleVariant[]): boolean {
  return product.originalPrice !== null && product.originalPrice > product.price && variants.some(variant => variant.active && variant.stock > 0);
}

export function effectiveAvailability(collection: string | undefined, requested: boolean | undefined): boolean | undefined {
  return collection?.toLowerCase() === "sale" ? true : requested;
}
