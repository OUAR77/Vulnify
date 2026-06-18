import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/lib/auth-context'
import { useNavigate } from 'react-router-dom'
import { totpSetup, totpEnable, totpDisable, setUser as storeUser, getStoredUser } from '@/lib/api'
import {
  User, LogOut, Mail, Calendar, ArrowLeft, ShieldAlert, Smartphone, Check, X,
  Key, Copy, Eye, EyeOff, RefreshCw, Moon, Sun, FileText, Package, PenSquare,
  Save, Trash2, Plus, ExternalLink, Image, History, Camera,
} from 'lucide-react'
import {
  updateProfile, sendVerification, verifyEmail, getApiKeys, createApiKey, deleteApiKey,
  getMyOrders, getDarkMode, setDarkMode as apiSetDarkMode, getOrderPhotos,
  uploadAvatar, createMyOrder, getOrderTimeline, getOrderInvoice,
  type ApiKey, type Order, type OrderPhoto,
} from '@/lib/api'

export function DashboardPage() {
  const { t } = useTranslation()
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
  const [ordersTotal, setOrdersTotal] = useState(0)
  const [ordersPage, setOrdersPage] = useState(1)
  const [photosOrder, setPhotosOrder] = useState<Order | null>(null)
  const [orderPhotos, setOrderPhotos] = useState<OrderPhoto[]>([])
  // New order form
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [orderForm, setOrderForm] = useState({ service: '', description: '', amount: 0 })
  // Timeline
  const [tlOrder, setTlOrder] = useState<Order | null>(null)
  const [tlData, setTlData] = useState<any[]>([])
  // Avatar
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Dark mode
  const [darkMode, setDarkMode] = useState(true)

  useEffect(() => {
    getDarkMode().then(p => setDarkMode(p.dark_mode)).catch(() => {})
    getApiKeys().then(setApiKeys).catch(() => {})
    getMyOrders(ordersPage).then(r => { setOrders(r.items); setOrdersTotal(r.total); setOrdersPage(r.page) }).catch(() => {})
  }, [ordersPage])

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
      await sendVerification()
      setVerifSent(true)
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
    if (!confirm(t('dashboard.api_keys.confirm_delete'))) return
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

  const handleViewPhotos = async (order: Order) => {
    setPhotosOrder(order)
    try { setOrderPhotos(await getOrderPhotos(order.id)) }
    catch { setOrderPhotos([]) }
  }

  const handleAvatarUpload = async () => {
    const file = avatarInputRef.current?.files?.[0]
    if (!file) return
    try {
      await uploadAvatar(file)
      window.location.reload()
    } catch (e: any) { alert(e.message) }
  }

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createMyOrder(orderForm)
      setShowOrderForm(false)
      setOrderForm({ service: '', description: '', amount: 0 })
      getMyOrders(ordersPage).then(r => { setOrders(r.items); setOrdersTotal(r.total) }).catch(() => {})
    } catch (e: any) { alert(e.message) }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-6 py-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.heading')}</h1>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')}
              className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors bg-transparent border border-white/[0.06] rounded-lg px-4 py-2 cursor-pointer">
              <ArrowLeft className="size-4" /> {t('dashboard.back')}
            </button>
            {isAdmin && (
              <button onClick={() => navigate('/admin')}
                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors bg-transparent border border-blue-500/20 rounded-lg px-4 py-2 cursor-pointer">
                <ShieldAlert className="size-4" /> {t('nav.admin')}
              </button>
            )}
            <button onClick={() => { logout(); navigate('/') }}
              className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors bg-transparent border border-white/[0.06] rounded-lg px-4 py-2 cursor-pointer">
              <LogOut className="size-4" /> {t('nav.cerrar_sesion')}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {[
            { id: 'profile', label: t('dashboard.tabs.profile'), icon: User },
            { id: 'security', label: t('dashboard.tabs.security'), icon: ShieldAlert },
            { id: 'keys', label: t('dashboard.tabs.api_keys'), icon: Key },
            { id: 'orders', label: t('dashboard.tabs.orders'), icon: Package },
            { id: 'prefs', label: t('dashboard.tabs.preferences'), icon: Sun },
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
            <div className="relative size-14 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="size-full object-cover" />
              ) : (
                <User className="size-6 text-zinc-400" />
              )}
              <button onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer border-none">
                <Camera className="size-4 text-white" />
              </button>
              <input type="file" accept="image/*" ref={avatarInputRef} className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user?.name}</h2>
              <p className="text-sm text-zinc-500">{user?.email}</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-xs text-zinc-600 block mb-1.5">{t('dashboard.profile.name')}</label>
              <input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-zinc-600 outline-none focus:border-white/20 transition-colors" />
            </div>
            <div>
              <label className="text-xs text-zinc-600 block mb-1.5">{t('dashboard.profile.company')}</label>
              <input value={profile.company} onChange={e => setProfile({ ...profile, company: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-zinc-600 outline-none focus:border-white/20 transition-colors" />
            </div>
            <div>
              <label className="text-xs text-zinc-600 block mb-1.5">{t('dashboard.profile.bio')}</label>
              <input value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-zinc-600 outline-none focus:border-white/20 transition-colors" />
            </div>
          </div>
          <button onClick={handleSaveProfile}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors cursor-pointer border-none">
            <Save className="size-4" /> {profileSaved ? t('dashboard.profile.saved') : t('dashboard.profile.save')}
          </button>
        </section>

        {/* Security Section: Email Verification + 2FA */}
        <section id="security" className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 mb-8">
          <h2 className="text-lg font-semibold mb-6">{t('dashboard.security.heading')}</h2>

          {/* Email Verification */}
          <div className="mb-8 pb-8 border-b border-white/[0.06]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Mail className="size-5 text-zinc-500" />
                <h3 className="text-base font-medium">{t('dashboard.security.email_heading')}</h3>
              </div>
              {user?.is_verified ? (
                <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 px-3 py-1 rounded-full">
                  <Check className="size-3" /> {t('dashboard.security.verified')}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full">
                  <X className="size-3" /> {t('dashboard.security.unverified')}
                </span>
              )}
            </div>
            {!user?.is_verified && (
              <div className="space-y-3">
                <p className="text-sm text-zinc-500">{t('dashboard.security.verify_instructions')}</p>
                <button onClick={handleSendVerification} disabled={verifSending}
                  className="px-5 py-2 text-sm rounded-lg border border-white/[0.1] text-zinc-300 hover:text-white hover:border-white/30 transition-colors disabled:opacity-50 cursor-pointer bg-transparent">
                  {verifSending ? t('common.saving') : verifSent ? t('dashboard.security.resend') : t('dashboard.security.verify_button')}
                </button>
                {verifError && <p className="text-sm text-red-400">{verifError}</p>}
                <div className="flex gap-2 mt-2">
                  <input value={verifToken} onChange={e => setVerifToken(e.target.value)} placeholder="Pega aquí el código de verificación"
                    className="flex-1 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-zinc-600 outline-none focus:border-white/20 transition-colors" />
                  <button onClick={handleVerifyEmail} disabled={!verifToken}
                    className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium disabled:opacity-50 cursor-pointer border-none">{t('common.confirm')}</button>
                </div>
              </div>
            )}
          </div>

          {/* 2FA */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Smartphone className="size-5 text-zinc-500" />
                <h3 className="text-base font-medium">{t('dashboard.security.totp_heading')}</h3>
              </div>
              {totpEnabled ? (
                <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 px-3 py-1 rounded-full">
                  <Check className="size-3" /> {t('dashboard.security.totp_enabled')}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-zinc-500 bg-white/5 px-3 py-1 rounded-full">
                  <X className="size-3" /> {t('dashboard.security.totp_disabled')}
                </span>
              )}
            </div>
            {totpMode === 'setup' && totpQr && (
              <div className="space-y-4">
                <p className="text-sm text-zinc-400">{t('dashboard.security.totp_scan')}</p>
                <div className="flex justify-center">
                  <img src={`data:image/png;base64,${totpQr}`} alt={t('dashboard.security.totp_heading')} className="rounded-lg bg-white p-2 w-48 h-48" />
                </div>
                <p className="text-xs text-zinc-500 text-center">{t('dashboard.security.totp_manual')} <code className="text-zinc-300 bg-white/5 px-2 py-0.5 rounded">{totpSecret}</code></p>
                <div className="flex gap-3 justify-center">
                  <input type="text" inputMode="numeric" placeholder={t('dashboard.security.totp_placeholder')} maxLength={6}
                    value={totpCode} onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-40 bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white text-center text-lg tracking-[0.3em] focus:outline-none focus:border-white/30 placeholder:text-white/20" autoFocus />
                  <button onClick={handleTotpEnable} disabled={totpLoading || totpCode.length < 6}
                    className="px-6 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50 cursor-pointer border-none">
                    {totpLoading ? t('dashboard.security.totp_verifying') : t('dashboard.security.totp_verify')}
                  </button>
                </div>
                {totpError && <p className="text-sm text-red-400 text-center">{totpError}</p>}
                <button onClick={() => setTotpMode('idle')}
                  className="block mx-auto text-sm text-zinc-500 hover:text-white transition-colors bg-transparent border-none cursor-pointer">{t('dashboard.security.totp_cancel')}</button>
              </div>
            )}
            {totpMode === 'disable' && (
              <div className="space-y-4">
                <p className="text-sm text-zinc-400">{t('dashboard.security.totp_disable_instructions')}</p>
                <div className="flex gap-3 justify-center">
                  <input type="text" inputMode="numeric" placeholder={t('dashboard.security.totp_placeholder')} maxLength={6}
                    value={totpCode} onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-40 bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white text-center text-lg tracking-[0.3em] focus:outline-none focus:border-white/30 placeholder:text-white/20" autoFocus />
                  <button onClick={handleTotpDisable} disabled={totpLoading || totpCode.length < 6}
                    className="px-6 py-2.5 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50 cursor-pointer border-none">
                    {totpLoading ? t('dashboard.security.totp_disabling') : t('dashboard.security.totp_disable')}
                  </button>
                </div>
                {totpError && <p className="text-sm text-red-400 text-center">{totpError}</p>}
                <button onClick={() => { setTotpMode('idle'); setTotpCode(''); setTotpError('') }}
                  className="block mx-auto text-sm text-zinc-500 hover:text-white transition-colors bg-transparent border-none cursor-pointer">{t('dashboard.security.totp_cancel')}</button>
              </div>
            )}
            {totpMode === 'idle' && (
              <button onClick={totpEnabled ? () => setTotpMode('disable') : handleTotpSetup} disabled={totpLoading}
                className="mt-2 px-5 py-2.5 text-sm rounded-lg border border-white/[0.1] text-zinc-300 hover:text-white hover:border-white/30 transition-colors disabled:opacity-50 cursor-pointer bg-transparent">
                {totpEnabled ? t('dashboard.security.totp_disable_btn') : t('dashboard.security.totp_setup')}
              </button>
            )}
          </div>
        </section>

        {/* API Keys */}
        <section id="keys" className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Key className="size-5 text-zinc-500" />
            <h2 className="text-lg font-semibold">{t('dashboard.api_keys.heading')}</h2>
          </div>

          {showNewKey && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-amber-400 mb-2 font-medium">{t('dashboard.api_keys.warning')}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm text-white bg-black/30 px-3 py-2 rounded-lg break-all">{createdKey}</code>
                <button onClick={() => { navigator.clipboard.writeText(createdKey); alert(t('dashboard.api_keys.copied')) }}
                  className="p-2 rounded-lg bg-white/10 text-zinc-300 hover:text-white cursor-pointer border-none"><Copy className="size-4" /></button>
              </div>
            </div>
          )}

          <div className="flex gap-2 mb-6">
            <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder={t('dashboard.api_keys.placeholder')}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-zinc-600 outline-none focus:border-white/20 transition-colors" />
            <button onClick={handleCreateApiKey} disabled={!newKeyName.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 disabled:opacity-50 cursor-pointer border-none">
              <Plus className="size-4" /> {t('dashboard.api_keys.create')}
            </button>
          </div>

          {apiKeys.length === 0 ? (
            <p className="text-sm text-zinc-500">{t('dashboard.api_keys.empty')}</p>
          ) : (
            <div className="space-y-2">
              {apiKeys.map(k => (
                <div key={k.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div>
                    <p className="text-sm font-medium text-white">{k.name}</p>
                    <p className="text-xs text-zinc-600">{t('dashboard.api_keys.created')} {k.created_at}</p>
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Package className="size-5 text-zinc-500" />
              <h2 className="text-lg font-semibold">{t('dashboard.orders.heading')}</h2>
            </div>
            <button onClick={() => setShowOrderForm(true)}
              className="flex items-center gap-2 text-sm bg-white/10 rounded-lg px-4 py-2 hover:bg-white/20 transition-colors cursor-pointer border-none text-white">
              <Plus className="size-4" /> {t('dashboard.orders.new_order')}
            </button>
          </div>

          {/* New order form modal */}
          {showOrderForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowOrderForm(false)}>
              <div className="bg-zinc-900 border border-white/[0.1] rounded-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-semibold mb-4">{t('dashboard.orders.modal_title')}</h3>
                <form onSubmit={handleCreateOrder} className="space-y-4">
                  <input placeholder={t('dashboard.orders.service_placeholder')} value={orderForm.service}
                    onChange={(e) => setOrderForm({ ...orderForm, service: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" required />
                  <textarea placeholder={t('dashboard.orders.message_placeholder')} value={orderForm.description}
                    onChange={(e) => setOrderForm({ ...orderForm, description: e.target.value })} rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" />
                  <input type="number" step="0.01" placeholder={t('dashboard.orders.budget_placeholder')} value={orderForm.amount || ''}
                    onChange={(e) => setOrderForm({ ...orderForm, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" />
                  <div className="flex gap-3 pt-2">
                    <button type="submit" className="flex-1 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors cursor-pointer border-none">
                      {t('dashboard.orders.submit')}
                    </button>
                    <button type="button" onClick={() => setShowOrderForm(false)}
                      className="px-4 py-2.5 rounded-lg border border-white/[0.1] text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer bg-transparent">
                      {t('common.cancel')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {orders.length === 0 ? (
            <p className="text-sm text-zinc-500">{t('dashboard.orders.empty')}</p>
          ) : (
            <>
              <div className="space-y-3">
                {orders.map(o => (
                  <div key={o.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <div>
                      <p className="text-sm font-medium text-white">{o.service}</p>
                      <p className="text-xs text-zinc-500">{o.description || '—'}</p>
                      <p className="text-xs text-zinc-600 mt-1">{o.created_at}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setTlOrder(o); getOrderTimeline(o.id).then(setTlData).catch(() => setTlData([])) }}
                        className="text-xs px-2 py-1 rounded border border-white/[0.1] text-zinc-400 hover:text-white transition-colors cursor-pointer bg-transparent">
                        <History className="size-3" />
                      </button>
                      {o.status === 'completed' && (
                        <button onClick={() => getOrderInvoice(o.id).catch((e: any) => alert(e.message))}
                          className="text-xs px-2 py-1 rounded border border-white/[0.1] text-zinc-400 hover:text-white transition-colors cursor-pointer bg-transparent">
                          <FileText className="size-3" />
                        </button>
                      )}
                      <button onClick={() => handleViewPhotos(o)}
                        className="text-xs px-2 py-1 rounded border border-white/[0.1] text-zinc-400 hover:text-white transition-colors cursor-pointer bg-transparent">
                        <Image className="size-3" />
                      </button>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        o.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                        o.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400' :
                        o.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-zinc-500/10 text-zinc-400'
                      }`}>
                        {o.status === 'completed' ? t('dashboard.orders.status_completed') : o.status === 'in_progress' ? t('dashboard.orders.status_progress') : o.status === 'pending' ? t('dashboard.orders.status_pending') : o.status}
                      </span>
                      <span className="text-sm font-medium text-zinc-300">{o.amount}€</span>
                    </div>
                  </div>
                ))}
              </div>
              {Math.ceil(ordersTotal / 20) > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {Array.from({ length: Math.ceil(ordersTotal / 20) }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setOrdersPage(p)}
                      className={`w-8 h-8 text-xs rounded transition-colors cursor-pointer border-none ${ordersPage === p ? 'bg-white/20 text-white' : 'bg-white/5 text-zinc-500 hover:bg-white/10'}`}>{p}</button>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        {/* Timeline modal */}
        {tlOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => { setTlOrder(null); setTlData([]) }}>
            <div className="bg-zinc-900 border border-white/[0.1] rounded-xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{t('dashboard.orders.timeline_title', { service: tlOrder.service })}</h3>
                <button onClick={() => { setTlOrder(null); setTlData([]) }}
                  className="text-zinc-500 hover:text-white transition-colors cursor-pointer bg-transparent border-none text-lg">✕</button>
              </div>
              <div className="space-y-3">
                {tlData.map((t: any) => (
                  <div key={t.id} className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-zinc-300">{t.field === 'status' ? t('dashboard.orders.field_status') : t.field}</span>
                      <span className="text-[10px] text-zinc-600">{t.created_at}</span>
                    </div>
                    {t.field === 'status' ? (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded bg-zinc-500/20 text-zinc-400">{t.old_value || '—'}</span>
                        <span className="text-zinc-600">→</span>
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">{t.new_value}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500">{t.old_value || '—'} → {t.new_value}</p>
                    )}
                  </div>
                ))}
                {tlData.length === 0 && <p className="text-center py-8 text-zinc-500 text-sm">{t('dashboard.orders.timeline_empty')}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Photo viewer modal */}
        {photosOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => { setPhotosOrder(null); setOrderPhotos([]) }}>
            <div className="bg-zinc-900 border border-white/[0.1] rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{t('dashboard.orders.photos_title', { service: photosOrder.service })}</h3>
                <button onClick={() => { setPhotosOrder(null); setOrderPhotos([]) }}
                  className="text-zinc-500 hover:text-white transition-colors cursor-pointer bg-transparent border-none text-lg">✕</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {orderPhotos.map(p => (
                  <div key={p.id} className="rounded-lg overflow-hidden border border-white/[0.06]">
                    <img src={p.image_data} alt={p.caption || t('dashboard.orders.photos_title', { service: photosOrder.service })} className="w-full h-48 object-cover" />
                    {p.caption && <div className="p-2 text-xs text-zinc-400">{p.caption}</div>}
                    <div className="px-2 pb-2 text-[10px] text-zinc-600">{p.created_at}</div>
                  </div>
                ))}
                {orderPhotos.length === 0 && <div className="col-span-full text-center py-12 text-zinc-500 text-sm">{t('dashboard.orders.photos_empty')}</div>}
              </div>
            </div>
          </div>
        )}

        {/* Preferences */}
        <section id="prefs" className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 mb-8">
          <h2 className="text-lg font-semibold mb-6">{t('dashboard.preferences.heading')}</h2>
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="size-5 text-zinc-400" /> : <Sun className="size-5 text-zinc-400" />}
              <div>
                <p className="text-sm font-medium text-white">{t('dashboard.preferences.dark_mode')}</p>
                <p className="text-xs text-zinc-500">{t('dashboard.preferences.dark_mode_sub')}</p>
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
