import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiForgotPassword } from '@/lib/api'
import { useTranslation } from 'react-i18next'

export function ForgotPasswordPage() {
  const { t } = useTranslation()
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
      setError(e.message || t('forgot_password.error'))
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
              <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">{t('forgot_password.success_heading')}</h1>
              <p className="text-white/50">{t('forgot_password.success_message')}</p>
              <button onClick={() => navigate('/login')}
                className="w-full rounded-full bg-white text-black font-medium py-3 hover:bg-white/90 transition-colors cursor-pointer"
              >
                {t('forgot_password.back')}
              </button>
            </>
          ) : (
            <>
              <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">{t('forgot_password.heading')}</h1>
              <p className="text-white/50">{t('forgot_password.subtitle')}</p>
              {error && (
                <div className="rounded-full bg-red-500/10 border border-red-500/20 px-6 py-3 text-sm text-red-400">{error}</div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  placeholder={t('forgot_password.email_placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-full py-3 px-4 text-white text-center focus:outline-none focus:border-white/30 placeholder:text-white/30"
                  required
                  autoFocus
                />
                <button type="submit" disabled={loading}
                  className="w-full rounded-full bg-white text-black font-medium py-3 hover:bg-white/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {loading ? t('forgot_password.submit_sending') : t('forgot_password.submit')}
                </button>
              </form>
              <button onClick={() => navigate('/login')}
                className="text-sm text-zinc-500 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
              >
                {t('forgot_password.back')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
