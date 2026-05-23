import { NextResponse } from "next/server";

export const runtime = "edge";

const ARCHIVE_ENDPOINT = "https://archive.prod.nado.xyz/v1";
const GATEWAY_ENDPOINT = "https://gateway.prod.nado.xyz/v1/query";
const TEMPLARS_OPENSEA_URL = "https://opensea.io/collection/templars-of-the-storm";
const X18 = 1_000_000_000_000_000_000;
const MATCH_PAGE_LIMIT = 500;
const MAX_MATCH_PAGES = 20;

type Subaccount = {
  subaccount?: string;
};

type Match = {
  fee?: string;
  quote_filled?: string;
  submission_idx?: string;
};

type FeeRatesData = {
  fee_tier?: number;
  taker_fee_rates_x18?: string[];
  maker_fee_rates_x18?: string[];
};

async function archiveQuery(body: unknown) {
  const response = await fetch(ARCHIVE_ENDPOINT, {
    method: "POST",
    headers: {
      "Accept-Encoding": "gzip, deflate, br",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Nado archive returned ${response.status}`);
  }

  return response.json();
}

async function gatewayQuery(body: unknown) {
  const response = await fetch(GATEWAY_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Nado gateway returned ${response.status}`);
  }

  return response.json();
}

function x18ToNumber(value: string | undefined) {
  if (!value) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.abs(parsed) / X18 : 0;
}

function x18ToBps(value: string | undefined) {
  return x18ToNumber(value) * 10_000;
}

function firstNonZeroRate(values: string[] | undefined) {
  return values?.find((value) => Number(value) !== 0);
}

async function tryGetFeeTier(sender: string | undefined) {
  if (!sender) {
    return {
      feeTier: null,
      takerFeeBps: null,
      makerFeeBps: null,
    };
  }

  try {
    const data = await gatewayQuery({ type: "fee_rates", sender });
    const feeRates = data.data as FeeRatesData;
    const takerFeeBps = x18ToBps(firstNonZeroRate(feeRates.taker_fee_rates_x18));
    const makerFeeBps = x18ToBps(firstNonZeroRate(feeRates.maker_fee_rates_x18));

    return {
      feeTier: typeof feeRates.fee_tier === "number" ? feeRates.fee_tier : null,
      takerFeeBps: Number.isFinite(takerFeeBps) && takerFeeBps > 0 ? takerFeeBps : null,
      makerFeeBps: Number.isFinite(makerFeeBps) && makerFeeBps > 0 ? makerFeeBps : null,
    };
  } catch {
    return {
      feeTier: null,
      takerFeeBps: null,
      makerFeeBps: null,
    };
  }
}

function getNextMatchIdx(matches: Match[]) {
  const last = matches[matches.length - 1];
  const submissionIdx = Number(last?.submission_idx);

  if (!Number.isFinite(submissionIdx) || submissionIdx <= 0) {
    return null;
  }

  return Math.floor(submissionIdx - 1);
}

async function getAllMatches(subaccountIds: string[]) {
  const matches: Match[] = [];
  let idx: number | null = null;

  for (let page = 0; page < MAX_MATCH_PAGES; page += 1) {
    const matchesData = await archiveQuery({
      matches: {
        subaccounts: subaccountIds,
        limit: MATCH_PAGE_LIMIT,
        ...(idx === null ? {} : { idx }),
      },
    });
    const pageMatches = Array.isArray(matchesData.matches) ? (matchesData.matches as Match[]) : [];

    matches.push(...pageMatches);

    if (pageMatches.length < MATCH_PAGE_LIMIT) {
      return { matches, complete: true };
    }

    idx = getNextMatchIdx(pageMatches);
    if (idx === null) {
      return { matches, complete: false };
    }
  }

  return { matches, complete: false };
}

async function tryGetPoints(address: string) {
  const candidates = [
    { getPoints: { address } },
    { points: { address } },
    { addressPoints: { address } },
  ];

  for (const body of candidates) {
    try {
      const data = await archiveQuery(body);
      const pointsData = data.getPoints ?? data.points ?? data.addressPoints ?? data;
      const allTimePoints = pointsData?.allTimePoints?.points ?? pointsData?.all_time_points ?? pointsData?.points;
      const allTimeRank = pointsData?.allTimePoints?.rank ?? pointsData?.all_time_rank ?? pointsData?.rank;
      const pointsPerEpoch = Array.isArray(pointsData?.pointsPerEpoch) ? pointsData.pointsPerEpoch : [];
      const previousEpoch = pointsPerEpoch.length > 1 ? pointsPerEpoch[pointsPerEpoch.length - 2] : null;

      if (allTimePoints !== undefined) {
        return {
          points: Number(allTimePoints) || 0,
          allTimeRank: Number(allTimeRank) || null,
          lastWeekPoints: previousEpoch?.points ? Number(previousEpoch.points) : null,
          lastWeekRank: previousEpoch?.rank ? Number(previousEpoch.rank) : null,
        };
      }
    } catch {
      // Some Nado SDK methods are available in-app but not exposed as archive JSON methods.
    }
  }

  return {
    points: null,
    allTimeRank: null,
    lastWeekPoints: null,
    lastWeekRank: null,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address")?.trim();

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    const [pointsData, subaccountsData] = await Promise.all([
      tryGetPoints(address),
      archiveQuery({ subaccounts: { address } }),
    ]);
    const subaccounts = (subaccountsData.subaccounts || []) as Subaccount[];
    const subaccountIds = subaccounts
      .map((item) => item.subaccount)
      .filter((item): item is string => typeof item === "string")
      .slice(0, 5);
    const feeTierData = await tryGetFeeTier(subaccountIds[0]);

    let matches: Match[] = [];
    let matchesComplete = true;
    if (subaccountIds.length > 0) {
      const matchResult = await getAllMatches(subaccountIds);
      matches = matchResult.matches;
      matchesComplete = matchResult.complete;
    }

    const feesUsd = matches.reduce((sum, match) => sum + x18ToNumber(match.fee), 0);
    const volumeUsd = matches.reduce((sum, match) => sum + x18ToNumber(match.quote_filled), 0);

    return NextResponse.json({
      address,
      ...pointsData,
      subaccounts: subaccounts.length,
      trades: matches.length,
      matchesComplete,
      volumeUsd,
      feesUsd,
      ...feeTierData,
      nftStatus: "Manual check",
      nftCheckUrl: `${TEMPLARS_OPENSEA_URL}?search[owners][0]=${address}`,
      note:
        pointsData.points === null
          ? "Nado public archive exposes trading activity, but points are only available through the app indexer client when connected."
          : "Loaded from public Nado points/indexer data.",
    });
  } catch {
    return NextResponse.json({ error: "Unable to load Nado address data" }, { status: 502 });
  }
}
