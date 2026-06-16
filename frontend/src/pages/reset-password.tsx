import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiResetPassword } from '@/lib/api'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setLoading(true)
    setError('')
    try {
      await apiResetPassword(token, password)
      setDone(true)
    } catch (e: any) {
      setError(e.message || 'Error al restablecer la contraseña')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="flex w-full flex-col min-h-screen bg-black relative items-center justify-center">
        <div className="w-full max-w-sm px-6 text-center space-y-4">
          <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">Enlace inválido</h1>
          <p className="text-white/50">El enlace de restablecimiento no es válido o ha expirado.</p>
          <button onClick={() => navigate('/login')}
            className="w-full rounded-full bg-white text-black font-medium py-3 hover:bg-white/90 transition-colors cursor-pointer"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col min-h-screen bg-black relative items-center justify-center">
      <div className="w-full max-w-sm px-6">
        <div className="space-y-6 text-center">
          {done ? (
            <>
              <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">Contraseña actualizada</h1>
              <p className="text-white/50">Tu contraseña se ha restablecido correctamente.</p>
              <button onClick={() => navigate('/login')}
                className="w-full rounded-full bg-white text-black font-medium py-3 hover:bg-white/90 transition-colors cursor-pointer"
              >
                Iniciar sesión
              </button>
            </>
          ) : (
            <>
              <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">Nueva contraseña</h1>
              <p className="text-white/50">Elige una contraseña nueva.</p>
              {error && (
                <div className="rounded-full bg-red-500/10 border border-red-500/20 px-6 py-3 text-sm text-red-400">{error}</div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nueva contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-full py-3 px-4 text-white text-center focus:outline-none focus:border-white/30 placeholder:text-white/30"
                    required
                    minLength={6}
                    autoFocus
                  />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirmar contraseña"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-full py-3 px-4 text-white text-center focus:outline-none focus:border-white/30 placeholder:text-white/30"
                  required
                  minLength={6}
                />
                <label className="flex items-center justify-center gap-2 text-sm text-white/40">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="accent-white"
                  />
                  Mostrar contraseñas
                </label>
                <button type="submit" disabled={loading}
                  className="w-full rounded-full bg-white text-black font-medium py-3 hover:bg-white/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Guardando...' : 'Guardar contraseña'}
                </button>
              </form>
              <button onClick={() => navigate('/login')}
                className="text-sm text-zinc-500 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
              >
                Volver al inicio de sesión
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
