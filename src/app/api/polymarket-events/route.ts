import { NextResponse } from "next/server";

export const runtime = "edge";

const GAMMA_API_URL = "https://gamma-api.polymarket.com";
const POLYMARKET_REFERRAL_QUERY = "?r=brelgino";
const REVALIDATE_SECONDS = 300;
const SEARCH_TERMS = ["nado", "ink token", "inkchain", "kraken ipo"];

type GammaMarket = {
  id?: string;
  slug?: string;
  question?: string;
  groupItemTitle?: string;
  outcomes?: string | string[];
  outcomePrices?: string | string[];
  active?: boolean;
  closed?: boolean;
};

type GammaEvent = {
  id?: string;
  slug?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  active?: boolean;
  closed?: boolean;
  endDate?: string;
  volume?: number | string;
  markets?: GammaMarket[];
};

type GammaSearchResponse = {
  events?: GammaEvent[] | null;
};

type PolymarketOutcome = {
  id: string;
  label: string;
  yesProbabilityPercent: number | null;
  status: "open" | "closed" | "unknown";
};

type PolymarketEvent = {
  id: string;
  title: string;
  slug: string;
  href: string;
  volumeUsd: number | null;
  endsAt: string | null;
  status: "open" | "closed" | "unknown";
  outcomes: PolymarketOutcome[];
};

const referencedEvents = [
  {
    slug: "will-ink-launch-a-token-by",
    title: "Will Ink launch a token by ___?",
  },
  {
    slug: "ink-fdv-above-one-day-after-launch",
    title: "Ink FDV above ___ one day after launch?",
  },
  {
    slug: "kraken-ipo-closing-market-cap-above",
    title: "Kraken IPO closing market cap above ___ ?",
  },
  {
    slug: "kraken-ipo-in-2025",
    title: "Kraken IPO by ___ ?",
  },
] as const;

function fallbackEvent({ slug, title }: (typeof referencedEvents)[number]): PolymarketEvent {
  return {
    id: slug,
    title,
    slug,
    href: `https://polymarket.com/event/${slug}${POLYMARKET_REFERRAL_QUERY}`,
    volumeUsd: null,
    endsAt: null,
    status: "unknown",
    outcomes: [],
  };
}

function isRelatedEvent(event: GammaEvent) {
  const searchableText = [event.title, event.subtitle, event.description, event.slug].filter(Boolean).join(" ");
  return /\b(?:nado|kraken|inkchain|ink)\b/i.test(searchableText);
}

function parseStringArray(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function toDisplayOutcomes(markets: GammaMarket[] | undefined) {
  const outcomes = (markets || [])
    .map((market): PolymarketOutcome | null => {
      const label = market.groupItemTitle?.trim() || market.question?.trim();
      if (!label) {
        return null;
      }

      const marketOutcomes = parseStringArray(market.outcomes);
      const prices = parseStringArray(market.outcomePrices);
      const yesIndex = marketOutcomes.findIndex((outcome) => outcome.toLowerCase() === "yes");
      const yesPrice = Number(prices[yesIndex]);

      return {
        id: market.id || market.slug || label,
        label,
        yesProbabilityPercent: Number.isFinite(yesPrice) ? yesPrice * 100 : null,
        status: market.closed ? "closed" : market.active ? "open" : "unknown",
      };
    })
    .filter((outcome): outcome is PolymarketOutcome => outcome !== null);

  const openOutcomes = outcomes.filter((outcome) => outcome.status === "open");
  return (openOutcomes.length > 0 ? openOutcomes : outcomes).sort((left, right) => {
    const leftDate = Date.parse(left.label);
    const rightDate = Date.parse(right.label);
    if (!Number.isNaN(leftDate) && !Number.isNaN(rightDate)) {
      return leftDate - rightDate;
    }

    const leftThreshold = parseThreshold(left.label);
    const rightThreshold = parseThreshold(right.label);
    if (leftThreshold !== null && rightThreshold !== null) {
      return leftThreshold - rightThreshold;
    }

    return left.label.localeCompare(right.label);
  });
}

function parseThreshold(label: string) {
  const match = label.match(/^\$([\d.]+)([MB])$/i);
  if (!match) {
    return null;
  }

  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) {
    return null;
  }

  return match[2].toUpperCase() === "B" ? amount * 1_000_000_000 : amount * 1_000_000;
}

function toDisplayEvent(event: GammaEvent): PolymarketEvent | null {
  const slug = event.slug?.trim();
  const title = event.title?.trim();

  if (!slug || !title) {
    return null;
  }

  const volume = typeof event.volume === "number" ? event.volume : Number(event.volume);

  return {
    id: event.id || slug,
    title,
    slug,
    href: `https://polymarket.com/event/${encodeURIComponent(slug)}${POLYMARKET_REFERRAL_QUERY}`,
    volumeUsd: Number.isFinite(volume) ? volume : null,
    endsAt: event.endDate || null,
    status: event.closed ? "closed" : event.active ? "open" : "unknown",
    outcomes: toDisplayOutcomes(event.markets),
  };
}

async function fetchGammaJson<T>(url: URL) {
  const response = await fetch(url.toString(), {
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`Polymarket Gamma API returned ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function GET() {
  const eventRequests = referencedEvents.map(({ slug }) =>
    fetchGammaJson<GammaEvent>(new URL(`/events/slug/${slug}`, GAMMA_API_URL)),
  );
  const searchRequests = SEARCH_TERMS.map((query) => {
    const url = new URL("/public-search", GAMMA_API_URL);
    url.search = new URLSearchParams({
      q: query,
      limit_per_type: "20",
      search_tags: "false",
      search_profiles: "false",
      optimized: "true",
    }).toString();
    return fetchGammaJson<GammaSearchResponse>(url);
  });
  const results = await Promise.allSettled([...eventRequests, ...searchRequests]);
  const fetchedEvents: GammaEvent[] = [];

  results.slice(0, referencedEvents.length).forEach((result) => {
    if (result.status === "fulfilled") {
      fetchedEvents.push(result.value as GammaEvent);
    }
  });

  results.slice(referencedEvents.length).forEach((result) => {
    if (result.status === "fulfilled") {
      const searchResult = result.value as GammaSearchResponse;
      fetchedEvents.push(...(searchResult.events || []).filter((event) => !event.closed && isRelatedEvent(event)));
    }
  });

  const uniqueEvents = new Map<string, PolymarketEvent>();
  fetchedEvents.forEach((event) => {
    const displayEvent = toDisplayEvent(event);

    if (displayEvent) {
      const currentEvent = uniqueEvents.get(displayEvent.slug);
      if (!currentEvent || displayEvent.outcomes.length >= currentEvent.outcomes.length) {
        uniqueEvents.set(displayEvent.slug, displayEvent);
      }
    }
  });

  referencedEvents.forEach((event) => {
    if (!uniqueEvents.has(event.slug)) {
      uniqueEvents.set(event.slug, fallbackEvent(event));
    }
  });

  return NextResponse.json({
    events: Array.from(uniqueEvents.values()),
    updatedAt: new Date().toISOString(),
    source: fetchedEvents.length > 0 ? "live" : "fallback",
  });
}
