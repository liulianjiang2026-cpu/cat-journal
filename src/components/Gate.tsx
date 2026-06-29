import { useState } from 'react'
import { GATE_QUESTIONS, SITE, normalizeAnswer } from '../lib/config'
import { useAuth } from '../context/AuthContext'
import { Paw } from './icons'
import {
  HeartSticker,
  StarSticker,
  PawSticker,
  FishSticker,
  FlowerSticker,
  YarnSticker,
} from './stickers'

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
        {/* 手账装饰：胶带 */}
        <span className="washi-tape" />
        <span className="tape -left-4 top-12 rounded-sm text-pink" style={{ rotate: '-32deg' }} />
        <span className="tape -right-5 bottom-20 rounded-sm text-sky" style={{ rotate: '28deg' }} />

        {/* 手账装饰：手绘贴纸 */}
        <FlowerSticker className="pointer-events-none absolute -left-3 -top-3" style={{ rotate: '-16deg' }} />
        <YarnSticker className="pointer-events-none absolute right-8 -top-4" style={{ rotate: '12deg' }} />
        <FishSticker className="pointer-events-none absolute -right-4 top-24" style={{ rotate: '-8deg' }} />
        <StarSticker className="pointer-events-none absolute -left-5 bottom-28" style={{ rotate: '-12deg' }} />
        <HeartSticker className="pointer-events-none absolute -right-3 bottom-8" style={{ rotate: '14deg' }} />
        <PawSticker className="pointer-events-none absolute left-6 -bottom-4" style={{ rotate: '10deg' }} />

        <div className="relative text-center">
          <div className="relative mx-auto mb-3 h-28 w-28">
            <img
              src={`${import.meta.env.BASE_URL}qiuqiu.png`}
              alt={SITE.catName}
              className="h-28 w-28 rounded-full object-cover shadow-polaroid ring-4 ring-white"
            />
            <span className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-rose/90 text-cream shadow">
              <Paw width={18} height={18} />
            </span>
          </div>
          <h1 className="font-script text-5xl leading-tight text-ink">{SITE.title}</h1>
          {SITE.subtitle && <p className="mt-1 text-sm text-coffee">{SITE.subtitle}</p>}
        </div>

        <form onSubmit={submit} className="relative mt-6 space-y-4">
          {GATE_QUESTIONS.map((qa, i) => (
            <div key={i}>
              <label className="mb-1 block font-cute text-base text-ink/80">{qa.q}</label>
              <input
                className="field text-center font-cute text-lg"
                value={answers[i]}
                onChange={(e) => {
                  const next = [...answers]
                  next[i] = e.target.value
                  setAnswers(next)
                  setError('')
                }}
                placeholder="喵？"
                autoFocus={i === 0}
              />
            </div>
          ))}
          {error && <p className="text-center font-cute text-sm text-rose">{error}</p>}
          <button type="submit" className="btn-primary w-full font-cute text-lg tracking-wide">
            喵喵喵！🐾
          </button>
        </form>
      </div>
      <style>{`@keyframes shake{0%,100%{transform:rotate(-1deg) translateX(0)}25%{transform:rotate(-1deg) translateX(-6px)}75%{transform:rotate(-1deg) translateX(6px)}}`}</style>
    </div>
  )
}
