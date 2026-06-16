import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SignInPage } from '@/components/ui/sign-in-flow-1'
import { useAuth } from '@/lib/auth-context'
import { login as apiLogin, register as apiRegister } from '@/lib/api'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async ({ email, password }: { email: string; password: string }) => {
    setLoading(true)
    setError('')
    try {
      const res = await apiLogin(email, password)
      login(res.token, res.refresh_token, res.user)
      navigate('/dashboard')
    } catch (e: any) {
      setError(e.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SignInPage
      mode="login"
      onSubmit={handleLogin}
      onSwitchMode={() => navigate('/register')}
      loading={loading}
      error={error}
    />
  )
}

export function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async ({ name, email, password }: { name?: string; email: string; password: string }) => {
    if (!name) return
    setLoading(true)
    setError('')
    try {
      const res = await apiRegister(name, email, password)
      login(res.token, res.refresh_token, res.user)
      navigate('/dashboard')
    } catch (e: any) {
      setError(e.message || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SignInPage
      mode="register"
      onSubmit={handleRegister}
      onSwitchMode={() => navigate('/login')}
      loading={loading}
      error={error}
    />
  )
}
