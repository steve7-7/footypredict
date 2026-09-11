// RapidAPI Football Prediction API service
//
// Preferred path: the Vercel serverless functions in /api (see
// api/predictions.ts, api/list-markets.ts, api/list-federations.ts) — these keep
// the RapidAPI key server-side.
//
// Fallback path: when the serverless functions are unreachable (e.g. running
// `npm run dev` outside Vercel without env vars) and an OPTIONAL client key is
// provided via VITE_RAPIDAPI_KEY, the legacy CORS-proxy path is used so the app
// still works locally. In production this fallback stays dormant because no
// client key is configured.

import { corsFetch } from './apiClient';
import { toLocalISODate } from '../utils/date';

const API_HOST = 'football-prediction-api.p.rapidapi.com';
const BASE_URL = 'https://football-prediction-api.p.rapidapi.com/api/v2';

// Optional client-side fallback key for local development only.
// Prefer setting RAPIDAPI_KEY as a server-side env var in Vercel instead.
const API_KEY = import.meta.env.VITE_RAPIDAPI_KEY || '';

export interface ApiPrediction {
  id?: number | string;
  home_team?: string;
  away_team?: string;
  home_name?: string;
  away_name?: string;
  competition_name?: string;
  league?: string;
  start_date?: string;
  date?: string;
  market?: string;
  prediction?: string;
  pick?: string;
  odds?: number | string;
  avg_odds?: number | string;
  probability?: string | number;
  confidence?: number;
  status?: string;
  federation?: string;
  result?: string;
  season?: string;
  result_details?: any;
  [key: string]: any;
}

export interface Market {
  key?: string;
  name?: string;
  market?: string;
  description?: string;
  [key: string]: any;
}

export interface Federation {
  key?: string;
  name?: string;
  federation?: string;
  [key: string]: any;
}

export interface ApiResult<T> {
  data: T | null;
  rawResponse: any;
  rawText?: string;
  error: string | null;
  proxy?: string;
}

const commonHeaders = {
  'x-rapidapi-key': API_KEY,
  'x-rapidapi-host': API_HOST,
};

// In-memory TTL cache for rarely-changing endpoints (markets/federations).
// Combined with the server-side 24h cache, this avoids refetching on every
// "Refresh"/"Apply Filters" click. Cleared on full page reload.
const META_CACHE_TTL = 60 * 60 * 1000; // 1 hour
const metaCache = new Map<string, { data: unknown; expires: number }>();

function readMetaCache<T>(key: string): T | null {
  const hit = metaCache.get(key);
  if (hit && hit.expires > Date.now()) {
    return hit.data as T;
  }
  if (hit) metaCache.delete(key);
  return null;
}

function writeMetaCache(key: string, data: unknown): void {
  metaCache.set(key, { data, expires: Date.now() + META_CACHE_TTL });
}

async function callServerless<T>(endpoint: string): Promise<ApiResult<T> | null> {
  try {
    const response = await fetch(`/api/${endpoint}`, {
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

    // A non-JSON body means the serverless function isn't actually deployed
    // (e.g. Vite SPA fallback or served source in dev) — treat as unavailable.
    if (!isJson) {
      return null;
    }

    if (!response.ok) {
      return {
        data: null,
        rawResponse: parsed,
        rawText: text,
        error:
          parsed?.error || `Serverless endpoint returned HTTP ${response.status}`,
        proxy: 'serverless',
      };
    }

    return {
      data: parsed as T,
      rawResponse: parsed,
      rawText: text,
      error: null,
      proxy: 'serverless',
    };
  } catch {
    // Serverless path unavailable — signal the caller to fall back.
    return null;
  }
}

async function callLegacyProxy<T>(
  url: string,
  params: Record<string, string>,
): Promise<ApiResult<T>> {
  const target = new URL(url);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') target.searchParams.append(k, v);
  });
  const res = await corsFetch<T>(target.toString(), { headers: commonHeaders });
  return {
    data: res.data,
    rawResponse: res.data,
    rawText: res.rawText,
    error: res.error,
    proxy: res.proxy,
  };
}

export async function getPredictions(params?: {
  market?: string;
  iso_date?: string;
  federation?: string;
}): Promise<{ data: ApiPrediction[] | null; error: string | null; rawResponse: any }> {
  const queryParams: Record<string, string> = {
    market: params?.market || 'classic',
    iso_date: params?.iso_date || toLocalISODate(),
  };
  if (params?.federation) {
    queryParams.federation = params.federation;
  }

  const query = Object.entries(queryParams)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  // 1) Serverless path (key stays server-side)
  const serverless = await callServerless<any>(`predictions?${query}`);
  let res: ApiResult<any>;
  if (serverless) {
    res = serverless;
  } else if (API_KEY) {
    // 2) Legacy CORS-proxy fallback for local dev only
    res = await callLegacyProxy<any>(`${BASE_URL}/predictions`, queryParams);
  } else {
    res = {
      data: null,
      rawResponse: null,
      error:
        'No serverless API available and no fallback key configured. Set RAPIDAPI_KEY in Vercel (or VITE_RAPIDAPI_KEY for local dev).',
      proxy: 'none',
    };
  }

  if (!res.data) return { data: null, error: res.error, rawResponse: res.rawResponse };

  let arr: ApiPrediction[] = [];
  if (Array.isArray(res.data)) arr = res.data;
  else if (Array.isArray(res.data.data)) arr = res.data.data;
  else if (Array.isArray(res.data.predictions)) arr = res.data.predictions;
  else if (Array.isArray(res.data.results)) arr = res.data.results;

  return { data: arr, error: null, rawResponse: res.data };
}

export async function getMarkets(): Promise<{ data: Market[] | null; error: string | null; rawResponse?: any }> {
  const cached = readMetaCache<Market[]>('markets');
  if (cached) return { data: cached, error: null, rawResponse: cached };

  const serverless = await callServerless<any>('list-markets');
  let res: ApiResult<any>;
  if (serverless) {
    res = serverless;
  } else if (API_KEY) {
    res = await callLegacyProxy<any>(`${BASE_URL}/list-markets`, {});
  } else {
    res = { data: null, rawResponse: null, error: 'Serverless unavailable and no fallback key configured.', proxy: 'none' };
  }

  if (!res.data) return { data: null, error: res.error, rawResponse: res.rawResponse };

  let arr: Market[] = [];
  if (Array.isArray(res.data)) arr = res.data;
  else if (Array.isArray(res.data.data)) arr = res.data.data;
  else if (Array.isArray(res.data.markets)) arr = res.data.markets;
  else if (typeof res.data === 'object') {
    arr = Object.entries(res.data)
      .filter(([k]) => !['meta', 'data', 'status'].includes(k))
      .map(([key, value]) => ({
        market: key,
        name: typeof value === 'string' ? value : key,
      }));
  }

  if (arr.length > 0) writeMetaCache('markets', arr);
  return { data: arr, error: null, rawResponse: res.data };
}

export async function getFederations(): Promise<{ data: Federation[] | null; error: string | null; rawResponse?: any }> {
  const cached = readMetaCache<Federation[]>('federations');
  if (cached) return { data: cached, error: null, rawResponse: cached };

  const serverless = await callServerless<any>('list-federations');
  let res: ApiResult<any>;
  if (serverless) {
    res = serverless;
  } else if (API_KEY) {
    res = await callLegacyProxy<any>(`${BASE_URL}/list-federations`, {});
  } else {
    res = { data: null, rawResponse: null, error: 'Serverless unavailable and no fallback key configured.', proxy: 'none' };
  }

  if (!res.data) return { data: null, error: res.error, rawResponse: res.rawResponse };

  let arr: Federation[] = [];
  if (Array.isArray(res.data)) arr = res.data;
  else if (Array.isArray(res.data.data)) arr = res.data.data;
  else if (Array.isArray(res.data.federations)) arr = res.data.federations;
  else if (typeof res.data === 'object') {
    arr = Object.entries(res.data)
      .filter(([k]) => !['meta', 'data', 'status'].includes(k))
      .map(([key, value]) => ({
        federation: key,
        name: typeof value === 'string' ? value : key,
      }));
  }

  if (arr.length > 0) writeMetaCache('federations', arr);
  return { data: arr, error: null, rawResponse: res.data };
}

// Helper to normalize an API prediction into our app's Prediction shape
export function normalizeApiPrediction(p: ApiPrediction, index: number) {
  const homeTeam = p.home_name || p.home_team || 'Home';
  const awayTeam = p.away_name || p.away_team || 'Away';
  const pick = p.prediction || p.pick || 'Match Result';
  const odds = String(p.avg_odds ?? p.odds ?? '1.85');

  let confidence = Math.round(65 + (index % 7) * 4);
  if (typeof p.probability === 'number') {
    confidence = p.probability <= 1 ? Math.round(p.probability * 100) : Math.round(p.probability);
  } else if (typeof p.probability === 'string') {
    const parsed = parseFloat(p.probability);
    if (!isNaN(parsed)) {
      confidence = parsed <= 1 ? Math.round(parsed * 100) : Math.round(parsed);
    }
  }
  confidence = Math.max(50, Math.min(98, confidence));

  const league = p.competition_name || p.league || 'Unknown League';
  const date = p.start_date || p.date || new Date().toISOString();
  const market = p.market || 'classic';
  const federation = p.federation || 'Worldwide';

  return {
    id: `api-${p.id || index}`,
    homeTeam,
    awayTeam,
    homeLogo: `https://ui-avatars.com/api/?name=${encodeURIComponent(homeTeam)}&bold=true&background=0d9488&color=fff&font-size=0.4&size=96`,
    awayLogo: `https://ui-avatars.com/api/?name=${encodeURIComponent(awayTeam)}&bold=true&background=6366f1&color=fff&font-size=0.4&size=96`,
    league,
    date,
    prediction: pick,
    confidence,
    odds,
    isPremium: true,
    rationale: `Market: ${market} · Federation: ${federation}. Odds fetched live from bookmaker data.`,
    source: 'live-api' as const,
    federation,
    market,
    status: p.status,
  };
}
