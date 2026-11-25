import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { Product } from '../types';
import { SafeImage } from './SafeImage';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { cart, addToCart, updateCartQty } = useStore();
  const inCart = cart.find((item) => item.product.id === product.id);

  return (
    <article className="perspective-card group h-full">
      <div className="card-3d-inner h-full flex flex-col bg-white rounded-xl border border-[#1A120E]/10 overflow-hidden shadow-sm hover:shadow-xl">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#EFE8DD]">
          <SafeImage
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <div className="flex-1 p-5 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-[#7D6658]">
              <span>{product.category}</span>
              {product.originNote && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">{product.originNote}</span>
                </>
              )}
            </div>

            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-xl font-semibold text-[#1A120E] leading-snug">
                {product.name}
              </h3>
              <span className="font-mono tabular-nums text-base font-medium text-[#8C5F23] shrink-0">
                ${product.price.toFixed(2)}
              </span>
            </div>

            <p className="text-sm text-[#5C493E] leading-relaxed line-clamp-2">
              {product.description}
            </p>
          </div>

          <div className="pt-2 border-t border-[#1A120E]/8 flex items-center justify-between gap-3">
            <span className="text-xs text-[#8D7768]">
              {product.prepTime ? `Prep ${product.prepTime}` : 'Made to order'}
            </span>

            {inCart ? (
              <div className="inline-flex items-center gap-1 rounded-lg bg-[#1A120E] text-[#FAF7F2] px-1.5 py-1">
                <button
                  type="button"
                  onClick={() => updateCartQty(product.id, inCart.quantity - 1)}
                  aria-label={`Decrease quantity of ${product.name}`}
                  className="w-7 h-7 inline-flex items-center justify-center rounded hover:bg-white/10 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono tabular-nums text-xs px-2">
                  {inCart.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateCartQty(product.id, inCart.quantity + 1)}
                  aria-label={`Increase quantity of ${product.name}`}
                  className="w-7 h-7 inline-flex items-center justify-center rounded hover:bg-white/10 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => addToCart(product, 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-lg bg-[#1A120E] text-[#FAF7F2] text-xs font-medium hover:bg-[#C6934B] hover:text-[#120D0A] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6934B]"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add to Bag</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
