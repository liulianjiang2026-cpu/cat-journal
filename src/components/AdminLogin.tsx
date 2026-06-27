import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Lock, X } from './icons'

export default function AdminLogin({ onClose }: { onClose: () => void }) {
  const { mode, loginAdmin } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (mode === 'cloud') {
        await loginAdmin(email, password)
      } else {
        await loginAdmin(password)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-5 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl bg-cream p-7 shadow-polaroid animate-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 text-coffee hover:text-ink">
          <X />
        </button>
        <div className="mb-5 flex items-center gap-2 text-ink">
          <Lock />
          <h2 className="font-hand text-2xl">管理员登录</h2>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {mode === 'cloud' && (
            <input
              className="field"
              type="email"
              placeholder="邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          )}
          <input
            className="field"
            type="password"
            placeholder={mode === 'cloud' ? '密码' : '管理密码'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus={mode === 'local'}
          />
          {error && <p className="text-sm text-rose">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? '登录中…' : '登录'}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-coffee/70">
          {mode === 'cloud' ? '使用你的 Supabase 账号登录' : '本地模式 · 仅本机管理'}
        </p>
      </div>
    </div>
  )
}
