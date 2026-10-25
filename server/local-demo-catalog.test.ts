import { describe, expect, it } from "vitest";
import { localDemoListProducts, localDemoProduct, localDemoQuote } from "./local-demo-catalog";

describe("isolated local demo preview catalog", () => {
  it("lists seeded demonstration products and applies collection filters", () => {
    const men = localDemoListProducts({ collection: "men", pageSize: 60 });
    expect(men.total).toBeGreaterThan(0);
    expect(men.products.every(product => product.gender === "Men" || product.gender === "Unisex")).toBe(true);
    expect(men.products.every(product => product.isDemo)).toBe(true);
  });

  it("resolves the seeded Apex product without a database", () => {
    const product = localDemoProduct("apex-dry-training-tee");
    expect(product?.name).toBe("Apex Dry Training Tee");
    expect(product?.variants.length).toBeGreaterThan(0);
  });

  it("quotes demo cart lines without persisting stock, orders, or accounts", () => {
    const product = localDemoProduct("apex-dry-training-tee")!;
    const variant = product.variants.find(item => item.stock > 0)!;
    const quote = localDemoQuote([{ variantId: variant.id, quantity: 1 }], "MOVE10");
    expect(quote.paymentMode).toBe("demo");
    expect(quote.stockValidated).toBe(true);
    expect(quote.items[0]?.name).toBe(product.name);
  });
});
