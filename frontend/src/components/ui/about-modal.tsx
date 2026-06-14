import { motion, AnimatePresence } from 'framer-motion'
import { X, Code, Heart, Target, Zap } from 'lucide-react'

const values = [
  { icon: Code, title: 'Tecnología con propósito', desc: 'No usamos tecnología por moda. Cada decisión técnica responde a un objetivo de negocio real.' },
  { icon: Heart, title: 'Diseño centrado en personas', desc: 'Detrás de cada interfaz hay un ser humano. Construimos experiencias que importan.' },
  { icon: Target, title: 'Resultados medibles', desc: 'Si no se puede medir, no se puede mejorar. Cada proyecto tiene KPIs claros desde el día uno.' },
  { icon: Zap, title: 'Mejora continua', desc: 'El lanzamiento es solo el principio. Iteramos, optimizamos y evolucionamos contigo.' },
]

export function AboutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
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
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
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
              <span className="inline-block text-[11px] tracking-[0.25em] uppercase text-zinc-600 mb-4 font-mono">Sobre nosotros</span>
              <h2 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight mb-6">
                Construimos el futuro digital de tu negocio.
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
                En Vulnify creemos que la tecnología debería ser invisible. No diseñamos páginas bonitas: creamos ecosistemas digitales 
                que trabajan para ti. Combinamos desarrollo web, inteligencia artificial y estrategia para convertir tu presencia online 
                en una máquina de crecimiento.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-10">
              {[
                { label: 'Proyectos entregados', value: '40+' },
                { label: 'Años de experiencia', value: '6+' },
                { label: 'Clientes satisfechos', value: '98%' },
                { label: 'Respuesta inicial', value: '24h' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-5 text-center">
                  <div className="text-2xl font-bold text-white mb-1">{s.value}</div>
                  <div className="text-xs text-zinc-600">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="mb-10">
              <h3 className="text-sm font-medium text-white mb-6 tracking-wide">Nuestros principios</h3>
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
                <div className="text-sm font-medium text-white">Dani Ramirez</div>
                <div className="text-xs text-zinc-600">CTO & Fundador de Vulnify</div>
                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                  +6 años construyendo productos digitales. Ex-CTO de startups. Convencido de que la tecnología bien aplicada transforma negocios.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
