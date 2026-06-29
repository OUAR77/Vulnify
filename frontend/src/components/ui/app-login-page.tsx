import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Bot, ArrowRight, ShieldAlert } from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

export function AppLoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${BASE}/api/app/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Error')
      localStorage.setItem('app_session_token', data.session_token)
      navigate('/app/dashboard')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <Bot className="size-10 text-zinc-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold">{t('app.login_title')}</h1>
          <p className="text-sm text-zinc-500 mt-2">{t('app.login_desc')}</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-zinc-500 mb-1.5 block">{t('app.token_label')}</label>
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={t('app.token_placeholder')}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/20 font-mono"
              autoFocus
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <ShieldAlert className="size-4 shrink-0" />
              {error}
            </div>
          )}
          <button type="submit" disabled={!token.trim() || loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 cursor-pointer border-none">
            {loading ? t('common.loading') : <><ArrowRight className="size-4" /> {t('app.login_button')}</>}
          </button>
        </form>
      </div>
    </div>
  )
}
