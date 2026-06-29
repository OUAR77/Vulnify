import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, Link } from 'react-router-dom'
import { Tags, Euro, Calendar, ArrowLeft, ShoppingCart, CheckCircle } from 'lucide-react'
import { getProduct, productCheckout, type ProductData } from '@/lib/api'

export function ProductDetailPage() {
  const { t } = useTranslation()
  const { slug } = useParams<{ slug: string }>()
  const [product, setProduct] = useState<ProductData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(false)
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerName, setBuyerName] = useState('')
  const [interval, setInterval] = useState<'one_time' | 'monthly'>('one_time')

  useEffect(() => {
    if (!slug) return
    getProduct(slug).then((p) => { setProduct(p); setLoading(false) }).catch((e) => { setError(e.message); setLoading(false) })
  }, [slug])

  const handleBuy = async () => {
    if (!product || !buyerEmail) return
    setBuying(true)
    try {
      const res = await productCheckout({
        product_id: product.id,
        interval,
        buyer_email: buyerEmail,
        buyer_name: buyerName,
      })
      if (res.free && res.token) {
        window.location.href = `/acceso/${res.token}`
      } else if (res.checkout_url) {
        window.location.href = res.checkout_url
      }
    } catch (e: any) {
      alert(e.message)
    } finally {
      setBuying(false)
    }
  }

  if (loading) return <div className="min-h-screen pt-28 md:pt-36" />

  if (error || !product) {
    return (
      <div className="min-h-screen pt-28 md:pt-36">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-16 md:py-24">
          <p className="text-sm text-red-400">{error || t('products.not_found')}</p>
          <Link to="/productos" className="text-xs text-zinc-600 hover:text-white transition-colors inline-flex items-center gap-1 mt-4">
            <ArrowLeft className="size-3" /> {t('products.back')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-28 md:pt-36">
      <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-16 md:py-24">
        <Link to="/productos" className="text-xs text-zinc-600 hover:text-white transition-colors inline-flex items-center gap-1 mb-8">
          <ArrowLeft className="size-3" /> {t('products.back')}
        </Link>
        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-start">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Tags className="size-5 text-zinc-500" />
              <span className="text-[11px] tracking-[0.25em] uppercase text-zinc-600 font-mono">{t('products.badge')}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight mb-6">{product.name}</h1>
            <p className="text-sm text-zinc-400 leading-relaxed mb-8">{product.description}</p>
            <div className="flex flex-wrap gap-4 mb-8">
              {product.price_one_time && (
                <button onClick={() => setInterval('one_time')}
                  className={`flex items-center gap-3 px-5 py-3 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                    interval === 'one_time' ? 'border-white text-white bg-white/5' : 'border-white/[0.06] text-zinc-500 hover:text-white hover:border-white/20 bg-transparent'
                  }`}>
                  <Euro className="size-4" />
                  <span>{product.price_one_time}€ {t('products.one_time')}</span>
                </button>
              )}
              {product.price_monthly && (
                <button onClick={() => setInterval('monthly')}
                  className={`flex items-center gap-3 px-5 py-3 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                    interval === 'monthly' ? 'border-white text-white bg-white/5' : 'border-white/[0.06] text-zinc-500 hover:text-white hover:border-white/20 bg-transparent'
                  }`}>
                  <Calendar className="size-4" />
                  <span>{product.price_monthly}€ /mo</span>
                </button>
              )}
            </div>
          </div>
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-6 md:p-8">
            <h3 className="text-sm font-medium text-white mb-6">{t('products.checkout_title')}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">{t('products.email')}</label>
                <input type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" required />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">{t('products.name')}</label>
                <input type="text" value={buyerName} onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" />
              </div>
              <div className="flex items-center justify-between py-3 border-t border-white/[0.06]">
                <span className="text-sm text-zinc-400">{t('products.total')}</span>
                <span className="text-xl font-bold text-white">
                  {interval === 'one_time' ? product.price_one_time : product.price_monthly}€
                  {interval === 'monthly' && <span className="text-sm text-zinc-500 font-normal">/mo</span>}
                </span>
              </div>
              <button onClick={handleBuy} disabled={!buyerEmail || buying}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 cursor-pointer border-none">
                {buying ? t('common.loading') : <><ShoppingCart className="size-4" /> {t('products.buy')}</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
