export type StoreVariant = {
  id: number; productId: number; sku: string; size: string; color: string; colorHex: string;
  price: number | null; stock: number; active: boolean;
};
export type StoreProduct = {
  id: number; slug: string; name: string; description: string; categoryId: number;
  categorySlug: string; categoryName: string; gender: string; productType: string; sport: string;
  price: number; originalPrice: number | null; featured: boolean; newArrival: boolean;
  active: boolean; archived: boolean; isDemo: boolean; createdAt: Date; images: Array<{ url: string; alt: string }>;
  variants: StoreVariant[];
};
export type StoreCategory = { id: number; slug: string; name: string; description: string };
export type CartLine = { variantId: number; quantity: number };
export type CheckoutAddress = {
  customerName: string; email: string; phone: string; addressLine1: string; addressLine2?: string;
  city: string; state: string; pinCode: string;
};
export type OrderSummary = {
  id: string; orderNumber: string; customerName: string; email: string; phone: string;
  addressLine1: string; addressLine2: string | null; city: string; state: string; pinCode: string;
  subtotal: number; discount: number; shipping: number; tax: number; total: number;
  couponCode: string | null; mode: "demo" | "live"; status: string; paymentStatus: string;
  trackingReference: string | null; createdAt: Date;
  items: Array<{ sku: string; name: string; variant: string; image: string; quantity: number; unitPrice: number; lineTotal: number }>;
};
export type CartProduct = StoreProduct & { selectedVariant: StoreVariant; quantity: number };
