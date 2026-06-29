import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Bot, FileText, LogOut, Sparkles, ArrowLeft, Download } from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

export function AppDashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [productName, setProductName] = useState('')
  const [prompt, setPrompt] = useState('')
  const [docType, setDocType] = useState('general')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)

  const token = localStorage.getItem('app_session_token')

  useEffect(() => {
    if (!token) { navigate('/app'); return }
    fetch(`${BASE}/api/app/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) { localStorage.removeItem('app_session_token'); navigate('/app'); return }
        const data = await res.json()
        setProductName(data.product_name)
        setLoaded(true)
      })
      .catch(() => { localStorage.removeItem('app_session_token'); navigate('/app') })
  }, [token, navigate])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return
    setLoading(true)
    setError('')
    setResult('')
    try {
      const res = await fetch(`${BASE}/api/app/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt: prompt.trim(), document_type: docType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Error')
      setResult(data.document)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('app_session_token')
    navigate('/app')
  }

  const handleDownloadPdf = async () => {
    if (!result) return
    try {
      const res = await fetch(`${BASE}/api/app/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt: prompt.trim(), document_type: docType }),
      })
      if (!res.ok) throw new Error('Error')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'documento.pdf'; a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      alert(e.message)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result)
  }

  if (!loaded) return <div className="min-h-screen bg-black" />

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Bot className="size-6 text-zinc-500" />
            <div>
              <h1 className="text-lg font-semibold">{productName}</h1>
              <p className="text-xs text-zinc-500">{t('app.dashboard_title')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors bg-transparent border border-white/[0.06] rounded-lg px-4 py-2 cursor-pointer">
              <ArrowLeft className="size-4" /> {t('nav.servicios')}
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors bg-transparent border border-white/[0.06] rounded-lg px-4 py-2 cursor-pointer">
              <LogOut className="size-4" /> {t('nav.cerrar_sesion')}
            </button>
          </div>
        </div>

        {/* Generator */}
        <form onSubmit={handleGenerate} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="size-5 text-zinc-500" />
            <span className="text-sm font-medium">{t('app.generator_title')}</span>
          </div>
          <div className="mb-4">
            <label className="text-xs text-zinc-500 mb-1.5 block">{t('app.doc_type')}</label>
            <select value={docType} onChange={(e) => setDocType(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30">
              <option value="general">{t('app.type_general')}</option>
              <option value="contract">{t('app.type_contract')}</option>
              <option value="invoice">{t('app.type_invoice')}</option>
              <option value="report">{t('app.type_report')}</option>
              <option value="letter">{t('app.type_letter')}</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="text-xs text-zinc-500 mb-1.5 block">{t('app.prompt_label')}</label>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={5}
              placeholder={t('app.prompt_placeholder')}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/20" />
          </div>
          {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">{error}</div>}
          <button type="submit" disabled={!prompt.trim() || loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 cursor-pointer border-none">
            {loading ? t('common.loading') : <><Sparkles className="size-4" /> {t('app.generate')}</>}
          </button>
        </form>

        {/* Result */}
        {result && (
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Sparkles className="size-5 text-zinc-500" />
                <span className="text-sm font-medium">{t('app.result_title')}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={handleDownloadPdf}
                  className="text-xs text-zinc-500 hover:text-white transition-colors bg-transparent border border-white/[0.06] rounded-lg px-3 py-1.5 cursor-pointer flex items-center gap-1.5">
                  <Download className="size-3.5" /> PDF
                </button>
                <button onClick={copyToClipboard}
                  className="text-xs text-zinc-500 hover:text-white transition-colors bg-transparent border border-white/[0.06] rounded-lg px-3 py-1.5 cursor-pointer">
                  {t('app.copy')}
                </button>
              </div>
            </div>
            <div className="whitespace-pre-wrap text-sm text-zinc-300 leading-relaxed font-mono bg-black/40 rounded-lg p-4 max-h-[600px] overflow-y-auto">
              {result}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
