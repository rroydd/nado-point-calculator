import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        glow: "0 0 70px rgba(45, 212, 191, 0.16)",
        heat: "0 0 80px rgba(249, 115, 22, 0.22)",
      },
    },
  },
  plugins: [],
};

export default config;
