// @ts-nocheck
"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"

interface Character {
  char: string
  x: number
  y: number
  speed: number
}

class TextScramble {
  el: HTMLElement
  chars: string
  queue: Array<{
    from: string
    to: string
    start: number
    end: number
    char?: string
  }>
  frame: number
  frameRequest: number
  resolve: (value: void | PromiseLike<void>) => void

  constructor(el: HTMLElement) {
    this.el = el
    this.chars = '!<>-_\\/[]{}—=+*^?#'
    this.queue = []
    this.frame = 0
    this.frameRequest = 0
    this.resolve = () => {}
    this.update = this.update.bind(this)
  }

  setText(newText: string) {
    const oldText = this.el.innerText
    const length = Math.max(oldText.length, newText.length)
    const promise = new Promise<void>((resolve) => this.resolve = resolve)
    this.queue = []
    
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || ''
      const to = newText[i] || ''
      const start = Math.floor(Math.random() * 40)
      const end = start + Math.floor(Math.random() * 40)
      this.queue.push({ from, to, start, end })
    }
    
    cancelAnimationFrame(this.frameRequest)
    this.frame = 0
    this.update()
    return promise
  }

  update() {
    let output = ''
    let complete = 0
    
    for (let i = 0, n = this.queue.length; i < n; i++) {
      let { from, to, start, end, char } = this.queue[i]
      if (this.frame >= end) {
        complete++
        output += to
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.chars[Math.floor(Math.random() * this.chars.length)]
          this.queue[i].char = char
        }
        output += `<span class="dud">${char}</span>`
      } else {
        output += from
      }
    }
    
    this.el.innerHTML = output
    if (complete === this.queue.length) {
      this.resolve()
    } else {
      this.frameRequest = requestAnimationFrame(this.update)
      this.frame++
    }
  }
}

export const ScrambledTitle: React.FC = () => {
  const elementRef = useRef<HTMLHeadingElement>(null)
  const scramblerRef = useRef<TextScramble | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (elementRef.current && !scramblerRef.current) {
      scramblerRef.current = new TextScramble(elementRef.current)
      setMounted(true)
    }
  }, [])

  useEffect(() => {
    if (mounted && scramblerRef.current) {
      const phrases = [
        'Arquitectura',
        'Digital',
        'Inteligente',
        'Web + IA',
        'Innovación',
        'Sin Límites'
      ]
      
      let counter = 0
      const next = () => {
        if (scramblerRef.current) {
          scramblerRef.current.setText(phrases[counter]).then(() => {
            setTimeout(next, 2000)
          })
          counter = (counter + 1) % phrases.length
        }
      }

      next()
    }
  }, [mounted])

  return (
    <h1 
      ref={elementRef}
      className="text-white text-6xl font-bold tracking-wider justify-center"
      style={{ fontFamily: 'monospace' }}
    >
      RAINING LETTERS
    </h1>
  )
}

export const RainingLettersBackground: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([])
  const activeIndicesRef = useRef<Set<number>>(new Set())
  const [activeIndices, setActiveIndices] = useState<Set<number>>(new Set())

  const createCharacters = useCallback(() => {
    const allChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?"
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
    const charCount = isMobile ? 50 : 300
    const newCharacters: Character[] = []

    for (let i = 0; i < charCount; i++) {
      newCharacters.push({
        char: allChars[Math.floor(Math.random() * allChars.length)],
        x: Math.random() * 100,
        y: Math.random() * 100,
        speed: 0.05 + Math.random() * 0.15,
      })
    }

    return newCharacters
  }, [])

  useEffect(() => {
    setCharacters(createCharacters())
  }, [createCharacters])

  useEffect(() => {
    const updateActiveIndices = () => {
      const newActiveIndices = new Set<number>()
      const numActive = Math.floor(Math.random() * 2) + 2
      for (let i = 0; i < numActive; i++) {
        newActiveIndices.add(Math.floor(Math.random() * characters.length))
      }
      activeIndicesRef.current = newActiveIndices
      setActiveIndices(newActiveIndices)
    }

    const flickerInterval = setInterval(updateActiveIndices, 150)
    return () => clearInterval(flickerInterval)
  }, [characters.length])

  useEffect(() => {
    let rafId: number
    const positions = characters.map(c => ({ ...c }))

    const updatePositions = () => {
      const allChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?"
      let changed = false

      for (let i = 0; i < positions.length; i++) {
        const c = positions[i]
        c.y += c.speed
        if (c.y >= 100) {
          c.y = -5
          c.x = Math.random() * 100
          c.char = allChars[Math.floor(Math.random() * allChars.length)]
          changed = true
        }
      }

      if (changed) {
        setCharacters(positions.map(c => ({ ...c })))
      }
      rafId = requestAnimationFrame(updatePositions)
    }

    rafId = requestAnimationFrame(updatePositions)
    return () => cancelAnimationFrame(rafId)
  }, [])

  return (
    <>
      {characters.map((char, index) => (
        <span
          key={index}
          className={`absolute ${
            activeIndices.has(index)
              ? "text-[#00ff00] z-10 font-bold"
              : "text-slate-600 font-light"
          }`}
          style={{
            left: `${char.x}%`,
            top: `${char.y}%`,
            opacity: activeIndices.has(index) ? 1 : 0.4,
            fontSize: '1.8rem'
          }}
        >
          {char.char}
        </span>
      ))}
    </>
  )
}

const RainingLetters: React.FC = () => {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
        <ScrambledTitle />
      </div>

      <RainingLettersBackground />
    </div>
  )
}

export default RainingLetters
