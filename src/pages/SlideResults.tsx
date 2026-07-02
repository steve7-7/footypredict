import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_RESULTS, STATS } from '../data/mockData';
import { Card, CardContent, Badge, Button } from '../components/ui';
import { format } from 'date-fns';
import {
  TrendingUp, CheckCircle2, XCircle, BarChart3, Filter,
  ChevronLeft, ChevronRight, RefreshCw, Wifi, WifiOff,
  Copy, Code, Check, Database, FileJson, AlertTriangle,
  Server, Globe, Key
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getPreviousResults, normalizeBetigoloResult } from '../services/betigoloApi';

type ResultT = typeof MOCK_RESULTS[number] & { source?: 'mock' | 'betigolo-api' };

export function SlideResults() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [slide, setSlide] = useState(0);
  const [filter, setFilter] = useState<'all' | 'win' | 'loss'>('all');
  const [activeSection, setActiveSection] = useState<'slideshow' | 'table' | 'raw_api'>('slideshow');

  const [liveResults, setLiveResults] = useState<ResultT[]>([]);
  const [rawApiResponse, setRawApiResponse] = useState<any>(null);
  const [apiDebug, setApiDebug] = useState<any>(null);
  const [loadingLive, setLoadingLive] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [usingLive, setUsingLive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const baseResults: ResultT[] = usingLive && liveResults.length > 0 ? liveResults : MOCK_RESULTS;

  const filteredResults = baseResults.filter(r => {
    if (filter === 'win') return r.outcome === 'win';
    if (filter === 'loss') return r.outcome === 'loss';
    return true;
  });

  const totalWins = baseResults.filter(r => r.outcome === 'win').length;
  const totalLosses = baseResults.filter(r => r.outcome === 'loss').length;
  const totalProfit = baseResults.reduce((sum, r) => sum + parseFloat(r.profit), 0);
  const winRate = baseResults.length > 0 ? Math.round((totalWins / baseResults.length) * 100) : 0;

  const loadLiveResults = async (auto = false) => {
    if (user?.plan !== 'premium') return;
    if (!auto) setLoadingLive(true);
    setApiError(false);
    setErrorMsg(null);
    try {
      const res = await getPreviousResults();
      if (res.rawResponse) {
        setRawApiResponse(res.rawResponse);
      }
      if (res.debug) {
        setApiDebug(res.debug);
      }
      if (res.data && res.data.length > 0) {
        const normalized = res.data.slice(0, 12).map((r, i) => normalizeBetigoloResult(r, i));
        setLiveResults(normalized);
        setUsingLive(true);
        setSlide(0);
      } else {
        setApiError(true);
        if (res.error) setErrorMsg(res.error);
      }
    } catch (e: any) {
      setApiError(true);
      setErrorMsg(e?.message || 'Network error');
    } finally {
      if (!auto) setLoadingLive(false);
    }
  };

  const resetToMock = () => {
    setUsingLive(false);
    setLiveResults([]);
    setRawApiResponse(null);
    setApiDebug(null);
    setSlide(0);
    setFilter('all');
  };

  useEffect(() => {
    if (user?.plan === 'premium' && !usingLive) {
      loadLiveResults(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.plan]);

  useEffect(() => {
    if (activeSection !== 'slideshow') return;
    const timer = setInterval(() => {
      setSlide(s => (s + 1) % Math.max(filteredResults.length, 1));
    }, 3800);
    return () => clearInterval(timer);
  }, [filteredResults.length, activeSection]);

  const current = filteredResults[slide] || filteredResults[0];
  const prev = () => setSlide(s => (s - 1 + filteredResults.length) % filteredResults.length);
  const next = () => setSlide(s => (s + 1) % filteredResults.length);
  const canUseLive = user?.plan === 'premium';

  const copyJson = () => {
    if (!rawApiResponse) return;
    navigator.clipboard.writeText(JSON.stringify(rawApiResponse, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const jsonSize = rawApiResponse ? new Blob([JSON.stringify(rawApiResponse)]).size : 0;
  const jsonSizeKb = jsonSize ? (jsonSize / 1024).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Results &amp; Performance</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {usingLive ? 'Showing live previous results from Betigolo API' : 'Track our verified prediction history'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['slideshow', 'table', 'raw_api'] as const).map(tab => (
            <Button
              key={tab}
              variant={activeSection === tab ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveSection(tab)}
              className="flex items-center gap-1.5"
            >
              {tab === 'slideshow' && 'Slideshow'}
              {tab === 'table' && 'Full Table'}
              {tab === 'raw_api' && <><Code className="w-3.5 h-3.5" /> API Response</>}
            </Button>
          ))}
        </div>
      </div>

      {/* API Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        {canUseLive && (
          <Button
            variant="premium"
            size="sm"
            onClick={() => loadLiveResults(false)}
            disabled={loadingLive}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loadingLive ? 'animate-spin' : ''}`} />
            {loadingLive ? 'Loading Live Results...' : 'Load Live Results (Betigolo API)'}
          </Button>
        )}
        {usingLive && (
          <Button variant="outline" size="sm" onClick={resetToMock}>
            Back to Mock Data
          </Button>
        )}
        {!canUseLive && (
          <div className="flex items-center gap-2 text-sm bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800">
            <span>🔒 Live results from Betigolo API are Premium only</span>
            <Button variant="premium" size="sm" onClick={() => navigate('/premium')}>Upgrade</Button>
          </div>
        )}
      </div>

      {/* Status Banner */}
      {canUseLive && activeSection !== 'raw_api' && (
        <div className={`text-sm px-4 py-2.5 rounded-lg flex items-center gap-2 ${usingLive ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : apiError ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
          {usingLive ? (
            <><Wifi className="w-4 h-4" /> Connected to Betigolo Predictions API — showing real previous results</>
          ) : apiError ? (
            <><WifiOff className="w-4 h-4" /> Could not fetch from Betigolo API{errorMsg ? `: ${errorMsg}` : ''}. Using demo results.</>
          ) : (
            <>Premium users can pull verified historical results from Betigolo API.</>
          )}
        </div>
      )}

      {/* Stats Row */}
      {activeSection !== 'raw_api' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Win Rate', value: `${winRate}%`, icon: BarChart3, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Total Wins', value: totalWins, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
            { label: 'Total Losses', value: totalLosses, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
            { label: 'Total Profit', value: `${totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)} U`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          ].map(stat => (
            <Card key={stat.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeSection === 'slideshow' ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            {(['all', 'win', 'loss'] as const).map(f => (
              <button
                key={f}
                onClick={() => { setFilter(f); setSlide(0); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${filter === f ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                {f === 'all' ? 'All Results' : f === 'win' ? '✅ Wins' : '❌ Losses'}
              </button>
            ))}
          </div>

          {current && (
            <div className="relative">
              <Card className={`overflow-hidden border-2 transition-all duration-300 ${current.outcome === 'win' ? 'border-green-300 dark:border-green-700' : 'border-red-300 dark:border-red-700'}`}>
                <div className={`px-6 py-3 text-sm font-semibold flex items-center gap-2 ${current.outcome === 'win' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
                  {current.outcome === 'win' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {current.outcome === 'win' ? 'WIN' : 'LOSS'} — {current.league}
                  {(current as any).source === 'betigolo-api' && <Badge variant="premium" className="ml-2">LIVE API</Badge>}
                  <span className="ml-auto text-slate-500 dark:text-slate-400 font-normal">{format(new Date(current.date), 'MMM d, yyyy')}</span>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <img src={current.homeLogo} alt={current.homeTeam} className="w-16 h-16 object-contain" onError={e => { e.currentTarget.style.display = 'none'; }} />
                      <span className="font-semibold text-center">{current.homeTeam}</span>
                    </div>
                    <div className="px-6 text-center">
                      <div className="text-4xl font-black text-slate-900 dark:text-white">
                        {current.homeScore} <span className="text-slate-400">-</span> {current.awayScore}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">Full Time</div>
                    </div>
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <img src={current.awayLogo} alt={current.awayTeam} className="w-16 h-16 object-contain" onError={e => { e.currentTarget.style.display = 'none'; }} />
                      <span className="font-semibold text-center">{current.awayTeam}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <div className="text-center">
                      <p className="text-xs text-slate-500 mb-1">Our Pick</p>
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{current.prediction}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500 mb-1">Odds</p>
                      <p className="font-semibold text-sm">{current.odds}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500 mb-1">P/L</p>
                      <p className={`font-bold text-sm ${current.outcome === 'win' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {current.profit} U
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex gap-2 items-center">
                      {current.isPremium ? <Badge variant="premium">Premium Pick</Badge> : <Badge variant="success">Free Pick</Badge>}
                      <span className="text-xs text-slate-500">Confidence: {current.confidence}%</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {filteredResults.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setSlide(i)}
                          className={`rounded-full transition-all ${i === slide ? 'w-6 h-2 bg-blue-600' : 'w-2 h-2 bg-slate-300 dark:bg-slate-600'}`}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <button onClick={prev} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-8 h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={next} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-8 h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : activeSection === 'table' ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Match</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">League</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Prediction</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Score</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Odds</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">P/L</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {baseResults.map(result => (
                  <tr key={result.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img src={result.homeLogo} className="w-5 h-5 object-contain" onError={e => { e.currentTarget.style.display = 'none'; }} />
                        <span className="font-medium text-slate-800 dark:text-slate-200">{result.homeTeam} vs {result.awayTeam}</span>
                        <img src={result.awayLogo} className="w-5 h-5 object-contain" onError={e => { e.currentTarget.style.display = 'none'; }} />
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{format(new Date(result.date), 'MMM d, yyyy')}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{result.league}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{result.prediction}</span>
                      {(result as any).source === 'betigolo-api' && <Badge variant="premium" className="ml-2">LIVE</Badge>}
                      {result.isPremium && user?.plan !== 'premium' && (
                        <Badge variant="premium" className="ml-2">PRO</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-900 dark:text-white">{result.homeScore} - {result.awayScore}</td>
                    <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-300">{result.odds}</td>
                    <td className={`px-4 py-3 text-center font-semibold ${result.outcome === 'win' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {result.profit} U
                    </td>
                    <td className="px-4 py-3 text-center">
                      {result.outcome === 'win'
                        ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><CheckCircle2 className="w-3 h-3" /> WIN</span>
                        : <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"><XCircle className="w-3 h-3" /> LOSS</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* ---------- API Response Inspector ---------- */
        <div className="space-y-4">
          <Card className="border-2 border-blue-200 dark:border-blue-900 bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-900 dark:to-blue-950/30">
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow">
                    <FileJson className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Betigolo API – Live Response Inspector</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      GET https://betigolo-predictions.p.rapidapi.com/sample
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {rawApiResponse && (
                    <Button size="sm" variant="outline" onClick={copyJson} className="h-8 text-xs">
                      {copied ? <><Check className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />Copied</> : <><Copy className="w-3.5 h-3.5 mr-1.5" />Copy JSON</>}
                    </Button>
                  )}
                  {canUseLive && (
                    <Button size="sm" onClick={() => loadLiveResults(false)} disabled={loadingLive}>
                      <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingLive ? 'animate-spin' : ''}`} />
                      {loadingLive ? 'Fetching…' : 'Re-fetch'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Request metadata strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-[11px]">
                {[
                  { label: 'Host', icon: Globe, value: 'betigolo-predictions.p.rapidapi.com' },
                  { label: 'Endpoint', icon: Server, value: '/sample' },
                  { label: 'Method', icon: Code, value: 'GET' },
                  { label: 'Auth', icon: Key, value: 'x-rapidapi-key' },
                ].map(m => (
                  <div key={m.label} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2">
                    <div className="text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1">{<m.icon className="w-3 h-3" />}{m.label}</div>
                    <div className="text-slate-700 dark:text-slate-300 font-mono mt-0.5 truncate">{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Status / error box */}
              {loadingLive ? (
                <div className="text-center py-14 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Fetching live JSON from Betigolo / RapidAPI…</p>
                  <p className="text-xs text-slate-400 mt-1">Trying: direct → corsproxy.io → codetabs → thingproxy</p>
                </div>
              ) : rawApiResponse ? (
                <div className="space-y-3">
                  {/* Response header info */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> HTTP 200 OK
                    </span>
                    <span className="text-slate-500">Size: {jsonSizeKb} KB</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-500">
                      {Array.isArray(rawApiResponse) ? `${rawApiResponse.length} items` 
                        : Array.isArray((rawApiResponse as any)?.data) ? `${(rawApiResponse as any).data.length} items (data[])`
                        : 'object response'
                      }
                    </span>
                    {apiDebug?.proxy && (
                      <>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-500">via {apiDebug.proxy}</span>
                      </>
                    )}
                  </div>

                  {/* Pretty JSON with line numbers effect */}
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#0b1220] shadow-2xl">
                    <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-mono flex items-center gap-2">
                        <Database className="w-3.5 h-3.5 text-blue-400" />
                        response.json
                      </span>
                      <span className="text-slate-500">application/json • UTF-8</span>
                    </div>
                    <div className="max-h-[560px] overflow-auto p-4 text-[11.5px] leading-relaxed">
                      <pre className="text-emerald-300 font-mono whitespace-pre-wrap break-words">
                        {JSON.stringify(rawApiResponse, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between flex-wrap gap-2">
                    <span>Raw unparsed response from RapidAPI • Betigolo Predictions</span>
                    <span>Tip: use the Copy JSON button to export</span>
                  </div>
                </div>
              ) : apiError ? (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                    <div className="space-y-2 text-sm flex-1 min-w-0">
                      <p className="font-bold text-amber-900 dark:text-amber-300">Could not reach Betigolo API from the browser</p>
                      <p className="text-amber-800 dark:text-amber-400 text-xs leading-relaxed">
                        RapidAPI blocks CORS requests from browsers. We tried multiple public CORS proxies
                        (corsproxy.io → codetabs → thingproxy → allorigins). All failed or returned non-JSON.
                      </p>
                      {errorMsg && (
                        <div className="bg-amber-100/80 dark:bg-amber-900/40 rounded-lg p-3 font-mono text-[11px] text-amber-900 dark:text-amber-200 break-words">
                          {errorMsg}
                        </div>
                      )}
                      <div className="text-xs text-amber-700 dark:text-amber-400 pt-1">
                        <strong>To get real data:</strong> run this from your terminal (works perfectly):
                        <pre className="bg-slate-900 text-emerald-300 rounded-md p-3 mt-2 overflow-x-auto text-[11px]">{`curl --request GET \\
  --url https://betigolo-predictions.p.rapidapi.com/sample \\
  --header 'x-rapidapi-host: betigolo-predictions.p.rapidapi.com' \\
  --header 'x-rapidapi-key: b9c6883414msh11dde2eba098703p1a13fdjsne11249e78db1'`}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-10 text-center space-y-3">
                  <Server className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">No API response captured yet</p>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">
                    Click “Load Live Results” to fetch from <code className="text-pink-600 dark:text-pink-400">betigolo-predictions.p.rapidapi.com/sample</code>.
                    Premium membership required.
                  </p>
                  {canUseLive ? (
                    <Button variant="premium" size="sm" onClick={() => loadLiveResults(false)}>
                      Fetch Live API Response
                    </Button>
                  ) : (
                    <Button variant="premium" size="sm" onClick={() => setActiveTab('premium')}>Upgrade to Premium</Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Parsed preview table if we have data */}
          {rawApiResponse && Array.isArray(
            Array.isArray(rawApiResponse) ? rawApiResponse : rawApiResponse.data || rawApiResponse.results || []
          ) && (
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-500" />
                  Parsed Records Preview
                </h3>
                <div className="overflow-x-auto text-xs">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                      <tr className="text-[11px] text-slate-500 uppercase">
                        <th className="text-left px-3 py-2">#</th>
                        <th className="text-left px-3 py-2">Home</th>
                        <th className="text-left px-3 py-2">Away</th>
                        <th className="text-left px-3 py-2">Keys in object</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {(Array.isArray(rawApiResponse) ? rawApiResponse : rawApiResponse.data || rawApiResponse.results || []).slice(0, 8).map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-3 py-2 text-slate-500">{i+1}</td>
                          <td className="px-3 py-2 text-slate-800 dark:text-slate-200">{row.home_team || row.home || row.homeTeam || '—'}</td>
                          <td className="px-3 py-2 text-slate-800 dark:text-slate-200">{row.away_team || row.away || row.awayTeam || '—'}</td>
                          <td className="px-3 py-2 text-slate-500 text-[10px]">{Object.keys(row).join(', ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* CTA for free users */}
      {user?.plan !== 'premium' && activeSection !== 'raw_api' && (
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 border-none text-white">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg mb-1">See All Premium Results</h3>
              <p className="text-blue-100 text-sm">Our premium picks have an {STATS.premiumWinRate}% win rate. Unlock the full history from Betigolo API.</p>
            </div>
            <Button variant="secondary" onClick={() => navigate('/premium')} className="shrink-0">
              Upgrade Now
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
