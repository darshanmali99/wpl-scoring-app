/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neonGreen: '#39ff14',
        neonBlue: '#00ffff',
        darkSurface: '#1a1a1a',
        darkBackground: '#0a0a0a',
      }
    },
  },
  plugins: [],
}
