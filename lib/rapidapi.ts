/**
 * Shared server-side RapidAPI helper for Vercel functions.
 *
 * Why this exists: RapidAPI keys must never ship to the browser. These functions
 * read the key from `process.env.RAPIDAPI_KEY` (fallback `PREDICTIONS_KEY`) and
 * add the same caching, in-flight deduplication and retry/backoff behaviour that
 * `api/betigolo-history.ts` originally introduced.
 */

interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
}

interface PendingRequest {
  promise: Promise<unknown>;
}

const cache = new Map<string, CacheEntry>();
const pendingRequests = new Map<string, PendingRequest>();

const DEFAULT_TTL = 10 * 60 * 1000; // 10 minutes
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Reads the RapidAPI key from server-side env only. */
export function rapidApiKey(): string | null {
  return process.env.RAPIDAPI_KEY || process.env.PREDICTIONS_KEY || null;
}

/** Local-timezone YYYY-MM-DD, used as a fallback when the client omits a date. */
export function localISODate(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        const retryAfter = response.headers.get("retry-after");
        const waitTime = retryAfter
          ? parseInt(retryAfter) * 1000
          : Math.pow(2, attempt + 1) * 1000;
        if (attempt < maxRetries - 1) {
          await sleep(waitTime);
          continue;
        }
      }

      return response;
    } catch (error) {
      if (attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt + 1) * 1000;
        console.warn(`Fetch failed, retrying in ${waitTime}ms:`, error);
        await sleep(waitTime);
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

export interface RapidGetOptions {
  /** RapidAPI host, e.g. "football-prediction-api.p.rapidapi.com" */
  host: string;
  /** URL path, e.g. "/api/v2/predictions" */
  path: string;
  /** Query parameters forwarded to RapidAPI */
  query?: Record<string, string | string[] | undefined>;
  /** Cache key — include query values that change the response */
  cacheKey: string;
  /** Cache TTL in ms (default 10 minutes) */
  ttl?: number;
  maxRetries?: number;
}

/**
 * Performs a cached, deduplicated GET against RapidAPI.
 * Returns `{ status, body }` so the caller can forward both to the client.
 */
export async function rapidGet(
  opts: RapidGetOptions,
): Promise<{ status: number; body: unknown }> {
  const ttl = opts.ttl ?? DEFAULT_TTL;

  const cached = cache.get(opts.cacheKey);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return { status: 200, body: cached.data };
  }

  const pending = pendingRequests.get(opts.cacheKey);
  if (pending) {
    try {
      const body = await pending.promise;
      return { status: 200, body };
    } catch (error) {
      return {
        status: 500,
        body: {
          error: "Upstream RapidAPI request failed",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  const apiKey = rapidApiKey();
  if (!apiKey) {
    return {
      status: 500,
      body: {
        error: "API key not configured",
        details:
          "Set the RAPIDAPI_KEY (or PREDICTIONS_KEY) environment variable in Vercel.",
      },
    };
  }

  const url = new URL(`https://${opts.host}${opts.path}`);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (Array.isArray(v)) {
        v.forEach((x) => {
          if (x !== undefined && x !== "") url.searchParams.append(k, x);
        });
      } else if (v !== undefined && v !== null && v !== "") {
        url.searchParams.append(k, v);
      }
    }
  }

  const requestPromise = (async () => {
    try {
      const response = await fetchWithRetry(
        url.toString(),
        {
          method: "GET",
          headers: {
            "x-rapidapi-key": apiKey,
            "x-rapidapi-host": opts.host,
            "Content-Type": "application/json",
          },
        },
        opts.maxRetries ?? 3,
      );

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 403) {
          throw new Error("RapidAPI auth failed (invalid or expired API key)");
        }
        if (response.status === 429) {
          throw new Error("RapidAPI rate limit exceeded");
        }
        throw new Error(
          `RapidAPI error ${response.status}: ${errorText.slice(0, 200)}`,
        );
      }

      const data = await response.json();
      cache.set(opts.cacheKey, { data, timestamp: Date.now(), ttl });
      return data;
    } finally {
      pendingRequests.delete(opts.cacheKey);
    }
  })();

  pendingRequests.set(opts.cacheKey, { promise: requestPromise });

  try {
    const body = await requestPromise;
    return { status: 200, body };
  } catch (error) {
    return {
      status: 500,
      body: {
        error: "Failed to fetch from RapidAPI",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}
