/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/page.tsx",
    "./app/layout.tsx"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}