import React, { useEffect, useState } from 'react';
import { ArrowRight, LogOut, ShieldCheck, User } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { Order, Reservation, UserProfile } from '../types';

export function AccountPage() {
  const { user, token, setSession, logout, apiFetch, notify, navigate } = useStore();
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileAddress, setProfileAddress] = useState(user?.address || '');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!token || !user || user.role !== 'customer') return;
    setProfileName(user.name);
    setProfilePhone(user.phone);
    setProfileAddress(user.address || '');
    setLoadingHistory(true);
    Promise.all([
      apiFetch<{ orders: Order[] }>('/api/orders/mine'),
      apiFetch<{ reservations: Reservation[] }>('/api/reservations/mine'),
    ])
      .then(([ordRes, resRes]) => {
        setOrders(ordRes.orders || []);
        setReservations(resRes.reservations || []);
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [apiFetch, token, user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      if (authTab === 'login') {
        const res = await apiFetch<{ token: string; user: UserProfile }>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        setSession(res.token, res.user);
        notify(`Welcome back, ${res.user.name}!`, 'success');
      } else {
        const res = await apiFetch<{ token: string; user: UserProfile }>('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, phone, address, password }),
        });
        setSession(res.token, res.user);
        notify(`Account created. Welcome to CAFEE, ${res.user.name}!`, 'success');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await apiFetch<{ user: UserProfile }>('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: profileName,
          phone: profilePhone,
          address: profileAddress,
        }),
      });
      setSession(token, res.user);
      notify('Profile updated.', 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to update profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-14 lg:py-20 space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#8C5F23]">
            Guest Membership
          </p>
          <h1 className="font-display text-4xl font-semibold text-[#1A120E]">
            {authTab === 'login' ? 'Sign In to CAFEE' : 'Join CAFEE'}
          </h1>
          <p className="text-sm text-[#5C493E]">
            Manage your profile, review past orders, and track upcoming table reservations.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#1A120E]/10 p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#EFE8DD] rounded-lg">
            <button
              type="button"
              onClick={() => {
                setAuthTab('login');
                setErrorMsg('');
              }}
              className={`py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                authTab === 'login' ? 'bg-[#1A120E] text-[#FAF7F2]' : 'text-[#5C493E]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthTab('signup');
                setErrorMsg('');
              }}
              className={`py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                authTab === 'signup' ? 'bg-[#1A120E] text-[#FAF7F2]' : 'text-[#5C493E]'
              }`}
            >
              Create Account
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {authTab === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-[#5C493E] mb-1">Full Name</label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Elena Vance"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#1A120E]/15 bg-[#FAF7F2] text-sm focus:outline-none focus:ring-2 focus:ring-[#C6934B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5C493E] mb-1">Phone Number</label>
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (415) 555-0148"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#1A120E]/15 bg-[#FAF7F2] text-sm focus:outline-none focus:ring-2 focus:ring-[#C6934B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5C493E] mb-1">
                    Default Delivery Address (optional)
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="412 Octavia St, San Francisco"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#1A120E]/15 bg-[#FAF7F2] text-sm focus:outline-none focus:ring-2 focus:ring-[#C6934B]"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-[#5C493E] mb-1">Email Address</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="guest@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#1A120E]/15 bg-[#FAF7F2] text-sm focus:outline-none focus:ring-2 focus:ring-[#C6934B]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5C493E] mb-1">Password</label>
              <input
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#1A120E]/15 bg-[#FAF7F2] text-sm focus:outline-none focus:ring-2 focus:ring-[#C6934B]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-lg bg-[#1A120E] text-[#FAF7F2] text-sm font-medium hover:bg-[#2F2119] disabled:opacity-60 cursor-pointer"
            >
              {submitting
                ? 'Please wait...'
                : authTab === 'login'
                ? 'Sign In'
                : 'Create Account'}
            </button>
          </form>

          <div className="pt-4 border-t border-[#1A120E]/10 flex items-center justify-between text-xs text-[#6E5A4F]">
            <span>Café Manager?</span>
            <button
              type="button"
              onClick={() => navigate('admin')}
              className="inline-flex items-center gap-1.5 font-medium text-[#8C5F23] hover:underline cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Open Admin Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1A120E]/10 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#1A120E] text-[#D4A853] flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-semibold text-[#1A120E]">{user.name}</h1>
            <p className="text-xs text-[#7D6658]">{user.email}</p>
          </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Profile Details */}
        <form
          onSubmit={handleProfileSave}
          className="lg:col-span-4 bg-white rounded-xl border border-[#1A120E]/10 p-6 space-y-4 self-start"
        >
          <h2 className="font-display text-2xl font-semibold">Profile Details</h2>
          <div>
            <label className="block text-xs font-medium text-[#5C493E] mb-1">Name</label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-[#1A120E]/15 bg-[#FAF7F2] text-sm focus:outline-none focus:ring-2 focus:ring-[#C6934B]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#5C493E] mb-1">Phone</label>
            <input
              type="tel"
              value={profilePhone}
              onChange={(e) => setProfilePhone(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-[#1A120E]/15 bg-[#FAF7F2] text-sm focus:outline-none focus:ring-2 focus:ring-[#C6934B]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#5C493E] mb-1">Default Address</label>
            <input
              type="text"
              value={profileAddress}
              onChange={(e) => setProfileAddress(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-[#1A120E]/15 bg-[#FAF7F2] text-sm focus:outline-none focus:ring-2 focus:ring-[#C6934B]"
            />
          </div>
          <button
            type="submit"
            disabled={savingProfile}
            className="w-full py-2.5 rounded-lg bg-[#1A120E] text-[#FAF7F2] text-xs font-medium hover:bg-[#2F2119] disabled:opacity-60 cursor-pointer"
          >
            {savingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </form>

        {/* Order & Reservation History */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-xl border border-[#1A120E]/10 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold">Order History</h2>
              <button
                type="button"
                onClick={() => navigate('menu')}
                className="text-xs font-medium text-[#8C5F23] hover:underline cursor-pointer"
              >
                New Order →
              </button>
            </div>

            {loadingHistory ? (
              <div className="h-24 rounded-lg bg-[#EFE8DD] animate-pulse" />
            ) : orders.length === 0 ? (
              <p className="text-sm text-[#6E5A4F]">
                You haven’t placed any orders under this account yet.
              </p>
            ) : (
              <div className="divide-y divide-[#1A120E]/10">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <span className="font-mono">{order.orderNumber}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#8C5F23]">{order.status}</span>
                      </div>
                      <p className="text-xs text-[#6E5A4F]">
                        {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono tabular-nums text-sm font-semibold">
                        ${order.total.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate('track', { orderNumber: order.orderNumber })}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#1A120E] underline hover:text-[#8C5F23] cursor-pointer"
                      >
                        <span>Track</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-[#1A120E]/10 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold">Table Reservations</h2>
              <button
                type="button"
                onClick={() => navigate('reserve')}
                className="text-xs font-medium text-[#8C5F23] hover:underline cursor-pointer"
              >
                Book Table →
              </button>
            </div>

            {loadingHistory ? (
              <div className="h-20 rounded-lg bg-[#EFE8DD] animate-pulse" />
            ) : reservations.length === 0 ? (
              <p className="text-sm text-[#6E5A4F]">No table reservations yet.</p>
            ) : (
              <div className="divide-y divide-[#1A120E]/10">
                {reservations.map((res) => (
                  <div
                    key={res.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
                  >
                    <div>
                      <span className="font-mono font-medium">{res.bookingCode}</span>
                      <span className="mx-2 text-[#7D6658]">·</span>
                      <span>{res.seatingArea}</span>
                    </div>
                    <div className="text-xs text-[#5C493E] font-mono tabular-nums">
                      {res.date} at {res.time} · {res.guests} guests · {res.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
