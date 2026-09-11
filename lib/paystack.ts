/**
 * Server-side Paystack helpers (Vercel functions only).
 *
 * The Paystack SECRET key must never reach the browser — it is read from
 * `process.env.PAYSTACK_SECRET_KEY` here. The client only ever sends the
 * transaction `reference`, which is safe to expose.
 */

interface PaystackVerifyResponse {
  status: boolean;
  message?: string;
  data?: {
    status?: string;
    reference?: string;
    amount?: number;
    currency?: string;
    [key: string]: unknown;
  };
}

export interface VerifyResult {
  ok: boolean;
  status?: number;
  error?: string;
  verified?: boolean;
  transactionStatus?: string;
  reference?: string;
  amount?: number;
  currency?: string;
  raw?: unknown;
}

export function paystackSecretKey(): string | null {
  return process.env.PAYSTACK_SECRET_KEY || null;
}

/** Verifies a Paystack transaction reference against the Paystack API. */
export async function verifyPaystackTransaction(
  reference: string,
): Promise<VerifyResult> {
  const secret = paystackSecretKey();
  if (!secret) {
    return {
      ok: false,
      status: 500,
      error: "PAYSTACK_SECRET_KEY environment variable is not configured.",
    };
  }

  if (!reference) {
    return { ok: false, status: 400, error: "Missing transaction reference." };
  }

  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = (await response.json()) as PaystackVerifyResponse;

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: data?.message || `Paystack verify failed (HTTP ${response.status})`,
        raw: data,
      };
    }

    const verified = data?.status === true && data?.data?.status === "success";

    return {
      ok: true,
      status: 200,
      verified,
      transactionStatus: data?.data?.status,
      reference: data?.data?.reference || reference,
      amount: data?.data?.amount,
      currency: data?.data?.currency,
      raw: data,
    };
  } catch (error) {
    return {
      ok: false,
      status: 502,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}
