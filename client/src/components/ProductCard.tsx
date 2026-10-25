import { useState } from "react";
import { Heart, Plus, X } from "lucide-react";
import { Link } from "wouter";
import type { StoreProduct, StoreVariant } from "@shared/store-types";
import { useStore } from "@/lib/store";

const formatINR = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

export function ProductCard({ product, index = 0 }: { product: StoreProduct; index?: number }) {
  const { addToCart, isWishlisted, toggleWishlist } = useStore();
  const [quickOpen, setQuickOpen] = useState(false);
  const firstAvailable = product.variants.find(item => item.size.toUpperCase() === "M" && item.stock > 0) ?? product.variants.find(item => item.stock > 0);
  const [selectedColor, setSelectedColor] = useState(firstAvailable?.color ?? product.variants[0]?.color ?? "");
  const [selectedSize, setSelectedSize] = useState(firstAvailable?.size ?? product.variants[0]?.size ?? "");
  const variant = product.variants.find(item => item.size.toUpperCase() === "M" && item.stock > 0) ?? product.variants.find(item => item.stock > 0);
  const selectedVariant: StoreVariant | undefined = product.variants.find(item => item.color === selectedColor && item.size === selectedSize);
  const image = product.images[0];
  const effectivePrices = product.variants.map(item => item.price ?? product.price);
  const minimumPrice = effectivePrices.length ? Math.min(...effectivePrices) : product.price;
  const priceVaries = new Set(effectivePrices).size > 1;
  const sale = product.originalPrice !== null && product.originalPrice > minimumPrice;
  const selectedPrice = selectedVariant?.price ?? product.price;
  const selectedSale = product.originalPrice !== null && product.originalPrice > selectedPrice;
  const saved = isWishlisted(product.id, product.slug);
  const colors = [...new Map(product.variants.map(item => [item.color, item])).values()];
  const sizesForColor = product.variants.filter(item => item.color === selectedColor);

  return <article className="product-card" style={{ "--card-index": index } as React.CSSProperties}>
    <div className="product-media">
      <Link href={`/products/${product.slug}`} className="product-image-link" aria-label={`View ${product.name}`}>
        {image ? <img src={image.url} alt={image.alt} loading="lazy" /> : <div className="image-placeholder">SPORTIKA</div>}
      </Link>
      <div className="product-badges">{sale && <span className="badge badge-sale">DEMO OFFER</span>}{product.newArrival && <span className="badge">NEW</span>}{product.isDemo && <span className="badge badge-demo">DEMO</span>}</div>
      <button className={`wishlist-button ${saved ? "is-saved" : ""}`} aria-label={saved ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`} onClick={() => toggleWishlist(product.id, product.slug)}><Heart size={17} fill={saved ? "currentColor" : "none"} /></button>
      {variant ? <button className="quick-add" onClick={() => addToCart(product, variant)} aria-label={`Quick add ${product.name}, size ${variant.size}, ${variant.color}`}><span>QUICK ADD <small>{variant.size} / {variant.color}</small></span><Plus size={17} /></button> : <span className="quick-add unavailable">SOLD OUT</span>}
    </div>
    <div className="product-info"><div className="product-meta"><span>{product.productType}</span><span>{product.gender}</span></div>
      <Link href={`/products/${product.slug}`} className="product-name">{product.name}</Link>
      <div className="product-bottom"><div className="product-price">{priceVaries && <span>From </span>}<strong>{formatINR(minimumPrice)}</strong>{sale && <del>{formatINR(product.originalPrice!)}</del>}</div><div className="swatches" aria-label={`Colors: ${product.variants.map(item => item.color).filter((value, i, all) => all.indexOf(value) === i).slice(0, 4).join(", ")}`}>{colors.slice(0, 4).map(color => <span key={color.color} title={color.color} style={{ backgroundColor: color.colorHex }} />)}</div></div>
      <p className="product-size-hint">{variant ? `Sizes ${product.variants.filter(item => item.stock > 0).map(item => item.size).filter((value, i, all) => all.indexOf(value) === i).slice(0, 5).join(" · ") || "Select on product page"}` : "Check back soon"}</p>
      <button type="button" className="quick-view-trigger" onClick={() => setQuickOpen(true)} aria-label={`Quick view ${product.name}`}>Quick view</button>
    </div>
    {quickOpen && <div className="quick-view-backdrop" onClick={event => { if (event.target === event.currentTarget) setQuickOpen(false); }}>
      <section className="quick-view-dialog" role="dialog" aria-modal="true" aria-labelledby={`quick-view-title-${product.id}`}>
        <button className="quick-view-close" type="button" aria-label="Close quick view" onClick={() => setQuickOpen(false)}><X size={19} /></button>
        {image && <img className="quick-view-image" src={image.url} alt={image.alt} />}
        <div className="quick-view-copy"><span className="eyebrow eyebrow-mark">SPORTIKA / DEMO PRODUCT</span><h2 id={`quick-view-title-${product.id}`}>{product.name}</h2><p className="product-price"><strong>{formatINR(selectedPrice)}</strong>{selectedSale && <del>{formatINR(product.originalPrice!)}</del>}</p><p>{product.description}</p>
          <label className="field"><span>Color</span><select value={selectedColor} onChange={event => { const nextColor = event.target.value; setSelectedColor(nextColor); const nextVariant = product.variants.find(item => item.color === nextColor && item.stock > 0) ?? product.variants.find(item => item.color === nextColor); setSelectedSize(nextVariant?.size ?? ""); }}>
            {colors.map(color => <option value={color.color} key={color.color}>{color.color}</option>)}
          </select></label>
          <label className="field"><span>Size</span><select value={selectedSize} onChange={event => setSelectedSize(event.target.value)}>
            {sizesForColor.map(size => <option value={size.size} key={size.id} disabled={size.stock < 1}>{size.size}{size.stock < 1 ? " · unavailable" : ""}</option>)}
          </select></label>
          <p className="toast-demo" aria-live="polite">{selectedVariant?.stock ? `${selectedVariant.stock} demonstration units available` : "This option is currently unavailable."}</p>
          <div className="quick-view-actions"><button type="button" className="btn-primary" disabled={!selectedVariant || selectedVariant.stock < 1} onClick={() => { if (selectedVariant) addToCart(product, selectedVariant); setQuickOpen(false); }}>Add selected option <Plus size={15} /></button><Link className="btn-outline" href={`/products/${product.slug}`} onClick={() => setQuickOpen(false)}>Full details</Link></div>
        </div>
      </section>
    </div>}
  </article>;
}
