// Betigolo Predictions API - Previous Results endpoint
//
// Preferred path: the Vercel serverless function api/betigolo-sample.ts (key
// stays server-side). Falls back to the legacy CORS-proxy path only when the
// serverless function is unreachable AND an optional VITE_RAPIDAPI_KEY is set
// for local development.

import { corsFetch } from './apiClient';

const API_HOST = 'betigolo-predictions.p.rapidapi.com';
const BASE_URL = 'https://betigolo-predictions.p.rapidapi.com';

// Optional client-side fallback key for local development only.
// Prefer setting RAPIDAPI_KEY as a server-side env var in Vercel instead.
const API_KEY = import.meta.env.VITE_RAPIDAPI_KEY || '';

export interface BetigoloResult {
  id?: string | number;
  home_team?: string;
  away_team?: string;
  home?: string;
  away?: string;
  home_score?: number;
  away_score?: number;
  score_home?: number;
  score_away?: number;
  result?: string;
  prediction?: string;
  pick?: string;
  date?: string;
  match_date?: string;
  league?: string;
  competition?: string;
  odds?: number | string;
  confidence?: number | string;
  status?: string;
  [key: string]: any;
}

const commonHeaders = {
  'x-rapidapi-key': API_KEY,
  'x-rapidapi-host': API_HOST,
};

/**
 * Fetches previous results from Betigolo sample endpoint.
 * Returns raw response body for debugging / inspection UI.
 */
export async function getPreviousResults(): Promise<{
  data: BetigoloResult[] | null;
  rawResponse: any;
  rawText?: string;
  usedProxy?: string;
  error: string | null;
  status?: number;
  endpoint: string;
  debug?: any;
}> {
  const endpoint = `${BASE_URL}/sample`;

  // 1) Serverless path (key stays server-side)
  let res: {
    data: any;
    rawText?: string;
    error: string | null;
    proxy?: string;
    status?: number;
  } | null = null;
  let serverlessReached = false;

  try {
    const response = await fetch('/api/betigolo-sample', {
      headers: { Accept: 'application/json' },
    });
    const text = await response.text();
    let parsed: any;
    let isJson = false;
    try {
      parsed = JSON.parse(text);
      isJson = true;
    } catch {
      parsed = text;
    }
    serverlessReached = true;

    // Non-JSON body means the serverless function isn't actually deployed
    // (e.g. Vite SPA fallback or served source in dev) — treat as unavailable.
    if (!isJson) {
      res = null;
    } else if (!response.ok) {
      res = {
        data: null,
        rawText: text,
        error: parsed?.error || `Serverless endpoint returned HTTP ${response.status}`,
        proxy: 'serverless',
        status: response.status,
      };
    } else {
      res = {
        data: parsed,
        rawText: text,
        error: null,
        proxy: 'serverless',
        status: response.status,
      };
    }
  } catch {
    // Serverless unavailable — fall through to legacy path below.
  }

  // 2) Legacy CORS-proxy fallback (local dev only, requires VITE_RAPIDAPI_KEY)
  if (!res && API_KEY) {
    const legacy = await corsFetch<any>(endpoint, { headers: commonHeaders });
    res = {
      data: legacy.data,
      rawText: legacy.rawText,
      error: legacy.error,
      proxy: legacy.proxy,
      status: legacy.status,
    };
  }

  if (!res) {
    return {
      data: null,
      rawResponse: null,
      rawText: undefined,
      usedProxy: 'none',
      error:
        'No serverless API available and no fallback key configured. Set RAPIDAPI_KEY in Vercel (or VITE_RAPIDAPI_KEY for local dev).',
      status: undefined,
      endpoint,
      debug: { serverlessReached },
    };
  }

  const rawText = res.rawText ?? undefined;
  const debug = {
    proxy: res.proxy,
    status: res.status,
    endpoint,
    serverlessReached,
  };

  if (!res.data) {
    return {
      data: null,
      rawResponse: rawText || null,
      rawText,
      usedProxy: res.proxy,
      error: res.error || 'No data received',
      status: res.status,
      endpoint,
      debug,
    };
  }

  // Try multiple shapes - be very permissive
  let arr: BetigoloResult[] = [];
  if (Array.isArray(res.data)) arr = res.data;
  else if (Array.isArray(res.data?.data)) arr = res.data.data;
  else if (Array.isArray(res.data?.results)) arr = res.data.results;
  else if (Array.isArray(res.data?.matches)) arr = res.data.matches;
  else if (Array.isArray(res.data?.sample)) arr = res.data.sample;
  else if (Array.isArray(res.data?.predictions)) arr = res.data.predictions;
  else if (typeof res.data === 'object') {
    const firstArray = Object.values(res.data).find((v) => Array.isArray(v));
    if (firstArray) arr = firstArray as BetigoloResult[];
  }

  return {
    data: arr,
    rawResponse: res.data,
    rawText,
    usedProxy: res.proxy,
    error:
      arr.length === 0
        ? 'API returned valid JSON but no prediction array was found. Showing raw response instead.'
        : null,
    status: res.status,
    endpoint,
    debug,
  };
}

export function normalizeBetigoloResult(r: BetigoloResult, index: number) {
  const homeTeam = r.home_team || r.home || 'Home Team';
  const awayTeam = r.away_team || r.away || 'Away Team';

  const homeScore = Number(r.home_score ?? r.score_home ?? 0);
  const awayScore = Number(r.away_score ?? r.score_away ?? 0);

  const prediction = r.prediction || r.pick || 'Match Result';
  const odds = String(r.odds ?? '1.80');
  const confidence =
    typeof r.confidence === 'number'
      ? r.confidence
      : Math.round(70 + (index % 5) * 3);

  let outcome: 'win' | 'loss' | 'push' = 'push';
  const rawResult = (r.result || '').toString().toLowerCase();

  if (rawResult.includes('win') || rawResult === '1' || rawResult === 'home') {
    outcome = 'win';
  } else if (
    rawResult.includes('loss') ||
    rawResult === '2' ||
    rawResult === 'away'
  ) {
    outcome = 'loss';
  } else if (
    homeScore > awayScore &&
    (prediction.toLowerCase().includes('home') ||
      prediction.toLowerCase().includes('win'))
  ) {
    outcome = 'win';
  } else if (
    awayScore > homeScore &&
    (prediction.toLowerCase().includes('away') ||
      prediction.toLowerCase().includes('win'))
  ) {
    outcome = 'win';
  } else if (homeScore === awayScore && prediction.toLowerCase().includes('draw')) {
    outcome = 'win';
  } else {
    outcome = homeScore >= awayScore ? 'win' : 'loss';
  }

  const profit =
    outcome === 'win' ? `+${(parseFloat(odds) - 1).toFixed(2)}` : '-1.00';

  const league = r.league || r.competition || 'Previous Matches';
  const date =
    r.date ||
    r.match_date ||
    new Date(Date.now() - (index + 1) * 86400000 * 2).toISOString();

  return {
    id: `betigolo-${r.id || index}`,
    homeTeam,
    awayTeam,
    homeLogo: `https://ui-avatars.com/api/?name=${encodeURIComponent(homeTeam)}&bold=true&background=334155&color=fff&size=64`,
    awayLogo: `https://ui-avatars.com/api/?name=${encodeURIComponent(awayTeam)}&bold=true&background=475569&color=fff&size=64`,
    league,
    date,
    prediction,
    odds,
    confidence: Math.max(55, Math.min(95, confidence)),
    isPremium: true,
    homeScore,
    awayScore,
    outcome,
    profit,
    source: 'betigolo-api' as const,
  };
}
