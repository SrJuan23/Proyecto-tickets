/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#0945F7',
          'primary-hover': '#0738cc',
          'primary-light': '#EDF0FF',
          dark: '#19255A',
          'dark-hover': '#131c44',
          cyan: '#00CDE2',
          'cyan-dark': '#00A8B8',
          'cyan-light': '#E6FAFC',
          bg: '#F7F8FD',
          surface: '#FFFFFF',
          border: '#D7E2FF',
          'border-subtle': '#E2E8F0',
          accent1: '#5B53FF',
          accent2: '#3B4779',
          accent3: '#006671',
          accent4: '#001F90'
        }
      },
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
        lato: ['Lato', 'sans-serif']
      },
      boxShadow: {
        'card': '0 2px 10px rgba(25, 37, 90, 0.04), 0 1px 3px rgba(25, 37, 90, 0.02)',
        'card-hover': '0 10px 25px -5px rgba(25, 37, 90, 0.08), 0 8px 10px -6px rgba(25, 37, 90, 0.04)',
        'modal': '0 20px 25px -5px rgba(25, 37, 90, 0.2), 0 10px 10px -5px rgba(25, 37, 90, 0.1)',
        'brand': '0 4px 14px rgba(9, 69, 247, 0.3)'
      }
    },
  },
  plugins: [],
}
