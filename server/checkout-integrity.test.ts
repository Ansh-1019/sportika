import { describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { orderItems, orders, paymentRecords, productVariants } from "../drizzle/schema";
import { createDemoOrder, listProducts } from "./store";
import { getDb } from "./db";

const details = {
  customerName: "SPORTIKA Integrity Test",
  email: "sportika-integrity@example.test",
  phone: "+919876543210",
  addressLine1: "1 Test Avenue",
  addressLine2: undefined,
  city: "Bengaluru",
  state: "Karnataka",
  pinCode: "560001",
};

describe.skipIf(!process.env.DATABASE_URL)("checkout inventory integrity", () => {
  it("rejects insufficient stock and leaves inventory unchanged", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database is unavailable for the integration test");
    const catalog = await listProducts({ pageSize: 60 });
    const product = catalog.products.find(item => item.variants.some(variant => variant.stock > 0));
    const variant = product?.variants.find(item => item.stock > 0);
    if (!product || !variant) throw new Error("No in-stock demo variant available for the integration test");
    const [before] = await db.select({ stock: productVariants.stock }).from(productVariants).where(eq(productVariants.id, variant.id)).limit(1);
    await expect(createDemoOrder(null, details, [{ variantId: variant.id, quantity: variant.stock + 1 }], undefined, crypto.randomUUID())).rejects.toThrow(/remain|available|stock/i);
    const [after] = await db.select({ stock: productVariants.stock }).from(productVariants).where(eq(productVariants.id, variant.id)).limit(1);
    expect(after?.stock).toBe(before?.stock);
  });

  it("allows only one concurrent order to consume the same finite stock and makes duplicate submission idempotent", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database is unavailable for the integration test");
    const catalog = await listProducts({ pageSize: 60 });
    const product = catalog.products.find(item => item.variants.some(variant => variant.stock > 0));
    const variant = product?.variants.find(item => item.stock > 0);
    if (!product || !variant) throw new Error("No in-stock demo variant available for the integration test");
    const quantity = variant.stock;
    const lines = [{ variantId: variant.id, quantity }];
    const firstKey = crypto.randomUUID();
    const secondKey = crypto.randomUUID();
    const requests = await Promise.allSettled([
      createDemoOrder(null, details, lines, undefined, firstKey),
      createDemoOrder(null, details, lines, undefined, secondKey),
    ]);
    const fulfilled = requests.filter(item => item.status === "fulfilled");
    const rejected = requests.filter(item => item.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const successful = (fulfilled[0] as PromiseFulfilledResult<Awaited<ReturnType<typeof createDemoOrder>>>).value;
    const successfulKey = requests[0].status === "fulfilled" ? firstKey : secondKey;
    const duplicate = await createDemoOrder(null, details, lines, undefined, successfulKey);
    expect(duplicate.id).toBe(successful.id);

    await db.transaction(async tx => {
      await tx.delete(paymentRecords).where(eq(paymentRecords.orderId, successful.id));
      await tx.delete(orderItems).where(eq(orderItems.orderId, successful.id));
      await tx.delete(orders).where(eq(orders.id, successful.id));
      await tx.update(productVariants).set({ stock: sql`${productVariants.stock} + ${quantity}` }).where(eq(productVariants.id, variant.id));
    });
  });
});
