import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_NAME = 'FootyPredict';
const BASE_URL = 'https://footypredict.ai';
const DEFAULT_DESCRIPTION =
  'Get instant access to live football predictions, advanced market filters, and expert analysis. Premium access to unlimited picks, live alerts, and historical data.';

interface MetaInfo {
  title: string;
  description: string;
}

const ROUTE_META: Record<string, MetaInfo> = {
  '/': {
    title: 'Dashboard',
    description:
      "Your football predictions dashboard — today's top picks, live win rates, and recent results at a glance.",
  },
  '/predictions': {
    title: 'All Predictions',
    description:
      'Browse all football predictions with market and federation filters. Free picks and premium live API picks updated daily.',
  },
  '/results': {
    title: 'Results & Performance',
    description:
      'Track verified prediction results, win rates, and profit across our football tip history.',
  },
  '/past-predictions': {
    title: 'Past Predictions',
    description:
      'Historical football predictions with odds, fair odds, value edge and settled results.',
  },
  '/premium': {
    title: 'Premium Access',
    description:
      'Upgrade to FootyPredict Premium for unlimited live picks, advanced filters, and expert analysis.',
  },
  '/profile': {
    title: 'My Profile',
    description:
      'Manage your FootyPredict account, notification preferences, and security settings.',
  },
  '/about': {
    title: 'About Us',
    description: 'Learn about the FootyPredict team and our football prediction methodology.',
  },
  '/contact': {
    title: 'Contact & FAQ',
    description: 'Get help and answers to frequently asked questions about FootyPredict.',
  },
  '/privacy': {
    title: 'Privacy Policy',
    description: 'How FootyPredict collects, uses, and protects your data.',
  },
};

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertJsonLd(id: string, obj: object) {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(obj);
}

/**
 * Sets per-route <title>, meta description, Open Graph / Twitter tags,
 * canonical URL and JSON-LD structured data based on the current route.
 * Renders nothing.
 */
export function Seo() {
  const location = useLocation();

  useEffect(() => {
    const meta = ROUTE_META[location.pathname] || ROUTE_META['/'];
    const title = `${meta.title} | ${SITE_NAME}`;
    const url = `${BASE_URL}${location.pathname === '/' ? '/' : location.pathname}`;

    document.title = title;

    upsertMeta('name', 'description', meta.description);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', meta.description);
    upsertMeta('property', 'og:url', url);
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', meta.description);
    upsertMeta('name', 'twitter:url', url);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    upsertJsonLd('fp-jsonld-webpage', {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: meta.title,
      description: meta.description,
      url,
      isPartOf: {
        '@type': 'WebSite',
        name: SITE_NAME,
        url: BASE_URL,
      },
    });
  }, [location.pathname]);

  return null;
}

export { DEFAULT_DESCRIPTION };
