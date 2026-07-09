import { Crown, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export function PremiumBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl">
      <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-700 rounded-2xl shadow-2xl">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 px-6 py-4">
          {/* Left */}
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/20">
              <Crown className="h-7 w-7 text-yellow-400" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">
                Unlock Premium Predictions
              </h3>

              <p className="text-sm text-zinc-400">
                Get AI predictions, Correct Score tips, BTTS, Over/Under,
                Value Bets, and Ad-Free experience.
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <button
              className="
                rounded-xl
                bg-green-500
                px-6
                py-3
                font-semibold
                text-white
                transition
                hover:bg-green-400
                hover:scale-105
              "
              style={{
                fontFamily: 'Georgia, serif',
                boxShadow: '0 0 0 rgba(197, 12, 234, 1)',
                opacity: 0.96,
              }}
            >
              Upgrade Now
            </button>

            <button
              onClick={() => setVisible(false)}
              className="
                rounded-lg
                p-2
                text-zinc-400
                hover:bg-zinc-800
                hover:text-white
              "
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
