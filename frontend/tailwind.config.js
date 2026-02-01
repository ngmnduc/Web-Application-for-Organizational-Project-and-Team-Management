/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "var(--color-brand)",
      },
      backgroundImage: {
        'background': "url('/src/assets/images/background.png')",
        'background2': "url('/src/assets/images/backgroundlight.png')",

      },
    },
  },
  plugins: [],
};
