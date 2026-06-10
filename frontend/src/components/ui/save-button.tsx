"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Check, Sparkles } from "lucide-react"
import confetti from "canvas-confetti"
import { cn } from "@/lib/utils"

interface SaveButtonProps {
  text?: {
    idle?: string
    saving?: string
    saved?: string
  }
  className?: string
  href?: string
  onSave?: () => Promise<void> | void
}

export function SaveButton({
  text = {
    idle: "Solicitar presupuesto",
    saving: "Enviando...",
    saved: "¡Enviado!",
  },
  className,
  href,
  onSave,
}: SaveButtonProps) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle")
  const [bounce, setBounce] = useState(false)

  const handleClick = async () => {
    if (status !== "idle") return

    setStatus("saving")

    try {
      if (onSave) {
        await onSave()
      } else {
        if (href) {
          window.location.href = href
        }
        await new Promise((resolve) => setTimeout(resolve, 800))
      }
      setStatus("saved")
      setBounce(true)
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#ffffff", "#888888", "#555555"],
        shapes: ["circle"],
      })
      setTimeout(() => {
        setStatus("idle")
        setBounce(false)
      }, 2000)
    } catch {
      setStatus("idle")
    }
  }

  return (
    <div className="relative inline-block">
      <motion.button
        onClick={handleClick}
        className={cn(
          "group relative grid overflow-hidden rounded-lg px-6 py-2.5 transition-all duration-200",
          status === "idle"
            ? "shadow-[0_1000px_0_0_hsl(0_0%_85%)_inset] dark:shadow-[0_1000px_0_0_hsl(0_0%_20%)_inset]"
            : "",
          "hover:shadow-lg",
          className
        )}
        style={{ minWidth: "160px" }}
        whileHover={status === "idle" ? { scale: 1.05 } : {}}
        whileTap={status === "idle" ? { scale: 0.95 } : {}}
      >
        {status === "idle" && (
          <span>
            <span
              className={cn(
                "spark mask-gradient absolute inset-0 h-full w-full animate-flip overflow-hidden rounded-lg",
                "[mask:linear-gradient(black,_transparent_50%)] before:absolute before:aspect-square before:w-[200%] before:bg-[conic-gradient(from_0deg,transparent_0_340deg,black_360deg)]",
                "before:rotate-[-90deg] before:animate-rotate dark:before:bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)]",
                "before:content-[''] before:[inset:0_auto_auto_50%] before:[translate:-50%_-15%] dark:[mask:linear-gradient(white,_transparent_50%)]",
              )}
            />
          </span>
        )}
        <span
          className={cn(
            "backdrop absolute inset-px rounded-[10px] transition-colors duration-200",
            status === "idle"
              ? "bg-neutral-100 group-hover:bg-neutral-200 dark:bg-neutral-950 dark:group-hover:bg-neutral-900"
              : status === "saving"
              ? "bg-blue-500"
              : "bg-green-500"
          )}
        />
        <span className="relative z-10 flex items-center justify-center gap-2 text-sm font-medium">
          <AnimatePresence mode="wait">
            {status === "saving" && (
              <motion.span
                key="saving"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Loader2 className="size-4 animate-spin" />
              </motion.span>
            )}
            {status === "saved" && (
              <motion.span
                key="saved"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <Check className="size-4" />
              </motion.span>
            )}
          </AnimatePresence>
          <motion.span
            key={status}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {status === "idle"
              ? text.idle
              : status === "saving"
              ? text.saving
              : text.saved}
          </motion.span>
        </span>
      </motion.button>
      <AnimatePresence>
        {bounce && (
          <motion.div
            className="absolute -top-2 -right-2"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
          >
            <Sparkles className="size-5 text-yellow-400" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
