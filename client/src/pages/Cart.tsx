import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Minus, Plus, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useStore } from "@/lib/store";
import type { StoreProduct } from "@shared/store-types";
import { usePageMeta } from "@/lib/seo";

const money=(value:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(value);
export default function CartPage(){
  usePageMeta("Your Shopping Bag | SPORTIKA","Review selected demonstration sportswear and server-validated cart totals.");
  const {lines,setQuantity,removeLine}=useStore(); const catalog=trpc.catalog.list.useQuery({pageSize:60}); const [coupon,setCoupon]=useState(""); const [applied,setApplied]=useState("");
  useEffect(()=>{setCoupon(localStorage.getItem("sportika-coupon")??"");setApplied(localStorage.getItem("sportika-coupon")??"");},[]);
  const quote=trpc.cart.quote.useQuery({lines,couponCode:applied||undefined},{enabled:lines.length>0,staleTime:0});
  const products=catalog.data?.products??[];
  const items=useMemo(()=>lines.map(line=>{const product=products.find(item=>item.variants.some(variant=>variant.id===line.variantId));const variant=product?.variants.find(item=>item.id===line.variantId);return product&&variant?{product,variant,quantity:line.quantity}:null;}).filter(Boolean) as Array<{product:StoreProduct;variant:StoreProduct["variants"][number];quantity:number}>,[lines,products]);
  const applyCoupon=()=>{const value=coupon.trim().toUpperCase();if(!value){setApplied("");localStorage.removeItem("sportika-coupon");return;}setApplied(value);localStorage.setItem("sportika-coupon",value);};
  const quoteData=quote.data;
  return <div className="page-wrap content-page cart-page"><div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><span>Shopping bag</span></div><span className="eyebrow eyebrow-mark">Your selection</span><h1>Your bag<span className="brand-dot">.</span></h1><p className="lead">{lines.reduce((sum,item)=>sum+item.quantity,0)} item{lines.reduce((sum,item)=>sum+item.quantity,0)===1?"":"s"} · demonstration catalog</p>
    {catalog.isLoading&&<p>Loading your saved cart…</p>}
    {!lines.length?<div className="empty-state cart-empty"><h2>Your bag is waiting.</h2><p>Find the clothing that moves with you.</p><Link href="/collections" className="btn-dark">Continue shopping <ArrowRight size={15}/></Link></div>:<div className="cart-layout"><section className="cart-items">{items.map(({product,variant,quantity})=><article className="cart-item" key={variant.id}><Link href={`/products/${product.slug}`}><img src={product.images[0]?.url} alt={product.images[0]?.alt??product.name}/></Link><div><div className="product-meta"><span>{product.productType}</span><span>SKU {variant.sku}</span></div><h3><Link href={`/products/${product.slug}`}>{product.name}</Link></h3><p>{variant.color} / {variant.size}</p><p>{money(variant.price??product.price)} each</p><div className="cart-item-actions"><button aria-label="Decrease quantity" onClick={()=>setQuantity(variant.id,quantity-1,variant.stock)}><Minus size={13}/></button><span>{quantity}</span><button aria-label="Increase quantity" disabled={quantity>=variant.stock} onClick={()=>setQuantity(variant.id,quantity+1,variant.stock)}><Plus size={13}/></button><button className="cart-remove" onClick={()=>removeLine(variant.id)}><Trash2 size={13}/> Remove</button></div></div><div className="cart-line-total">{money((variant.price??product.price)*quantity)}<span className="line-stock">{variant.stock} available</span></div></article>)}
      {!items.length&&!catalog.isLoading&&<div className="empty-state"><p>Some saved cart options are no longer available.</p><button className="btn-outline" onClick={()=>toast.error("Remove unavailable options or refresh the catalog.")}>Review cart</button></div>}
      <Link href="/collections" className="text-link cart-continue">Continue shopping <ArrowRight size={15}/></Link></section>
      <aside className="summary-card"><h3>Order summary</h3><div className="coupon-entry"><label htmlFor="coupon-code">Coupon code</label><div><input id="coupon-code" value={coupon} onChange={e=>setCoupon(e.target.value.toUpperCase())} placeholder="Try MOVE10"/><button onClick={applyCoupon}>APPLY</button></div>{quote.error&&applied&&<small className="error-text">{quote.error.message}</small>}{quoteData?.couponCode&&<small className="success-text">{quoteData.couponCode} applied to this demo order.</small>}</div>
        <div className="summary-line"><span>Subtotal</span><strong>{quoteData?money(quoteData.subtotal):quote.isLoading?"Checking stock…":"Unavailable"}</strong></div><div className="summary-line"><span>Discount</span><strong>{quoteData?money(quoteData.discount):"—"}</strong></div><div className="summary-line"><span>Shipping</span><strong>{quoteData?money(quoteData.shipping):"Pending server quote"}</strong></div><div className="summary-line"><span>Tax</span><strong>₹0*</strong></div><div className="summary-line summary-total"><span>Total</span><strong>{quoteData?money(quoteData.total):quote.isLoading?"Checking…":"Unavailable"}</strong></div>{quote.isError&&<p className="error-text" role="alert">Server could not confirm this cart: {quote.error.message}</p>}
        <p className="tax-note">*No tax is calculated in this demonstration configuration. Confirm applicable tax settings before launch.</p>
        <div className="summary-demo"><strong>DEMO CHECKOUT</strong><br/>No live payment is processed. The server rechecks prices and stock when you place the demo order.</div>
        <Link href="/checkout" className="btn-dark checkout-cta">Continue to checkout <ArrowRight size={16}/></Link>
      </aside></div>}
    <p className="cart-note">Prices, variants and stock shown are demonstration data. They must be confirmed against the supplier catalog before commercial use.</p>
  </div>;
}
