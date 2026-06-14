"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface BentoItem {
  title: string
  subtitle: string
  description: string
  gradient: string
  icon: React.ReactNode
  illustration: React.ReactNode
  tags: string[]
}

const items: BentoItem[] = [
  {
    title: "E-commerce IA",
    subtitle: "Desarrollo Web + IA",
    description: "Tienda online con recomendaciones inteligentes y chatbot predictivo.",
    gradient: "from-blue-600/20 via-violet-600/10 to-transparent",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
    illustration: (
      <svg viewBox="0 0 200 120" fill="none" className="w-full h-full opacity-40">
        <rect x="10" y="30" width="80" height="60" rx="8" stroke="white" strokeWidth="0.5" fill="white" fillOpacity="0.03" />
        <rect x="20" y="45" width="30" height="4" rx="2" fill="white" fillOpacity="0.15" />
        <rect x="20" y="55" width="20" height="2" rx="1" fill="white" fillOpacity="0.08" />
        <rect x="60" y="55" width="20" height="2" rx="1" fill="white" fillOpacity="0.08" />
        <circle cx="70" cy="75" r="10" stroke="white" strokeWidth="0.5" fill="white" fillOpacity="0.05" />
        <path d="M66 75l3 3 5-5" stroke="#818cf8" strokeWidth="1" strokeLinecap="round" />
        <motion.circle cx="140" cy="45" r="30" stroke="white" strokeWidth="0.3" fill="white" fillOpacity="0.02" initial={{ scale: 0.8 }} animate={{ scale: [0.8, 1.1, 0.8] }} transition={{ duration: 4, repeat: Infinity }} />
        <path d="M130 40l4 4 8-8" stroke="white" strokeWidth="0.5" strokeLinecap="round" strokeOpacity={0.2} />
        <motion.circle cx="155" cy="20" r="3" fill="white" fillOpacity="0.06" animate={{ opacity: [0.03, 0.15, 0.03] }} transition={{ duration: 2.5, repeat: Infinity }} />
        <motion.circle cx="170" cy="55" r="2" fill="white" fillOpacity="0.06" animate={{ opacity: [0.02, 0.12, 0.02] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} />
      </svg>
    ),
    tags: ["React", "Python", "OpenAI"],
  },
  {
    title: "Dashboard Financiero",
    subtitle: "Backend + APIs",
    description: "Panel de control con análisis predictivo y automatización de reportes.",
    gradient: "from-emerald-600/20 via-teal-600/10 to-transparent",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    illustration: (
      <svg viewBox="0 0 200 120" fill="none" className="w-full h-full opacity-40">
        <rect x="110" y="30" width="80" height="60" rx="8" stroke="white" strokeWidth="0.5" fill="white" fillOpacity="0.03" />
        <motion.rect x="120" y="65" width="12" height="18" rx="2" fill="white" fillOpacity="0.08" animate={{ height: [18, 25, 10, 18] }} transition={{ duration: 3, repeat: Infinity }} />
        <motion.rect x="138" y="55" width="12" height="28" rx="2" fill="white" fillOpacity="0.08" animate={{ height: [28, 15, 30, 28] }} transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }} />
        <motion.rect x="156" y="45" width="12" height="38" rx="2" fill="white" fillOpacity="0.08" animate={{ height: [38, 30, 20, 38] }} transition={{ duration: 2.8, repeat: Infinity, delay: 1 }} />
        <motion.rect x="174" y="60" width="8" height="23" rx="2" fill="#34d399" fillOpacity="0.15" animate={{ height: [23, 15, 28, 23] }} transition={{ duration: 4, repeat: Infinity, delay: 1.5 }} />
        <path d="M10 35l25 5 20-10 18 8 22-12" stroke="white" strokeWidth="0.5" strokeOpacity={0.15} />
        <motion.circle cx="95" cy="28" r="2" fill="#34d399" fillOpacity="0.2" animate={{ opacity: [0.1, 0.4, 0.1] }} transition={{ duration: 2, repeat: Infinity }} />
        <motion.line x1="10" y1="90" x2="190" y2="90" stroke="white" strokeWidth="0.3" strokeOpacity={0.06} strokeDasharray="4 4" animate={{ strokeDashoffset: [0, -20] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} />
      </svg>
    ),
    tags: ["FastAPI", "PostgreSQL", "TensorFlow"],
  },
  {
    title: "Landing Corporativa",
    subtitle: "Desarrollo Web",
    description: "Web institucional con diseño editorial y sistema de gestión de contenido.",
    gradient: "from-amber-600/20 via-orange-600/10 to-transparent",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    illustration: (
      <svg viewBox="0 0 200 120" fill="none" className="w-full h-full opacity-40">
        <rect x="10" y="20" width="180" height="80" rx="8" stroke="white" strokeWidth="0.3" fill="white" fillOpacity="0.02" />
        <rect x="25" y="35" width="40" height="3" rx="1.5" fill="white" fillOpacity="0.12" />
        <rect x="25" y="43" width="25" height="2" rx="1" fill="white" fillOpacity="0.06" />
        <motion.rect x="25" y="52" width="150" height="1" rx="0.5" fill="white" fillOpacity="0.04" />
        <rect x="25" y="60" width="60" height="28" rx="4" stroke="white" strokeWidth="0.3" fill="white" fillOpacity="0.03" />
        <rect x="33" y="68" width="20" height="2" rx="1" fill="white" fillOpacity="0.08" />
        <rect x="33" y="74" width="15" height="1.5" rx="0.75" fill="white" fillOpacity="0.05" />
        <rect x="33" y="79" width="44" height="1" rx="0.5" fill="white" fillOpacity="0.03" />
        <rect x="95" y="60" width="80" height="28" rx="4" stroke="white" strokeWidth="0.3" fill="white" fillOpacity="0.03" />
        <rect x="103" y="68" width="30" height="2" rx="1" fill="white" fillOpacity="0.08" />
        <rect x="103" y="74" width="20" height="1.5" rx="0.75" fill="white" fillOpacity="0.05" />
        <motion.rect x="103" y="79" width="64" height="1" rx="0.5" fill="white" fillOpacity="0.03" />
        <motion.circle cx="180" cy="28" r="1.5" fill="#f59e0b" fillOpacity="0.3" animate={{ opacity: [0.1, 0.5, 0.1] }} transition={{ duration: 2.5, repeat: Infinity }} />
      </svg>
    ),
    tags: ["Astro", "Headless CMS", "Tailwind"],
  },
]

export function BentoGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mx-auto">
      {items.map((item, index) => (
        <BentoCard key={index} item={item} index={index} />
      ))}
    </div>
  )
}

function BentoCard({ item, index }: { item: BentoItem; index: number }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.12, ease: "easeOut" }}
      className="group relative overflow-hidden rounded-2xl p-[1px] transition-all duration-500"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div
        className="absolute inset-[-100%]"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        style={{
          background: hovered
            ? "conic-gradient(from 0deg, transparent 10%, #fff 30%, #3275F8 50%, #fff 70%, transparent 90%)"
            : "conic-gradient(from 0deg, transparent 20%, rgba(255,255,255,0.08) 40%, transparent 60%, rgba(255,255,255,0.04) 80%, transparent 85%)",
        }}
      />
      <div className="relative z-10 h-full rounded-[inherit] bg-black/70 backdrop-blur-sm border border-white/[0.04] overflow-hidden">
        {/* Image area */}
        <div className={cn("relative h-44 bg-gradient-to-br overflow-hidden", item.gradient)}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
          <div className="absolute inset-0 flex items-center justify-center p-6">
            {item.illustration}
          </div>
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
            <div className="size-8 rounded-lg flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/[0.12] text-white/80">
              {item.icon}
            </div>
            <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-white/10 backdrop-blur-sm text-white/60 border border-white/[0.08] uppercase tracking-wider">
              {item.subtitle}
            </span>
          </div>
          {/* Glow corner */}
          <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-white/[0.04] blur-2xl" />
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <div>
            <h3 className="font-bold text-white text-base tracking-tight">
              {item.title}
            </h3>
            <p className="text-sm text-zinc-500 leading-relaxed mt-1">
              {item.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] px-2.5 py-0.5 rounded-md bg-white/[0.03] text-zinc-600 border border-white/[0.04]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
