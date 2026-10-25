import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, ChevronDown, Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useStore } from "@/lib/store";

const nav = [
  ["Men", "/collections/men"], ["Women", "/collections/women"], ["Jerseys", "/collections/jerseys"],
  ["Training Wear", "/collections/training-wear"], ["Shorts & Pants", "/collections/shorts-track-pants"],
  ["Shoes", "/collections/shoes"], ["Accessories", "/collections/accessories"],
];
const megaMenus: Record<string, Array<[string, string]>> = {
  Men: [["Shop all men's sportswear", "/collections/men"], ["Training wear", "/collections/training-wear?gender=Men"], ["Jerseys", "/collections/jerseys?gender=Men"], ["Shorts & track pants", "/collections/shorts-track-pants?gender=Men"], ["Sports shoes", "/collections/shoes?gender=Men"]],
  Women: [["Shop all women's sportswear", "/collections/women"], ["Training wear", "/collections/training-wear?gender=Women"], ["Jerseys", "/collections/jerseys?gender=Women"], ["Shorts & track pants", "/collections/shorts-track-pants?gender=Women"], ["Accessories", "/collections/accessories"]],
  "Training Wear": [["Shop all training wear", "/collections/training-wear"], ["Sports T-shirts", "/collections/training-wear?productType=T-shirt"], ["Shorts & track pants", "/collections/shorts-track-pants"], ["Leggings", "/collections/women?productType=Leggings"], ["Jerseys", "/collections/jerseys"]],
};

export function SportikaLogo({ inverse = false }: { inverse?: boolean }) {
  return <Link href="/" className={`brand-mark ${inverse ? "brand-mark--inverse" : ""}`} aria-label="SPORTIKA home">
    <svg viewBox="0 0 38 38" aria-hidden="true" className="brand-icon"><path d="M4 6h22l-3.3 7.3H12l-1.2 3.2h9.5c7.3 0 9.7 3.5 7.3 9.6-2.5 6-7.1 8.8-15 8.8H2.5L6 27.6h11.1c2.5 0 4.1-.8 4.8-2.3.7-1.6-.1-2.4-2.3-2.4h-8.2c-6 0-8.3-3.2-6-8.9L7 13c2.4-4.9 6.4-7 12-7Z" fill="currentColor"/><path d="M31 8h5l-7.2 26h-5z" fill="currentColor"/></svg>
    <span>SPORTIKA<span className="brand-dot">.</span></span>
  </Link>;
}

export function StoreShell({ children }: { children: ReactNode }) {
  const { cartCount, user } = useStore();
  const storefront = trpc.catalog.storefront.useQuery(undefined, { staleTime: 60_000 });
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();
  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    setLocation(`/search?q=${encodeURIComponent(search.trim())}`);
    setSearchOpen(false); setMenuOpen(false);
  };
  return <div className="site-frame">
    <div className="announcement"><span>SPORTIKA</span><i /> {storefront.data?.announcement ?? "DEMO STORE · Product, inventory, payment and delivery details are samples pending business setup"} <span className="announcement-more">MOVE FREELY</span></div>
    <header className="site-header">
      <div className="header-main">
        <button className="icon-button mobile-menu-button" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
        <SportikaLogo />
        <nav className="desktop-nav" aria-label="Main navigation">
          {nav.map(([label, href]) => {
            const menu = megaMenus[label];
            return menu ? <details key={href} className="nav-mega">
              <summary className="nav-link nav-mega-trigger">{label}<ChevronDown size={12} aria-hidden="true"/><span className="nav-line"/></summary>
              <nav className="mega-menu" aria-label={`${label} collections`}><span className="mega-menu-kicker">SPORTIKA / {label}</span><div className="mega-menu-links">{menu.map(([item, target]) => <Link key={`${item}-${target}`} href={target} onClick={event => { const disclosure = event.currentTarget.closest("details"); if (disclosure) disclosure.open = false; }}>{item}</Link>)}</div></nav>
            </details> : <Link key={href} href={href} className="nav-link">{label}<span className="nav-line" /></Link>;
          })}
          <Link href="/collections/new-arrivals" className="nav-link nav-new">New In</Link>
          <Link href="/collections/sale" className="nav-link">Sale</Link>
        </nav>
        <div className="header-actions">
          <button className="icon-button" aria-label="Search products" onClick={() => setSearchOpen(!searchOpen)}><Search size={20} /></button>
          {user?.role === "admin" && <Link href="/admin" className="account-link">Admin</Link>}
          <Link href="/account" className="account-link">{user?.name ? user.name.split(" ")[0] : "Account"}</Link>
          <Link href="/account/wishlist" className="icon-button" aria-label="Wishlist"><Heart size={19} /></Link>
          <Link href="/cart" className="icon-button bag-link" aria-label={`Cart with ${cartCount} items`}><ShoppingBag size={20} /><span className="cart-count">{cartCount}</span></Link>
        </div>
      </div>
      {searchOpen && <form className="search-tray" onSubmit={handleSearch}><Search size={18} /><input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tees, jerseys, training wear…" aria-label="Search catalog" /><button type="submit">SEARCH <ArrowRight size={15} /></button><button type="button" className="icon-button" aria-label="Close search" onClick={() => setSearchOpen(false)}><X size={17} /></button></form>}
      <div className={`mobile-drawer ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
        <div className="mobile-drawer-links">{nav.map(([label, href], index) => <Link key={href} href={href} onClick={() => setMenuOpen(false)}><span className="drawer-index">0{index + 1}</span>{label}<ArrowRight size={17} /></Link>)}
          <Link href="/collections/new-arrivals" onClick={() => setMenuOpen(false)}>New Arrivals <ArrowRight size={17} /></Link><Link href="/collections/sale" onClick={() => setMenuOpen(false)}>Sale <ArrowRight size={17} /></Link>
          <Link href="/account" onClick={() => setMenuOpen(false)}>My Account <ArrowRight size={17} /></Link><Link href="/account/wishlist" onClick={() => setMenuOpen(false)}>Wishlist <ArrowRight size={17} /></Link>{user?.role === "admin" && <Link href="/admin" onClick={() => setMenuOpen(false)}>Admin <ArrowRight size={17} /></Link>}
        </div>
        <p className="drawer-note">Built to move. Made to perform.</p>
      </div>
    </header>
    <main id="main-content">{children}</main>
    <footer className="site-footer">
      <div className="footer-top"><div className="footer-brand"><SportikaLogo inverse /><p>Performance-minded sportswear for training, competition, and the everyday in between.</p><span className="demo-note">DEMONSTRATION STORE · DETAILS SUBJECT TO CONFIGURATION</span></div>
        <div className="footer-col"><h3>SHOP</h3><Link href="/collections/men">Men</Link><Link href="/collections/women">Women</Link><Link href="/collections/training-wear">Training wear</Link><Link href="/collections/jerseys">Jerseys</Link><Link href="/collections/shorts-track-pants">Shorts & pants</Link><Link href="/collections/shoes">Shoes</Link></div>
        <div className="footer-col"><h3>SUPPORT</h3><Link href="/contact">Contact</Link><Link href="/faq">FAQs</Link><Link href="/shipping-policy">Shipping policy</Link><Link href="/return-policy">Returns policy</Link><Link href="/account/orders">Order history</Link></div>
        <div className="footer-col"><h3>DISCOVER</h3><Link href="/collections/new-arrivals">New arrivals</Link><Link href="/collections/sale">Selected offers</Link><Link href="/account/wishlist">Wishlist</Link><Link href="/about">Our story</Link></div>
        <div className="footer-col footer-social"><h3>FIND SPORTIKA</h3><a href="https://www.instagram.com/explore/search/keyword/?q=SPORTIKA" target="_blank" rel="noreferrer">Search Instagram</a><a href="https://www.youtube.com/results?search_query=SPORTIKA+sportswear" target="_blank" rel="noreferrer">Search YouTube</a><a href="https://www.facebook.com/search/top?q=SPORTIKA" target="_blank" rel="noreferrer">Search Facebook</a></div>
      </div>
      <div className="footer-bottom"><span>© 2026 SPORTIKA · DEMO CATALOG</span><div><Link href="/privacy-policy">Privacy</Link><Link href="/terms">Terms</Link><span>India · INR ₹</span></div></div>
    </footer>
  </div>;
}
