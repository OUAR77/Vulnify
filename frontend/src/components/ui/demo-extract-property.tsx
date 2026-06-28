import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bot, ArrowUpRight, Sparkles, Building2, Euro, Ruler, DoorOpen, Bath, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const BASE = import.meta.env.VITE_API_URL || ''

const EXAMPLE = "Piso en el centro de Madrid, 80m2, 3 habitaciones, 2 baños, 5ª planta con ascensor, garaje incluido. Precio: 295.000€. Gastos de comunidad: 85€/mes."

type FieldType = 'string' | 'number' | 'boolean'

const FIELD_META: Record<string, { label: string; icon: React.ElementType; type: FieldType; prefix?: string }> = {
  direccion: { label: 'Dirección', icon: Building2, type: 'string' },
  precio: { label: 'Precio', icon: Euro, type: 'number', prefix: '€' },
  metros_cuadrados: { label: 'Metros²', icon: Ruler, type: 'number', prefix: 'm²' },
  habitaciones: { label: 'Habitaciones', icon: DoorOpen, type: 'number' },
  banos: { label: 'Baños', icon: Bath, type: 'number' },
  tipo: { label: 'Tipo', icon: Building2, type: 'string' },
  estado: { label: 'Estado', icon: Sparkles, type: 'string' },
}

export function DemoExtractProperty() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const extract = async () => {
    if (!input.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch(`${BASE}/api/extract-property`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Error')
      setResult(data.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al extraer datos')
    } finally {
      setLoading(false)
    }
  }

  const renderValue = (key: string, value: unknown) => {
    const meta = FIELD_META[key as keyof typeof FIELD_META]
    if (meta?.type === 'boolean') {
      return value ? 'Sí' : 'No'
    }
    if (meta?.type === 'number' && meta?.prefix) {
      return `${value}${meta.prefix}`
    }
    return String(value ?? '—')
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-4xl px-6 md:px-12 lg:px-20 py-16 md:py-24">
        <Link to="/servicios/automatizacion-inmobiliaria" className="text-xs text-zinc-600 hover:text-white transition-colors inline-flex items-center gap-1 mb-8">
          <ArrowLeft className="size-3" /> Volver al servicio
        </Link>

        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase text-zinc-600 mb-4 font-mono">
            <Sparkles className="size-3" /> Demo
          </span>
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight mb-4">
            Extrae datos de una propiedad con IA
          </h1>
          <p className="text-sm text-zinc-500 max-w-xl mx-auto">
            Pega la descripción de una propiedad y mira cómo la IA extrae todos los datos estructurados al instante.
          </p>
        </div>

        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6 mb-6">
          <label className="text-xs text-zinc-600 mb-3 block font-mono">Descripción de la propiedad</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={EXAMPLE}
            rows={5}
            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-zinc-700 outline-none focus:border-white/20 transition-colors resize-none font-mono"
          />
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setInput(EXAMPLE)}
              className="text-xs text-zinc-600 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
            >
              Usar ejemplo
            </button>
            <button
              onClick={extract}
              disabled={loading || !input.trim()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed border-none"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-black animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="size-1.5 rounded-full bg-black animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="size-1.5 rounded-full bg-black animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              ) : (
                <><Bot className="size-4" /> Extraer datos <ArrowUpRight className="size-3" /></>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-500/5 border border-red-500/10 p-4 mb-6">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-2">
              <Bot className="size-4 text-zinc-500" />
              <span className="text-xs font-mono text-zinc-600">Datos extraídos</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-white/[0.04]">
              {Object.entries(result).map(([key, value]) => {
                const meta = FIELD_META[key as keyof typeof FIELD_META]
                if (!meta) return null
                const Icon = meta.icon as React.ComponentType<{ className?: string }>
                return (
                  <div key={key} className="bg-black p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="size-3 text-zinc-700" />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-700">{meta.label}</span>
                    </div>
                    <p className="text-sm text-white font-medium">{renderValue(key, value)}</p>
                  </div>
                )
              })}
            </div>
            <div className="px-6 py-3 border-t border-white/[0.06] bg-white/[0.01]">
              <pre className="text-[10px] text-zinc-700 font-mono whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
