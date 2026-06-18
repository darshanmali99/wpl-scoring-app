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
      },
      keyframes: {
        'bat-swing': {
          '0%': { transform: 'rotate(-45deg)' },
          '100%': { transform: 'rotate(45deg)' },
        },
        'ball-fly': {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '100%': { transform: 'translate(150px, -150px) scale(0)' },
        }
      },
      animation: {
        'bat-swing': 'bat-swing 0.3s ease-out forwards',
        'ball-fly': 'ball-fly 0.5s ease-out forwards',
      }
    },
  },
  plugins: [],
}
