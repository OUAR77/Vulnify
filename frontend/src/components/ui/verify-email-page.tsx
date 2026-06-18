import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { verifyEmail } from '@/lib/api'
import { Check, X, Loader2 } from 'lucide-react'

export function VerifyEmailPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage(t('verify_email.invalid'))
      return
    }
    verifyEmail(token)
      .then(res => {
        setStatus('success')
        setMessage(res.message || t('verify_email.success_message'))
      })
      .catch(err => {
        setStatus('error')
        setMessage(err.message || t('verify_email.error_message'))
      })
  }, [searchParams])

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center max-w-sm px-6">
        {status === 'loading' && (
          <div className="space-y-4">
            <Loader2 className="size-10 mx-auto animate-spin text-zinc-500" />
            <p className="text-zinc-400">{t('verify_email.loading')}</p>
          </div>
        )}
        {status === 'success' && (
          <div className="space-y-4">
            <div className="size-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <Check className="size-7 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold">{t('verify_email.success_heading')}</h1>
            <p className="text-zinc-400">{message}</p>
            <button onClick={() => navigate('/login')}
              className="mt-4 px-6 py-3 rounded-full bg-white text-black font-medium hover:bg-white/90 transition-colors cursor-pointer border-none">
              {t('verify_email.login_button')}
            </button>
          </div>
        )}
        {status === 'error' && (
          <div className="space-y-4">
            <div className="size-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
              <X className="size-7 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold">{t('verify_email.error_heading')}</h1>
            <p className="text-zinc-400">{message}</p>
            <button onClick={() => navigate('/login')}
              className="mt-4 px-6 py-3 rounded-full bg-white text-black font-medium hover:bg-white/90 transition-colors cursor-pointer border-none">
              {t('verify_email.back_button')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
