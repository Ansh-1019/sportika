import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, LogOut, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { startLogin } from "../const";
import { useStore } from "@/lib/store";
import { trpc } from "@/lib/trpc";
import { usePageMeta } from "@/lib/seo";

const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
const nav = [
  ["/admin", "overview"], ["/admin/products", "products"], ["/admin/categories", "categories"], ["/admin/inventory", "inventory"],
  ["/admin/orders", "orders"], ["/admin/returns", "returns"], ["/admin/customers", "customers"], ["/admin/coupons", "coupons"],
  ["/admin/support", "support"], ["/admin/newsletter", "newsletter"], ["/admin/analytics", "analytics"], ["/admin/settings", "settings"],
];
const imageToBase64 = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
  reader.onerror = () => reject(new Error("Could not read the image"));
  reader.readAsDataURL(file);
});

type FulfillmentStatus = "processing" | "shipped" | "delivered" | "cancelled";
const STATUS_TRANSITIONS: Record<string, FulfillmentStatus[]> = {
  pending: ["processing", "cancelled"], processing: ["shipped", "cancelled"], shipped: ["delivered"],
  delivered: [], cancelled: [], return_requested: [], returned: [],
};
type ReturnRequestStatus = "requested" | "approved" | "rejected" | "received" | "refunded";
const RETURN_TRANSITIONS: Record<ReturnRequestStatus, ReturnRequestStatus[]> = {
  requested: ["approved", "rejected"], approved: ["received"], received: ["refunded"], rejected: [], refunded: [],
};
const RETURN_LABELS: Record<ReturnRequestStatus, string> = {
  requested: "Requested", approved: "Approved", rejected: "Rejected", received: "Received", refunded: "Refunded (record only)",
};
function statusLabel(status: string) { return status.replaceAll("_", " ").replace(/^./, character => character.toUpperCase()); }

function AdminHeading({ section }: { section: string }) {
  return <>
    <div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><Link href="/admin">Admin</Link><span>/</span><span>{section}</span></div>
    <span className="eyebrow eyebrow-mark">SPORTIKA / store operations</span>
    <h1>{section}<span className="brand-dot">.</span></h1>
    <p className="lead">Protected demo operations. Changes to the managed database persist across development and published versions.</p>
  </>;
}

function Table({ columns, rows, emptyMessage = "No records available." }: { columns: string[]; rows: ReactNode[]; emptyMessage?: string }) {
  return <div className="table-scroll"><table className="data-table"><thead><tr>{columns.map(column => <th key={column}>{column}</th>)}</tr></thead>
    <tbody>{rows.length ? rows : <tr><td colSpan={columns.length}>{emptyMessage}</td></tr>}</tbody>
  </table></div>;
}

export default function AdminPage() {
  const [location] = useLocation();
  const [customerSearch, setCustomerSearch] = useState("");
  const section = location === "/admin" ? "overview" : location.split("/").pop()?.toLowerCase() ?? "overview";
  const sectionTitle = section.charAt(0).toUpperCase() + section.slice(1);
  const { user } = useStore();
  const admin = user?.role === "admin";
  const enabled = !!admin;
  usePageMeta(`Admin ${sectionTitle} | SPORTIKA`, "Protected SPORTIKA store administration.");

  const overview = trpc.admin.overview.useQuery(undefined, { enabled: enabled && (section === "overview" || section === "analytics") });
  const products = trpc.admin.products.useQuery(undefined, { enabled: enabled && (section === "products" || section === "settings") });
  const categories = trpc.admin.categories.useQuery(undefined, { enabled: enabled && (section === "categories" || section === "products") });
  const inventory = trpc.admin.inventory.useQuery(undefined, { enabled: enabled && section === "inventory" });
  const orders = trpc.admin.orders.useQuery(undefined, { enabled: enabled && section === "orders" });
  const returns = trpc.admin.returns.useQuery(undefined, { enabled: enabled && section === "returns" });
  const trimmedCustomerSearch = customerSearch.trim();
  const customers = trpc.admin.customers.useQuery({ search: trimmedCustomerSearch || undefined }, { enabled: enabled && section === "customers" });
  const coupons = trpc.admin.coupons.useQuery(undefined, { enabled: enabled && section === "coupons" });
  const support = trpc.admin.support.useQuery(undefined, { enabled: enabled && section === "support" });
  const newsletter = trpc.admin.newsletter.useQuery(undefined, { enabled: enabled && section === "newsletter" });
  const settings = trpc.admin.settings.useQuery(undefined, { enabled: enabled && section === "settings" });

  const createProduct = trpc.admin.createProduct.useMutation({ onSuccess: () => { toast.success("Product saved."); products.refetch(); } });
  const uploadImage = trpc.admin.uploadImage.useMutation();
  const updateProduct = trpc.admin.updateProduct.useMutation({ onSuccess: () => { toast.success("Product updated."); products.refetch(); } });
  const updateVariant = trpc.admin.updateVariant.useMutation({ onSuccess: () => { toast.success("Variant updated."); products.refetch(); inventory.refetch(); } });
  const createCategory = trpc.admin.createCategory.useMutation({ onSuccess: () => { toast.success("Category saved."); categories.refetch(); } });
  const updateStock = trpc.admin.updateStock.useMutation({ onSuccess: () => inventory.refetch() });
  const updateStatus = trpc.admin.setOrderStatus.useMutation({ onSuccess: () => { toast.success("Order status saved."); orders.refetch(); overview.refetch(); } });
  const updateTracking = trpc.admin.updateTracking.useMutation({ onSuccess: () => { toast.success("Tracking reference saved."); orders.refetch(); } });
  const updateReturn = trpc.admin.setReturnStatus.useMutation({ onSuccess: () => { toast.success("Return request updated."); returns.refetch(); } });
  const createCoupon = trpc.admin.createCoupon.useMutation({ onSuccess: () => { toast.success("Coupon saved."); coupons.refetch(); } });
  const updateCoupon = trpc.admin.updateCoupon.useMutation({ onSuccess: () => { toast.success("Coupon updated."); coupons.refetch(); } });
  const updateSupport = trpc.admin.setSupportStatus.useMutation({ onSuccess: () => support.refetch() });
  const updateShipping = trpc.admin.updateShipping.useMutation({ onSuccess: () => { toast.success("Demo shipping rules saved."); settings.refetch(); } });
  const updateHome = trpc.admin.updateStorefront.useMutation({ onSuccess: () => { toast.success("Homepage campaign settings saved."); settings.refetch(); } });
  const logout = trpc.auth.logout.useMutation({ onSuccess: () => window.location.reload() });
  const featuredIds = useMemo(() => products.data?.filter(product => product.featured).map(product => product.id) ?? [], [products.data]);

  if (!user) return <div className="page-wrap content-page"><AdminHeading section="Sign in" />
    <div className="form-card"><p>Sign in through configured Manus OAuth. Administrator access is verified by the server; no admin role is assumed.</p>
      <button className="btn-dark" onClick={() => startLogin()}>Continue with Manus <ArrowRight size={15} /></button></div>
  </div>;
  if (!admin) return <div className="page-wrap content-page"><AdminHeading section="Access restricted" />
    <div className="form-card"><p>Your account does not have the administrator role. Admin API procedures enforce this restriction server-side.</p><Link className="btn-outline" href="/account">Go to your account</Link></div>
  </div>;

  const handleProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const files = Array.from((form.elements.namedItem("images") as HTMLInputElement).files ?? []);
      if (files.length > 6) throw new Error("Select no more than six images");
      const images = String(data.get("imagesUrl") ?? "").split(",").map(value => value.trim()).filter(Boolean);
      for (const file of files) {
        if (file.size > 5_000_000) throw new Error(`${file.name} exceeds the 5 MB upload limit`);
        if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) throw new Error(`${file.name} is not a supported image type`);
        const base64 = await imageToBase64(file);
        const uploaded = await uploadImage.mutateAsync({ filename: file.name, contentType: file.type as "image/jpeg" | "image/png" | "image/webp" | "image/avif", base64 });
        images.push(uploaded.url);
      }
      if (!images.length) throw new Error("Add at least one product image URL or upload an image");
      await createProduct.mutateAsync({
        name: String(data.get("name")), slug: String(data.get("slug")), description: String(data.get("description")),
        categorySlug: String(data.get("categorySlug")), gender: String(data.get("gender")), productType: String(data.get("productType")),
        sport: String(data.get("sport")), price: Number(data.get("price")),
        ...(String(data.get("originalPrice") ?? "").trim() ? { originalPrice: Number(data.get("originalPrice")) } : {}), images,
        sizes: String(data.get("sizes")).split(",").map(value => value.trim()).filter(Boolean), color: String(data.get("color")),
      });
      form.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Product was not saved");
    }
  };

  const handleEditProduct = async (event: FormEvent<HTMLFormElement>, productId: number) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const files = Array.from((form.elements.namedItem("newImages") as HTMLInputElement).files ?? []);
      const images = String(data.get("imageUrls") ?? "").split("\n").map(value => value.trim()).filter(Boolean);
      if (images.length + files.length > 6) throw new Error("Keep the product gallery to six images or fewer");
      for (const file of files) {
        if (file.size > 5_000_000) throw new Error(`${file.name} exceeds the 5 MB upload limit`);
        if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) throw new Error(`${file.name} is not a supported image type`);
        images.push((await uploadImage.mutateAsync({ filename: file.name, contentType: file.type as "image/jpeg" | "image/png" | "image/webp" | "image/avif", base64: await imageToBase64(file) })).url);
      }
      if (!images.length) throw new Error("Keep at least one gallery image");
      const originalPrice = String(data.get("originalPrice") ?? "").trim();
      await updateProduct.mutateAsync({ id: productId, name: String(data.get("name")), description: String(data.get("description")),
        categorySlug: String(data.get("categorySlug")), gender: String(data.get("gender")), productType: String(data.get("productType")), sport: String(data.get("sport")),
        price: Number(data.get("price")), originalPrice: originalPrice ? Number(originalPrice) : null, active: data.get("active") === "on",
        featured: data.get("featured") === "on", newArrival: data.get("newArrival") === "on", images });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Product could not be updated");
    }
  };

  const knownSection = nav.some(([path]) => path === "/admin" ? location === path : path === location);
  return <div className="page-wrap content-page admin-page">
    <AdminHeading section={sectionTitle} />
    <nav className="admin-nav" aria-label="Administration sections">
      {nav.map(([path, label]) => <Link href={path} key={path} aria-current={(path === "/admin" ? location === path : location === path) ? "page" : undefined}>{label}</Link>)}
    </nav>

    {section === "overview" && <>
      <div className="stat-grid">{[
        ["Catalog products", overview.data?.productCount ?? "—"], ["Registered customers", overview.data?.customerCount ?? "—"],
        ["Total orders", overview.data?.orderCount ?? "—"], ["Pending orders", overview.data?.pendingCount ?? "—"],
        ["Confirmed live paid revenue", money(overview.data?.paidRevenue ?? 0)], ["Low-stock variants", overview.data?.lowStock.length ?? "—"],
      ].map(([label, value]) => <div className="stat-card" key={String(label)}><span>{label}</span><strong>{value}</strong></div>)}</div>
      <p className="admin-note">Demo orders are unpaid and excluded from paid revenue. Best-selling rankings require genuine paid live orders.</p>
      <h2>Low stock</h2>
      <Table columns={["Product", "SKU", "Variant", "Stock"]} rows={(overview.data?.lowStock ?? []).map(item => <tr key={item.variantId}><td>{item.productName}</td><td>{item.sku}</td><td>{item.color} / {item.size}</td><td>{item.stock}</td></tr>)} />
    </>}

    {section === "products" && <>
      <h2>Catalog</h2>
      <Table columns={["Product", "Category", "Variants", "Price", "Published / archive"]} rows={(products.data ?? []).map(product => <tr key={product.id}>
        <td><Link href={`/products/${product.slug}`}>{product.name}</Link><br /><small>{product.slug}{product.isDemo ? " · DEMO" : ""}</small></td>
        <td>{product.categoryName}</td><td>{product.variants.length}</td>
        <td>{money(product.price)}{product.originalPrice && product.originalPrice > product.price ? <><br /><del>{money(product.originalPrice)}</del></> : null}</td>
        <td><span>{product.archived ? "Archived" : product.active ? "Published" : "Unpublished"}</span><br />
          {!product.archived && <button type="button" onClick={() => updateProduct.mutate({ id: product.id, active: !product.active })}>{product.active ? "Unpublish" : "Publish"}</button>}
          <button type="button" onClick={() => {
            if (!product.archived && !window.confirm(`Archive “${product.name}”? This removes it from the active catalog.`)) return;
            updateProduct.mutate(product.archived ? { id: product.id, archived: false } : { id: product.id, archived: true });
          }}>{product.archived ? "Restore" : "Archive"}</button>
        </td>
      </tr>)} />
      <h2>Edit catalog records, images and variants</h2>
      <div className="admin-edit-list">{(products.data ?? []).map(product => <details className="admin-edit-card" key={product.id}>
        <summary>{product.name} · {product.categoryName} · {product.archived ? "Archived" : product.active ? "Published" : "Unpublished"}</summary>
        <form className="admin-edit-form" onSubmit={event => handleEditProduct(event, product.id)}>
          <div className="form-two"><div className="field"><label htmlFor={`edit-name-${product.id}`}>Product name</label><input id={`edit-name-${product.id}`} name="name" maxLength={220} defaultValue={product.name} required /></div><div className="field"><label htmlFor={`edit-category-${product.id}`}>Category</label><select id={`edit-category-${product.id}`} name="categorySlug" defaultValue={product.categorySlug}>{categories.data?.map(category => <option key={category.id} value={category.slug}>{category.name}</option>)}</select></div></div>
          <div className="field"><label htmlFor={`edit-description-${product.id}`}>Description (mark provisional supplier claims)</label><textarea id={`edit-description-${product.id}`} name="description" minLength={10} maxLength={3000} defaultValue={product.description} required /></div>
          <div className="form-two"><div className="field"><label>Audience</label><select name="gender" defaultValue={product.gender}><option>Unisex</option><option>Men</option><option>Women</option></select></div><div className="field"><label>Product type</label><input name="productType" defaultValue={product.productType} required /></div></div>
          <div className="form-two"><div className="field"><label>Sport / activity</label><input name="sport" defaultValue={product.sport} required /></div><div className="field"><label>Current price (INR)</label><input name="price" type="number" min="1" defaultValue={product.price} required /></div></div>
          <div className="field"><label>Original price (INR, leave blank for no offer)</label><input name="originalPrice" type="number" min="1" defaultValue={product.originalPrice ?? ""} /></div>
          <div className="field"><label>Gallery URLs (one per line; retain at least one)</label><textarea name="imageUrls" defaultValue={product.images.map(image => image.url).join("\n")} required /></div>
          <div className="field"><label>Upload additional gallery images (JPEG/PNG/WebP/AVIF, up to 6 total; 5 MB each)</label><input name="newImages" type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" /></div>
          <div className="form-two"><label><input name="active" type="checkbox" defaultChecked={product.active && !product.archived} /> Published</label><label><input name="featured" type="checkbox" defaultChecked={product.featured} /> Feature on home</label><label><input name="newArrival" type="checkbox" defaultChecked={product.newArrival} /> New arrival</label></div>
          <button className="btn-dark" type="submit" disabled={updateProduct.isPending || uploadImage.isPending}>Save product</button>
        </form>
        <h3>Variants, sizes, colors, SKU and stock</h3>
        <div className="table-scroll"><table className="data-table admin-variant-table"><thead><tr><th>SKU</th><th>Size</th><th>Color</th><th>Swatch</th><th>Variant price (blank = product price)</th><th>Stock</th><th>Available</th><th>Save</th></tr></thead><tbody>
          {product.variants.map(variant => <tr key={variant.id}><td><input form={`variant-${variant.id}`} name="sku" defaultValue={variant.sku} aria-label={`SKU ${variant.sku}`} /></td><td><input form={`variant-${variant.id}`} name="size" defaultValue={variant.size} aria-label={`Size ${variant.sku}`} /></td><td><input form={`variant-${variant.id}`} name="color" defaultValue={variant.color} aria-label={`Color ${variant.sku}`} /></td><td><input form={`variant-${variant.id}`} name="colorHex" type="color" defaultValue={variant.colorHex} aria-label={`Color swatch ${variant.sku}`} /></td><td><input form={`variant-${variant.id}`} name="price" type="number" min="1" defaultValue={variant.price ?? ""} aria-label={`Variant price ${variant.sku}`} /></td><td><input form={`variant-${variant.id}`} name="stock" type="number" min="0" defaultValue={variant.stock} aria-label={`Stock ${variant.sku}`} /></td><td><input form={`variant-${variant.id}`} name="active" type="checkbox" defaultChecked={variant.active} aria-label={`Available ${variant.sku}`} /></td><td><form id={`variant-${variant.id}`} onSubmit={event => { event.preventDefault(); const data=new FormData(event.currentTarget); const raw=String(data.get("price")??"").trim(); updateVariant.mutate({id:variant.id,sku:String(data.get("sku")),size:String(data.get("size")),color:String(data.get("color")),colorHex:String(data.get("colorHex")),price:raw?Number(raw):null,stock:Number(data.get("stock")),active:data.get("active")==="on"}); }}><button type="submit">Save</button></form></td></tr>)}
        </tbody></table></div>
      </details>)}</div>
      <h2>Add product</h2>
      <form className="admin-form" onSubmit={handleProduct}>
        <div className="field"><label htmlFor="product-name">Product name</label><input id="product-name" name="name" required maxLength={220} /></div>
        <div className="field"><label htmlFor="product-slug">Slug</label><input id="product-slug" name="slug" required maxLength={180} /></div>
        <div className="field"><label htmlFor="product-description">Description</label><textarea id="product-description" name="description" required minLength={10} /></div>
        <div className="form-two"><div className="field"><label>Category</label><select name="categorySlug" required>{categories.data?.map(category => <option value={category.slug} key={category.id}>{category.name}</option>)}</select></div>
          <div className="field"><label>Audience</label><select name="gender"><option>Unisex</option><option>Men</option><option>Women</option></select></div></div>
        <div className="form-two"><div className="field"><label>Product type</label><input name="productType" required /></div><div className="field"><label>Sport/activity</label><input name="sport" required /></div></div>
        <div className="form-two"><div className="field"><label>Price (INR)</label><input name="price" type="number" min="1" required /></div><div className="field"><label>Original price (optional)</label><input name="originalPrice" type="number" min="1" /></div></div>
        <div className="form-two"><div className="field"><label>Color</label><input name="color" defaultValue="Black" required /></div><div className="field"><label>Sizes (comma-separated)</label><input name="sizes" defaultValue="S,M,L,XL" required /></div></div>
        <div className="field"><label>Image URL(s), comma-separated</label><input name="imagesUrl" type="text" placeholder="/manus-storage/... or https://…" /></div>
        <div className="field"><label htmlFor="image-upload">Or upload up to 6 product images (JPEG/PNG/WebP/AVIF, 5 MB each)</label><input id="image-upload" name="images" type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" /></div>
        <button className="btn-dark" type="submit" disabled={createProduct.isPending || uploadImage.isPending}>{createProduct.isPending || uploadImage.isPending ? "Saving…" : "Create demo product"}</button>
        <p className="toast-demo">New records are marked as demonstration products until supplier and stock data are confirmed.</p>
      </form>
    </>}

    {section === "categories" && <>
      <Table columns={["Category", "Slug", "Description"]} rows={(categories.data ?? []).map(category => <tr key={category.id}><td>{category.name}</td><td>{category.slug}</td><td>{category.description}</td></tr>)} />
      <form className="inline-form" onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); createCategory.mutate({ name: String(data.get("name")), slug: String(data.get("slug")), description: String(data.get("description")) }); event.currentTarget.reset(); }}>
        <input name="name" placeholder="Category name" required /><input name="slug" placeholder="slug" required /><input name="description" placeholder="Description" required /><button className="btn-dark">Add category</button>
      </form>
    </>}

    {section === "inventory" && <Table columns={["Product", "SKU", "Size / color", "Available", "Set stock"]} rows={(inventory.data ?? []).map(variant => <tr key={variant.id}>
      <td>{variant.product}</td><td>{variant.sku}</td><td>{variant.size} / {variant.color}</td><td>{variant.stock}</td>
      <td><form onSubmit={event => { event.preventDefault(); const value = Number(new FormData(event.currentTarget).get("stock")); updateStock.mutate({ variantId: variant.id, stock: value }); }}>
        <input name="stock" aria-label={`Stock for ${variant.sku}`} className="stock-input" type="number" min="0" defaultValue={variant.stock} /><button>Save</button></form></td>
    </tr>)} />}

    {section === "orders" && <Table columns={["Order / date", "Customer / delivery", "Payment", "Items / total", "Status", "Tracking"]} rows={(orders.data ?? []).map(order => <tr key={order.id}>
      <td>{order.orderNumber}<br /><small>{new Date(order.createdAt).toLocaleDateString()}</small></td>
      <td>{order.customerName}<br />{order.email}<br /><small>{order.addressLine1}, {order.city}, {order.state} {order.pinCode}</small></td>
      <td>{order.paymentStatus}<br /><small>{order.mode}</small></td>
      <td><details><summary>{order.items.length} item(s) · {money(order.total)}</summary>{order.items.map(item => <p key={item.id}>{item.productNameSnapshot} · {item.variantSnapshot} × {item.quantity} — {money(item.lineTotal)}</p>)}</details></td>
      <td><select value={order.status} onChange={event => { const value = event.target.value as FulfillmentStatus; if (STATUS_TRANSITIONS[order.status]?.includes(value)) updateStatus.mutate({ id: order.id, status: value }); }} aria-label={`Update ${order.orderNumber}`}>
        <option value={order.status}>{statusLabel(order.status)}</option>{(STATUS_TRANSITIONS[order.status] ?? []).map(status => <option value={status} key={status}>{status === "cancelled" ? "Cancelled / restock once" : statusLabel(status)}</option>)}
      </select></td>
      <td><form onSubmit={event => { event.preventDefault(); updateTracking.mutate({ id: order.id, trackingReference: String(new FormData(event.currentTarget).get("tracking")) }); }}>
        <input name="tracking" defaultValue={order.trackingReference ?? ""} placeholder="Tracking ref" aria-label={`Tracking for ${order.orderNumber}`} /><button>Save</button></form></td>
    </tr>)} />}

    {section === "returns" && <Table columns={["Request", "Order", "Customer", "Reason", "Status", "Decision"]} rows={(returns.data ?? []).map(item => <tr key={item.id}>
      <td>#{item.id}<br /><small>{new Date(item.createdAt).toLocaleDateString()}</small></td><td>{item.orderNumber}</td><td>{item.customerName}<br />{item.email}</td><td>{item.reason}</td><td>{item.status}</td>
      <td><select value={item.status} disabled={RETURN_TRANSITIONS[item.status].length === 0} onChange={event => { const value = event.target.value as ReturnRequestStatus; if (RETURN_TRANSITIONS[item.status].includes(value) && value !== "requested") updateReturn.mutate({ id: item.id, status: value }); }}>
        <option value={item.status}>{RETURN_LABELS[item.status]}</option>{RETURN_TRANSITIONS[item.status].map(status => <option value={status} key={status}>{RETURN_LABELS[status]}</option>)}
      </select></td>
    </tr>)} />}

    {section === "customers" && <>
      <div className="field">
        <label htmlFor="admin-customer-search">Search customers</label>
        <input id="admin-customer-search" type="search" value={customerSearch} onChange={event => setCustomerSearch(event.target.value)} placeholder="Name or email" />
      </div>
      {customers.isLoading && <p role="status">Loading customers…</p>}
      {customers.isError && <p role="alert">Could not load customers: {customers.error.message}</p>}
      <Table columns={["Customer", "Email", "Registered", "Role", "Status", "Orders / last order"]} emptyMessage={trimmedCustomerSearch ? "No customers match this search." : "No customers found."} rows={(customers.data ?? []).map(item => {
        // These optional fields are safe to show when the API includes them; no sensitive account data is read or requested.
        const safeItem = item as typeof item & { role?: string | null; status?: string | null; orderCount?: number | null; lastOrderAt?: Date | string | null };
        const role = typeof safeItem.role === "string" && safeItem.role.trim() ? safeItem.role : "—";
        const status = typeof safeItem.status === "string" && safeItem.status.trim() ? statusLabel(safeItem.status) : "—";
        const orderCount = typeof safeItem.orderCount === "number" ? `${safeItem.orderCount} order${safeItem.orderCount === 1 ? "" : "s"}` : null;
        const lastOrder = safeItem.lastOrderAt ? new Date(safeItem.lastOrderAt).toLocaleDateString() : null;
        return <tr key={item.id}><td>{item.name ?? "—"}</td><td>{item.email ?? "—"}</td><td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}</td><td>{role}</td><td>{status}</td><td>{[orderCount, lastOrder ? `Last: ${lastOrder}` : null].filter(Boolean).join(" · ") || "—"}</td></tr>;
      })} />
    </>}

    {section === "coupons" && <>
      <Table columns={["Code", "Discount", "Minimum subtotal", "Active"]} rows={(coupons.data ?? []).map(item => <tr key={item.id}><td>{item.code}</td><td>{item.discountType === "percent" ? `${item.discountValue}%` : money(item.discountValue)}</td><td>{money(item.minimumSubtotal)}</td><td>{item.active ? "Yes" : "No"}<br /><button type="button" onClick={() => updateCoupon.mutate({ id: item.id, active: !item.active })}>{item.active ? "Deactivate" : "Activate"}</button></td></tr>)} />
      <form className="inline-form" onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); createCoupon.mutate({ code: String(data.get("code")), discountType: String(data.get("type")) as "percent" | "fixed", discountValue: Number(data.get("value")), minimumSubtotal: Number(data.get("minimum")) }); event.currentTarget.reset(); }}>
        <input name="code" placeholder="Coupon code" required /><select name="type"><option value="percent">Percent</option><option value="fixed">Fixed INR</option></select><input name="value" type="number" min="1" placeholder="Value" required /><input name="minimum" type="number" min="0" placeholder="Minimum" required /><button className="btn-dark">Create coupon</button>
      </form><p className="toast-demo">MOVE10 is a sample coupon, not a commercial promotion promise until verified.</p>
    </>}

    {section === "support" && <Table columns={["Date", "Sender", "Subject / message", "Status", "Action"]} rows={(support.data ?? []).map(item => <tr key={item.id}>
      <td>{new Date(item.createdAt).toLocaleDateString()}</td><td>{item.name}<br />{item.email}</td><td><strong>{item.subject}</strong><br />{item.message}</td><td>{item.status}</td>
      <td><button onClick={() => updateSupport.mutate({ id: item.id, status: item.status === "open" ? "resolved" : "open" })}>{item.status === "open" ? "Resolve" : "Reopen"}</button></td>
    </tr>)} />}

    {section === "newsletter" && <><p className="admin-note">Subscriptions are stored with consent. Email delivery and marketing automation are not connected.</p>
      <Table columns={["Email", "Status", "Consent", "Joined"]} rows={(newsletter.data ?? []).map(item => <tr key={item.id}><td>{item.email}</td><td>{item.status}</td><td>{item.consent ? "Yes" : "No"}</td><td>{new Date(item.createdAt).toLocaleDateString()}</td></tr>)} />
    </>}

    {section === "analytics" && <><div className="stat-grid"><div className="stat-card"><span>Orders</span><strong>{overview.data?.orderCount ?? "—"}</strong></div><div className="stat-card"><span>Paid live revenue</span><strong>{money(overview.data?.paidRevenue ?? 0)}</strong></div><div className="stat-card"><span>Pending orders</span><strong>{overview.data?.pendingCount ?? "—"}</strong></div><div className="stat-card"><span>Low stock</span><strong>{overview.data?.lowStock.length ?? "—"}</strong></div></div>
      <p>Best sellers are ranked only from verified live paid order data; there are no such sales in demo mode.</p></>}

    {section === "settings" && <>
      <div className="form-card"><h2>Shipping rules (demonstration only)</h2>
        {settings.data && <form onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); updateShipping.mutate({ flatRate: Number(data.get("flatRate")), freeShippingThreshold: Number(data.get("freeThreshold")) }); }}>
          <div className="field"><label>Flat rate (INR)</label><input name="flatRate" type="number" min="0" defaultValue={settings.data.shipping.flatRate} /></div>
          <div className="field"><label>Free shipping threshold (INR)</label><input name="freeThreshold" type="number" min="0" defaultValue={settings.data.shipping.freeShippingThreshold} /></div>
          <button className="btn-dark">Save demo rules</button>
        </form>}
      </div>
      <div className="form-card"><h2>Homepage campaign and announcement</h2>
        {settings.data && <form onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); updateHome.mutate({
          announcement: String(data.get("announcement")), campaignEyebrow: String(data.get("eyebrow")), campaignHeadline: String(data.get("headline")), campaignBody: String(data.get("body")),
          featuredProductIds: String(data.get("featuredIds")).split(",").map(value => Number(value.trim())).filter(Number.isInteger),
        }); }}>
          <div className="field"><label>Announcement (no unconfigured promotions)</label><input name="announcement" maxLength={240} defaultValue={settings.data.storefront.announcement} /></div>
          <div className="field"><label>Campaign eyebrow</label><input name="eyebrow" maxLength={120} defaultValue={settings.data.storefront.campaignEyebrow} /></div>
          <div className="field"><label>Campaign headline</label><input name="headline" maxLength={160} defaultValue={settings.data.storefront.campaignHeadline} /></div>
          <div className="field"><label>Campaign body</label><textarea name="body" maxLength={600} defaultValue={settings.data.storefront.campaignBody} /></div>
          <div className="field"><label>Featured product IDs (comma-separated, use catalog IDs below)</label><input name="featuredIds" defaultValue={settings.data.storefront.featuredProductIds.join(",") || featuredIds.join(",")} /></div>
          <button className="btn-dark">Save homepage settings</button>
        </form>}
      </div>
      <div className="form-card"><h2>Catalog IDs for featured products</h2><p>Use an empty list to select the most recently configured featured items automatically.</p>
        <ul>{(products.data ?? []).map(product => <li key={product.id}>ID {product.id} · {product.name}{product.isDemo ? " · demo" : ""}</li>)}</ul>
      </div>
      <div className="form-card setup-status"><h2>External services</h2><ul><li>Payment gateway: not connected; demo checkout only.</li><li>Carrier/PIN serviceability: not connected.</li><li>Transactional email: not connected.</li><li>Taxes, verified supplier data, legal policy copy, public domain and business settings require operator review.</li></ul></div>
    </>}

    {!knownSection && <div className="empty-state"><h2>Choose an administration section.</h2><Link href="/admin" className="btn-outline">Admin overview</Link></div>}
    <div className="admin-session"><ShieldCheck size={15} /> Server-checked administrator <button onClick={() => logout.mutate()}><LogOut size={14} /> Sign out</button></div>
  </div>;
}
