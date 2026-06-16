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
    const stored = getStoredUser()
    if (stored) {
      setUserState(stored)
    }
    setLoading(false)
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
