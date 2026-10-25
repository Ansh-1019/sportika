import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { StoreProvider } from "./lib/store";
const Home = lazy(() => import("./pages/Home"));
const CollectionPage = lazy(() => import("./pages/Collection"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetail"));
const CartPage = lazy(() => import("./pages/Cart"));
const CheckoutPage = lazy(() => import("./pages/Checkout"));
const InfoPage = lazy(() => import("./pages/Info"));
const AdminPage = lazy(() => import("./pages/Admin"));
import { StoreShell } from "./components/StoreShell";

function Router() {
  return (
    <StoreProvider>
      <StoreShell>
        <Suspense fallback={<div className="page-wrap content-page" role="status" aria-live="polite">Loading SPORTIKA…</div>}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/collections" component={CollectionPage} />
          <Route path="/collections/:slug" component={CollectionPage} />
          <Route path="/products/:slug" component={ProductDetailPage} />
          <Route path="/search" component={CollectionPage} />
          <Route path="/cart" component={CartPage} />
          <Route path="/checkout" component={CheckoutPage} />
          <Route path="/order-confirmation/:orderId" component={InfoPage} />
          <Route path="/account" component={InfoPage} />
          <Route path="/account/:section" component={InfoPage} />
          <Route path="/admin" component={AdminPage} />
          <Route path="/admin/:section" component={AdminPage} />
          <Route path="/about" component={InfoPage} />
          <Route path="/contact" component={InfoPage} />
          <Route path="/faq" component={InfoPage} />
          <Route path="/shipping-policy" component={InfoPage} />
          <Route path="/return-policy" component={InfoPage} />
          <Route path="/privacy-policy" component={InfoPage} />
          <Route path="/terms" component={InfoPage} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
        </Suspense>
      </StoreShell>
    </StoreProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-center" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
