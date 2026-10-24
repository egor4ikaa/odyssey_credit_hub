import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF3F1',
          100: '#FFE4E0',
          200: '#FFC9C2',
          300: '#FFA39A',
          400: '#FF6B5E',
          500: '#EF3124',
          600: '#D92015',
          700: '#B8180F',
          800: '#8F130C',
          900: '#5F0D08'
        }
      },
      fontFamily: {
        display: ['Unbounded', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        glow: '0 20px 60px -20px rgba(239,49,36,0.35)',
        card: '0 8px 40px -12px rgba(239,49,36,0.18)'
      }
    }
  },
  plugins: []
};
export default config;
