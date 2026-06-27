import { useState } from 'react'
import { GATE_QUESTIONS, SITE, normalizeAnswer } from '../lib/config'
import { useAuth } from '../context/AuthContext'
import { Paw } from './icons'

export default function Gate() {
  const { unlockGate } = useAuth()
  const [answers, setAnswers] = useState<string[]>(() => GATE_QUESTIONS.map(() => ''))
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const allCorrect = GATE_QUESTIONS.every((qa, i) =>
      qa.answers.some((a) => normalizeAnswer(a) === normalizeAnswer(answers[i] || '')),
    )
    if (allCorrect) {
      unlockGate()
    } else {
      setError('暗号好像不对哦，再想想～ 🐱')
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div className="min-h-full bg-dots flex items-center justify-center p-5">
      <div
        className={`relative w-full max-w-md rounded-[28px] bg-cream p-8 shadow-polaroid animate-pop ${
          shake ? 'animate-[shake_0.4s]' : ''
        }`}
        style={{ transform: 'rotate(-1deg)' }}
      >
        <span className="washi-tape" />
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-rose/20 text-rose">
            <Paw width={30} height={30} />
          </div>
          <h1 className="font-hand text-3xl text-ink">{SITE.title}</h1>
          <p className="mt-1 text-sm text-coffee">{SITE.subtitle}</p>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {GATE_QUESTIONS.map((qa, i) => (
            <div key={i}>
              <label className="mb-1 block text-sm text-ink/80">{qa.q}</label>
              <input
                className="field"
                value={answers[i]}
                onChange={(e) => {
                  const next = [...answers]
                  next[i] = e.target.value
                  setAnswers(next)
                  setError('')
                }}
                placeholder="在这里输入答案…"
                autoFocus={i === 0}
              />
            </div>
          ))}
          {error && <p className="text-sm text-rose">{error}</p>}
          <button type="submit" className="btn-primary w-full">
            进入手账 🐾
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-coffee/70">仅限好朋友进入 · 答对暗号即可浏览</p>
      </div>
      <style>{`@keyframes shake{0%,100%{transform:rotate(-1deg) translateX(0)}25%{transform:rotate(-1deg) translateX(-6px)}75%{transform:rotate(-1deg) translateX(6px)}}`}</style>
    </div>
  )
}
