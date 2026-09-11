import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, CardContent } from '../ui';
import { Trophy, Mail, Lock, Eye, EyeOff, CheckCircle2, TrendingUp, Shield, Users, X } from 'lucide-react';

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [legal, setLegal] = useState<null | 'terms' | 'privacy'>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      login(email, 'free');
      setLoading(false);
    }, 800);
  };

  const stats = [
    { icon: TrendingUp, label: 'Win Rate', value: '79%' },
    { icon: Shield, label: 'Verified Results', value: '8.8K+' },
    { icon: Users, label: 'Active Users', value: '24K+' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col lg:flex-row">
      {/* Left branding panel */}
      <div className="flex-1 hidden lg:flex flex-col justify-center px-16 py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNiA2djZoNnYtNmgtNnptLTYgMHY2aDZ2LTZoLTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/50">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <span className="text-white font-bold text-2xl">FootyPredict AI</span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-4">
            Smarter Football<br />
            <span className="text-blue-400">Predictions</span>
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed mb-10">
            AI-powered football tips with verified results. Join thousands of bettors making more informed decisions every week.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-10">
            {stats.map(s => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center backdrop-blur-sm">
                <s.icon className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-black text-white">{s.value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {[
              'Daily free predictions with no credit card required',
              'Premium picks with 85%+ verified win rate',
              'Real-time alerts for upcoming high-confidence picks',
            ].map(item => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-slate-300 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:px-12">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <span className="text-white font-bold text-xl">FootyPredict AI</span>
        </div>

        <div className="w-full max-w-md">
          <Card className="shadow-2xl">
            <CardContent className="p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  {isSignUp ? 'Create your account' : 'Welcome back'}
                </h2>
                <p className="text-slate-500 text-sm">
                  {isSignUp ? 'Start with free predictions today.' : 'Sign in to access your predictions dashboard.'}
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Password
                    </label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => setResetSent(true)}
                        className="text-xs text-blue-600 hover:text-blue-500 font-medium"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={isSignUp ? 'new-password' : 'current-password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {isSignUp && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="block w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : (isSignUp ? 'Create Account' : 'Sign In')}
                </Button>

                {resetSent && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                    If an account exists for {email || 'your email'}, a password reset link has been sent.
                    (Demo — no email is actually sent.)
                  </p>
                )}
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-500">
                  {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                  <button
                    onClick={() => setIsSignUp(s => !s)}
                    className="text-blue-600 hover:text-blue-500 font-semibold"
                  >
                    {isSignUp ? 'Sign in' : 'Sign up free'}
                  </button>
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-400 text-center leading-relaxed">
                  By signing in, you agree to our{' '}
                  <button type="button" onClick={() => setLegal('terms')} className="text-blue-500 hover:underline">Terms of Service</button>{' '}
                  and{' '}
                  <button type="button" onClick={() => setLegal('privacy')} className="text-blue-500 hover:underline">Privacy Policy</button>.
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-slate-400 mt-4">
            🔒 Secured with 256-bit SSL encryption
          </p>
        </div>
      </div>

      {/* Legal modal */}
      {legal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setLegal(null)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {legal === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
              </h3>
              <button
                onClick={() => setLegal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {legal === 'terms' ? (
              <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2 list-disc pl-4">
                <li>FootyPredict is a prediction platform for entertainment; tips are not financial advice.</li>
                <li>Free and Premium tiers, features and pricing are subject to change.</li>
                <li>Always bet responsibly and only with money you can afford to lose.</li>
              </ul>
            ) : (
              <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2 list-disc pl-4">
                <li>We collect your name, email, and password when you create an account.</li>
                <li>Payment details are processed by our payment provider and never stored on our servers.</li>
                <li>You can view the full privacy policy after signing in.</li>
              </ul>
            )}

            <button
              onClick={() => setLegal(null)}
              className="w-full h-10 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
