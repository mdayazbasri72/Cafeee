import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Product, UserProfile } from '../types';

export type PageRoute =
  | 'home'
  | 'menu'
  | 'about'
  | 'reserve'
  | 'contact'
  | 'account'
  | 'track'
  | 'admin';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ToastNotice {
  id: string;
  message: string;
  tone: 'success' | 'error' | 'info';
}

interface StoreContextValue {
  route: PageRoute;
  navigate: (next: PageRoute, opts?: { orderNumber?: string; category?: string }) => void;
  selectedCategoryFilter: string;
  setSelectedCategoryFilter: (cat: string) => void;
  trackingOrderQuery: string;
  setTrackingOrderQuery: (code: string) => void;
  token: string | null;
  user: UserProfile | null;
  setSession: (token: string | null, user: UserProfile | null) => void;
  logout: () => void;
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (product: Product, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  promoCode: string;
  setPromoCode: (code: string) => void;
  cartCount: number;
  cartSubtotal: number;
  products: Product[];
  productsLoading: boolean;
  refreshProducts: () => Promise<void>;
  mapsApiKey: string;
  toasts: ToastNotice[];
  notify: (message: string, tone?: ToastNotice['tone']) => void;
  dismissToast: (id: string) => void;
  apiFetch: <T>(url: string, init?: RequestInit) => Promise<T>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function parseRouteFromHash(): PageRoute {
  const raw = window.location.hash.replace(/^#\/?/, '').split('?')[0].toLowerCase();
  const allowed: PageRoute[] = [
    'home',
    'menu',
    'about',
    'reserve',
    'contact',
    'account',
    'track',
    'admin',
  ];
  return allowed.includes(raw as PageRoute) ? (raw as PageRoute) : 'home';
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [route, setRoute] = useState<PageRoute>(parseRouteFromHash);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [trackingOrderQuery, setTrackingOrderQuery] = useState<string>('');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [promoCode, setPromoCode] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(true);
  const [mapsApiKey, setMapsApiKey] = useState<string>(
    (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) || ''
  );
  const [toasts, setToasts] = useState<ToastNotice[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, tone: ToastNotice['tone'] = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, message, tone }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3600);
    },
    []
  );

  const apiFetch = useCallback(
    async <T,>(url: string, init: RequestInit = {}): Promise<T> => {
      const headers = new Headers(init.headers);
      if (!headers.has('Content-Type') && init.body) {
        headers.set('Content-Type', 'application/json');
      }
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      const res = await fetch(url, { ...init, headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data?.error === 'string' ? data.error : `Request failed (${res.status})`
        );
      }
      return data as T;
    },
    [token]
  );

  const refreshProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = (await res.json()) as { products: Product[] };
        setProducts(data.products || []);
      }
    } catch {
      notify('Unable to load menu catalog right now.', 'error');
    } finally {
      setProductsLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    refreshProducts();
    if (!mapsApiKey) {
      fetch('/api/public-config')
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.googleMapsApiKey) {
            setMapsApiKey(data.googleMapsApiKey);
          }
        })
        .catch(() => {});
    }
  }, [mapsApiKey, refreshProducts]);

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseRouteFromHash());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback(
    (next: PageRoute, opts?: { orderNumber?: string; category?: string }) => {
      if (opts?.orderNumber) {
        setTrackingOrderQuery(opts.orderNumber);
      }
      if (opts?.category) {
        setSelectedCategoryFilter(opts.category);
      }
      window.location.hash = next === 'home' ? '#/' : `#/${next}`;
      setRoute(next);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  const setSession = useCallback((nextToken: string | null, nextUser: UserProfile | null) => {
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    notify('You have been signed out.', 'info');
  }, [notify]);

  const addToCart = useCallback(
    (product: Product, qty = 1) => {
      setCart((prev) => {
        const existing = prev.find((item) => item.product.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: Math.min(50, item.quantity + qty) }
              : item
          );
        }
        return [...prev, { product, quantity: qty }];
      });
      notify(`Added ${product.name} to your bag.`, 'success');
    },
    [notify]
  );

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const updateCartQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: Math.min(50, qty) } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setPromoCode('');
  }, []);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const cartSubtotal = useMemo(
    () =>
      Math.round(
        cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0) * 100
      ) / 100,
    [cart]
  );

  const value: StoreContextValue = {
    route,
    navigate,
    selectedCategoryFilter,
    setSelectedCategoryFilter,
    trackingOrderQuery,
    setTrackingOrderQuery,
    token,
    user,
    setSession,
    logout,
    cart,
    cartOpen,
    setCartOpen,
    addToCart,
    removeFromCart,
    updateCartQty,
    clearCart,
    promoCode,
    setPromoCode,
    cartCount,
    cartSubtotal,
    products,
    productsLoading,
    refreshProducts,
    mapsApiKey,
    toasts,
    notify,
    dismissToast,
    apiFetch,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used inside StoreProvider');
  }
  return ctx;
}
