import { VercelRequest, VercelResponse } from "@vercel/node";
import { rapidGet } from "../lib/rapidapi";

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const result = await rapidGet({
    host: "betigolo-tips.p.rapidapi.com",
    path: "/premium/history",
    cacheKey: "betigolo-history",
    ttl: 10 * 60 * 1000,
  });

  return res.status(result.status).json(result.body);
};
