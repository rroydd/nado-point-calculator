import { NextResponse } from "next/server";

export const runtime = "edge";

const ARCHIVE_ENDPOINT = "https://archive.prod.nado.xyz/v1";
const X18 = 1_000_000_000_000_000_000;
const CURRENT_PUBLISHED_POINTS = 24_900_000;
const CURRENT_OFFICIAL_AVG_DAILY_VOLUME_USD = 234_098_170;
const MIN_WEEKLY_POINTS_POOL = 300_000;
const MAX_WEEKLY_POINTS_POOL = 950_000;
const WEEKLY_POINTS_VOLUME_TARGET_USD = 2_000_000_000;
const WEEK_SECONDS = 7 * 24 * 60 * 60;

type Snapshot = {
  timestamp?: number;
  cumulative_volumes?: Record<string, string>;
};

function x18ToNumber(value: string | undefined) {
  if (!value) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.abs(parsed) / X18 : 0;
}

function sumVolumes(snapshot: Snapshot) {
  return Object.values(snapshot.cumulative_volumes || {}).reduce((sum, value) => sum + x18ToNumber(value), 0);
}

function calculateWeeklyPointsPool(avgDailyVolumeUsd: number) {
  const variablePool = 650_000 * (Math.max(0, avgDailyVolumeUsd) / WEEKLY_POINTS_VOLUME_TARGET_USD) ** 1.5;
  return Math.min(MAX_WEEKLY_POINTS_POOL, MIN_WEEKLY_POINTS_POOL + variablePool);
}

function getNextSnapshotAt(now = new Date()) {
  const day = now.getUTCDay();
  const daysUntilFriday = (5 - day + 7) % 7;
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilFriday, 1, 0, 0));

  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 7);
  }

  return next.toISOString();
}

export async function GET() {
  try {
    const response = await fetch(ARCHIVE_ENDPOINT, {
      method: "POST",
      headers: {
        "Accept-Encoding": "gzip, deflate, br",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        edge_market_snapshots: {
          interval: {
            count: 2,
            granularity: WEEK_SECONDS,
          },
        },
      }),
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`Nado archive returned ${response.status}`);
    }

    const data = await response.json();
    const chainSnapshots = Object.values(data.snapshots || {}) as Snapshot[][];
    const snapshots = chainSnapshots.flat().sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
    const latest = snapshots[0];
    const previous = snapshots[1];

    if (!latest || !previous) {
      throw new Error("Not enough snapshots");
    }

    const weeklyVolumeUsd = Math.max(0, sumVolumes(latest) - sumVolumes(previous));
    const avgDailyVolumeUsd = weeklyVolumeUsd / 7;
    const weeklyPointsPool = calculateWeeklyPointsPool(avgDailyVolumeUsd);

    return NextResponse.json({
      avgDailyVolumeUsd,
      weeklyPointsPool,
      currentTotalPoints: CURRENT_PUBLISHED_POINTS,
      nextSnapshotAt: getNextSnapshotAt(),
      source: "Live Nado archive snapshots",
    });
  } catch {
    const avgDailyVolumeUsd = CURRENT_OFFICIAL_AVG_DAILY_VOLUME_USD;
    return NextResponse.json({
      avgDailyVolumeUsd,
      weeklyPointsPool: calculateWeeklyPointsPool(avgDailyVolumeUsd),
      currentTotalPoints: CURRENT_PUBLISHED_POINTS,
      nextSnapshotAt: getNextSnapshotAt(),
      source: "Fallback while Nado archive is unavailable",
    });
  }
}
