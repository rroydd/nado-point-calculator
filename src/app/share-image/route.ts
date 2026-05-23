import React from "react";
import { ImageResponse } from "next/og";

export const runtime = "edge";

function safeText(value: string | null, fallback: string, maxLength = 54) {
  return value && value.trim() ? value.trim().slice(0, maxLength) : fallback;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return React.createElement(
    "div",
    {
      style: {
        width: "300px",
        height: "94px",
        display: "flex",
        position: "relative",
        flexDirection: "column",
        justifyContent: "center",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: "16px",
        background: "rgba(255,255,255,0.055)",
        padding: "0 24px",
      },
    },
    React.createElement(
      "div",
      { style: { color: "#94a3b8", fontSize: "17px", fontWeight: 800, textTransform: "uppercase" } },
      label,
    ),
    React.createElement(
      "div",
      { style: { marginTop: "12px", color: "#f8fafc", fontSize: "28px", fontWeight: 900, lineHeight: 1.05 } },
      value,
    ),
  );
}

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const amount = safeText(searchParams.get("amount"), "$0.00", 32);
  const points = safeText(searchParams.get("points"), "0 points", 28);
  const nft = safeText(searchParams.get("nft"), "No Templar", 32);
  const tokens = safeText(searchParams.get("tokens"), "0 $INK", 28);

  return new ImageResponse(
    React.createElement(
      "div",
      {
        style: {
          width: "1200px",
          height: "675px",
          display: "flex",
          position: "relative",
          background: "linear-gradient(135deg, #020403 0%, #050505 58%, #041f1a 100%)",
          color: "white",
          fontFamily: "Arial, Helvetica, sans-serif",
          padding: "58px 76px",
        },
      },
      React.createElement("div", {
        style: {
          position: "absolute",
          inset: 0,
          opacity: 0.34,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.28) 1px, transparent 1.6px)",
          backgroundSize: "18px 18px",
          maskImage: "linear-gradient(90deg, transparent 0%, black 16%, black 84%, transparent 100%)",
        },
      }),
      React.createElement("div", {
        style: {
          position: "absolute",
          right: "-80px",
          top: "-120px",
          width: "520px",
          height: "520px",
          borderRadius: "260px",
          background: "radial-gradient(circle, rgba(52,211,153,0.24) 0%, rgba(52,211,153,0) 70%)",
        },
      }),
      React.createElement(
        "div",
        {
          style: {
            width: "1048px",
            height: "558px",
            display: "flex",
            position: "relative",
            flexDirection: "column",
            border: "2px solid rgba(255,255,255,0.14)",
            borderRadius: "24px",
            background: "rgba(21,22,27,0.96)",
            padding: "46px 36px",
          },
        },
        React.createElement(
          "div",
          {
            style: {
              position: "absolute",
              left: "36px",
              top: "46px",
              width: "205px",
              height: "34px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "17px",
              background: "rgba(52,211,153,0.16)",
              color: "#86efac",
              fontSize: "16px",
              fontWeight: 800,
            },
          },
          "NADO POINT ESTIMATE",
        ),
        React.createElement(
          "div",
          { style: { position: "absolute", left: "36px", top: "118px", fontSize: "54px", fontWeight: 900, lineHeight: 1 } },
          "NADO",
        ),
        React.createElement(
          "div",
          { style: { position: "absolute", left: "36px", top: "180px", color: "#9ca3af", fontSize: "26px", fontWeight: 700, lineHeight: 1 } },
          "Point Calculator",
        ),
        React.createElement(
          "div",
          { style: { position: "absolute", left: "36px", top: "220px", fontSize: amount.length > 12 ? "64px" : "74px", fontWeight: 900, lineHeight: 1 } },
          amount,
        ),
        React.createElement(
          "div",
          { style: { position: "absolute", left: "36px", top: "296px", color: "#a1a1aa", fontSize: "24px", fontWeight: 700, lineHeight: 1 } },
          "Potential estimated value",
        ),
        React.createElement(
          "div",
          { style: { position: "absolute", left: "36px", top: "330px", display: "flex", gap: "38px" } },
          React.createElement(StatCard, { label: "Points", value: points.replace(" points", "") }),
          React.createElement(StatCard, { label: "$INK Tokens", value: tokens.replace(" $INK", "") }),
          React.createElement(StatCard, { label: "NFT Scenario", value: nft }),
        ),
        React.createElement(
          "div",
          {
            style: {
              position: "absolute",
              left: "36px",
              bottom: "38px",
              width: "976px",
              height: "72px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: "18px",
              background: "linear-gradient(90deg, #34d399 0%, #67e8f9 56%, #a7f3d0 100%)",
              color: "#04130f",
              padding: "0 30px",
            },
          },
          React.createElement("div", { style: { fontSize: "28px", fontWeight: 900 } }, "Create your account on Nado"),
          React.createElement("div", { style: { fontSize: "24px", fontWeight: 800 } }, "referral code oIxX08E"),
        ),
      ),
    ),
    {
      width: 1200,
      height: 675,
    },
  );
}
