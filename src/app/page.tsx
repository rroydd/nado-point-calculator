import type { Metadata } from "next";
import Home from "./ClientHome";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nado-point-calculator.vercel.app";
const siteName = "Nado Point Calculator";
const siteDescription =
  "Estimate a potential Nado and INK airdrop with live weekly points pool data, wallet activity checks, FDV assumptions, token allocation, and Templars NFT scenarios.";

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function safeValue(value: string | string[] | undefined, maxLength = 72) {
  return firstValue(value)?.trim().slice(0, maxLength);
}

function buildImageUrl(searchParams: SearchParams) {
  const amount = safeValue(searchParams.amount);
  const points = safeValue(searchParams.points);
  const tokens = safeValue(searchParams.tokens);
  const nft = safeValue(searchParams.nft);

  if (!amount || !points || !tokens) {
    return `${siteUrl}/share-image`;
  }

  const params = new URLSearchParams({
    amount,
    points,
    tokens,
    nft: nft || "No NFT",
  });

  return `${siteUrl}/share-image?${params.toString()}`;
}

function buildSharePageUrl(searchParams: SearchParams) {
  const amount = safeValue(searchParams.amount);
  const points = safeValue(searchParams.points);
  const tokens = safeValue(searchParams.tokens);
  const nft = safeValue(searchParams.nft);

  if (!amount || !points || !tokens) {
    return siteUrl;
  }

  const params = new URLSearchParams({
    amount,
    points,
    tokens,
    nft: nft || "No NFT",
  });

  return `${siteUrl}/?${params.toString()}`;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const imageUrl = buildImageUrl(params);
  const sharePageUrl = buildSharePageUrl(params);
  const amount = safeValue(params.amount);
  const points = safeValue(params.points);
  const title = amount ? `My Nado airdrop estimate: ${amount}` : "Nado Point Calculator | Wallet Checker & Templars NFT Estimator";
  const description =
    amount && points
      ? `${points} calculated with ${siteName}.`
      : siteDescription;

  return {
    title,
    description,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      url: sharePageUrl,
      siteName,
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 675,
          alt: "Nado Point Calculator result preview",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@nadoHQ",
      creator: "@brelgino",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function Page() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: siteName,
    url: siteUrl,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    description: siteDescription,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    creator: {
      "@type": "Person",
      name: "Brelgino",
      url: "https://x.com/brelgino",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <Home />
    </>
  );
}

