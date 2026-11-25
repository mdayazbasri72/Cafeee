import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { Order } from '../types';
import { SafeImage } from './SafeImage';

export function CartDrawer() {
  const {
    cart,
    cartOpen,
    setCartOpen,
    removeFromCart,
    updateCartQty,
    clearCart,
    cartSubtotal,
    promoCode,
    setPromoCode,
    user,
    apiFetch,
    notify,
    navigate,
  } = useStore();

  const [step, setStep] = useState<'cart' | 'checkout' | 'confirmed'>('cart');
  const [promoInput, setPromoInput] = useState(promoCode);
  const [fulfillmentType, setFulfillmentType] = useState<'delivery' | 'pickup'>('delivery');
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [paymentMethod, setPaymentMethod] = useState<'Card' | 'Cash on Delivery'>('Card');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const normalizedPromo = promoCode.trim().toUpperCase();
  const discount = useMemo(() => {
    if (normalizedPromo === 'CAFEE15') {
      return Math.round(cartSubtotal * 0.15 * 100) / 100;
    }
    if (normalizedPromo === 'GOLD20' && cartSubtotal >= 30) {
      return Math.round(cartSubtotal * 0.2 * 100) / 100;
    }
    return 0;
  }, [cartSubtotal, normalizedPromo]);

  const tax = useMemo(
    () => Math.round(Math.max(0, cartSubtotal - discount) * 0.08 * 100) / 100,
    [cartSubtotal, discount]
  );

  const total = useMemo(
    () => Math.round((Math.max(0, cartSubtotal - discount) + tax) * 100) / 100,
    [cartSubtotal, discount, tax]
  );

  if (!cartOpen) return null;

  const closeDrawer = () => {
    setCartOpen(false);
    setErrorMsg('');
    if (step === 'confirmed') {
      setStep('cart');
      setConfirmedOrder(null);
    }
  };

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      setPromoCode('');
      return;
    }
    if (code === 'CAFEE15' || (code === 'GOLD20' && cartSubtotal >= 30)) {
      setPromoCode(code);
      notify(`Offer ${code} applied.`, 'success');
    } else if (code === 'GOLD20') {
      notify('GOLD20 requires a $30.00 minimum subtotal.', 'error');
    } else {
      notify('Promo code not recognized. Try CAFEE15 or GOLD20.', 'error');
    }
  };

  const openCheckout = () => {
    if (user) {
      if (!customerName) setCustomerName(user.name);
      if (!customerPhone) setCustomerPhone(user.phone);
      if (!customerEmail) setCustomerEmail(user.email);
      if (!deliveryAddress && user.address) setDeliveryAddress(user.address);
    }
    setErrorMsg('');
    setStep('checkout');
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      const res = await apiFetch<{ order: Order }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail,
          fulfillmentType,
          deliveryAddress: fulfillmentType === 'delivery' ? deliveryAddress : undefined,
          paymentMethod,
          promoCode: normalizedPromo || undefined,
          notes,
          items: cart.map((c) => ({
            productId: c.product.id,
            quantity: c.quantity,
          })),
        }),
      });
      setConfirmedOrder(res.order);
      clearCart();
      setStep('confirmed');
      notify(`Order ${res.order.orderNumber} confirmed!`, 'success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-[#120D0A]/60 backdrop-blur-xs"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      <aside
        aria-label="Order Bag and Checkout"
        className="relative z-10 w-full max-w-md bg-[#FAF7F2] text-[#1A120E] h-full flex flex-col shadow-2xl border-l border-[#1A120E]/10"
      >
        <div className="px-6 py-5 border-b border-[#1A120E]/10 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold">
              {step === 'cart' && 'Your Order Bag'}
              {step === 'checkout' && 'Checkout'}
              {step === 'confirmed' && 'Order Confirmed'}
            </h2>
            <p className="text-xs text-[#7D6658]">
              {step === 'cart' && 'Freshly prepared upon confirmation'}
              {step === 'checkout' && 'Review details and payment'}
              {step === 'confirmed' && 'Your barista has received your order'}
            </p>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Close order bag"
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg hover:bg-[#1A120E]/8 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 'cart' && (
            <>
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-[#1A120E]/6 flex items-center justify-center text-[#8C5F23]">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-display text-xl font-semibold">Your bag is empty</p>
                    <p className="text-sm text-[#6E5A4F] max-w-xs">
                      Explore single-origin brews, wood-fired sourdough, and patisserie creations.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        closeDrawer();
                        navigate('menu');
                      }}
                      className="px-5 py-2.5 rounded-lg bg-[#1A120E] text-[#FAF7F2] text-xs font-medium hover:bg-[#2F2119] cursor-pointer"
                    >
                      Explore Menu
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        closeDrawer();
                        navigate('track');
                      }}
                      className="px-5 py-2.5 rounded-lg border border-[#1A120E]/20 text-xs font-medium hover:bg-[#1A120E]/5 cursor-pointer"
                    >
                      Track Existing Order
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex gap-3.5 pb-4 border-b border-[#1A120E]/8"
                    >
                      <div className="w-20 h-16 rounded-lg overflow-hidden shrink-0 bg-[#EFE8DD]">
                        <SafeImage
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium text-sm text-[#1A120E] truncate">
                            {item.product.name}
                          </h3>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id)}
                            aria-label={`Remove ${item.product.name}`}
                            className="text-[#8D7768] hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-[#7D6658] mt-0.5">
                          ${item.product.price.toFixed(2)} each
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="inline-flex items-center rounded-md border border-[#1A120E]/15 bg-white">
                            <button
                              type="button"
                              onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                              aria-label="Decrease quantity"
                              className="w-7 h-7 inline-flex items-center justify-center hover:bg-[#1A120E]/5 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-mono tabular-nums text-xs px-2.5">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                              aria-label="Increase quantity"
                              className="w-7 h-7 inline-flex items-center justify-center hover:bg-[#1A120E]/5 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="font-mono tabular-nums text-sm font-medium text-[#1A120E]">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="pt-2 space-y-2">
                    <label htmlFor="promo-code" className="block text-xs font-medium text-[#5C493E]">
                      Privilege / Promo Code (try CAFEE15)
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="promo-code"
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        placeholder="CAFEE15"
                        className="flex-1 px-3 py-2 rounded-lg border border-[#1A120E]/15 bg-white text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[#C6934B]"
                      />
                      <button
                        type="button"
                        onClick={applyPromo}
                        className="px-4 py-2 rounded-lg border border-[#1A120E]/20 text-xs font-medium hover:bg-[#1A120E] hover:text-[#FAF7F2] transition-colors cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {step === 'checkout' && (
            <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 p-1 bg-[#EFE8DD] rounded-lg">
                {(['delivery', 'pickup'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFulfillmentType(mode)}
                    className={`py-2 text-xs font-medium rounded-md transition-colors capitalize cursor-pointer ${
                      fulfillmentType === mode
                        ? 'bg-[#1A120E] text-[#FAF7F2]'
                        : 'text-[#5C493E] hover:text-[#1A120E]'
                    }`}
                  >
                    {mode === 'delivery' ? 'Courier Delivery' : 'Café Pickup'}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5C493E] mb-1">Full Name</label>
                <input
                  required
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Elena Vance"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#1A120E]/15 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C6934B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#5C493E] mb-1">Phone Number</label>
                  <input
                    required
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+1 (415) 555-0148"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#1A120E]/15 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C6934B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5C493E] mb-1">Email (optional)</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="guest@example.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#1A120E]/15 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C6934B]"
                  />
                </div>
              </div>

              {fulfillmentType === 'delivery' && (
                <div>
                  <label className="block text-xs font-medium text-[#5C493E] mb-1">
                    Delivery Address
                  </label>
                  <input
                    required
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="412 Octavia St, Apt 2, San Francisco"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#1A120E]/15 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C6934B]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#5C493E] mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Card', 'Cash on Delivery'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`px-3 py-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer ${
                        paymentMethod === method
                          ? 'border-[#C6934B] bg-[#C6934B]/12 text-[#1A120E]'
                          : 'border-[#1A120E]/15 bg-white text-[#5C493E]'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{method}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5C493E] mb-1">
                  Barista / Kitchen Notes (optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Oat milk preference, extra hot, leave with concierge..."
                  className="w-full px-3.5 py-2 rounded-lg border border-[#1A120E]/15 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C6934B]"
                />
              </div>

              <button
                type="button"
                onClick={() => setStep('cart')}
                className="text-xs text-[#7D6658] hover:text-[#1A120E] underline cursor-pointer"
              >
                ← Back to Bag
              </button>
            </form>
          )}

          {step === 'confirmed' && confirmedOrder && (
            <div className="space-y-5 py-4">
              <div className="p-5 rounded-xl bg-[#1A120E] text-[#FAF7F2] space-y-2">
                <div className="flex items-center gap-2 text-[#D4A853] text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmed · {confirmedOrder.status}</span>
                </div>
                <div className="font-mono text-2xl font-semibold tracking-wide">
                  {confirmedOrder.orderNumber}
                </div>
                <p className="text-xs text-[#C4B7AA]">
                  {confirmedOrder.fulfillmentType === 'delivery'
                    ? `Delivering to ${confirmedOrder.deliveryAddress}`
                    : 'Ready for pickup at 485 Hayes Street counter'}
                </p>
              </div>

              <div className="space-y-2.5 text-sm">
                <h3 className="font-display text-lg font-semibold">Order Receipt</h3>
                {confirmedOrder.items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-xs text-[#5C493E]">
                    <span>
                      {item.quantity} × {item.name}
                    </span>
                    <span className="font-mono tabular-nums">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-[#1A120E]/10 flex justify-between font-medium">
                  <span>Total Paid ({confirmedOrder.paymentMethod})</span>
                  <span className="font-mono tabular-nums text-[#8C5F23]">
                    ${confirmedOrder.total.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const code = confirmedOrder.orderNumber;
                  closeDrawer();
                  navigate('track', { orderNumber: code });
                }}
                className="w-full py-3 px-4 rounded-lg bg-[#C6934B] text-[#120D0A] text-sm font-semibold hover:bg-[#D4A853] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Track Live Order Status</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {cart.length > 0 && step !== 'confirmed' && (
          <div className="px-6 py-5 border-t border-[#1A120E]/10 bg-white space-y-3">
            <div className="space-y-1.5 text-xs text-[#5C493E]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">${cartSubtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Offer ({normalizedPromo})</span>
                  <span className="font-mono tabular-nums">-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Estimated Tax (8%)</span>
                <span className="font-mono tabular-nums">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-[#1A120E] pt-1.5 border-t border-[#1A120E]/10">
                <span>Total</span>
                <span className="font-mono tabular-nums">${total.toFixed(2)}</span>
              </div>
            </div>

            {step === 'cart' ? (
              <button
                type="button"
                onClick={openCheckout}
                className="w-full py-3 px-4 rounded-lg bg-[#1A120E] text-[#FAF7F2] text-sm font-medium hover:bg-[#2F2119] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4 text-[#D4A853]" />
              </button>
            ) : (
              <button
                type="submit"
                form="checkout-form"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-lg bg-[#C6934B] text-[#120D0A] text-sm font-semibold hover:bg-[#D4A853] disabled:opacity-60 transition-colors cursor-pointer"
              >
                {submitting ? 'Confirming Order...' : `Confirm Order · $${total.toFixed(2)}`}
              </button>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
