import type { VercelRequest, VercelResponse } from "@vercel/node";
import { rapidGet, localISODate } from "../lib/rapidapi";

const first = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v;

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const market = first(req.query.market) || "classic";
  const isoDate = first(req.query.iso_date) || localISODate();
  const federation = first(req.query.federation);

  const result = await rapidGet({
    host: "football-prediction-api.p.rapidapi.com",
    path: "/api/v2/predictions",
    query: {
      market,
      iso_date: isoDate,
      ...(federation ? { federation } : {}),
    },
    cacheKey: `predictions:${market}:${isoDate}:${federation || "all"}`,
    ttl: 5 * 60 * 1000, // predictions change frequently
  });

  return res.status(result.status).json(result.body);
};
