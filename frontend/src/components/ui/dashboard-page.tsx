import { useAuth } from '@/lib/auth-context'
import { useNavigate } from 'react-router-dom'
import { User, LogOut, Mail, Calendar, ArrowLeft, ShieldAlert } from 'lucide-react'

export function DashboardPage() {
  const { user, logout, isAuthenticated, isAdmin } = useAuth()
  const navigate = useNavigate()

  if (!isAuthenticated) {
    navigate('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-3xl font-bold tracking-tight">Mi panel</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors bg-transparent border border-white/[0.06] rounded-lg px-4 py-2 cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              Volver a la web
            </button>
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors bg-transparent border border-blue-500/20 rounded-lg px-4 py-2 cursor-pointer"
              >
                <ShieldAlert className="size-4" />
                Panel Admin
              </button>
            )}
            <button
              onClick={() => { logout(); navigate('/') }}
              className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors bg-transparent border border-white/[0.06] rounded-lg px-4 py-2 cursor-pointer"
            >
              <LogOut className="size-4" />
              Cerrar sesión
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="size-14 rounded-full bg-zinc-800 flex items-center justify-center">
              <User className="size-6 text-zinc-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user?.name}</h2>
              <p className="text-sm text-zinc-500">{user?.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-zinc-500">
              <Mail className="size-4" />
              {user?.email}
            </div>
            <div className="flex items-center gap-2 text-zinc-500">
              <Calendar className="size-4" />
              Rol: {user?.role}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-6 text-center">
            <div className="text-3xl font-bold text-zinc-600 mb-1">0</div>
            <div className="text-xs text-zinc-600 uppercase tracking-wider">Proyectos</div>
          </div>
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-6 text-center">
            <div className="text-3xl font-bold text-zinc-600 mb-1">0</div>
            <div className="text-xs text-zinc-600 uppercase tracking-wider">Mensajes</div>
          </div>
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-6 text-center">
            <div className="text-3xl font-bold text-zinc-600 mb-1">-</div>
            <div className="text-xs text-zinc-600 uppercase tracking-wider">Pedido activo</div>
          </div>
        </div>
      </div>
    </div>
  )
}
