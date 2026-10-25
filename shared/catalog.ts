export type SeedVariant = { size: string; color: string; colorHex: string; skuSuffix: string; stock: number };
export type SeedProduct = {
  slug: string; name: string; description: string; category: string; gender: string;
  productType: string; sport: string; price: number; originalPrice?: number;
  featured?: boolean; newArrival?: boolean; image: string; imageAlt: string;
  colors: string[]; sizes: string[]; variants: SeedVariant[];
};

const clothingSizes = ["XS", "S", "M", "L", "XL"];
const shoeSizes = ["6", "7", "8", "9", "10", "11"];
const variants = (sizes: string[], colors: Array<[string, string]>, suffix: string): SeedVariant[] =>
  colors.flatMap(([color, colorHex], ci) => sizes.map((size, si) => ({
    size, color, colorHex, skuSuffix: `${suffix}-${ci + 1}${size.replace(/[^A-Z0-9]/g, "")}`,
    stock: (si + ci) % 5 === 0 ? 0 : 7 + ((si * 3 + ci * 5) % 14),
  })));

export const seedCategories = [
  { slug: "men", name: "Men", description: "Performance layers for every session." },
  { slug: "women", name: "Women", description: "Training essentials made to move." },
  { slug: "jerseys", name: "Jerseys", description: "Lightweight match-day and training jerseys." },
  { slug: "training-wear", name: "Training Wear", description: "Technical staples for stronger sessions." },
  { slug: "shorts-track-pants", name: "Shorts & Track Pants", description: "Freedom to move through every rep." },
  { slug: "shoes", name: "Sports Shoes", description: "Support for running, training and court days." },
  { slug: "accessories", name: "Accessories", description: "Small essentials, ready for the next session." },
  { slug: "new-arrivals", name: "New Arrivals", description: "Fresh kit for your next move." },
  { slug: "sale", name: "Sale", description: "Selected demonstration offers." },
];

export const seedProducts: SeedProduct[] = [
  {
    slug: "apex-dry-training-tee", name: "Apex Dry Training Tee", description: "A lightweight training layer with breathable knit and a clean athletic fit. Demonstration product; final fabric and supplier details are to be confirmed.", category: "training-wear", gender: "Men", productType: "T-shirt", sport: "Gym & Training", price: 1299, originalPrice: 1599, featured: true, newArrival: true,
    image: "/manus-storage/async-images/1QNyoNDC2bg420cGWjeSk9/image-3.webp", imageAlt: "Black unbranded performance training T-shirt, demonstration image", colors: ["Black", "Stone"], sizes: clothingSizes,
    variants: variants(clothingSizes, [["Black", "#242724"], ["Stone", "#d2cec4"]], "APT"),
  },
  {
    slug: "relay-training-jersey", name: "Relay Training Jersey", description: "A breathable jersey for training days and weekend fixtures. Demonstration product with replaceable imagery and inventory.", category: "jerseys", gender: "Unisex", productType: "Jersey", sport: "Football", price: 1499, featured: true, newArrival: true,
    image: "/manus-storage/async-images/1QNyoNDC2bg420cGWjeSk9/image-5.webp", imageAlt: "Forest-green unbranded football training jersey, demonstration image", colors: ["Forest", "Charcoal"], sizes: clothingSizes,
    variants: variants(clothingSizes, [["Forest", "#163d31"], ["Charcoal", "#343735"]], "RTJ"),
  },
  {
    slug: "tempo-run-short", name: "Tempo Run Short", description: "A light, easy-moving running short designed for everyday training. Demonstration product; performance claims and fabric specs require supplier verification.", category: "shorts-track-pants", gender: "Men", productType: "Running shorts", sport: "Running", price: 999, originalPrice: 1199, featured: true,
    image: "/manus-storage/async-images/eIAknBGJRhAfk89hiAcjCD/image-1.webp", imageAlt: "Unbranded black running shorts, demonstration product image", colors: ["Black", "Olive"], sizes: ["S", "M", "L", "XL"],
    variants: variants(["S", "M", "L", "XL"], [["Black", "#222522"], ["Olive", "#606750"]], "TRS"),
  },
  {
    slug: "form-flex-leggings", name: "Form Flex Leggings", description: "High-waisted training leggings with a smooth, flexible silhouette. Demonstration product; fit and fabric information is provisional.", category: "training-wear", gender: "Women", productType: "Leggings", sport: "Gym & Training", price: 1699, originalPrice: 1999, featured: true, newArrival: true,
    image: "/manus-storage/async-images/1QNyoNDC2bg420cGWjeSk9/image-4.webp", imageAlt: "Unbranded charcoal sports leggings set, demonstration image", colors: ["Graphite", "Black"], sizes: clothingSizes,
    variants: variants(clothingSizes, [["Graphite", "#343735"], ["Black", "#222522"]], "FFL"),
  },
  {
    slug: "studio-support-bra", name: "Studio Support Bra", description: "A versatile training bra for gym and studio sessions. Support level and material composition require supplier confirmation.", category: "training-wear", gender: "Women", productType: "Sports bra", sport: "Gym & Training", price: 1299, featured: false,
    image: "/manus-storage/async-images/1QNyoNDC2bg420cGWjeSk9/image-4.webp", imageAlt: "Unbranded women's training set, demonstration image", colors: ["Black", "Sage"], sizes: ["XS", "S", "M", "L", "XL"],
    variants: variants(["XS", "S", "M", "L", "XL"], [["Black", "#222522"], ["Sage", "#8d9a83"]], "SSB"),
  },
  {
    slug: "stride-track-pant", name: "Stride Track Pant", description: "A streamlined layer for warm-ups, cool-downs and off-duty movement. Demonstration product with replaceable supplier details.", category: "shorts-track-pants", gender: "Men", productType: "Track pants", sport: "Running", price: 1799, featured: true,
    image: "/manus-storage/async-images/9Z2Nf7BwYFJYG2x0Ih3wUE/image-5.webp", imageAlt: "Unbranded charcoal training track pants, demonstration image", colors: ["Black", "Navy"], sizes: clothingSizes,
    variants: variants(clothingSizes, [["Black", "#222522"], ["Navy", "#202d38"]], "STP"),
  },
  {
    slug: "warm-up-track-jacket", name: "Warm-Up Track Jacket", description: "A light outer layer for changing conditions and pre-session warm-ups. Demonstration item; weather performance is not verified.", category: "training-wear", gender: "Unisex", productType: "Training jacket", sport: "Outdoor Training", price: 2599, newArrival: true,
    image: "/manus-storage/async-images/eIAknBGJRhAfk89hiAcjCD/image-2.webp", imageAlt: "Unbranded charcoal technical training jacket, demonstration image", colors: ["Black", "Stone"], sizes: clothingSizes,
    variants: variants(clothingSizes, [["Black", "#222522"], ["Stone", "#d2cec4"]], "WUJ"),
  },
  {
    slug: "core-track-suit", name: "Core Track Suit", description: "A coordinated zip-top and track-pant set for travel, warm-ups and everyday wear. Demonstration product; composition and fit are provisional.", category: "training-wear", gender: "Unisex", productType: "Tracksuit", sport: "Outdoor Training", price: 3899, featured: true,
    image: "/manus-storage/async-images/1QNyoNDC2bg420cGWjeSk9/image-2.webp", imageAlt: "Athlete in dark unbranded tracksuit, demonstration image", colors: ["Charcoal", "Navy"], sizes: clothingSizes,
    variants: variants(clothingSizes, [["Charcoal", "#343735"], ["Navy", "#202d38"]], "CTS"),
  },
  {
    slug: "aero-running-tank", name: "Aero Running Tank", description: "A sleeveless training layer for warm-weather sessions. Demonstration product with supplier composition to be confirmed.", category: "training-wear", gender: "Women", productType: "Training top", sport: "Running", price: 1099, newArrival: true,
    image: "/manus-storage/async-images/1QNyoNDC2bg420cGWjeSk9/image-4.webp", imageAlt: "Unbranded women's sportswear for training, demonstration image", colors: ["Black", "White"], sizes: clothingSizes,
    variants: variants(clothingSizes, [["Black", "#222522"], ["White", "#f0eee8"]], "ART"),
  },
  {
    slug: "court-motion-trainer", name: "Court Motion Trainer", description: "A versatile low-profile shoe for court drills and gym work. Demonstration listing; sizing, materials and technical features need supplier verification.", category: "shoes", gender: "Unisex", productType: "Training shoes", sport: "Badminton", price: 4599, featured: true,
    image: "/manus-storage/async-images/eIAknBGJRhAfk89hiAcjCD/image-4.webp", imageAlt: "Unbranded indoor court-training shoes, demonstration image", colors: ["White/Lime", "Black"], sizes: shoeSizes,
    variants: variants(shoeSizes, [["White/Lime", "#e9e8df"], ["Black", "#242724"]], "CMT"),
  },
  {
    slug: "route-five-running-shoe", name: "Route Five Running Shoe", description: "A cushioned-looking everyday running silhouette for this demonstration catalog. Cushioning, sizing and performance claims require supplier verification.", category: "shoes", gender: "Unisex", productType: "Running shoes", sport: "Running", price: 4299, newArrival: true,
    image: "/manus-storage/async-images/eIAknBGJRhAfk89hiAcjCD/image-3.webp", imageAlt: "Unbranded road-running shoes, demonstration image; performance not verified", colors: ["Stone/Lime", "Black"], sizes: shoeSizes,
    variants: variants(shoeSizes, [["Stone/Lime", "#d8d5c9"], ["Black", "#242724"]], "RFS"),
  },
  {
    slug: "sprint-training-bag", name: "Sprint Training Bag", description: "A compact carry-all for the kit you take to training. Demonstration listing; dimensions and material are to be confirmed.", category: "accessories", gender: "Unisex", productType: "Gym bag", sport: "Gym & Training", price: 1299,
    image: "/manus-storage/async-images/eIAknBGJRhAfk89hiAcjCD/image-5.webp", imageAlt: "Unbranded charcoal gym duffel bag, demonstration image", colors: ["Black", "Olive"], sizes: ["One size"],
    variants: variants(["One size"], [["Black", "#222522"], ["Olive", "#606750"]], "STB"),
  },
  {
    slug: "court-polo-training-shirt", name: "Court Polo Training Shirt", description: "A clean collared layer for warm-ups and everyday sport. Demonstration product; fabric and fit require supplier confirmation.", category: "training-wear", gender: "Unisex", productType: "Sports polo", sport: "Tennis", price: 1599, featured: true,
    image: "/manus-storage/async-images/9Z2Nf7BwYFJYG2x0Ih3wUE/image-2.webp", imageAlt: "Unbranded black technical sports polo, demonstration image", colors: ["Black"], sizes: clothingSizes,
    variants: variants(clothingSizes, [["Black", "#242724"]], "CPT"),
  },
  {
    slug: "light-run-cap", name: "Light Run Cap", description: "A lightweight cap for outdoor sessions. Demonstration product; textile, fit and UV details are unverified.", category: "accessories", gender: "Unisex", productType: "Sports cap", sport: "Running", price: 799,
    image: "/manus-storage/async-images/9Z2Nf7BwYFJYG2x0Ih3wUE/image-3.webp", imageAlt: "Unbranded charcoal performance running cap, demonstration image", colors: ["Charcoal"], sizes: ["One size"],
    variants: variants(["One size"], [["Charcoal", "#343735"]], "LRC"),
  },
  {
    slug: "session-water-bottle", name: "Session Water Bottle", description: "A reusable bottle for training-day hydration. Demonstration product; capacity, material and food-contact details must be supplier verified.", category: "accessories", gender: "Unisex", productType: "Water bottle", sport: "Gym & Training", price: 599,
    image: "/manus-storage/async-images/9Z2Nf7BwYFJYG2x0Ih3wUE/image-4.webp", imageAlt: "Unbranded charcoal reusable sports bottle, demonstration image", colors: ["Charcoal"], sizes: ["One size"],
    variants: variants(["One size"], [["Charcoal", "#343735"]], "SWB"),
  },
  {
    slug: "baseline-basketball-training-tee", name: "Baseline Basketball Training Tee", description: "An unbranded sample apparel layer for drills and practice. Fabric, fit and performance information require supplier verification.", category: "training-wear", gender: "Unisex", productType: "Training top", sport: "Basketball", price: 1199, newArrival: true,
    image: "/manus-storage/async-images/1QNyoNDC2bg420cGWjeSk9/image-3.webp", imageAlt: "Unbranded black sports training top, demonstration product image", colors: ["Black", "Stone"], sizes: clothingSizes,
    variants: variants(clothingSizes, [["Black", "#242724"], ["Stone", "#d2cec4"]], "BBT"),
  },
  {
    slug: "shuttle-court-training-top", name: "Shuttle Court Training Top", description: "A lightweight-looking unbranded apparel sample for court drills. Material, fit and sport-performance details are not verified.", category: "training-wear", gender: "Unisex", productType: "Training top", sport: "Badminton", price: 1099,
    image: "/manus-storage/async-images/1QNyoNDC2bg420cGWjeSk9/image-5.webp", imageAlt: "Unbranded green court-training jersey top, demonstration image", colors: ["Forest", "Charcoal"], sizes: clothingSizes,
    variants: variants(clothingSizes, [["Forest", "#163d31"], ["Charcoal", "#343735"]], "SCT"),
  },
  {
    slug: "performance-crew-socks", name: "Performance Crew Socks", description: "A simple everyday crew sock for training and active days. Demonstration product; fiber content is unverified.", category: "accessories", gender: "Unisex", productType: "Sports socks", sport: "Gym & Training", price: 499,
    image: "/manus-storage/async-images/9Z2Nf7BwYFJYG2x0Ih3wUE/image-1.webp", imageAlt: "Unbranded athletic crew socks, demonstration image", colors: ["White", "Black"], sizes: ["S/M", "L/XL"],
    variants: variants(["S/M", "L/XL"], [["White", "#f0eee8"], ["Black", "#242724"]], "PCS"),
  },
];

export const demoCoupon = { code: "MOVE10", discountType: "percent" as const, discountValue: 10, minimumSubtotal: 999, active: true };
export const shippingRules = { flatRate: 49, freeShippingThreshold: 1999, configuredForDemo: true };
