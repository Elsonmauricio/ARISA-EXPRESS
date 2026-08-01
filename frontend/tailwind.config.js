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
        "gold-light": "#E5C158",
        brand: {
          purple: {
            500: "#8B2FC9",
            600: "#7B2FBF",
          },
          lilac: {
            200: "#F9F0FF",
            300: "#F0E6FF",
            400: "#E4D4FF",
            500: "#D4B5FF",
            600: "#B384FF",
            700: "#8B2FC9",
            DEFAULT: "#B384FF",
          },
          gold: {
            DEFAULT: "#D4AF37",
            light: "#E5C158",
          },
        },
        aero: {
          panel: "#2b1f4a",
          border: "#4b3a7a",
          muted: "#6b5b8a",
          lilas: "#DDB8FA",
          "lilas-dark": "#8B2FC9",
          gold: "#D4AF37",
        },
        lilac: {
          200: "#F9F0FF",
          300: "#F0E6FF",
          400: "#E4D4FF",
          500: "#D4B5FF",
          600: "#B384FF",
          700: "#8B2FC9",
          DEFAULT: "#B384FF",
        },
        surface: {
          DEFAULT: "#ffffff",
          muted: "#f3ecff",
          border: "#e3d9ff",
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
  plugins: [],
}