import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/lib/auth-context'
import { useNavigate } from 'react-router-dom'
import {
  adminGetStats, adminGetUsers, adminDeleteUser, adminChangeRole,
  adminGetActivityLogs, adminGetActivityActions,
  adminGetMessages, adminMarkMessageRead, adminDeleteMessage,
  adminGetOrders, adminCreateOrder, adminUpdateOrder, adminDeleteOrder,
  adminUploadPhoto, adminDeletePhoto, adminDeleteAllPhotos, adminGetOrderPhotos,
  adminGetOrderTimeline, adminGetOrderInvoice,
  getMaintenance, setMaintenance,
  downloadAdminCSV,
  adminGetAllPosts, adminCreatePost, adminUpdatePost, adminDeletePost,
  getTestimonials, adminCreateTestimonial, adminUpdateTestimonial, adminDeleteTestimonial,
  getFAQs, adminCreateFAQ, adminUpdateFAQ, adminDeleteFAQ,
  adminGetProducts, adminCreateProduct, adminUpdateProduct, adminDeleteProduct,
  adminGetPurchases, adminCreatePurchase, adminRegenerateToken,
  type AdminStats, type AdminUser, type ActivityLog,
  type ContactMessage, type Order, type OrderPhoto,
  type BlogPost, type TestimonialData, type FAQData,
  type ProductData, type PurchaseData,
} from '@/lib/api'
import {
  Users, ShieldAlert, Activity, Search, Trash2, ArrowLeft, LogOut,
  LayoutDashboard, RefreshCw, Plus, MessageSquare, ShoppingCart, Image,
  History, FileText, Wrench, BookOpen, Star, HelpCircle,
  ChevronUp, ChevronDown, Database, Tags, Key,
} from 'lucide-react'

export function AdminPage() {
  const { t } = useTranslation()
  const { user, isAdmin, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const BASE = import.meta.env.VITE_API_URL || ''

  // Stats
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [statsError, setStatsError] = useState('')

  // Users
  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersTotal, setUsersTotal] = useState(0)
  const [usersPage, setUsersPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [userActionLoading, setUserActionLoading] = useState<number | null>(null)
  const [usersError, setUsersError] = useState('')

  // Logs
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [logsTotal, setLogsTotal] = useState(0)
  const [logsPage, setLogsPage] = useState(1)
  const [logActions, setLogActions] = useState<string[]>([])
  const [logFilterAction, setLogFilterAction] = useState('')

  // Messages
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [messagesTotal, setMessagesTotal] = useState(0)
  const [messagesPage, setMessagesPage] = useState(1)
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)

  // Orders
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersTotal, setOrdersTotal] = useState(0)
  const [ordersPage, setOrdersPage] = useState(1)
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [orderForm, setOrderForm] = useState({ client_name: '', client_email: '', service: '', description: '', amount: 0, status: 'pending' })
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)

  // Password confirmation for destructive actions
  const [passwordModal, setPasswordModal] = useState<{ action: string; id: number; extra?: string } | null>(null)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // Photo gallery
  const [photoOrder, setPhotoOrder] = useState<Order | null>(null)
  const [photos, setPhotos] = useState<OrderPhoto[]>([])
  const [photoCaption, setPhotoCaption] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Timeline
  const [timelineOrder, setTimelineOrder] = useState<Order | null>(null)
  const [timeline, setTimeline] = useState<any[]>([])

  // Maintenance
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  // Blog
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [blogError, setBlogError] = useState('')
  const [showBlogForm, setShowBlogForm] = useState(false)
  const [blogForm, setBlogForm] = useState({ title: '', slug: '', tag: '', excerpt: '', content: '', author: '', read_time: '', published: false })
  const [editingBlogPost, setEditingBlogPost] = useState<BlogPost | null>(null)

  // Testimonials
  const [testimonials, setTestimonials] = useState<TestimonialData[]>([])
  const [testError, setTestError] = useState('')
  const [showTestForm, setShowTestForm] = useState(false)
  const [testForm, setTestForm] = useState({ name: '', role: '', company: '', content: '', avatar_url: '', rating: 5, featured: false })
  const [editingTestimonial, setEditingTestimonial] = useState<TestimonialData | null>(null)

  // FAQ
  const [faqs, setFaqs] = useState<FAQData[]>([])
  const [faqError, setFaqError] = useState('')
  const [showFaqForm, setShowFaqForm] = useState(false)
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', category: '', published: false, order: 0 })
  const [editingFaq, setEditingFaq] = useState<FAQData | null>(null)

  // Products
  const [products, setProducts] = useState<ProductData[]>([])
  const [productsError, setProductsError] = useState('')
  const [showProductForm, setShowProductForm] = useState(false)
  const [productForm, setProductForm] = useState({ name: '', slug: '', description: '', price_one_time: '', price_monthly: '', stripe_price_id_one_time: '', stripe_price_id_monthly: '', file_url: '', active: true })
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null)

  // Purchases
  const [purchases, setPurchases] = useState<PurchaseData[]>([])
  const [purchasesError, setPurchasesError] = useState('')
  const [showPurchaseForm, setShowPurchaseForm] = useState(false)
  const [purchaseForm, setPurchaseForm] = useState({ product_id: 0, buyer_email: '', buyer_name: '', interval: 'one_time', amount: 0, expires_in_days: '' })
  const [purchaseFormLoading, setPurchaseFormLoading] = useState(false)
  const [purchaseFormResult, setPurchaseFormResult] = useState('')

  const [tab, setTab] = useState<'stats' | 'users' | 'logs' | 'messages' | 'orders' | 'blog' | 'testimonios' | 'faq' | 'products' | 'purchases'>('stats')

  const loadStats = useCallback(async () => {
    try { setStatsError(''); setStats(await adminGetStats()) }
    catch (e: any) { setStatsError(e.message) }
  }, [])

  const loadUsers = useCallback(async (page: number, search?: string) => {
    try {
      setUsersError('')
      const data = await adminGetUsers(page, search)
      setUsers(data.items)
      setUsersTotal(data.total)
      setUsersPage(data.page)
    } catch (e: any) { setUsersError(e.message) }
  }, [])

  const loadLogs = useCallback(async (page: number, action?: string) => {
    try {
      const data = await adminGetActivityLogs(page, action || undefined)
      setLogs(data.items); setLogsTotal(data.total); setLogsPage(data.page)
    } catch { /* ignore */ }
  }, [])

  const loadLogActions = useCallback(async () => {
    try { setLogActions(await adminGetActivityActions()) }
    catch { /* ignore */ }
  }, [])

  const loadMessages = useCallback(async (page: number) => {
    try {
      const data = await adminGetMessages(page)
      setMessages(data.items); setMessagesTotal(data.total); setMessagesPage(data.page)
    } catch { /* ignore */ }
  }, [])

  const loadOrders = useCallback(async (page: number) => {
    try {
      const data = await adminGetOrders(page)
      setOrders(data.items); setOrdersTotal(data.total); setOrdersPage(data.page)
    } catch { /* ignore */ }
  }, [])

  const loadBlogPosts = useCallback(async () => {
    try {
      setBlogError('')
      const token = localStorage.getItem('vulnify_token') || ''
      setBlogPosts(await adminGetAllPosts(token))
    } catch (e: any) { setBlogError(e.message) }
  }, [])

  const loadTestimonials = useCallback(async () => {
    try {
      setTestError('')
      setTestimonials(await getTestimonials())
    } catch (e: any) { setTestError(e.message) }
  }, [])

  const loadFAQs = useCallback(async () => {
    try {
      setFaqError('')
      setFaqs(await getFAQs())
    } catch (e: any) { setFaqError(e.message) }
  }, [])

  const loadProducts = useCallback(async () => {
    try {
      setProductsError('')
      setProducts(await adminGetProducts())
    } catch (e: any) { setProductsError(e.message) }
  }, [])

  const loadPurchases = useCallback(async () => {
    try {
      setPurchasesError('')
      setPurchases(await adminGetPurchases())
    } catch (e: any) { setPurchasesError(e.message) }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return }
    if (!isAdmin) { navigate('/dashboard'); return }
    loadStats(); loadUsers(1); loadLogs(1); loadLogActions(); loadMessages(1); loadOrders(1)
    loadBlogPosts(); loadTestimonials(); loadFAQs(); loadProducts(); loadPurchases()
    getMaintenance().then(r => setMaintenanceMode(r.maintenance_mode)).catch(() => {})
  }, [isAuthenticated, isAdmin])

  const handleDeleteUser = async (userId: number) => {
    if (!confirmPassword) return
    setUserActionLoading(userId)
    try { await adminDeleteUser(userId, confirmPassword); loadUsers(usersPage, searchQuery || undefined) }
    catch (e: any) { setPasswordError(e.message); setUserActionLoading(null); return }
    finally { setUserActionLoading(null) }
    setPasswordModal(null); setConfirmPassword(''); setPasswordError('')
  }

  const handleToggleRole = async (userId: number, currentRole: string) => {
    if (!confirmPassword) return
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    setUserActionLoading(userId)
    try { await adminChangeRole(userId, newRole, confirmPassword); loadUsers(usersPage, searchQuery || undefined) }
    catch (e: any) { setPasswordError(e.message); setUserActionLoading(null); return }
    finally { setUserActionLoading(null) }
    setPasswordModal(null); setConfirmPassword(''); setPasswordError('')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadUsers(1, searchQuery || undefined)
  }

  const handleRefresh = () => {
    loadStats()
    loadUsers(usersPage, searchQuery || undefined)
    loadLogs(logsPage, logFilterAction || undefined)
    loadMessages(messagesPage)
    loadOrders(ordersPage)
    loadBlogPosts()
    loadTestimonials()
    loadFAQs()
    loadProducts()
    loadPurchases()
  }

  const handleMarkRead = async (msg: ContactMessage) => {
    if (msg.read) return
    try { await adminMarkMessageRead(msg.id); loadMessages(messagesPage) }
    catch { /* ignore */ }
  }

  const handleDeleteMessage = async (id: number) => {
    if (!confirmPassword) return
    try { await adminDeleteMessage(id, confirmPassword); loadMessages(messagesPage); if (selectedMessage?.id === id) setSelectedMessage(null) }
    catch (e: any) { setPasswordError(e.message); return }
    setPasswordModal(null); setConfirmPassword(''); setPasswordError('')
  }

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingOrder) {
        await adminUpdateOrder(editingOrder.id, orderForm)
      } else {
        await adminCreateOrder(orderForm)
      }
      setShowOrderForm(false)
      setEditingOrder(null)
      setOrderForm({ client_name: '', client_email: '', service: '', description: '', amount: 0, status: 'pending' })
      loadOrders(ordersPage)
    } catch (e: any) { alert(e.message) }
  }

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order)
    setOrderForm({
      client_name: order.client_name,
      client_email: order.client_email,
      service: order.service,
      description: order.description,
      amount: order.amount,
      status: order.status,
    })
    setShowOrderForm(true)
  }

  const handleDeleteOrder = async (id: number) => {
    if (!confirmPassword) return
    try { await adminDeleteOrder(id, confirmPassword); loadOrders(ordersPage) }
    catch (e: any) { setPasswordError(e.message); return }
    setPasswordModal(null); setConfirmPassword(''); setPasswordError('')
  }

  const openPhotoGallery = async (order: Order) => {
    setPhotoOrder(order)
    try { setPhotos(await adminGetOrderPhotos(order.id)) }
    catch { setPhotos([]) }
  }

  const handleUploadPhoto = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file || !photoOrder) return
    try {
      await adminUploadPhoto(photoOrder.id, file, photoCaption)
      setPhotos(await adminGetOrderPhotos(photoOrder.id))
      setPhotoCaption('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err: any) { alert(err.message) }
  }

  const handleDeletePhoto = async (photoId: number) => {
    if (!photoOrder) return
    try {
      await adminDeletePhoto(photoOrder.id, photoId, confirmPassword)
      setPhotos(await adminGetOrderPhotos(photoOrder.id))
      setPasswordModal(null); setConfirmPassword(''); setPasswordError('')
    } catch (e: any) { setPasswordError(e.message) }
  }

  const handleDeleteAllPhotos = async () => {
    if (!photoOrder) return
    try {
      await adminDeleteAllPhotos(photoOrder.id, confirmPassword)
      setPhotos(await adminGetOrderPhotos(photoOrder.id))
      setPasswordModal(null); setConfirmPassword(''); setPasswordError('')
    } catch (e: any) { setPasswordError(e.message) }
  }

  const handleToggleMaintenance = async () => {
    try {
      const res = await setMaintenance(!maintenanceMode, confirmPassword)
      setMaintenanceMode(res.maintenance_mode)
      setPasswordModal(null); setConfirmPassword(''); setPasswordError('')
    } catch (e: any) { setPasswordError(e.message) }
  }

  const handleBlogSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('vulnify_token') || ''
    try {
      if (editingBlogPost) {
        await adminUpdatePost(token, editingBlogPost.id, blogForm)
      } else {
        await adminCreatePost(token, blogForm)
      }
      setShowBlogForm(false)
      setEditingBlogPost(null)
      setBlogForm({ title: '', slug: '', tag: '', excerpt: '', content: '', author: '', read_time: '', published: false })
      loadBlogPosts()
    } catch (e: any) { alert(e.message) }
  }

  const handleEditBlogPost = (post: BlogPost) => {
    setEditingBlogPost(post)
    setBlogForm({
      title: post.title,
      slug: post.slug,
      tag: post.tag,
      excerpt: post.excerpt,
      content: post.content,
      author: post.author,
      read_time: post.read_time,
      published: post.published,
    })
    setShowBlogForm(true)
  }

  const handleDeleteBlogPost = async (id: number) => {
    if (!confirmPassword) return
    try {
      const token = localStorage.getItem('vulnify_token') || ''
      await adminDeletePost(token, id)
      loadBlogPosts()
    } catch (e: any) { setPasswordError(e.message); return }
    setPasswordModal(null); setConfirmPassword(''); setPasswordError('')
  }

  const handleTogglePublish = async (post: BlogPost) => {
    const token = localStorage.getItem('vulnify_token') || ''
    try {
      await adminUpdatePost(token, post.id, { published: !post.published })
      loadBlogPosts()
    } catch (e: any) { alert(e.message) }
  }

  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('vulnify_token') || ''
    try {
      if (editingTestimonial) {
        await adminUpdateTestimonial(token, editingTestimonial.id, testForm)
      } else {
        await adminCreateTestimonial(token, testForm)
      }
      setShowTestForm(false)
      setEditingTestimonial(null)
      setTestForm({ name: '', role: '', company: '', content: '', avatar_url: '', rating: 5, featured: false })
      loadTestimonials()
    } catch (e: any) { alert(e.message) }
  }

  const handleEditTestimonial = (t: TestimonialData) => {
    setEditingTestimonial(t)
    setTestForm({
      name: t.name,
      role: t.role,
      company: t.company,
      content: t.content,
      avatar_url: t.avatar_url,
      rating: t.rating,
      featured: t.featured,
    })
    setShowTestForm(true)
  }

  const handleDeleteTestimonial = async (id: number) => {
    if (!confirmPassword) return
    try {
      const token = localStorage.getItem('vulnify_token') || ''
      await adminDeleteTestimonial(token, id)
      loadTestimonials()
    } catch (e: any) { setPasswordError(e.message); return }
    setPasswordModal(null); setConfirmPassword(''); setPasswordError('')
  }

  const handleFaqSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('vulnify_token') || ''
    try {
      if (editingFaq) {
        await adminUpdateFAQ(token, editingFaq.id, faqForm)
      } else {
        await adminCreateFAQ(token, faqForm)
      }
      setShowFaqForm(false)
      setEditingFaq(null)
      setFaqForm({ question: '', answer: '', category: '', published: false, order: 0 })
      loadFAQs()
    } catch (e: any) { alert(e.message) }
  }

  const handleEditFaq = (faq: FAQData) => {
    setEditingFaq(faq)
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      published: faq.published,
      order: faq.order,
    })
    setShowFaqForm(true)
  }

  const handleDeleteFaq = async (id: number) => {
    if (!confirmPassword) return
    try {
      const token = localStorage.getItem('vulnify_token') || ''
      await adminDeleteFAQ(token, id)
      loadFAQs()
    } catch (e: any) { setPasswordError(e.message); return }
    setPasswordModal(null); setConfirmPassword(''); setPasswordError('')
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = {
        name: productForm.name,
        slug: productForm.slug || productForm.name.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, ''),
        description: productForm.description,
        price_one_time: productForm.price_one_time ? parseFloat(productForm.price_one_time) : null,
        price_monthly: productForm.price_monthly ? parseFloat(productForm.price_monthly) : null,
        stripe_price_id_one_time: productForm.stripe_price_id_one_time,
        stripe_price_id_monthly: productForm.stripe_price_id_monthly,
        file_url: productForm.file_url,
        active: productForm.active,
      }
      if (editingProduct) {
        await adminUpdateProduct(editingProduct.id, data)
      } else {
        await adminCreateProduct(data)
      }
      setShowProductForm(false); loadProducts()
    } catch (e: any) { alert(e.message) }
  }

  const handleDeleteProduct = async (id: number) => {
    if (!confirmPassword) return
    try {
      await adminDeleteProduct(id)
      loadProducts(); loadPurchases()
    } catch (e: any) { setPasswordError(e.message); return }
    setPasswordModal(null); setConfirmPassword(''); setPasswordError('')
  }

  const handleMoveFaq = async (faq: FAQData, direction: 'up' | 'down') => {
    const sorted = [...faqs].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex(f => f.id === faq.id)
    if (direction === 'up' && idx <= 0) return
    if (direction === 'down' && idx >= sorted.length - 1) return
    const target = direction === 'up' ? sorted[idx - 1] : sorted[idx + 1]
    const token = localStorage.getItem('vulnify_token') || ''
    try {
      await adminUpdateFAQ(token, faq.id, { order: target.order })
      await adminUpdateFAQ(token, target.id, { order: faq.order })
      loadFAQs()
    } catch (e: any) { alert(e.message) }
  }

  const pages = Math.ceil(usersTotal / 50)
  const messagesPages = Math.ceil(messagesTotal / 50)
  const ordersPages = Math.ceil(ordersTotal / 50)

  const userCols = t('admin.users.columns', { returnObjects: true }) as string[]
  const orderCols = t('admin.orders.columns', { returnObjects: true }) as string[]
  const blogCols = t('admin.blog.columns', { returnObjects: true }) as string[]
  const testCols = t('admin.testimonials.columns', { returnObjects: true }) as string[]
  const faqCols = t('admin.faq.columns', { returnObjects: true }) as string[]
  const logCols = t('admin.activity.columns', { returnObjects: true }) as string[]
  const statusOptions = t('admin.orders.status_options', { returnObjects: true }) as string[]

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ShieldAlert className="size-7 text-zinc-500" />
            <h1 className="text-2xl font-bold tracking-tight">{t('admin.heading')}</h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <button onClick={handleRefresh} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors bg-transparent border border-white/[0.06] rounded-lg px-4 py-2 cursor-pointer">
              <RefreshCw className="size-4" /> {t('admin.refresh')}
            </button>
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors bg-transparent border border-white/[0.06] rounded-lg px-4 py-2 cursor-pointer">
              <LayoutDashboard className="size-4" /> {t('nav.mi_panel')}
            </button>
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors bg-transparent border border-white/[0.06] rounded-lg px-4 py-2 cursor-pointer">
              <ArrowLeft className="size-4" /> {t('common.back_to_website')}
            </button>
            <button onClick={() => { logout(); navigate('/') }} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors bg-transparent border border-white/[0.06] rounded-lg px-4 py-2 cursor-pointer">
              <LogOut className="size-4" /> {t('nav.cerrar_sesion')}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-white/[0.06] overflow-x-auto">
          {([
            ['stats', t('admin.tabs.stats')],
            ['users', t('admin.tabs.users')],
            ['messages', t('admin.tabs.messages')],
            ['orders', t('admin.tabs.orders')],
            ['blog', t('admin.tabs.blog')],
            ['testimonios', t('admin.tabs.testimonials')],
            ['products', t('admin.tabs.products')],
            ['purchases', t('admin.tabs.purchases')],
            ['faq', t('admin.tabs.faq')],
            ['logs', t('admin.tabs.activity')],
          ] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-5 py-3 text-sm transition-colors cursor-pointer bg-transparent border-none whitespace-nowrap ${
                tab === key ? 'text-white border-b border-white font-medium' : 'text-zinc-500 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Stats Tab */}
        {tab === 'stats' && (
          <div>
            {statsError && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 mb-6">{statsError}</div>}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: t('admin.stats.users'), value: stats?.total_users ?? '-', icon: Users },
                { label: t('admin.stats.messages'), value: stats?.total_messages ?? '-', icon: MessageSquare },
                { label: t('admin.stats.orders'), value: stats?.total_orders ?? '-', icon: ShoppingCart },
                { label: t('admin.stats.activity'), value: stats?.total_logs ?? '-', icon: Activity },
              ].map((card) => (
                <div key={card.label} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <card.icon className="size-5 text-zinc-500" />
                    <span className="text-sm text-zinc-500">{card.label}</span>
                  </div>
                  <div className="text-3xl font-bold">{card.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-xl bg-white/[0.02] border border-white/[0.06] p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wrench className="size-5 text-zinc-500" />
                  <div>
                    <p className="text-sm font-medium text-white">{t('admin.stats.maintenance')}</p>
                    <p className="text-xs text-zinc-500">{t('admin.stats.maintenance_desc')}</p>
                  </div>
                </div>
                <button onClick={() => setPasswordModal({ action: 'toggle_maintenance', id: 0 })}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer border-none ${maintenanceMode ? 'bg-red-500' : 'bg-zinc-700'}`}>
                  <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-black transition-transform ${maintenanceMode ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-white/[0.02] border border-white/[0.06] p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="size-5 text-zinc-500" />
                  <div>
                    <p className="text-sm font-medium text-white">{t('admin.stats.seed_label')}</p>
                    <p className="text-xs text-zinc-500">{t('admin.stats.seed_desc')}</p>
                  </div>
                </div>
                <button onClick={async () => {
                  try {
                    const tok = localStorage.getItem('vulnify_token') || ''
                    const res = await fetch(`${BASE}/api/admin/seed`, {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${tok}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({}),
                    })
                    if (!res.ok) throw new Error('Seed failed')
                    const data = await res.json()
                    alert(t('admin.stats.seed_success', { posts: data.inserted.posts, testimonials: data.inserted.testimonials, faqs: data.inserted.faqs, products: data.inserted.products }))
                  } catch { alert(t('admin.stats.seed_error')) }
                }} className="text-xs px-4 py-2 rounded-lg bg-white text-black font-medium hover:bg-zinc-200 transition-colors cursor-pointer border-none">
                  {t('admin.stats.seed_button')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div>
            <form onSubmit={handleSearch} className="flex gap-3 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                <input type="text" placeholder={t('admin.users.search')} value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" />
              </div>
              <button type="submit" className="px-4 py-2 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition-colors cursor-pointer border-none text-white">{t('admin.users.search_button')}</button>
            </form>
            {usersError && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 mb-4">{usersError}</div>}
            <div className="rounded-xl border border-white/[0.06] overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">{userCols[0]}</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">{userCols[1]}</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">{userCols[2]}</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">{userCols[3]}</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">{userCols[4]}</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">{userCols[5]}</th>
                    <th className="text-right py-3 px-4 text-zinc-500 font-medium">{userCols[6]}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-zinc-400">{u.id}</td>
                      <td className="py-3 px-4">{u.name}</td>
                      <td className="py-3 px-4 text-zinc-400">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-500/20 text-zinc-400'}`}>{u.role}</span>
                      </td>
                      <td className="py-3 px-4">{u.is_verified ? <span className="text-green-400">{t('common.yes')}</span> : <span className="text-zinc-500">{t('common.no')}</span>}</td>
                      <td className="py-3 px-4 text-zinc-500 text-xs">{u.created_at?.slice(0, 10)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setPasswordModal({ action: 'role', id: u.id, extra: u.role })} disabled={userActionLoading === u.id}
                            className="text-xs px-2 py-1 rounded border border-white/[0.1] text-zinc-400 hover:text-white hover:border-white/30 transition-colors disabled:opacity-50 cursor-pointer bg-transparent">
                            {u.role === 'admin' ? t('admin.users.remove_admin') : t('admin.users.make_admin')}
                          </button>
                          {u.id !== user?.id && (
                            <button onClick={() => setPasswordModal({ action: 'delete_user', id: u.id })} disabled={userActionLoading === u.id}
                              className="text-xs px-2 py-1 rounded border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 cursor-pointer bg-transparent">
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && !usersError && <tr><td colSpan={7} className="py-8 text-center text-zinc-500">{t('common.no_results')}</td></tr>}
                </tbody>
              </table>
            </div>
            {pages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: Math.min(pages, 10) }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => loadUsers(p, searchQuery || undefined)}
                    className={`w-8 h-8 text-xs rounded transition-colors cursor-pointer border-none ${usersPage === p ? 'bg-white/20 text-white' : 'bg-white/5 text-zinc-500 hover:bg-white/10'}`}>{p}</button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {tab === 'messages' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <MessageSquare className="size-5 text-zinc-500" />
                <span className="text-sm text-zinc-500">{t('admin.messages.count', { count: messagesTotal })}</span>
              </div>
              <button onClick={() => downloadAdminCSV('/api/admin/messages/export', 'messages.csv')}
                className="flex items-center gap-2 text-xs bg-white/5 rounded-lg px-3 py-1.5 hover:bg-white/10 transition-colors cursor-pointer border-none text-zinc-400 hover:text-white">
                {t('admin.messages.export_csv')}
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-white/[0.06] overflow-y-auto max-h-[600px]">
                {messages.map((msg) => (
                  <div key={msg.id}
                    onClick={() => { setSelectedMessage(msg); handleMarkRead(msg) }}
                    className={`p-4 border-b border-white/[0.04] cursor-pointer transition-colors hover:bg-white/[0.02] ${selectedMessage?.id === msg.id ? 'bg-white/[0.04]' : ''} ${!msg.read ? 'border-l-2 border-l-blue-500' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{msg.name}</span>
                      <span className="text-xs text-zinc-600">{msg.created_at?.slice(0, 10)}</span>
                    </div>
                    <div className="text-xs text-zinc-400 mb-1">{msg.email}</div>
                    <div className="text-xs text-zinc-500 truncate">{msg.subject || msg.message?.slice(0, 80)}</div>
                  </div>
                ))}
                {messages.length === 0 && <div className="py-8 text-center text-zinc-500 text-sm">{t('admin.messages.empty')}</div>}
              </div>
              <div className="rounded-xl border border-white/[0.06] p-6">
                {selectedMessage ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">{selectedMessage.name}</h3>
                        <p className="text-sm text-zinc-400">{selectedMessage.email}</p>
                        {selectedMessage.company && <p className="text-xs text-zinc-500">{selectedMessage.company}</p>}
                      </div>
                      <div className="flex gap-2">
                        <a href={`mailto:${selectedMessage.email}`} className="text-xs px-3 py-1.5 rounded border border-white/[0.1] text-zinc-400 hover:text-white transition-colors no-underline">{t('admin.messages.reply')}</a>
                        <button onClick={() => setPasswordModal({ action: 'delete_message', id: selectedMessage.id })}
                          className="text-xs px-3 py-1.5 rounded border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer bg-transparent">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                    {selectedMessage.subject && <div className="text-sm text-zinc-300 mb-3 font-medium">{selectedMessage.subject}</div>}
                    <div className="text-sm text-zinc-400 whitespace-pre-wrap">{selectedMessage.message}</div>
                    <div className="mt-4 text-xs text-zinc-600">{selectedMessage.created_at?.replace('T', ' ')}</div>
                  </div>
                ) : (
                  <div className="text-center text-zinc-500 py-12 text-sm">{t('admin.messages.select_hint')}</div>
                )}
              </div>
            </div>
            {messagesPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: Math.min(messagesPages, 10) }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => loadMessages(p)}
                    className={`w-8 h-8 text-xs rounded transition-colors cursor-pointer border-none ${messagesPage === p ? 'bg-white/20 text-white' : 'bg-white/5 text-zinc-500 hover:bg-white/10'}`}>{p}</button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {tab === 'orders' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <ShoppingCart className="size-5 text-zinc-500" />
                <span className="text-sm text-zinc-500">{t('admin.orders.count', { count: ordersTotal })}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => downloadAdminCSV('/api/admin/orders/export', 'orders.csv')}
                  className="flex items-center gap-2 text-xs bg-white/5 rounded-lg px-3 py-1.5 hover:bg-white/10 transition-colors cursor-pointer border-none text-zinc-400 hover:text-white">
                  {t('admin.orders.export_csv')}
                </button>
                <button onClick={() => { setEditingOrder(null); setOrderForm({ client_name: '', client_email: '', service: '', description: '', amount: 0, status: 'pending' }); setShowOrderForm(true) }}
                  className="flex items-center gap-2 text-sm bg-white/10 rounded-lg px-4 py-2 hover:bg-white/20 transition-colors cursor-pointer border-none text-white">
                  <Plus className="size-4" /> {t('admin.orders.new')}
                </button>
            </div>
          </div>

            {showOrderForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowOrderForm(false)}>
                <div className="bg-zinc-900 border border-white/[0.1] rounded-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-lg font-semibold mb-4">{editingOrder ? t('admin.orders.edit_title') : t('admin.orders.new_title')}</h3>
                  <form onSubmit={handleOrderSubmit} className="space-y-4">
                    <input placeholder={t('admin.orders.customer_name')} value={orderForm.client_name}
                      onChange={(e) => setOrderForm({ ...orderForm, client_name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" required />
                    <input type="email" placeholder={t('admin.orders.customer_email')} value={orderForm.client_email}
                      onChange={(e) => setOrderForm({ ...orderForm, client_email: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" required />
                    <input placeholder={t('admin.orders.service')} value={orderForm.service}
                      onChange={(e) => setOrderForm({ ...orderForm, service: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" required />
                    <textarea placeholder={t('admin.orders.description')} value={orderForm.description}
                      onChange={(e) => setOrderForm({ ...orderForm, description: e.target.value })} rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" />
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-xs text-zinc-500 mb-1 block">{t('admin.orders.amount')}</label>
                        <input type="number" step="0.01" value={orderForm.amount}
                          onChange={(e) => setOrderForm({ ...orderForm, amount: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-zinc-500 mb-1 block">{t('admin.orders.status')}</label>
                        <select value={orderForm.status}
                          onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30">
                          <option value="pending">{statusOptions[0]}</option>
                          <option value="in_progress">{statusOptions[1]}</option>
                          <option value="completed">{statusOptions[2]}</option>
                          <option value="cancelled">{statusOptions[3]}</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="submit" className="flex-1 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors cursor-pointer border-none">
                        {editingOrder ? t('common.save') : t('common.create')}
                      </button>
                      <button type="button" onClick={() => setShowOrderForm(false)}
                        className="px-4 py-2.5 rounded-lg border border-white/[0.1] text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer bg-transparent">
                        {t('common.cancel')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-white/[0.06] overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">{orderCols[0]}</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">{orderCols[1]}</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">{orderCols[2]}</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">{orderCols[3]}</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">{orderCols[4]}</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">{orderCols[5]}</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">{orderCols[6]}</th>
                    <th className="text-right py-3 px-4 text-zinc-500 font-medium">{orderCols[7]}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-zinc-400">{o.id}</td>
                      <td className="py-3 px-4">{o.client_name}</td>
                      <td className="py-3 px-4 text-zinc-400">{o.client_email}</td>
                      <td className="py-3 px-4">{o.service}</td>
                      <td className="py-3 px-4">{o.amount > 0 ? `${o.amount}€` : '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          o.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          o.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                          o.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {o.status === 'pending' ? statusOptions[0] :
                           o.status === 'in_progress' ? statusOptions[1] :
                           o.status === 'completed' ? statusOptions[2] :
                           o.status === 'cancelled' ? statusOptions[3] : o.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-500 text-xs">{o.created_at?.slice(0, 10)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => { setTimelineOrder(o); adminGetOrderTimeline(o.id).then(setTimeline).catch(() => setTimeline([])) }}
                            className="text-xs px-2 py-1 rounded border border-white/[0.1] text-zinc-400 hover:text-white hover:border-white/30 transition-colors cursor-pointer bg-transparent flex items-center gap-1">
                            <History className="size-3" /> {t('admin.orders.history')}
                          </button>
                          <button onClick={() => adminGetOrderInvoice(o.id).catch((e: any) => alert(e.message))}
                            className="text-xs px-2 py-1 rounded border border-white/[0.1] text-zinc-400 hover:text-white hover:border-white/30 transition-colors cursor-pointer bg-transparent flex items-center gap-1">
                            <FileText className="size-3" /> {t('admin.orders.pdf')}
                          </button>
                          <button onClick={() => openPhotoGallery(o)}
                            className="text-xs px-2 py-1 rounded border border-white/[0.1] text-zinc-400 hover:text-white hover:border-white/30 transition-colors cursor-pointer bg-transparent flex items-center gap-1">
                            <Image className="size-3" /> {t('admin.orders.photos')}
                          </button>
                          <button onClick={() => handleEditOrder(o)}
                            className="text-xs px-2 py-1 rounded border border-white/[0.1] text-zinc-400 hover:text-white hover:border-white/30 transition-colors cursor-pointer bg-transparent">{t('common.edit')}</button>
                          <button onClick={() => setPasswordModal({ action: 'delete_order', id: o.id })}
                            className="text-xs px-2 py-1 rounded border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer bg-transparent">
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-zinc-500">{t('admin.orders.empty')}</td></tr>}
                </tbody>
              </table>
            </div>
            {ordersPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: Math.min(ordersPages, 10) }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => loadOrders(p)}
                    className={`w-8 h-8 text-xs rounded transition-colors cursor-pointer border-none ${ordersPage === p ? 'bg-white/20 text-white' : 'bg-white/5 text-zinc-500 hover:bg-white/10'}`}>{p}</button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Blog Tab */}
        {tab === 'blog' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <BookOpen className="size-5 text-zinc-500" />
                <span className="text-sm text-zinc-500">{t('admin.blog.count', { count: blogPosts.length })}</span>
              </div>
              <button onClick={() => { setEditingBlogPost(null); setBlogForm({ title: '', slug: '', tag: '', excerpt: '', content: '', author: '', read_time: '', published: false }); setShowBlogForm(true) }}
                className="flex items-center gap-2 text-sm bg-white/10 rounded-lg px-4 py-2 hover:bg-white/20 transition-colors cursor-pointer border-none text-white">
                <Plus className="size-4" /> {t('admin.blog.new')}
              </button>
            </div>

            {blogError && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 mb-6">{blogError}</div>}

            {showBlogForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowBlogForm(false)}>
                <div className="bg-zinc-900 border border-white/[0.1] rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-lg font-semibold mb-4">{editingBlogPost ? t('admin.blog.edit_title') : t('admin.blog.new_title')}</h3>
                  <form onSubmit={handleBlogSubmit} className="space-y-4">
                    <input placeholder={t('admin.blog.title')} value={blogForm.title}
                      onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" required />
                    <div className="flex gap-4">
                      <input placeholder={t('admin.blog.slug')} value={blogForm.slug}
                        onChange={(e) => setBlogForm({ ...blogForm, slug: e.target.value })}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" required />
                      <input placeholder={t('admin.blog.tag')} value={blogForm.tag}
                        onChange={(e) => setBlogForm({ ...blogForm, tag: e.target.value })}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" required />
                    </div>
                    <div className="flex gap-4">
                      <input placeholder={t('admin.blog.author')} value={blogForm.author}
                        onChange={(e) => setBlogForm({ ...blogForm, author: e.target.value })}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" required />
                      <input placeholder={t('admin.blog.read_time')} value={blogForm.read_time}
                        onChange={(e) => setBlogForm({ ...blogForm, read_time: e.target.value })}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" />
                    </div>
                    <textarea placeholder={t('admin.blog.excerpt')} value={blogForm.excerpt}
                      onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })} rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" />
                    <textarea placeholder={t('admin.blog.content')} value={blogForm.content}
                      onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })} rows={6}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30 font-mono" required />
                    <label className="flex items-center gap-3 text-sm text-zinc-400">
                      <input type="checkbox" checked={blogForm.published}
                        onChange={(e) => setBlogForm({ ...blogForm, published: e.target.checked })}
                        className="size-4 rounded border-white/20 bg-white/5 text-white focus:ring-0 cursor-pointer" />
                      {t('admin.blog.published')}
                    </label>
                    <div className="flex gap-3 pt-2">
                      <button type="submit" className="flex-1 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors cursor-pointer border-none">
                        {editingBlogPost ? t('common.save') : t('common.create')}
                      </button>
                      <button type="button" onClick={() => setShowBlogForm(false)}
                        className="px-4 py-2.5 rounded-lg border border-white/[0.1] text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer bg-transparent">
                        {t('common.cancel')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-white/[0.06] overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">{blogCols[0]}</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">{blogCols[1]}</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">{blogCols[2]}</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">{blogCols[3]}</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">{blogCols[4]}</th>
                    <th className="text-right py-3 px-4 text-zinc-500 font-medium">{blogCols[5]}</th>
                  </tr>
                </thead>
                <tbody>
                  {blogPosts.map((p) => (
                    <tr key={p.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-zinc-400">{p.id}</td>
                      <td className="py-3 px-4 max-w-[200px] truncate">{p.title}</td>
                      <td className="py-3 px-4">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-400">{p.tag}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${p.published ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {p.published ? t('admin.blog.status_published') : t('admin.blog.status_draft')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-500 text-xs">{p.created_at?.slice(0, 10)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleTogglePublish(p)}
                            className="text-xs px-2 py-1 rounded border border-white/[0.1] text-zinc-400 hover:text-white hover:border-white/30 transition-colors cursor-pointer bg-transparent">
                            {p.published ? t('admin.blog.archive') : t('admin.blog.publish')}
                          </button>
                          <button onClick={() => handleEditBlogPost(p)}
                            className="text-xs px-2 py-1 rounded border border-white/[0.1] text-zinc-400 hover:text-white hover:border-white/30 transition-colors cursor-pointer bg-transparent">{t('common.edit')}</button>
                          <button onClick={() => setPasswordModal({ action: 'delete_blog_post', id: p.id })}
                            className="text-xs px-2 py-1 rounded border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer bg-transparent">
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {blogPosts.length === 0 && !blogError && <tr><td colSpan={6} className="py-8 text-center text-zinc-500">{t('admin.blog.empty')}</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Testimonios Tab */}
        {tab === 'testimonios' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Star className="size-5 text-zinc-500" />
                <span className="text-sm text-zinc-500">{t('admin.testimonials.count', { count: testimonials.length })}</span>
              </div>
              <button onClick={() => { setEditingTestimonial(null); setTestForm({ name: '', role: '', company: '', content: '', avatar_url: '', rating: 5, featured: false }); setShowTestForm(true) }}
                className="flex items-center gap-2 text-sm bg-white/10 rounded-lg px-4 py-2 hover:bg-white/20 transition-colors cursor-pointer border-none text-white">
                <Plus className="size-4" /> {t('admin.testimonials.new')}
              </button>
            </div>

            {testError && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 mb-6">{testError}</div>}

            {showTestForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowTestForm(false)}>
                <div className="bg-zinc-900 border border-white/[0.1] rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-lg font-semibold mb-4">{editingTestimonial ? t('admin.testimonials.edit_title') : t('admin.testimonials.new_title')}</h3>
                  <form onSubmit={handleTestSubmit} className="space-y-4">
                    <div className="flex gap-4">
                      <input placeholder={t('admin.testimonials.name')} value={testForm.name}
                        onChange={(e) => setTestForm({ ...testForm, name: e.target.value })}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" required />
                      <input placeholder={t('admin.testimonials.role')} value={testForm.role}
                        onChange={(e) => setTestForm({ ...testForm, role: e.target.value })}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" />
                    </div>
                    <input placeholder={t('admin.testimonials.company')} value={testForm.company}
                      onChange={(e) => setTestForm({ ...testForm, company: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" />
                    <input placeholder={t('admin.testimonials.avatar_url')} value={testForm.avatar_url}
                      onChange={(e) => setTestForm({ ...testForm, avatar_url: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" />
                    <textarea placeholder={t('admin.testimonials.content')} value={testForm.content}
                      onChange={(e) => setTestForm({ ...testForm, content: e.target.value })} rows={4}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" required />
                    <div className="flex gap-4 items-end">
                      <div>
                        <label className="text-xs text-zinc-500 mb-1 block">{t('admin.testimonials.rating')}</label>
                        <input type="number" min={1} max={5} value={testForm.rating}
                          onChange={(e) => setTestForm({ ...testForm, rating: parseInt(e.target.value) || 5 })}
                          className="w-20 bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30" />
                      </div>
                      <label className="flex items-center gap-3 text-sm text-zinc-400 pb-1">
                        <input type="checkbox" checked={testForm.featured}
                          onChange={(e) => setTestForm({ ...testForm, featured: e.target.checked })}
                          className="size-4 rounded border-white/20 bg-white/5 text-white focus:ring-0 cursor-pointer" />
                        {t('admin.testimonials.featured')}
                      </label>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="submit" className="flex-1 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors cursor-pointer border-none">
                        {editingTestimonial ? t('common.save') : t('common.create')}
                      </button>
                      <button type="button" onClick={() => setShowTestForm(false)}
                        className="px-4 py-2.5 rounded-lg border border-white/[0.1] text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer bg-transparent">
                        {t('common.cancel')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-white/[0.06] overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">{testCols[0]}</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">{testCols[1]}</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">{testCols[2]}</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">{testCols[3]}</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">{testCols[4]}</th>
                    <th className="text-right py-3 px-4 text-zinc-500 font-medium">{testCols[5]}</th>
                  </tr>
                </thead>
                <tbody>
                  {testimonials.map((tm) => (
                    <tr key={tm.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-zinc-400">{tm.id}</td>
                      <td className="py-3 px-4">{tm.name}</td>
                      <td className="py-3 px-4 text-zinc-400">{tm.company || '-'}</td>
                      <td className="py-3 px-4">
                        <span className="text-yellow-400">{'★'.repeat(tm.rating)}{'☆'.repeat(5 - tm.rating)}</span>
                      </td>
                      <td className="py-3 px-4">
                        {tm.featured ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">{t('common.yes')}</span> : <span className="text-xs text-zinc-500">{t('common.no')}</span>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEditTestimonial(tm)}
                            className="text-xs px-2 py-1 rounded border border-white/[0.1] text-zinc-400 hover:text-white hover:border-white/30 transition-colors cursor-pointer bg-transparent">{t('common.edit')}</button>
                          <button onClick={() => setPasswordModal({ action: 'delete_testimonial', id: tm.id })}
                            className="text-xs px-2 py-1 rounded border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer bg-transparent">
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {testimonials.length === 0 && !testError && <tr><td colSpan={6} className="py-8 text-center text-zinc-500">Sin testimonios</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {tab === 'products' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Tags className="size-5 text-zinc-500" />
                <span className="text-sm text-zinc-500">{t('admin.products.count', { count: products.length })}</span>
              </div>
              <button onClick={() => { setEditingProduct(null); setProductForm({ name: '', slug: '', description: '', price_one_time: '', price_monthly: '', stripe_price_id_one_time: '', stripe_price_id_monthly: '', file_url: '', active: true }); setShowProductForm(true) }}
                className="flex items-center gap-2 text-sm bg-white/10 rounded-lg px-4 py-2 hover:bg-white/20 transition-colors cursor-pointer border-none text-white">
                <Plus className="size-4" /> {t('admin.products.add')}
              </button>
            </div>
            {productsError && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 mb-6">{productsError}</div>}
            <div className="overflow-x-auto rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-zinc-500">
                    <th className="p-4 font-medium">ID</th>
                    <th className="p-4 font-medium">{t('admin.products.name')}</th>
                    <th className="p-4 font-medium">{t('admin.products.price_one_time')}</th>
                    <th className="p-4 font-medium">{t('admin.products.price_monthly')}</th>
                    <th className="p-4 font-medium">{t('admin.products.active')}</th>
                    <th className="p-4 font-medium">{t('admin.products.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-b border-white/[0.06] hover:bg-white/[0.02]">
                      <td className="p-4 text-zinc-400">{p.id}</td>
                      <td className="p-4 text-white font-medium">{p.name}</td>
                      <td className="p-4 text-zinc-300">{p.price_one_time ? `${p.price_one_time}€` : '-'}</td>
                      <td className="p-4 text-zinc-300">{p.price_monthly ? `${p.price_monthly}€/mo` : '-'}</td>
                      <td className="p-4">{p.active ? <span className="text-green-400">{t('admin.yes')}</span> : <span className="text-red-400">{t('admin.no')}</span>}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingProduct(p); setProductForm({ name: p.name, slug: p.slug, description: p.description, price_one_time: p.price_one_time?.toString() || '', price_monthly: p.price_monthly?.toString() || '', stripe_price_id_one_time: p.stripe_price_id_one_time || '', stripe_price_id_monthly: p.stripe_price_id_monthly || '', file_url: p.file_url || '', active: p.active ?? true }); setShowProductForm(true) }}
                            className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-md hover:bg-blue-500/30 transition-colors cursor-pointer border-none">
                            {t('common.edit')}
                          </button>
                          <button onClick={() => setPasswordModal({ action: 'delete_product', id: p.id })}
                            className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-md hover:bg-red-500/30 transition-colors cursor-pointer border-none">
                            {t('common.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {showProductForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowProductForm(false)}>
                <div className="bg-zinc-900 border border-white/[0.1] rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-lg font-semibold mb-4">{editingProduct ? t('admin.products.edit_title') : t('admin.products.new_title')}</h3>
                  <form onSubmit={handleProductSubmit} className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-zinc-500 mb-1 block">{t('admin.products.name')}</label>
                        <input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" required />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-zinc-500 mb-1 block">{t('admin.products.slug')}</label>
                        <input value={productForm.slug} onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">{t('admin.products.description')}</label>
                      <textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" />
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-zinc-500 mb-1 block">{t('admin.products.price_one_time')}</label>
                        <input type="number" step="0.01" value={productForm.price_one_time} onChange={(e) => setProductForm({ ...productForm, price_one_time: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-zinc-500 mb-1 block">{t('admin.products.price_monthly')}</label>
                        <input type="number" step="0.01" value={productForm.price_monthly} onChange={(e) => setProductForm({ ...productForm, price_monthly: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-zinc-500 mb-1 block">Stripe Price ID (one-time)</label>
                        <input value={productForm.stripe_price_id_one_time} onChange={(e) => setProductForm({ ...productForm, stripe_price_id_one_time: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-zinc-500 mb-1 block">Stripe Price ID (monthly)</label>
                        <input value={productForm.stripe_price_id_monthly} onChange={(e) => setProductForm({ ...productForm, stripe_price_id_monthly: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">{t('admin.products.file_url')}</label>
                      <input value={productForm.file_url} onChange={(e) => setProductForm({ ...productForm, file_url: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" />
                    </div>
                    <label className="flex items-center gap-3 text-sm text-zinc-400">
                      <input type="checkbox" checked={productForm.active}
                        onChange={(e) => setProductForm({ ...productForm, active: e.target.checked })}
                        className="size-4 rounded border-white/20 bg-white/5 text-white focus:ring-0 cursor-pointer" />
                      {t('admin.products.active')}
                    </label>
                    <div className="flex gap-3 pt-2">
                      <button type="submit" className="flex-1 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors cursor-pointer border-none">
                        {editingProduct ? t('common.save') : t('common.create')}
                      </button>
                      <button type="button" onClick={() => setShowProductForm(false)}
                        className="px-4 py-2.5 rounded-lg border border-white/[0.1] text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer bg-transparent">
                        {t('common.cancel')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Purchases Tab */}
        {tab === 'purchases' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Key className="size-5 text-zinc-500" />
                <span className="text-sm text-zinc-500">{t('admin.purchases.count', { count: purchases.length })}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowPurchaseForm(true)}
                  className="flex items-center gap-2 text-sm bg-white/10 rounded-lg px-4 py-2 hover:bg-white/20 transition-colors cursor-pointer border-none text-white">
                  <Plus className="size-4" /> Generar token
                </button>
                <button onClick={loadPurchases} className="flex items-center gap-2 text-sm bg-white/10 rounded-lg px-4 py-2 hover:bg-white/20 transition-colors cursor-pointer border-none text-white">
                  <RefreshCw className="size-4" /> {t('admin.refresh')}
                </button>
              </div>
            </div>
            {purchasesError && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 mb-6">{purchasesError}</div>}
            <div className="overflow-x-auto rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-zinc-500">
                    <th className="p-4 font-medium">ID</th>
                    <th className="p-4 font-medium">{t('admin.purchases.product')}</th>
                    <th className="p-4 font-medium">{t('admin.purchases.buyer')}</th>
                    <th className="p-4 font-medium">{t('admin.purchases.amount')}</th>
                    <th className="p-4 font-medium">{t('admin.purchases.token')}</th>
                    <th className="p-4 font-medium">{t('admin.purchases.status')}</th>
                    <th className="p-4 font-medium">{t('admin.purchases.date')}</th>
                    <th className="p-4 font-medium">{t('admin.purchases.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p) => {
                    const prod = products.find(x => x.id === p.product_id)
                    return (
                      <tr key={p.id} className="border-b border-white/[0.06] hover:bg-white/[0.02]">
                        <td className="p-4 text-zinc-400">{p.id}</td>
                        <td className="p-4 text-white font-medium">{prod?.name || `#${p.product_id}`}</td>
                        <td className="p-4">
                          <div className="text-white">{p.buyer_name}</div>
                          <div className="text-zinc-500 text-xs">{p.buyer_email}</div>
                        </td>
                        <td className="p-4 text-zinc-300">{p.amount ? `${p.amount}€` : '-'}</td>
                        <td className="p-4">
                          <code className="text-xs bg-black/40 px-2 py-1 rounded text-zinc-400 break-all max-w-[120px] inline-block truncate">{p.token}</code>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded ${p.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-4 text-zinc-400 text-xs">{p.created_at}</td>
                        <td className="p-4">
                          <button onClick={async () => {
                            try { const r = await adminRegenerateToken(p.id); alert(`Token regenerado: ${r.token}`); loadPurchases() }
                            catch (e: any) { alert(e.message) }
                          }}
                            className="text-xs bg-zinc-500/20 text-zinc-400 px-3 py-1 rounded-md hover:bg-zinc-500/30 transition-colors cursor-pointer border-none">
                            {t('admin.purchases.regenerate')}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {showPurchaseForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => { setShowPurchaseForm(false); setPurchaseFormResult('') }}>
                <div className="bg-zinc-900 border border-white/[0.1] rounded-xl p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-lg font-semibold mb-4">Generar token de acceso</h3>
                  {purchaseFormResult && (
                    <div className="mb-4 p-3 rounded-lg text-sm break-all" style={purchaseFormResult.startsWith('Error') ? { background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', color: '#f87171' } : { background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80' }}>
                      {purchaseFormResult}
                    </div>
                  )}
                  <form onSubmit={async (e) => {
                    e.preventDefault()
                    setPurchaseFormLoading(true)
                    setPurchaseFormResult('')
                    try {
                      const r = await adminCreatePurchase({
                        product_id: purchaseForm.product_id,
                        buyer_email: purchaseForm.buyer_email,
                        buyer_name: purchaseForm.buyer_name,
                        interval: purchaseForm.interval,
                        amount: purchaseForm.amount,
                        expires_in_days: purchaseForm.expires_in_days ? Number(purchaseForm.expires_in_days) : undefined,
                      })
                      setPurchaseFormResult(`Token generado: ${r.token}`)
                      setPurchaseForm({ product_id: products[0]?.id || 0, buyer_email: '', buyer_name: '', interval: 'one_time', amount: 0, expires_in_days: '' })
                      loadPurchases()
                    } catch (e: any) {
                      setPurchaseFormResult(`Error: ${e.message}`)
                    } finally {
                      setPurchaseFormLoading(false)
                    }
                  }} className="space-y-4">
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">Producto</label>
                      <select value={purchaseForm.product_id} onChange={(e) => setPurchaseForm({ ...purchaseForm, product_id: Number(e.target.value) })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30" required>
                        <option value={0} disabled>Seleccionar producto</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">Email del comprador</label>
                      <input type="email" placeholder="cliente@ejemplo.com" value={purchaseForm.buyer_email}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, buyer_email: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" required />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">Nombre del comprador</label>
                      <input type="text" placeholder="Nombre" value={purchaseForm.buyer_name}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, buyer_name: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">Modalidad</label>
                      <select value={purchaseForm.interval} onChange={(e) => {
                        const v = e.target.value
                        setPurchaseForm({
                          ...purchaseForm,
                          interval: v,
                          expires_in_days: v === 'monthly' ? '30' : '',
                        })
                      }}
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30">
                        <option value="one_time">Pago único</option>
                        <option value="monthly">Suscripción mensual</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">Caducidad (días)</label>
                      <input type="number" min="0" placeholder="Vacío = sin caducidad" value={purchaseForm.expires_in_days}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, expires_in_days: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">Importe (€)</label>
                      <input type="number" step="0.01" min="0" placeholder="0" value={purchaseForm.amount}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, amount: Number(e.target.value) })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="submit" disabled={purchaseFormLoading}
                        className="flex-1 bg-white/10 rounded-lg py-2.5 text-sm font-medium hover:bg-white/20 transition-colors cursor-pointer border-none text-white disabled:opacity-50">
                        {purchaseFormLoading ? 'Generando...' : 'Generar token'}
                      </button>
                      <button type="button" onClick={() => { setShowPurchaseForm(false); setPurchaseFormResult('') }}
                        className="px-4 py-2.5 text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent">
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FAQ Tab */}
        {tab === 'faq' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <HelpCircle className="size-5 text-zinc-500" />
                <span className="text-sm text-zinc-500">{t('admin.faq.count', { count: faqs.length })}</span>
              </div>
              <button onClick={() => { setEditingFaq(null); setFaqForm({ question: '', answer: '', category: '', published: false, order: faqs.length + 1 }); setShowFaqForm(true) }}
                className="flex items-center gap-2 text-sm bg-white/10 rounded-lg px-4 py-2 hover:bg-white/20 transition-colors cursor-pointer border-none text-white">
                <Plus className="size-4" /> {t('admin.faq.new')}
              </button>
            </div>

            {faqError && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 mb-6">{faqError}</div>}

            {showFaqForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowFaqForm(false)}>
                <div className="bg-zinc-900 border border-white/[0.1] rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-lg font-semibold mb-4">{editingFaq ? t('admin.faq.edit_title') : t('admin.faq.new_title')}</h3>
                  <form onSubmit={handleFaqSubmit} className="space-y-4">
                    <input placeholder={t('admin.faq.question')} value={faqForm.question}
                      onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" required />
                    <textarea placeholder={t('admin.faq.answer')} value={faqForm.answer}
                      onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })} rows={5}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" required />
                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <label className="text-xs text-zinc-500 mb-1 block">{t('admin.faq.category')}</label>
                        <input placeholder={t('admin.faq.category')} value={faqForm.category}
                          onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" />
                      </div>
                      <label className="flex items-center gap-3 text-sm text-zinc-400 pb-1">
                        <input type="checkbox" checked={faqForm.published}
                          onChange={(e) => setFaqForm({ ...faqForm, published: e.target.checked })}
                          className="size-4 rounded border-white/20 bg-white/5 text-white focus:ring-0 cursor-pointer" />
                        {t('admin.faq.published')}
                      </label>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="submit" className="flex-1 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors cursor-pointer border-none">
                        {editingFaq ? t('common.save') : t('common.create')}
                      </button>
                      <button type="button" onClick={() => setShowFaqForm(false)}
                        className="px-4 py-2.5 rounded-lg border border-white/[0.1] text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer bg-transparent">
                        {t('common.cancel')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-white/[0.06] overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">{faqCols[0]}</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">{faqCols[1]}</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">{faqCols[2]}</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">{faqCols[3]}</th>
                    <th className="text-right py-3 px-4 text-zinc-500 font-medium">{faqCols[4]}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...faqs].sort((a, b) => a.order - b.order).map((faq) => (
                    <tr key={faq.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-zinc-400 text-xs">{faq.order}</td>
                      <td className="py-3 px-4 max-w-[300px] truncate">{faq.question}</td>
                      <td className="py-3 px-4">
                        {faq.category && <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-400">{faq.category}</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${faq.published ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {faq.published ? t('common.yes') : t('common.no')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleMoveFaq(faq, 'up')}
                            className="text-xs p-1 rounded border border-white/[0.1] text-zinc-400 hover:text-white hover:border-white/30 transition-colors cursor-pointer bg-transparent"
                            title={t('admin.faq.move_up')}>
                            <ChevronUp className="size-3.5" />
                          </button>
                          <button onClick={() => handleMoveFaq(faq, 'down')}
                            className="text-xs p-1 rounded border border-white/[0.1] text-zinc-400 hover:text-white hover:border-white/30 transition-colors cursor-pointer bg-transparent"
                            title={t('admin.faq.move_down')}>
                            <ChevronDown className="size-3.5" />
                          </button>
                          <button onClick={() => handleEditFaq(faq)}
                            className="text-xs px-2 py-1 rounded border border-white/[0.1] text-zinc-400 hover:text-white hover:border-white/30 transition-colors cursor-pointer bg-transparent ml-1">{t('common.edit')}</button>
                          <button onClick={() => setPasswordModal({ action: 'delete_faq', id: faq.id })}
                            className="text-xs px-2 py-1 rounded border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer bg-transparent">
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {faqs.length === 0 && !faqError && <tr><td colSpan={5} className="py-8 text-center text-zinc-500">Sin FAQs</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Activity Logs Tab */}
        {tab === 'logs' && (
          <div>
            <div className="flex gap-3 mb-6 flex-wrap">
              <select value={logFilterAction}
                onChange={(e) => { setLogFilterAction(e.target.value); loadLogs(1, e.target.value || undefined) }}
                className="bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30">
                <option value="">Todas las acciones</option>
                {logActions.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <span className="text-sm text-zinc-500 self-center">{t('admin.activity.count', { count: logsTotal })}</span>
            </div>
            <div className="rounded-xl border border-white/[0.06] overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">{logCols[0]}</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">{logCols[1]}</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">{logCols[2]}</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">{logCols[3]}</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">{logCols[4]}</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">{logCols[5]}</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-zinc-500">{l.id}</td>
                      <td className="py-3 px-4">
                        <div>{l.email}</div>
                        <div className="text-xs text-zinc-600">ID: {l.user_id}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-400">{l.action}</span>
                      </td>
                      <td className="py-3 px-4 text-zinc-500 font-mono text-xs">{l.ip_address || '-'}</td>
                      <td className="py-3 px-4 text-zinc-500 text-xs max-w-[200px] truncate">{l.details || '-'}</td>
                      <td className="py-3 px-4 text-zinc-500 text-xs">{l.created_at?.replace('T', ' ')}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-zinc-500">Sin registros</td></tr>}
                </tbody>
              </table>
            </div>
            {logsTotal > 50 && (
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: Math.min(Math.ceil(logsTotal / 50), 10) }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => loadLogs(p, logFilterAction || undefined)}
                    className={`w-8 h-8 text-xs rounded transition-colors cursor-pointer border-none ${logsPage === p ? 'bg-white/20 text-white' : 'bg-white/5 text-zinc-500 hover:bg-white/10'}`}>{p}</button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Timeline modal */}
        {timelineOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => { setTimelineOrder(null); setTimeline([]) }}>
            <div className="bg-zinc-900 border border-white/[0.1] rounded-xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{t('admin.orders.history')} — #{timelineOrder.id} {timelineOrder.service}</h3>
                <button onClick={() => { setTimelineOrder(null); setTimeline([]) }}
                  className="text-zinc-500 hover:text-white transition-colors cursor-pointer bg-transparent border-none text-lg">✕</button>
              </div>
              <div className="space-y-3">
                {timeline.map((t: any) => (
                  <div key={t.id} className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-zinc-300">{t.field === 'status' ? t('dashboard.orders.field_status') : t.field === 'amount' ? 'Importe' : t.field === 'service' ? 'Servicio' : t.field}</span>
                      <span className="text-[10px] text-zinc-600">{t.created_at}</span>
                    </div>
                    {t.field === 'status' ? (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded bg-zinc-500/20 text-zinc-400">{t.old_value || '—'}</span>
                        <span className="text-zinc-600">→</span>
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">{t.new_value}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500">{t.old_value || '—'} → {t.new_value}</p>
                    )}
                    <p className="text-[10px] text-zinc-700 mt-1">por {t.changed_by}</p>
                  </div>
                ))}
                {timeline.length === 0 && <p className="text-center py-8 text-zinc-500 text-sm">{t('dashboard.orders.timeline_empty')}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Photo gallery modal */}
        {photoOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => { setPhotoOrder(null); setPhotos([]) }}>
            <div className="bg-zinc-900 border border-white/[0.1] rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{t('admin.orders.photos')} #{photoOrder.id} — {photoOrder.service}</h3>
                <button onClick={() => { setPhotoOrder(null); setPhotos([]) }}
                  className="text-zinc-500 hover:text-white transition-colors cursor-pointer bg-transparent border-none text-lg">✕</button>
              </div>
              <div className="flex gap-3 mb-6 flex-wrap">
                <input type="file" accept="image/*" ref={fileInputRef}
                  className="flex-1 min-w-[150px] bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-white/10 file:text-white file:cursor-pointer" />
                <input placeholder="Pie de foto (opcional)" value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  className="w-32 bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" />
                <button onClick={handleUploadPhoto}
                  className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors cursor-pointer border-none">Subir</button>
                {photos.length > 0 && (
                  <button onClick={() => setPasswordModal({ action: 'delete_all_photos', id: photoOrder.id })}
                    className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors cursor-pointer border-none">Borrar todas</button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((p) => (
                  <div key={p.id} className="relative group rounded-lg overflow-hidden border border-white/[0.06]">
                    <img src={p.image_data} alt={p.caption || 'Foto'} className="w-full h-40 object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button onClick={() => setPasswordModal({ action: 'delete_photo', id: p.id })}
                        className="px-3 py-1.5 rounded bg-red-500/80 text-white text-xs cursor-pointer border-none hover:bg-red-500 transition-colors">{t('common.delete')}</button>
                    </div>
                    {p.caption && <div className="p-2 text-xs text-zinc-400">{p.caption}</div>}
                  </div>
                ))}
                {photos.length === 0 && <div className="col-span-full text-center py-8 text-zinc-500 text-sm">No hay fotos aún</div>}
              </div>
            </div>
          </div>
        )}

        {/* Password confirmation modal */}
        {passwordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => { setPasswordModal(null); setConfirmPassword(''); setPasswordError('') }}>
            <div className="bg-zinc-900 border border-white/[0.1] rounded-xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-2">Confirmar contraseña</h3>
              <p className="text-sm text-zinc-400 mb-4">Ingresa tu contraseña para continuar con esta acción.</p>
              {passwordError && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 mb-4">{passwordError}</div>}
              <input type="password" placeholder="Tu contraseña" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30 mb-4" autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') { const pm = passwordModal; if (pm?.action === 'delete_user') handleDeleteUser(pm.id); else if (pm?.action === 'role') handleToggleRole(pm.id, pm.extra || 'user'); else if (pm?.action === 'delete_message') handleDeleteMessage(pm.id); else if (pm?.action === 'delete_order') handleDeleteOrder(pm.id); else if (pm?.action === 'delete_photo') handleDeletePhoto(pm.id); else if (pm?.action === 'delete_all_photos') handleDeleteAllPhotos(); else if (pm?.action === 'toggle_maintenance') handleToggleMaintenance(); else if (pm?.action === 'delete_blog_post') handleDeleteBlogPost(pm.id); else if (pm?.action === 'delete_testimonial') handleDeleteTestimonial(pm.id); else if (pm?.action === 'delete_faq') handleDeleteFaq(pm.id); else if (pm?.action === 'delete_product') handleDeleteProduct(pm.id) } }} />
              <div className="flex gap-3">
                <button onClick={() => { const pm = passwordModal; if (pm?.action === 'delete_user') handleDeleteUser(pm.id); else if (pm?.action === 'role') handleToggleRole(pm.id, pm.extra || 'user'); else if (pm?.action === 'delete_message') handleDeleteMessage(pm.id); else if (pm?.action === 'delete_order') handleDeleteOrder(pm.id); else if (pm?.action === 'delete_photo') handleDeletePhoto(pm.id); else if (pm?.action === 'delete_all_photos') handleDeleteAllPhotos(); else if (pm?.action === 'toggle_maintenance') handleToggleMaintenance(); else if (pm?.action === 'delete_blog_post') handleDeleteBlogPost(pm.id); else if (pm?.action === 'delete_testimonial') handleDeleteTestimonial(pm.id); else if (pm?.action === 'delete_faq') handleDeleteFaq(pm.id); else if (pm?.action === 'delete_product') handleDeleteProduct(pm.id) }}
                  disabled={!confirmPassword || userActionLoading !== null}
                  className="flex-1 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50 cursor-pointer border-none">
                  {userActionLoading !== null ? 'Verificando...' : t('common.confirm')}
                </button>
                <button onClick={() => { setPasswordModal(null); setConfirmPassword(''); setPasswordError('') }}
                  className="px-4 py-2.5 rounded-lg border border-white/[0.1] text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer bg-transparent">{t('common.cancel')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
