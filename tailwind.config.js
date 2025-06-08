/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          /*
          light: '#A78BFA',
          DEFAULT: '#7C3AED',
          dark: '#6D28D9',
          */
          light: '#60A5FA',
          DEFAULT: '#3B82F6',
          dark: '#2563EB',
        },
        secondary: {
          light: '#A5B4FC',
          DEFAULT: '#818CF8',
          dark: '#6366F1',
        },
        background: {
          light: '#FFFFFF',
          dark: '#1A1B1E',
        },
        surface: {
          light: '#F3F4F6',
          dark: '#242428',
        },
      },
      boxShadow: {
        'neomorphic-light': '20px 20px 60px #d1d9e6, -20px -20px 60px #ffffff',
        'neomorphic-dark': '20px 20px 60px #1a1b1e, -20px -20px 60px #2d2e32',
        'neomorphic-light-hover': '5px 5px 15px #d1d9e6, 15px 15px 30px #ffffff',
        'neomorphic-dark-hover': '-5px -5px 15px #1a1b1e, -15px -15px 30px #2d2e32',
      },
    },
  },
  plugins: [],
};
