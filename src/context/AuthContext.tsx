import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { backend } from '../lib/backend'

const GATE_KEY = 'cat-journal:gateUnlocked'

interface AuthState {
  /** running mode for UI hints */
  mode: 'local' | 'cloud'
  /** visitor passed the Q&A gate */
  unlocked: boolean
  /** admin (owner) is logged in — can edit */
  isAdmin: boolean
  ready: boolean
  unlockGate: () => void
  loginAdmin: (a: string, b?: string) => Promise<void>
  logoutAdmin: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem(GATE_KEY) === '1')
  const [isAdmin, setIsAdmin] = useState(false)
  const [ready, setReady] = useState(false)

  const refreshAdmin = useCallback(async () => {
    setIsAdmin(await backend.isAdmin())
  }, [])

  useEffect(() => {
    refreshAdmin().finally(() => setReady(true))
    const off = backend.onAuthChange(refreshAdmin)
    return off
  }, [refreshAdmin])

  const unlockGate = useCallback(() => {
    localStorage.setItem(GATE_KEY, '1')
    setUnlocked(true)
  }, [])

  const loginAdmin = useCallback(
    async (a: string, b?: string) => {
      await backend.loginAdmin(a, b)
      await refreshAdmin()
    },
    [refreshAdmin],
  )

  const logoutAdmin = useCallback(async () => {
    await backend.logoutAdmin()
    await refreshAdmin()
  }, [refreshAdmin])

  return (
    <AuthContext.Provider
      value={{
        mode: backend.mode,
        unlocked,
        isAdmin,
        ready,
        unlockGate,
        loginAdmin,
        logoutAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
