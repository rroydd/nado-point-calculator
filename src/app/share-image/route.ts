import React from "react";
import { ImageResponse } from "next/og";

export const runtime = "edge";

const SHARE_BACKGROUNDS = [
  "anime-anime-girls-one-piece-nico-robin-wallpaper-preview.jpg",
  "anime-one-piece-blackbeard-marshall-d-teach-wallpaper-preview.jpg",
  "anime-one-piece-brook-one-piece-franky-one-piece-wallpaper-preview (1).jpg",
  "anime-one-piece-brook-one-piece-franky-one-piece-wallpaper-preview.jpg",
  "anime-one-piece-brook-one-piece-minimalist-wallpaper-preview.jpg",
  "anime-one-piece-gol-d-roger-wallpaper-preview.jpg",
  "anime-one-piece-monkey-d-luffy-portgas-d-ace-wallpaper-preview.jpg",
  "anime-one-piece-monkey-d-luffy-shanks-one-piece-wallpaper-preview.jpg",
  "anime-one-piece-monkey-d-luffy-wallpaper-preview (1).jpg",
  "anime-one-piece-monkey-d-luffy-wallpaper-preview.jpg",
  "anime-one-piece-monkey-d-luffy-zoro-roronoa-wallpaper-preview.jpg",
  "anime-one-piece-portgas-d-ace-wallpaper-preview.jpg",
  "anime-one-piece-sanji-one-piece-wallpaper-preview.jpg",
  "anime-one-piece-skull-skull-and-bones-wallpaper-preview.jpg",
  "anime-one-piece-thousand-sunny-wallpaper-preview.jpg",
  "anime-one-piece-tony-tony-chopper-wallpaper-preview.jpg",
  "anime-one-piece-wallpaper-preview.jpg",
  "anime-one-piece-wallpaper-thumb.jpg",
  "anime-one-piece-zoro-roronoa-wallpaper-preview.jpg",
  "blue-one-piece-kids-children-hands-sad-luffy-crying-straw-hat-1920x1080-anime-one-piece-hd-art-wallpaper-preview.jpg",
  "boa-hancock-shichibukai-blue-eyes-black-hair-anime-girls-hd-wallpaper-preview.jpg",
  "monkey-d-luffy-one-piece-gear-5th-hd-wallpaper-preview.jpg",
  "one-piece-1024x768-anime-one-piece-hd-art-wallpaper-preview.jpg",
  "one-piece-anime-monkey-d-luffy-wallpaper-preview.jpg",
  "one-piece-anime-nico-robin-wallpaper-thumb.jpg",
  "one-piece-anime-wallpaper-preview.jpg",
  "one-piece-buggy-one-piece-shanks-one-piece-hd-wallpaper-preview.jpg",
  "one-piece-edward-newgate-gol-d-roger-hd-wallpaper-preview.jpg",
  "one-piece-edward-newgate-gol-d-roger-kozuki-oden-hd-wallpaper-preview.jpg",
  "one-piece-monkey-d-luffy-1920x1080-anime-one-piece-hd-art-wallpaper-preview.jpg",
  "one-piece-monkey-d-luffy-anime-boys-anime-wallpaper-preview.jpg",
  "one-piece-monkey-d-luffy-gear-fourth-snakeman-wallpaper-preview.jpg",
  "one-piece-monkey-d-luffy-hd-wallpaper-preview.jpg",
  "one-piece-monkey-d-luffy-portgas-d-ace-sea-wallpaper-preview.jpg",
  "one-piece-nakamas-anime-monkey-d-luffy-wallpaper-preview.jpg",
  "one-piece-nami-1024x768-anime-one-piece-hd-art-wallpaper-preview.jpg",
  "one-piece-nami-1716x1176-anime-one-piece-hd-art-wallpaper-preview.jpg",
  "one-piece-nami-one-piece-hd-wallpaper-preview.jpg",
  "one-piece-nico-robin-nami-luffy-chopper-brook-franky-usopp-mugiwara-1500x843-anime-one-piece-hd-art-wallpaper-preview.jpg",
  "one-piece-nico-robin-roronoa-zoro-anime-wallpaper-preview.jpg",
  "one-piece-portgas-d-ace-anime-wallpaper-preview.jpg",
  "one-piece-roronoa-zoro-swordsman-sword-katana-hd-wallpaper-preview.jpg",
  "one-piece-roronoa-zoro-tony-tony-chopper-usopp-wallpaper-preview.jpg",
  "one-piece-shanks-one-piece-hd-wallpaper-preview.jpg",
  "one-piece-wallpaper-preview.jpg",
  "one-piece-zoro-1920x1080-anime-one-piece-hd-art-wallpaper-preview.jpg",
  "roronoa-zoro-one-piece-hd-wallpaper-preview.jpg",
  "yamato-one-piece-bunny-girl-hd-wallpaper-preview.jpg",
];

function safeText(value: string | null, fallback: string, maxLength = 54) {
  return value && value.trim() ? value.trim().slice(0, maxLength) : fallback;
}

function shareBackgroundUrl(request: Request, value: string | null) {
  const parsed = Number.parseInt(value ?? "", 10);
  const index = Number.isFinite(parsed) ? Math.abs(parsed) % SHARE_BACKGROUNDS.length : Math.floor(Math.random() * SHARE_BACKGROUNDS.length);
  return new URL(`/share-backgrounds/${encodeURIComponent(SHARE_BACKGROUNDS[index])}`, request.url).toString();
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
  const backgroundUrl = shareBackgroundUrl(request, searchParams.get("bg"));

  return new ImageResponse(
    React.createElement(
      "div",
      {
        style: {
          width: "1200px",
          height: "675px",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#020403",
          color: "white",
          fontFamily: "Arial, Helvetica, sans-serif",
          padding: "58px 76px",
        },
      },
      React.createElement("img", {
        src: backgroundUrl,
        style: {
          position: "absolute",
          inset: 0,
          width: "1200px",
          height: "675px",
          objectFit: "cover",
          opacity: 0.72,
        },
      }),
      React.createElement("div", {
        style: {
          position: "absolute",
          inset: 0,
          background: "linear-gradient(90deg, rgba(2,4,3,0.92) 0%, rgba(2,4,3,0.72) 44%, rgba(2,4,3,0.46) 100%)",
        },
      }),
      React.createElement("div", {
        style: {
          position: "absolute",
          inset: 0,
          opacity: 0.24,
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
            background: "rgba(9,10,15,0.84)",
            padding: "46px 36px",
            boxShadow: "0 30px 90px rgba(0,0,0,0.42)",
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
