"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  TrendingUp,
  Sparkles,
  Zap,
  Globe,
  Bot,
  Shield,
  Code,
  Rocket,
} from "lucide-react"

export interface BentoItem {
  title: string
  description: string
  icon: React.ReactNode
  status?: string
  tags?: string[]
  colSpan?: number
}

const webItems: BentoItem[] = [
  {
    title: "Web a medida",
    description: "Construida con React, Next.js o el stack que mejor se adapte a tu negocio. Rendimiento, SEO y experiencia de usuario desde el día uno.",
    icon: <Code className="w-4 h-4 text-zinc-400" />,
    status: "Stack moderno",
    tags: ["React", "Next.js", "TypeScript"],
    colSpan: 2,
  },
  {
    title: "IA integrada",
    description: "Chatbots inteligentes, automatización de procesos y análisis predictivo para escalar tu negocio 24/7.",
    icon: <Bot className="w-4 h-4 text-zinc-400" />,
    status: "AI Ready",
    tags: ["Chatbots", "Automatización"],
  },
  {
    title: "Diseño UX",
    description: "Interfaces pensadas para convertir. Cada píxel optimizado para guiar al usuario hacia la acción.",
    icon: <Sparkles className="w-4 h-4 text-zinc-400" />,
    tags: ["UI/UX", "Conversión"],
    colSpan: 2,
  },
  {
    title: "Crecimiento",
    description: "SEO técnico, optimización de rendimiento y análisis continuo para que tu web sea imbatible.",
    icon: <Rocket className="w-4 h-4 text-zinc-400" />,
    status: "Escalable",
    tags: ["SEO", "Rendimiento"],
  },
]

export function BentoGrid({ items = webItems }: { items?: BentoItem[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mx-auto">
      {items.map((item, index) => (
        <BentoCard key={index} item={item} />
      ))}
    </div>
  )
}

function BentoCard({ item }: { item: BentoItem }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl p-[1px] transition-all duration-500",
        item.colSpan || "col-span-1",
        item.colSpan === 2 ? "md:col-span-2" : "",
      )}
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
      <div className="relative z-10 h-full rounded-[inherit] bg-black/60 backdrop-blur-sm p-5 border border-white/[0.04]">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="size-9 rounded-lg flex items-center justify-center bg-white/5 border border-white/[0.06]">
              {item.icon}
            </div>
            {item.status && (
              <span className="text-[11px] font-medium px-2 py-1 rounded-md bg-white/5 text-zinc-500 border border-white/[0.06]">
                {item.status}
              </span>
            )}
          </div>
          <div className="space-y-1.5">
            <h3 className="font-semibold text-white text-sm tracking-tight">
              {item.title}
            </h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              {item.description}
            </p>
          </div>
          {item.tags && (
            <div className="flex items-center gap-2 pt-1">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-white/[0.03] text-zinc-600 border border-white/[0.04]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
