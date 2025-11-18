/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        ibm: ["var(--font-ibm-arabic)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
