import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nado-point-calculator.vercel.app";
const siteName = "Nado Point Calculator";
const siteDescription =
  "Use the Nado Point Calculator to estimate speculative $INK airdrop value from Nado points, live weekly pool data, wallet checks, FDV, allocation, and Templars NFT scenarios.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    default: "Nado Point Calculator | Airdrop, Wallet Checker & Templars NFT Estimator",
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    "Nado airdrop calculator",
    "Nado points",
    "Nado wallet checker",
    "Nado fee tier",
    "Nado Templars NFT",
    "INK airdrop",
    "INK points calculator",
    "crypto airdrop calculator",
    "airdrop estimator",
    "trading challenge calculator",
  ],
  authors: [{ name: "Brelgino", url: "https://x.com/brelgino" }],
  creator: "@brelgino",
  publisher: "@brelgino",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName,
    title: "Nado Point Calculator | Airdrop, Wallet Checker & Templars NFT Estimator",
    description: siteDescription,
    images: [
      {
        url: "/share-image",
        width: 1200,
        height: 675,
        alt: "Nado Point Calculator share preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@nadoHQ",
    creator: "@brelgino",
    title: "Nado Point Calculator | Airdrop, Wallet Checker & Templars NFT Estimator",
    description: siteDescription,
    images: ["/share-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}

