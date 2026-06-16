import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useNavigate } from 'react-router-dom'
import { totpSetup, totpEnable, totpDisable } from '@/lib/api'
import { User, LogOut, Mail, Calendar, ArrowLeft, ShieldAlert, Smartphone, Check, X } from 'lucide-react'

export function DashboardPage() {
  const { user, logout, isAuthenticated, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [totpMode, setTotpMode] = useState<'idle' | 'setup' | 'disable'>('idle')
  const [totpQr, setTotpQr] = useState('')
  const [totpSecret, setTotpSecret] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [totpLoading, setTotpLoading] = useState(false)
  const [totpError, setTotpError] = useState('')

  if (!isAuthenticated) {
    navigate('/login')
    return null
  }

  const handleTotpSetup = async () => {
    setTotpLoading(true)
    setTotpError('')
    try {
      const res = await totpSetup()
      setTotpQr(res.qr_b64)
      setTotpSecret(res.secret)
      setTotpMode('setup')
    } catch (e: any) {
      setTotpError(e.message)
    } finally {
      setTotpLoading(false)
    }
  }

  const handleTotpEnable = async () => {
    if (totpCode.length < 6) return
    setTotpLoading(true)
    setTotpError('')
    try {
      await totpEnable(totpCode)
      setTotpMode('idle')
      setTotpQr('')
      setTotpCode('')
      window.location.reload()
    } catch (e: any) {
      setTotpError(e.message)
    } finally {
      setTotpLoading(false)
    }
  }

  const handleTotpDisable = async () => {
    if (totpCode.length < 6) return
    setTotpLoading(true)
    setTotpError('')
    try {
      await totpDisable(totpCode)
      setTotpMode('idle')
      setTotpCode('')
      window.location.reload()
    } catch (e: any) {
      setTotpError(e.message)
    } finally {
      setTotpLoading(false)
    }
  }

  const totpEnabled = user?.totp_enabled

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-3xl font-bold tracking-tight">Mi panel</h1>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')}
              className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors bg-transparent border border-white/[0.06] rounded-lg px-4 py-2 cursor-pointer">
              <ArrowLeft className="size-4" /> Volver a la web
            </button>
            {isAdmin && (
              <button onClick={() => navigate('/admin')}
                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors bg-transparent border border-blue-500/20 rounded-lg px-4 py-2 cursor-pointer">
                <ShieldAlert className="size-4" /> Panel Admin
              </button>
            )}
            <button onClick={() => { logout(); navigate('/') }}
              className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors bg-transparent border border-white/[0.06] rounded-lg px-4 py-2 cursor-pointer">
              <LogOut className="size-4" /> Cerrar sesión
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="size-14 rounded-full bg-zinc-800 flex items-center justify-center">
              <User className="size-6 text-zinc-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user?.name}</h2>
              <p className="text-sm text-zinc-500">{user?.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-zinc-500">
              <Mail className="size-4" />
              {user?.email}
            </div>
            <div className="flex items-center gap-2 text-zinc-500">
              <Calendar className="size-4" />
              Rol: {user?.role}
            </div>
          </div>
        </div>

        {/* 2FA Section */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Smartphone className="size-5 text-zinc-500" />
              <h3 className="text-lg font-semibold">Autenticación en dos pasos (2FA)</h3>
            </div>
            {totpEnabled ? (
              <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 px-3 py-1 rounded-full">
                <Check className="size-3" /> Activado
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-zinc-500 bg-white/5 px-3 py-1 rounded-full">
                <X className="size-3" /> Desactivado
              </span>
            )}
          </div>

          {totpMode === 'setup' && totpQr && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">Escanea este código QR con Google Authenticator o similar:</p>
              <div className="flex justify-center">
                <img src={`data:image/png;base64,${totpQr}`} alt="2FA QR Code" className="rounded-lg bg-white p-2 w-48 h-48" />
              </div>
              <p className="text-xs text-zinc-500 text-center">O ingresa manualmente: <code className="text-zinc-300 bg-white/5 px-2 py-0.5 rounded">{totpSecret}</code></p>
              <div className="flex gap-3 justify-center">
                <input type="text" inputMode="numeric" placeholder="000000" maxLength={6}
                  value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-40 bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white text-center text-lg tracking-[0.3em] focus:outline-none focus:border-white/30 placeholder:text-white/20" autoFocus />
                <button onClick={handleTotpEnable} disabled={totpLoading || totpCode.length < 6}
                  className="px-6 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50 cursor-pointer border-none">
                  {totpLoading ? 'Verificando...' : 'Activar'}
                </button>
              </div>
              {totpError && <p className="text-sm text-red-400 text-center">{totpError}</p>}
              <button onClick={() => setTotpMode('idle')}
                className="block mx-auto text-sm text-zinc-500 hover:text-white transition-colors bg-transparent border-none cursor-pointer">Cancelar</button>
            </div>
          )}

          {totpMode === 'disable' && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">Introduce tu código 2FA para desactivarlo:</p>
              <div className="flex gap-3 justify-center">
                <input type="text" inputMode="numeric" placeholder="000000" maxLength={6}
                  value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-40 bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white text-center text-lg tracking-[0.3em] focus:outline-none focus:border-white/30 placeholder:text-white/20" autoFocus />
                <button onClick={handleTotpDisable} disabled={totpLoading || totpCode.length < 6}
                  className="px-6 py-2.5 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50 cursor-pointer border-none">
                  {totpLoading ? 'Desactivando...' : 'Desactivar'}
                </button>
              </div>
              {totpError && <p className="text-sm text-red-400 text-center">{totpError}</p>}
              <button onClick={() => { setTotpMode('idle'); setTotpCode(''); setTotpError('') }}
                className="block mx-auto text-sm text-zinc-500 hover:text-white transition-colors bg-transparent border-none cursor-pointer">Cancelar</button>
            </div>
          )}

          {totpMode === 'idle' && (
            <button onClick={totpEnabled ? () => setTotpMode('disable') : handleTotpSetup} disabled={totpLoading}
              className="mt-2 px-5 py-2.5 text-sm rounded-lg border border-white/[0.1] text-zinc-300 hover:text-white hover:border-white/30 transition-colors disabled:opacity-50 cursor-pointer bg-transparent">
              {totpEnabled ? 'Desactivar 2FA' : 'Configurar 2FA'}
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-6 text-center">
            <div className="text-3xl font-bold text-zinc-600 mb-1">0</div>
            <div className="text-xs text-zinc-600 uppercase tracking-wider">Proyectos</div>
          </div>
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-6 text-center">
            <div className="text-3xl font-bold text-zinc-600 mb-1">0</div>
            <div className="text-xs text-zinc-600 uppercase tracking-wider">Mensajes</div>
          </div>
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-6 text-center">
            <div className="text-3xl font-bold text-zinc-600 mb-1">-</div>
            <div className="text-xs text-zinc-600 uppercase tracking-wider">Pedido activo</div>
          </div>
        </div>
      </div>
    </div>
  )
}
