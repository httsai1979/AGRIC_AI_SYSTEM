/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        agric: {
          neon: '#00FF00',
          black: '#000000',
          gray: '#1A1A1A',
        }
      },
      height: {
        'muddy': '120px',
      },
      minHeight: {
        'muddy': '120px',
      }
    },
  },
  plugins: [],
}
