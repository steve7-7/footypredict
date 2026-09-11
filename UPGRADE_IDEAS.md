# FootyPredict — Upgrade Tips & Ideas

> **Scope note:** this document is a review-and-ideas deliverable only. **No application
> code was modified**, so the current app behaviour is untouched. Each idea below points to
> the exact file(s) involved and is tagged with **impact**, **effort**, and **risk** so you
> can pick what to do first.

**How to read the tags**
- **Impact:** 🟢 Low · 🟡 Medium · 🔴 High
- **Effort:** ⏱ Small (<1h) · ⏱⏱ Medium (1 day) · ⏱⏱⏱ Large (multi-day)
- **Risk:** 🛡 Low (safe, isolated) · ⚠ Medium · 🚨 Higher (touches core flows)

---

## 1. 🔴 Critical security fixes — do these first

These do not change what the app *does*; they protect you and your users.

### 1.1 Remove the hardcoded RapidAPI key from the browser
🔴 Impact · ⏱⏱ Effort · 🚨 Risk (needs a small backend, but the payoff is huge)

Your RapidAPI key is shipped **in the client bundle**, visible to anyone who opens DevTools:

- `src/services/footballApi.ts:6` — `const API_KEY = 'b9c6883414msh...'`
- `src/services/betigoloApi.ts:6` — same key duplicated
- `src/pages/SlideResults.tsx:460` — the key is literally printed in a code sample in the UI

Anyone can copy the key and burn your RapidAPI quota. The fix is to stop calling RapidAPI
from the browser and call it from a serverless function instead. The good news: **you
already have the pattern** — `api/betigolo-history.ts` reads the key from
`process.env.RAPIDAPI_KEY` / `PREDICTIONS_KEY` (line 88), adds caching, in-flight
deduplication and retry/backoff. `PastPredictions.tsx` already fetches it via
`/api/betigolo-history`.

**Recommended move:** create sibling functions `api/predictions.ts`, `api/list-markets.ts`,
`api/list-federations.ts` (copy the caching/retry logic from `betigolo-history.ts`), then
rewrite `footballApi.ts` / `betigoloApi.ts` to call those internal endpoints instead of
`corsFetch(...)` with a public key. Keep `corsFetch` only as a last-resort fallback or
delete it entirely.

### 1.2 The Paystack key is a *live* key, hardcoded in the client
🔴 Impact · ⏱ Effort · 🛡 Risk

- `src/pages/PremiumUpgrade.tsx:14` — `DEFAULT_PAYSTACK_KEY = 'pk_live_d4e12fc3...'`

Two problems:
1. A **live** public key is committed to source control (and it is already in git history —
   rotate it at Paystack).
2. The whole "upgrade" is client-side only: the `callback` just calls `upgrade()` in the
   browser. There is no server-side verification, so the plan can be flipped to premium
   without a real payment.

**Recommended move:** load the key from `import.meta.env.VITE_PAYSTACK_PUBLIC_KEY` and
verify payments with a serverless webhook (`api/paystack-webhook.ts`) that calls
`https://api.paystack.co/transaction/verify/:reference` before granting premium.

### 1.3 Add a `.gitignore`
🟡 Impact · ⏱ Effort · 🛡 Risk

There is **no `.gitignore`** in the repo. `node_modules/` is currently untracked (180+
folders), and `dist/` will get committed after the next build. Add one that excludes at
minimum `node_modules/`, `dist/`, `.env*`, `.vercel/`, `.netlify/`, and editor files.

### 1.4 Rotate the exposed keys
🟡 Impact · ⏱ Effort · 🛡 Risk

Because the RapidAPI key and the Paystack live key are in git history, generate new keys
after you apply 1.1 and 1.2.

---

## 2. 🐞 Correctness bugs found during review

These are genuine bugs — fixing them *improves* behaviour without changing any feature.

### 2.1 `SlideResults.tsx` — "Upgrade" button crashes for free users
🟡 Impact · ⏱ Effort · 🛡 Risk

- `src/pages/SlideResults.tsx:163` and `:478` call `setActiveTab('premium')`, but
  `setActiveTab` **does not exist** in the component (the tab state is `activeSection`).
  A free user clicking "Upgrade" throws `ReferenceError: setActiveTab is not defined`.

**Fix:** replace both with `navigate('/premium')` (the `navigate` hook is already imported).

### 2.2 "Today" is computed in UTC, not the user's local day
🟡 Impact · ⏱ Effort · 🛡 Risk

- `src/pages/PredictionsList.tsx:18` and `src/services/footballApi.ts:83` both use
  `new Date().toISOString().split('T')[0]`, which is the **UTC** date. For users in
  UTC+3 (e.g. Nairobi) or later timezones, evenings will show "yesterday's" predictions.

**Fix:** build a local `YYYY-MM-DD` string:
```ts
const local = new Date();
const isoDate = `${local.getFullYear()}-${String(local.getMonth()+1).padStart(2,'0')}-${String(local.getDate()).padStart(2,'0')}`;
```

### 2.3 Dead links in auth & profile
🟢 Impact · ⏱ Effort · 🛡 Risk

- `src/components/auth/LoginScreen.tsx` — "Forgot password?" and the Terms/Privacy links
  are `href="#"`.
- `src/pages/UserProfile.tsx` — "Change Password" and "Enable 2FA" buttons do nothing.

Either wire them up or hide them until they exist (a dead button is worse than no button).

### 2.4 `PremiumBanner` fires for premium users too, and has redundant timers
🟢 Impact · ⏱ Effort · 🛡 Risk

- `src/components/ui/PremiumBanner.tsx` shows "Unlock Premium" to **everyone**, including
  paying users, and uses both a `setInterval` *and* a one-off `setTimeout` (both 30s) that
  overlap. Gate it on `user?.plan !== 'premium'` and simplify to a single timer.

---

## 3. 🏗 Data architecture upgrades

The app currently has **two inconsistent data paths**:

| Path | Used by | Key handling | Caching |
|---|---|---|---|
| Serverless `/api/betigolo-history` (Vercel) | `PastPredictions.tsx` | env var ✅ | cache + dedup + retry ✅ |
| Browser `corsFetch` → public CORS proxies | `DashboardHome`, `PredictionsList`, `SlideResults`, `UserProfile` | hardcoded ❌ | none ❌ |

### 3.1 Unify on one server-side data layer
🔴 Impact · ⏱⏱⏱ Effort · ⚠ Risk

Extend the `api/` serverless pattern so **all** RapidAPI calls (`/predictions`,
`/list-markets`, `/list-federations`, `/sample`) go through your own functions. Benefits:
- secret stays server-side (fixes 1.1),
- one place for caching, rate-limiting and retries,
- removes dependency on third-party proxies (`corsproxy.io`, `codetabs`, `thingproxy`,
  `allorigins`) that can go down, inject ads, or log your traffic.

### 3.2 Cache markets/federations aggressively
🟡 Impact · ⏱ Effort · 🛡 Risk

Markets and federations change rarely. `PredictionsList.tsx` refetches them on **every**
`fetchLive()` call. Cache them (server-side TTL of 1 day, or client-side
`sessionStorage`/`localStorage`) to cut latency and API spend.

### 3.3 Add a data-fetching hook with stale-while-revalidate
🟡 Impact · ⏱⏱ Effort · 🛡 Risk

The fetch logic is copy-pasted across four pages (`DashboardHome`, `PredictionsList`,
`SlideResults`, `UserProfile`). Extract a small `useRapidApi<T>(...)` or
`useBetigoloResults(...)` hook (or adopt TanStack Query) so loading/error/retry behaviour
is consistent and tested once.

---

## 4. 🔐 Auth & account upgrades

### 4.1 Persist the session (quick win)
🟡 Impact · ⏱ Effort · 🛡 Risk

`src/context/AuthContext.tsx` keeps the user **only in React state** — refreshing the page
logs you out. Persist the user object to `localStorage` (read on init, write on
`login/upgrade/updateProfile`) so the demo feels real. Later this becomes a real backend
session/JWT.

### 4.2 Real authentication backend
🔴 Impact · ⏱⏱⏱ Effort · 🚨 Risk

Replace the fake `login(email)` (which accepts any email, no password check) with a real
flow: email + password → serverless `/api/auth` → JWT/httpOnly cookie. Add sign-up
validation, email verification, "forgot password", and wire up the 2FA UI in
`UserProfile.tsx`.

### 4.3 OAuth sign-in
🟡 Impact · ⏱⏱ Effort · ⚠ Risk

Add Google/Apple "Continue with…" buttons to `LoginScreen.tsx` for lower-friction sign-up.

---

## 5. ✨ Product / feature ideas

### 5.1 Live match tracking & automatic settlement
🔴 Impact · ⏱⏱⏱ Effort · ⚠ Risk

Results today are static/mock (`MOCK_RESULTS`) or pulled from the Betigolo `/sample`
endpoint. Add a live-scores integration so predictions settle automatically, and the
win-rate/profit stats on `DashboardHome` and `SlideResults` become real numbers.

### 5.2 Bankroll & staking tracker
🟡 Impact · ⏱⏱ Effort · 🛡 Risk

Let users log their stake per pick, then show real ROI, profit/loss over time, and drawdown
charts. You already compute `profit` per result — a charting library (e.g. Recharts) on a
new "My Performance" page would be a strong premium feature.

### 5.3 Value-bet detector everywhere
🟡 Impact · ⏱ Effort · 🛡 Risk

`PastPredictions.tsx` already computes a **value edge** (`tip_odd` vs `fair_odd`). Surface
that logic on `PredictionCard` and `DashboardHome` ("+4.2% value") — it's a compelling,
differentiating signal and the math already exists.

### 5.4 Real push notifications (Web Push API)
🟡 Impact · ⏱⏱ Effort · ⚠ Risk

The notification toggles in `UserProfile.tsx` are decorative. Implement actual Web Push +
Service Worker (with email/SMS via a provider) so "live alerts" — a listed premium feature
— actually works.

### 5.5 Favourites & follow teams
🟡 Impact · ⏱⏱ Effort · 🛡 Risk

Let users star teams/leagues and filter predictions to only their followed competitions.
Needs only client state + `localStorage` for the demo.

### 5.6 Tipster leaderboard / community
🟡 Impact · ⏱⏱⏱ Effort · ⚠ Risk

You already have `TEAM_MEMBERS` with win rates in `mockData.ts`. Turn this into a public
leaderboard ranked by verified win rate — great for retention and social proof.

### 5.7 Odds comparison across bookmakers
🟡 Impact · ⏱⏱ Effort · ⚠ Risk

`PredictionCard` shows a single odds number. Fetch/display the best available odds across
bookmakers ("Best price 1.92 @ Bet365").

### 5.8 Dark/light theme toggle
🟢 Impact · ⏱ Effort · 🛡 Risk

The app follows `prefers-color-scheme` only (via Tailwind `dark:` classes). Add a manual
toggle in the sidebar/header and persist it.

### 5.9 Localisation / i18n
🟡 Impact · ⏱⏱ Effort · 🛡 Risk

Your pricing targets Nigeria, Ghana, Kenya, South Africa. Translate the UI (and the
landing/login copy) with a lightweight i18n library; localise currencies, dates
(`date-fns` already supports locales), and timezone-aware "today".

### 5.10 Referral program
🟡 Impact · ⏱⏱ Effort · ⚠ Risk

Give users a referral link/code with a discount on premium — a proven growth lever for this
kind of product.

---

## 6. 🎨 UX / UI polish

### 6.1 Replace `alert()` with toasts
🟢 Impact · ⏱ Effort · 🛡 Risk

`PremiumUpgrade.tsx` uses `alert()` for script-load failures. Add a tiny toast system (or a
library) and use it for copy-success, API-failure, and payment events.

### 6.2 Consistent empty/error/offline states
🟡 Impact · ⏱ Effort · 🛡 Risk

`PredictionsList` has good empty/error banners; `UserProfile` and `DashboardHome` are
thinner. Standardise a reusable `EmptyState` / `ErrorState` / `OfflineState` component.

### 6.3 Mobile-responsive tables
🟡 Impact · ⏱ Effort · 🛡 Risk

`PastPredictions.tsx` already offers a cards-vs-table view toggle. `UserProfile.tsx`'s
"Recent Bet Activity" table is a raw `<table>` that scrolls horizontally on mobile —
apply the same card fallback.

### 6.4 Accessibility pass
🟡 Impact · ⏱⏱ Effort · 🛡 Risk

- Buttons used as nav in `DashboardLayout.tsx` should be links or carry `role`/`aria-current`.
- Add `aria-label`s where icon-only buttons exist (mostly done, but audit).
- Add visible `:focus-visible` styles and check colour contrast in dark mode.
- Respect `prefers-reduced-motion` for the slideshow and `framer-motion` animations.

### 6.5 First-run onboarding
🟢 Impact · ⏱ Effort · 🛡 Risk

A short 3-step overlay after first login (where to find picks, how premium works) improves
activation — especially since the product has a free→premium funnel.

---

## 7. ⚡ Performance

### 7.1 Resolve `vite-plugin-singlefile` vs `React.lazy`
🟡 Impact · ⏱ Effort · 🛡 Risk

`vite.config.ts` inlines the whole app into one HTML file via `viteSingleFile()`, while
`router.tsx` uses `React.lazy` for every page. The lazy-loading is effectively defeated —
everything ships in one bundle. Pick one strategy per deploy target: either drop `lazy`
(if you want the single-file output) or drop `singlefile` (if you want real code-splitting
and smaller initial loads).

### 7.2 Optimise team logos
🟡 Impact · ⏱ Effort · 🛡 Risk

Team logos come from three external hosts (`upload.wikimedia.org`, `ui-avatars.com`,
`via.placeholder.com`) with `onError` fallbacks. Self-host a small logo set or use a CDN
image pipeline; add `loading="lazy"`, fixed dimensions, and a local SVG fallback.

### 7.3 Memoize hot lists
🟢 Impact · ⏱ Effort · 🛡 Risk

`PredictionsList` already memoizes `allPredictions`. Apply `useMemo`/`useCallback` to the
long lists in `PastPredictions.tsx` and `UserProfile.tsx`, and key filters properly.

### 7.4 Measure before you change
🟢 Impact · ⏱ Effort · 🛡 Risk

Add `rollup-plugin-visualizer` or `vite-bundle-analyzer` to see where the bundle weight is
(framer-motion, lucide, date-fns are the usual suspects).

---

## 8. 🔍 SEO & content

### 8.1 Dynamic sitemap `lastmod`
🟡 Impact · ⏱ Effort · 🛡 Risk

`public/sitemap.xml` hardcodes `<lastmod>2026-07-04</lastmod>`. Generate it at build time
(or in a serverless route) so search engines see fresh content.

### 8.2 Per-route meta/OG tags
🟡 Impact · ⏱ Effort · 🛡 Risk

Only `index.html` has meta tags. Because the app is a SPA, `/predictions`, `/premium`, etc.
all share the same title/description. Add a small `<SEO>` component (react-helmet-async or
a manual `document.title` effect) per route.

### 8.3 Structured data
🟢 Impact · ⏱ Effort · 🛡 Risk

Add JSON-LD (`SportsEvent` / `Article`) for predictions and results pages — helps rich
results for match listings.

### 8.4 Fix `robots.txt`
🟢 Impact · ⏱ Effort · 🛡 Risk

`public/robots.txt` disallows `/admin` and `/private` (routes that don't exist) and the
sitemap host is hardcoded to `footypredict.ai`. Confirm the canonical domain and prune the
disallow rules.

### 8.5 Add a tips/blog section
🟡 Impact · ⏱⏱ Effort · 🛡 Risk

A "Betting Tips & Analysis" content section is the cheapest long-tail SEO traffic source
for this niche, and gives the `/predictions` pages internal links.

---

## 9. 🛠 DevOps & code quality

### 9.1 Choose one deploy target
🟢 Impact · ⏱ Effort · 🛡 Risk

Both `vercel.json` and `netlify.toml` are present. The serverless function in `api/` is
Vercel-style. Pick Vercel (recommended, since `@vercel/node` + `/api` functions are already
set up) and remove the Netlify config to avoid drift.

### 9.2 Linting, formatting, git hooks
🟢 Impact · ⏱ Effort · 🛡 Risk

No ESLint/Prettier config exists. Add them plus `lint-staged` + Husky so style is enforced
automatically.

### 9.3 Tests
🟡 Impact · ⏱⏱ Effort · 🛡 Risk

Zero tests. Add Vitest + React Testing Library and cover the pure logic first (highest
value): `normalizeApiPrediction`, `normalizeBetigoloResult`, the outcome/profit logic in
`betigoloApi.ts`, and the date helpers.

### 9.4 CI pipeline
🟡 Impact · ⏱ Effort · 🛡 Risk

Add a GitHub Actions workflow: install → typecheck (`tsc --noEmit`) → lint → test → build,
then deploy. Catches regressions before they reach users.

### 9.5 Error tracking & analytics
🟡 Impact · ⏱ Effort · 🛡 Risk

Wire up Sentry (errors) and Plausible/PostHog (product analytics) to see what breaks and
how the free→premium funnel performs.

### 9.6 README
🟢 Impact · ⏱ Effort · 🛡 Risk

There is no README. Document setup, env vars, deploy steps, and the API architecture
(which is currently only discoverable by reading code).

### 9.7 Stronger TypeScript
🟢 Impact · ⏱ Effort · 🛡 Risk

`tsconfig.json` already has `strict` + `noUnusedLocals`. Consider `noUncheckedIndexedAccess`
and `exactOptionalPropertyTypes` for fewer runtime surprises (e.g. the `filteredResults[slide]`
accesses in `SlideResults.tsx`).

---

## 10. 💰 Monetisation

### 10.1 Align pricing across currencies
🟡 Impact · ⏱ Effort · 🛡 Risk

`PremiumUpgrade.tsx` lists USD **$19.99/mo** but KES **KSh 50/mo** — orders of magnitude
apart, which invites arbitrage and looks broken. Set real FX-aligned prices (or derive them
from one base price) and add a note when prices are placeholders.

### 10.2 Server-verified payments + subscription lifecycle
🔴 Impact · ⏱⏱⏱ Effort · 🚨 Risk

See 1.2. Add a Paystack webhook that verifies transactions, then build subscription
management: cancel, renewal, invoices, and a "downgrade" flow back to free.

### 10.3 Plan tiers & trials
🟡 Impact · ⏱ Effort · 🛡 Risk

Add an annual plan (2 months free), a 7-day trial, and coupon codes. Consider a third
"VIP" tier with 1:1 analyst access.

---

## 11. 🗺 Prioritised roadmap

| # | Idea | Impact | Effort | Risk | Suggested order |
|---|------|--------|--------|------|-----------------|
| 1 | Remove hardcoded RapidAPI key → serverless (1.1) | 🔴 | ⏱⏱ | 🚨 | **Now** |
| 2 | Rotate Paystack key + env var (1.2) | 🔴 | ⏱ | 🛡 | **Now** |
| 3 | Add `.gitignore` (1.3) | 🟡 | ⏱ | 🛡 | **Now** |
| 4 | Fix `setActiveTab` crash (2.1) | 🟡 | ⏱ | 🛡 | **Now** |
| 5 | Local-date bug (2.2) | 🟡 | ⏱ | 🛡 | **Now** |
| 6 | Persist session to `localStorage` (4.1) | 🟡 | ⏱ | 🛡 | Next |
| 7 | Unify data layer + caching (3.1–3.3) | 🔴 | ⏱⏱⏱ | ⚠ | Next |
| 8 | Server-verified payments (10.2) | 🔴 | ⏱⏱⏱ | 🚨 | Next |
| 9 | SEO: dynamic sitemap + per-route meta (8.1–8.2) | 🟡 | ⏱ | 🛡 | Soon |
| 10 | Performance: singlefile vs lazy (7.1), logos (7.2) | 🟡 | ⏱ | 🛡 | Soon |
| 11 | Tests + CI + lint (9.2–9.4) | 🟡 | ⏱⏱ | 🛡 | Soon |
| 12 | Feature bets: value detector (5.3), favourites (5.5), theme (5.8) | 🟡 | ⏱⏱ | 🛡 | Later |
| 13 | Live settlement (5.1), bankroll (5.2), push (5.4) | 🔴 | ⏱⏱⏱ | ⚠ | Later |
| 14 | i18n (5.9), referral (5.10), blog (8.5) | 🟡 | ⏱⏱⏱ | ⚠ | Later |

---

## 12. 🧰 Safe-rollout principles

When you start implementing, keep current functionality intact with these guardrails:

1. **Keep mock-data fallbacks.** Every page already falls back to `MOCK_*` when the API
   fails — preserve that contract for any new data path (the users never see a blank page).
2. **Feature-flag new pages** behind the existing `user.plan`/env checks so they can be
   shipped dark and turned on incrementally.
3. **Move secrets before touching features** — do the security items (section 1) first, then
   build on top.
4. **Introduce one data hook at a time** (3.3) and swap pages one by one, verifying each
   against its current behaviour.
5. **Use `tsc --noEmit` + `npm run build`** as the regression gate until CI exists.

---

## 13. 🚀 Strategic & product-innovation ideas (second pass)

These go beyond bug-fixes and architecture — bigger bets on growth, trust, and
differentiation.

### 13.1 Be honest about the "confidence" score
🔴 Impact · ⏱⏱ Effort · 🛡 Risk

`src/services/footballApi.ts` (`normalizeApiPrediction`) currently fabricates confidence:
`Math.round(65 + (index % 7) * 4)`. It's a cosmetic number with no model behind it. For a
betting product, an invented "85% confidence" is a trust and compliance risk. Either
(a) build a real model (see 13.2) and show its actual probability, or (b) label the score
transparently ("edge score", "form rating") instead of implying statistical confidence.

### 13.2 Real prediction model (ML)
🔴 Impact · ⏱⏱⏱ Effort · 🚨 Risk

Upgrade from mock/rules to an actual model: Poisson/Dixon-Coles for goals, Elo for team
strength, or a gradient-boosted classifier on historical results. Serve probabilities via a
serverless endpoint. This is the single biggest differentiator vs. the hundreds of
"prediction" sites that just scrape odds.

### 13.3 Enrich picks with data storytelling
🟡 Impact · ⏱⏱ Effort · ⚠ Risk

Add per-match context to `PredictionCard`/`rationale`: recent form (last-5 W/D/L), head-to-head,
xG, injuries, weather. The `rationale` field already exists in the data model — just make it
rich and automatic.

### 13.4 African market fit — mobile money & messaging
🔴 Impact · ⏱⏱ Effort · 🚨 Risk

Your pricing already targets NGN/GHS/KES/ZAR and Paystack is integrated. Push this further:

- **M-Pesa / mobile money** is Paystack-supported and is the default payment method for your
  Kenya audience — surface it prominently (you list "📱 Mobile Money" in
  `PremiumUpgrade.tsx` but don't let users pick it explicitly).
- **WhatsApp & Telegram delivery** — most of your target users live in WhatsApp/Telegram, not
  email. Ship daily picks as a message (a WhatsApp Business / Telegram bot posting the day's
  top picks) as the premium "live alerts" channel.
- **USSD-lite or SMS pick delivery** for low-data users — the SMS toggle in
  `UserProfile.tsx` is decorative today; make it real via an SMS gateway (Twilio/AfricasTalking).

### 13.5 Multi-sport expansion
🟡 Impact · ⏱⏱ Effort · 🛡 Risk

The `PastPredictions.tsx` data model already has a `sport` field (currently always
"Football"). The architecture supports adding Basketball, Tennis, etc. Start with one extra
sport where you have odds data.

### 13.6 PWA / installable app
🟡 Impact · ⏱⏱ Effort · 🛡 Risk

The `viteSingleFile()` build already produces one self-contained HTML file — a natural fit
for a PWA. Add a manifest + service worker so users can "install" FootyPredict and get
offline access to cached picks. Combine with push (5.4) for a native-app feel with zero app
stores.

### 13.7 Gamification & retention loops
🟡 Impact · ⏱⏱ Effort · ⚠ Risk

- **Streaks & badges** — "7-day prediction streak", "Top-10% tipster".
- **Prediction contests** — users submit their own picks and climb a weekly leaderboard
  (you already have `TEAM_MEMBERS` with win rates — extend the concept to users).
- **Progress toward premium** — a "earn 1 month free by inviting 3 friends" loop.

### 13.8 Responsible-gambling features (trust + compliance)
🟡 Impact · ⏱ Effort · 🛡 Risk

Add 18+ age confirmation at signup, self-exclusion, stake/deposit limits, and a
"when the fun stops" footer — increasingly required in the markets you serve (Kenya's BCLB,
Nigeria's NLRC regulate this space). Being ahead here is a trust moat.

### 13.9 Email & re-engagement lifecycle
🟡 Impact · ⏱ Effort · 🛡 Risk

Currently no emails are sent at all (the profile claims "receipt sent to email" in
`PremiumUpgrade.tsx`, but nothing is). Build: welcome drip → daily picks digest → win/loss
alerts → win-back offers for lapsed free users. Cheap to start with a transactional email
provider.

### 13.10 Referral + affiliate program
🟡 Impact · ⏱ Effort · ⚠ Risk

Give users a tracked referral link (10–20% of premium revenue or a free month). This niche
converts well through word-of-mouth, especially in betting communities on Telegram/X.

---

## 14. 🗺 Second-pass priorities (innovation track)

| # | Idea | Impact | Effort | When |
|---|------|--------|--------|------|
| 1 | Fix the fabricated confidence score (13.1) | 🔴 | ⏱⏱ | Now (trust/compliance) |
| 2 | Mobile money (M-Pesa) + WhatsApp/Telegram delivery (13.4) | 🔴 | ⏱⏱ | Next |
| 3 | PWA install + offline (13.6) | 🟡 | ⏱⏱ | Soon |
| 4 | Streaks/contests gamification (13.7) | 🟡 | ⏱⏱ | Soon |
| 5 | Responsible-gambling features (13.8) | 🟡 | ⏱ | Soon |
| 6 | Email lifecycle (13.9) | 🟡 | ⏱ | Later |
| 7 | Real prediction model (13.2) | 🔴 | ⏱⏱⏱ | Later |
| 8 | Multi-sport (13.5), data storytelling (13.3) | 🟡 | ⏱⏱⏱ | Later |
