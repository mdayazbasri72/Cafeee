import { useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { PageRoute } from '../context/StoreContext';

const NAV_LINKS: Array<{ label: string; route: PageRoute }> = [
  { label: 'Menu', route: 'menu' },
  { label: 'About', route: 'about' },
  { label: 'Reserve', route: 'reserve' },
  { label: 'Contact', route: 'contact' },
  { label: 'Account', route: 'account' },
];

export function Navbar() {
  const { route, navigate, cartCount, setCartOpen, user } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (target: PageRoute) => {
    setMobileOpen(false);
    navigate(target);
  };

  return (
    <header className="sticky top-0 z-40 glass-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#/"
          onClick={(e) => {
            e.preventDefault();
            handleNav('home');
          }}
          className="font-display text-2xl font-semibold tracking-wider text-[#1A120E] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6934B] rounded"
        >
          CAFEE
        </a>

        {/* Zone 2: 5 single-line navigation links */}
        <nav aria-label="Primary Navigation" className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((item) => {
            const active = route === item.route;
            const displayLabel =
              item.route === 'account' && user
                ? user.role === 'admin'
                  ? 'Admin'
                  : user.name.split(' ')[0]
                : item.label;
            return (
              <a
                key={item.route}
                href={`#/${item.route}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNav(item.route === 'account' && user?.role === 'admin' ? 'admin' : item.route);
                }}
                className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6934B] rounded ${
                  active
                    ? 'text-[#1A120E]'
                    : 'text-[#5C493E] hover:text-[#1A120E]'
                }`}
              >
                {displayLabel}
                <span
                  aria-hidden="true"
                  className={`absolute left-0 right-0 -bottom-0.5 h-[1.5px] bg-[#C6934B] transition-transform duration-200 origin-left ${
                    active ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`Open order bag with ${cartCount} items`}
            className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg bg-[#1A120E] text-[#FAF7F2] text-xs font-medium hover:bg-[#2F2119] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6934B]"
          >
            <ShoppingBag className="w-4 h-4 text-[#D4A853]" strokeWidth={1.8} />
            <span>Bag</span>
            <span className="font-mono tabular-nums text-[#D4A853]">({cartCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#1A120E]/15 text-[#1A120E] hover:bg-[#1A120E]/5 cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#1A120E]/10 bg-[#FAF7F2] px-4 py-4 space-y-1">
          <button
            type="button"
            onClick={() => handleNav('home')}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#1A120E] hover:bg-[#1A120E]/5 cursor-pointer"
          >
            Home
          </button>
          {NAV_LINKS.map((item) => (
            <button
              key={item.route}
              type="button"
              onClick={() => handleNav(item.route)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer ${
                route === item.route
                  ? 'bg-[#1A120E] text-[#FAF7F2]'
                  : 'text-[#1A120E] hover:bg-[#1A120E]/5'
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleNav('track')}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#1A120E] hover:bg-[#1A120E]/5 cursor-pointer"
          >
            Track Order
          </button>
          <button
            type="button"
            onClick={() => handleNav('admin')}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#7A5422] hover:bg-[#C6934B]/10 cursor-pointer"
          >
            Admin Console
          </button>
        </div>
      )}
    </header>
  );
}
