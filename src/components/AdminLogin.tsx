import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { X } from './icons'
import { PawSticker, HeartSticker, StarSticker } from './stickers'

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
        {/* 手账装饰 */}
        <span className="washi-tape" />
        <PawSticker className="pointer-events-none absolute -left-3 -top-3" style={{ rotate: '-14deg' }} size={38} />
        <HeartSticker className="pointer-events-none absolute -right-3 top-16" style={{ rotate: '16deg' }} size={36} />
        <StarSticker className="pointer-events-none absolute -bottom-3 left-8" style={{ rotate: '-10deg' }} size={34} />

        <button onClick={onClose} className="absolute right-4 top-4 text-coffee hover:text-ink">
          <X />
        </button>

        <h2 className="mb-6 mt-2 text-center font-script text-5xl text-ink">Meow?</h2>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'cloud' && (
            <input
              className="field font-cute text-center text-lg"
              type="email"
              placeholder="喵喵喵@喵喵？"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          )}
          <input
            className="field font-cute text-center text-lg"
            type="password"
            placeholder="喵喵喵喵喵！"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus={mode === 'local'}
          />
          {error && <p className="font-cute text-sm text-rose">{error}</p>}
          <button type="submit" className="btn-primary w-full font-cute text-lg tracking-wide" disabled={busy}>
            {busy ? '…' : '喵？！'}
          </button>
        </form>
      </div>
    </div>
  )
}
