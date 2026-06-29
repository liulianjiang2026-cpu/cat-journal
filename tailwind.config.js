/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#efe7d6',
        cream: '#fbf8f0',
        ink: '#4a4036',
        coffee: '#8a7a66',
        tape: '#ecd9a8',
        rose: '#e8a7a1',
        sage: '#bccaa6',
        // 参考1 马卡龙色（贴纸/胶带用）
        peach: '#f8dcc0',
        sky: '#aecfe2',
        pink: '#f4c2d6',
        lemon: '#f0e3a0',
        lilac: '#cabfe4',
        clay: '#dca083',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        hand: ['"Ma Shan Zheng"', '"Gaegu"', 'cursive'],
        cute: ['"ZCOOL KuaiLe"', '"Gaegu"', '"Ma Shan Zheng"', 'cursive'],
        script: ['"Great Vibes"', '"Pinyon Script"', 'cursive'],
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
