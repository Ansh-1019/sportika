import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import { priceRangeError } from "../shared/catalog-filters";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { hashPassword, LOCAL_PASSWORD_MAX_LENGTH, LOCAL_PASSWORD_MIN_LENGTH, normalizeEmail, verifyPassword } from "./local-auth";
import { loginIdentityLimiter, loginIpLimiter, registrationIdentityLimiter, registrationIpLimiter, requestAddress } from "./rate-limit";
import { storagePut } from "./storage";
import {
  addAddress, adminCreateCategory, adminCreateCoupon, adminCreateProduct, adminCustomers, adminListCoupons,
  adminListOrders, adminNewsletter, adminOverview, adminProducts, adminReturnRequests, adminSupportMessages, adminSetOrderStatus,
  adminUpdateProduct, adminUpdateStock, cancelUserDemoOrder, createDemoOrder, getAdminSettings,
  getCatalogFacets, getOwnedOrder, getProduct, getProductsBySlugs, getStorefrontConfig, getUserWishlist, listAddresses, listCategories, listProducts,
  listUserOrders, readUserCart, requestReturn, saveSupportMessage, saveUserCart, setReturnRequestStatus,
  setSupportMessageStatus, subscribeNewsletter, toggleWishlist, updateStoreShipping, updateStorefrontConfig, updateUserDisplayName, quoteCart,
  getStoreSettings, adminUpdateVariant, adminUpdateCoupon, adminUpdateTracking,
} from "./store";

const lineSchema = z.object({ variantId: z.number().int().positive(), quantity: z.number().int().min(1).max(25) });
const localAuthInput = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(LOCAL_PASSWORD_MIN_LENGTH).max(LOCAL_PASSWORD_MAX_LENGTH),
});
const registrationInput = localAuthInput.extend({ name: z.string().trim().min(2).max(80) });
const addressSchema = z.object({
  customerName: z.string().trim().min(2).max(180), email: z.string().trim().email().max(320),
  phone: z.string().trim().regex(/^[+0-9 ()-]{8,24}$/), addressLine1: z.string().trim().min(5).max(240),
  addressLine2: z.string().trim().max(240).optional(), city: z.string().trim().min(2).max(120),
  state: z.string().trim().min(2).max(120), pinCode: z.string().trim().regex(/^\d{6}$/),
});
const catalogListInput = z.object({
  collection:z.string().optional(),category:z.string().optional(),gender:z.string().optional(),size:z.string().optional(),color:z.string().optional(),sport:z.string().optional(),productType:z.string().optional(),
  minPrice:z.number().int().min(0).optional(),maxPrice:z.number().int().min(0).optional(),available:z.boolean().optional(),search:z.string().max(160).optional(),
  sort:z.enum(["featured","newest","price-asc","price-desc","best-selling"]).optional(),page:z.number().int().min(1).optional(),pageSize:z.number().int().min(1).max(60).optional(),
}).superRefine((input, ctx) => {
  const error = priceRangeError(input.minPrice, input.maxPrice);
  if (error) ctx.addIssue({ code: "custom", path: ["maxPrice"], message: error });
});
const clientError = (error: unknown): never => {
  if (error instanceof TRPCError) throw error;
  const message = error instanceof Error ? error.message : "";
  const safeMessage = /database|query|sql|column|table|constraint|duplicate entry|syntax|connection|foreign key|deadlock/i.test(message)
    ? "Request could not be completed right now. Please try again."
    : message || "Request could not be completed";
  throw new TRPCError({ code: "BAD_REQUEST", message: safeMessage });
};
const enforceRateLimit = (result: { allowed: boolean; retryAfterSeconds: number }, res: { setHeader: (name: string, value: string) => void }, message: string) => {
  if (result.allowed) return;
  res.setHeader("Retry-After", String(result.retryAfterSeconds));
  throw new TRPCError({ code: "TOO_MANY_REQUESTS", message });
};

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    register: publicProcedure.input(registrationInput).mutation(async ({ ctx, input }) => {
      if (!ENV.appId || !ENV.cookieSecret) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Local customer authentication is not configured." });
      const email = normalizeEmail(input.email);
      const address = requestAddress(ctx.req);
      enforceRateLimit(registrationIpLimiter.consume(address), ctx.res, "Too many registration attempts. Please try again later.");
      enforceRateLimit(registrationIdentityLimiter.consume(email), ctx.res, "Too many registration attempts for this email. Please try again later.");
      if (await db.getUserByEmail(email)) throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists." });
      const openId = `local_${randomBytes(24).toString("hex")}`;
      const user = await db.createLocalUser({ openId, name: input.name.trim(), email, passwordHash: await hashPassword(input.password) });
      if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The account could not be created." });
      const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name ?? "", sessionVersion: user.sessionVersion, expiresInMs: ONE_YEAR_MS });
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
      return { success: true } as const;
    }),
    login: publicProcedure.input(localAuthInput).mutation(async ({ ctx, input }) => {
      if (!ENV.appId || !ENV.cookieSecret) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Local customer authentication is not configured." });
      const email = normalizeEmail(input.email);
      const address = requestAddress(ctx.req);
      enforceRateLimit(loginIpLimiter.consume(address), ctx.res, "Too many login attempts. Please try again later.");
      enforceRateLimit(loginIdentityLimiter.consume(email), ctx.res, "Too many login attempts for this account. Please try again later.");
      const user = await db.getUserByEmail(email);
      if (!user?.passwordHash || !(await verifyPassword(input.password, user.passwordHash))) throw new TRPCError({ code: "UNAUTHORIZED", message: "Email or password is incorrect." });
      await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
      loginIdentityLimiter.clear(email);
      const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name ?? "", sessionVersion: user.sessionVersion, expiresInMs: ONE_YEAR_MS });
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
      return { success: true } as const;
    }),
    logout: publicProcedure.mutation(async ({ ctx }) => { if (ctx.user) await db.bumpSessionVersion(ctx.user.id); const cookieOptions=getSessionCookieOptions(ctx.req);ctx.res.clearCookie(COOKIE_NAME,{...cookieOptions,maxAge:-1});return {success:true} as const; }),
  }),
  catalog: router({
    categories: publicProcedure.query(() => listCategories()),
    storefront: publicProcedure.query(() => getStorefrontConfig()),
    settings: publicProcedure.query(() => getStoreSettings()),
    filters: publicProcedure.input(z.object({collection:z.string().max(180).optional()}).optional()).query(({input})=>getCatalogFacets(input?.collection)),
    list: publicProcedure.input(catalogListInput.optional()).query(({input})=>listProducts(input??{})),
    product: publicProcedure.input(z.object({slug:z.string().min(1).max(180)})).query(({input})=>getProduct(input.slug)),
    bySlugs: publicProcedure.input(z.object({slugs:z.array(z.string().min(1).max(180)).max(100)})).query(({input})=>getProductsBySlugs(input.slugs)),
  }),
  cart: router({
    quote: publicProcedure.input(z.object({lines:z.array(lineSchema).max(60),couponCode:z.string().max(40).optional()})).query(({input})=>quoteCart(input.lines,input.couponCode)),
    get: protectedProcedure.query(({ctx})=>readUserCart(ctx.user.id)),
    save: protectedProcedure.input(z.object({lines:z.array(lineSchema).max(60)})).mutation(({ctx,input})=>saveUserCart(ctx.user.id,input.lines)),
  }),
  wishlist: router({
    list: protectedProcedure.query(({ctx})=>getUserWishlist(ctx.user.id)),
    toggle: protectedProcedure.input(z.object({productId:z.number().int().positive()})).mutation(({ctx,input})=>toggleWishlist(ctx.user.id,input.productId)),
  }),
  checkout: router({
    createDemoOrder: publicProcedure.input(z.object({...addressSchema.shape,lines:z.array(lineSchema).min(1).max(60),couponCode:z.string().max(40).optional(),idempotencyKey:z.string().uuid()})).mutation(async({ctx,input})=>{
      try{const{lines,couponCode,idempotencyKey,...details}=input;return await createDemoOrder(ctx.user?.id??null,details,lines,couponCode,idempotencyKey);}catch(error){return clientError(error);}
    }),
  }),
  account: router({
    addresses: protectedProcedure.query(({ctx})=>listAddresses(ctx.user.id)),
    addAddress: protectedProcedure.input(z.object({label:z.string().max(40).optional(),...addressSchema.omit({email:true}).shape,isDefault:z.boolean().optional()})).mutation(({ctx,input})=>addAddress(ctx.user.id,input)),
    orders: protectedProcedure.query(({ctx})=>listUserOrders(ctx.user.id)),
    order: protectedProcedure.input(z.object({id:z.string().uuid()})).query(({ctx,input})=>getOwnedOrder(ctx.user.id,input.id)),
    updateProfile: protectedProcedure.input(z.object({name:z.string().trim().min(2).max(80)})).mutation(({ctx,input})=>updateUserDisplayName(ctx.user.id,input.name)),
    cancelDemoOrder: protectedProcedure.input(z.object({orderId:z.string().uuid()})).mutation(async({ctx,input})=>{try{return await cancelUserDemoOrder(ctx.user.id,input.orderId);}catch(error){return clientError(error);}}),
    requestReturn: protectedProcedure.input(z.object({orderId:z.string().uuid(),reason:z.string().trim().min(5).max(1000)})).mutation(async({ctx,input})=>{try{return await requestReturn(ctx.user.id,input.orderId,input.reason);}catch(error){return clientError(error);}}),
  }),
  newsletter: router({subscribe:publicProcedure.input(z.object({email:z.string().trim().email().max(320),consent:z.literal(true)})).mutation(async({input})=>{try{return await subscribeNewsletter(input.email,input.consent);}catch(error){return clientError(error);}})}),
  contact: router({send:publicProcedure.input(z.object({name:z.string().trim().min(2).max(180),email:z.string().trim().email().max(320),subject:z.string().trim().min(3).max(180),message:z.string().trim().min(10).max(3000),consent:z.literal(true)})).mutation(async({input})=>{try{return await saveSupportMessage(input);}catch(error){return clientError(error);}})}),
  admin: router({
    overview:adminProcedure.query(()=>adminOverview()),products:adminProcedure.query(()=>adminProducts()),
    createProduct:adminProcedure.input(z.object({name:z.string().trim().min(2).max(220),slug:z.string().trim().min(2).max(180),description:z.string().trim().min(10).max(3000),categorySlug:z.string().min(1),gender:z.string().min(1),productType:z.string().min(1),sport:z.string().min(1),price:z.number().int().positive(),originalPrice:z.number().int().positive().optional(),images:z.array(z.string().min(1).max(1200).refine(value=>value.startsWith("/manus-storage/")||value.startsWith("https://"),"Image must be secure HTTPS or managed storage")).min(1).max(6),sizes:z.array(z.string().min(1).max(30)).min(1).max(20),color:z.string().min(1).max(80)})).mutation(async({input})=>{try{return await adminCreateProduct(input);}catch(error){return clientError(error);}}),
    uploadImage:adminProcedure.input(z.object({filename:z.string().min(1).max(180),contentType:z.enum(["image/jpeg","image/png","image/webp","image/avif"]),base64:z.string().min(1).max(7_000_000)})).mutation(async({input})=>{
      try{const bytes=Buffer.from(input.base64,"base64");if(bytes.byteLength>5_000_000)throw new Error("Image must be 5 MB or smaller");if(!bytes.length)throw new Error("The image file is empty");const type=input.contentType;const valid=type==="image/jpeg"?bytes[0]===0xff&&bytes[1]===0xd8:type==="image/png"?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):type==="image/webp"?bytes.toString("ascii",0,4)==="RIFF"&&bytes.toString("ascii",8,12)==="WEBP":bytes.toString("ascii",4,12).startsWith("ftypavif");if(!valid)throw new Error("The selected file does not match its declared image type");const extension={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/avif":"avif"}[type];return await storagePut(`sportika/catalog/${randomUUID()}.${extension}`,bytes,type);}catch(error){return clientError(error);}
    }),
    updateProduct:adminProcedure.input(z.object({id:z.number().int().positive(),name:z.string().trim().min(2).max(220).optional(),description:z.string().trim().min(10).max(3000).optional(),price:z.number().int().positive().optional(),originalPrice:z.number().int().positive().nullable().optional(),active:z.boolean().optional(),categorySlug:z.string().min(1).optional(),gender:z.string().min(1).max(32).optional(),productType:z.string().min(1).max(80).optional(),sport:z.string().min(1).max(80).optional(),featured:z.boolean().optional(),newArrival:z.boolean().optional(),archived:z.boolean().optional(),images:z.array(z.string().min(1).max(1200).refine(value=>value.startsWith("/manus-storage/")||value.startsWith("https://"),"Image must be secure HTTPS or managed storage")).min(1).max(6).optional()})).mutation(async({input})=>{try{return await adminUpdateProduct(input);}catch(error){return clientError(error);}}),
    categories:adminProcedure.query(()=>listCategories()),createCategory:adminProcedure.input(z.object({name:z.string().trim().min(2).max(160),slug:z.string().trim().min(2).max(120),description:z.string().trim().max(1000)})).mutation(async({input})=>{try{return await adminCreateCategory(input);}catch(error){return clientError(error);}}),
    inventory:adminProcedure.query(async()=>(await adminProducts()).flatMap(product=>product.variants.map(variant=>({product:product.name,...variant})))),
    updateStock:adminProcedure.input(z.object({variantId:z.number().int().positive(),stock:z.number().int().min(0).max(100000)})).mutation(({input})=>adminUpdateStock(input.variantId,input.stock)),
    updateVariant:adminProcedure.input(z.object({id:z.number().int().positive(),sku:z.string().trim().min(1).max(100),size:z.string().trim().min(1).max(40),color:z.string().trim().min(1).max(80),colorHex:z.string().regex(/^#[0-9a-fA-F]{6}$/),stock:z.number().int().min(0).max(100000),price:z.number().int().positive().nullable().optional(),active:z.boolean()})).mutation(async({input})=>{try{return await adminUpdateVariant(input);}catch(error){return clientError(error);}}),
    orders:adminProcedure.query(()=>adminListOrders()),setOrderStatus:adminProcedure.input(z.object({id:z.string().uuid(),status:z.enum(["processing","shipped","delivered","cancelled"]),trackingReference:z.string().max(120).optional()})).mutation(async({input})=>{try{return await adminSetOrderStatus(input.id,input.status,input.trackingReference);}catch(error){return clientError(error);}}),
    updateTracking:adminProcedure.input(z.object({id:z.string().uuid(),trackingReference:z.string().trim().max(120)})).mutation(async({input})=>{try{return await adminUpdateTracking(input.id,input.trackingReference);}catch(error){return clientError(error);}}),
    returns:adminProcedure.query(()=>adminReturnRequests()),setReturnStatus:adminProcedure.input(z.object({id:z.number().int().positive(),status:z.enum(["approved","rejected","received","refunded"]),refundAmount:z.number().int().min(0).optional()})).mutation(async({input})=>{try{return await setReturnRequestStatus(input.id,input.status,input.refundAmount);}catch(error){return clientError(error);}}),
    customers:adminProcedure.input(z.object({search:z.string().trim().max(120).optional()}).optional()).query(({input})=>adminCustomers(input?.search)),coupons:adminProcedure.query(()=>adminListCoupons()),updateCoupon:adminProcedure.input(z.object({id:z.number().int().positive(),active:z.boolean().optional(),discountType:z.enum(["percent","fixed"]).optional(),discountValue:z.number().int().positive().optional(),minimumSubtotal:z.number().int().min(0).optional()})).mutation(async({input})=>{try{return await adminUpdateCoupon(input);}catch(error){return clientError(error);}}),createCoupon:adminProcedure.input(z.object({code:z.string().trim().min(3).max(40),discountType:z.enum(["percent","fixed"]),discountValue:z.number().int().positive(),minimumSubtotal:z.number().int().min(0)})).mutation(async({input})=>{try{return await adminCreateCoupon(input);}catch(error){return clientError(error);}}),
    newsletter:adminProcedure.query(()=>adminNewsletter()),support:adminProcedure.query(()=>adminSupportMessages()),setSupportStatus:adminProcedure.input(z.object({id:z.number().int().positive(),status:z.enum(["open","resolved"])})).mutation(({input})=>setSupportMessageStatus(input.id,input.status)),
    settings:adminProcedure.query(()=>getAdminSettings()),updateShipping:adminProcedure.input(z.object({flatRate:z.number().int().min(0).max(100000),freeShippingThreshold:z.number().int().min(0).max(10000000)})).mutation(({input})=>updateStoreShipping(input)),
    updateStorefront:adminProcedure.input(z.object({announcement:z.string().trim().min(1).max(240),campaignEyebrow:z.string().trim().min(1).max(120),campaignHeadline:z.string().trim().min(1).max(160),campaignBody:z.string().trim().min(1).max(600),featuredProductIds:z.array(z.number().int().positive()).max(12)})).mutation(({input})=>updateStorefrontConfig(input)),
  }),
});

export type AppRouter=typeof appRouter;
