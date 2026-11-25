import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, ChefHat, PackageCheck, Search, Truck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { OrderItem, OrderStatus } from '../types';

interface TrackedOrder {
  orderNumber: string;
  status: OrderStatus;
  fulfillmentType: 'delivery' | 'pickup';
  customerFirstName: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

const STEPS: Array<{ status: OrderStatus; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }> = [
  { status: 'Received', label: 'Order Received', desc: 'Confirmed by CAFEE counter', icon: CheckCircle2 },
  { status: 'Preparing', label: 'Preparing & Brewing', desc: 'Barista & kitchen crafting your order', icon: ChefHat },
  { status: 'Out for Delivery', label: 'Ready / En Route', desc: 'Out with courier or ready for pickup', icon: Truck },
  { status: 'Completed', label: 'Completed', desc: 'Enjoy your CAFEE moment', icon: PackageCheck },
];

export function OrderTrackingPage() {
  const { trackingOrderQuery, setTrackingOrderQuery } = useStore();
  const [inputCode, setInputCode] = useState(trackingOrderQuery || 'CF-1042');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [tracked, setTracked] = useState<TrackedOrder | null>(null);

  const lookupOrder = useCallback(async (code: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/orders/track/${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Order not found.');
      }
      setTracked(data.tracking);
      setTrackingOrderQuery(clean);
    } catch (err) {
      setTracked(null);
      setErrorMsg(err instanceof Error ? err.message : 'Unable to find order.');
    } finally {
      setLoading(false);
    }
  }, [setTrackingOrderQuery]);

  useEffect(() => {
    lookupOrder(trackingOrderQuery || 'CF-1042');
  }, [lookupOrder, trackingOrderQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    lookupOrder(inputCode);
  };

  const activeIdx = tracked
    ? STEPS.findIndex((s) => s.status === tracked.status)
    : -1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-10">
      <div className="space-y-2 border-b border-[#1A120E]/10 pb-6">
        <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#8C5F23]">
          Live Status
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#1A120E]">
          Track Your CAFEE Order
        </h1>
        <p className="text-sm text-[#5C493E]">
          Enter your order reference (e.g., <span className="font-mono">CF-1042</span> or <span className="font-mono">CF-1043</span>) to follow live preparation and delivery progress.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#7D6658] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="Enter Order Code (e.g. CF-1042)"
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#1A120E]/15 bg-white font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[#C6934B]"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-lg bg-[#1A120E] text-[#FAF7F2] text-sm font-medium hover:bg-[#2F2119] disabled:opacity-60 cursor-pointer whitespace-nowrap shrink-0"
        >
          {loading ? 'Checking...' : 'Track Order'}
        </button>
      </form>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
          {errorMsg}
        </div>
      )}

      {tracked && (
        <div className="bg-white rounded-2xl border border-[#1A120E]/10 p-6 sm:p-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1A120E]/10">
            <div>
              <span className="text-xs text-[#7D6658]">
                {tracked.fulfillmentType === 'delivery' ? 'Courier Delivery' : 'Café Counter Pickup'} · Guest {tracked.customerFirstName}
              </span>
              <h2 className="font-mono text-2xl font-semibold text-[#1A120E] mt-1">
                {tracked.orderNumber}
              </h2>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs text-[#7D6658] block">Current Status</span>
              <span className="text-sm font-semibold text-[#8C5F23]">
                {tracked.status}
              </span>
            </div>
          </div>

          {tracked.status === 'Cancelled' ? (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
              This order was cancelled. Please contact our Hayes Street counter if you need assistance.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const completed = activeIdx >= idx;
                return (
                  <div
                    key={step.status}
                    className={`p-4 rounded-xl border transition-colors ${
                      completed
                        ? 'bg-[#1A120E] text-[#FAF7F2] border-[#1A120E]'
                        : 'bg-[#FAF7F2] text-[#7D6658] border-[#1A120E]/10'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2.5 ${completed ? 'text-[#D4A853]' : 'text-[#9E8E7F]'}`} />
                    <div className="text-sm font-medium">{step.label}</div>
                    <div className={`text-xs mt-1 ${completed ? 'text-[#C4B7AA]' : 'text-[#8D7768]'}`}>
                      {step.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-3 pt-4 border-t border-[#1A120E]/10">
            <h3 className="font-display text-xl font-semibold">Order Summary</h3>
            <div className="space-y-2">
              {tracked.items.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm text-[#4B3B32]">
                  <span>
                    {item.quantity} × {item.name}
                  </span>
                  <span className="font-mono tabular-nums">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-[#1A120E]/10 flex justify-between font-semibold text-base">
              <span>Total</span>
              <span className="font-mono tabular-nums text-[#8C5F23]">
                ${tracked.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
