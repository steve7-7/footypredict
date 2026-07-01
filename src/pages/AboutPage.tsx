import { TEAM_MEMBERS, STATS } from '../data/mockData';
import { Card, CardContent, Button } from '../components/ui';
import { useNavigate } from 'react-router-dom';
import { Trophy, Target, TrendingUp, Users, Globe, Shield, ChevronRight } from 'lucide-react';

export function AboutPage() {
  const navigate = useNavigate();
  return (
    <div className="space-y-12 max-w-5xl mx-auto">
      {/* Demo Banner */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-center">
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
          🎨 <strong>Portfolio Project:</strong> This is a UI/UX demo for a sports prediction platform. Login & premium features are simulated.
        </p>
      </div>

      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-semibold">
          <Trophy className="w-4 h-4" /> About FootyPredict
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
          A UI/UX Portfolio for<br />Sports Prediction Design
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          This project demonstrates professional frontend design, real-time API integration patterns, and thoughtful UX for sports prediction platforms.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Target, label: 'Total Predictions', value: `${(STATS.totalPredictions / 1000).toFixed(1)}K+` },
          { icon: TrendingUp, label: 'Overall Win Rate', value: `${STATS.overallWinRate}%` },
          { icon: Globe, label: 'Leagues Covered', value: `${STATS.leaguesCovered}+` },
          { icon: Users, label: 'Active Users', value: `${(STATS.activeUsers / 1000).toFixed(0)}K+` },
        ].map(stat => (
          <Card key={stat.label} className="text-center">
            <CardContent className="p-5">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <stat.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</div>
              <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Design Philosophy */}
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Design Philosophy</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            This project explores how to design a professional sports prediction platform that's both visually polished and functionally complete.
            We focus on user experience patterns, state management, and data visualization for prediction platforms.
          </p>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            The frontend integrates with real football APIs where possible, with graceful fallbacks to mock data. Features are categorized as <strong>live</strong> (real data) or <strong>demo</strong> (simulated for showcase).
          </p>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Authentication and premium upgrades are demo-only — designed to showcase how those flows would look in a production app.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Real API Integration', value: '✓', sub: 'Football data', color: 'from-blue-500 to-indigo-600' },
            { label: 'Demo Features', value: '✓', sub: 'Premium, auth', color: 'from-emerald-500 to-green-600' },
            { label: 'Responsive Design', value: '✓', sub: 'Mobile-first', color: 'from-purple-500 to-violet-600' },
            { label: 'Dark Mode', value: '✓', sub: 'Full support', color: 'from-amber-500 to-orange-600' },
          ].map(item => (
            <div key={item.label} className={`bg-gradient-to-br ${item.color} rounded-2xl p-5 text-white`}>
              <div className="text-3xl font-black mb-1">{item.value}</div>
              <div className="text-sm font-semibold">{item.label}</div>
              <div className="text-xs text-white/70 mt-0.5">{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How This Demo Works */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center">How This Demo Works</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              title: 'Live Predictions',
              desc: 'Dashboard & prediction lists fetch real football data from APIs. When APIs are unavailable, mock data provides a seamless fallback.',
              color: 'bg-blue-500',
            },
            {
              step: '02',
              title: 'Demo Features',
              desc: 'Login creates a session (no real database). Premium upgrades are simulated. Contact form doesn\'t send emails.',
              color: 'bg-indigo-500',
            },
            {
              step: '03',
              title: 'Data Transparency',
              desc: 'Predictions marked "Live API" use real data. Others use mock results to showcase how the UI adapts to different data sources.',
              color: 'bg-violet-500',
            },
          ].map(step => (
            <div key={step.step} className="flex flex-col gap-4">
              <div className={`w-12 h-12 ${step.color} rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg`}>
                {step.step}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{step.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center">Meet the Team</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TEAM_MEMBERS.map(member => (
            <Card key={member.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-5 text-center">
                <div className="text-4xl mb-3">{member.avatar}</div>
                <h3 className="font-bold text-slate-900 dark:text-white">{member.name}</h3>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-2">{member.role}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">{member.bio}</p>
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-center">
                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{member.winRate}</div>
                    <div className="text-xs text-slate-400">Win Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{member.predictions.toLocaleString()}</div>
                    <div className="text-xs text-slate-400">Picks</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Key Features */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center">Built With</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: Shield, title: 'Type Safety', desc: 'Full TypeScript implementation with strict typing throughout.' },
            { icon: TrendingUp, title: 'API Integration', desc: 'Real-time data from football APIs with proper error handling.' },
            { icon: Users, title: 'Responsive Design', desc: 'Mobile-first approach with dark mode and accessibility.' },
          ].map(val => (
            <Card key={val.title}>
              <CardContent className="p-5 flex gap-4 items-start">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center shrink-0">
                  <val.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{val.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{val.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-none text-white">
        <CardContent className="p-8 text-center">
          <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Explore the Demo</h2>
          <p className="text-slate-300 mb-6 max-w-md mx-auto">See how a sports prediction platform works. All authentication is session-only.</p>
          <div className="flex gap-3 justify-center">
            <Button variant="premium" size="lg" onClick={() => navigate('/premium')}>
              View Premium Flow <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10" onClick={() => navigate('/predictions')}>
              Browse Predictions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
