const siteUrl = "https://nado-point-calculator.vercel.app";

export function GET() {
  return new Response(
    `# Nado Point Calculator

Nado Point Calculator is a public, free, client-side calculator for estimating speculative Nado points and $INK value scenarios.

Primary URL: ${siteUrl}

Useful pages and machine-readable resources:
- Homepage: ${siteUrl}
- Dynamic share image endpoint: ${siteUrl}/share-image
- Sitemap: ${siteUrl}/sitemap.xml
- Robots: ${siteUrl}/robots.txt

What the app does:
- Estimates potential $INK value from Nado points, FDV, token allocation, and current published points.
- Uses live Nado archive data for 7D average volume and weekly points pool when available.
- Includes an onchain address checker for public wallet activity, volume, fees, and fee tier when the public indexer exposes data.
- Includes speculative Templars NFT scenario controls.
- Generates share text and share images for X/Twitter from the user's current calculator inputs.

Important disclaimer:
This is an independent speculative tool. It is not official Nado or Ink tokenomics, financial advice, or a promise of future rewards.
`,
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
