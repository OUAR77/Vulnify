import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, MessageCircle, User, ShieldAlert } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient'
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon'
import { AboutModal } from '@/components/ui/about-modal'
import { ContactModal } from '@/components/ui/contact-modal'
import { ChatWidget } from '@/components/ui/chat-widget'
import { useAuth } from '@/lib/auth-context'
import { useTranslation } from 'react-i18next'

const ScrollProgress = () => {
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

const CookieBanner = () => {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const accepted = localStorage.getItem('cookies-accepted')
    if (!accepted) setVisible(true)
  }, [])
  const accept = () => { localStorage.setItem('cookies-accepted', 'true'); setVisible(false) }
  const reject = () => { setVisible(false) }
  if (!visible) return null
  return (
    <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a] border-t border-white/[0.04] py-4 px-6">
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-zinc-300 leading-relaxed">
          {t('cookie_banner.text')}{' '}
          <Link to="/privacidad" className="underline hover:text-white transition-colors">{t('cookie_banner.policy_link')}</Link>.
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={accept} className="px-5 py-2 text-xs font-medium rounded-lg bg-white text-black hover:bg-zinc-200 transition-colors">{t('cookie_banner.accept')}</button>
          <button onClick={reject} className="px-5 py-2 text-xs font-medium rounded-lg border border-white/[0.06] text-zinc-400 hover:text-white transition-colors">{t('cookie_banner.reject')}</button>
        </div>
      </div>
    </motion.div>
  )
}

function LangSwitcher() {
  const { i18n } = useTranslation()
  const langs = [
    { code: 'es', label: 'ES' },
    { code: 'en', label: 'EN' },
  ]
  return (
    <div className="flex items-center gap-2">
      {langs.map((l) => (
        <button
          key={l.code}
          onClick={() => i18n.changeLanguage(l.code)}
          className={`text-xs font-medium px-2 py-1 rounded transition-colors bg-transparent border-none cursor-pointer ${
            i18n.language === l.code ? 'text-white bg-white/10' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}

function AuthButtons() {
  const { t } = useTranslation()
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        {isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors bg-transparent border-none cursor-pointer"
          >
            {t('nav.admin')}
          </button>
        )}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
        >
          <User className="size-3.5" />
          {user?.name}
        </button>
        <button
          onClick={() => { logout(); navigate('/') }}
          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors bg-transparent border-none cursor-pointer"
        >
          {t('nav.cerrar_sesion')}
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <Link to="/login" className="text-sm text-zinc-500 hover:text-white transition-colors no-underline">
        {t('nav.iniciar_sesion')}
      </Link>
      <Link to="/register" className="text-sm font-medium text-white hover:text-zinc-300 transition-colors no-underline">
        {t('nav.registrarse')}
      </Link>
    </div>
  )
}

function MobileAuthButtons() {
  const { t } = useTranslation()
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  if (isAuthenticated) {
    return (
      <div className="flex flex-col items-center gap-4 mt-4">
        {isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className="text-lg text-blue-400 hover:text-blue-300 transition-colors bg-transparent border-none cursor-pointer"
          >
            <ShieldAlert className="size-5 inline me-2" />
            {t('nav.panel_admin')}
          </button>
        )}
        <button
          onClick={() => navigate('/dashboard')}
          className="text-xl text-zinc-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
        >
          <User className="size-5 inline me-2" />
          {user?.name}
        </button>
        <button
          onClick={() => { logout(); navigate('/') }}
          className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors bg-transparent border-none cursor-pointer"
        >
          {t('nav.cerrar_sesion')}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 mt-4">
      <Link to="/login" className="text-xl text-zinc-400 hover:text-white transition-colors no-underline">
        {t('nav.iniciar_sesion')}
      </Link>
      <Link to="/register" className="text-xl font-medium text-white hover:text-zinc-300 transition-colors no-underline">
        {t('nav.registrarse')}
      </Link>
    </div>
  )
}

export function SiteLayout() {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isDark, setIsDark] = useState(true)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handler = () => setContactOpen(true)
    window.addEventListener('open-contact', handler)
    return () => window.removeEventListener('open-contact', handler)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('light', !isDark)
  }, [isDark])

  useEffect(() => {
    document.body.style.overflow = menuOpen || aboutOpen || contactOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen, aboutOpen, contactOpen])

  useEffect(() => {
    setMenuOpen(false)
    if (location.hash) {
      setTimeout(() => {
        const el = document.getElementById(location.hash.replace('#', ''))
        el?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } else {
      window.scrollTo(0, 0)
    }
  }, [location.pathname, location.hash])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (location.pathname === '/contacto') {
      navigate('/#contacto', { replace: true })
    } else if (location.pathname === '/sobre-nosotros') {
      setAboutOpen(true)
    }
  }, [location.pathname])

  const handleNavClick = (section: string) => {
    setMenuOpen(false)
    if (location.pathname !== '/') {
      navigate(`/#${section}`)
    } else {
      const el = document.getElementById(section)
      el?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const navItems = [
    { label: t('nav.servicios'), section: 'servicios' },
    { label: t('nav.trabajo'), section: 'insight' },
    { label: t('nav.proceso'), section: 'proceso' },
    { label: t('nav.contacto'), section: 'contacto' },
  ]

  return (
    <div className="relative bg-black text-zinc-300 antialiased selection:bg-zinc-500/30 selection:text-white min-h-screen">
      <ScrollProgress />

      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.1, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5 transition-all duration-500 ${
          scrolled ? 'bg-[#050505]/90 backdrop-blur-2xl' : ''
        }`}
        style={{ borderBottom: scrolled ? '1px solid rgba(255,255,255,0.04)' : '1px solid transparent' }}
      >
        <Link to="/" className="text-base font-bold tracking-[0.3em] text-white/90 no-underline">{t('common.brand')}</Link>
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavClick(item.section)}
              className="text-sm text-zinc-500 hover:text-white transition-colors relative group bg-transparent border-none cursor-pointer"
            >
              {item.label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-white/40 group-hover:w-full transition-all duration-300" />
            </button>
          ))}
          <LangSwitcher />
          <div className="w-px h-5 bg-white/[0.06]" />
          <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
          <AuthButtons />
          <HoverBorderGradient as="button" onClick={() => window.dispatchEvent(new CustomEvent('open-contact'))} className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium">
            {t('header.quote_button')} <ArrowUpRight className="size-3.5" />
          </HoverBorderGradient>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-white/80 p-2" aria-label={t('header.menu_aria')}>
          <MenuToggleIcon open={menuOpen} className="size-5" duration={500} />
        </button>
      </motion.nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#050505]/98 backdrop-blur-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.04]">
              <Link to="/" className="text-base font-bold tracking-[0.3em] text-white/90 no-underline">{t('common.brand')}</Link>
              <button onClick={() => setMenuOpen(false)} className="text-white/60 p-2">
                <MenuToggleIcon open={true} className="size-5" duration={500} />
              </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-10">
              {navItems.map((item, i) => (
                <motion.button
                  key={item.label}
                  onClick={() => handleNavClick(item.section)}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="text-4xl md:text-5xl tracking-tight text-zinc-500 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                >
                  {item.label}
                </motion.button>
              ))}
              <HoverBorderGradient as="button" onClick={() => window.dispatchEvent(new CustomEvent('open-contact'))} className="flex items-center gap-2 px-8 py-4 text-base font-medium">
                {t('nav.solicitar_presupuesto')} <ArrowUpRight className="size-4" />
              </HoverBorderGradient>
              <MobileAuthButtons />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        <motion.a
          href="https://wa.me/34600000000"
          target="_blank" rel="noopener noreferrer"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 2.2, duration: 0.4, type: 'spring' }}
          className="size-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg hover:scale-110 hover:bg-emerald-400 transition-all"
          whileHover={{ rotate: -8 }}
          aria-label={t('floating.whatsapp_aria')}
        >
          <MessageCircle className="size-5" />
        </motion.a>
        <motion.button
          onClick={() => window.dispatchEvent(new CustomEvent('open-contact'))}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 2, duration: 0.4, type: 'spring' }}
          className="size-14 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
          whileHover={{ rotate: -12 }}
          aria-label={t('floating.contact_aria')}
        >
          <ArrowUpRight className="size-5" />
        </motion.button>
      </div>

      <Outlet context={{ aboutOpen, setAboutOpen }} />

      <footer className="relative z-10 w-full bg-zinc-950 border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-16 md:py-20">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div>
              <Link to="/" className="text-base font-bold tracking-[0.3em] text-white no-underline">{t('common.brand')}</Link>
              <p className="text-sm text-zinc-400 mt-4 max-w-[200px] leading-relaxed">{t('footer.description')}</p>
            </div>
            {[
              { title: t('footer.column_services'), links: [
                { label: t('footer.service_web'), to: '/servicios/desarrollo-web' },
                { label: t('footer.service_ia'), to: '/servicios/integraciones-ia' },
                { label: t('footer.service_apis'), to: '/servicios/apis-backend' },
                { label: t('footer.service_consulting'), to: '/servicios/consultoria' },
              ]},
              { title: t('footer.column_company'), links: [
                { label: t('footer.company_about'), to: '/sobre-nosotros', isAbout: true },
                { label: t('footer.company_blog'), to: '/blog' },
                { label: t('footer.company_cases'), to: '/casos-de-exito' },
                { label: t('footer.company_portfolio'), to: '/portfolio' },
                { label: t('footer.company_contact'), to: '/contacto' },
              ]},
              { title: t('footer.column_legal'), links: [
                { label: t('footer.legal_privacy'), to: '/privacidad' },
                { label: t('footer.legal_terms'), to: '/terminos' },
                { label: t('footer.legal_cookies'), to: '/cookies' },
              ]},
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-xs tracking-[0.2em] uppercase text-zinc-300 mb-5">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.isAbout ? (
                        <button
                          onClick={() => setAboutOpen(true)}
                          className="text-sm text-zinc-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer p-0"
                        >
                          {link.label}
                        </button>
                      ) : (
                        <Link to={link.to} className="text-sm text-zinc-400 hover:text-white transition-colors no-underline">
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-zinc-500">{t('footer.copyright', { year: new Date().getFullYear() })}</p>
            <div className="flex items-center gap-5">
              <Link to="/privacidad" className="text-sm text-zinc-400 hover:text-white transition-colors no-underline">{t('footer.legal_privacy')}</Link>
              <Link to="/terminos" className="text-sm text-zinc-400 hover:text-white transition-colors no-underline">{t('footer.legal_terms')}</Link>
              <Link to="/cookies" className="text-sm text-zinc-400 hover:text-white transition-colors no-underline">{t('footer.legal_cookies')}</Link>
              <span className="text-zinc-700">|</span>
              <a href={`mailto:${t('footer.email')}`} className="text-sm text-zinc-400 hover:text-white transition-colors no-underline">{t('footer.email')}</a>
            </div>
          </div>
        </div>
      </footer>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
      <CookieBanner />
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <ChatWidget />
    </div>
  )
}
