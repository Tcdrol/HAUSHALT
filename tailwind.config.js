/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
    "./utils/**/*.{js,jsx,ts,tsx}",
    "./contexts/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Modern primary palette - Teal/Cyan
        primary: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
          DEFAULT: "#14b8a6",
          light: "#14b8a6",
          dark: "#2dd4bf",
        },
        // Modern background colors
        background: {
          DEFAULT: "#0f172a",
          light: "#f8fafc",
          dark: "#0f172a",
          secondary: {
            DEFAULT: "#1e293b",
            light: "#f1f5f9",
            dark: "#1e293b",
          },
        },
        // Surface colors for cards
        surface: {
          DEFAULT: "#1e293b",
          light: "#ffffff",
          dark: "#1e293b",
          elevated: {
            DEFAULT: "#334155",
            light: "#ffffff",
            dark: "#334155",
          },
        },
        // Card backgrounds
        card: {
          DEFAULT: "#1e293b",
          light: "#ffffff",
          dark: "#1e293b",
        },
        // Text colors
        text: {
          DEFAULT: "#f8fafc",
          light: "#0f172a",
          dark: "#f8fafc",
          secondary: {
            DEFAULT: "#94a3b8",
            light: "#64748b",
            dark: "#94a3b8",
          },
          muted: {
            DEFAULT: "#64748b",
            light: "#94a3b8",
            dark: "#64748b",
          },
        },
        // Border colors
        border: {
          DEFAULT: "#334155",
          light: "#e2e8f0",
          dark: "#334155",
        },
        // Semantic colors
        success: {
          DEFAULT: "#22c55e",
          light: "#16a34a",
          dark: "#4ade80",
        },
        warning: {
          DEFAULT: "#f59e0b",
          light: "#d97706",
          dark: "#fbbf24",
        },
        error: {
          DEFAULT: "#ef4444",
          light: "#dc2626",
          dark: "#f87171",
        },
        info: {
          DEFAULT: "#3b82f6",
          light: "#2563eb",
          dark: "#60a5fa",
        },
        // Category colors
        category: {
          groceries: "#10b981",
          transport: "#f59e0b",
          utilities: "#ef4444",
          rent: "#8b5cf6",
          personal: "#ec4899",
          airtime: "#3b82f6",
          entertainment: "#f97316",
          health: "#06b6d4",
          education: "#6366f1",
          other: "#6b7280",
        },
      },
      fontFamily: {
        sans: ["System"],
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        DEFAULT: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "32px",
        full: "9999px",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        DEFAULT: "16px",
        lg: "20px",
        xl: "24px",
        "2xl": "32px",
        "3xl": "48px",
        "4xl": "64px",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        DEFAULT: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
        none: "none",
      },
    },
  },
  plugins: [],
};
