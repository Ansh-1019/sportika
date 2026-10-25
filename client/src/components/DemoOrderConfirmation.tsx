import { Check } from "lucide-react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

export type DemoOrderConfirmation = {
  id: string;
  orderNumber: string;
  total: number;
  paymentStatus: "demo_pending";
  city: string;
  state: string;
  pinCode: string;
  items: Array<{
    sku: string;
    name: string;
    variant: string;
    image: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
};

export function parseDemoOrderConfirmation(value: unknown, expectedId: string): DemoOrderConfirmation | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<DemoOrderConfirmation>;
  if (candidate.id !== expectedId || typeof candidate.orderNumber !== "string" || !candidate.orderNumber ||
      candidate.paymentStatus !== "demo_pending" || !Number.isFinite(candidate.total) ||
      typeof candidate.city !== "string" || typeof candidate.state !== "string" || typeof candidate.pinCode !== "string" ||
      !Array.isArray(candidate.items) || candidate.items.length < 1 || candidate.items.length > 60) return null;
  const items = candidate.items.filter(item => item && typeof item.sku === "string" && typeof item.name === "string" &&
    typeof item.variant === "string" && typeof item.image === "string" && Number.isInteger(item.quantity) && item.quantity > 0 &&
    Number.isFinite(item.unitPrice) && Number.isFinite(item.lineTotal));
  if (items.length !== candidate.items.length) return null;
  return { ...candidate, items } as DemoOrderConfirmation;
}

const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
const stages = ["01 Contact", "02 Delivery", "03 Review", "04 Demo", "05 Confirm"];

export default function DemoOrderConfirmationPage({ record, authenticated }: { record: DemoOrderConfirmation | null; authenticated: boolean }) {
  return <div className="page-wrap content-page checkout-page order-confirmation-page">
    <div className="checkout-progress" aria-label="Checkout progress: step 5 of 5">
      {stages.map((stage, index) => <span className={index === 4 ? "active" : "complete"} aria-current={index === 4 ? "step" : undefined} key={stage}>{stage}</span>)}
    </div>
    {record ? <>
      <div className="confirmation-mark" aria-hidden="true"><Check /></div>
      <span className="eyebrow eyebrow-mark">DEMO ORDER RECORDED · NOT A REAL PAYMENT</span>
      <h1>Order confirmed<span className="brand-dot">.</span></h1>
      <p className="lead">Reference {record.orderNumber} · payment status: demo pending (unpaid). No payment was collected or gateway processed.</p>
      <div className="form-card order-confirmation-summary">
        <h2>Order details</h2>
        {record.items.map((item, index) => <div className="summary-product" key={`${item.sku}-${index}`}>
          <img src={item.image} alt="" />
          <div><strong>{item.name}</strong><span>{item.variant} × {item.quantity}</span><span>SKU {item.sku}</span></div>
          <strong>{money(item.lineTotal)}</strong>
        </div>)}
        <div className="summary-line summary-total"><span>Recorded demo total</span><strong>{money(record.total)}</strong></div>
        <p>Delivery area: {record.city}, {record.state} {record.pinCode}. No carrier serviceability, shipment, or delivery date is confirmed.</p>
      </div>
      <p className="demo-note">This is a stored demonstration order only. It does not place an external supplier order or arrange real-world fulfillment.</p>
      <Link className="btn-dark" href={authenticated ? "/account/orders" : "/collections"}>{authenticated ? "View account orders" : "Continue shopping"} <ArrowRight size={15} /></Link>
    </> : <>
      <span className="eyebrow eyebrow-mark">NO STORED CONFIRMATION</span>
      <h1>Confirmation unavailable<span className="brand-dot">.</span></h1>
      <p className="lead" role="status">A URL alone does not prove that an order exists. This browser session has no matching, recorded demo-order confirmation, so no order success is shown.</p>
      <Link className="btn-dark" href={authenticated ? "/account/orders" : "/collections"}>{authenticated ? "Check account orders" : "Back to sportswear"} <ArrowRight size={15} /></Link>
    </>}
  </div>;
}
