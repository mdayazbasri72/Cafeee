import React, { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  Calendar,
  LogOut,
  Pencil,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Upload,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { SafeImage } from '../components/SafeImage';
import { useStore } from '../context/StoreContext';
import type {
  AdminAnalytics,
  ContactMessage,
  MenuCategory,
  Order,
  OrderStatus,
  Product,
  Reservation,
  ReservationStatus,
  UserProfile,
} from '../types';
import { MENU_CATEGORIES } from '../types';

type AdminTab = 'analytics' | 'products' | 'orders' | 'reservations' | 'customers';

interface AdminStatusResponse {
  configured: boolean;
  mode: 'env' | 'claimed' | 'unclaimed';
  adminEmail?: string;
}

interface AdminCustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
}

const ORDER_STATUSES: OrderStatus[] = [
  'Received',
  'Preparing',
  'Out for Delivery',
  'Completed',
  'Cancelled',
];

const RESERVATION_STATUSES: ReservationStatus[] = [
  'Confirmed',
  'Seated',
  'Completed',
  'Cancelled',
];

const PRESET_IMAGES = [
  { label: 'Hot Espresso', url: '/src/assets/images/menu_hot_espresso_1795629292221.jpg' },
  { label: 'Cappuccino & Latte', url: '/src/assets/images/menu_cappuccino_latte_1795629292779.jpg' },
  { label: 'Cold Brew', url: '/src/assets/images/menu_cold_coffee_1795629292764.jpg' },
  { label: 'Chocolate Milkshake', url: '/src/assets/images/menu_milkshake_1795629293968.jpg' },
  { label: 'Saffron Tea', url: '/src/assets/images/menu_artisan_tea_1795629293916.jpg' },
  { label: 'Wagyu Burger', url: '/src/assets/images/menu_gourmet_burger_1795629295410.jpg' },
  { label: 'Wood-Fired Pizza', url: '/src/assets/images/menu_woodfired_pizza_1795629295114.jpg' },
  { label: 'Sourdough Panini', url: '/src/assets/images/menu_artisan_sandwich_1795629296102.jpg' },
  { label: 'Opera Cake & Tiramisu', url: '/src/assets/images/menu_cakes_desserts_1795629306572.jpg' },
];

export function AdminPage() {
  const { user, setSession, logout, apiFetch, notify, refreshProducts } = useStore();
  const isAdmin = user?.role === 'admin';

  const [statusLoading, setStatusLoading] = useState(true);
  const [adminStatus, setAdminStatus] = useState<AdminStatusResponse | null>(null);
  const [loginEmail, setLoginEmail] = useState('admin@cafee.com');
  const [loginPassword, setLoginPassword] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [customers, setCustomers] = useState<AdminCustomerRow[]>([]);
  const [contacts, setContacts] = useState<ContactMessage[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Product Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState<MenuCategory>('Hot Coffee');
  const [prodPrice, setProdPrice] = useState('7.50');
  const [prodDesc, setProdDesc] = useState('');
  const [prodOrigin, setProdOrigin] = useState('');
  const [prodPrep, setProdPrep] = useState('4 min');
  const [prodImage, setProdImage] = useState(PRESET_IMAGES[0].url);
  const [prodFeatured, setProdFeatured] = useState(false);
  const [prodAvailable, setProdAvailable] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);

  useEffect(() => {
    fetch('/api/admin/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: AdminStatusResponse | null) => {
        if (data) {
          setAdminStatus(data);
          if (data.adminEmail) setLoginEmail(data.adminEmail);
        }
      })
      .catch(() => {})
      .finally(() => setStatusLoading(false));
  }, []);

  const loadAdminData = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingData(true);
    try {
      const [anaRes, prodRes, ordRes, resRes, custRes] = await Promise.all([
        apiFetch<{ analytics: AdminAnalytics }>('/api/admin/analytics'),
        apiFetch<{ products: Product[] }>('/api/products?includeUnavailable=true'),
        apiFetch<{ orders: Order[] }>('/api/admin/orders'),
        apiFetch<{ reservations: Reservation[] }>('/api/admin/reservations'),
        apiFetch<{ customers: AdminCustomerRow[]; contacts: ContactMessage[] }>(
          '/api/admin/customers'
        ),
      ]);
      setAnalytics(anaRes.analytics);
      setAdminProducts(prodRes.products || []);
      setOrders(ordRes.orders || []);
      setReservations(resRes.reservations || []);
      setCustomers(custRes.customers || []);
      setContacts(custRes.contacts || []);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to load admin data.', 'error');
    } finally {
      setLoadingData(false);
    }
  }, [apiFetch, isAdmin, notify]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSubmitting(true);
    try {
      const endpoint =
        adminStatus?.mode === 'unclaimed' ? '/api/admin/bootstrap' : '/api/admin/login';
      const res = await apiFetch<{ token: string; admin: { email: string; name: string; role: 'admin' } }>(
        endpoint,
        {
          method: 'POST',
          body: JSON.stringify({ email: loginEmail, password: loginPassword }),
        }
      );
      const profile: UserProfile = {
        id: 'admin-root',
        name: res.admin.name,
        email: res.admin.email,
        phone: '',
        role: 'admin',
        createdAt: new Date().toISOString(),
      };
      setSession(res.token, profile);
      setLoginPassword('');
      notify('Admin session verified.', 'success');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Admin authentication failed.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const resetProductForm = () => {
    setEditingId(null);
    setProdName('');
    setProdCategory('Hot Coffee');
    setProdPrice('7.50');
    setProdDesc('');
    setProdOrigin('');
    setProdPrep('4 min');
    setProdImage(PRESET_IMAGES[0].url);
    setProdFeatured(false);
    setProdAvailable(true);
  };

  const startEditProduct = (p: Product) => {
    setEditingId(p.id);
    setProdName(p.name);
    setProdCategory(p.category);
    setProdPrice(p.price.toFixed(2));
    setProdDesc(p.description);
    setProdOrigin(p.originNote || '');
    setProdPrep(p.prepTime || '4 min');
    setProdImage(p.image);
    setProdFeatured(p.featured);
    setProdAvailable(p.available);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) {
      notify('Please choose an image smaller than 2.5 MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProdImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProduct(true);
    try {
      const payload = {
        name: prodName,
        category: prodCategory,
        price: Number(prodPrice),
        description: prodDesc,
        originNote: prodOrigin,
        prepTime: prodPrep,
        image: prodImage,
        featured: prodFeatured,
        available: prodAvailable,
      };
      if (editingId) {
        await apiFetch(`/api/admin/products/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        notify('Product updated.', 'success');
      } else {
        await apiFetch('/api/admin/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        notify('New menu item added.', 'success');
      }
      resetProductForm();
      await Promise.all([loadAdminData(), refreshProducts()]);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to save product.', 'error');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    try {
      await apiFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      notify(`Removed ${name} from menu.`, 'info');
      await Promise.all([loadAdminData(), refreshProducts()]);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to delete product.', 'error');
    }
  };

  const handleOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const res = await apiFetch<{ order: Order }>(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? res.order : o)));
      notify(`Order ${res.order.orderNumber} updated to ${status}.`, 'success');
      apiFetch<{ analytics: AdminAnalytics }>('/api/admin/analytics')
        .then((d) => setAnalytics(d.analytics))
        .catch(() => {});
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to update order.', 'error');
    }
  };

  const handleReservationStatus = async (resId: string, status: ReservationStatus) => {
    try {
      const res = await apiFetch<{ reservation: Reservation }>(
        `/api/admin/reservations/${resId}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        }
      );
      setReservations((prev) => prev.map((r) => (r.id === resId ? res.reservation : r)));
      notify(`Reservation ${res.reservation.bookingCode} marked ${status}.`, 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to update reservation.', 'error');
    }
  };

  if (!isAdmin) {
    const isUnclaimed = adminStatus?.mode === 'unclaimed';
    const isEnvMode = adminStatus?.mode === 'env';

    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-14 lg:py-20 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#1A120E] text-[#D4A853] mx-auto flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="font-display text-4xl font-semibold text-[#1A120E]">
            {isUnclaimed ? 'Initialize Admin Access' : 'CAFEE Admin Console'}
          </h1>
          <p className="text-sm text-[#5C493E]">
            {isUnclaimed
              ? 'First-run setup: create your administrator email and password to secure the dashboard.'
              : isEnvMode
              ? 'Sign in with your configured server ADMIN_PASSCODE.'
              : 'Sign in with your administrator credentials.'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#1A120E]/10 p-6 sm:p-8 space-y-5">
          {statusLoading ? (
            <div className="h-32 rounded-lg bg-[#EFE8DD] animate-pulse" />
          ) : (
            <form onSubmit={handleAdminAuth} className="space-y-4">
              {authError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                  {authError}
                </div>
              )}

              {!isEnvMode && (
                <div>
                  <label className="block text-xs font-medium text-[#5C493E] mb-1">
                    Administrator Email
                  </label>
                  <input
                    required
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@cafee.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#1A120E]/15 bg-[#FAF7F2] text-sm focus:outline-none focus:ring-2 focus:ring-[#C6934B]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#5C493E] mb-1">
                  {isEnvMode
                    ? 'Admin Passcode'
                    : isUnclaimed
                    ? 'Choose Admin Password (min 8 chars)'
                    : 'Password'}
                </label>
                <input
                  required
                  type="password"
                  minLength={isUnclaimed ? 8 : 1}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#1A120E]/15 bg-[#FAF7F2] text-sm focus:outline-none focus:ring-2 focus:ring-[#C6934B]"
                />
              </div>

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full py-3 rounded-lg bg-[#1A120E] text-[#FAF7F2] text-sm font-medium hover:bg-[#2F2119] disabled:opacity-60 cursor-pointer"
              >
                {authSubmitting
                  ? 'Verifying...'
                  : isUnclaimed
                  ? 'Claim Admin Access'
                  : 'Enter Admin Dashboard'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  const maxDailyRev = Math.max(
    1,
    ...(analytics?.dailyRevenue.map((d) => d.revenue) || [1])
  );
  const maxCatRev = Math.max(
    1,
    ...(analytics?.categoryRevenue.map((c) => c.revenue) || [1])
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1A120E]/10 pb-6">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#8C5F23]">
            Management Portal
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#1A120E]">
            CAFEE Operations Console
          </h1>
        </div>

        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1A120E]/20 text-xs font-medium hover:bg-[#1A120E] hover:text-[#FAF7F2] transition-colors cursor-pointer self-start sm:self-auto"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'analytics', label: 'Analytics & Revenue', icon: BarChart3 },
            { id: 'products', label: 'Menu & Images', icon: UtensilsCrossed },
            { id: 'orders', label: 'Orders', icon: ShoppingBag },
            { id: 'reservations', label: 'Reservations', icon: Calendar },
            { id: 'customers', label: 'Customers', icon: Users },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-[#1A120E] text-[#FAF7F2]'
                  : 'bg-[#EFE8DD] text-[#5C493E] hover:bg-[#E4DACB]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loadingData && !analytics ? (
        <div className="h-64 rounded-xl bg-[#EFE8DD] animate-pulse" />
      ) : null}

      {/* TAB 1: ANALYTICS & REVENUE CHARTS */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {[
              { label: 'Total Revenue', val: `$${analytics.totalRevenue.toFixed(2)}` },
              { label: 'Total Orders', val: String(analytics.totalOrders) },
              { label: 'Active Queue', val: String(analytics.activeOrders) },
              { label: 'Avg Order Value', val: `$${analytics.averageOrderValue.toFixed(2)}` },
              { label: 'Reservations', val: String(analytics.totalReservations) },
              { label: 'Registered Guests', val: String(analytics.totalCustomers) },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="bg-white rounded-xl border border-[#1A120E]/10 p-4 space-y-1"
              >
                <span className="text-xs text-[#7D6658] block">{kpi.label}</span>
                <span className="font-mono tabular-nums text-xl font-semibold text-[#1A120E]">
                  {kpi.val}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 7-Day Revenue SVG Chart */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-[#1A120E]/10 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl font-semibold">7-Day Revenue Trend</h2>
                  <p className="text-xs text-[#7D6658]">Completed &amp; active order volume</p>
                </div>
                <span className="font-mono tabular-nums text-xs text-[#8C5F23]">USD ($)</span>
              </div>

              <div className="w-full overflow-x-auto">
                <svg
                  viewBox="0 0 560 220"
                  className="w-full h-56"
                  role="img"
                  aria-label="7-day revenue bar chart"
                >
                  {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
                    const y = 180 - pct * 145;
                    return (
                      <line
                        key={pct}
                        x1="40"
                        y1={y}
                        x2="540"
                        y2={y}
                        stroke="rgba(26,18,14,0.08)"
                        strokeDasharray="3 3"
                      />
                    );
                  })}

                  {analytics.dailyRevenue.map((day, idx) => {
                    const barHeight = Math.max(4, (day.revenue / maxDailyRev) * 145);
                    const x = 58 + idx * 70;
                    const y = 180 - barHeight;
                    return (
                      <g key={`${day.label}-${idx}`}>
                        <rect
                          x={x}
                          y={y}
                          width="38"
                          height={barHeight}
                          rx="6"
                          fill={day.revenue > 0 ? '#C6934B' : '#E8DFD3'}
                        />
                        <text
                          x={x + 19}
                          y={y - 6}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#5C493E"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {day.revenue > 0 ? `$${day.revenue.toFixed(0)}` : '$0'}
                        </text>
                        <text
                          x={x + 19}
                          y="200"
                          textAnchor="middle"
                          fontSize="11"
                          fill="#7D6658"
                        >
                          {day.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Category Revenue Breakdown */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-[#1A120E]/10 p-6 space-y-5">
              <div>
                <h2 className="font-display text-2xl font-semibold">Top Categories</h2>
                <p className="text-xs text-[#7D6658]">Revenue share by menu group</p>
              </div>

              {analytics.categoryRevenue.length === 0 ? (
                <p className="text-sm text-[#6E5A4F]">No sales data recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {analytics.categoryRevenue.map((cat) => {
                    const pct = Math.max(6, Math.round((cat.revenue / maxCatRev) * 100));
                    return (
                      <div key={cat.category} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-[#1A120E]">
                            {cat.category} ({cat.count} sold)
                          </span>
                          <span className="font-mono tabular-nums text-[#8C5F23]">
                            ${cat.revenue.toFixed(2)}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-[#EFE8DD] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#1A120E]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS & IMAGE UPLOAD */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={handleProductSubmit}
            className="lg:col-span-5 bg-white rounded-xl border border-[#1A120E]/10 p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold">
                {editingId ? 'Edit Menu Item' : 'Add New Product'}
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={resetProductForm}
                  className="text-xs text-[#8C5F23] underline cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5C493E] mb-1">Product Name</label>
              <input
                required
                type="text"
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                placeholder="Hazelnut Velvet Cortado"
                className="w-full px-3.5 py-2 rounded-lg border border-[#1A120E]/15 bg-[#FAF7F2] text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#5C493E] mb-1">Category</label>
                <select
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value as MenuCategory)}
                  className="w-full px-3 py-2 rounded-lg border border-[#1A120E]/15 bg-[#FAF7F2] text-sm"
                >
                  {MENU_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5C493E] mb-1">Price ($)</label>
                <input
                  required
                  type="number"
                  step="0.25"
                  min="0.50"
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#1A120E]/15 bg-[#FAF7F2] font-mono text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#5C493E] mb-1">Origin / Tag</label>
                <input
                  type="text"
                  value={prodOrigin}
                  onChange={(e) => setProdOrigin(e.target.value)}
                  placeholder="Single Origin"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#1A120E]/15 bg-[#FAF7F2] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5C493E] mb-1">Prep Time</label>
                <input
                  type="text"
                  value={prodPrep}
                  onChange={(e) => setProdPrep(e.target.value)}
                  placeholder="4 min"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#1A120E]/15 bg-[#FAF7F2] text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5C493E] mb-1">Description</label>
              <textarea
                required
                rows={3}
                value={prodDesc}
                onChange={(e) => setProdDesc(e.target.value)}
                placeholder="Rich double espresso layered with roasted Piedmont hazelnut..."
                className="w-full px-3.5 py-2 rounded-lg border border-[#1A120E]/15 bg-[#FAF7F2] text-sm"
              />
            </div>

            {/* Product Image Upload + Studio Presets */}
            <div className="space-y-2.5">
              <label className="block text-xs font-medium text-[#5C493E]">Product Image</label>
              <div className="flex items-center gap-3">
                <div className="w-20 h-16 rounded-lg overflow-hidden bg-[#EFE8DD] shrink-0 border border-[#1A120E]/10">
                  <SafeImage src={prodImage} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <label className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-[#1A120E]/30 bg-[#FAF7F2] text-xs font-medium hover:border-[#C6934B] cursor-pointer">
                  <Upload className="w-4 h-4 text-[#8C5F23]" />
                  <span>Upload Image File</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <select
                aria-label="Choose studio preset image"
                value={PRESET_IMAGES.some((p) => p.url === prodImage) ? prodImage : ''}
                onChange={(e) => {
                  if (e.target.value) setProdImage(e.target.value);
                }}
                className="w-full px-3 py-2 rounded-lg border border-[#1A120E]/15 bg-[#FAF7F2] text-xs"
              >
                <option value="">Or choose a CAFEE studio photo...</option>
                {PRESET_IMAGES.map((p) => (
                  <option key={p.url} value={p.url}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-6 pt-1 text-xs">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prodFeatured}
                  onChange={(e) => setProdFeatured(e.target.checked)}
                />
                <span>Feature on Home</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prodAvailable}
                  onChange={(e) => setProdAvailable(e.target.checked)}
                />
                <span>Available in Menu</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={savingProduct}
              className="w-full py-3 rounded-lg bg-[#C6934B] text-[#120D0A] text-sm font-semibold hover:bg-[#D4A853] disabled:opacity-60 inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{savingProduct ? 'Saving...' : editingId ? 'Update Product' : 'Add to Menu'}</span>
            </button>
          </form>

          {/* Products List */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-[#1A120E]/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1A120E]/10 flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold">
                Menu Catalog ({adminProducts.length})
              </h2>
            </div>
            <div className="divide-y divide-[#1A120E]/8 max-h-[680px] overflow-y-auto">
              {adminProducts.map((p) => (
                <div key={p.id} className="p-4 flex items-center gap-4 hover:bg-[#FAF7F2]">
                  <div className="w-16 h-12 rounded-lg overflow-hidden bg-[#EFE8DD] shrink-0">
                    <SafeImage src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-[#1A120E] truncate">{p.name}</span>
                      {!p.available && (
                        <span className="text-xs text-red-700 font-medium">(Hidden)</span>
                      )}
                    </div>
                    <div className="text-xs text-[#7D6658]">
                      {p.category} · <span className="font-mono tabular-nums">${p.price.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEditProduct(p)}
                      aria-label={`Edit ${p.name}`}
                      className="p-2 rounded-lg border border-[#1A120E]/15 hover:bg-[#1A120E] hover:text-[#FAF7F2] cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(p.id, p.name)}
                      aria-label={`Delete ${p.name}`}
                      className="p-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-600 hover:text-white cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl border border-[#1A120E]/10 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1A120E]/10 text-xs text-[#7D6658] uppercase">
                <th className="py-3.5 px-4 font-medium">Order #</th>
                <th className="py-3.5 px-4 font-medium">Customer</th>
                <th className="py-3.5 px-4 font-medium">Items</th>
                <th className="py-3.5 px-4 font-medium">Type</th>
                <th className="py-3.5 px-4 font-medium text-right">Total</th>
                <th className="py-3.5 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A120E]/8 text-sm">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-[#FAF7F2]">
                  <td className="py-3.5 px-4 font-mono font-medium">{order.orderNumber}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium">{order.customerName}</div>
                    <div className="text-xs text-[#7D6658]">{order.customerPhone}</div>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-[#5C493E] max-w-xs">
                    {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                  </td>
                  <td className="py-3.5 px-4 text-xs capitalize">{order.fulfillmentType}</td>
                  <td className="py-3.5 px-4 font-mono tabular-nums text-right font-medium">
                    ${order.total.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4">
                    <select
                      aria-label={`Update status for ${order.orderNumber}`}
                      value={order.status}
                      onChange={(e) => handleOrderStatus(order.id, e.target.value as OrderStatus)}
                      className="px-2.5 py-1.5 rounded-lg border border-[#1A120E]/15 bg-[#FAF7F2] text-xs font-medium"
                    >
                      {ORDER_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: RESERVATIONS MANAGEMENT */}
      {activeTab === 'reservations' && (
        <div className="bg-white rounded-xl border border-[#1A120E]/10 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1A120E]/10 text-xs text-[#7D6658] uppercase">
                <th className="py-3.5 px-4 font-medium">Code</th>
                <th className="py-3.5 px-4 font-medium">Guest</th>
                <th className="py-3.5 px-4 font-medium">Date &amp; Time</th>
                <th className="py-3.5 px-4 font-medium text-right">Party</th>
                <th className="py-3.5 px-4 font-medium">Seating</th>
                <th className="py-3.5 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A120E]/8 text-sm">
              {reservations.map((res) => (
                <tr key={res.id} className="hover:bg-[#FAF7F2]">
                  <td className="py-3.5 px-4 font-mono font-medium">{res.bookingCode}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium">{res.customerName}</div>
                    <div className="text-xs text-[#7D6658]">{res.customerPhone}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono tabular-nums text-xs">
                    {res.date} · {res.time}
                  </td>
                  <td className="py-3.5 px-4 font-mono tabular-nums text-right">{res.guests}</td>
                  <td className="py-3.5 px-4 text-xs">{res.seatingArea}</td>
                  <td className="py-3.5 px-4">
                    <select
                      aria-label={`Update status for ${res.bookingCode}`}
                      value={res.status}
                      onChange={(e) =>
                        handleReservationStatus(res.id, e.target.value as ReservationStatus)
                      }
                      className="px-2.5 py-1.5 rounded-lg border border-[#1A120E]/15 bg-[#FAF7F2] text-xs font-medium"
                    >
                      {RESERVATION_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: CUSTOMERS & FEEDBACK */}
      {activeTab === 'customers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-white rounded-xl border border-[#1A120E]/10 overflow-x-auto">
            <div className="px-6 py-4 border-b border-[#1A120E]/10">
              <h2 className="font-display text-2xl font-semibold">
                Registered Customers ({customers.length})
              </h2>
            </div>
            {customers.length === 0 ? (
              <p className="p-6 text-sm text-[#6E5A4F]">
                No customers have registered an account yet.
              </p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1A120E]/10 text-xs text-[#7D6658] uppercase">
                    <th className="py-3 px-4 font-medium">Customer</th>
                    <th className="py-3 px-4 font-medium">Phone</th>
                    <th className="py-3 px-4 font-medium text-right">Orders</th>
                    <th className="py-3 px-4 font-medium text-right">Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A120E]/8 text-sm">
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td className="py-3 px-4">
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-[#7D6658]">{c.email}</div>
                      </td>
                      <td className="py-3 px-4 text-xs">{c.phone}</td>
                      <td className="py-3 px-4 font-mono tabular-nums text-right">
                        {c.orderCount}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-right font-medium">
                        ${c.totalSpent.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="lg:col-span-5 bg-white rounded-xl border border-[#1A120E]/10 p-6 space-y-4">
            <h2 className="font-display text-2xl font-semibold">
              Contact Inquiries ({contacts.length})
            </h2>
            {contacts.length === 0 ? (
              <p className="text-sm text-[#6E5A4F]">No contact form inquiries received yet.</p>
            ) : (
              <div className="space-y-3">
                {contacts.map((cnt) => (
                  <div key={cnt.id} className="p-4 rounded-lg bg-[#FAF7F2] border border-[#1A120E]/8 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-[#1A120E]">{cnt.name}</span>
                      <span className="text-[#7D6658]">{cnt.email}</span>
                    </div>
                    <p className="text-xs font-medium text-[#8C5F23]">{cnt.subject}</p>
                    <p className="text-xs text-[#4B3B32]">{cnt.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
