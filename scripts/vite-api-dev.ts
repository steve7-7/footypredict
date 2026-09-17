/**
 * Dev-only Vite plugin that runs the Vercel serverless functions in `api/*.ts`
 * inside `npm run dev`.
 *
 * Why: Vite's dev server does not execute Vercel functions, so client fetches
 * to `/api/...` used to return the raw transpiled `.ts` source (HTTP 200,
 * `text/javascript`). The frontend treated that as "serverless unavailable"
 * and silently fell back to CORS proxies / sample data. This middleware maps
 * `/api/<name>` to `api/<name>.ts`, loads it through Vite's SSR module graph
 * (so edits hot-reload), and invokes its default export with a minimal
 * VercelRequest/VercelResponse shim.
 *
 * Server-side env (RAPIDAPI_KEY, PREDICTIONS_KEY, PAYSTACK_SECRET_KEY) comes
 * from the gitignored `.env` file, forwarded in vite.config.ts. Keys never
 * reach the client bundle: this middleware runs in the Node process only.
 *
 * Production is unaffected — `apply: "serve"` means the plugin is ignored by
 * `vite build`, and the real Vercel runtime executes the same functions.
 *
 * Supported surface (matches every function in api/):
 *   - req.method, req.query
 *   - res.status(n).json(body) / .send(...) / .end()
 * No request-body parsing: all functions are GET-only (they 405 otherwise).
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_DIR = path.resolve(__dirname, "..", "api");

type AnyHandler = (req: unknown, res: unknown) => unknown | Promise<unknown>;

/** Same shape Vercel gives handlers: repeated keys become string[]. */
function toQuery(url: URL): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = {};
  for (const key of new Set(url.searchParams.keys())) {
    const values = url.searchParams.getAll(key);
    query[key] = values.length > 1 ? values : values[0];
  }
  return query;
}

/** Minimal VercelResponse stand-in exposing only what api/*.ts handlers use. */
function createResponse(res: ServerResponse) {
  let statusCode = 200;
  const api = {
    status(code: number) {
      statusCode = code;
      return api;
    },
    setHeader(name: string, value: string | number | readonly string[]) {
      if (!res.headersSent) res.setHeader(name, value as string);
      return api;
    },
    json(body: unknown) {
      if (res.headersSent) return api;
      res.statusCode = statusCode;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify(body ?? null));
      return api;
    },
    send(body?: unknown) {
      if (res.headersSent) return api;
      res.statusCode = statusCode;
      const payload =
        typeof body === "string" || Buffer.isBuffer(body)
          ? body
          : body === undefined || body === null
            ? ""
            : JSON.stringify(body);
      if (!res.getHeader("Content-Type") && typeof payload === "string") {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
      }
      res.end(payload);
      return api;
    },
    end() {
      if (!res.headersSent) {
        res.statusCode = statusCode;
        res.end();
      }
      return api;
    },
    get headersSent() {
      return res.headersSent;
    },
  };
  return api;
}

export function vercelApiDev(): Plugin {
  return {
    name: "vercel-api-dev",
    apply: "serve",
    configureServer(devServer) {
      devServer.middlewares.use("/api", async (req, res, next) => {
        // connect strips the mount prefix from req.url; originalUrl (if set by
        // a wrapping layer) keeps it. Accept either form.
        const rawUrl = String((req as IncomingMessage & { originalUrl?: string }).originalUrl ?? req.url ?? "/");
        const url = new URL(rawUrl, "http://localhost");
        const name = url.pathname
          .replace(/^\/+api/, "")
          .replace(/^\/+|\/+$/g, "");

        // Only plain function names (no dots/slashes — leaves Vite's own
        // module URLs like /api/predictions.ts alone).
        if (!name || !/^[\w-]+$/.test(name)) return next();

        try {
          await fs.access(path.join(API_DIR, `${name}.ts`));
        } catch {
          return next(); // Not an api/ function — Vite 404s as usual.
        }

        const reqShim = {
          method: req.method ?? "GET",
          url: rawUrl,
          headers: req.headers,
          query: toQuery(url),
          body: undefined,
        };
        const resShim = createResponse(res);

        try {
          const mod = await devServer.ssrLoadModule(`/api/${name}.ts`);
          const handler = (mod.default ?? mod) as AnyHandler;
          await handler(reqShim, resShim);
          // Handlers that return without responding (shouldn't happen) get a
          // 204 instead of hanging the socket open.
          if (!res.headersSent) {
            res.statusCode = 204;
            res.end();
          }
        } catch (err) {
          // Map stack traces back to source files when the API still provides
          // the helper (it was removed from the public types in Vite 7).
          if (err instanceof Error) {
            const fixStack = (
              devServer as unknown as { ssrFixStack?: (e: Error) => void }
            ).ssrFixStack;
            fixStack?.call(devServer, err);
          }
          if (res.headersSent) {
            res.destroy();
            return;
          }
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(
            JSON.stringify({
              error: "Dev API shim failed",
              details: err instanceof Error ? err.message : String(err),
            }),
          );
        }
      });
    },
  };
}
