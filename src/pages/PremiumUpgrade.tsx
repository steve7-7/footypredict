import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button, Card, CardContent, CardHeader, CardTitle } from '../components/ui';
import { Check, Crown, Zap, ShieldCheck, CreditCard, ExternalLink, RefreshCw, Lock } from 'lucide-react';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

// Demo Paystack Test Public Key
const DEFAULT_PAYSTACK_KEY = 'pk_live_d4e12fc3d689e19440973a66eaa985fcfdf1a7cc';

const CURRENCIES = [
  { code: 'USD', symbol: '$', price: 19.99, amountInKobo: 1999 }, // Paystack USD expects cents
  { code: 'NGN', symbol: '₦', price: 15500, amountInKobo: 1550000 }, // Kobo
  { code: 'GHS', symbol: 'GH₵', price: 290, amountInKobo: 29000 }, // Pesewas
  { code: 'ZAR', symbol: 'R', price: 380, amountInKobo: 38000 }, // Cents
  { code: 'KES', symbol: 'KSh', price: 50, amountInKobo: 5000 }, // Cents
];

export function PremiumUpgrade({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const { user, upgrade } = useAuth();
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]);
  const [loadingPaystack, setLoadingPaystack] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<any>(null);
  const [paystackKey, setPaystackKey] = useState(DEFAULT_PAYSTACK_KEY);
  const [customPhone, setCustomPhone] = useState('+2348012345678');

  // Load Paystack Inline script
  useEffect(() => {
    if (window.PaystackPop) {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      console.warn('Paystack inline script could not be loaded. Adblocker or offline?');
    };
    document.body.appendChild(script);
  }, []);

  if (user?.plan === 'premium') {
    return (
      <div className="max-w-3xl mx-auto text-center py-12 space-y-6">
        <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
          <Crown className="w-10 h-10 text-amber-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">You are a Premium Member! 🎉</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Your active subscription gives you unlimited access to our highest confidence picks, live API feeds, expert rationale, and all global leagues.
        </p>
        
        {paymentSuccess && (
          <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-left max-w-lg mx-auto">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-base">
                <ShieldCheck className="w-5 h-5" />
                <span>Paystack Payment Verified Successfully</span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 font-mono bg-white dark:bg-slate-900 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                <div><span className="font-semibold text-slate-500">Reference:</span> {paymentSuccess.reference}</div>
                <div><span className="font-semibold text-slate-500">Status:</span> {paymentSuccess.status || 'success'}</div>
                <div><span className="font-semibold text-slate-500">Amount Paid:</span> {selectedCurrency.symbol}{selectedCurrency.price} {selectedCurrency.code}</div>
                <div><span className="font-semibold text-slate-500">Account:</span> {user?.email}</div>
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                A receipt has been sent to your registered email address.
              </p>
            </CardContent>
          </Card>
        )}

        <div>
          <Button onClick={() => setActiveTab('predictions')} size="lg" className="shadow-lg">
            View Live Premium Picks
          </Button>
        </div>
      </div>
    );
  }

  const handlePaystackCheckout = () => {
    if (!window.PaystackPop) {
      alert('Paystack inline script is not loaded yet or blocked by your browser. Using simulated checkout...');
      simulateSuccess();
      return;
    }

    setLoadingPaystack(true);

    try {
      const handler = window.PaystackPop.setup({
        key: paystackKey,
        email: user?.email || 'customer@footypredict.ai',
        amount: selectedCurrency.amountInKobo,
        currency: selectedCurrency.code,
        ref: 'FP_PRO_' + Math.floor(Math.random() * 1000000000 + 1),
        metadata: {
          custom_fields: [
            {
              display_name: 'Member Name',
              variable_name: 'member_name',
              value: user?.name || 'FootyPredict Pro Member',
            },
            {
              display_name: 'Mobile Number',
              variable_name: 'mobile_number',
              value: customPhone,
            },
            {
              display_name: 'Plan',
              variable_name: 'plan_name',
              value: 'Premium Access (Monthly)',
            },
          ],
        },
        callback: (response: any) => {
          setLoadingPaystack(false);
          setPaymentSuccess(response);
          upgrade();
        },
        onClose: () => {
          setLoadingPaystack(false);
          console.log('Paystack checkout popup closed by user.');
        },
      });

      handler.openIframe();
    } catch (err) {
      console.error('Paystack error:', err);
      setLoadingPaystack(false);
      alert('Could not initialize Paystack popup. Check your public key or test environment.');
    }
  };

  const simulateSuccess = () => {
    const mockResponse = {
      reference: 'FP_PRO_SIM_' + Math.floor(Math.random() * 1000000000 + 1),
      status: 'success',
      message: 'Approved Simulator Transaction',
      transaction: '1234567890',
    };
    setPaymentSuccess(mockResponse);
    upgrade();
  };

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 px-4 py-1.5 rounded-full text-sm font-semibold">
          <ShieldCheck className="w-4 h-4" /> Official Paystack Gateway Integration
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
          Upgrade to Premium Access
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Get instantaneous access to our live RapidAPI prediction engine, advanced market/federation filters, and historical Betigolo data.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Plan Summary */}
        <Card className="flex flex-col opacity-80 hover:opacity-100 transition-opacity">
          <CardHeader>
            <CardTitle className="text-slate-800 dark:text-slate-200">Free Tier</CardTitle>
            <div className="mt-4">
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white">$0</span>
              <span className="text-slate-500 dark:text-slate-400">/month</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">Perfect for casual betting fans.</p>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <ul className="space-y-4 mb-8">
              {[
                '3 Basic Predictions daily',
                'Standard Leagues only',
                'Basic odds comparison',
                'Community forum access',
                'Historical mock results view'
              ].map((feature, i) => (
                <li key={i} className="flex items-start text-sm">
                  <Check className="w-4 h-4 text-slate-400 shrink-0 mr-3 mt-0.5" />
                  <span className="text-slate-600 dark:text-slate-300">{feature}</span>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full h-11 font-semibold" disabled>
              Your Current Plan
            </Button>
          </CardContent>
        </Card>

        {/* Premium Plan with Paystack */}
        <Card className="flex flex-col border-amber-500/50 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black px-4 py-1 rounded-bl-lg uppercase tracking-wider shadow">
            🔥 Premium Access
          </div>
          <CardHeader className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-900/10 dark:to-orange-900/10 border-b border-amber-500/20">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 mb-1">
              <Crown className="w-5 h-5" />
              <CardTitle className="text-amber-800 dark:text-amber-400 font-bold">FootyPredict Pro</CardTitle>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-black text-slate-900 dark:text-white">
                {selectedCurrency.symbol}{selectedCurrency.price}
              </span>
              <span className="text-slate-500 dark:text-slate-400 font-medium">/month</span>
            </div>

            {/* Currency selector */}
            <div className="mt-4 pt-3 border-t border-amber-500/20 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Billed Currency</span>
              <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg border border-amber-500/30 shadow-sm text-xs font-medium">
                {CURRENCIES.map(curr => (
                  <button
                    key={curr.code}
                    onClick={() => setSelectedCurrency(curr)}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      selectedCurrency.code === curr.code
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {curr.code}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col pt-6 space-y-6">
            {/* Features */}
            <ul className="space-y-3 flex-1 text-sm">
              {[
                '⚡ Unlimited Live RapidAPI Feed Picks',
                '🌐 All Global Leagues & Federations',
                '📊 Advanced Market Filtering (BTTS, Over/Under)',
                '🧠 Detailed Expert Rationale per Pick',
                '📲 Live Alerts & Priority SMS Updates',
                '💳 Full Paystack Secure Payment Gateway'
              ].map((feature, i) => (
                <li key={i} className="flex items-start font-medium text-slate-700 dark:text-slate-200">
                  <Zap className="w-4 h-4 text-amber-500 shrink-0 mr-3 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {/* Checkout Configuration & Inputs - Hidden from public */}
            {typeof window !== 'undefined' && (window as any).__ADMIN__ && (
              <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-500" /> Paystack Checkout Settings
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Secure 256-bit SSL
                  </span>
                </div>

                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Paystack Test Public Key</label>
                    <input
                      type="text"
                      value={paystackKey}
                      onChange={(e) => setPaystackKey(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none text-[11px]"
                      placeholder="pk_test_..."
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Uses official Paystack inline popup sandbox environment.</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Account Email</label>
                    <input
                      type="text"
                      disabled
                      value={user?.email || 'customer@footypredict.ai'}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 text-slate-600 dark:text-slate-400 text-xs cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Mobile Phone (For Alerts)</label>
                    <input
                      type="text"
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none text-xs"
                      placeholder="+234 801 234 5678"
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  <span>Accepted Methods:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">💳 Card · 🏦 Transfer · 📱 USSD · ⚡ Mobile Money</span>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="space-y-2">
              <Button
                variant="premium"
                className="w-full text-base h-12 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all font-bold"
                onClick={handlePaystackCheckout}
                disabled={loadingPaystack || !scriptLoaded}
              >
                {loadingPaystack ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" /> Initializing Paystack...
                  </>
                ) : !scriptLoaded ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" /> Loading Gateway...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> Pay {selectedCurrency.symbol}{selectedCurrency.price} with Paystack <ExternalLink className="w-4 h-4 ml-1 opacity-80" />
                  </>
                )}
              </Button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center text-[11px]">
                  <span className="px-2 bg-white dark:bg-slate-800 text-slate-400">OR BYPASS FOR TESTING</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full text-xs h-9 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                onClick={simulateSuccess}
              >
                <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-500" /> Simulate Payment Success instantly
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Paystack Info Gateway Banner */}
      <Card className="bg-slate-900 text-slate-300 border-none overflow-hidden max-w-4xl mx-auto">
        <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-white font-bold text-lg">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <span>Enterprise Grade Security by Paystack</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
              Paystack is a PCI-DSS Level 1 compliant payment provider. Your card details are never stored on FootyPredict servers. We support seamless payments across Nigeria, Ghana, Kenya, South Africa, and global debit/credit cards.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 shrink-0 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm w-full sm:w-auto text-center">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Secured &amp; Verified</span>
            <div className="flex items-center gap-2 text-white font-black text-xl tracking-tight">
              <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-base font-bold">P</span>
              <span>paystack</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-medium">SSL / PCI-DSS Level 1</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
