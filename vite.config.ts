import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// 本地开发用根路径；构建到 GitHub Pages 时用子路径 /cat-journal/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/cat-journal/' : '/',
  plugins: [react()],
}))
