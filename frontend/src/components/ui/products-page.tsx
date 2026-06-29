import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Tags, ArrowUpRight, Euro, Calendar } from 'lucide-react'
import { getProducts, type ProductData } from '@/lib/api'

export function ProductsPage() {
  const { t } = useTranslation()
  const [products, setProducts] = useState<ProductData[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    getProducts().then(setProducts).catch((e) => setError(e.message))
  }, [])

  return (
    <div className="min-h-screen pt-28 md:pt-36">
      <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-16 md:py-24">
        <span className="inline-block text-[11px] tracking-[0.25em] uppercase text-zinc-600 mb-4 font-mono">{t('products.badge')}</span>
        <h1 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight mb-4">{t('products.heading')}</h1>
        <p className="text-sm text-zinc-400 leading-relaxed mb-12 max-w-2xl">{t('products.subtitle')}</p>
        {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 mb-6">{error}</div>}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <div key={p.id} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-6 hover:border-white/20 transition-all duration-500 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <Tags className="size-5 text-zinc-500" />
                <h3 className="text-lg font-semibold text-white">{p.name}</h3>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed mb-6 flex-1">{p.description}</p>
              <div className="flex items-center gap-4 mb-6">
                {p.price_one_time && (
                  <div className="flex items-center gap-2 text-sm">
                    <Euro className="size-4 text-zinc-500" />
                    <span className="text-white font-medium">{p.price_one_time}€</span>
                    <span className="text-zinc-500">{t('products.one_time')}</span>
                  </div>
                )}
                {p.price_monthly && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="size-4 text-zinc-500" />
                    <span className="text-white font-medium">{p.price_monthly}€</span>
                    <span className="text-zinc-500">/mo</span>
                  </div>
                )}
              </div>
              <Link to={`/productos/${p.slug}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors no-underline">
                {t('products.view')} <ArrowUpRight className="size-4" />
              </Link>
            </div>
          ))}
        </div>
        {products.length === 0 && !error && (
          <p className="text-sm text-zinc-500 text-center py-12">{t('products.empty')}</p>
        )}
      </div>
    </div>
  )
}
