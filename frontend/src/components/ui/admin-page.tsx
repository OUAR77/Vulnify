import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useNavigate } from 'react-router-dom'
import {
  adminGetStats, adminGetUsers, adminDeleteUser, adminChangeRole,
  adminGetActivityLogs, adminGetActivityActions,
  adminGetMessages, adminMarkMessageRead, adminDeleteMessage,
  adminGetOrders, adminCreateOrder, adminUpdateOrder, adminDeleteOrder,
  downloadAdminCSV,
  type AdminStats, type AdminUser, type ActivityLog,
  type ContactMessage, type Order,
} from '@/lib/api'
import {
  Users, ShieldAlert, Activity, Search, Trash2, ArrowLeft, LogOut,
  LayoutDashboard, RefreshCw, Plus, MessageSquare, ShoppingCart,
} from 'lucide-react'

export function AdminPage() {
  const { user, isAdmin, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

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

  const [tab, setTab] = useState<'stats' | 'users' | 'logs' | 'messages' | 'orders'>('stats')

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

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return }
    if (!isAdmin) { navigate('/dashboard'); return }
    loadStats(); loadUsers(1); loadLogs(1); loadLogActions(); loadMessages(1); loadOrders(1)
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

  const pages = Math.ceil(usersTotal / 50)
  const messagesPages = Math.ceil(messagesTotal / 50)
  const ordersPages = Math.ceil(ordersTotal / 50)

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ShieldAlert className="size-7 text-zinc-500" />
            <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <button onClick={handleRefresh} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors bg-transparent border border-white/[0.06] rounded-lg px-4 py-2 cursor-pointer">
              <RefreshCw className="size-4" /> Recargar
            </button>
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors bg-transparent border border-white/[0.06] rounded-lg px-4 py-2 cursor-pointer">
              <LayoutDashboard className="size-4" /> Mi panel
            </button>
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors bg-transparent border border-white/[0.06] rounded-lg px-4 py-2 cursor-pointer">
              <ArrowLeft className="size-4" /> Volver a la web
            </button>
            <button onClick={() => { logout(); navigate('/') }} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors bg-transparent border border-white/[0.06] rounded-lg px-4 py-2 cursor-pointer">
              <LogOut className="size-4" /> Cerrar sesión
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-white/[0.06] overflow-x-auto">
          {([
            ['stats', 'Estadísticas'],
            ['users', 'Usuarios'],
            ['messages', 'Mensajes'],
            ['orders', 'Pedidos'],
            ['logs', 'Actividad'],
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
                { label: 'Usuarios', value: stats?.total_users ?? '-', icon: Users },
                { label: 'Mensajes', value: stats?.total_messages ?? '-', icon: MessageSquare },
                { label: 'Pedidos', value: stats?.total_orders ?? '-', icon: ShoppingCart },
                { label: 'Registros de actividad', value: stats?.total_logs ?? '-', icon: Activity },
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
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div>
            <form onSubmit={handleSearch} className="flex gap-3 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                <input type="text" placeholder="Buscar por nombre o email..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" />
              </div>
              <button type="submit" className="px-4 py-2 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition-colors cursor-pointer border-none text-white">Buscar</button>
            </form>
            {usersError && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 mb-4">{usersError}</div>}
            <div className="rounded-xl border border-white/[0.06] overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">ID</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">Nombre</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">Email</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">Rol</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">Verificado</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">Creado</th>
                    <th className="text-right py-3 px-4 text-zinc-500 font-medium">Acciones</th>
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
                      <td className="py-3 px-4">{u.is_verified ? <span className="text-green-400">Sí</span> : <span className="text-zinc-500">No</span>}</td>
                      <td className="py-3 px-4 text-zinc-500 text-xs">{u.created_at?.slice(0, 10)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setPasswordModal({ action: 'role', id: u.id, extra: u.role })} disabled={userActionLoading === u.id}
                            className="text-xs px-2 py-1 rounded border border-white/[0.1] text-zinc-400 hover:text-white hover:border-white/30 transition-colors disabled:opacity-50 cursor-pointer bg-transparent">
                            {u.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
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
                  {users.length === 0 && !usersError && <tr><td colSpan={7} className="py-8 text-center text-zinc-500">Sin resultados</td></tr>}
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
                <span className="text-sm text-zinc-500">{messagesTotal} mensajes</span>
              </div>
              <button onClick={() => downloadAdminCSV('/api/admin/messages/export', 'messages.csv')}
                className="flex items-center gap-2 text-xs bg-white/5 rounded-lg px-3 py-1.5 hover:bg-white/10 transition-colors cursor-pointer border-none text-zinc-400 hover:text-white">
                CSV
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
                {messages.length === 0 && <div className="py-8 text-center text-zinc-500 text-sm">Sin mensajes</div>}
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
                        <a href={`mailto:${selectedMessage.email}`} className="text-xs px-3 py-1.5 rounded border border-white/[0.1] text-zinc-400 hover:text-white transition-colors no-underline">Responder</a>
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
                  <div className="text-center text-zinc-500 py-12 text-sm">Selecciona un mensaje para leerlo</div>
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
                <span className="text-sm text-zinc-500">{ordersTotal} pedidos</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => downloadAdminCSV('/api/admin/orders/export', 'orders.csv')}
                  className="flex items-center gap-2 text-xs bg-white/5 rounded-lg px-3 py-1.5 hover:bg-white/10 transition-colors cursor-pointer border-none text-zinc-400 hover:text-white">
                  CSV
                </button>
                <button onClick={() => { setEditingOrder(null); setOrderForm({ client_name: '', client_email: '', service: '', description: '', amount: 0, status: 'pending' }); setShowOrderForm(true) }}
                  className="flex items-center gap-2 text-sm bg-white/10 rounded-lg px-4 py-2 hover:bg-white/20 transition-colors cursor-pointer border-none text-white">
                  <Plus className="size-4" /> Nuevo pedido
                </button>
            </div>
          </div>

            {showOrderForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowOrderForm(false)}>
                <div className="bg-zinc-900 border border-white/[0.1] rounded-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-lg font-semibold mb-4">{editingOrder ? 'Editar pedido' : 'Nuevo pedido'}</h3>
                  <form onSubmit={handleOrderSubmit} className="space-y-4">
                    <input placeholder="Nombre del cliente" value={orderForm.client_name}
                      onChange={(e) => setOrderForm({ ...orderForm, client_name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" required />
                    <input type="email" placeholder="Email del cliente" value={orderForm.client_email}
                      onChange={(e) => setOrderForm({ ...orderForm, client_email: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" required />
                    <input placeholder="Servicio (ej: Escaneo Web, Pentest...)" value={orderForm.service}
                      onChange={(e) => setOrderForm({ ...orderForm, service: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" required />
                    <textarea placeholder="Descripción" value={orderForm.description}
                      onChange={(e) => setOrderForm({ ...orderForm, description: e.target.value })} rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30" />
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-xs text-zinc-500 mb-1 block">Monto (€)</label>
                        <input type="number" step="0.01" value={orderForm.amount}
                          onChange={(e) => setOrderForm({ ...orderForm, amount: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-zinc-500 mb-1 block">Estado</label>
                        <select value={orderForm.status}
                          onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30">
                          <option value="pending">Pendiente</option>
                          <option value="in_progress">En progreso</option>
                          <option value="completed">Completado</option>
                          <option value="cancelled">Cancelado</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="submit" className="flex-1 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors cursor-pointer border-none">
                        {editingOrder ? 'Guardar' : 'Crear pedido'}
                      </button>
                      <button type="button" onClick={() => setShowOrderForm(false)}
                        className="px-4 py-2.5 rounded-lg border border-white/[0.1] text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer bg-transparent">
                        Cancelar
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
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">ID</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">Cliente</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">Email</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">Servicio</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">Monto</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">Estado</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">Fecha</th>
                    <th className="text-right py-3 px-4 text-zinc-500 font-medium">Acciones</th>
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
                          {o.status === 'pending' ? 'Pendiente' :
                           o.status === 'in_progress' ? 'En progreso' :
                           o.status === 'completed' ? 'Completado' :
                           o.status === 'cancelled' ? 'Cancelado' : o.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-500 text-xs">{o.created_at?.slice(0, 10)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEditOrder(o)}
                            className="text-xs px-2 py-1 rounded border border-white/[0.1] text-zinc-400 hover:text-white hover:border-white/30 transition-colors cursor-pointer bg-transparent">Editar</button>
                          <button onClick={() => setPasswordModal({ action: 'delete_order', id: o.id })}
                            className="text-xs px-2 py-1 rounded border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer bg-transparent">
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-zinc-500">Sin pedidos</td></tr>}
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
              <span className="text-sm text-zinc-500 self-center">{logsTotal} registros</span>
            </div>
            <div className="rounded-xl border border-white/[0.06] overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">ID</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">Usuario</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">Acción</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">IP</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">Detalles</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">Fecha</th>
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
                onKeyDown={(e) => { if (e.key === 'Enter') { const pm = passwordModal; if (pm?.action === 'delete_user') handleDeleteUser(pm.id); else if (pm?.action === 'role') handleToggleRole(pm.id, pm.extra || 'user'); else if (pm?.action === 'delete_message') handleDeleteMessage(pm.id); else if (pm?.action === 'delete_order') handleDeleteOrder(pm.id) } }} />
              <div className="flex gap-3">
                <button onClick={() => { const pm = passwordModal; if (pm?.action === 'delete_user') handleDeleteUser(pm.id); else if (pm?.action === 'role') handleToggleRole(pm.id, pm.extra || 'user'); else if (pm?.action === 'delete_message') handleDeleteMessage(pm.id); else if (pm?.action === 'delete_order') handleDeleteOrder(pm.id) }}
                  disabled={!confirmPassword || userActionLoading !== null}
                  className="flex-1 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50 cursor-pointer border-none">
                  {userActionLoading !== null ? 'Verificando...' : 'Confirmar'}
                </button>
                <button onClick={() => { setPasswordModal(null); setConfirmPassword(''); setPasswordError('') }}
                  className="px-4 py-2.5 rounded-lg border border-white/[0.1] text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer bg-transparent">Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
