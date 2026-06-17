import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowUpRight } from 'lucide-react'
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient'

interface ContactModalProps {
  open: boolean
  onClose: () => void
}

export function ContactModal({ open, onClose }: ContactModalProps) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [error, setError] = useState('')
  const BASE = import.meta.env.VITE_API_URL || ''

  useEffect(() => {
    if (!open) {
      setForm({ name: '', email: '', phone: '', message: '' })
      setStatus('idle')
      setError('')
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('saving')
    setError('')
    try {
      const res = await fetch(`${BASE}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) setStatus('saved')
      else setError('Error al enviar. Intenta de nuevo.')
    } catch {
      setError('Error al enviar. Intenta de nuevo.')
    }
    if (error) setStatus('idle')
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg rounded-2xl border border-white/[0.06] bg-zinc-950 p-8 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
            >
              <X className="size-5" />
            </button>

            <h2 className="text-2xl font-bold text-white mb-2">Solicitar presupuesto</h2>
            <p className="text-sm text-zinc-500 mb-8">
              Cuéntanos tu proyecto y te enviaremos un presupuesto personalizado en 24h.
            </p>

            {status === 'saved' ? (
              <div className="text-center py-12">
                <div className="size-16 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                  <ArrowUpRight className="size-6 text-zinc-300" />
                </div>
                <p className="text-zinc-300 text-lg font-medium mb-1">¡Mensaje enviado!</p>
                <p className="text-sm text-zinc-500">Te responderemos en menos de 24h.</p>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="text-xs text-zinc-600 mb-2 block">Nombre completo *</label>
                  <input
                    type="text" placeholder="Tu nombre" required
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-zinc-600 outline-none focus:border-white/20 transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-600 mb-2 block">Email *</label>
                    <input
                      type="email" placeholder="tu@email.com" required
                      value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-zinc-600 outline-none focus:border-white/20 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-600 mb-2 block">Teléfono</label>
                    <input
                      type="tel" placeholder="+34 600 000 000"
                      value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-zinc-700 outline-none focus:border-white/20 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-600 mb-2 block">Mensaje *</label>
                  <textarea
                    rows={4} placeholder="Cuéntanos en qué podemos ayudarte..." required
                    value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-zinc-700 outline-none focus:border-white/20 transition-colors resize-none"
                  />
                </div>
                {error && <p className="text-xs text-red-400">{error}</p>}
                <HoverBorderGradient as="button" type="submit" className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-medium">
                  {status === 'saving' ? 'Enviando...' : 'Enviar mensaje'} <ArrowUpRight className="size-4" />
                </HoverBorderGradient>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
