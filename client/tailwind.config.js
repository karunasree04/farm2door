/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50:'#f0fdf4',100:'#dcfce7',200:'#bbf7d0',300:'#86efac',400:'#4ade80',500:'#22c55e',600:'#16a34a',700:'#15803d',800:'#166534',900:'#14532d' },
        farm: { orange:'#f97316', yellow:'#eab308', brown:'#92400e' }
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      animation: { 'bounce-subtle': 'bounce 1s ease-in-out 3' }
    },
  },
  plugins: [],
}
