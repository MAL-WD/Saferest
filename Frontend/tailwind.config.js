/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#ACEC00',
          blue: '#013ff6',
          'bg-dark': '#00182E',
          'bg-deeper': '#001020',
          'bg-panel': '#0a2440',
          'bg-card': '#0d2d4d',
          'bg-card-hover': '#123a62',
        },
      },
      borderRadius: {
        shell: '40px',
        card: '24px',
        pill: '9999px',
      },
      fontFamily: {
        display: ['Onest', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

