import { relations } from "drizzle-orm";
import { boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  name: varchar("name", { length: 180 }).notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  name: varchar("name", { length: 220 }).notNull(),
  description: text("description").notNull(),
  categoryId: int("categoryId").notNull().references(() => categories.id, { onDelete: "restrict" }),
  gender: varchar("gender", { length: 32 }).notNull().default("Unisex"),
  productType: varchar("productType", { length: 80 }).notNull(),
  sport: varchar("sport", { length: 80 }).notNull(),
  price: int("price").notNull(),
  originalPrice: int("originalPrice"),
  featured: boolean("featured").notNull().default(false),
  newArrival: boolean("newArrival").notNull().default(false),
  active: boolean("active").notNull().default(true),
  archived: boolean("archived").notNull().default(false),
  isDemo: boolean("isDemo").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ categoryIndex: index("products_category_idx").on(table.categoryId), genderIndex: index("products_gender_idx").on(table.gender), activeIndex: index("products_active_idx").on(table.active) }));

export const productImages = mysqlTable("product_images", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
  url: varchar("url", { length: 1200 }).notNull(),
  alt: varchar("alt", { length: 300 }).notNull(),
  position: int("position").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ productIndex: index("product_images_product_idx").on(table.productId) }));

export const productVariants = mysqlTable("product_variants", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
  sku: varchar("sku", { length: 100 }).notNull().unique(),
  size: varchar("size", { length: 40 }).notNull(),
  color: varchar("color", { length: 80 }).notNull(),
  colorHex: varchar("colorHex", { length: 20 }).notNull().default("#242724"),
  price: int("price"),
  stock: int("stock").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ productIndex: index("variants_product_idx").on(table.productId), lookupIndex: index("variants_lookup_idx").on(table.size, table.color, table.active) }));

export const carts = mysqlTable("carts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export const cartItems = mysqlTable("cart_items", {
  id: int("id").autoincrement().primaryKey(),
  cartId: int("cartId").notNull().references(() => carts.id, { onDelete: "cascade" }),
  variantId: int("variantId").notNull().references(() => productVariants.id, { onDelete: "cascade" }),
  quantity: int("quantity").notNull().default(1),
}, table => ({ cartVariantUnique: uniqueIndex("cart_variant_unique").on(table.cartId, table.variantId), cartIndex: index("cart_items_cart_idx").on(table.cartId) }));

export const wishlistItems = mysqlTable("wishlist_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: int("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ wishlistUnique: uniqueIndex("wishlist_user_product_unique").on(table.userId, table.productId) }));

export const addresses = mysqlTable("addresses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 40 }).notNull().default("Home"),
  recipientName: varchar("recipientName", { length: 180 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull(),
  line1: varchar("line1", { length: 240 }).notNull(),
  line2: varchar("line2", { length: 240 }),
  city: varchar("city", { length: 120 }).notNull(),
  state: varchar("state", { length: 120 }).notNull(),
  pinCode: varchar("pinCode", { length: 12 }).notNull(),
  isDefault: boolean("isDefault").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ addressUserIndex: index("addresses_user_idx").on(table.userId) }));

export const coupons = mysqlTable("coupons", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  discountType: mysqlEnum("discountType", ["percent", "fixed"]).notNull(),
  discountValue: int("discountValue").notNull(),
  minimumSubtotal: int("minimumSubtotal").notNull().default(0),
  active: boolean("active").notNull().default(true),
  expiresAt: timestamp("expiresAt"),
  usageLimit: int("usageLimit"),
  usedCount: int("usedCount").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const orders = mysqlTable("orders", {
  id: varchar("id", { length: 36 }).primaryKey(),
  orderNumber: varchar("orderNumber", { length: 32 }).notNull().unique(),
  userId: int("userId").references(() => users.id, { onDelete: "set null" }),
  customerName: varchar("customerName", { length: 180 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull(),
  addressLine1: varchar("addressLine1", { length: 240 }).notNull(),
  addressLine2: varchar("addressLine2", { length: 240 }),
  city: varchar("city", { length: 120 }).notNull(),
  state: varchar("state", { length: 120 }).notNull(),
  pinCode: varchar("pinCode", { length: 12 }).notNull(),
  subtotal: int("subtotal").notNull(),
  discount: int("discount").notNull().default(0),
  shipping: int("shipping").notNull().default(0),
  tax: int("tax").notNull().default(0),
  total: int("total").notNull(),
  couponCode: varchar("couponCode", { length: 40 }),
  mode: mysqlEnum("mode", ["demo", "live"]).default("demo").notNull(),
  status: mysqlEnum("status", ["pending", "processing", "shipped", "delivered", "cancelled", "return_requested", "returned"]).default("pending").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["demo_pending", "pending", "paid", "failed", "refunded"]).default("demo_pending").notNull(),
  trackingReference: varchar("trackingReference", { length: 120 }),
  idempotencyKey: varchar("idempotencyKey", { length: 36 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ orderUserIndex: index("orders_user_idx").on(table.userId), orderStatusIndex: index("orders_status_idx").on(table.status), orderPaymentIndex: index("orders_payment_idx").on(table.mode, table.paymentStatus), orderIdempotencyUnique: uniqueIndex("orders_idempotency_key_uq").on(table.idempotencyKey) }));

export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: varchar("orderId", { length: 36 }).notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: int("productId").references(() => products.id, { onDelete: "set null" }),
  variantId: int("variantId").references(() => productVariants.id, { onDelete: "set null" }),
  skuSnapshot: varchar("skuSnapshot", { length: 100 }).notNull(),
  productNameSnapshot: varchar("productNameSnapshot", { length: 220 }).notNull(),
  variantSnapshot: varchar("variantSnapshot", { length: 160 }).notNull(),
  imageSnapshot: varchar("imageSnapshot", { length: 1200 }).notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: int("unitPrice").notNull(),
  lineTotal: int("lineTotal").notNull(),
}, table => ({ orderItemIndex: index("order_items_order_idx").on(table.orderId) }));

export const paymentRecords = mysqlTable("payment_records", {
  id: int("id").autoincrement().primaryKey(),
  orderId: varchar("orderId", { length: 36 }).notNull().references(() => orders.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  amount: int("amount").notNull(),
  gatewayPaymentId: varchar("gatewayPaymentId", { length: 180 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ paymentOrderIndex: index("payments_order_idx").on(table.orderId) }));

export const returnRequests = mysqlTable("return_requests", {
  id: int("id").autoincrement().primaryKey(),
  orderId: varchar("orderId", { length: 36 }).notNull().references(() => orders.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  status: mysqlEnum("status", ["requested", "approved", "rejected", "received", "refunded"]).default("requested").notNull(),
  refundAmount: int("refundAmount"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ returnOrderIndex: index("returns_order_idx").on(table.orderId) }));

export const newsletterSubscribers = mysqlTable("newsletter_subscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  consent: boolean("consent").notNull(),
  status: mysqlEnum("status", ["subscribed", "unsubscribed"]).default("subscribed").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const adminSettings = mysqlTable("admin_settings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 120 }).notNull().unique(),
  settingValue: text("settingValue").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const supportMessages = mysqlTable("support_messages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 180 }).notNull(),
  message: text("message").notNull(),
  consent: boolean("consent").notNull(),
  status: mysqlEnum("status", ["open", "resolved"]).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
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
