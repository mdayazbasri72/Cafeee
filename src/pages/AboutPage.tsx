import { ArrowRight } from 'lucide-react';
import { SafeImage } from '../components/SafeImage';
import { useStore } from '../context/StoreContext';

export function AboutPage() {
  const { navigate } = useStore();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 space-y-20">
      {/* Story Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        <div className="lg:col-span-6 flex flex-col justify-center space-y-5">
          <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#8C5F23]">
            Our Heritage
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#1A120E] text-balance">
            Crafted for Unhurried Mornings &amp; Golden Evenings
          </h1>
          <p className="text-base text-[#4B3B32] leading-relaxed">
            Founded in Hayes Valley, CAFEE began with a simple conviction: a neighborhood café should unite specialty third-wave coffee roasting with true culinary craftsmanship. Every morning begins at 5:30 AM as our bakers pull 48-hour fermented sourdough loaves from the stone hearth while our roasters calibrate single-origin Ethiopian and Colombian micro-lots.
          </p>
          <p className="text-base text-[#4B3B32] leading-relaxed">
            From Kyoto 14-hour slow-drip cold brews to Belgian dark chocolate opera cakes finished with 24K edible gold leaf, every detail on our marble counter is built to turn an ordinary break into a lasting memory.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('menu')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#1A120E] text-[#FAF7F2] text-xs font-medium hover:bg-[#2F2119] cursor-pointer"
            >
              <span>Explore Our Menu</span>
              <ArrowRight className="w-4 h-4 text-[#D4A853]" />
            </button>
            <button
              type="button"
              onClick={() => navigate('reserve')}
              className="px-5 py-3 rounded-lg border border-[#1A120E]/20 text-xs font-medium hover:bg-[#1A120E]/5 cursor-pointer"
            >
              Reserve a Table
            </button>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="h-full min-h-[340px] rounded-xl overflow-hidden border border-[#1A120E]/10 bg-[#EFE8DD]">
            <SafeImage
              src="/src/assets/images/about_cafee_craft_1795629292379.jpg"
              alt="Master barista pouring rosetta latte art at CAFEE marble counter"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 py-12 border-y border-[#1A120E]/10">
        <div className="space-y-3">
          <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#8C5F23]">
            01. Our Mission
          </p>
          <h2 className="font-display text-3xl font-semibold text-[#1A120E]">
            Honoring Origin, Farmer &amp; Guest
          </h2>
          <p className="text-sm sm:text-base text-[#5C493E] leading-relaxed">
            We source 100% traceable high-altitude green coffee directly from smallholder estates at transparent farm-gate premiums, roasting weekly in small batches so every cup expresses clean terroir and natural sweetness.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#8C5F23]">
            02. Our Vision
          </p>
          <h2 className="font-display text-3xl font-semibold text-[#1A120E]">
            A Sanctuary of Warm Hospitality
          </h2>
          <p className="text-sm sm:text-base text-[#5C493E] leading-relaxed">
            Whether you join us in the sunlit courtyard for a weekend brunch or order online for your studio team, we aim to make elevated coffee, freshly baked kitchen fare, and warm service effortlessly accessible every day.
          </p>
        </div>
      </section>

      {/* Why Choose CAFEE & Fresh Ingredients */}
      <section className="space-y-10">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#8C5F23]">
            Why Choose CAFEE
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#1A120E]">
            Fresh Ingredients &amp; Uncompromising Standards
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-[#1A120E]/10 p-6 space-y-3">
            <span className="font-mono text-xs text-[#8C5F23]">01 · ROASTERY</span>
            <h3 className="font-display text-2xl font-semibold">Precision Extraction</h3>
            <p className="text-sm text-[#5C493E] leading-relaxed">
              Every espresso shot is weighed to 0.1g precision, pulled through custom mineral-filtered water, and paired with organic pasture-raised milk or barista oat milk.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-[#1A120E]/10 p-6 space-y-3">
            <span className="font-mono text-xs text-[#8C5F23]">02 · KITCHEN</span>
            <h3 className="font-display text-2xl font-semibold">Scratch Sourdough &amp; Prime Cuts</h3>
            <p className="text-sm text-[#5C493E] leading-relaxed">
              Our pizzas and paninis begin with 48-hour cold-fermented organic stone-milled dough, topped with fresh burrata, San Marzano tomatoes, and seared wagyu beef.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-[#1A120E]/10 p-6 space-y-3">
            <span className="font-mono text-xs text-[#8C5F23]">03 · PATISSERIE</span>
            <h3 className="font-display text-2xl font-semibold">Small-Batch Desserts</h3>
            <p className="text-sm text-[#5C493E] leading-relaxed">
              Crafted each morning with 70% Belgian couverture chocolate, Sicilian pistachios, Kashmiri saffron, and Madagascar vanilla beans without artificial stabilizers.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
