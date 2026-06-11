"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export function HoverBorderGradient({
  children,
  containerClassName,
  className,
  as: Element = "button",
  duration = 4,
  ...props
}: {
  children: React.ReactNode
  as?: React.ElementType
  containerClassName?: string
  className?: string
  duration?: number
  [key: string]: any
}) {
  const [hovered, setHovered] = useState(false)
  const Tag = Element as any

  return (
    <Tag
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "group relative inline-flex items-center justify-center rounded-full p-[1px] overflow-hidden transition-all duration-500",
        containerClassName
      )}
      {...props}
    >
      <motion.span
        className="absolute inset-[-100%]"
        animate={{ rotate: [0, 360] }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
        style={{
          background: hovered
            ? "conic-gradient(from 0deg, transparent 10%, #fff 30%, #3275F8 50%, #fff 70%, transparent 90%)"
            : "conic-gradient(from 0deg, transparent 20%, rgba(255,255,255,0.5) 40%, rgba(255,255,255,0.1) 60%, transparent 80%)",
        }}
      />
      <span
        className={cn(
          "relative z-10 inline-flex items-center justify-center rounded-[inherit] bg-black px-5 py-2.5 text-sm text-white transition-colors",
          className
        )}
      >
        {children}
      </span>
    </Tag>
  )
}
