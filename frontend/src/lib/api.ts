const BASE = import.meta.env.VITE_API_URL || ''

export interface User {
  id: number
  name: string
  email: string
  role: string
  verified?: boolean
}

export interface AuthResponse {
  token: string
  refresh_token: string
  user: User
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

export async function login(email: string, password: string): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/api/auth/login', { email, password })
}

export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/api/auth/register', { name, email, password })
}

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

export async function adminDeleteUser(userId: number): Promise<{ ok: boolean }> {
  return apiDelete<{ ok: boolean }>(`/api/admin/users/${userId}`)
}

export async function adminChangeRole(userId: number, role: string): Promise<{ ok: boolean }> {
  return apiPut<{ ok: boolean }>(`/api/admin/users/${userId}/role?role=${encodeURIComponent(role)}`, {})
}

export async function adminGetActivityLogs(page = 1, action?: string): Promise<{ total: number; page: number; per_page: number; items: ActivityLog[] }> {
  let path = `/api/admin/activity-logs?page=${page}&per_page=50`
  if (action) path += `&action=${encodeURIComponent(action)}`
  return apiGet(path)
}

export async function adminGetActivityActions(): Promise<string[]> {
  return apiGet<string[]>('/api/admin/activity-actions')
}
