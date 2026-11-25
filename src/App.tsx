import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { CartDrawer } from './components/CartDrawer';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { StoreProvider, useStore } from './context/StoreContext';
import { AboutPage } from './pages/AboutPage';
import { AccountPage } from './pages/AccountPage';
import { AdminPage } from './pages/AdminPage';
import { ContactPage } from './pages/ContactPage';
import { HomePage } from './pages/HomePage';
import { MenuPage } from './pages/MenuPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { ReservationPage } from './pages/ReservationPage';

function ToastStack() {
  const { toasts, dismissToast } = useStore();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-lg text-xs font-medium border ${
            toast.tone === 'error'
              ? 'bg-red-950 text-red-100 border-red-800'
              : toast.tone === 'success'
              ? 'bg-[#1A120E] text-[#FAF7F2] border-[#C6934B]/40'
              : 'bg-white text-[#1A120E] border-[#1A120E]/15'
          }`}
        >
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss notification"
            className="opacity-70 hover:opacity-100 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

function AppShell() {
  const { route } = useStore();
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  useEffect(() => {
    const onQuota = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuota);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1A120E]">
      {mapsQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      <Navbar />

      <main className="flex-1">
        {route === 'home' && <HomePage />}
        {route === 'menu' && <MenuPage />}
        {route === 'about' && <AboutPage />}
        {route === 'reserve' && <ReservationPage />}
        {route === 'contact' && <ContactPage />}
        {route === 'account' && <AccountPage />}
        {route === 'track' && <OrderTrackingPage />}
        {route === 'admin' && <AdminPage />}
      </main>

      <Footer />
      <CartDrawer />
      <ToastStack />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  );
}
