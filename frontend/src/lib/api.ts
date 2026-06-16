const BASE = import.meta.env.VITE_API_URL || ''

export interface User {
  id: number
  name: string
  email: string
  role: string
  verified?: boolean
  totp_enabled?: boolean
}

export interface AuthResponse {
  token: string
  refresh_token: string
  user: User
}

export interface TotpRequiredResponse {
  totp_required: true
  user_id: number
  message: string
}

function getToken(): string | null {
  return localStorage.getItem('vulnify_token')
}

export function setToken(token: string) {
  localStorage.setItem('vulnify_token', token)
}

export function setRefreshToken(token: string) {
  localStorage.setItem('vulnify_refresh', token)
}

export function setUser(user: User) {
  localStorage.setItem('vulnify_user', JSON.stringify(user))
}

export function getStoredUser(): User | null {
  try {
    const u = localStorage.getItem('vulnify_user')
    return u ? JSON.parse(u) : null
  } catch {
    return null
  }
}

export function clearAuth() {
  localStorage.removeItem('vulnify_token')
  localStorage.removeItem('vulnify_refresh')
  localStorage.removeItem('vulnify_user')
}

export async function apiDelete<T>(path: string): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error de conexión' }))
    throw new Error(err.detail || `Error ${res.status}`)
  }
  return res.json()
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error de conexión' }))
    throw new Error(err.detail || `Error ${res.status}`)
  }
  return res.json()
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error de conexión' }))
    throw new Error(err.detail || `Error ${res.status}`)
  }
  return res.json()
}

export async function apiGet<T>(path: string): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error de conexión' }))
    throw new Error(err.detail || `Error ${res.status}`)
  }
  return res.json()
}

export async function login(email: string, password: string): Promise<AuthResponse | TotpRequiredResponse> {
  return apiPost<AuthResponse | TotpRequiredResponse>('/api/auth/login', { email, password })
}

export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/api/auth/register', { name, email, password })
}

// TOTP / 2FA
export interface TotpSetupResponse {
  secret: string
  qr_b64: string
}

export async function totpSetup(): Promise<TotpSetupResponse> {
  return apiPost<TotpSetupResponse>('/api/auth/totp/setup', {})
}

export async function totpEnable(code: string): Promise<{ ok: boolean; message: string }> {
  return apiPost<{ ok: boolean; message: string }>('/api/auth/totp/enable', { code })
}

export async function totpDisable(code: string): Promise<{ ok: boolean; message: string }> {
  return apiPost<{ ok: boolean; message: string }>('/api/auth/totp/disable', { code })
}

export async function totpVerifyLogin(userId: number, code: string): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/api/auth/totp/verify-login', { user_id: userId, code })
}

export async function adminVerifyPassword(): Promise<{ ok: boolean }> {
  return apiPost<{ ok: boolean }>('/api/admin/verify-password', {})}

export async function getMe(): Promise<User> {
  return apiGet<User>('/api/auth/me')
}

// Admin API
export interface AdminUser {
  id: number
  name: string
  email: string
  role: string
  is_verified: boolean
  totp_enabled: boolean
  created_at: string
}

export interface AdminStats {
  total_users: number
  total_assets: number
  total_alerts: number
  total_logs: number
  assets_by_type: { domain: number; email: number }
}

export interface AdminUsersResponse {
  total: number
  page: number
  per_page: number
  items: AdminUser[]
}

export interface ActivityLog {
  id: number
  user_id: number
  email: string
  action: string
  details: string | null
  ip_address: string | null
  created_at: string
}

export async function adminGetStats(): Promise<AdminStats> {
  return apiGet<AdminStats>('/api/admin/stats')
}

export async function adminGetUsers(page = 1, search?: string): Promise<AdminUsersResponse> {
  let path = `/api/admin/users?page=${page}&per_page=50`
  if (search) path += `&search=${encodeURIComponent(search)}`
  return apiGet<AdminUsersResponse>(path)
}

export async function adminDeleteUser(userId: number, password: string): Promise<{ ok: boolean }> {
  return apiDelete<{ ok: boolean }>(`/api/admin/users/${userId}?password=${encodeURIComponent(password)}`)
}

export async function adminChangeRole(userId: number, role: string, password: string): Promise<{ ok: boolean }> {
  return apiPut<{ ok: boolean }>(`/api/admin/users/${userId}/role?role=${encodeURIComponent(role)}&password=${encodeURIComponent(password)}`, {})
}

export async function adminGetActivityLogs(page = 1, action?: string): Promise<{ total: number; page: number; per_page: number; items: ActivityLog[] }> {
  let path = `/api/admin/activity-logs?page=${page}&per_page=50`
  if (action) path += `&action=${encodeURIComponent(action)}`
  return apiGet(path)
}

export async function adminGetActivityActions(): Promise<string[]> {
  return apiGet<string[]>('/api/admin/activity-actions')
}

// Messages
export interface ContactMessage {
  id: number
  name: string
  email: string
  company: string
  subject: string
  message: string
  read: boolean
  created_at: string
}

export async function adminGetMessages(page = 1): Promise<{ total: number; page: number; per_page: number; items: ContactMessage[] }> {
  return apiGet(`/api/admin/messages?page=${page}&per_page=50`)
}

export async function adminMarkMessageRead(messageId: number): Promise<{ ok: boolean }> {
  return apiPut<{ ok: boolean }>(`/api/admin/messages/${messageId}/read`, {})
}

export async function adminDeleteMessage(messageId: number, password: string): Promise<{ ok: boolean }> {
  return apiDelete<{ ok: boolean }>(`/api/admin/messages/${messageId}?password=${encodeURIComponent(password)}`)
}

// Orders
export interface Order {
  id: number
  client_name: string
  client_email: string
  description: string
  service: string
  amount: number
  status: string
  created_at: string
}

export async function adminGetOrders(page = 1): Promise<{ total: number; page: number; per_page: number; items: Order[] }> {
  return apiGet(`/api/admin/orders?page=${page}&per_page=50`)
}

export async function adminCreateOrder(data: { client_name: string; client_email: string; description?: string; service: string; amount?: number; status?: string }): Promise<Order> {
  return apiPost<Order>('/api/admin/orders', data)
}

export async function adminUpdateOrder(orderId: number, data: Partial<{ client_name: string; client_email: string; description: string; service: string; amount: number; status: string }>): Promise<{ ok: boolean }> {
  return apiPut<{ ok: boolean }>(`/api/admin/orders/${orderId}`, data)
}

export async function adminDeleteOrder(orderId: number, password: string): Promise<{ ok: boolean }> {
  return apiDelete<{ ok: boolean }>(`/api/admin/orders/${orderId}?password=${encodeURIComponent(password)}`)
}

export async function apiForgotPassword(email: string): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${BASE}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) throw new Error('Error al solicitar restablecimiento')
  return res.json()
}

export async function apiResetPassword(token: string, password: string): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch(`${BASE}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  })
  if (!res.ok) throw new Error('Error al restablecer la contraseña')
  return res.json()
}
