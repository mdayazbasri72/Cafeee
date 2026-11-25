import { useStore } from '../context/StoreContext';
import type { PageRoute } from '../context/StoreContext';

export function Footer() {
  const { navigate } = useStore();

  const link = (label: string, target: PageRoute) => (
    <button
      type="button"
      onClick={() => navigate(target)}
      className="text-sm text-[#D6CBC0] hover:text-[#D4A853] transition-colors text-left cursor-pointer"
    >
      {label}
    </button>
  );

  return (
    <footer className="bg-[#120D0A] text-[#FAF7F2] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          <div className="space-y-3">
            <div className="font-display text-3xl font-semibold tracking-wider text-[#FAF7F2]">
              CAFEE
            </div>
            <p className="text-sm text-[#C4B7AA] leading-relaxed max-w-xs">
              Fresh Coffee, Delicious Food, Beautiful Moments. Roasted in small batches and plated with care daily.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-sans text-xs font-semibold tracking-widest uppercase text-[#D4A853]">
              Explore
            </h3>
            <div className="flex flex-col gap-2.5">
              {link('Home', 'home')}
              {link('Full Menu', 'menu')}
              {link('Our Story', 'about')}
              {link('Book a Table', 'reserve')}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-sans text-xs font-semibold tracking-widest uppercase text-[#D4A853]">
              Guest Services
            </h3>
            <div className="flex flex-col gap-2.5">
              {link('Track Your Order', 'track')}
              {link('Customer Account', 'account')}
              {link('Contact & Map', 'contact')}
              {link('Admin Portal', 'admin')}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-sans text-xs font-semibold tracking-widest uppercase text-[#D4A853]">
              Flagship Lounge
            </h3>
            <p className="text-sm text-[#C4B7AA] leading-relaxed">
              485 Hayes Street, Hayes Valley
              <br />
              San Francisco, CA 94102
            </p>
            <p className="text-sm text-[#C4B7AA] tabular-nums">
              Mon – Fri: 07:00 – 22:00
              <br />
              Sat – Sun: 08:00 – 23:00
            </p>
            <div className="flex items-center gap-4 pt-1 text-xs text-[#D4A853]">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Instagram
              </a>
              <span aria-hidden="true">·</span>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Facebook
              </a>
              <span aria-hidden="true">·</span>
              <a
                href="https://wa.me/14155550199"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9E8E7F]">
          <p>© {new Date().getFullYear()} CAFEE Roastery &amp; Patisserie. All rights reserved.</p>
          <p>
            Maps integration subject to{' '}
            <a
              href="https://cloud.google.com/maps-platform/terms?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-[#D4A853]"
            >
              Google Maps Platform Terms
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
