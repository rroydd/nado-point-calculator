import React from "react";
import { ImageResponse } from "next/og";

export const runtime = "edge";

function safeText(value: string | null, fallback: string, maxLength = 54) {
  return value && value.trim() ? value.trim().slice(0, maxLength) : fallback;
}

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const amount = safeText(searchParams.get("amount"), "$0.00");
  const points = safeText(searchParams.get("points"), "0 points");
  const nft = safeText(searchParams.get("nft"), "No NFT");
  const tokens = safeText(searchParams.get("tokens"), "0 $INK");

  return new ImageResponse(
    React.createElement(
      "div",
      {
        style: {
          width: "1200px",
          height: "675px",
          display: "flex",
          background: "#050505",
          color: "white",
          fontFamily: "Arial, Helvetica, sans-serif",
          padding: "70px 76px",
        },
      },
      React.createElement(
        "div",
        {
          style: {
            position: "absolute",
            inset: 0,
            opacity: 0.35,
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.28) 1px, transparent 1.6px)",
            backgroundSize: "18px 18px",
            maskImage: "linear-gradient(90deg, transparent 0%, black 16%, black 84%, transparent 100%)",
          },
        },
      ),
      React.createElement(
        "div",
        {
          style: {
            width: "1048px",
            height: "535px",
            display: "flex",
            flexDirection: "column",
            border: "2px solid rgba(255,255,255,0.14)",
            borderRadius: "18px",
            background: "rgba(21,22,27,0.96)",
            padding: "42px 50px",
          },
        },
        React.createElement(
          "div",
          { style: { display: "flex", alignItems: "center", gap: "14px" } },
          React.createElement(
            "div",
            {
              style: {
                width: "50px",
                height: "50px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
                background: "#ffffff",
                color: "#050505",
                fontSize: "30px",
                fontWeight: 900,
              },
            },
            "N",
          ),
          React.createElement("div", { style: { fontSize: "54px", fontWeight: 900, letterSpacing: "0" } }, "NADO"),
        ),
        React.createElement("div", { style: { marginTop: "28px", color: "#a1a1aa", fontSize: "28px", fontWeight: 700 } }, "Point Calculator"),
        React.createElement("div", { style: { marginTop: "42px", fontSize: "78px", fontWeight: 900, lineHeight: 1 } }, amount),
        React.createElement("div", { style: { marginTop: "22px", color: "#a1a1aa", fontSize: "28px", fontWeight: 700 } }, "Final estimated points value"),
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "28px",
              marginTop: "55px",
              borderRadius: "14px",
              background: "#23252b",
              padding: "25px 28px",
              color: "#d4d4d8",
              fontSize: "30px",
              fontWeight: 800,
            },
          },
          React.createElement("div", { style: { width: "34%" } }, points),
          React.createElement("div", { style: { width: "28%", textAlign: "center" } }, nft),
          React.createElement("div", { style: { width: "30%", textAlign: "right" } }, tokens),
        ),
        React.createElement(
          "div",
          { style: { marginTop: "38px", fontSize: "26px", fontWeight: 800, color: "#34d399" } },
          "Trade on Nado with referral code oIxX08E",
        ),
      ),
    ),
    {
      width: 1200,
      height: 675,
    },
  );
}
