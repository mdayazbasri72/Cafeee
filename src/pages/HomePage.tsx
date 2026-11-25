import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, Copy, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { ProductCard } from '../components/ProductCard';
import { SafeImage } from '../components/SafeImage';
import { useStore } from '../context/StoreContext';
import type { CustomerReview } from '../types';

export function HomePage() {
  const { products, productsLoading, navigate, setPromoCode, notify, user, apiFetch } = useStore();
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewVisit, setReviewVisit] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetch('/api/reviews')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.reviews) setReviews(data.reviews);
      })
      .catch(() => {});
  }, []);

  const featuredProducts = products.filter((p) => p.featured).slice(0, 6);

  const handleApplyOffer = (code: string) => {
    setPromoCode(code);
    setCopiedCode(code);
    notify(`Offer code ${code} applied to your bag.`, 'success');
    window.setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const res = await apiFetch<{ review: CustomerReview }>('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment,
          roleOrVisit: reviewVisit || 'Verified CAFEE Guest',
        }),
      });
      setReviews((prev) => [res.review, ...prev]);
      setReviewComment('');
      setReviewVisit('');
      notify('Thank you for sharing your CAFEE experience!', 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to post review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div>
      {/* 1. Luxury Full-Bleed Hero */}
      <section className="relative bg-[#120D0A] text-[#FAF7F2] overflow-hidden">
        <div className="absolute inset-0">
          <SafeImage
            src="/src/assets/images/hero_cafee_lounge_1795629293192.jpg"
            alt="CAFEE artisan espresso bar and warm mahogany lounge"
            className="w-full h-full object-cover opacity-70"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-[#120D0A]/92 via-[#120D0A]/72 to-[#120D0A]/35"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl space-y-6"
          >
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#D4A853]">
              Small-Batch Roastery · Artisanal Kitchen
            </p>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.08] tracking-tight text-balance">
              Welcome to CAFEE – Taste the Happiness
            </h1>

            <p className="text-base sm:text-lg text-[#E6DDD3] leading-relaxed max-w-xl">
              Fresh Coffee, Delicious Food, Beautiful Moments.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => navigate('menu')}
                className="inline-flex items-center gap-2 px-6 py-3.5 min-h-[44px] rounded-lg bg-[#C6934B] text-[#120D0A] text-sm font-semibold hover:bg-[#D4A853] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>Explore Menu</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => navigate('menu')}
                className="inline-flex items-center gap-2 px-6 py-3.5 min-h-[44px] rounded-lg glass-dark text-[#FAF7F2] text-sm font-medium hover:bg-white/15 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>Order Now</span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Full-width bottom luxury detail strip */}
        <div className="relative border-t border-white/12 bg-[#120D0A]/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[#D4A853] block font-medium">Single-Origin Roast</span>
              <span className="text-[#C4B7AA]">Ethiopian, Colombian &amp; Kyoto Drip</span>
            </div>
            <div>
              <span className="text-[#D4A853] block font-medium">Artisanal Kitchen</span>
              <span className="text-[#C4B7AA]">48h Sourdough Pizza, Burgers &amp; Patisserie</span>
            </div>
            <div>
              <span className="text-[#D4A853] block font-medium">Table Reservations</span>
              <button
                type="button"
                onClick={() => navigate('reserve')}
                className="text-[#FAF7F2] underline hover:text-[#D4A853] cursor-pointer"
              >
                Book Courtyard or Lounge Seating
              </button>
            </div>
            <div>
              <span className="text-[#D4A853] block font-medium">Live Order Tracking</span>
              <button
                type="button"
                onClick={() => navigate('track')}
                className="text-[#FAF7F2] underline hover:text-[#D4A853] cursor-pointer"
              >
                Track Your Delivery or Pickup
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured Signature Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#1A120E]/10 pb-6">
          <div className="space-y-2 max-w-xl">
            <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#8C5F23]">
              Signature Selection
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#1A120E]">
              Curated House Favorites
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('menu')}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#1A120E] hover:text-[#8C5F23] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>View All 11 Categories</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {productsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="h-96 rounded-xl bg-[#EFE8DD] animate-pulse border border-[#1A120E]/5"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 3. Special Offers & Seasonal Privileges */}
      <section className="bg-[#1A120E] text-[#FAF7F2] py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-3">
              <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#D4A853]">
                Seasonal Privileges
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-balance">
                Special Offers for Online Orders
              </h2>
              <p className="text-sm text-[#C4B7AA] leading-relaxed">
                Apply a privilege code directly to your order bag at checkout for instant savings on freshly brewed coffee and kitchen plates.
              </p>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="glass-dark rounded-xl p-6 flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                  <span className="text-xs text-[#D4A853]">Morning &amp; Afternoon Brews</span>
                  <h3 className="font-display text-2xl font-semibold">15% Off Any Order</h3>
                  <p className="text-xs text-[#C4B7AA]">
                    Valid across all hot coffees, cold brews, cappuccinos, and patisserie cakes.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className="font-mono text-sm tracking-wider text-[#D4A853]">CAFEE15</span>
                  <button
                    type="button"
                    onClick={() => handleApplyOffer('CAFEE15')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#C6934B] text-[#120D0A] text-xs font-semibold hover:bg-[#D4A853] transition-colors cursor-pointer"
                  >
                    {copiedCode === 'CAFEE15' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Applied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Apply Offer</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="glass-dark rounded-xl p-6 flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                  <span className="text-xs text-[#D4A853]">Dinner &amp; Group Tables</span>
                  <h3 className="font-display text-2xl font-semibold">20% Off Orders $30+</h3>
                  <p className="text-xs text-[#C4B7AA]">
                    Ideal for pairing wood-fired sourdough pizzas, wagyu burgers, and shakes.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className="font-mono text-sm tracking-wider text-[#D4A853]">GOLD20</span>
                  <button
                    type="button"
                    onClick={() => handleApplyOffer('GOLD20')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#C6934B] text-[#120D0A] text-xs font-semibold hover:bg-[#D4A853] transition-colors cursor-pointer"
                  >
                    {copiedCode === 'GOLD20' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Applied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Apply Offer</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Customer Reviews */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#1A120E]/10 pb-6">
          <div className="space-y-2 max-w-xl">
            <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#8C5F23]">
              Guest Reflections
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#1A120E]">
              Loved by Coffee Purists
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('reserve')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#1A120E]/20 text-xs font-medium hover:bg-[#1A120E] hover:text-[#FAF7F2] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Reserve Your Experience
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.slice(0, 3).map((review) => (
            <article
              key={review.id}
              className="bg-white rounded-xl border border-[#1A120E]/10 p-6 flex flex-col justify-between gap-5"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-[#C6934B]" aria-label={`${review.rating} out of 5 stars`}>
                  {Array.from({ length: review.rating }).map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-[#3E2F26] leading-relaxed">
                  “{review.comment}”
                </p>
              </div>
              <div className="pt-3 border-t border-[#1A120E]/8">
                <div className="font-medium text-sm text-[#1A120E]">{review.authorName}</div>
                <div className="text-xs text-[#7D6658]">{review.roleOrVisit}</div>
              </div>
            </article>
          ))}
        </div>

        <div className="bg-[#F2ECE2] rounded-xl border border-[#1A120E]/10 p-6 sm:p-8">
          {user && user.role === 'customer' ? (
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-2xl font-semibold">Share Your Visit</h3>
                  <p className="text-xs text-[#6E5A4F]">
                    Posting as {user.name}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      aria-label={`Rate ${star} stars`}
                      className="p-1 cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= reviewRating
                            ? 'text-[#C6934B] fill-current'
                            : 'text-[#1A120E]/20'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  value={reviewVisit}
                  onChange={(e) => setReviewVisit(e.target.value)}
                  placeholder="Your role or visit (e.g. Weekend Brunch)"
                  className="px-3.5 py-2.5 rounded-lg border border-[#1A120E]/15 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C6934B]"
                />
                <input
                  required
                  type="text"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Tell others what stood out about your coffee or meal..."
                  className="md:col-span-2 px-3.5 py-2.5 rounded-lg border border-[#1A120E]/15 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C6934B]"
                />
              </div>
              <button
                type="submit"
                disabled={submittingReview}
                className="px-5 py-2.5 rounded-lg bg-[#1A120E] text-[#FAF7F2] text-xs font-medium hover:bg-[#2F2119] disabled:opacity-60 cursor-pointer"
              >
                {submittingReview ? 'Publishing...' : 'Publish Review'}
              </button>
            </form>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl font-semibold">Visited CAFEE Recently?</h3>
                <p className="text-sm text-[#6E5A4F]">
                  Sign in to your guest account to leave a verified review.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('account')}
                className="px-5 py-2.5 rounded-lg bg-[#1A120E] text-[#FAF7F2] text-xs font-medium hover:bg-[#2F2119] cursor-pointer whitespace-nowrap shrink-0"
              >
                Sign In to Review
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
