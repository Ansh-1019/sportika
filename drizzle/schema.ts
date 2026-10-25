import { relations } from "drizzle-orm";
import { boolean, index, integer, pgEnum, pgTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const discountTypeEnum = pgEnum("discount_type", ["percent", "fixed"]);
export const orderModeEnum = pgEnum("order_mode", ["demo", "live"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "processing", "shipped", "delivered", "cancelled", "return_requested", "returned"]);
export const paymentStatusEnum = pgEnum("payment_status", ["demo_pending", "pending", "paid", "failed", "refunded"]);
export const returnStatusEnum = pgEnum("return_status", ["requested", "approved", "rejected", "received", "refunded"]);
export const subscriberStatusEnum = pgEnum("subscriber_status", ["subscribed", "unsubscribed"]);
export const supportStatusEnum = pgEnum("support_status", ["open", "resolved"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  sessionVersion: integer("sessionVersion").notNull().default(0),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  name: varchar("name", { length: 180 }).notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  name: varchar("name", { length: 220 }).notNull(),
  description: text("description").notNull(),
  categoryId: integer("categoryId").notNull().references(() => categories.id, { onDelete: "restrict" }),
  gender: varchar("gender", { length: 32 }).notNull().default("Unisex"),
  productType: varchar("productType", { length: 80 }).notNull(),
  sport: varchar("sport", { length: 80 }).notNull(),
  price: integer("price").notNull(),
  originalPrice: integer("originalPrice"),
  featured: boolean("featured").notNull().default(false),
  newArrival: boolean("newArrival").notNull().default(false),
  active: boolean("active").notNull().default(true),
  archived: boolean("archived").notNull().default(false),
  isDemo: boolean("isDemo").notNull().default(true),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, table => ({ categoryIndex: index("products_category_idx").on(table.categoryId), genderIndex: index("products_gender_idx").on(table.gender), activeIndex: index("products_active_idx").on(table.active) }));

export const productImages = pgTable("product_images", {
  id: serial("id").primaryKey(),
  productId: integer("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
  url: varchar("url", { length: 1200 }).notNull(),
  alt: varchar("alt", { length: 300 }).notNull(),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, table => ({ productIndex: index("product_images_product_idx").on(table.productId), productPositionIndex: index("product_images_product_position_idx").on(table.productId, table.position) }));

export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
  sku: varchar("sku", { length: 100 }).notNull().unique(),
  size: varchar("size", { length: 40 }).notNull(),
  color: varchar("color", { length: 80 }).notNull(),
  colorHex: varchar("colorHex", { length: 20 }).notNull().default("#242724"),
  price: integer("price"),
  stock: integer("stock").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, table => ({ productIndex: index("variants_product_idx").on(table.productId), lookupIndex: index("variants_lookup_idx").on(table.size, table.color, table.active), inventoryIndex: index("variants_inventory_idx").on(table.productId, table.active, table.stock) }));

export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  cartId: integer("cartId").notNull().references(() => carts.id, { onDelete: "cascade" }),
  variantId: integer("variantId").notNull().references(() => productVariants.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
}, table => ({ cartVariantUnique: uniqueIndex("cart_variant_unique").on(table.cartId, table.variantId), cartIndex: index("cart_items_cart_idx").on(table.cartId) }));

export const wishlistItems = pgTable("wishlist_items", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: integer("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, table => ({ wishlistUnique: uniqueIndex("wishlist_user_product_unique").on(table.userId, table.productId) }));

export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 40 }).notNull().default("Home"),
  recipientName: varchar("recipientName", { length: 180 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull(),
  line1: varchar("line1", { length: 240 }).notNull(),
  line2: varchar("line2", { length: 240 }),
  city: varchar("city", { length: 120 }).notNull(),
  state: varchar("state", { length: 120 }).notNull(),
  pinCode: varchar("pinCode", { length: 12 }).notNull(),
  isDefault: boolean("isDefault").notNull().default(false),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, table => ({ addressUserIndex: index("addresses_user_idx").on(table.userId) }));

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  discountType: discountTypeEnum("discountType").notNull(),
  discountValue: integer("discountValue").notNull(),
  minimumSubtotal: integer("minimumSubtotal").notNull().default(0),
  active: boolean("active").notNull().default(true),
  expiresAt: timestamp("expiresAt", { withTimezone: true }),
  usageLimit: integer("usageLimit"),
  usedCount: integer("usedCount").notNull().default(0),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: varchar("id", { length: 36 }).primaryKey(),
  orderNumber: varchar("orderNumber", { length: 32 }).notNull().unique(),
  userId: integer("userId").references(() => users.id, { onDelete: "set null" }),
  customerName: varchar("customerName", { length: 180 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull(),
  addressLine1: varchar("addressLine1", { length: 240 }).notNull(),
  addressLine2: varchar("addressLine2", { length: 240 }),
  city: varchar("city", { length: 120 }).notNull(),
  state: varchar("state", { length: 120 }).notNull(),
  pinCode: varchar("pinCode", { length: 12 }).notNull(),
  subtotal: integer("subtotal").notNull(),
  discount: integer("discount").notNull().default(0),
  shipping: integer("shipping").notNull().default(0),
  tax: integer("tax").notNull().default(0),
  total: integer("total").notNull(),
  couponCode: varchar("couponCode", { length: 40 }),
  mode: orderModeEnum("mode").default("demo").notNull(),
  status: orderStatusEnum("status").default("pending").notNull(),
  paymentStatus: paymentStatusEnum("paymentStatus").default("demo_pending").notNull(),
  trackingReference: varchar("trackingReference", { length: 120 }),
  idempotencyKey: varchar("idempotencyKey", { length: 36 }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, table => ({ orderUserIndex: index("orders_user_idx").on(table.userId), orderStatusIndex: index("orders_status_idx").on(table.status), orderPaymentIndex: index("orders_payment_idx").on(table.mode, table.paymentStatus), orderIdempotencyUnique: uniqueIndex("orders_idempotency_key_uq").on(table.idempotencyKey) }));

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: varchar("orderId", { length: 36 }).notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("productId").references(() => products.id, { onDelete: "set null" }),
  variantId: integer("variantId").references(() => productVariants.id, { onDelete: "set null" }),
  skuSnapshot: varchar("skuSnapshot", { length: 100 }).notNull(),
  productNameSnapshot: varchar("productNameSnapshot", { length: 220 }).notNull(),
  variantSnapshot: varchar("variantSnapshot", { length: 160 }).notNull(),
  imageSnapshot: varchar("imageSnapshot", { length: 1200 }).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unitPrice").notNull(),
  lineTotal: integer("lineTotal").notNull(),
}, table => ({ orderItemIndex: index("order_items_order_idx").on(table.orderId) }));

export const paymentRecords = pgTable("payment_records", {
  id: serial("id").primaryKey(),
  orderId: varchar("orderId", { length: 36 }).notNull().references(() => orders.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  amount: integer("amount").notNull(),
  gatewayPaymentId: varchar("gatewayPaymentId", { length: 180 }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, table => ({ paymentOrderIndex: index("payments_order_idx").on(table.orderId) }));

export const returnRequests = pgTable("return_requests", {
  id: serial("id").primaryKey(),
  orderId: varchar("orderId", { length: 36 }).notNull().references(() => orders.id, { onDelete: "cascade" }),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  status: returnStatusEnum("status").default("requested").notNull(),
  refundAmount: integer("refundAmount"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, table => ({ returnOrderIndex: index("returns_order_idx").on(table.orderId) }));

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  consent: boolean("consent").notNull(),
  status: subscriberStatusEnum("status").default("subscribed").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  settingKey: varchar("settingKey", { length: 120 }).notNull().unique(),
  settingValue: text("settingValue").notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export const supportMessages = pgTable("support_messages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 180 }).notNull(),
  message: text("message").notNull(),
  consent: boolean("consent").notNull(),
  status: supportStatusEnum("status").default("open").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, table => ({ supportStatusIndex: index("support_status_idx").on(table.status) }));

export const usersRelations = relations(users, ({ many }) => ({ carts: many(carts), addresses: many(addresses), wishlistItems: many(wishlistItems), orders: many(orders) }));
export const categoriesRelations = relations(categories, ({ many }) => ({ products: many(products) }));
export const productsRelations = relations(products, ({ one, many }) => ({ category: one(categories, { fields: [products.categoryId], references: [categories.id] }), images: many(productImages), variants: many(productVariants), wishlistItems: many(wishlistItems) }));
export const productVariantsRelations = relations(productVariants, ({ one }) => ({ product: one(products, { fields: [productVariants.productId], references: [products.id] }) }));
export const cartsRelations = relations(carts, ({ one, many }) => ({ user: one(users, { fields: [carts.userId], references: [users.id] }), items: many(cartItems) }));
export const cartItemsRelations = relations(cartItems, ({ one }) => ({ cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }), variant: one(productVariants, { fields: [cartItems.variantId], references: [productVariants.id] }) }));
export const ordersRelations = relations(orders, ({ one, many }) => ({ user: one(users, { fields: [orders.userId], references: [users.id] }), items: many(orderItems) }));
export const orderItemsRelations = relations(orderItems, ({ one }) => ({ order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }), product: one(products, { fields: [orderItems.productId], references: [products.id] }), variant: one(productVariants, { fields: [orderItems.variantId], references: [productVariants.id] }) }));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
