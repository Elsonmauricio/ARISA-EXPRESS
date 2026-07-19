/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Syne', 'Inter', 'sans-serif'],
        data: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        gold: "#D4AF37",
        aero: {
          black: "#08080a",
          panel: "#0f0f14",
          border: "#221f2d",
          muted: "#9e9cb0",
          lilas: "#a855f7",
          'lilas-dark': "#3b185f",
          gold: "#f59e0b",
        },
        lilac: {
          300: "#BE93FF",
          500: "#7C3AED",
          700: "#5B21B6",
        }
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { opacity: 1, filter: 'brightness(1)' },
          '50%': { opacity: 0.7, filter: 'brightness(1.2)' },
        }
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}