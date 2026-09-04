/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design Rules Primary Tokens
        canvas: "#f5f5f5",
        paper: "#ffffff",
        "surface-alt": "#fafafa",
        ink: "#0a0a0a",
        "ink-soft": "#171717",
        "mid-gray": "#737373",
        hairline: "#e5e5e5",
        ember: "#e7000b",

        // Status Indicators for safe (green), intermediate (yellow), and critical (ember)
        safe: {
          DEFAULT: "#10b981",
          bg: "#ecfdf5",
          border: "#a7f3d0",
          text: "#047857",
        },
        warning: {
          DEFAULT: "#f59e0b",
          bg: "#fffbeb",
          border: "#fde68a",
          text: "#b45309",
        },
        critical: {
          DEFAULT: "#e7000b",
          bg: "#fef2f2",
          border: "#fecaca",
          text: "#b91c1c",
        },

        // Monochromatic Aliases for Legacy Code compatibility
        obsidian: "#f5f5f5",
        abyss: "#fafafa",
        graphite: {
          DEFAULT: "#fafafa",
          hover: "#f0f0f0",
        },
        surface: {
          DEFAULT: "#ffffff",
          elevated: "#ffffff",
          panel: "#fafafa",
        },
        border: {
          subtle: "#e5e5e5",
          strong: "#d4d4d4",
        },
        steel: "#e5e5e5",
        silver: "#737373",
        fog: "#737373",
        ash: "#737373",
        muted: "#737373",
        cloud: "#0a0a0a",
        pure: "#0a0a0a",
        iris: {
          gleam: "#171717",
          pale: "#737373",
          deep: "#0a0a0a",
        },
        cyan: {
          signal: "#171717",
        },
        orchid: {
          bloom: "#171717",
        },
        periwinkle: "#737373",
      },
      fontFamily: {
        sans: ["Geist", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        md: "6px",
        lg: "10px",
        xl: "14px",
        "2xl": "18px",
        "3xl": "24px",
        cards: "24px",
        small: "6px",
        badges: "18px",
        inputs: "18px",
        nested: "10px",
        buttons: "18px",
      },
      boxShadow: {
        subtle: "0 0 0 1px rgba(23, 23, 23, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
        "subtle-2": "0px 0px 0px 0px",
        card: "0 0 0 1px rgba(23, 23, 23, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
        elevated: "0 0 0 1px rgba(23, 23, 23, 0.05), 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
        "glow-iris": "0 0 0 1px #e5e5e5",
        "glow-cyan": "0 0 0 1px #e5e5e5",
      },
    },
  },
  plugins: [],
};
