/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: "#f97316",
        "brand-dark": "#ea580c",
        ink: "var(--ink)",
        mute: "var(--mute)",
        line: "var(--line)",
        surface: "var(--surface)",
        field: "var(--field)",
        easy: "#15803D",
        hard: "#DC2626",
      },
      borderRadius: {
        panel: "28px",
        card: "16px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
