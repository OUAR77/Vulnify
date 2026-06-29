import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Bot, FileText, LogOut, Sparkles, ArrowLeft, Download, Image, X } from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''
const LOGO_KEY = 'app_company_logo'

const FIELDS_BY_TYPE: Record<string, { key: string; labelKey: string; type: string }[]> = {
  general: [
    { key: 'prompt', labelKey: 'app.prompt_label', type: 'textarea' },
  ],
  contract: [
    { key: 'party_a', labelKey: 'app.field_party_a', type: 'text' },
    { key: 'party_a_nif', labelKey: 'app.field_party_a_nif', type: 'text' },
    { key: 'party_b', labelKey: 'app.field_party_b', type: 'text' },
    { key: 'party_b_nif', labelKey: 'app.field_party_b_nif', type: 'text' },
    { key: 'contract_subject', labelKey: 'app.field_contract_subject', type: 'text' },
    { key: 'amount', labelKey: 'app.field_amount', type: 'text' },
    { key: 'duration', labelKey: 'app.field_duration', type: 'text' },
    { key: 'start_date', labelKey: 'app.field_start_date', type: 'text' },
    { key: 'city', labelKey: 'app.field_city', type: 'text' },
    { key: 'jurisdiction', labelKey: 'app.field_jurisdiction', type: 'text' },
    { key: 'payment_terms', labelKey: 'app.field_payment_terms', type: 'textarea' },
  ],
  invoice: [
    { key: 'invoice_number', labelKey: 'app.field_invoice_number', type: 'text' },
    { key: 'company_name', labelKey: 'app.field_company_name', type: 'text' },
    { key: 'company_nif', labelKey: 'app.field_company_nif', type: 'text' },
    { key: 'company_address', labelKey: 'app.field_company_address', type: 'text' },
    { key: 'client_name', labelKey: 'app.field_client_name', type: 'text' },
    { key: 'client_nif', labelKey: 'app.field_client_nif', type: 'text' },
    { key: 'client_address', labelKey: 'app.field_client_address', type: 'text' },
    { key: 'date', labelKey: 'app.field_date', type: 'text' },
    { key: 'due_date', labelKey: 'app.field_due_date', type: 'text' },
    { key: 'concept', labelKey: 'app.field_concept', type: 'text' },
    { key: 'quantity', labelKey: 'app.field_quantity', type: 'text' },
    { key: 'unit_price', labelKey: 'app.field_unit_price', type: 'text' },
    { key: 'amount', labelKey: 'app.field_amount', type: 'text' },
    { key: 'tax_rate', labelKey: 'app.field_tax_rate', type: 'text' },
    { key: 'payment_method', labelKey: 'app.field_payment_method', type: 'text' },
    { key: 'bank_account', labelKey: 'app.field_bank_account', type: 'text' },
  ],
  quote: [
    { key: 'quote_number', labelKey: 'app.field_quote_number', type: 'text' },
    { key: 'company_name', labelKey: 'app.field_company_name', type: 'text' },
    { key: 'company_nif', labelKey: 'app.field_company_nif', type: 'text' },
    { key: 'company_address', labelKey: 'app.field_company_address', type: 'text' },
    { key: 'client_name', labelKey: 'app.field_client_name', type: 'text' },
    { key: 'client_nif', labelKey: 'app.field_client_nif', type: 'text' },
    { key: 'client_address', labelKey: 'app.field_client_address', type: 'text' },
    { key: 'date', labelKey: 'app.field_date', type: 'text' },
    { key: 'valid_until', labelKey: 'app.field_valid_until', type: 'text' },
    { key: 'service_description', labelKey: 'app.field_service_description', type: 'textarea' },
    { key: 'amount', labelKey: 'app.field_amount', type: 'text' },
    { key: 'payment_terms', labelKey: 'app.field_payment_terms', type: 'textarea' },
    { key: 'delivery_time', labelKey: 'app.field_delivery_time', type: 'text' },
  ],
  report: [
    { key: 'title', labelKey: 'app.field_title', type: 'text' },
    { key: 'author', labelKey: 'app.field_author', type: 'text' },
    { key: 'date', labelKey: 'app.field_date', type: 'text' },
    { key: 'summary', labelKey: 'app.field_summary', type: 'textarea' },
    { key: 'introduction', labelKey: 'app.field_introduction', type: 'textarea' },
    { key: 'methodology', labelKey: 'app.field_methodology', type: 'textarea' },
    { key: 'conclusions', labelKey: 'app.field_conclusions', type: 'textarea' },
  ],
  letter: [
    { key: 'recipient_name', labelKey: 'app.field_recipient_name', type: 'text' },
    { key: 'recipient_position', labelKey: 'app.field_recipient_position', type: 'text' },
    { key: 'recipient_company', labelKey: 'app.field_recipient_company', type: 'text' },
    { key: 'recipient_address', labelKey: 'app.field_recipient_address', type: 'text' },
    { key: 'sender_name', labelKey: 'app.field_sender_name', type: 'text' },
    { key: 'sender_position', labelKey: 'app.field_sender_position', type: 'text' },
    { key: 'subject', labelKey: 'app.field_subject', type: 'text' },
    { key: 'city', labelKey: 'app.field_city', type: 'text' },
    { key: 'date', labelKey: 'app.field_date', type: 'text' },
    { key: 'letter_body', labelKey: 'app.field_letter_body', type: 'textarea' },
  ],
}

export function AppDashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [productName, setProductName] = useState('')
  const [docType, setDocType] = useState('general')
  const [fields, setFields] = useState<Record<string, string>>({})
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [logo, setLogo] = useState(() => localStorage.getItem(LOGO_KEY) || '')
  const logoInputRef = useRef<HTMLInputElement>(null)

  const token = localStorage.getItem('app_session_token')

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setLogo(dataUrl)
      localStorage.setItem(LOGO_KEY, dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setLogo('')
    localStorage.removeItem(LOGO_KEY)
    if (logoInputRef.current) logoInputRef.current.value = ''
  }

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

  const currentFields = useMemo(() => FIELDS_BY_TYPE[docType] || FIELDS_BY_TYPE.general, [docType])

  const handleTypeChange = (newType: string) => {
    setDocType(newType)
    setFields({})
    setResult('')
    setError('')
  }

  const setField = (key: string, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }))
  }

  const hasAnyValue = currentFields.some(f => fields[f.key]?.trim())

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasAnyValue) return
    setLoading(true)
    setError('')
    setResult('')
    try {
      const res = await fetch(`${BASE}/api/app/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ document_type: docType, fields }),
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
        body: JSON.stringify({ document_type: docType, fields, logo }),
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

        {/* Logo */}
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 mb-4 flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <Image className="size-4 text-zinc-500" />
            <span className="text-xs text-zinc-500">Logo empresa</span>
          </div>
          {logo ? (
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="max-h-10 max-w-32 rounded object-contain" />
              <button type="button" onClick={handleRemoveLogo}
                className="text-zinc-500 hover:text-red-400 transition-colors cursor-pointer bg-transparent border-none p-1">
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => logoInputRef.current?.click()}
              className="text-xs text-zinc-500 hover:text-white transition-colors bg-transparent border border-white/[0.06] rounded-lg px-3 py-1.5 cursor-pointer">
              Añadir logo
            </button>
          )}
          <input type="file" accept="image/*" ref={logoInputRef} className="hidden" onChange={handleLogoUpload} />
        </div>

        {/* Generator */}
        <form onSubmit={handleGenerate} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="size-5 text-zinc-500" />
            <span className="text-sm font-medium">{t('app.generator_title')}</span>
          </div>
          <div className="mb-4">
            <label className="text-xs text-zinc-500 mb-1.5 block">{t('app.doc_type')}</label>
            <select value={docType} onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full bg-zinc-800 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30"
              style={{ colorScheme: 'dark' }}>
              <option value="general">{t('app.type_general')}</option>
              <option value="contract">{t('app.type_contract')}</option>
              <option value="invoice">{t('app.type_invoice')}</option>
              <option value="quote">{t('app.type_quote')}</option>
              <option value="report">{t('app.type_report')}</option>
              <option value="letter">{t('app.type_letter')}</option>
            </select>
          </div>

          {currentFields.map((f) => (
            <div key={f.key} className="mb-4">
              <label className="text-xs text-zinc-500 mb-1.5 block">{t(f.labelKey)}</label>
              {f.type === 'textarea' ? (
                <textarea value={fields[f.key] || ''} onChange={(e) => setField(f.key, e.target.value)} rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/20" />
              ) : (
                <input type="text" value={fields[f.key] || ''} onChange={(e) => setField(f.key, e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/20" />
              )}
            </div>
          ))}

          {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">{error}</div>}
          <button type="submit" disabled={!hasAnyValue || loading}
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
