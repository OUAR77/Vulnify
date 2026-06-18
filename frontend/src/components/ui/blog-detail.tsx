import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import {
  ArrowLeft, Clock, User, Calendar, Copy, Check, BookOpen,
  ChevronDown, ChevronUp, ArrowUp, Mail, ArrowRight, ExternalLink,
} from 'lucide-react'
import { getBlogPost, getBlogPosts } from '@/lib/api'
import type { BlogPost } from '@/lib/api'
import { SEO } from '@/components/ui/seo'
import { useTranslation } from 'react-i18next'

type HeadingItem = { id: string; text: string; level: number }

function extractHeadings(markdown: string): HeadingItem[] {
  const lines = markdown.split('\n')
  const items: HeadingItem[] = []
  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)$/)
    if (match) {
      const text = match[2].replace(/[`*_~\[\]()]/g, '').trim()
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      items.push({ id, text, level: match[1].length })
    }
  }
  return items
}

function estimateReadTime(content: string): string {
  const words = content.trim().split(/\s+/).length
  const min = Math.max(1, Math.round(words / 200))
  return `${min} min`
}

function ShareButton({ href, icon: IconSvg, label, onClick, svg }: { href?: string; icon?: typeof Copy; label: string; onClick?: () => void; svg?: React.ReactNode }) {
  const Tag = href ? 'a' : 'button'
  return (
    <Tag
      {...(href ? { href, target: '_blank', rel: 'noopener noreferrer' } : { onClick })}
      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.06] text-xs text-zinc-400 hover:text-white hover:border-white/20 transition-all bg-transparent cursor-pointer no-underline"
      aria-label={label}
    >
      {svg || (IconSvg ? <IconSvg className="size-3.5" /> : null)}
      {label}
    </Tag>
  )
}

function TocSidebar({ headings }: { headings: HeadingItem[] }) {
  const { t } = useTranslation()
  const [activeId, setActiveId] = useState('')
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) { setActiveId(entry.target.id); break }
        }
      },
      { rootMargin: '-80px 0px -60% 0px' }
    )
    for (const h of headings) {
      const el = document.getElementById(h.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [headings])

  if (headings.length < 2) return null

  return (
    <nav className="hidden lg:block sticky top-28 w-56 shrink-0">
      <p className="text-xs tracking-[0.15em] uppercase text-zinc-500 mb-4">{t('blog.toc')}</p>
      <ul className="space-y-2">
        {headings.map((h) => (
          <li key={h.id} style={{ paddingLeft: `${(h.level - 1) * 12}px` }}>
            <a
              href={`#${h.id}`}
              onClick={(e) => { e.preventDefault(); document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' }) }}
              className={`block text-xs leading-relaxed transition-colors no-underline ${
                activeId === h.id ? 'text-white font-medium' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function TocMobile({ headings }: { headings: HeadingItem[] }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  if (headings.length < 2) return null
  return (
    <div className="lg:hidden mb-8">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-zinc-500 hover:text-white transition-colors bg-transparent border-none cursor-pointer w-full py-2"
      >
        {t('blog.toc')} {open ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-1 mt-2 pl-2 border-l border-white/[0.06]">
            {headings.map((h) => (
              <li key={h.id} style={{ paddingLeft: `${(h.level - 1) * 12}px` }}>
                <a
                  href={`#${h.id}`}
                  onClick={(e) => { e.preventDefault(); document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' }); setOpen(false) }}
                  className="text-xs text-zinc-500 hover:text-white transition-colors no-underline block py-1"
                >
                  {h.text}
                </a>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

function ReadingProgress() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setProgress(docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return <motion.div className="fixed top-0 left-0 right-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-zinc-500 via-zinc-300 to-zinc-500" style={{ scaleX: progress }} />
}

function BackToTop() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 left-6 z-40 size-11 rounded-full bg-white/[0.06] border border-white/[0.1] text-zinc-400 hover:text-white hover:bg-white/[0.1] flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm"
          aria-label="Volver arriba"
        >
          <ArrowUp className="size-4" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

function Skeleton() {
  return (
    <div className="min-h-screen pt-28 md:pt-36">
      <div className="mx-auto max-w-4xl px-6 md:px-12 lg:px-20 py-16 md:py-24 animate-pulse">
        <div className="h-4 w-32 bg-white/[0.06] rounded mb-12" />
        <div className="h-6 w-20 bg-white/[0.06] rounded-full mb-6" />
        <div className="h-10 w-full bg-white/[0.06] rounded mb-4" />
        <div className="h-10 w-3/4 bg-white/[0.06] rounded mb-6" />
        <div className="flex gap-4 mb-12">
          <div className="h-4 w-40 bg-white/[0.06] rounded" />
          <div className="h-4 w-32 bg-white/[0.06] rounded" />
          <div className="h-4 w-24 bg-white/[0.06] rounded" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`h-4 bg-white/[0.06] rounded mb-3 ${i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-5/6' : 'w-4/6'}`} />
        ))}
      </div>
    </div>
  )
}

function JsonLd({ post }: { post: BlogPost }) {
  const json = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    author: { '@type': 'Person', name: post.author },
    datePublished: post.created_at,
    wordCount: post.content.trim().split(/\s+/).length,
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
}

function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [children])
  return (
    <div className="group relative mb-6">
      <button
        onClick={copy}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded bg-white/[0.06] border border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.1] cursor-pointer"
        aria-label="Copiar código"
      >
        {copied ? <Check className="size-3.5 text-green-400" /> : <Copy className="size-3.5" />}
      </button>
      <pre className={`bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 overflow-x-auto text-sm font-mono ${className || ''}`}>
        <code>{children}</code>
      </pre>
    </div>
  )
}

const markdownComponents: Components = {
  h1: ({ children, ...props }) => {
    const id = String(children).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    return <h1 id={id} className="text-2xl md:text-3xl font-bold text-white mt-12 mb-4 scroll-mt-24" {...props}>{children}</h1>
  },
  h2: ({ children, ...props }) => {
    const id = String(children).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    return <h2 id={id} className="text-xl md:text-2xl font-semibold text-white mt-10 mb-3 scroll-mt-24" {...props}>{children}</h2>
  },
  h3: ({ children, ...props }) => {
    const id = String(children).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    return <h3 id={id} className="text-lg font-semibold text-white mt-8 mb-2 scroll-mt-24" {...props}>{children}</h3>
  },
  p: ({ children, ...props }) => <p className="text-base text-zinc-300 leading-relaxed mb-5" {...props}>{children}</p>,
  a: ({ href, children, ...props }) => (
    <a href={href} className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors inline-flex items-center gap-1" target={href?.startsWith('http') ? '_blank' : undefined} rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined} {...props}>
      {children}{href?.startsWith('http') ? <ExternalLink className="size-3 shrink-0" /> : null}
    </a>
  ),
  ul: ({ children, ...props }) => <ul className="space-y-2 mb-5 list-disc pl-6 text-zinc-300" {...props}>{children}</ul>,
  ol: ({ children, ...props }) => <ol className="space-y-2 mb-5 list-decimal pl-6 text-zinc-300" {...props}>{children}</ol>,
  li: ({ children, ...props }) => <li className="text-base leading-relaxed" {...props}>{children}</li>,
  blockquote: ({ children, ...props }) => <blockquote className="border-l-2 border-zinc-600 pl-5 italic text-zinc-400 mb-5" {...props}>{children}</blockquote>,
  code: ({ children, className, ...props }) => {
    if (className) {
      return <code className="text-sm bg-white/[0.04] px-1.5 py-0.5 rounded text-zinc-200 font-mono" {...props}>{children}</code>
    }
    return <code className="text-sm bg-white/[0.04] px-1.5 py-0.5 rounded text-zinc-200 font-mono" {...props}>{children}</code>
  },
  pre: ({ children, ...props }) => {
    const codeEl = Array.isArray(children) ? children[0] : children
    const codeText = String(codeEl?.props?.children || '')
    return <CodeBlock>{codeText}</CodeBlock>
  },
  img: ({ src, alt, ...props }) => <img src={src} alt={alt} className="rounded-xl w-full my-8 border border-white/[0.06]" loading="lazy" {...props} />,
  strong: ({ children, ...props }) => <strong className="text-white font-semibold" {...props}>{children}</strong>,
  hr: () => <hr className="border-white/[0.06] my-10" />,
}

export function BlogDetailPage() {
  const { t, i18n } = useTranslation()
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [related, setRelated] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setError('')
    getBlogPost(slug)
      .then((p) => {
        setPost(p)
        getBlogPosts().then((all) => {
          setRelated(all.filter((r) => r.slug !== slug && r.tag === p.tag).slice(0, 3))
        }).catch(() => {})
      })
      .catch(() => setError('not_found'))
      .finally(() => setLoading(false))
    window.scrollTo(0, 0)
  }, [slug])

  const headings = useMemo(() => post ? extractHeadings(post.content) : [], [post])
  const readTime = useMemo(() => post ? estimateReadTime(post.content) : '', [post])

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareText = post ? `${post.title} — Vulnify Blog` : ''

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const dateOpts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
  const locale = i18n.language === 'en' ? 'en-US' : 'es-ES'

  if (loading) return <Skeleton />

  if (error || !post) {
    return (
      <div className="min-h-screen pt-28 md:pt-36 flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl font-bold text-white mb-4">404</p>
          <p className="text-zinc-400 mb-8">{t('blog.not_found_desc')}</p>
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors no-underline">
            <ArrowLeft className="size-4" /> {t('blog.back_to_blog')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <SEO
        title={t('blog.detail_title', { title: post.title })}
        description={t('blog.detail_description', { title: post.title, description: post.excerpt })}
        image={`https://vulnify.es/og-blog.png`}
      />
      <JsonLd post={post} />
      <ReadingProgress />
      <BackToTop />

      <div className="min-h-screen pt-28 md:pt-36">
        <article className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-16 md:py-24">
          {/* Back link */}
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-12 no-underline">
            <ArrowLeft className="size-4" /> {t('blog.back_to_blog')}
          </Link>

          <div className="flex gap-12">
            {/* Main content */}
            <div className="flex-1 min-w-0 max-w-3xl">
              {/* Tag */}
              <span className="inline-block text-xs tracking-[0.15em] uppercase px-3 py-1 rounded-full border border-white/[0.06] text-zinc-300 mb-6">
                {post.tag}
              </span>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
                {post.title}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400 mb-10">
                <span className="flex items-center gap-1.5">
                  <User className="size-3.5" />
                  {t('blog.author_by', { author: post.author })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  {t('blog.published_on', { date: new Date(post.created_at).toLocaleDateString(locale, dateOpts) })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  {t('blog.min_read', { time: readTime })}
                </span>
                <span className="text-zinc-600 text-xs">{post.content.trim().split(/\s+/).length} palabras</span>
              </div>

              {/* Share buttons */}
              <div className="flex flex-wrap gap-2 mb-12 pb-8 border-b border-white/[0.06]">
                <ShareButton href={`https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`} label={t('blog.share_twitter')} svg={<svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>} />
                <ShareButton href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} label={t('blog.share_linkedin')} svg={<svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>} />
                <ShareButton href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`} label={t('blog.share_whatsapp')} svg={<svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>} />
                <ShareButton icon={copied ? Check : Copy} label={copied ? t('blog.share_copied') : t('blog.share_copy')} onClick={copyLink} />
              </div>

              {/* Mobile TOC */}
              <TocMobile headings={headings} />

              {/* Content */}
              <div className="prose-custom max-w-none">
                <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {post.content}
                </Markdown>
              </div>

              {/* Tag at bottom */}
              <div className="mt-12 flex flex-wrap gap-2">
                <span className="text-xs tracking-[0.15em] uppercase text-zinc-500 mr-2 self-center">Tags:</span>
                <Link to={`/blog?tag=${encodeURIComponent(post.tag)}`} className="text-xs px-3 py-1 rounded-full border border-white/[0.06] text-zinc-400 hover:text-white hover:border-white/20 transition-colors no-underline">
                  {post.tag}
                </Link>
              </div>

              {/* Author bio */}
              <div className="mt-12 p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-start gap-4">
                <div className="size-12 rounded-full bg-gradient-to-br from-zinc-500 to-zinc-700 flex items-center justify-center shrink-0">
                  <User className="size-5 text-white" />
                </div>
                <div>
                  <p className="text-xs tracking-[0.15em] uppercase text-zinc-500 mb-1">{t('blog.author_label')}</p>
                  <p className="text-sm font-medium text-white mb-1">{post.author}</p>
                  <p className="text-sm text-zinc-400">Vulnify — Desarrollo Web & IA</p>
                </div>
              </div>

              {/* Subscribe CTA inline */}
              <div className="mt-12 p-6 md:p-8 rounded-xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.06] text-center">
                <Mail className="size-6 text-zinc-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-white mb-1">¿Te ha gustado este artículo?</p>
                <p className="text-xs text-zinc-500 mb-4">Recibe contenido como este cada semana en tu email.</p>
                <form onSubmit={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('open-contact')) }} className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto">
                  <input type="email" placeholder="tu@email.com" className="flex-1 px-3 py-2 text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-colors" />
                  <button type="submit" className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer border-none whitespace-nowrap">
                    Suscribirse <ArrowRight className="size-3" />
                  </button>
                </form>
              </div>
            </div>

            {/* Sidebar TOC */}
            <TocSidebar headings={headings} />
          </div>

          {/* Related posts */}
          {related.length > 0 && (
            <section className="mt-24 pt-16 border-t border-white/[0.06]">
              <h2 className="text-xl font-semibold text-white mb-8 flex items-center gap-2">
                <BookOpen className="size-5" /> {t('blog.related')}
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {related.map((rp) => (
                  <Link key={rp.id} to={`/blog/${rp.slug}`} className="group block p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors no-underline">
                    <span className="text-xs tracking-[0.1em] uppercase text-zinc-500 mb-2 block">{rp.tag}</span>
                    <h3 className="text-sm font-medium text-white group-hover:text-zinc-200 transition-colors mb-2">{rp.title}</h3>
                    <p className="text-xs text-zinc-500 line-clamp-2">{rp.excerpt}</p>
                    <div className="flex items-center gap-2 mt-3 text-xs text-zinc-500">
                      <Calendar className="size-3" />
                      {new Date(rp.created_at).toLocaleDateString(locale, dateOpts)}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Bottom share */}
          <div className="mt-16 pt-8 border-t border-white/[0.06]">
            <p className="text-xs tracking-[0.15em] uppercase text-zinc-500 mb-4 text-center">Comparte este artículo</p>
            <div className="flex justify-center flex-wrap gap-2">
              <ShareButton href={`https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`} label={t('blog.share_twitter')} svg={<svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>} />
              <ShareButton href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} label={t('blog.share_linkedin')} svg={<svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>} />
              <ShareButton href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`} label={t('blog.share_whatsapp')} svg={<svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>} />
              <ShareButton icon={copied ? Check : Copy} label={copied ? t('blog.share_copied') : t('blog.share_copy')} onClick={copyLink} />
            </div>
          </div>
        </article>
      </div>
    </>
  )
}
