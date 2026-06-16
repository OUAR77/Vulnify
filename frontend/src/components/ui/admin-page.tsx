import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useNavigate } from 'react-router-dom'
import {
  adminGetStats, adminGetUsers, adminDeleteUser, adminChangeRole,
  adminGetActivityLogs, adminGetActivityActions,
  type AdminStats, type AdminUser, type ActivityLog,
} from '@/lib/api'
import { Users, ShieldAlert, Activity, Search, Trash2, ArrowLeft, LogOut, LayoutDashboard, RefreshCw } from 'lucide-react'

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

  const [tab, setTab] = useState<'stats' | 'users' | 'logs'>('stats')

  const loadStats = useCallback(async () => {
    try {
      setStatsError('')
      const data = await adminGetStats()
      setStats(data)
    } catch (e: any) {
      setStatsError(e.message)
    }
  }, [])

  const loadUsers = useCallback(async (page: number, search?: string) => {
    try {
      setUsersError('')
      const data = await adminGetUsers(page, search)
      setUsers(data.items)
      setUsersTotal(data.total)
      setUsersPage(data.page)
    } catch (e: any) {
      setUsersError(e.message)
    }
  }, [])

  const loadLogs = useCallback(async (page: number, action?: string) => {
    try {
      const data = await adminGetActivityLogs(page, action || undefined)
      setLogs(data.items)
      setLogsTotal(data.total)
      setLogsPage(data.page)
    } catch { /* ignore */ }
  }, [])

  const loadLogActions = useCallback(async () => {
    try {
      const data = await adminGetActivityActions()
      setLogActions(data)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return }
    if (!isAdmin) { navigate('/dashboard'); return }
    loadStats()
    loadUsers(1)
    loadLogs(1)
    loadLogActions()
  }, [isAuthenticated, isAdmin])

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('¿Seguro que quieres eliminar este usuario?')) return
    setUserActionLoading(userId)
    try {
      await adminDeleteUser(userId)
      loadUsers(usersPage, searchQuery || undefined)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setUserActionLoading(null)
    }
  }

  const handleToggleRole = async (userId: number, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    setUserActionLoading(userId)
    try {
      await adminChangeRole(userId, newRole)
      loadUsers(usersPage, searchQuery || undefined)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setUserActionLoading(null)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadUsers(1, searchQuery || undefined)
  }

  const handleRefresh = () => {
    loadStats()
    loadUsers(usersPage, searchQuery || undefined)
    loadLogs(logsPage, logFilterAction || undefined)
  }

  const pages = Math.ceil(usersTotal / 50)

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ShieldAlert className="size-7 text-zinc-500" />
            <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleRefresh} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors bg-transparent border border-white/[0.06] rounded-lg px-4 py-2 cursor-pointer">
              <RefreshCw className="size-4" />
              Recargar
            </button>
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors bg-transparent border border-white/[0.06] rounded-lg px-4 py-2 cursor-pointer">
              <LayoutDashboard className="size-4" />
              Mi panel
            </button>
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors bg-transparent border border-white/[0.06] rounded-lg px-4 py-2 cursor-pointer">
              <ArrowLeft className="size-4" />
              Volver a la web
            </button>
            <button onClick={() => { logout(); navigate('/') }} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors bg-transparent border border-white/[0.06] rounded-lg px-4 py-2 cursor-pointer">
              <LogOut className="size-4" />
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-white/[0.06]">
          {([['stats', 'Estadísticas'], ['users', 'Usuarios'], ['logs', 'Actividad']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} className={`px-5 py-3 text-sm transition-colors cursor-pointer bg-transparent border-none ${tab === key ? 'text-white border-b border-white font-medium' : 'text-zinc-500 hover:text-white'}`}>
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
                { label: 'Activos monitoreados', value: stats?.total_assets ?? '-', icon: ShieldAlert },
                { label: 'Alertas', value: stats?.total_alerts ?? '-', icon: Activity },
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
            {stats && (
              <div className="mt-6 rounded-xl bg-white/[0.02] border border-white/[0.06] p-6">
                <h3 className="text-sm text-zinc-500 mb-3">Activos por tipo</h3>
                <div className="flex gap-8 text-sm">
                  <span>Dominios: <strong>{stats.assets_by_type.domain}</strong></span>
                  <span>Emails: <strong>{stats.assets_by_type.email}</strong></span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div>
            <form onSubmit={handleSearch} className="flex gap-3 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/30"
                />
              </div>
              <button type="submit" className="px-4 py-2 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition-colors cursor-pointer border-none text-white">Buscar</button>
            </form>

            {usersError && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 mb-4">{usersError}</div>}

            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
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
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-500/20 text-zinc-400'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {u.is_verified ? <span className="text-green-400">Sí</span> : <span className="text-zinc-500">No</span>}
                      </td>
                      <td className="py-3 px-4 text-zinc-500 text-xs">{u.created_at?.slice(0, 10)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleRole(u.id, u.role)}
                            disabled={userActionLoading === u.id}
                            className="text-xs px-2 py-1 rounded border border-white/[0.1] text-zinc-400 hover:text-white hover:border-white/30 transition-colors disabled:opacity-50 cursor-pointer bg-transparent"
                          >
                            {u.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                          </button>
                          {u.id !== user?.id && (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              disabled={userActionLoading === u.id}
                              className="text-xs px-2 py-1 rounded border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 cursor-pointer bg-transparent"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && !usersError && (
                    <tr><td colSpan={7} className="py-8 text-center text-zinc-500">Sin resultados</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: Math.min(pages, 10) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => loadUsers(p, searchQuery || undefined)}
                    className={`w-8 h-8 text-xs rounded transition-colors cursor-pointer border-none ${usersPage === p ? 'bg-white/20 text-white' : 'bg-white/5 text-zinc-500 hover:bg-white/10'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Activity Logs Tab */}
        {tab === 'logs' && (
          <div>
            <div className="flex gap-3 mb-6 flex-wrap">
              <select
                value={logFilterAction}
                onChange={(e) => { setLogFilterAction(e.target.value); loadLogs(1, e.target.value || undefined) }}
                className="bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-white/30"
              >
                <option value="">Todas las acciones</option>
                {logActions.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <span className="text-sm text-zinc-500 self-center">{logsTotal} registros</span>
            </div>

            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
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
                  {logs.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-zinc-500">Sin registros</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {logsTotal > 50 && (
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: Math.min(Math.ceil(logsTotal / 50), 10) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => loadLogs(p, logFilterAction || undefined)}
                    className={`w-8 h-8 text-xs rounded transition-colors cursor-pointer border-none ${logsPage === p ? 'bg-white/20 text-white' : 'bg-white/5 text-zinc-500 hover:bg-white/10'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
