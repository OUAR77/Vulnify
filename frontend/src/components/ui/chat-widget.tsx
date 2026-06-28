import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const quickReplies = [
  '¿Qué servicios ofrecéis?',
  '¿Cuánto cuesta una web?',
  '¿Qué es una integración IA?',
  '¿Cuánto tardáis en hacer una web?',
]

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: '¡Hola! Soy el asistente virtual de Vulnify. ¿En qué puedo ayudarte? 😊' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showQuick, setShowQuick] = useState(true)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [open])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = async (text: string) => {
    const msg = text.trim()
    if (!msg || loading) return
    setShowQuick(false)
    setMessages((prev) => [...prev, { role: 'user', content: msg }])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch(`${BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      })
      if (!res.ok) throw new Error('Error')
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Lo siento, ahora mismo no puedo responder. Escríbenos a hola@vulnify.es y te ayudaremos.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {!open && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 size-14 rounded-full bg-gradient-to-br from-zinc-200 to-white text-black flex items-center justify-center shadow-lg hover:scale-110 transition-all cursor-pointer relative"
          whileHover={{ rotate: -8 }}
          aria-label="Abrir chat"
        >
          <MessageCircle className="size-5" />
          <span className="absolute -top-1 -right-1 size-4 rounded-full bg-emerald-500 flex items-center justify-center">
            <Sparkles className="size-2.5 text-white" />
          </span>
        </motion.button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] bg-[#0a0a0a] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-gradient-to-r from-zinc-900 to-black">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-gradient-to-br from-zinc-200 to-white flex items-center justify-center">
                  <Bot className="size-4 text-black" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Vulnify Chat</p>
                  <p className="text-[10px] text-zinc-600">Asistente virtual</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="size-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors cursor-pointer border-none text-zinc-500 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <div ref={listRef} className="h-[400px] overflow-y-auto px-4 py-4 space-y-3 scroll-smooth">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-white text-black rounded-br-md'
                        : 'bg-white/[0.04] text-zinc-300 rounded-bl-md'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {msg.role === 'assistant' ? (
                        <Bot className="size-3 text-zinc-600" />
                      ) : (
                        <User className="size-3 text-zinc-600" />
                      )}
                      <span className="text-[10px] text-zinc-600">{msg.role === 'assistant' ? 'Asistente' : 'Tú'}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/[0.04] rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="size-1.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="size-1.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="size-1.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {showQuick && messages.length === 1 && (
              <div className="px-4 pb-3">
                <p className="text-[10px] text-zinc-700 mb-2">Sugerencias:</p>
                <div className="flex flex-wrap gap-2">
                  {quickReplies.map((qr) => (
                    <button
                      key={qr}
                      onClick={() => send(qr)}
                      className="text-xs text-zinc-500 border border-white/[0.06] rounded-full px-3 py-1.5 hover:border-white/20 hover:text-white transition-colors bg-transparent cursor-pointer"
                    >
                      {qr}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="px-4 py-3 border-t border-white/[0.06]">
              <form onSubmit={(e) => { e.preventDefault(); send(input) }} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 text-sm bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder-zinc-700 outline-none focus:border-white/20 transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="size-[42px] rounded-xl bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed border-none shrink-0"
                >
                  <Send className="size-4" />
                </button>
              </form>
              <p className="text-[10px] text-zinc-800 mt-2 text-center">El asistente puede cometer errores. Verifica la información importante.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
