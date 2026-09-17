import type { VercelRequest, VercelResponse } from "@vercel/node";
import { rapidGet } from "../lib/rapidapi";

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const result = await rapidGet({
    host: "football-prediction-api.p.rapidapi.com",
    path: "/api/v2/list-markets",
    cacheKey: "list-markets",
    ttl: 24 * 60 * 60 * 1000, // markets rarely change
  });

  return res.status(result.status).json(result.body);
};
