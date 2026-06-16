import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { verifyEmail } from '@/lib/api'
import { Check, X, Loader2 } from 'lucide-react'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage('Enlace de verificación inválido.')
      return
    }
    verifyEmail(token)
      .then(res => {
        setStatus('success')
        setMessage(res.message || 'Email verificado correctamente')
      })
      .catch(err => {
        setStatus('error')
        setMessage(err.message || 'Error al verificar el email')
      })
  }, [searchParams])

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center max-w-sm px-6">
        {status === 'loading' && (
          <div className="space-y-4">
            <Loader2 className="size-10 mx-auto animate-spin text-zinc-500" />
            <p className="text-zinc-400">Verificando tu email...</p>
          </div>
        )}
        {status === 'success' && (
          <div className="space-y-4">
            <div className="size-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <Check className="size-7 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold">Email verificado</h1>
            <p className="text-zinc-400">{message}</p>
            <button onClick={() => navigate('/login')}
              className="mt-4 px-6 py-3 rounded-full bg-white text-black font-medium hover:bg-white/90 transition-colors cursor-pointer border-none">
              Iniciar sesión
            </button>
          </div>
        )}
        {status === 'error' && (
          <div className="space-y-4">
            <div className="size-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
              <X className="size-7 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold">Error</h1>
            <p className="text-zinc-400">{message}</p>
            <button onClick={() => navigate('/login')}
              className="mt-4 px-6 py-3 rounded-full bg-white text-black font-medium hover:bg-white/90 transition-colors cursor-pointer border-none">
              Volver
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
