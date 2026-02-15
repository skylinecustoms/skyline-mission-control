import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"] ,
  theme: {
    extend: {
      colors: {
        "mc-black": "#08090A",
        "mc-graphite": "#121418",
        "mc-steel": "#1B1F26",
        "mc-ember": "#C33A2C",
        "mc-amber": "#F0A500",
        "mc-emerald": "#1EE7A0",
        "mc-ice": "#6EC1FF"
      },
      boxShadow: {
        "soft-glow": "0 0 30px rgba(110, 193, 255, 0.12)",
        "ember-glow": "0 0 35px rgba(195, 58, 44, 0.2)"
      },
      backgroundImage: {
        "grid-fade": "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)",
        "carbon": "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 50%)"
      },
      keyframes: {
        "soft-pulse": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" }
        },
        "float-in": {
          "0%": { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        }
      },
      animation: {
        "soft-pulse": "soft-pulse 3s ease-in-out infinite",
        "float-in": "float-in 0.6s ease-out"
      }
    },
  },
  plugins: [],
};

export default config;
