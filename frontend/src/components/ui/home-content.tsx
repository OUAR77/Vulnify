import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, Globe, Bot, Code, Cpu, Zap, ChevronRight, Plus, MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ArtificialHero } from '@/components/ui/artificial-hero'
import { BorderBeam } from '@/components/ui/border-beam'
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient'
import { BentoPricing } from '@/components/ui/bento-pricing'
import { MeshGradient } from '@paper-design/shaders-react'
import FlowArt, { FlowSection } from './story-scroll'
import Testimonials from './twitter-testimonial-cards'
import { AnimatedHeroText } from './animated-hero-text'
import { getFAQs, getTestimonials, type FAQData, type TestimonialData } from '@/lib/api'

export function FloatingPathsEffect() {
  return (
    <>
      <ArtificialHero />
      <div className="fixed inset-0 z-0 pointer-events-none opacity-30">
        <MeshGradient
          className="w-full h-full"
          colors={["#000000", "#1a1a1a", "#333333", "#ffffff"]}
          speed={0.5}
        />
      </div>
    </>
  )
}

const FAQItem = ({ question, answer }: any) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden relative">
      <BorderBeam duration={10} lightColor="#FAFAFA" borderWidth={1} />
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-6 text-left">
        <span className="text-sm font-medium text-white">{question}</span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }} className="text-zinc-600 shrink-0 ml-4">
          <Plus className="size-4" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 text-sm text-zinc-500 leading-relaxed">{answer}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ContactForm() {
  const { t } = useTranslation()
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const BASE = import.meta.env.VITE_API_URL || ''
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch(`${BASE}/api/contact`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) setSent(true)
      else setError(t('contact.form.error'))
    } catch {
      setError(t('contact.form.error'))
    }
  }
  if (sent) return <p className="text-sm text-zinc-400 text-center py-8">{t('contact.form.success')}</p>
  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="text-xs text-zinc-600 mb-2 block">{t('contact.form.name_label')}</label>
        <input type="text" placeholder={t('contact.form.name_placeholder')} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
          className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-zinc-600 outline-none focus:border-white/20 transition-colors" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-zinc-600 mb-2 block">{t('contact.form.email_label')}</label>
          <input type="email" placeholder={t('contact.form.email_placeholder')} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-zinc-600 outline-none focus:border-white/20 transition-colors" required />
        </div>
        <div>
          <label className="text-xs text-zinc-600 mb-2 block">{t('contact.form.phone_label')}</label>
          <input type="tel" placeholder={t('contact.form.phone_placeholder')} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-zinc-700 outline-none focus:border-white/20 transition-colors" />
        </div>
      </div>
      <div>
        <label className="text-xs text-zinc-600 mb-2 block">{t('contact.form.message_label')}</label>
        <textarea rows={4} placeholder={t('contact.form.message_placeholder')} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
          className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-zinc-700 outline-none focus:border-white/20 transition-colors resize-none" required />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <HoverBorderGradient as="button" type="submit" className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-medium">
        {t('contact.form.submit')} <ArrowUpRight className="size-4" />
      </HoverBorderGradient>
      <p className="text-xs text-zinc-700 text-center">{t('contact.form.footnote')}</p>
    </form>
  )
}

export function HomeContent() {
  const { t } = useTranslation()
  const [faqs, setFaqs] = useState<FAQData[]>([])
  const [testimonials, setTestimonials] = useState<TestimonialData[]>([])
  useEffect(() => { getFAQs().then(setFaqs).catch(() => {}) }, [])
  useEffect(() => { getTestimonials(true).then(setTestimonials).catch(() => {}) }, [])

  const stats = [
    { number: '40+', label: t('stats.projects') },
    { number: '6+', label: t('stats.experience') },
    { number: '98%', label: t('stats.clients') },
    { number: '24h', label: t('stats.response') },
  ]

  const serviceIcons = [Globe, Bot, Code, Cpu]
  const services = t('services.items', { returnObjects: true }) as { name: string; desc: string }[]

  const steps = t('process.steps', { returnObjects: true }) as { title: string; desc: string }[]

  const solutionIcons = [Globe, Bot, Zap]
  const solutionItems = t('problem.solution_items', { returnObjects: true }) as { title: string; desc: string }[]

  return (
    <>
      <FlowArt className="relative z-10">

        {/* SECTION 1: Hero + Stats + CTA */}
        <FlowSection aria-label="Arquitectura Digital" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em]">{t('hero.label')}</p>
          </div>
          <hr className="border-none border-t border-white/20 my-[2vw]" />
          <div className="flex flex-col justify-center min-h-[30vh]">
            <AnimatedHeroText />
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mt-6 leading-relaxed">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <HoverBorderGradient as="button" onClick={() => window.dispatchEvent(new CustomEvent('open-contact'))} className="flex items-center gap-2 px-8 py-4 text-base font-medium">
                {t('hero.cta_audit')} <ArrowUpRight className="size-4" />
              </HoverBorderGradient>
              <a href="https://wa.me/34600000000" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-8 py-4 text-base font-medium text-zinc-400 hover:text-white border border-white/[0.06] rounded-xl hover:border-white/20 transition-all"
              >
                <MessageCircle className="size-4" />
                {t('hero.cta_whatsapp')}
              </a>
            </div>
          </div>
          <hr className="border-none border-t border-white/20 my-[2vw]" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">{s.number}</div>
                <div className="text-sm text-zinc-600">{s.label}</div>
              </div>
            ))}
          </div>
        </FlowSection>

      </FlowArt>

      {/* ====== Content after FlowArt — standard scrollable sections ====== */}

      {/* Problem → Solution */}
      <div className="w-full border-b border-white/[0.04]">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <div className="text-center mb-16">
            <span className="text-[11px] tracking-[0.25em] uppercase text-zinc-600 font-mono">{t('problem.label')}</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight mt-5 mb-6">
              {t('problem.heading')}
            </h2>
            <p className="text-zinc-500 leading-relaxed max-w-2xl mx-auto">
              {t('problem.description')}
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 relative overflow-hidden">
              <BorderBeam duration={10} lightColor="#FAFAFA" borderWidth={1} />
              <span className="text-xs text-zinc-600 font-mono mb-4 block">{t('problem.signals_label')}</span>
              <div className="space-y-3">
                {(t('problem.signals_items', { returnObjects: true }) as string[]).map((item: string) => (
                  <div key={item} className="flex items-center gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                    <span className="size-2 rounded-full bg-red-400/60" />
                    <span className="text-sm text-zinc-400">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 relative overflow-hidden">
              <BorderBeam duration={10} lightColor="#FAFAFA" borderWidth={1} />
              <span className="text-xs text-zinc-600 font-mono mb-4 block">{t('problem.solution_label')}</span>
              <div className="space-y-3">
                {solutionItems.map((item, i) => {
                  const IconComponent = solutionIcons[i]
                  return (
                    <div key={item.title} className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02]">
                      <div className="size-9 rounded-lg bg-zinc-500/10 border border-zinc-500/20 flex items-center justify-center shrink-0">
                        <IconComponent className="size-4 text-zinc-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{item.title}</div>
                        <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services */}
      <div id="servicios" className="w-full border-b border-white/[0.04]">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <div className="mb-16">
            <span className="text-[11px] tracking-[0.25em] uppercase text-zinc-600 font-mono">{t('services.label')}</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight max-w-2xl mt-5">
              {t('services.heading')}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {services.map((s, i) => {
              const IconComponent = serviceIcons[i]
              return (
                <div key={s.name} className="group p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/15 transition-all duration-500 relative overflow-hidden">
                  <BorderBeam duration={10} lightColor="#FAFAFA" borderWidth={1} />
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-3xl font-bold text-zinc-700 group-hover:text-zinc-500 transition-colors">{String(i + 1).padStart(2, '0')}</span>
                    <div className="size-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-zinc-500/10 transition-colors">
                      <IconComponent className="size-4 text-zinc-400 group-hover:text-zinc-400 transition-colors" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{s.name}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{s.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Process */}
      <div id="proceso" className="w-full border-b border-white/[0.04]">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <div className="mb-16">
            <span className="text-[11px] tracking-[0.25em] uppercase text-zinc-600 font-mono">{t('process.label')}</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight mt-5">{t('process.heading')}</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <div key={s.title} className="relative">
                <span className="text-6xl md:text-7xl font-bold text-white/[0.04] block mb-4 leading-none">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{s.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 -right-6 text-zinc-700">
                    <ChevronRight className="size-5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="w-full border-b border-white/[0.04]">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <div className="mb-16 text-center">
            <span className="text-[11px] tracking-[0.25em] uppercase text-zinc-600 font-mono">{t('testimonials.label')}</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight mt-5">{t('testimonials.heading')}</h2>
          </div>
          <div className="flex justify-center">
            <Testimonials cards={testimonials.length > 0 ? testimonials.map((testimonial) => ({
              username: testimonial.name,
              handle: testimonial.company ? `@${testimonial.company.toLowerCase().replace(/\s+/g, '')}` : '@cliente',
              content: testimonial.content,
              avatar: testimonial.avatar_url || undefined,
              verified: testimonial.rating >= 4,
              likes: testimonial.rating * 50,
              retweets: testimonial.rating * 10,
              date: new Date().toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' }),
              className: "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-2xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/60 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-500 hover:grayscale-0 before:left-0 before:top-0",
            })) : undefined} />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="w-full border-b border-white/[0.04]">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <BentoPricing />
        </div>
      </div>

      {/* FAQ */}
      <div className="w-full border-b border-white/[0.04]">
        <div className="mx-auto max-w-3xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <div className="text-center mb-16">
            <span className="text-[11px] tracking-[0.25em] uppercase text-zinc-600 font-mono">{t('faq.label')}</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight mt-4">
              {t('faq.heading')}
            </h2>
          </div>
          <div className="space-y-3">
            {(faqs.length > 0 ? faqs : [
              { id: 0, question: '¿Cuánto tiempo lleva desarrollar una web?', answer: 'Depende de la complejidad. Una web corporativa puede estar lista en 2-3 semanas. Proyectos con IA integrada suelen requerir 4-6 semanas.', category: 'General', order: 0, published: true },
              { id: 1, question: '¿Necesito tener claro todo antes de empezar?', answer: 'No. Te guiamos desde la idea. Nuestro proceso incluye una fase de auditoría y estrategia donde definimos juntos el alcance.', category: 'General', order: 0, published: true },
              { id: 2, question: '¿Ofrecen mantenimiento después del lanzamiento?', answer: 'Sí. Todos nuestros proyectos incluyen soporte post-lanzamiento y planes de mantenimiento continuo para mantener tu web actualizada.', category: 'General', order: 0, published: true },
              { id: 3, question: '¿Cómo integran la inteligencia artificial?', answer: 'Desde chatbots personalizados hasta automatización de procesos y análisis predictivo. Evaluamos tu caso y proponemos la solución óptima.', category: 'General', order: 0, published: true },
            ]).map((item) => (
              <FAQItem key={item.id} question={item.question} answer={item.answer} />
            ))}
          </div>
        </div>
      </div>

      {/* Contact + CTA */}
      <div id="contacto" className="w-full border-b border-white/[0.04]">
        <div className="mx-auto max-w-3xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <div className="text-center mb-14">
            <span className="text-[11px] tracking-[0.25em] uppercase text-zinc-600 font-mono">{t('contact.label')}</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight mt-4 mb-4">
              {t('contact.heading')}
            </h2>
            <p className="text-sm text-zinc-500 leading-relaxed max-w-md mx-auto">
              {t('contact.description')}
            </p>
          </div>
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 relative overflow-hidden">
            <BorderBeam duration={10} lightColor="#FAFAFA" borderWidth={1} />
            <ContactForm />
          </div>
          <div className="text-center mt-20">
            <span className="text-[11px] tracking-[0.25em] uppercase text-zinc-600 font-mono">{t('final_cta.label')}</span>
            <h2 className="text-3xl md:text-6xl font-bold text-white leading-[1.05] tracking-tight mt-4 mb-6">
              {t('final_cta.heading')}
            </h2>
            <p className="text-base md:text-lg text-zinc-500 leading-relaxed mb-8 max-w-xl mx-auto">
              {t('final_cta.description')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
              <HoverBorderGradient as="button" onClick={() => window.dispatchEvent(new CustomEvent('open-contact'))} className="flex items-center gap-2 px-8 py-4 text-base font-medium">
                {t('hero.cta_audit')} <ArrowUpRight className="size-4" />
              </HoverBorderGradient>
              <a href="https://wa.me/34600000000" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-8 py-4 text-base font-medium text-zinc-400 hover:text-white border border-white/[0.06] rounded-xl hover:border-white/20 transition-all"
              >
                <MessageCircle className="size-4" />
                {t('hero.cta_whatsapp')}
              </a>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-700">
              <span className="size-1.5 rounded-full bg-amber-400/60 animate-pulse" />
              {t('final_cta.scarcity')}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
