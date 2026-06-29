import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

export function CheckoutSuccessPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    if (sessionId) {
      fetch(`${BASE}/api/stripe/check-session/${sessionId}`)
        .then(res => res.json())
        .then(d => setStatus(d.ok ? 'success' : 'error'))
        .catch(() => setStatus('error'))
    } else {
      setStatus('success')
    }
  }, [sessionId])

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center max-w-md mx-4">
        {status === 'loading' && <p className="text-sm text-zinc-500">{t('common.loading')}</p>}
        {status === 'success' && (
          <>
            <CheckCircle className="size-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">{t('checkout.success_title')}</h1>
            <p className="text-sm text-zinc-500 mb-2">{t('checkout.success_desc')}</p>
            <p className="text-xs text-zinc-600 mb-8">{t('checkout.success_email')}</p>
            <Link to="/productos" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors no-underline">
              {t('checkout.browse')}
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="text-xl font-bold mb-2">{t('checkout.error_title')}</h1>
            <p className="text-sm text-zinc-500 mb-6">{t('checkout.error_desc')}</p>
            <Link to="/productos" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors no-underline">
              {t('checkout.browse')}
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
