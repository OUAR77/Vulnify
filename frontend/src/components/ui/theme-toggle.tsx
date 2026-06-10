"use client"

import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  isDark: boolean
  onToggle: () => void
  className?: string
}

export function ThemeToggle({ isDark, onToggle, className }: ThemeToggleProps) {
  return (
    <div
      className={cn(
        "flex w-14 h-7 p-0.5 rounded-full cursor-pointer transition-all duration-300",
        isDark
          ? "bg-zinc-950 border border-zinc-800"
          : "bg-white border border-zinc-300",
        className
      )}
      onClick={onToggle}
      role="button"
      tabIndex={0}
    >
      <div className="flex justify-between items-center w-full relative">
        <div
          className={cn(
            "flex justify-center items-center w-6 h-6 rounded-full transition-all duration-300",
            isDark
              ? "translate-x-0 bg-zinc-800"
              : "translate-x-[26px] bg-zinc-200"
          )}
        >
          {isDark ? (
            <Moon className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />
          ) : (
            <Sun className="w-3.5 h-3.5 text-zinc-700" strokeWidth={1.5} />
          )}
        </div>
      </div>
    </div>
  )
}
