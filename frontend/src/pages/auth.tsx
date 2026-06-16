import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SignInPage } from '@/components/ui/sign-in-flow-1'
import { useAuth } from '@/lib/auth-context'
import { login as apiLogin, register as apiRegister, totpVerifyLogin } from '@/lib/api'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [totpRequired, setTotpRequired] = useState(false)
  const [totpUserId, setTotpUserId] = useState(0)
  const [totpCode, setTotpCode] = useState('')

  const handleLogin = async ({ email, password }: { email: string; password: string }) => {
    setLoading(true)
    setError('')
    try {
      const res = await apiLogin(email, password)
      if ('totp_required' in res) {
        setTotpRequired(true)
        setTotpUserId(res.user_id)
        setLoading(false)
        return
      }
      login(res.token, res.refresh_token, res.user)
      navigate('/dashboard')
    } catch (e: any) {
      setError(e.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (totpCode.length < 6) return
    setLoading(true)
    setError('')
    try {
      const res = await totpVerifyLogin(totpUserId, totpCode)
      login(res.token, res.refresh_token, res.user)
      navigate('/dashboard')
    } catch (e: any) {
      setError(e.message || 'Código inválido')
    } finally {
      setLoading(false)
    }
  }

  if (totpRequired) {
    return (
      <div className="flex w-full flex-col min-h-screen bg-black relative items-center justify-center">
        <div className="w-full max-w-sm px-6">
          <div className="space-y-6 text-center">
            <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">2FA</h1>
            <p className="text-white/50">Introduce el código de tu aplicación de autenticación</p>
            {error && (
              <div className="rounded-full bg-red-500/10 border border-red-500/20 px-6 py-3 text-sm text-red-400">{error}</div>
            )}
            <form onSubmit={handleTotpSubmit} className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full bg-white/5 border border-white/10 rounded-full py-3 px-4 text-white text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-white/30 placeholder:text-white/20"
                autoFocus
              />
              <button type="submit" disabled={loading || totpCode.length < 6}
                className="w-full rounded-full bg-white text-black font-medium py-3 hover:bg-white/90 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Verificando...' : 'Verificar'}
              </button>
            </form>
            <button onClick={() => { setTotpRequired(false); setTotpCode(''); setError('') }}
              className="text-sm text-zinc-500 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
            >
              Volver al inicio de sesión
            </button>
          </div>
        </div>
      </div>
    )
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
