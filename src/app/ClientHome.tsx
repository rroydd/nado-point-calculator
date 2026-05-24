"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { calculateAirdrop, parseNumber, type FarmCostMode } from "@/lib/calculator";
import { compactNumber, numberWithCommas, percentage, preciseNumber, usd, usdCompact } from "@/lib/format";

const CURRENT_PUBLISHED_POINTS = 24_900_000;
const DEFAULT_AVG_DAILY_VOLUME_USD = 234_098_170;
const MIN_WEEKLY_POINTS_POOL = 300_000;
const MAX_WEEKLY_POINTS_POOL = 950_000;
const WEEKLY_POINTS_VOLUME_TARGET_USD = 2_000_000_000;

const TOTAL_POINTS_MIN = 10_000_000;
const TOTAL_POINTS_MAX = 48_480_000;
const TOTAL_POINTS_STEP = 10_000;
const MAX_USER_POINTS = 1_000_000_000;
const MAX_FDV_MILLIONS = 100_000;
const MAX_FARM_COST_USD = 100_000_000;
const MAX_NFT_MULTIPLIER = 5;
const MAX_AVG_DAILY_VOLUME_USD = 5_000_000_000;
const SHARE_BACKGROUND_COUNT = 48;

const REFERRAL_LINK = "https://app.nado.xyz?join=oIxX08E";
const PUBLIC_SITE_URL = "https://nado-point-calculator.vercel.app/";
const X_LINK = "https://x.com/nadoHQ";
const DOCS_LINK = "https://docs.nado.xyz/";
const NFT_DOCS_LINK = "https://docs.nado.xyz/nft-templars-of-the-storm";
const OPENSEA_LINK = "https://opensea.io/collection/templars-of-the-storm";
const CREATOR_LINK = "https://x.com/brelgino";

const scenarioPresets = [
  { label: "Base", fdv: 500, allocation: 9 },
  { label: "Active", fdv: 1000, allocation: 10 },
  { label: "Storm", fdv: 2500, allocation: 12 },
];

const nftScenarios = [
  { label: "No Templar", multiplier: 1, description: "No NFT-based Wind Force multiplier." },
  { label: "Low Wind Force", multiplier: 1.05, description: "Same NFT collection, conservative multiplier assumption." },
  { label: "Mid Wind Force", multiplier: 1.1, description: "Same NFT collection, base multiplier assumption." },
  { label: "High Wind Force", multiplier: 1.2, description: "Same NFT collection, aggressive multiplier assumption." },
  { label: "Custom", multiplier: 1.15, description: "Set your own speculative multiplier." },
] as const;

type NftScenario = (typeof nftScenarios)[number]["label"];
type AddressCheckResult = {
  address: string;
  points: number | null;
  allTimeRank: number | null;
  lastWeekPoints: number | null;
  lastWeekRank: number | null;
  subaccounts: number;
  trades: number;
  matchesComplete: boolean;
  volumeUsd: number;
  feesUsd: number;
  feeTier: number | null;
  takerFeeBps: number | null;
  makerFeeBps: number | null;
  nftStatus: string;
  nftCheckUrl: string;
  note: string;
};

type NadoMetrics = {
  avgDailyVolumeUsd: number;
  weeklyPointsPool: number;
  currentTotalPoints: number;
  nextSnapshotAt: string;
  source: string;
};

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

function calculateWeeklyPointsPool(avgDailyVolumeUsd: number) {
  const volume = clampNumber(avgDailyVolumeUsd, 0, MAX_AVG_DAILY_VOLUME_USD);
  const variablePool = 650_000 * (volume / WEEKLY_POINTS_VOLUME_TARGET_USD) ** 1.5;
  return Math.min(MAX_WEEKLY_POINTS_POOL, MIN_WEEKLY_POINTS_POOL + variablePool);
}

function formatCountdown(targetIso: string) {
  const target = new Date(targetIso).getTime();
  const remainingMs = Math.max(0, target - Date.now());
  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${days}D ${hours}H ${minutes}M ${seconds}S`;
}

function formatBps(value: number | null) {
  return value === null ? "n/a" : `${value.toFixed(value >= 1 ? 1 : 2)} bps`;
}

function randomShareBackground() {
  return Math.floor(Math.random() * SHARE_BACKGROUND_COUNT);
}

function AnimatedCodeBackground() {
  const rows = Array.from({ length: 22 }, (_, index) => index);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#050505]" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_16%,rgba(52,211,153,0.14),transparent_28%),radial-gradient(circle_at_74%_0%,rgba(255,255,255,0.08),transparent_24%)]" />
      <div className="nado-code-wave absolute -inset-x-20 top-0 flex h-full rotate-[-8deg] flex-col justify-center gap-3 opacity-40">
        {rows.map((row) => (
          <div className="whitespace-nowrap font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-600" key={row}>
            {Array.from({ length: 8 }, (_, index) => (
              <span className="mx-3" key={index}>
                NADO_MARKET::{row.toString(16).padStart(2, "0")} / VOLUME_DELTA / EDGE_SNAPSHOT / TEMPLAR_WIND_FORCE
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.13)_1px,transparent_1.8px)] [background-size:18px_18px] [mask-image:linear-gradient(90deg,transparent_0%,black_16%,black_84%,transparent_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/70" />
    </div>
  );
}

type NumericInputProps = {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  helper?: string;
  onChange: (value: number) => void;
};

function NumericInput({ label, value, min = 0, max, step = 1, prefix, suffix, helper, onChange }: NumericInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const displayValue = isFocused && value === 0 ? "" : String(Number.isFinite(value) ? value : 0);

  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-zinc-100">
        {label}
        {helper ? <span className="text-xs font-medium text-zinc-500">{helper}</span> : null}
      </span>
      <div className="flex items-center rounded-md border border-white/10 bg-[#111216] px-3 transition focus-within:border-emerald-300/70 focus-within:ring-2 focus-within:ring-emerald-300/10">
        {prefix ? <span className="mr-2 text-sm text-zinc-500">{prefix}</span> : null}
        <input
          className="min-w-0 flex-1 bg-transparent py-3 text-base text-white outline-none placeholder:text-zinc-700"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          type="number"
          value={displayValue}
          onBlur={() => setIsFocused(false)}
          onChange={(event) => onChange(clampNumber(parseNumber(event.target.value), min, max ?? Number.MAX_SAFE_INTEGER))}
          onFocus={() => setIsFocused(true)}
        />
        {suffix ? <span className="ml-2 whitespace-nowrap text-sm text-zinc-500">{suffix}</span> : null}
      </div>
    </label>
  );
}

function SliderField({
  label,
  valueLabel,
  minLabel,
  maxLabel,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  valueLabel: string;
  minLabel: string;
  maxLabel: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-zinc-100">{label}</span>
        <span className="rounded-md bg-zinc-800 px-2.5 py-1 text-sm font-semibold text-white">{valueLabel}</span>
      </div>
      <input
        aria-label={`${label} slider`}
        className="w-full"
        max={max}
        min={min}
        step={step}
        type="range"
        value={Math.min(max, Math.max(min, value))}
        onChange={(event) => onChange(clampNumber(parseNumber(event.target.value), min, max))}
      />
      <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className="min-h-32 rounded-lg border border-white/10 bg-[#15161b]/90 p-4 shadow-xl shadow-black/20">
      <p className="border-b border-dashed border-zinc-600 pb-1 text-xs font-semibold text-zinc-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold leading-tight text-white">{value}</p>
      {helper ? <p className="mt-2 text-xs font-medium text-zinc-500">{helper}</p> : null}
    </div>
  );
}

function ResultRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 py-3 last:border-0">
      <span className="text-sm text-zinc-400">{label}</span>
      <span className={highlight ? "text-right text-base font-semibold text-emerald-300" : "text-right text-sm font-semibold text-white"}>
        {value}
      </span>
    </div>
  );
}

function NadoLogo() {
  return (
    <div className="flex items-center">
      <Image className="h-6 w-auto object-contain" src="/nado-logo.avif" alt="NADO" width={112} height={28} priority />
    </div>
  );
}

function ReferralCta() {
  return (
    <section className="nado-referral-glow flex flex-1 overflow-hidden rounded-lg border border-emerald-200/35 bg-gradient-to-r from-emerald-400 via-cyan-300 to-emerald-200 p-5 text-black shadow-2xl shadow-emerald-950/40 sm:p-6">
      <div className="flex min-h-40 w-full flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <h2 className="mt-2 text-2xl font-black text-black">New here? Start farming with referral benefits.</h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-black/70">
            Create an account through this referral link{" "}
            <span className="rounded bg-black/15 px-2 py-1 font-black text-emerald-950 ring-1 ring-black/10">
              to access your Rebate Rate
            </span>
            , then trade spot or perps and track points from trading activity, NLP, and referrals.
          </p>
        </div>
        <a
          className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md bg-black px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-900"
          href={REFERRAL_LINK}
          target="_blank"
          rel="noopener noreferrer"
        >
          Create your account
        </a>
      </div>
    </section>
  );
}

export default function Home() {
  const [totalPoints, setTotalPoints] = useState(CURRENT_PUBLISHED_POINTS);
  const [userPoints, setUserPoints] = useState(25_000);
  const [avgDailyVolumeUsd, setAvgDailyVolumeUsd] = useState(DEFAULT_AVG_DAILY_VOLUME_USD);
  const [metricsStatus, setMetricsStatus] = useState("Loading live metrics...");
  const [fdvMillions, setFdvMillions] = useState(500);
  const [airdropPercentage, setAirdropPercentage] = useState(9);
  const [farmCostEnabled, setFarmCostEnabled] = useState(false);
  const [farmCostUsd, setFarmCostUsd] = useState(0);
  const [farmCostMode, setFarmCostMode] = useState<FarmCostMode>("subtract");
  const [nftEnabled, setNftEnabled] = useState(false);
  const [nftScenario, setNftScenario] = useState<NftScenario>("No Templar");
  const [customMultiplier, setCustomMultiplier] = useState(1.15);
  const [copyStatus, setCopyStatus] = useState("Copy Result");
  const [imageStatus, setImageStatus] = useState("Copy Image");
  const [addressInput, setAddressInput] = useState("");
  const [addressStatus, setAddressStatus] = useState("idle");
  const [addressResult, setAddressResult] = useState<AddressCheckResult | null>(null);
  const [nextSnapshotAt, setNextSnapshotAt] = useState("2026-05-29T01:00:00.000Z");
  const [snapshotCountdown, setSnapshotCountdown] = useState(() => formatCountdown("2026-05-29T01:00:00.000Z"));

  useEffect(() => {
    let active = true;

    async function loadMetrics() {
      try {
        const response = await fetch("/api/nado-metrics");
        const data = (await response.json()) as NadoMetrics;
        if (!response.ok) {
          throw new Error("Metrics unavailable");
        }
        if (!active) {
          return;
        }
        setAvgDailyVolumeUsd(data.avgDailyVolumeUsd);
        setTotalPoints(data.currentTotalPoints);
        setNextSnapshotAt(data.nextSnapshotAt);
        setMetricsStatus(data.source);
      } catch {
        if (active) {
          setMetricsStatus("Using fallback metrics until Nado archive responds.");
        }
      }
    }

    loadMetrics();
    const interval = window.setInterval(loadMetrics, 5 * 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const updateCountdown = () => setSnapshotCountdown(formatCountdown(nextSnapshotAt));

    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [nextSnapshotAt]);

  const selectedNft = nftScenarios.find((option) => option.label === nftScenario) ?? nftScenarios[0];
  const nftMultiplier = nftEnabled ? (nftScenario === "Custom" ? customMultiplier : selectedNft.multiplier) : 1;
  const weeklyPointsPool = calculateWeeklyPointsPool(avgDailyVolumeUsd);

  const result = useMemo(
    () =>
      calculateAirdrop({
        totalPoints,
        userPoints,
        nftMultiplier,
        fdvMillions,
        airdropPercentage,
        farmCostEnabled,
        farmCostUsd,
        farmCostMode,
      }),
    [airdropPercentage, farmCostEnabled, farmCostMode, farmCostUsd, fdvMillions, nftMultiplier, totalPoints, userPoints],
  );

  const activeCost = farmCostEnabled ? Math.max(0, farmCostUsd) : 0;
  const netProfit = farmCostMode === "subtract" ? result.netResultUsd : result.estimatedAirdropUsd;
  const roiPercent = activeCost > 0 ? (netProfit / activeCost) * 100 : 0;
  const breakEvenPoints = result.pointValueUsd > 0 && activeCost > 0 ? activeCost / result.pointValueUsd : 0;

  const resultSummary = `Nado airdrop scenario
Eligible points: ${numberWithCommas.format(result.eligiblePoints)}
Effective points: ${numberWithCommas.format(result.effectivePoints)}
NFT scenario: ${nftEnabled ? nftScenario : "Off"}
Estimated value: ${usd.format(result.estimatedAirdropUsd)}
Estimated tokens: ${preciseNumber.format(result.estimatedTokens)} $INK
Calculate yours: ${REFERRAL_LINK}`;

  const shareText = `My estimated Nado airdrop: ${usd.format(result.estimatedAirdropUsd)}

${numberWithCommas.format(result.effectivePoints)} effective points | calculated with Nado Point Calculator`;

  function buildShareParams(backgroundIndex: number) {
    return new URLSearchParams({
      amount: usd.format(result.estimatedAirdropUsd),
      points: `${numberWithCommas.format(result.effectivePoints)} points`,
      tokens: `${compactNumber.format(result.estimatedTokens)} $INK`,
      nft: nftEnabled ? nftScenario : "No Templar",
      bg: String(backgroundIndex),
    });
  }

  function buildPublicShareUrl(backgroundIndex: number) {
    const publicShareUrl = new URL(PUBLIC_SITE_URL);
    publicShareUrl.search = buildShareParams(backgroundIndex).toString();
    return publicShareUrl;
  }

  async function copyResult() {
    try {
      await navigator.clipboard.writeText(resultSummary);
      setCopyStatus("Copied");
      window.setTimeout(() => setCopyStatus("Copy Result"), 1600);
    } catch {
      setCopyStatus("Copy failed");
      window.setTimeout(() => setCopyStatus("Copy Result"), 1600);
    }
  }

  async function copyResultImage() {
    try {
      const imageUrl = new URL("/share-image", window.location.origin);
      imageUrl.search = buildShareParams(randomShareBackground()).toString();
      const response = await fetch(imageUrl.toString(), { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Image request failed");
      }
      const blob = await response.blob();

      const downloadImage = () => {
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = "nado-point-estimate.png";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(downloadUrl);
      };

      if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
        downloadImage();
        setImageStatus("Image downloaded");
        window.setTimeout(() => setImageStatus("Copy Image"), 1800);
        return;
      }

      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setImageStatus("Image copied");
      } catch {
        downloadImage();
        setImageStatus("Image downloaded");
      }
      window.setTimeout(() => setImageStatus("Copy Image"), 1800);
    } catch {
      setImageStatus("Copy failed");
      window.setTimeout(() => setImageStatus("Copy Image"), 1800);
    }
  }

  function shareOnX() {
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(buildPublicShareUrl(randomShareBackground()).toString())}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  }

  async function checkAddress() {
    const address = addressInput.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setAddressStatus("Enter a valid 0x address");
      return;
    }

    setAddressStatus("Checking...");
    setAddressResult(null);

    try {
      const response = await fetch(`/api/nado-address?address=${encodeURIComponent(address)}`);
      const data = (await response.json()) as AddressCheckResult & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Address check failed");
      }

      setAddressResult(data);
      if (typeof data.points === "number") {
        setUserPoints(data.points);
      }
      if (data.feesUsd > 0) {
        setFarmCostEnabled(true);
        setFarmCostUsd(Math.round(data.feesUsd * 100) / 100);
      }
      setAddressStatus("Loaded");
    } catch {
      setAddressStatus("Check failed");
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden px-4 py-5 text-white sm:px-6 lg:px-8">
      <AnimatedCodeBackground />
      <div className="mx-auto max-w-7xl">
        <header className="sticky top-0 z-20 -mx-4 mb-10 border-b border-white/10 bg-[#121318]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <NadoLogo />
              <span className="hidden text-sm font-semibold text-zinc-400 sm:inline">Point Calculator</span>
            </div>
            <nav className="flex items-center gap-2 text-sm font-semibold text-zinc-400">
              <a className="rounded-md px-3 py-2 hover:bg-white/5 hover:text-white" href={X_LINK} target="_blank" rel="noopener noreferrer">
                X
              </a>
              <a className="rounded-md px-3 py-2 hover:bg-white/5 hover:text-white" href={DOCS_LINK} target="_blank" rel="noopener noreferrer">
                Docs
              </a>
              <a className="rounded-md bg-white px-3 py-2 text-black hover:bg-emerald-100" href={REFERRAL_LINK} target="_blank" rel="noopener noreferrer">
                Trade
              </a>
            </nav>
          </div>
        </header>

        <section className="mb-7 grid gap-6 lg:grid-cols-[1fr_0.95fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold text-zinc-400">Nado airdrop and points estimator / checker</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-white sm:text-5xl">Nado Point Calculator</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
              Estimate speculative $INK rewards from Nado points, FDV, token allocation, wallet activity checks, trading challenge data, and Templars NFT scenarios.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Published Points" value={compactNumber.format(CURRENT_PUBLISHED_POINTS)} helper="from Nado Season 2 update" />
            <MetricCard label="7D Avg Volume" value={usdCompact.format(avgDailyVolumeUsd)} helper="live archive metric" />
            <MetricCard label="Weekly Pool" value={compactNumber.format(weeklyPointsPool)} helper={metricsStatus} />
            <MetricCard label="Next Snapshot" value={snapshotCountdown} helper="Friday 01:00 UTC" />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-lg border border-white/10 bg-[#15161b]/90 p-5 shadow-2xl shadow-black/30 sm:p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Inputs</h2>
                <p className="mt-1 text-sm text-zinc-400">Tune your assumptions and test point upside.</p>
              </div>
              <div className="grid w-full grid-cols-3 gap-1 rounded-md bg-black/35 p-1 sm:w-auto sm:min-w-60">
                {scenarioPresets.map((preset) => (
                  <button
                    className="rounded px-3 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white"
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setFdvMillions(preset.fdv);
                      setAirdropPercentage(preset.allocation);
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <SliderField
                label="Total Distributed Points"
                valueLabel={compactNumber.format(totalPoints)}
                minLabel={compactNumber.format(TOTAL_POINTS_MIN)}
                maxLabel={compactNumber.format(TOTAL_POINTS_MAX)}
                value={totalPoints}
                min={TOTAL_POINTS_MIN}
                max={TOTAL_POINTS_MAX}
                step={TOTAL_POINTS_STEP}
                onChange={setTotalPoints}
              />
              <NumericInput label="Your Points" value={userPoints} min={0} max={MAX_USER_POINTS} step={100} onChange={setUserPoints} />
              <div className="grid gap-4 sm:grid-cols-2">
                <NumericInput label="FDV" value={fdvMillions} min={0} max={MAX_FDV_MILLIONS} step={1} suffix="Million USD" onChange={setFdvMillions} />
                <SliderField
                  label="Token Allocation"
                  valueLabel={`${airdropPercentage}%`}
                  minLabel="0%"
                  maxLabel="100%"
                  value={airdropPercentage}
                  min={0}
                  max={100}
                  step={0.5}
                  onChange={setAirdropPercentage}
                />
              </div>

              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-white">Nado Templars NFT</h3>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">
                      One NFT collection, multiple speculative Wind Force allocation scenarios.
                    </p>
                  </div>
                  <button
                    className={`h-8 w-14 shrink-0 rounded-full p-1 transition ${nftEnabled ? "bg-emerald-300" : "bg-zinc-700"}`}
                    type="button"
                    aria-label="Toggle Nado Templars NFT"
                    aria-pressed={nftEnabled}
                    onClick={() => setNftEnabled((enabled) => !enabled)}
                  >
                    <span className={`block h-6 w-6 rounded-full bg-black transition ${nftEnabled ? "translate-x-6" : "translate-x-0"}`} />
                  </button>
                </div>

                {nftEnabled ? (
                  <div className="mt-4 space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-zinc-100">Templars Scenario</span>
                    <select
                      className="w-full rounded-md border border-white/10 bg-[#111216] px-3 py-3 text-sm text-white outline-none focus:border-emerald-300/70"
                      value={nftScenario}
                      onChange={(event) => setNftScenario(event.target.value as NftScenario)}
                    >
                      {nftScenarios.map((option) => (
                        <option key={option.label} value={option.label}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <span className="mt-2 block text-xs leading-5 text-zinc-500">{selectedNft.description}</span>
                  </label>
                  <NumericInput
                    label="NFT Multiplier"
                    value={nftMultiplier}
                    min={1}
                    max={MAX_NFT_MULTIPLIER}
                    step={0.01}
                    suffix="x"
                    helper={nftScenario === "Custom" ? "Custom" : "preset"}
                    onChange={(value) => {
                      setNftScenario("Custom");
                      setCustomMultiplier(value);
                    }}
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                  <a className="rounded-md border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm font-semibold text-zinc-200 hover:bg-white/10" href={OPENSEA_LINK} target="_blank" rel="noopener noreferrer">
                    View Templars on OpenSea
                  </a>
                  <a className="rounded-md border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm font-semibold text-zinc-200 hover:bg-white/10" href={NFT_DOCS_LINK} target="_blank" rel="noopener noreferrer">
                    Read NFT Docs
                  </a>
                  </div>
                </div>
                ) : null}
              </div>

              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="mb-4">
                  <h3 className="font-semibold text-white">Onchain Address Check</h3>
                  <p className="mt-1 text-sm leading-6 text-zinc-400">
                    Paste an Ink wallet address to pull public Nado activity, fee tier, volume, and fees. Exact points and Templars ownership require Nado/OpenSea indexer access when public data is unavailable.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input
                    className="min-w-0 rounded-md border border-white/10 bg-[#111216] px-3 py-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-emerald-300/70"
                    placeholder="0x..."
                    value={addressInput}
                    onChange={(event) => setAddressInput(event.target.value)}
                  />
                  <button
                    className="rounded-md bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    type="button"
                    disabled={addressStatus === "Checking..."}
                    onClick={checkAddress}
                  >
                    Check
                  </button>
                </div>
                <p className="mt-2 text-xs font-medium text-zinc-500">{addressStatus === "idle" ? "Uses public Nado indexer data when available." : addressStatus}</p>

                {addressResult ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <MetricCard label="Real Points" value={addressResult.points === null ? "Not public" : numberWithCommas.format(addressResult.points)} helper={addressResult.note} />
                    <MetricCard label="Real Fees" value={usd.format(addressResult.feesUsd)} helper="public match data" />
                    <MetricCard
                      label="Fee Tier"
                      value={addressResult.feeTier === null ? "Unavailable" : `Tier ${addressResult.feeTier}`}
                      helper={`taker ${formatBps(addressResult.takerFeeBps)} / maker ${formatBps(addressResult.makerFeeBps)}`}
                    />
                    <MetricCard
                      label="Volume"
                      value={usdCompact.format(addressResult.volumeUsd)}
                      helper={`${numberWithCommas.format(addressResult.trades)} trades${addressResult.matchesComplete ? "" : " loaded, more may exist"}`}
                    />
                    <MetricCard label="Subaccounts" value={numberWithCommas.format(addressResult.subaccounts)} helper={addressResult.allTimeRank ? `rank #${numberWithCommas.format(addressResult.allTimeRank)}` : "public indexer"} />
                    <MetricCard label="Templars NFT" value={addressResult.nftStatus} helper="OpenSea or NFT indexer API required" />
                    <a className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm font-semibold text-zinc-200 transition hover:bg-white/10" href={addressResult.nftCheckUrl} target="_blank" rel="noopener noreferrer">
                      Open NFT check on OpenSea
                    </a>
                  </div>
                ) : null}
              </div>

              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-white">Farm Cost</h3>
                    <p className="mt-1 text-sm text-zinc-400">Subtract deposits, fees, or other farming costs if you want net PnL.</p>
                  </div>
                  <button
                    className={`h-8 w-14 rounded-full p-1 transition ${farmCostEnabled ? "bg-emerald-300" : "bg-zinc-700"}`}
                    type="button"
                    aria-label="Toggle farm cost"
                    aria-pressed={farmCostEnabled}
                    onClick={() => setFarmCostEnabled((enabled) => !enabled)}
                  >
                    <span className={`block h-6 w-6 rounded-full bg-black transition ${farmCostEnabled ? "translate-x-6" : "translate-x-0"}`} />
                  </button>
                </div>
                {farmCostEnabled ? (
                  <div className="mt-4 space-y-4">
                    <NumericInput label="Cost" value={farmCostUsd} min={0} max={MAX_FARM_COST_USD} step={1} prefix="$" onChange={setFarmCostUsd} />
                    <div className="grid grid-cols-2 gap-2 rounded-md bg-black/35 p-1">
                      {(["subtract", "external"] as FarmCostMode[]).map((mode) => (
                        <button
                          className={`rounded px-3 py-2 text-sm font-semibold transition ${farmCostMode === mode ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}
                          key={mode}
                          type="button"
                          onClick={() => setFarmCostMode(mode)}
                        >
                          {mode === "subtract" ? "Subtract" : "Display only"}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex h-full min-w-0 flex-col gap-6">
            <div className="rounded-lg border border-white/10 bg-[#15161b]/95 p-5 shadow-2xl shadow-black/30 sm:p-6">
              <p className="text-sm font-semibold uppercase text-zinc-400">Final Estimated Points Value</p>
              <div className="mt-3 text-5xl font-semibold leading-tight text-white">{usd.format(result.estimatedAirdropUsd)}</div>
              <p className="mt-3 text-sm text-zinc-400">
                Net result after farm cost: <span className="font-semibold text-emerald-300">{usd.format(netProfit)}</span>
              </p>

              <div className="mt-6 rounded-lg border border-white/10 bg-black/30 px-4">
                <ResultRow label="Eligible Points" value={numberWithCommas.format(result.eligiblePoints)} />
                <ResultRow label="NFT Bonus Points" value={numberWithCommas.format(result.nftBonusPoints)} />
                <ResultRow label="Effective Points" value={numberWithCommas.format(result.effectivePoints)} highlight />
                <ResultRow label="Share %" value={percentage(result.userShare)} highlight />
                <ResultRow label="Estimated Tokens" value={`${preciseNumber.format(result.estimatedTokens)} $INK`} />
                <ResultRow label="Token Pool" value={usdCompact.format(result.airdropPoolUsd)} />
                <ResultRow label="FDV" value={usdCompact.format(result.fdvUsd)} />
                {addressResult ? (
                  <ResultRow label="Account Fee Tier" value={addressResult.feeTier === null ? "Unavailable" : `Tier ${addressResult.feeTier}`} />
                ) : null}
                <ResultRow label="1 Token Price" value={usd.format(result.tokenPrice)} />
                <ResultRow label="1 Point Value" value={usd.format(result.pointValueUsd)} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard label="Point EV" value={usd.format(result.pointValueUsd)} />
              <MetricCard label="Break-even pts" value={breakEvenPoints > 0 ? compactNumber.format(breakEvenPoints) : "Add cost"} />
              <MetricCard label="Cost ROI" value={activeCost > 0 ? `${roiPercent.toFixed(1)}%` : "No cost"} />
            </div>

            <div className="rounded-lg border border-white/10 bg-[#15161b]/90 p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <button className="rounded-md bg-white px-4 py-3 text-sm font-bold text-black transition hover:bg-emerald-100" type="button" onClick={copyResult}>
                  {copyStatus}
                </button>
                <button className="rounded-md border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-white/10" type="button" onClick={shareOnX}>
                  Share on X
                </button>
                <button className="rounded-md border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10" type="button" onClick={copyResultImage}>
                  {imageStatus}
                </button>
              </div>
            </div>

            <ReferralCta />
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <MetricCard label="Dynamic Pool" value={`${compactNumber.format(MIN_WEEKLY_POINTS_POOL)}-${compactNumber.format(MAX_WEEKLY_POINTS_POOL)}`} helper="based on 7D average daily volume" />
          <MetricCard label="Points Sources" value="Trading / NLP / Referrals" helper="from official docs" />
          <a
            className="nado-referral-glow group flex min-h-32 cursor-pointer flex-col justify-between gap-4 overflow-hidden rounded-lg border border-emerald-200/35 bg-gradient-to-r from-emerald-400 via-cyan-300 to-emerald-200 p-4 text-black shadow-xl shadow-emerald-950/30 transition hover:-translate-y-0.5 hover:shadow-emerald-700/30 focus:outline-none focus:ring-2 focus:ring-emerald-200 sm:flex-row sm:items-center"
            href={REFERRAL_LINK}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open Nado trading competition with referral link"
          >
            <div className="min-w-0 flex-1">
              <p className="border-b border-dashed border-black/25 pb-1 text-xs font-black uppercase text-emerald-950/70">$100K Trading Competition</p>
              <p className="mt-3 text-2xl font-black leading-tight text-black">May 25-Jun 1</p>
              <p className="mt-2 text-xs font-bold text-black/65">ROI and volume leaderboards</p>
            </div>
            <span className="inline-flex shrink-0 items-center justify-center self-start whitespace-nowrap rounded-md bg-black px-5 py-3 text-sm font-bold text-white transition group-hover:bg-zinc-900 sm:self-center">
              Enter
            </span>
          </a>
        </section>

        <section className="mt-6 rounded-lg border border-white/10 bg-[#15161b]/90 p-5 shadow-2xl shadow-black/20 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="text-xs font-semibold uppercase text-emerald-300">Trading challenge</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">How points scale now</h2>
            </div>
            <div className="grid gap-3 text-sm leading-6 text-zinc-400 sm:grid-cols-3">
              <p className="rounded-md bg-black/25 p-4">
                Season 2 weekly pool starts at <span className="font-semibold text-white">300k points</span>.
              </p>
              <p className="rounded-md bg-black/25 p-4">
                Extra pool scales with <span className="font-semibold text-white">7D avg daily volume</span>.
              </p>
              <p className="rounded-md bg-black/25 p-4">
                Weekly pool is capped at <span className="font-semibold text-white">950k points</span>.
              </p>
            </div>
          </div>
        </section>

        <footer className="mt-6 rounded-lg border border-white/10 bg-black/25 p-5 text-center text-sm text-zinc-500">
          <p>
            Dashboard created by{" "}
            <a className="font-semibold text-zinc-300 underline decoration-zinc-600 underline-offset-4 hover:text-white" href={CREATOR_LINK} target="_blank" rel="noopener noreferrer">
              @brelgino
            </a>
          </p>
          <p className="mx-auto mt-3 max-w-4xl text-xs leading-5 text-zinc-600">
            Disclaimer: this calculator is an independent speculative tool. It is not official Nado or Ink tokenomics,
            financial advice, or a promise of an airdrop. All calculations, NFT multipliers, FDV, allocation percentages,
            and token estimates are hypothetical.
          </p>
        </footer>
      </div>
    </main>
  );
}

