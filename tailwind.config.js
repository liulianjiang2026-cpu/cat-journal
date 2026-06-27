/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#f5ecd9',
        cream: '#fbf6ea',
        ink: '#4a3f35',
        coffee: '#7a6a58',
        tape: '#e9d9a6',
        rose: '#e8a7a1',
        sage: '#a9bba0',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        hand: ['"Ma Shan Zheng"', '"Gaegu"', 'cursive'],
        cute: ['"Gaegu"', '"Ma Shan Zheng"', 'cursive'],
      },
      boxShadow: {
        polaroid: '0 10px 25px -8px rgba(74,63,53,0.35), 0 2px 6px rgba(74,63,53,0.15)',
        card: '0 6px 18px -6px rgba(74,63,53,0.25)',
      },
      backgroundImage: {
        'paper-texture':
          "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.5) 0, rgba(255,255,255,0) 40%), radial-gradient(circle at 80% 0%, rgba(233,217,166,0.35) 0, rgba(233,217,166,0) 35%)",
      },
    },
  },
  plugins: [],
}
