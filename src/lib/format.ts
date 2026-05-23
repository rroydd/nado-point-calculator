export const compactNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

export const numberWithCommas = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export const preciseNumber = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 4,
});

export const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function percentage(value: number) {
  return `${(Number.isFinite(value) ? value * 100 : 0).toLocaleString("en-US", {
    maximumFractionDigits: 4,
  })}%`;
}
