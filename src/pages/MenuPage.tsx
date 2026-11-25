import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { useStore } from '../context/StoreContext';
import { MENU_CATEGORIES } from '../types';

export function MenuPage() {
  const {
    products,
    productsLoading,
    selectedCategoryFilter,
    setSelectedCategoryFilter,
  } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  const categories = useMemo(() => ['All', ...MENU_CATEGORIES], []);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((item) => {
      if (selectedCategoryFilter !== 'All' && item.category !== selectedCategoryFilter) {
        return false;
      }
      if (q) {
        const text = `${item.name} ${item.category} ${item.description} ${item.originNote ?? ''}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [products, selectedCategoryFilter, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[#1A120E]/10 pb-8">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#8C5F23]">
            Seasonal Collection
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#1A120E]">
            The CAFEE Menu
          </h1>
          <p className="text-sm sm:text-base text-[#5C493E]">
            Explore single-origin espresso extractions, chilled milkshakes, wood-fired sourdough, and handcrafted patisserie.
          </p>
        </div>

        <div className="relative w-full lg:w-80 shrink-0">
          <Search className="w-4 h-4 text-[#7D6658] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search espresso, pizza, cake..."
            aria-label="Search menu items"
            className="w-full pl-10 pr-9 py-2.5 rounded-lg border border-[#1A120E]/15 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C6934B]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7D6658] hover:text-[#1A120E] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Bar */}
      <div
        role="tablist"
        aria-label="Menu Categories"
        className="flex flex-wrap items-center gap-2"
      >
        {categories.map((cat) => {
          const active = selectedCategoryFilter === cat;
          return (
            <button
              key={cat}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setSelectedCategoryFilter(cat)}
              className={`px-3.5 py-2 min-h-[40px] rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-[#1A120E] text-[#FAF7F2]'
                  : 'bg-[#EFE8DD] text-[#5C493E] hover:bg-[#E4DACB] hover:text-[#1A120E]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Results Grid */}
      {productsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-96 rounded-xl bg-[#EFE8DD] animate-pulse border border-[#1A120E]/5"
            />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-[#1A120E]/10 space-y-3">
          <h2 className="font-display text-2xl font-semibold">No matching items found</h2>
          <p className="text-sm text-[#6E5A4F]">
            Try clearing your search or switching back to all menu categories.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategoryFilter('All');
              setSearchQuery('');
            }}
            className="px-5 py-2.5 rounded-lg bg-[#1A120E] text-[#FAF7F2] text-xs font-medium cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
