export const TOKEN_SUPPLY = 1_000_000_000;

export type FarmCostMode = "subtract" | "external";

export type CalculatorInput = {
  totalPoints: number;
  userPoints: number;
  nftMultiplier: number;
  fdvMillions: number;
  airdropPercentage: number;
  farmCostEnabled: boolean;
  farmCostUsd: number;
  farmCostMode: FarmCostMode;
};

export type CalculatorResult = {
  fdvUsd: number;
  tokenPrice: number;
  userShare: number;
  eligiblePoints: number;
  nftBonusPoints: number;
  effectivePoints: number;
  airdropPoolUsd: number;
  estimatedAirdropUsd: number;
  estimatedTokens: number;
  pointValueUsd: number;
  farmCostUsd: number;
  netResultUsd: number;
};

const finiteOrZero = (value: number) => (Number.isFinite(value) ? value : 0);
const clampPositive = (value: number) => Math.max(0, finiteOrZero(value));

export function calculateAirdrop(input: CalculatorInput): CalculatorResult {
  const totalPoints = clampPositive(input.totalPoints);
  const userPoints = clampPositive(input.userPoints);
  const nftMultiplier = Math.max(1, finiteOrZero(input.nftMultiplier));
  const eligiblePoints = userPoints;
  const effectivePoints = eligiblePoints * nftMultiplier;
  const nftBonusPoints = Math.max(0, effectivePoints - eligiblePoints);
  const fdvUsd = clampPositive(input.fdvMillions) * 1_000_000;
  const airdropPercent = clampPositive(input.airdropPercentage) / 100;
  const tokenPrice = fdvUsd > 0 ? fdvUsd / TOKEN_SUPPLY : 0;
  const userShare = totalPoints > 0 ? Math.min(1, effectivePoints / totalPoints) : 0;
  const airdropPoolUsd = fdvUsd * airdropPercent;
  const estimatedAirdropUsd = airdropPoolUsd * userShare;
  const estimatedTokens = tokenPrice > 0 ? estimatedAirdropUsd / tokenPrice : 0;
  const pointValueUsd = userPoints > 0 ? estimatedAirdropUsd / userPoints : 0;
  const farmCostUsd = input.farmCostEnabled ? clampPositive(input.farmCostUsd) : 0;
  const netResultUsd =
    input.farmCostMode === "subtract" ? estimatedAirdropUsd - farmCostUsd : estimatedAirdropUsd;

  return {
    fdvUsd,
    tokenPrice,
    userShare,
    eligiblePoints,
    nftBonusPoints,
    effectivePoints,
    airdropPoolUsd,
    estimatedAirdropUsd,
    estimatedTokens,
    pointValueUsd,
    farmCostUsd,
    netResultUsd,
  };
}

export function parseNumber(value: string): number {
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) {
    return 0;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
