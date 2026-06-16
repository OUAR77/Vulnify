import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from './api'
import { getStoredUser, setUser as storeUser, clearAuth, setToken, setRefreshToken } from './api'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (token: string, refreshToken: string, user: User) => void
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(getStoredUser)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      setLoading(true)
      const stored = getStoredUser()
      if (stored) {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/me`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('vulnify_token')}` },
          })
          if (res.ok) {
            const fresh = await res.json()
            const freshUser: User = { id: fresh.id, name: fresh.name, email: fresh.email, role: fresh.role, is_verified: fresh.is_verified, totp_enabled: fresh.totp_enabled, company: fresh.company, bio: fresh.bio, dark_mode: fresh.dark_mode, created_at: fresh.created_at }
            storeUser(freshUser)
            setUserState(freshUser)
            setLoading(false)
            return
          }
        } catch {}
        setUserState(stored)
      }
      setLoading(false)
    })()
  }, [])

  const login = (token: string, refreshToken: string, user: User) => {
    setToken(token)
    setRefreshToken(refreshToken)
    storeUser(user)
    setUserState(user)
  }

  const logout = () => {
    clearAuth()
    setUserState(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
