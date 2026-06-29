import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle } from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

export function ProductAccessPage() {
  const { t } = useTranslation()
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<{ product_name: string; purchased_at: string } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    fetch(`${BASE}/api/products/access/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 410) throw new Error(t('products.expired'))
          if (res.status === 404) throw new Error(t('products.not_found'))
          throw new Error(t('products.invalid_token'))
        }
        const contentType = res.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          return res.json()
        }
        return { redirect: res.url }
      })
      .then((d) => {
        if (d.redirect) { window.location.href = d.redirect; return }
        setData(d)
        setLoading(false)
      })
      .catch((e) => { setError(e.message); setLoading(false) })
  }, [token, t])

  if (loading) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <p className="text-sm text-zinc-500">{t('common.loading')}</p>
    </div>
  )

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <XCircle className="size-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">{t('products.access_error')}</h1>
          <p className="text-sm text-zinc-500 mb-6">{error}</p>
          <Link to="/productos" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors no-underline">
            {t('products.back')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center max-w-md mx-4">
        <CheckCircle className="size-12 text-green-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">{t('products.access_success')}</h1>
        <p className="text-sm text-zinc-400 mb-2">{t('products.you_own')} <span className="text-white font-medium">{data?.product_name}</span></p>
        <p className="text-xs text-zinc-600 mb-8">{t('products.purchased_on')} {data?.purchased_at}</p>
        <Link to="/productos" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors no-underline">
          {t('products.browse')}
        </Link>
      </div>
    </div>
  )
}
