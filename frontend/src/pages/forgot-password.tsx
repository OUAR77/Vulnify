import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiForgotPassword } from '@/lib/api'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await apiForgotPassword(email)
      setDone(true)
    } catch (e: any) {
      setError(e.message || 'Error al enviar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex w-full flex-col min-h-screen bg-black relative items-center justify-center">
      <div className="w-full max-w-sm px-6">
        <div className="space-y-6 text-center">
          {done ? (
            <>
              <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">Revisa tu email</h1>
              <p className="text-white/50">Si el email existe, recibirás un enlace para restablecer tu contraseña.</p>
              <button onClick={() => navigate('/login')}
                className="w-full rounded-full bg-white text-black font-medium py-3 hover:bg-white/90 transition-colors cursor-pointer"
              >
                Volver al inicio de sesión
              </button>
            </>
          ) : (
            <>
              <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">Restablecer contraseña</h1>
              <p className="text-white/50">Te enviaremos un enlace a tu email.</p>
              {error && (
                <div className="rounded-full bg-red-500/10 border border-red-500/20 px-6 py-3 text-sm text-red-400">{error}</div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-full py-3 px-4 text-white text-center focus:outline-none focus:border-white/30 placeholder:text-white/30"
                  required
                  autoFocus
                />
                <button type="submit" disabled={loading}
                  className="w-full rounded-full bg-white text-black font-medium py-3 hover:bg-white/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Enviando...' : 'Enviar enlace'}
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
