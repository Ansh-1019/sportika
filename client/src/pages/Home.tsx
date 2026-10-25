import { ArrowDownRight, ArrowRight, Check, MoveUpRight } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { ProductCard } from "@/components/ProductCard";
import { usePageMeta } from "@/lib/seo";

const media = {
  hero: "/manus-storage/async-images/1QNyoNDC2bg420cGWjeSk9/image-1.webp",
  campaign: "/manus-storage/async-images/1QNyoNDC2bg420cGWjeSk9/image-2.webp",
  tee: "/manus-storage/async-images/1QNyoNDC2bg420cGWjeSk9/image-3.webp",
  leggings: "/manus-storage/async-images/1QNyoNDC2bg420cGWjeSk9/image-4.webp",
  jersey: "/manus-storage/async-images/1QNyoNDC2bg420cGWjeSk9/image-5.webp",
  shorts: "/manus-storage/async-images/eIAknBGJRhAfk89hiAcjCD/image-1.webp",
  jacket: "/manus-storage/async-images/eIAknBGJRhAfk89hiAcjCD/image-2.webp",
  runningShoe: "/manus-storage/async-images/eIAknBGJRhAfk89hiAcjCD/image-3.webp",
  courtShoe: "/manus-storage/async-images/eIAknBGJRhAfk89hiAcjCD/image-4.webp",
  bag: "/manus-storage/async-images/eIAknBGJRhAfk89hiAcjCD/image-5.webp",
};
const categories = [
  { n: "01", title: "Sports T-shirts", href: "/collections/training-wear", image: media.tee, note: "Breathe through every rep" },
  { n: "02", title: "Jerseys", href: "/collections/jerseys", image: media.jersey, note: "Made for match day" },
  { n: "03", title: "Training Wear", href: "/collections/training-wear", image: media.campaign, note: "Built for the work" },
  { n: "04", title: "Shorts & Track Pants", href: "/collections/shorts-track-pants", image: media.shorts, note: "Room to move" },
  { n: "05", title: "Leggings & Bras", href: "/collections/women", image: media.leggings, note: "Move on your terms" },
  { n: "06", title: "Hoodies & Tracksuits", href: "/collections/training-wear", image: media.jacket, note: "Layer up. Go again." },
];
const sports = [
  { title: "Running", href: "/collections/men?sport=Running", image: media.shorts },
  { title: "Gym", href: "/collections/training-wear?sport=Gym%20%26%20Training", image: media.tee },
  { title: "Football", href: "/collections/jerseys", image: media.jersey },
  { title: "Basketball", href: "/collections/training-wear?sport=Basketball", image: media.jacket },
  { title: "Badminton", href: "/collections/training-wear?sport=Badminton", image: media.jersey },
  { title: "Outdoor Training", href: "/collections/training-wear?sport=Outdoor%20Training", image: media.jacket },
];

function ProductRow({ title, eyebrow, href, products, description }: { title: string; eyebrow: string; href: string; products: any[]; description?: string }) {
  return <section className="new-arrivals"><div className="page-wrap"><div className="section-head"><div><span className="eyebrow eyebrow-mark">{eyebrow}</span><h2>{title}</h2></div><div className="section-head-action">{description && <p>{description}</p>}<Link className="text-link" href={href}>View collection <ArrowRight size={15} /></Link></div></div>
    {products.length ? <div className="product-grid">{products.slice(0, 8).map((product, i) => <ProductCard key={product.id} product={product} index={i} />)}</div> : <div className="product-grid">{Array.from({ length: 4 }, (_, i) => <div className="product-skeleton" key={i}><div /><span>Loading the demo catalog</span></div>)}</div>}
  </div></section>;
}

export default function Home() {
  usePageMeta("SPORTIKA | Built to Move. Made to Perform.", "Performance-driven sportswear designed for training, competition, and everyday movement. Browse clothing-first SPORTIKA collections.");
  const storefront = trpc.catalog.storefront.useQuery(undefined, { staleTime: 60_000 });
  const featured = trpc.catalog.list.useQuery({ pageSize: 60, sort: "featured" });
  const arrivals = trpc.catalog.list.useQuery({ collection: "new-arrivals", pageSize: 4, sort: "newest" });
  const featuredIds = storefront.data?.featuredProductIds ?? [];
  const featuredProducts = (featuredIds.length ? (featured.data?.products ?? []).filter(product => featuredIds.includes(product.id)) : (featured.data?.products ?? []))
    .filter(product => !["shoes", "accessories"].includes(product.categorySlug));
  const apparelArrivals = (arrivals.data?.products ?? []).filter(product => !["shoes", "accessories"].includes(product.categorySlug));
  return <>
    <section className="hero" aria-labelledby="home-title"><div className="hero-image" style={{ backgroundImage: `url('${media.hero}')` }} /><div className="hero-shade" />
      <div className="hero-index">PERFORMANCE / 001</div><div className="hero-content"><div className="hero-kicker"><span />TRAIN HARD. MOVE FREELY.</div><h1 id="home-title">BUILT TO MOVE.<br /><em>MADE TO</em><br />PERFORM.</h1><p className="hero-copy">Discover performance-driven sportswear designed for training, competition, and everyday movement.</p><div className="hero-ctas"><Link href="/collections" className="btn-primary">SHOP SPORTSWEAR <ArrowRight size={16} /></Link><Link href="/collections/new-arrivals" className="btn-outline hero-secondary">EXPLORE NEW ARRIVALS</Link></div></div><div className="hero-bottom"><i /> PERFORMANCE STARTS WITH HOW YOU MOVE <ArrowDownRight size={16} /></div>
    </section>
    <div className="demo-ribbon"><strong>SPORTIKA / DEMO</strong><span>Sample catalog and inventory · no live payment or carrier integration</span></div>
    <section className="category-section page-wrap"><div className="section-head"><div><span className="eyebrow eyebrow-mark">Find your fit</span><h2>Clothing for<br />every kind of game.</h2></div><div className="section-head-action"><p>From first warm-up to last rep, start with the kit that moves with you.</p><Link className="text-link" href="/collections">Shop all clothing <ArrowRight size={15} /></Link></div></div>
      <nav className="home-audience-links" aria-label="Shop SPORTIKA collections"><span className="eyebrow">Shop by collection</span><Link href="/collections/men">Shop Men <ArrowRight size={14}/></Link><Link href="/collections/women">Shop Women <ArrowRight size={14}/></Link><Link href="/collections/training-wear">Explore Training Wear <ArrowRight size={14}/></Link></nav>
      <div className="category-grid">{categories.map(category => <Link className="category-card" key={category.n} href={category.href}><img src={category.image} alt="" loading="lazy"/><div className="category-card-content"><span className="category-number">{category.n} / SPORTIKA</span><h3>{category.title}</h3><p>{category.note}</p></div><span className="category-arrow"><ArrowRight size={15}/></span></Link>)}</div>
    </section>
    <section className="featured-section"><ProductRow title="Made for the miles" eyebrow="SPORTIKA SELECTS" href="/collections" products={featuredProducts} description="Clothing-first training staples from the demonstration range." /></section>
    <section className="campaign-section"><div className="campaign-wrap"><div className="campaign-image"><img src={media.campaign} alt="Athlete in unbranded training apparel, campaign demonstration image" loading="lazy"/><span className="hero-index">CAMPAIGN / 002</span></div><div className="campaign-copy"><span className="eyebrow eyebrow-mark">{storefront.data?.campaignEyebrow ?? "For the work you put in"}</span><h2>{storefront.data?.campaignHeadline ?? "YOUR GAME. YOUR GEAR."}</h2><p>{storefront.data?.campaignBody ?? "Find the layers, jerseys and training essentials built around your movement. This sample collection is ready for verified product details and supplier imagery."}</p><Link href="/collections/training-wear" className="btn-primary">Explore training wear <MoveUpRight size={15}/></Link></div></div></section>
    <ProductRow title="New moves" eyebrow="JUST ADDED" href="/collections/new-arrivals" products={apparelArrivals} description="Recently added sample apparel. All details are marked for demonstration." />
    <section className="sport-strip page-wrap"><div className="section-head"><div><span className="eyebrow eyebrow-mark">Find your discipline</span><h2>Gear for the<br />way you play.</h2></div><p>Clothing-led edits for training days, competition and time outside.</p></div><div className="sport-grid">{sports.map((sport,i)=><Link className="sport-card" href={sport.href} key={sport.title}><img src={sport.image} alt="" loading="lazy"/><span>{sport.title}</span><ArrowRight size={16}/></Link>)}</div></section>
    <section className="secondary-collections page-wrap"><Link href="/collections/shoes" className="secondary-card"><img src={media.runningShoe} alt="Unbranded training footwear, demonstration image" loading="lazy"/><div className="secondary-card-content"><span className="eyebrow">Supporting collection / 01</span><h3>Footwear for<br />what's next.</h3><p>Shoes shown are demonstration listings; supplier sizing and performance details are not yet verified.</p><span className="text-link">Explore sports shoes <ArrowRight size={15}/></span></div></Link><Link href="/collections/accessories" className="secondary-card"><img src={media.bag} alt="Unbranded gym bag, demonstration image" loading="lazy"/><div className="secondary-card-content"><span className="eyebrow">Supporting collection / 02</span><h3>Small things.<br />Big sessions.</h3><p>Training-day accessories, with final material and size details to come.</p><span className="text-link">Shop accessories <ArrowRight size={15}/></span></div></Link></section>
    <section className="story-band"><div className="story-content"><div><span className="eyebrow eyebrow-mark">SPORTIKA / our point of view</span><h2>Move first.<br />Make it yours.</h2></div><p>SPORTIKA brings a clothing-first point of view to training and everyday movement. This client-demo catalog is a starting place: every product, image, price and stock level is clearly replaceable before launch.</p><Link href="/about" className="text-link">Our story <Check size={15}/></Link></div></section>
  </>;
}
