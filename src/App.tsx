import { AuthProvider, useAuth } from './context/AuthContext'
import Gate from './components/Gate'
import Gallery from './components/Gallery'

function Shell() {
  const { unlocked, isAdmin, ready } = useAuth()
  if (!ready) {
    return (
      <div className="flex min-h-full items-center justify-center font-hand text-2xl text-coffee/60">
        加载中…
      </div>
    )
  }
  // admin is always let through; visitors must pass the gate first
  if (!unlocked && !isAdmin) return <Gate />
  return <Gallery />
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  )
}
