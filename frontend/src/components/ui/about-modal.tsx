import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Code, Heart, Target, Zap } from 'lucide-react'

export function AboutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const principles = t('about_modal.principles', { returnObjects: true }) as { title: string; desc: string }[]
  const values = [
    { icon: Code, title: principles[0]?.title, desc: principles[0]?.desc },
    { icon: Heart, title: principles[1]?.title, desc: principles[1]?.desc },
    { icon: Target, title: principles[2]?.title, desc: principles[2]?.desc },
    { icon: Zap, title: principles[3]?.title, desc: principles[3]?.desc },
  ]

  const stats = [
    { label: t('stats.projects'), value: '40+' },
    { label: t('stats.experience'), value: '6+' },
    { label: t('stats.clients'), value: '98%' },
    { label: t('stats.response'), value: '24h' },
  ]
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-8 overflow-y-auto"
        >
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full max-w-3xl rounded-2xl border border-white/[0.06] bg-[#0a0a0a] p-8 md:p-12 shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 size-10 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-600 hover:text-white hover:border-white/20 transition-all"
            >
              <X className="size-4" />
            </button>

            <div className="mb-10">
              <span className="inline-block text-[11px] tracking-[0.25em] uppercase text-zinc-600 mb-4 font-mono">{t('about_modal.badge')}</span>
              <h2 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight mb-6">
                {t('about_modal.heading')}
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
                {t('about_modal.body')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-10">
              {stats.map((s) => (
                <div key={s.label} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-5 text-center">
                  <div className="text-2xl font-bold text-white mb-1">{s.value}</div>
                  <div className="text-xs text-zinc-600">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="mb-10">
              <h3 className="text-sm font-medium text-white mb-6 tracking-wide">{t('about_modal.principles_heading')}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {values.map((v) => (
                  <div key={v.title} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-5">
                    <div className="size-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-3">
                      <v.icon className="size-4 text-zinc-400" />
                    </div>
                    <h4 className="text-sm font-medium text-white mb-1">{v.title}</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">{v.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="size-12 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 border border-white/[0.06] flex items-center justify-center text-base font-bold text-zinc-400 shrink-0">
                DR
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{t('about_modal.founder_name')}</div>
                <div className="text-xs text-zinc-600">{t('about_modal.founder_role')}</div>
                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                  {t('about_modal.founder_bio')}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
