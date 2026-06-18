import { useState, useEffect, Fragment } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowUpRight } from 'lucide-react'
import { SEO } from '@/components/ui/seo'
import { getBlogPosts, type BlogPost } from '@/lib/api'

export function BlogPage() {
  const { t, i18n } = useTranslation()
  const [posts, setPosts] = useState<BlogPost[]>([])
  useEffect(() => {
    getBlogPosts().then(setPosts).catch(() => {})
  }, [])
  const loc = i18n.language === 'en' ? 'en-US' : 'es-ES'

  return (
    <>
      <SEO title={t('blog.page_title')} description={t('blog.page_description')} />
      <div className="min-h-screen pt-28 md:pt-36">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-16 md:py-24">
          <div className="mb-16">
            <Link to="/" className="text-xs text-zinc-600 hover:text-white transition-colors inline-flex items-center gap-1 mb-6">
              ← {t('blog.back')}
            </Link>
            <span className="inline-block text-[11px] tracking-[0.25em] uppercase text-zinc-600 mb-4 font-mono">{t('blog.badge')}</span>
            <h1 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight">{t('blog.heading')}</h1>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link key={post.id} to={`/blog/${post.slug}`} className="group block p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-500 no-underline">
                <span className="text-[10px] tracking-[0.2em] uppercase text-zinc-600 bg-white/[0.03] px-2.5 py-1 rounded-md border border-white/[0.04] inline-block mb-4">
                  {post.tag}
                </span>
                <h2 className="text-base font-semibold text-white mb-2 leading-snug">{post.title}</h2>
                <p className="text-sm text-zinc-500 leading-relaxed mb-4">{post.excerpt}</p>
                <div className="flex items-center gap-3 text-xs text-zinc-700 mt-auto">
                  <span>{new Date(post.created_at).toLocaleDateString(loc, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-700/50" />
                  <span>{post.read_time}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export function LegalPage({ title, date, children }: { title: string; date: string; children: React.ReactNode }) {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen pt-28 md:pt-36">
      <div className="mx-auto max-w-3xl px-6 md:px-12 lg:px-20 py-16 md:py-24">
        <Link to="/" className="text-xs text-zinc-600 hover:text-white transition-colors inline-flex items-center gap-1 mb-6">
          ← {t('legal.back')}
        </Link>
        <span className="inline-block text-[11px] tracking-[0.25em] uppercase text-zinc-600 mb-4 font-mono">{title}</span>
        <h1 className="text-3xl md:text-4xl font-bold text-white leading-[1.05] tracking-tight mb-2">{title}</h1>
        <p className="text-xs text-zinc-700 mb-10">{t('legal.last_updated', { date })}</p>
        <div className="text-sm text-zinc-400 leading-relaxed space-y-4">
          {children}
        </div>
      </div>
    </div>
  )
}

export function PrivacidadPage() {
  const { t } = useTranslation()
  const sections = t('privacidad.sections', { returnObjects: true }) as { title: string; body: string }[]
  return (
    <>
      <SEO title={t('privacidad.page_title')} description={t('privacidad.page_description')} />
      <LegalPage title={t('privacidad.title')} date={t('privacidad.date')}>
        {sections.map((section, i) => (
          <Fragment key={i}>
            <h2 className="text-white font-medium text-base mt-8 mb-3">{section.title}</h2>
            <p>{section.body}</p>
          </Fragment>
        ))}
      </LegalPage>
    </>
  )
}

export function TerminosPage() {
  const { t } = useTranslation()
  const sections = t('terminos.sections', { returnObjects: true }) as { title: string; body: string }[]
  return (
    <>
      <SEO title={t('terminos.page_title')} description={t('terminos.page_description')} />
      <LegalPage title={t('terminos.title')} date={t('terminos.date')}>
        {sections.map((section, i) => (
          <Fragment key={i}>
            <h2 className="text-white font-medium text-base mt-8 mb-3">{section.title}</h2>
            <p>{section.body}</p>
          </Fragment>
        ))}
      </LegalPage>
    </>
  )
}

export function CookiesPage() {
  const { t } = useTranslation()
  const sections = t('cookies.sections', { returnObjects: true }) as { title: string; body?: string; items?: string[] | string }[]
  return (
    <>
      <SEO title={t('cookies.page_title')} description={t('cookies.page_description')} />
      <LegalPage title={t('cookies.title')} date={t('cookies.date')}>
        {sections.map((section, i) => (
          <Fragment key={i}>
            <h2 className="text-white font-medium text-base mt-8 mb-3">{section.title}</h2>
            {section.body && <p>{section.body}</p>}
            {section.items && (
              <p>{Array.isArray(section.items) ? section.items.join('') : section.items}</p>
            )}
          </Fragment>
        ))}
      </LegalPage>
    </>
  )
}

export function CasosExitoPage() {
  const { t } = useTranslation()
  return (
    <>
      <SEO title={t('casos_exito.page_title')} description={t('casos_exito.page_description')} />
      <CasosExitoContent />
    </>
  )
}

function CasosExitoContent() {
  const { t } = useTranslation()
  const cases = t('casos_exito.cases', { returnObjects: true }) as { metric: string; label: string; company: string; sector: string; desc: string; result: string }[]

  return (
    <div className="min-h-screen pt-28 md:pt-36">
      <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-16 md:py-24">
        <Link to="/" className="text-xs text-zinc-600 hover:text-white transition-colors inline-flex items-center gap-1 mb-6">
          ← {t('casos_exito.back')}
        </Link>
        <span className="inline-block text-[11px] tracking-[0.25em] uppercase text-zinc-600 mb-4 font-mono">{t('casos_exito.badge')}</span>
        <h1 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight mb-10">{t('casos_exito.heading')}</h1>
        <div className="grid md:grid-cols-3 gap-6">
          {cases.map((c) => (
            <div key={c.company} className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-500 relative overflow-hidden h-full flex flex-col">
              <div className="mb-5">
                <span className="text-5xl md:text-6xl font-bold text-white tracking-tight">{c.metric}</span>
                <span className="block text-sm text-zinc-600 mt-1">{c.label}</span>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed mb-4">&ldquo;{c.desc}&rdquo;</p>
              <p className="text-sm text-zinc-500 leading-relaxed mb-6 flex-1">{c.result}</p>
              <div className="pt-5 border-t border-white/[0.04] flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">{c.company}</div>
                  <div className="text-xs text-zinc-600">{c.sector}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ServicioPage() {
  return (
    <>
      <ServicioContent />
    </>
  )
}

function ServicioContent() {
  const { t } = useTranslation()
  const location = useLocation()

  const slug = location.pathname.split('/').pop() || 'desarrollo-web'
  const slugKey = slug.replace(/-/g, '_')
  const service = t(`servicios_page.items.${slugKey}`, { returnObjects: true }) as { title: string; desc: string; features: string[] }

  return (
    <div className="min-h-screen pt-28 md:pt-36">
      <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-16 md:py-24">
        <Link to="/" className="text-xs text-zinc-600 hover:text-white transition-colors inline-flex items-center gap-1 mb-6">
          ← {t('servicios_page.back')}
        </Link>
        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-start">
          <div>
            <span className="inline-block text-[11px] tracking-[0.25em] uppercase text-zinc-600 mb-4 font-mono">{t('servicios_page.badge')}</span>
            <h1 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight mb-6">{service.title}</h1>
            <p className="text-sm text-zinc-400 leading-relaxed mb-8">{service.desc}</p>
            <button onClick={() => window.dispatchEvent(new CustomEvent('open-contact'))} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors cursor-pointer">
              {t('servicios_page.cta')} <ArrowUpRight className="size-4" />
            </button>
          </div>
          <div className="space-y-3">
            <h3 className="text-xs tracking-[0.2em] uppercase text-zinc-500 mb-4">{t('servicios_page.features_heading')}</h3>
            {service.features.map((f) => (
              <div key={f} className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="size-1.5 rounded-full bg-zinc-500" />
                <span className="text-sm text-zinc-400">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
