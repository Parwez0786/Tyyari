/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: "#f97316",
        "brand-dark": "#ea580c",
        premium: "#2563eb",
        ink: "var(--ink)",
        mute: "var(--mute)",
        line: "var(--line)",
        surface: "var(--surface)",
        field: "var(--field)",
        canvas: "var(--canvas)",
        card: "var(--card)",
        easy: "#15803D",
        medium: "#2563EB",
        hard: "#DC2626",
      },
      borderRadius: {
        panel: "28px",
        card: "16px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        hand: ["Caveat", "cursive"],
      },
    },
  },
  plugins: [],
};
