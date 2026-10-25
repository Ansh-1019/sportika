import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ChevronRight, X } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { ProductCard } from "@/components/ProductCard";
import { trpc } from "@/lib/trpc";
import { usePageMeta } from "@/lib/seo";
import NotFound from "@/pages/NotFound";
import { priceRangeError } from "@shared/catalog-filters";

const titles: Record<string,string> = { collections: "Sportswear", men: "Men's Sportswear", women: "Women's Sportswear", jerseys: "Jerseys", "training-wear": "Training Wear", "shorts-track-pants": "Shorts & Track Pants", shoes: "Sports Shoes", accessories: "Accessories", "new-arrivals": "New Arrivals", sale: "Selected Offers" };
const descs: Record<string,string> = { collections: "Explore clothing-first sportswear, from training T-shirts and jerseys to shorts, leggings and tracksuits.", men: "Training layers, jerseys and performance clothing for men.", women: "Sports tops, leggings and training essentials for women.", jerseys: "Lightweight training jerseys for match days and practice.", "training-wear": "T-shirts, tops, leggings and outerwear for training.", "shorts-track-pants": "Running shorts and track pants for room to move.", shoes: "Supporting footwear listings; supplier details are not yet verified.", accessories: "Training-day bags and accessories in the demo catalog.", "new-arrivals": "Recently added products in the SPORTIKA demo catalog.", sale: "Configured sample offers on selected demo products." };
export default function CollectionPage() {
  const [collectionRoute, params] = useRoute("/collections/:slug");
  const [location] = useLocation();
  const collection = collectionRoute ? params.slug : "collections";
  const isSearch = location.startsWith("/search");
  const isOffers = !isSearch && collection === "sale";
  const initialFilters = new URLSearchParams(window.location.search);
  const [search, setSearch] = useState(isSearch ? initialFilters.get("q") ?? "" : "");
  const [gender, setGender] = useState(initialFilters.get("gender") ?? ""); const [size, setSize] = useState(initialFilters.get("size") ?? ""); const [color, setColor] = useState(initialFilters.get("color") ?? "");
  const [sport, setSport] = useState(initialFilters.get("sport") ?? ""); const [productType, setProductType] = useState(initialFilters.get("productType") ?? ""); const [minPrice, setMinPrice] = useState(initialFilters.get("minPrice") ?? ""); const [maxPrice, setMaxPrice] = useState(initialFilters.get("maxPrice") ?? "");
  const parsedMinPrice = minPrice.trim() === "" ? undefined : Number(minPrice); const parsedMaxPrice = maxPrice.trim() === "" ? undefined : Number(maxPrice);
  const priceError = priceRangeError(parsedMinPrice, parsedMaxPrice);
  const [sort, setSort] = useState<"featured"|"newest"|"price-asc"|"price-desc"|"best-selling">((initialFilters.get("sort") as "featured"|"newest"|"price-asc"|"price-desc"|"best-selling") || "featured"); const [page, setPage] = useState(1);
  useEffect(() => { const params=new URLSearchParams(window.location.search); setSearch(isSearch?params.get("q")??"":""); setGender(params.get("gender")??"");setSize(params.get("size")??"");setColor(params.get("color")??"");setSport(params.get("sport")??"");setProductType(params.get("productType")??"");setMinPrice(params.get("minPrice")??"");setMaxPrice(params.get("maxPrice")??"");setSort((params.get("sort") as typeof sort)||"featured");setPage(1); }, [location]);
  const categories = trpc.catalog.categories.useQuery(undefined, { staleTime: 60_000 });
  const facets = trpc.catalog.filters.useQuery({ collection: isSearch ? undefined : collection }, { staleTime: 60_000 });
  const settings = trpc.catalog.settings.useQuery(undefined, { staleTime: 60_000 });
  const effectiveSort = sort === "best-selling" && settings.data?.bestSellingAvailable !== true ? "featured" : sort;
  useEffect(() => { if (settings.data && !settings.data.bestSellingAvailable && sort === "best-selling") setSort("featured"); }, [settings.data?.bestSellingAvailable, sort]);
  const input = useMemo(() => ({ collection: isSearch ? undefined : collection, search: search.trim() || undefined, gender: gender || undefined, size: size || undefined, color: color || undefined,
    sport: sport || undefined, productType: productType || undefined, minPrice: priceError ? undefined : parsedMinPrice, maxPrice: priceError ? undefined : parsedMaxPrice,
    sort: effectiveSort, page, pageSize: 12 }), [collection,isSearch,isOffers,search,gender,size,color,sport,productType,parsedMinPrice,parsedMaxPrice,priceError,effectiveSort,page]);
  const catalog = trpc.catalog.list.useQuery(input, { placeholderData: previous => previous, staleTime: 20_000, enabled: !priceError });
  const dynamicCategory = categories.data?.find(category => category.slug === collection);
  const title = isSearch ? "Search results" : titles[collection] ?? dynamicCategory?.name ?? "Sportswear";
  const description = isSearch ? `Search results for ${search || "sportswear"} in the SPORTIKA demonstration catalog.` : descs[collection] ?? dynamicCategory?.description ?? descs.collections;
  usePageMeta(`${title} | SPORTIKA`, description);
  const activeFilters = [gender && ["Gender",gender,()=>setGender("")],size && ["Size",size,()=>setSize("")],color && ["Color",color,()=>setColor("")],sport && ["Sport",sport,()=>setSport("")],productType && ["Type",productType,()=>setProductType("")],minPrice && ["From",`₹${minPrice}`,()=>setMinPrice("")],maxPrice && ["To",`₹${maxPrice}`,()=>setMaxPrice("")]].filter(Boolean) as Array<[string,string,()=>void]>;
  const clear = () => { setGender("");setSize("");setColor("");setSport("");setProductType("");setMinPrice("");setMaxPrice("");setPage(1); };
  const pages = Math.max(1, Math.ceil((catalog.data?.total ?? 0) / 12));
  if (!isSearch && collectionRoute && categories.isSuccess && !titles[collection] && !dynamicCategory) return <NotFound/>;
  return <div className="page-wrap">
    <section className="collection-hero"><div className="breadcrumbs"><Link href="/">Home</Link><ChevronRight size={12}/><Link href="/collections">Collections</Link>{collection !== "collections" && <><ChevronRight size={12}/><span>{title}</span></>}</div>
      <div className="collection-title-row"><h1>{title}</h1><p>{description} <span className="demo-note">Catalog records are demonstration data.</span></p></div>
    </section>
    {isSearch && <form className="search-tray search-page-form" onSubmit={event=>{event.preventDefault();setPage(1);}}><input value={search} onChange={event=>{setSearch(event.target.value);setPage(1);}} placeholder="Search products, activity or type…" aria-label="Search SPORTIKA catalog"/><button type="submit">SEARCH <ArrowRight size={15}/></button></form>}
    <div className="collection-controls"><div className="filter-toolbar">
      <label className="sr-only" htmlFor="gender-filter">Gender</label><select id="gender-filter" className="filter-select" value={gender} onChange={e=>{setGender(e.target.value);setPage(1);}}><option value="">Gender</option>{(facets.data?.genders??[]).map(value=><option key={value}>{value}</option>)}</select>
      <label className="sr-only" htmlFor="size-filter">Size</label><select id="size-filter" className="filter-select" value={size} onChange={e=>{setSize(e.target.value);setPage(1);}}><option value="">Size</option>{(facets.data?.sizes??[]).map(value=><option key={value}>{value}</option>)}</select>
      {(facets.data?.colors.length??0)>1&&<><label className="sr-only" htmlFor="color-filter">Color</label><select id="color-filter" className="filter-select" value={color} onChange={e=>{setColor(e.target.value);setPage(1);}}><option value="">Color</option>{facets.data?.colors.map(value=><option key={value}>{value}</option>)}</select></>}
      <label className="sr-only" htmlFor="sport-filter">Sport</label><select id="sport-filter" className="filter-select" value={sport} onChange={e=>{setSport(e.target.value);setPage(1);}}><option value="">Sport / activity</option>{(facets.data?.sports??[]).map(value=><option key={value}>{value}</option>)}</select>
      <label className="sr-only" htmlFor="type-filter">Product type</label><select id="type-filter" className="filter-select" value={productType} onChange={e=>{setProductType(e.target.value);setPage(1);}}><option value="">Product type</option>{(facets.data?.productTypes??[]).map(value=><option key={value}>{value}</option>)}</select>
      <input className="filter-select" type="number" min="0" step="1" placeholder="Min ₹" aria-label="Minimum price" value={minPrice} onChange={e=>{setMinPrice(e.target.value);setPage(1);}} />
      <input className="filter-select" type="number" min="0" step="1" placeholder="Max ₹" aria-label="Maximum price" value={maxPrice} onChange={e=>{setMaxPrice(e.target.value);setPage(1);}} />
    </div><label className="sr-only" htmlFor="sort-products">Sort products</label><select id="sort-products" className="sort-select" value={sort} onChange={e=>{setSort(e.target.value as typeof sort);setPage(1);}}><option value="featured">Featured</option><option value="newest">Newest</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="best-selling" disabled={!settings.data?.bestSellingAvailable}>Best-selling{settings.data?.bestSellingAvailable ? "" : " (requires verified live paid sales)"}</option></select></div>
    {priceError&&<p className="filter-error" role="alert">{priceError}</p>}
    <div className="active-filters-row"><span className="filter-count">{priceError ? "Check price range" : catalog.isLoading ? "Loading…" : `${catalog.data?.total ?? 0} products`}</span><div className="active-filter-list">{activeFilters.map(([label,value,remove])=><button className="active-filter" key={label} onClick={remove}>{label}: {value}<X size={11}/></button>)}{activeFilters.length>0&&<button className="clear-filters" onClick={clear}>Clear all</button>}</div></div>
    <section className="collection-body" aria-live="polite">
      {priceError ? <div className="empty-state"><h2>Check your price range.</h2><p>{priceError}</p><button className="btn-outline" onClick={()=>{setMinPrice("");setMaxPrice("");setPage(1);}}>Reset price range</button></div> : catalog.isError ? <div className="empty-state"><h2>Catalog unavailable</h2><p>{catalog.error.message}. Please refresh in a moment.</p><button className="btn-outline" onClick={()=>catalog.refetch()}>Retry</button></div> : catalog.data?.products.length ? <div className="product-grid">{catalog.data.products.map((product,i)=><ProductCard key={product.id} product={product} index={i}/>)}</div> : catalog.isLoading ? <div className="product-grid">{Array.from({length:8},(_,i)=><div className="product-skeleton" key={i}><div/><span>Loading demo products</span></div>)}</div> : <div className="empty-state"><h2>No products match those filters.</h2><p>Try a different size, activity or price range.</p><button className="btn-outline" onClick={clear}>Clear all filters</button></div>}
      {pages>1&&<nav className="pagination" aria-label="Collection pages"><button disabled={page===1} onClick={()=>setPage(page-1)}>Previous</button>{Array.from({length:pages},(_,i)=><button className={page===i+1?"active":""} key={i} onClick={()=>setPage(i+1)} aria-current={page===i+1?"page":undefined}>{i+1}</button>)}<button disabled={page===pages} onClick={()=>setPage(page+1)}>Next</button></nav>}
    </section>
  </div>;
}
