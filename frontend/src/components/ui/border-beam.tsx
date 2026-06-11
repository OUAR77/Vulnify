"use client"

import { cn } from "@/lib/utils"

interface BorderBeamProps {
  duration?: number
  lightColor?: string
  borderWidth?: number
  className?: string
}

export function BorderBeam({
  duration = 8,
  lightColor = "#FAFAFA",
  borderWidth = 1,
  className,
}: BorderBeamProps) {
  return (
    <div
      className={cn("absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none z-0", className)}
      style={{
        "--duration": `${duration}s`,
        "--light": lightColor,
        "--border": `${borderWidth}px`,
        mask: "linear-gradient(#000,#000) content-box, linear-gradient(#000,#000)",
        maskComposite: "exclude",
        WebkitMaskComposite: "xor",
        padding: "var(--border)",
      } as React.CSSProperties}
    >
      <div
        className="absolute inset-0 animate-spin"
        style={{
          animationDuration: "var(--duration)",
          background: `conic-gradient(from 0deg, transparent 30%, var(--light), transparent 70%)`,
        }}
      />
    </div>
  )
}
