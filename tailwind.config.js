/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        theme: {
          bg: '#090a0f',
          surface: '#11141c',
          card: '#151923',
          cardHover: '#1a202d',
          border: '#212736',
          borderSubtle: '#181d28',
          muted: '#626d82',
          text: '#e6ebf5',
          heading: '#ffffff',
        },
        market: {
          bg: '#08090d',
          panel: '#0e1118',
          border: '#1b202c',
          amber: '#f59e0b',
          amberGlow: '#f59e0b33',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'Menlo', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
