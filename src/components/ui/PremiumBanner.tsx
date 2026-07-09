import { Crown, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export function PremiumBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showTimer = setInterval(() => {
      setVisible(true);
      const hideTimer = setTimeout(() => {
        setVisible(false);
      }, 5000);
      return () => clearTimeout(hideTimer);
    }, 30000);

    const initialTimer = setTimeout(() => {
      setVisible(true);
      const hideTimer = setTimeout(() => {
        setVisible(false);
      }, 5000);
      return () => clearTimeout(hideTimer);
    }, 30000);

    return () => {
      clearInterval(showTimer);
      clearTimeout(initialTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
      <div className="bg-gradient-to-r from-amber-400 to-yellow-300 backdrop-blur-xl border border-amber-500 rounded-xl shadow-2xl">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          {/* Left */}
          <div className="flex items-center gap-3">
            <Crown className="h-5 w-5 text-amber-900 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-amber-900">
                Unlock Premium
              </p>
              <p className="text-xs text-amber-800">
                Get exclusive predictions & tips
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              className="
                rounded-lg
                bg-amber-900
                px-4
                py-2
                text-xs
                font-semibold
                text-amber-50
                transition
                hover:bg-amber-800
                hover:scale-105
              "
              style={{
                fontFamily: 'Georgia, serif',
                boxShadow: '0 0 0 rgba(197, 12, 234, 1)',
                opacity: 0.96,
              }}
            >
              Upgrade
            </button>

            <button
              onClick={() => setVisible(false)}
              className="
                rounded-lg
                p-1
                text-amber-800
                hover:bg-amber-500/30
                hover:text-amber-900
                transition
              "
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
