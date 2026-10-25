import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { StoreProduct, StoreVariant, CartLine } from "@shared/store-types";
import { trpc } from "@/lib/trpc";

type StoreContextValue = {
  lines: CartLine[]; cartCount: number; addToCart: (product: StoreProduct, variant: StoreVariant, quantity?: number) => void;
  setQuantity: (variantId: number, quantity: number, stock: number) => void; removeLine: (variantId: number) => void;
  clearCart: () => void; isWishlisted: (productId: number, slug: string) => boolean; wishlistSlugs: string[];
  toggleWishlist: (productId: number, slug: string) => void; user: { id: number; name: string | null; email: string | null; role: string } | null;
  login: () => void;
};
const StoreContext = createContext<StoreContextValue | null>(null);

function loadLines(): CartLine[] {
  try {
    const parsed = JSON.parse(localStorage.getItem("sportika-cart") ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(item => Number.isInteger(item.variantId) && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 25);
  } catch { return []; }
}
function loadWishlist(): string[] {
  try { const value = JSON.parse(localStorage.getItem("sportika-wishlist") ?? "[]"); return Array.isArray(value) ? value.filter(item => typeof item === "string") : []; }
  catch { return []; }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(loadLines);
  const [guestWishlist, setGuestWishlist] = useState<string[]>(loadWishlist);
  const hasSynced = useRef(false);
  const me = trpc.auth.me.useQuery(undefined, { retry: false, staleTime: 30_000 });
  const user = me.data ? { id: me.data.id, name: me.data.name, email: me.data.email, role: me.data.role } : null;
  const serverCart = trpc.cart.get.useQuery(undefined, { enabled: !!user, retry: false });
  const savedCart = trpc.cart.save.useMutation();
  const wishlistQuery = trpc.wishlist.list.useQuery(undefined, { enabled: !!user, retry: false });
  const wishlistMutation = trpc.wishlist.toggle.useMutation({ onSuccess: () => wishlistQuery.refetch() });

  useEffect(() => {
    if (!user || serverCart.data === undefined) { if (!user) hasSynced.current = false; return; }
    const merged = new Map<number, number>();
    for (const line of serverCart.data) merged.set(line.variantId, line.quantity);
    for (const line of lines) merged.set(line.variantId, Math.min(25, (merged.get(line.variantId) ?? 0) + line.quantity));
    hasSynced.current = true;
    setLines([...merged].map(([variantId, quantity]) => ({ variantId, quantity })));
  // Initial login/cart hydration only; mutations are saved in the effect below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, serverCart.data]);

  useEffect(() => {
    localStorage.setItem("sportika-cart", JSON.stringify(lines));
    if (user && hasSynced.current) savedCart.mutate({ lines });
  }, [lines, user?.id]);
  useEffect(() => { localStorage.setItem("sportika-wishlist", JSON.stringify(guestWishlist)); }, [guestWishlist]);

  const addToCart = (product: StoreProduct, variant: StoreVariant, quantity = 1) => {
    if (variant.stock < 1) { toast.error("That option is currently unavailable"); return; }
    setLines(current => {
      const existing = current.find(line => line.variantId === variant.id);
      const nextQuantity = Math.min(variant.stock, (existing?.quantity ?? 0) + quantity);
      if (existing && nextQuantity === existing.quantity) { toast.error(`Only ${variant.stock} available`); return current; }
      toast.success(`${product.name} added to your bag`);
      return existing ? current.map(line => line.variantId === variant.id ? { ...line, quantity: nextQuantity } : line) : [...current, { variantId: variant.id, quantity: Math.min(quantity, variant.stock) }];
    });
  };
  const setQuantity = (variantId: number, quantity: number, stock: number) => {
    if (quantity <= 0) { setLines(current => current.filter(line => line.variantId !== variantId)); return; }
    if (quantity > stock) { toast.error(`Only ${stock} available`); quantity = stock; }
    setLines(current => current.map(line => line.variantId === variantId ? { ...line, quantity: Math.min(25, quantity) } : line));
  };
  const removeLine = (variantId: number) => setLines(current => current.filter(line => line.variantId !== variantId));
  const clearCart = () => setLines([]);
  const isWishlisted = (productId: number, slug: string) => user
    ? (wishlistQuery.data ?? []).some(item => item.productId === productId)
    : guestWishlist.includes(slug);
  const toggleWishlist = (productId: number, slug: string) => {
    if (user) { wishlistMutation.mutate({ productId }); return; }
    setGuestWishlist(current => current.includes(slug) ? current.filter(item => item !== slug) : [...current, slug]);
    toast.success(guestWishlist.includes(slug) ? "Removed from wishlist" : "Saved to wishlist");
  };
  const value = useMemo<StoreContextValue>(() => ({ lines, cartCount: lines.reduce((sum, item) => sum + item.quantity, 0), addToCart, setQuantity,
    removeLine, clearCart, isWishlisted, toggleWishlist, wishlistSlugs: guestWishlist, user, login: () => window.location.assign("/api/oauth/login") }), [lines, guestWishlist, user, wishlistQuery.data]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used inside StoreProvider");
  return context;
}
