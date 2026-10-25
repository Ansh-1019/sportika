import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, LockKeyhole } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useStore } from "@/lib/store";
import { usePageMeta } from "@/lib/seo";

type FormState = {
  customerName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pinCode: string;
};
type RequestIdentity = { input: string; key: string };
type StoredRequest = { fingerprint?: unknown; key?: unknown };
type ConfirmationRecord = {
  id: string;
  orderNumber: string;
  total: number;
  paymentStatus: string;
  city: string;
  state: string;
  pinCode: string;
  items: Array<{ sku: string; name: string; variant: string; image: string; quantity: number; unitPrice: number; lineTotal: number }>;
};

const initial: FormState = { customerName: "", email: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pinCode: "" };
const REQUEST_STORAGE_KEY = "sportika-checkout-request";
const progressLabels = ["01 Contact", "02 Delivery", "03 Review", "04 Demo", "05 Confirm"];
const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
const normalizeText = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();

async function fingerprintRequest(input: string): Promise<string> {
  try {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  } catch {
    let hash = 2166136261;
    for (let index = 0; index < input.length; index += 1) hash = Math.imul(hash ^ input.charCodeAt(index), 16777619);
    return `fallback-${(hash >>> 0).toString(16)}`;
  }
}

export default function CheckoutPage() {
  usePageMeta("Demo Checkout | SPORTIKA", "Complete a clearly labelled demo order. No live payment gateway is connected.");
  const { lines, user, clearCart } = useStore();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [coupon, setCoupon] = useState("");
  const [completedOrder, setCompletedOrder] = useState<ConfirmationRecord | null>(null);
  const [requestIdentity, setRequestIdentity] = useState<RequestIdentity>({ input: "", key: "" });
  const cartKey = JSON.stringify({ lines: [...lines].sort((a, b) => a.variantId - b.variantId), coupon });
  const requestInput = JSON.stringify({
    userId: user?.id ?? null,
    customerName: normalizeText(form.customerName),
    email: normalizeText(form.email),
    phone: form.phone.replace(/\D/g, ""),
    addressLine1: normalizeText(form.addressLine1),
    addressLine2: normalizeText(form.addressLine2),
    city: normalizeText(form.city),
    state: normalizeText(form.state),
    pinCode: form.pinCode.replace(/\D/g, ""),
    lines: [...lines].map(line => ({ variantId: line.variantId, quantity: line.quantity })).sort((a, b) => a.variantId - b.variantId),
    coupon: coupon.trim().toUpperCase() || null,
  });

  useEffect(() => {
    const name = user?.name ?? "";
    const email = user?.email ?? "";
    setForm(current => ({ ...current, customerName: current.customerName || name, email: current.email || email }));
    try { setCoupon(localStorage.getItem("sportika-coupon") ?? ""); } catch { /* Browser storage can be unavailable. */ }
  }, [user?.id]);

  useEffect(() => {
    let active = true;
    const prepareRequest = async () => {
      if (!lines.length) {
        try { sessionStorage.removeItem(REQUEST_STORAGE_KEY); } catch { /* Storage may be disabled. */ }
        if (active) setRequestIdentity({ input: requestInput, key: "" });
        return;
      }
      const fingerprint = await fingerprintRequest(requestInput);
      if (!active) return;
      let key = "";
      try {
        const saved = JSON.parse(sessionStorage.getItem(REQUEST_STORAGE_KEY) ?? "null") as StoredRequest | null;
        if (saved?.fingerprint === fingerprint && typeof saved.key === "string" && /^[0-9a-f-]{36}$/i.test(saved.key)) key = saved.key;
      } catch { /* Start a fresh idempotency key if stored state is malformed. */ }
      if (!key) key = crypto.randomUUID();
      try { sessionStorage.setItem(REQUEST_STORAGE_KEY, JSON.stringify({ fingerprint, key })); } catch { /* Keep the current request safe for this page session. */ }
      if (active) setRequestIdentity({ input: requestInput, key });
    };
    void prepareRequest();
    return () => { active = false; };
  }, [requestInput, lines.length]);

  const idempotencyKey = requestIdentity.input === requestInput ? requestIdentity.key : "";
  const products = trpc.catalog.list.useQuery({ pageSize: 60 });
  const quote = trpc.cart.quote.useQuery({ lines, couponCode: coupon || undefined }, { enabled: lines.length > 0 });
  const createOrder = trpc.checkout.createDemoOrder.useMutation();
  const setField = (key: keyof FormState, value: string) => {
    setError("");
    setForm(current => ({ ...current, [key]: value }));
  };
  const reviewLines = useMemo(() => lines.flatMap(line => {
    const product = products.data?.products.find(item => item.variants.some(variant => variant.id === line.variantId));
    const variant = product?.variants.find(item => item.id === line.variantId);
    return product && variant ? [{ line, product, variant }] : [];
  }), [lines, products.data]);
  const quoteReady = !!quote.data && reviewLines.length === lines.length && !quote.isError;

  const submitContact = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (form.customerName.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) || !/^[+0-9 ()-]{8,24}$/.test(form.phone.trim())) {
      setError("Check your name, email address, and phone number before continuing.");
      return;
    }
    setStep(2);
  };

  const submitDeliveryAddress = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (form.addressLine1.trim().length < 5 || form.city.trim().length < 2 || form.state.trim().length < 2 || !/^\d{6}$/.test(form.pinCode)) {
      setError("Enter a full street address, city, state, and valid 6-digit PIN code.");
      return;
    }
    setStep(3);
  };

  const continueToDemo = () => {
    setError("");
    if (!quoteReady) {
      setError(quote.error?.message ?? "We're still verifying your products, stock, and total. Please wait or refresh your quote.");
      return;
    }
    setStep(4);
  };

  const placeDemoOrder = async (event: FormEvent) => {
    event.preventDefault();
    if (step !== 4 || createOrder.isPending) return;
    setError("");
    try {
      if (!idempotencyKey) throw new Error("Preparing a secure order request. Please retry in a moment.");
      const result = await createOrder.mutateAsync({
        ...form,
        addressLine2: form.addressLine2 || undefined,
        lines,
        couponCode: coupon || undefined,
        idempotencyKey,
      });
      const confirmation: ConfirmationRecord = {
        id: result.id,
        orderNumber: result.orderNumber,
        total: result.total,
        paymentStatus: result.paymentStatus,
        city: result.city,
        state: result.state,
        pinCode: result.pinCode,
        items: result.items.map(item => ({ sku: item.sku, name: item.name, variant: item.variant, image: item.image, quantity: item.quantity, unitPrice: item.unitPrice, lineTotal: item.lineTotal })),
      };
      setCompletedOrder(confirmation);
      let confirmationStored = false;
      try {
        sessionStorage.setItem("sportika-last-order", JSON.stringify(confirmation));
        sessionStorage.removeItem(REQUEST_STORAGE_KEY);
        confirmationStored = true;
      } catch { /* The in-memory final stage still confirms the recorded demo order. */ }
      try { localStorage.removeItem(`sportika-checkout-key:${cartKey}`); localStorage.removeItem("sportika-coupon"); } catch { /* Best-effort browser cleanup. */ }
      clearCart();
      setCoupon("");
      setStep(5);
      if (confirmationStored) setLocation(`/order-confirmation/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't place this demo order. Your cart has been preserved.");
      toast.error("Order not placed. Your cart is still saved.");
    }
  };

  if (!lines.length && !completedOrder) {
    return <div className="page-wrap content-page"><h1>Your bag is empty.</h1><p>Add a product before continuing to checkout.</p><Link className="btn-dark" href="/collections">Shop sportswear <ArrowRight size={15} /></Link></div>;
  }

  if (step === 5 && completedOrder) {
    return <div className="page-wrap content-page checkout-page order-confirmation-page">
      <CheckoutProgress step={5} />
      <div className="confirmation-mark"><Check /></div>
      <span className="eyebrow eyebrow-mark">DEMO ORDER RECORDED · NOT A REAL PAYMENT</span>
      <h1>Order confirmed<span className="brand-dot">.</span></h1>
      <p className="lead">Reference {completedOrder.orderNumber} · status: {completedOrder.paymentStatus.replaceAll("_", " ")}. No payment was collected or gateway processed.</p>
      <OrderSummary record={completedOrder} />
      <p className="demo-note">No carrier serviceability, shipment, or delivery date is confirmed.</p>
      <Link className="btn-dark" href={user ? "/account/orders" : "/collections"}>{user ? "View account orders" : "Continue shopping"} <ArrowRight size={15} /></Link>
    </div>;
  }

  return <div className="page-wrap content-page checkout-page">
    <div className="breadcrumbs"><Link href="/cart">Shopping bag</Link><span>/</span><span>Demo checkout</span></div>
    <span className="eyebrow eyebrow-mark">Secure details · simulated payment</span>
    <h1>Checkout<span className="brand-dot">.</span></h1>
    <CheckoutProgress step={step} />
    <div className="checkout-layout">
      <section>
        {step === 1 && <form className="form-card" onSubmit={submitContact}>
          <h2>01 / Contact information</h2>
          <p>Enter the contact details for this demo checkout. Your information is used only to create and display the sample order.</p>
          <div className="field"><label htmlFor="customerName">Full name *</label><input id="customerName" name="name" required minLength={2} maxLength={180} autoComplete="name" value={form.customerName} onChange={event => setField("customerName", event.target.value)} /></div>
          <div className="field"><label htmlFor="email">Email address *</label><input id="email" name="email" required type="email" autoComplete="email" maxLength={320} value={form.email} onChange={event => setField("email", event.target.value)} /></div>
          <div className="field"><label htmlFor="phone">Phone number *</label><input id="phone" name="tel" required type="tel" autoComplete="tel" minLength={8} maxLength={24} pattern="[+0-9 ()-]{8,24}" value={form.phone} onChange={event => setField("phone", event.target.value)} /></div>
          {error && <p role="alert" className="error-text">{error}</p>}
          <div className="checkout-actions"><Link className="btn-outline" href="/cart"><ArrowLeft size={15} /> Back to bag</Link><button className="btn-dark" type="submit">Continue to delivery <ArrowRight size={15} /></button></div>
        </form>}

        {step === 2 && <form className="form-card" onSubmit={submitDeliveryAddress}>
          <h2>02 / Delivery address</h2>
          <p>Enter the address for the order summary. No carrier or PIN-code serviceability is connected in this demo.</p>
          <div className="field"><label htmlFor="addressLine1">Street address *</label><input id="addressLine1" required minLength={5} maxLength={240} autoComplete="address-line1" value={form.addressLine1} onChange={event => setField("addressLine1", event.target.value)} /></div>
          <div className="field"><label htmlFor="addressLine2">Apartment / landmark (optional)</label><input id="addressLine2" autoComplete="address-line2" maxLength={240} value={form.addressLine2} onChange={event => setField("addressLine2", event.target.value)} /></div>
          <div className="form-two"><div className="field"><label htmlFor="city">City *</label><input id="city" required minLength={2} maxLength={120} autoComplete="address-level2" value={form.city} onChange={event => setField("city", event.target.value)} /></div><div className="field"><label htmlFor="state">State *</label><input id="state" required minLength={2} maxLength={120} autoComplete="address-level1" value={form.state} onChange={event => setField("state", event.target.value)} /></div></div>
          <div className="field"><label htmlFor="pinCode">PIN code *</label><input id="pinCode" name="postal-code" required inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{6}" maxLength={6} value={form.pinCode} onChange={event => setField("pinCode", event.target.value.replace(/\D/g, "").slice(0, 6))} /></div>
          {error && <p role="alert" className="error-text">{error}</p>}
          <div className="delivery-card"><span className="eyebrow">Configured demo shipping</span><p>{quote.data ? `₹${quote.data.shippingRule.flatRate} flat. Shipping is waived at ₹${quote.data.shippingRule.freeShippingThreshold} post-discount subtotal. This configured rule is for the demo only; no carrier, PIN-code serviceability or delivery estimate is connected.` : "Loading the configured demonstration shipping rule…"}</p></div>
          <div className="checkout-actions"><button type="button" className="btn-outline" onClick={() => { setError(""); setStep(1); }}><ArrowLeft size={15} /> Back to contact</button><button className="btn-dark" type="submit">Review order <ArrowRight size={15} /></button></div>
        </form>}

        {step === 3 && <div className="form-card">
          <h2>03 / Delivery and order review</h2>
          <p>Review your sample order, delivery details, and server-quoted totals before continuing. Nothing is purchased at this stage.</p>
          <div className="review-contact-grid">
            <div className="review-contact"><span className="eyebrow">Contact</span><strong>{form.customerName}</strong><span>{form.email}</span><span>{form.phone}</span><button className="text-link" type="button" onClick={() => { setError(""); setStep(1); }}>Edit contact</button></div>
            <div className="review-contact"><span className="eyebrow">Delivery address</span><strong>{form.addressLine1}{form.addressLine2 ? `, ${form.addressLine2}` : ""}</strong><span>{form.city}, {form.state} {form.pinCode}</span><button className="text-link" type="button" onClick={() => { setError(""); setStep(2); }}>Edit address</button></div>
          </div>
          <div className="checkout-review-items">
            <h3>Selected items</h3>
            {reviewLines.map(({ line, product, variant }) => <div className="summary-product" key={line.variantId}>
              <img src={product.images[0]?.url} alt="" />
              <div><strong>{product.name}</strong><span>{variant.color} / {variant.size} × {line.quantity}</span></div>
              <strong>{money((variant.price ?? product.price) * line.quantity)}</strong>
            </div>)}
            {!products.data && <p role="status">Loading selected product details…</p>}
          </div>
          <div className="delivery-card"><span className="eyebrow">Delivery summary</span><p>Configured sample shipping only. No carrier serviceability, tracking, or delivery estimate is connected.</p></div>
          <div className="review-totals">
            <div className="summary-line"><span>Subtotal</span><strong>{quote.data ? money(quote.data.subtotal) : "Checking…"}</strong></div>
            <div className="summary-line"><span>Discount{quote.data?.couponCode ? ` · ${quote.data.couponCode}` : ""}</span><strong>{quote.data ? money(quote.data.discount) : "—"}</strong></div>
            <div className="summary-line"><span>Shipping</span><strong>{quote.data ? money(quote.data.shipping) : "—"}</strong></div>
            <div className="summary-line"><span>Tax</span><strong>₹0*</strong></div>
            <div className="summary-line summary-total"><span>Server-quoted demo total</span><strong>{quote.data ? money(quote.data.total) : "Unavailable"}</strong></div>
            <p className="tax-note">*No tax is calculated in this demonstration configuration. Confirm applicable tax settings before launch.</p>
          </div>
          {quote.error && <p role="alert" className="error-text">Server could not verify this cart: {quote.error.message}</p>}
          {error && <p role="alert" className="error-text">{error}</p>}
          <div className="checkout-actions"><button type="button" className="btn-outline" onClick={() => { setError(""); setStep(2); }}><ArrowLeft size={15} /> Back to delivery</button><button type="button" className="btn-dark" onClick={continueToDemo} disabled={!quoteReady}>Continue to demo completion <ArrowRight size={15} /></button></div>
        </div>}

        {step === 4 && <form className="form-card" onSubmit={placeDemoOrder}>
          <h2>04 / Demo completion</h2>
          <div className="demo-pay-box"><LockKeyhole size={19} /><div><strong>DEMO MODE · NO LIVE PAYMENT</strong><p>No UPI, card, cash-on-delivery, or payment gateway is configured. Do not enter payment details. This action records an unpaid demonstration order only; it does not charge you, contact a supplier, or arrange delivery.</p></div></div>
          <div className="payment-summary"><div><span>Contact</span><strong>{form.customerName} · {form.email}</strong></div><div><span>Delivery</span><strong>{form.city}, {form.state} {form.pinCode}</strong></div><div><span>Demo total</span><strong>{quote.data ? money(quote.data.total) : "Unavailable"}</strong></div><div><span>Payment status</span><strong>Unpaid · demo pending</strong></div></div>
          {quote.error && <p role="alert" className="error-text">{quote.error.message}</p>}{error && <p role="alert" className="error-text">{error}</p>}
          <div className="checkout-actions"><button type="button" className="btn-outline" disabled={createOrder.isPending} onClick={() => { setError(""); setStep(3); }}><ArrowLeft size={15} /> Back to review</button><button className="btn-primary" type="submit" disabled={createOrder.isPending || !quoteReady || !idempotencyKey}>{createOrder.isPending ? "Recording demo order…" : "Complete demo order"}<ArrowRight size={15} /></button></div>
          <p className="payment-legal">The order is saved only as a demonstration record, with an unpaid status. No payment is verified and no real-world fulfillment is triggered.</p>
        </form>}
      </section>

      <aside className="summary-card">
        <h3>Order summary</h3>
        {reviewLines.map(({ line, product, variant }) => <div className="summary-product" key={line.variantId}>
          <img src={product.images[0]?.url} alt="" />
          <div><strong>{product.name}</strong><span>{variant.color} / {variant.size} × {line.quantity}</span></div>
          <strong>{money((variant.price ?? product.price) * line.quantity)}</strong>
        </div>)}
        {!reviewLines.length && <p>{products.isLoading ? "Loading selected products…" : "Selected product details are unavailable. Please return to your bag."}</p>}
        <div className="summary-line"><span>Subtotal</span><strong>{quote.data ? money(quote.data.subtotal) : quote.isLoading ? "Checking stock…" : "Unavailable"}</strong></div>
        <div className="summary-line"><span>Discount</span><strong>{quote.data ? money(quote.data.discount) : "—"}</strong></div>
        <div className="summary-line"><span>Shipping</span><strong>{quote.data ? money(quote.data.shipping) : "—"}</strong></div>
        <div className="summary-line"><span>Tax</span><strong>₹0*</strong></div>
        <div className="summary-line summary-total"><span>Total</span><strong>{quote.data ? money(quote.data.total) : "Unavailable"}</strong></div>
        {quote.isError && <p className="error-text" role="alert">Server could not confirm this cart: {quote.error.message}</p>}
        <div className="summary-demo"><strong>DEMO ONLY</strong><br />No payment will be collected. Prices and inventory are sample records.</div>
      </aside>
    </div>
  </div>;
}

function CheckoutProgress({ step }: { step: number }) {
  return <div className="checkout-progress" aria-label={`Checkout progress: step ${step} of 5`}>
    {progressLabels.map((label, index) => <span key={label} className={step === index + 1 ? "active" : step > index + 1 ? "complete" : ""} aria-current={step === index + 1 ? "step" : undefined}>{label}</span>)}
  </div>;
}

function OrderSummary({ record }: { record: ConfirmationRecord }) {
  return <div className="form-card order-confirmation-summary">
    <h2>Order details</h2>
    {record.items.map((item, index) => <div className="summary-product" key={`${item.sku}-${index}`}>
      <img src={item.image} alt="" />
      <div><strong>{item.name}</strong><span>{item.variant} × {item.quantity}</span><span>SKU {item.sku}</span></div>
      <strong>{money(item.lineTotal)}</strong>
    </div>)}
    <div className="summary-line summary-total"><span>Recorded demo total</span><strong>{money(record.total)}</strong></div>
    <p>Delivery address on this confirmation: {record.city}, {record.state} {record.pinCode}. No carrier serviceability or delivery date is confirmed.</p>
  </div>;
}
