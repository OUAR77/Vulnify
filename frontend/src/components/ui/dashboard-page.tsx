import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useNavigate } from 'react-router-dom'
import { totpSetup, totpEnable, totpDisable, setUser as storeUser, getStoredUser } from '@/lib/api'
import {
  User, LogOut, Mail, Calendar, ArrowLeft, ShieldAlert, Smartphone, Check, X,
  Key, Copy, Eye, EyeOff, RefreshCw, Moon, Sun, FileText, Package, PenSquare,
  Save, Trash2, Plus, ExternalLink,
} from 'lucide-react'
import {
  updateProfile, sendVerification, verifyEmail, getApiKeys, createApiKey, deleteApiKey,
  getMyOrders, getDarkMode, setDarkMode as apiSetDarkMode,
  type ApiKey, type Order,
} from '@/lib/api'

export function DashboardPage() {
  const { user, logout, isAuthenticated, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [totpMode, setTotpMode] = useState<'idle' | 'setup' | 'disable'>('idle')
  const [totpQr, setTotpQr] = useState('')
  const [totpSecret, setTotpSecret] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [totpLoading, setTotpLoading] = useState(false)
  const [totpError, setTotpError] = useState('')

  // Profile
  const [profile, setProfile] = useState({ name: user?.name || '', company: user?.company || '', bio: user?.bio || '' })
  const [profileSaved, setProfileSaved] = useState(false)

  // Email verification
  const [verifSending, setVerifSending] = useState(false)
  const [verifSent, setVerifSent] = useState(false)
  const [verifToken, setVerifToken] = useState('')
  const [verifError, setVerifError] = useState('')

  // API keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [createdKey, setCreatedKey] = useState('')
  const [showNewKey, setShowNewKey] = useState(false)

  // Orders
  const [orders, setOrders] = useState<Order[]>([])

  // Dark mode
  const [darkMode, setDarkMode] = useState(true)

  useEffect(() => {
    getDarkMode().then(p => setDarkMode(p.dark_mode)).catch(() => {})
    getApiKeys().then(setApiKeys).catch(() => {})
    getMyOrders().then(r => setOrders(r.items)).catch(() => {})
  }, [])

  if (!isAuthenticated) {
    navigate('/login')
    return null
  }

  const totpEnabled = user?.totp_enabled

  const handleTotpSetup = async () => {
    setTotpLoading(true); setTotpError('')
    try {
      const res = await totpSetup()
      setTotpQr(res.qr_b64); setTotpSecret(res.secret); setTotpMode('setup')
    } catch (e: any) { setTotpError(e.message) }
    finally { setTotpLoading(false) }
  }

  const handleTotpEnable = async () => {
    if (totpCode.length < 6) return
    setTotpLoading(true); setTotpError('')
    try {
      await totpEnable(totpCode)
      const currentUser = getStoredUser()
      if (currentUser) storeUser({ ...currentUser, totp_enabled: true })
      setTotpMode('idle'); setTotpQr(''); setTotpCode('')
      window.location.reload()
    } catch (e: any) { setTotpError(e.message) }
    finally { setTotpLoading(false) }
  }

  const handleTotpDisable = async () => {
    if (totpCode.length < 6) return
    setTotpLoading(true); setTotpError('')
    try {
      await totpDisable(totpCode)
      const currentUser = getStoredUser()
      if (currentUser) storeUser({ ...currentUser, totp_enabled: false })
      setTotpMode('idle'); setTotpCode('')
      window.location.reload()
    } catch (e: any) { setTotpError(e.message) }
    finally { setTotpLoading(false) }
  }

  const handleSaveProfile = async () => {
    try {
      await updateProfile(profile)
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2000)
    } catch (e: any) { alert(e.message) }
  }

  const handleSendVerification = async () => {
    setVerifSending(true); setVerifError('')
    try {
      const res = await sendVerification()
      setVerifSent(res.sent)
      if (!res.sent) setVerifError('No se pudo enviar el email. Intenta más tarde.')
    } catch (e: any) { setVerifError(e.message) }
    finally { setVerifSending(false) }
  }

  const handleVerifyEmail = async () => {
    try {
      const res = await verifyEmail(verifToken)
      alert(res.message)
      window.location.reload()
    } catch (e: any) { setVerifError(e.message) }
  }

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) return
    try {
      const res = await createApiKey(newKeyName.trim())
      setCreatedKey(res.key)
      setShowNewKey(true)
      setNewKeyName('')
      getApiKeys().then(setApiKeys)
    } catch (e: any) { alert(e.message) }
  }

  const handleDeleteApiKey = async (id: number) => {
    if (!confirm('¿Eliminar esta API key?')) return
    try {
      await deleteApiKey(id)
      getApiKeys().then(setApiKeys)
    } catch (e: any) { alert(e.message) }
  }

  const handleDarkModeToggle = async () => {
    const next = !darkMode
    setDarkMode(next)
    try { await apiSetDarkMode(next) } catch {}
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-6 py-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-3xl font-bold tracking-tight">Mi panel</h1>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')}
              className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors bg-transparent border border-white/[0.06] rounded-lg px-4 py-2 cursor-pointer">
              <ArrowLeft className="size-4" /> Volver
            </button>
            {isAdmin && (
              <button onClick={() => navigate('/admin')}
                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors bg-transparent border border-blue-500/20 rounded-lg px-4 py-2 cursor-pointer">
                <ShieldAlert className="size-4" /> Admin
              </button>
            )}
            <button onClick={() => { logout(); navigate('/') }}
              className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors bg-transparent border border-white/[0.06] rounded-lg px-4 py-2 cursor-pointer">
              <LogOut className="size-4" /> Salir
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {[
            { id: 'profile', label: 'Perfil', icon: User },
            { id: 'security', label: 'Seguridad', icon: ShieldAlert },
            { id: 'keys', label: 'API Keys', icon: Key },
            { id: 'orders', label: 'Pedidos', icon: Package },
            { id: 'prefs', label: 'Preferencias', icon: Sun },
          ].map(tab => (
            <a key={tab.id} href={`#${tab.id}`}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-white/[0.02] border border-white/[0.06] text-zinc-400 hover:text-white hover:border-white/20 transition-colors whitespace-nowrap">
              <tab.icon className="size-4" /> {tab.label}
            </a>
          ))}
        </div>

        {/* Profile Section */}
        <section id="profile" className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="size-14 rounded-full bg-zinc-800 flex items-center justify-center">
              <User className="size-6 text-zinc-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user?.name}</h2>
              <p className="text-sm text-zinc-500">{user?.email}</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-xs text-zinc-600 block mb-1.5">Nombre</label>
              <input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-zinc-600 outline-none focus:border-white/20 transition-colors" />
            </div>
            <div>
              <label className="text-xs text-zinc-600 block mb-1.5">Empresa</label>
              <input value={profile.company} onChange={e => setProfile({ ...profile, company: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-zinc-600 outline-none focus:border-white/20 transition-colors" />
            </div>
            <div>
              <label className="text-xs text-zinc-600 block mb-1.5">Bio</label>
              <input value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-zinc-600 outline-none focus:border-white/20 transition-colors" />
            </div>
          </div>
          <button onClick={handleSaveProfile}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors cursor-pointer border-none">
            <Save className="size-4" /> {profileSaved ? 'Guardado' : 'Guardar cambios'}
          </button>
        </section>

        {/* Security Section: Email Verification + 2FA */}
        <section id="security" className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 mb-8">
          <h2 className="text-lg font-semibold mb-6">Seguridad</h2>

          {/* Email Verification */}
          <div className="mb-8 pb-8 border-b border-white/[0.06]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Mail className="size-5 text-zinc-500" />
                <h3 className="text-base font-medium">Verificación de email</h3>
              </div>
              {user?.is_verified ? (
                <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 px-3 py-1 rounded-full">
                  <Check className="size-3" /> Verificado
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full">
                  <X className="size-3" /> Sin verificar
                </span>
              )}
            </div>
            {!user?.is_verified && (
              <div className="space-y-3">
                <p className="text-sm text-zinc-500">Recibirás un enlace de verificación en tu email.</p>
                <button onClick={handleSendVerification} disabled={verifSending}
                  className="px-5 py-2 text-sm rounded-lg border border-white/[0.1] text-zinc-300 hover:text-white hover:border-white/30 transition-colors disabled:opacity-50 cursor-pointer bg-transparent">
                  {verifSending ? 'Enviando...' : verifSent ? 'Reenviar' : 'Verificar email'}
                </button>
                {verifError && <p className="text-sm text-red-400">{verifError}</p>}
                <div className="flex gap-2 mt-2">
                  <input value={verifToken} onChange={e => setVerifToken(e.target.value)} placeholder="Pega aquí el código de verificación"
                    className="flex-1 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-zinc-600 outline-none focus:border-white/20 transition-colors" />
                  <button onClick={handleVerifyEmail} disabled={!verifToken}
                    className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium disabled:opacity-50 cursor-pointer border-none">Confirmar</button>
                </div>
              </div>
            )}
          </div>

          {/* 2FA */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Smartphone className="size-5 text-zinc-500" />
                <h3 className="text-base font-medium">Autenticación en dos pasos (2FA)</h3>
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
                <p className="text-sm text-zinc-400">Escanea este código QR con Google Authenticator:</p>
                <div className="flex justify-center">
                  <img src={`data:image/png;base64,${totpQr}`} alt="2FA QR" className="rounded-lg bg-white p-2 w-48 h-48" />
                </div>
                <p className="text-xs text-zinc-500 text-center">O manual: <code className="text-zinc-300 bg-white/5 px-2 py-0.5 rounded">{totpSecret}</code></p>
                <div className="flex gap-3 justify-center">
                  <input type="text" inputMode="numeric" placeholder="000000" maxLength={6}
                    value={totpCode} onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
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
                    value={totpCode} onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
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
        </section>

        {/* API Keys */}
        <section id="keys" className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Key className="size-5 text-zinc-500" />
            <h2 className="text-lg font-semibold">API Keys</h2>
          </div>

          {showNewKey && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-amber-400 mb-2 font-medium">Guarda esta clave. No se mostrará de nuevo.</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm text-white bg-black/30 px-3 py-2 rounded-lg break-all">{createdKey}</code>
                <button onClick={() => { navigator.clipboard.writeText(createdKey); alert('Copiado') }}
                  className="p-2 rounded-lg bg-white/10 text-zinc-300 hover:text-white cursor-pointer border-none"><Copy className="size-4" /></button>
              </div>
            </div>
          )}

          <div className="flex gap-2 mb-6">
            <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="Nombre de la API key"
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-zinc-600 outline-none focus:border-white/20 transition-colors" />
            <button onClick={handleCreateApiKey} disabled={!newKeyName.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 disabled:opacity-50 cursor-pointer border-none">
              <Plus className="size-4" /> Crear
            </button>
          </div>

          {apiKeys.length === 0 ? (
            <p className="text-sm text-zinc-500">No tienes API keys.</p>
          ) : (
            <div className="space-y-2">
              {apiKeys.map(k => (
                <div key={k.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div>
                    <p className="text-sm font-medium text-white">{k.name}</p>
                    <p className="text-xs text-zinc-600">Creada: {k.created_at}</p>
                  </div>
                  <button onClick={() => handleDeleteApiKey(k.id)}
                    className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer border-none transition-colors">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Orders */}
        <section id="orders" className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Package className="size-5 text-zinc-500" />
            <h2 className="text-lg font-semibold">Mis pedidos</h2>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-zinc-500">No tienes pedidos todavía.</p>
          ) : (
            <div className="space-y-3">
              {orders.map(o => (
                <div key={o.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div>
                    <p className="text-sm font-medium text-white">{o.service}</p>
                    <p className="text-xs text-zinc-500">{o.description || '—'}</p>
                    <p className="text-xs text-zinc-600 mt-1">{o.created_at}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      o.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                      o.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-zinc-500/10 text-zinc-400'
                    }`}>
                      {o.status === 'completed' ? 'Completado' : o.status === 'pending' ? 'Pendiente' : o.status}
                    </span>
                    <span className="text-sm font-medium text-zinc-300">{o.amount}€</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Preferences */}
        <section id="prefs" className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 mb-8">
          <h2 className="text-lg font-semibold mb-6">Preferencias</h2>
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="size-5 text-zinc-400" /> : <Sun className="size-5 text-zinc-400" />}
              <div>
                <p className="text-sm font-medium text-white">Modo oscuro</p>
                <p className="text-xs text-zinc-500">Sincronizado con tu cuenta</p>
              </div>
            </div>
            <button onClick={handleDarkModeToggle}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer border-none ${darkMode ? 'bg-white' : 'bg-zinc-700'}`}>
              <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-black transition-transform ${darkMode ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
