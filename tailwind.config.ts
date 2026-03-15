import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0f",
        surface: "#12121a",
        foreground: "#e8e4df",
        muted: "#6a6570",
        accent: "#c4a35a",
        material: "#1D9E75",
        epistemic: "#378ADD",
        relational: "#D85A30",
        verified: "#22c55e",
        assumed: "#f59e0b",
        "at-risk": "#ef4444",
        absent: "#374151",
        rigidity: "#8b5cf6",
        length: "#06b6d4",
        quality: "#ec4899",
      },
      fontFamily: {
        heading: ["Cormorant Garamond", "serif"],
        body: ["DM Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
