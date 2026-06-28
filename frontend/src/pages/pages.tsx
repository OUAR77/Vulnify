import { useState, useEffect, Fragment, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowUpRight, Search, X, ChevronRight, BookOpen, Mail, ArrowRight } from 'lucide-react'
import { SEO } from '@/components/ui/seo'
import { getBlogPosts, type BlogPost } from '@/lib/api'

function BlogCard({ post, featured }: { post: BlogPost; featured?: boolean }) {
  const { i18n } = useTranslation()
  const loc = i18n.language === 'en' ? 'en-US' : 'es-ES'
  return (
    <Link
      to={`/blog/${post.slug}`}
      className={`group block no-underline ${
        featured
          ? 'col-span-full lg:col-span-2 lg:row-span-2 p-8 md:p-10 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] hover:border-white/20 transition-all duration-500'
          : 'p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-500'
      }`}
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[10px] tracking-[0.2em] uppercase text-zinc-600 bg-white/[0.03] px-2.5 py-1 rounded-md border border-white/[0.04]">
          {post.tag}
        </span>
        {featured && <span className="text-[10px] tracking-[0.2em] uppercase text-amber-500/80 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">Destacado</span>}
      </div>
      <h2 className={`font-bold text-white mb-2 leading-snug group-hover:text-zinc-200 transition-colors ${featured ? 'text-2xl md:text-3xl' : 'text-base'}`}>{post.title}</h2>
      <p className={`text-zinc-500 leading-relaxed mb-4 ${featured ? 'text-sm md:text-base' : 'text-sm'}`}>{post.excerpt}</p>
      <div className="flex items-center gap-3 text-xs text-zinc-700 mt-auto">
        <span>{new Date(post.created_at).toLocaleDateString(loc, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        <span className="w-1 h-1 rounded-full bg-zinc-700/50" />
        <span>{post.read_time}</span>
      </div>
    </Link>
  )
}

export function BlogPage() {
  const { t, i18n } = useTranslation()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState('')
  const [visible, setVisible] = useState(6)
  const PER_PAGE = 6

  useEffect(() => {
    getBlogPosts().then(setPosts).catch(() => {})
  }, [])

  const tags = useMemo(() => {
    const all = posts.map((p) => p.tag).filter(Boolean) as string[]
    return [...new Set(all)]
  }, [posts])

  const filtered = useMemo(() => {
    let result = posts
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((p) => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q))
    }
    if (activeTag) result = result.filter((p) => p.tag === activeTag)
    return result
  }, [posts, search, activeTag])

  const featured = filtered.length > 0 ? filtered[0] : null
  const rest = filtered.length > 0 ? (search || activeTag ? filtered : filtered.slice(1)) : []
  const shown = rest.slice(0, visible)
  const hasMore = shown.length < rest.length

  const loc = i18n.language === 'en' ? 'en-US' : 'es-ES'

  return (
    <>
      <SEO title={t('blog.page_title')} description={t('blog.page_description')} />
      <div className="min-h-screen pt-28 md:pt-36">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-16 md:py-24">
          {/* Header */}
          <div className="mb-12">
            <Link to="/" className="text-xs text-zinc-600 hover:text-white transition-colors inline-flex items-center gap-1 mb-6">
              ← {t('blog.back')}
            </Link>
            <span className="inline-block text-[11px] tracking-[0.25em] uppercase text-zinc-600 mb-4 font-mono">{t('blog.badge')}</span>
            <h1 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight mb-4">{t('blog.heading')}</h1>
          </div>

          {/* Search + Tags */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setVisible(PER_PAGE) }}
                placeholder="Buscar artículos..."
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-white/[0.03] border border-white/[0.06] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-colors"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-zinc-500 hover:text-white">
                  <X className="size-4" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setActiveTag(''); setVisible(PER_PAGE) }}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer bg-transparent ${
                  !activeTag ? 'bg-white text-black border-white' : 'text-zinc-400 border-white/[0.06] hover:text-white hover:border-white/20'
                }`}
              >
                Todos
              </button>
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => { setActiveTag(activeTag === tag ? '' : tag); setVisible(PER_PAGE) }}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer bg-transparent ${
                    activeTag === tag ? 'bg-white text-black border-white' : 'text-zinc-400 border-white/[0.06] hover:text-white hover:border-white/20'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Results info */}
          {filtered.length > 0 && (
            <p className="text-xs text-zinc-600 mb-6">
              {filtered.length} {filtered.length === 1 ? 'artículo' : 'artículos'}
              {activeTag ? ` en "${activeTag}"` : ''}
              {search ? ` para "${search}"` : ''}
            </p>
          )}

          {/* Featured post */}
          {!search && !activeTag && featured && featured === posts[0] && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <BlogCard post={featured} featured />
            </div>
          )}

          {/* Grid */}
          {filtered.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(search || activeTag ? filtered : shown).map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>

              {/* Load more */}
              {!search && !activeTag && hasMore && (
                <div className="flex justify-center mt-12">
                  <button
                    onClick={() => setVisible((v) => v + PER_PAGE)}
                    className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white border border-white/[0.06] hover:border-white/20 px-6 py-3 rounded-lg transition-all bg-transparent cursor-pointer"
                  >
                    Cargar más <ChevronRight className="size-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <BookOpen className="size-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400 mb-2">{t('blog.not_found_desc')}</p>
              <button
                onClick={() => { setSearch(''); setActiveTag('') }}
                className="text-sm text-zinc-500 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
              >
                Limpiar filtros
              </button>
            </div>
          )}

          {/* Subscribe CTA */}
          {filtered.length > 0 && (
            <div className="mt-24 p-8 md:p-12 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent text-center">
              <Mail className="size-8 text-zinc-400 mx-auto mb-4" />
              <h2 className="text-xl md:text-2xl font-semibold text-white mb-2">¿Quieres más contenido como este?</h2>
              <p className="text-sm text-zinc-400 mb-6 max-w-md mx-auto">Recibe artículos sobre desarrollo web, IA y estrategia digital directamente en tu bandeja de entrada.</p>
              <form onSubmit={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('open-contact')) }} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input type="email" placeholder="tu@email.com" className="flex-1 px-4 py-2.5 text-sm bg-white/[0.03] border border-white/[0.06] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-colors" />
                <button type="submit" className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer border-none whitespace-nowrap">
                  Suscribirse <ArrowRight className="size-4" />
                </button>
              </form>
            </div>
          )}
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
            {slugKey === 'automatizacion_inmobiliaria' && (
              <Link to="/demo/extraer-propiedad" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/[0.15] text-white text-sm font-medium hover:bg-white/5 transition-colors mt-3 no-underline">
                Probar demo <ArrowUpRight className="size-4" />
              </Link>
            )}
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
