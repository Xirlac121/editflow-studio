/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        lime: {
          accent: '#D9F950',
          hover: '#CCF035',
          muted: 'rgba(217, 249, 80, 0.14)',
        },
        violet: {
          accent: '#B278FF',
          hover: '#9F5BFF',
          muted: 'rgba(178, 120, 255, 0.15)',
        },
        tangerine: {
          accent: '#EE7D26',
          muted: 'rgba(238, 125, 38, 0.16)',
        },
        obsidian: {
          950: '#0B0C0F',
          900: '#111318',
          800: '#181B22',
          700: '#222631',
          600: '#2E3342',
        },
      },
      spacing: {
        '4.5': '1.125rem',
        '13': '3.25rem',
        '68': '17rem',
      },
      backdropBlur: {
        xs: '3px',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        xs: '0 2px 8px -2px rgba(0, 0, 0, 0.08)',
        'glow-lime': '0 8px 30px -6px rgba(217, 249, 80, 0.35)',
        'glow-violet': '0 8px 30px -6px rgba(178, 120, 255, 0.3)',
        'card-dark': '0 10px 30px -10px rgba(0, 0, 0, 0.55)',
      },
    },
  },
  plugins: [],
};
