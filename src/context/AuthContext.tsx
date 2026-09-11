import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

interface Session {
  Codigo: string
  NomeUsuario: string
  Empresa: string
  LoginUsuario: string
  ModulosUsuario: string
  hash: string
  tipoLogin: string
  dataLogin: string
}

interface AuthContextValue {
  session: Session | null
  loading: boolean
  login: (data: Omit<Session, 'dataLogin'>) => Session
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const SESSION_KEY = 'triangulation_session'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY)
      if (raw) setSession(JSON.parse(raw))
    } catch {
      sessionStorage.removeItem(SESSION_KEY)
    }
    setLoading(false)
  }, [])

  const login = (userData: Omit<Session, 'dataLogin'>) => {
    const record: Session = {
      Codigo: userData.Codigo ?? '',
      NomeUsuario: userData.NomeUsuario ?? '',
      Empresa: userData.Empresa ?? '',
      LoginUsuario: userData.LoginUsuario ?? '',
      ModulosUsuario: userData.ModulosUsuario ?? '',
      hash: userData.hash ?? '',
      tipoLogin: userData.tipoLogin ?? '',
      dataLogin: new Date().toISOString(),
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(record))
    setSession(record)
    return record
  }

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ session, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
