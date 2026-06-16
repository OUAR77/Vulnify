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
