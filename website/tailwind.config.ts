import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#050816",
        panel: "rgba(9, 16, 36, 0.72)",
        neon: {
          cyan: "#38bdf8",
          violet: "#8b5cf6",
          pink: "#ec4899"
        }
      },
      boxShadow: {
        glow: "0 0 80px rgba(56, 189, 248, 0.2)"
      },
      backgroundImage: {
        "radial-glow":
          "radial-gradient(circle at top, rgba(56,189,248,0.24), transparent 38%), radial-gradient(circle at bottom right, rgba(139,92,246,0.18), transparent 28%)"
      }
    }
  },
  plugins: []
};

export default config;