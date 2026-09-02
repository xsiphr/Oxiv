import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        canvas: "var(--colors-canvas)",
        "surface-card": "var(--colors-surface-card)",
        "surface-elevated": "var(--colors-surface-elevated)",
        hairline: "var(--colors-hairline)",
        "hairline-strong": "var(--colors-hairline-strong)",
        ink: "var(--colors-ink)",
        body: "var(--colors-body)",
        muted: "var(--colors-muted)",
        "btn-primary": {
          bg: "var(--btn-primary-bg)",
          fg: "var(--btn-primary-fg)",
          hover: "var(--btn-primary-hover)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Newsreader", "Georgia", "serif"],
        body: ["var(--font-body)", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      },
      keyframes: {
        editorCursorBlink: {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
        gridDraw: {
          "0%": { transform: "scaleY(0)" },
          "100%": { transform: "scaleY(1)" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(1000%)" },
        },
      },
      animation: {
        "editor-cursor": "editorCursorBlink 1.25s steps(2, start) infinite",
        "grid-draw": "gridDraw 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        scanline: "scanline 4s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
