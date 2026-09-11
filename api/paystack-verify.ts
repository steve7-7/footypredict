import { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyPaystackTransaction } from "../lib/paystack";

const first = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v;

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const reference = first(req.query.reference);
  const result = await verifyPaystackTransaction(reference || "");

  return res.status(result.status || 500).json(result);
};
