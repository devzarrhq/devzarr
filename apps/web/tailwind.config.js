/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/page.tsx",
    "./app/layout.tsx",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}