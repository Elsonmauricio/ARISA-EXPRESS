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
        // --- PALETA OFICIAL ARISA EXPRESS ---
        
        // 1. Roxo Vibrante (Principal)
        purple: {
          DEFAULT: "#7B2FBF",
          vibrant: "#7B2FBF",
          light: "#8B2FC9",
        },

        // 2. Roxo Escuro (Contraste / Badges / Headers / Rodapé)
        "purple-dark": {
          DEFAULT: "#4B2170",
          solid: "#4B2170",
          medium: "#5C2D91",
        },

        // 3. Lilás / Lavanda Claro (Fundo e Decorações Suaves)
        lilac: {
          DEFAULT: "#E8D9F5",
          bg: "#E8D9F5",
          soft: "#EFE4FA",
          200: "#EFE4FA",
          300: "#E8D9F5",
          400: "#E4D4FF",
          500: "#D4B5FF",
        },

        // 4. Dourado (Acento / Selos / Moedas / Premium)
        gold: {
          DEFAULT: "#D4AF37",
          light: "#E5C158",
        },

        // --- ESTRUTURA E ELEMENTOS ANTIGOS (MAPEADOS PARA A NOVA PALETA) ---
        brand: {
          purple: {
            500: "#8B2FC9",
            600: "#7B2FBF",
            dark: "#4B2170",
          },
          lilac: {
            200: "#EFE4FA",
            300: "#E8D9F5",
            DEFAULT: "#E8D9F5",
          },
          gold: {
            DEFAULT: "#D4AF37",
            light: "#E5C158",
          },
        },
        aero: {
          panel: "#4B2170",      // Atualizado para Roxo Escuro
          border: "#5C2D91",     // Atualizado para Roxo Escuro Médio
          muted: "#7B2FBF",      // Roxo Vibrante
          lilas: "#E8D9F5",      // Lilás Fundo
          "lilas-dark": "#7B2FBF",
          gold: "#D4AF37",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#EFE4FA",      // Lavanda suave
          border: "#E8D9F5",     // Lavanda claro
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