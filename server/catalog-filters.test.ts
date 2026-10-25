import { describe, expect, it } from "vitest";
import { effectiveAvailability, isSaleEligible } from "../shared/catalog-filters";

describe("Selected Offers filter semantics", () => {
  it("requires a real markdown and at least one active in-stock variant", () => {
    expect(isSaleEligible({ price: 900, originalPrice: 1200 }, [{ active: true, stock: 2 }])).toBe(true);
    expect(isSaleEligible({ price: 1200, originalPrice: 1200 }, [{ active: true, stock: 2 }])).toBe(false);
    expect(isSaleEligible({ price: 900, originalPrice: 1200 }, [{ active: true, stock: 0 }])).toBe(false);
    expect(isSaleEligible({ price: 900, originalPrice: 1200 }, [{ active: false, stock: 4 }])).toBe(false);
  });

  it("forces in-stock availability for sale while preserving normal catalog availability", () => {
    expect(effectiveAvailability("sale", undefined)).toBe(true);
    expect(effectiveAvailability("sale", false)).toBe(true);
    expect(effectiveAvailability("men", false)).toBe(false);
    expect(effectiveAvailability(undefined, undefined)).toBeUndefined();
  });
});

describe.skipIf(!process.env.DATABASE_URL)("database-backed catalog filter combinations", () => {
  it("combines sale filters and returns an empty result for an impossible value", async () => {
    const { listProducts } = await import("./store");
    const sale = await listProducts({ collection: "sale", pageSize: 60 });
    expect(sale.products.every(product => product.originalPrice !== null && product.originalPrice > product.price && product.variants.some(variant => variant.stock > 0))).toBe(true);

    const candidate = sale.products[0];
    if (candidate) {
      const variant = candidate.variants.find(item => item.stock > 0);
      const combined = await listProducts({
        collection: "sale",
        gender: candidate.gender,
        sport: candidate.sport,
        productType: candidate.productType,
        size: variant?.size,
        color: variant?.color,
        minPrice: 0,
        maxPrice: 100000,
        pageSize: 60,
      });
      expect(combined.products.some(product => product.slug === candidate.slug)).toBe(true);
    }

    const impossible = await listProducts({ collection: "sale", sport: "__no_such_sport__", pageSize: 60 });
    expect(impossible.total).toBe(0);
  });
});
