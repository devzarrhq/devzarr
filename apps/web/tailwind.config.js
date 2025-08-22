const path = require("path");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    path.join(__dirname, "app/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(__dirname, "components/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(__dirname, "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}"),
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          blue: "#3b82f6",
          green: "#22c55e",
          purple: "#a21caf",
          orange: "#f59e42",
          red: "#ef4444",
          teal: "#14b8a6",
          yellow: "#eab308",
          pink: "#ec4899",
        }
      }
    },
  },
  plugins: [],
}