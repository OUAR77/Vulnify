const BASE = import.meta.env.VITE_API_URL || ''

export function openContactForm() {
  window.dispatchEvent(new CustomEvent('open-contact'))
}

export interface User {
  id: number
  name: string
  email: string
  role: string
  company?: string
  bio?: string
  avatar?: string
  is_verified?: boolean
  totp_enabled?: boolean
  dark_mode?: boolean
  created_at?: string
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
  const res: any = await apiPost('/api/auth/login', { email, password })
  if (res.totp_required) return res as TotpRequiredResponse
  return {
    token: res.token,
    refresh_token: res.refresh_token,
    user: { ...res.user, is_verified: res.user.verified ?? res.user.is_verified },
  }
}

export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  const res: any = await apiPost('/api/auth/register', { name, email, password })
  return {
    token: res.token,
    refresh_token: res.refresh_token,
    user: { ...res.user, is_verified: res.user.verified ?? res.user.is_verified },
  }
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
  total_messages: number
  total_orders: number
  total_logs: number
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
  user_id?: number | null
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

// Profile & Notifications
export interface ProfileBody {
  name?: string
  company?: string
  bio?: string
}

export async function updateProfile(data: ProfileBody): Promise<{ ok: boolean }> {
  return apiPut<{ ok: boolean }>('/api/auth/profile', data)
}

export async function getDarkMode(): Promise<{ dark_mode: boolean }> {
  return apiGet<{ dark_mode: boolean }>('/api/auth/dark-mode')
}

export async function setDarkMode(enabled: boolean): Promise<{ ok: boolean }> {
  return apiPut<{ ok: boolean }>('/api/auth/dark-mode', { dark_mode: enabled })
}

// Email verification
export async function sendVerification(): Promise<{ ok: boolean; message: string; sent: boolean }> {
  return apiPost<{ ok: boolean; message: string; sent: boolean }>('/api/auth/send-verification', {})
}

export async function verifyEmail(token: string): Promise<{ ok: boolean; message: string }> {
  return apiPost<{ ok: boolean; message: string }>('/api/auth/verify-email', { token })
}

// API Keys
export interface ApiKey {
  id: number
  name: string
  created_at: string
}

export async function getApiKeys(): Promise<ApiKey[]> {
  return apiGet<ApiKey[]>('/api/auth/api-keys')
}

export async function createApiKey(name: string): Promise<{ ok: boolean; key: string; name: string; id: number }> {
  return apiPost<{ ok: boolean; key: string; name: string; id: number }>('/api/auth/api-keys', { name })
}

export async function deleteApiKey(keyId: number): Promise<{ ok: boolean }> {
  return apiDelete<{ ok: boolean }>(`/api/auth/api-keys/${keyId}`)
}

// User orders
export async function getMyOrders(page = 1): Promise<{ total: number; page: number; per_page: number; items: Order[] }> {
  return apiGet(`/api/orders?page=${page}&per_page=20`)
}

export async function createMyOrder(data: { description?: string; service: string; amount?: number }): Promise<{ id: number; status: string; message: string }> {
  return apiPost('/api/orders', data)
}

// Admin CSV export
export async function downloadAdminCSV(path: string, filename: string): Promise<void> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (!res.ok) throw new Error('Error al descargar')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// Order Photos
export interface OrderPhoto {
  id: number
  image_data: string
  caption: string
  created_at: string
}

export async function adminGetOrderPhotos(orderId: number): Promise<OrderPhoto[]> {
  return apiGet<OrderPhoto[]>(`/api/admin/orders/${orderId}/photos`)
}

export async function getOrderPhotos(orderId: number): Promise<OrderPhoto[]> {
  return apiGet<OrderPhoto[]>(`/api/orders/${orderId}/photos`)
}

export async function adminUploadPhoto(orderId: number, file: File, caption: string): Promise<{ id: number; caption: string; created_at: string }> {
  const token = getToken()
  const fd = new FormData()
  fd.append('file', file)
  fd.append('caption', caption)
  const res = await fetch(`${BASE}/api/admin/orders/${orderId}/photos`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: fd,
  })
  if (!res.ok) {
    const text = await res.text()
    let detail = text
    try { detail = JSON.parse(text).detail || text } catch {}
    throw new Error(`Error ${res.status}: ${detail}`)
  }
  return res.json()
}

export async function adminDeletePhoto(orderId: number, photoId: number, password: string): Promise<{ ok: boolean }> {
  return apiDelete<{ ok: boolean }>(`/api/admin/orders/${orderId}/photos/${photoId}?password=${encodeURIComponent(password)}`)
}

export async function adminDeleteAllPhotos(orderId: number, password: string): Promise<{ ok: boolean; deleted: number }> {
  return apiDelete<{ ok: boolean; deleted: number }>(`/api/admin/orders/${orderId}/photos?password=${encodeURIComponent(password)}`)
}

export async function adminGetOrderTimeline(orderId: number): Promise<{ id: number; field: string; old_value: string; new_value: string; changed_by: string; created_at: string }[]> {
  return apiGet(`/api/admin/orders/${orderId}/timeline`)
}

export async function adminGetOrderInvoice(orderId: number): Promise<void> {
  const token = getToken()
  const res = await fetch(`${BASE}/api/admin/orders/${orderId}/invoice`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (!res.ok) throw new Error('Error al generar factura')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `invoice-${orderId}.pdf`; a.click()
  URL.revokeObjectURL(url)
}

// User timeline & invoice
export async function getOrderTimeline(orderId: number): Promise<{ id: number; field: string; old_value: string; new_value: string; changed_by: string; created_at: string }[]> {
  return apiGet(`/api/orders/${orderId}/timeline`)
}

export async function getOrderInvoice(orderId: number): Promise<void> {
  const token = getToken()
  const res = await fetch(`${BASE}/api/orders/${orderId}/invoice`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (!res.ok) throw new Error('Error al generar factura')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `invoice-${orderId}.pdf`; a.click()
  URL.revokeObjectURL(url)
}

// Avatar
export async function uploadAvatar(file: File): Promise<{ ok: boolean; avatar: string }> {
  const token = getToken()
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(`${BASE}/api/auth/avatar`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: fd,
  })
  if (!res.ok) { const e = await res.json().catch(() => ({ detail: 'Error' })); throw new Error(e.detail) }
  return res.json()
}

// Maintenance mode
export async function getMaintenance(): Promise<{ maintenance_mode: boolean }> {
  return apiGet('/api/admin/maintenance')
}

export async function setMaintenance(enabled: boolean, password: string): Promise<{ ok: boolean; maintenance_mode: boolean }> {
  return apiPut<{ ok: boolean; maintenance_mode: boolean }>(`/api/admin/maintenance?password=${encodeURIComponent(password)}`, { maintenance_mode: enabled })
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

export interface BlogPost {
  id: number; title: string; slug: string; tag: string
  excerpt: string; content: string; author: string
  read_time: string; published: boolean; created_at: string
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  const res = await fetch(`${BASE}/api/blog`)
  if (!res.ok) throw new Error('Error al cargar posts')
  return res.json()
}

export async function getBlogPost(slug: string): Promise<BlogPost> {
  const res = await fetch(`${BASE}/api/blog/${slug}`)
  if (!res.ok) throw new Error('Post no encontrado')
  return res.json()
}

export async function adminGetAllPosts(token: string): Promise<BlogPost[]> {
  const res = await fetch(`${BASE}/api/blog/admin/all`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Error al cargar posts')
  return res.json()
}

export async function adminCreatePost(token: string, data: Partial<BlogPost>): Promise<BlogPost> {
  const res = await fetch(`${BASE}/api/blog/admin`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al crear post')
  return res.json()
}

export async function adminUpdatePost(token: string, id: number, data: Partial<BlogPost>): Promise<BlogPost> {
  const res = await fetch(`${BASE}/api/blog/admin/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al actualizar post')
  return res.json()
}

export async function adminDeletePost(token: string, id: number): Promise<void> {
  const res = await fetch(`${BASE}/api/blog/admin/${id}`, {
    method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Error al eliminar post')
}

export interface TestimonialData {
  id: number; name: string; role: string; company: string
  content: string; avatar_url: string; rating: number; featured: boolean
}

export async function getTestimonials(featured?: boolean): Promise<TestimonialData[]> {
  const url = featured ? `${BASE}/api/testimonials` : `${BASE}/api/testimonials/all`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Error al cargar testimonios')
  return res.json()
}

export async function adminCreateTestimonial(token: string, data: Partial<TestimonialData>): Promise<TestimonialData> {
  const res = await fetch(`${BASE}/api/testimonials/admin`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al crear testimonio')
  return res.json()
}

export async function adminUpdateTestimonial(token: string, id: number, data: Partial<TestimonialData>): Promise<TestimonialData> {
  const res = await fetch(`${BASE}/api/testimonials/admin/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al actualizar testimonio')
  return res.json()
}

export async function adminDeleteTestimonial(token: string, id: number): Promise<void> {
  const res = await fetch(`${BASE}/api/testimonials/admin/${id}`, {
    method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Error al eliminar testimonio')
}

export interface FAQData {
  id: number; question: string; answer: string; category: string; order: number; published: boolean
}

export async function getFAQs(): Promise<FAQData[]> {
  const res = await fetch(`${BASE}/api/faqs`)
  if (!res.ok) throw new Error('Error al cargar FAQs')
  return res.json()
}

export async function adminCreateFAQ(token: string, data: Partial<FAQData>): Promise<FAQData> {
  const res = await fetch(`${BASE}/api/faqs/admin`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al crear FAQ')
  return res.json()
}

export async function adminUpdateFAQ(token: string, id: number, data: Partial<FAQData>): Promise<FAQData> {
  const res = await fetch(`${BASE}/api/faqs/admin/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al actualizar FAQ')
  return res.json()
}

export async function adminDeleteFAQ(token: string, id: number): Promise<void> {
  const res = await fetch(`${BASE}/api/faqs/admin/${id}`, {
    method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Error al eliminar FAQ')
}

export async function adminReorderFAQs(token: string, order: Record<number, number>): Promise<void> {
  const res = await fetch(`${BASE}/api/faqs/admin/reorder`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(order),
  })
  if (!res.ok) throw new Error('Error al reordenar FAQs')
}

// Products
export interface ProductData {
  id: number; name: string; slug: string; description: string
  price_one_time: number | null; price_monthly: number | null
  stripe_price_id_one_time?: string; stripe_price_id_monthly?: string
  file_url?: string; active?: boolean; created_at?: string
}

export interface PurchaseData {
  id: number; product_id: number; buyer_email: string; buyer_name: string
  amount: number | null; interval: string; token: string
  status: string; created_at: string; expires_at: string | null
}

export async function getProducts(): Promise<ProductData[]> {
  const res = await fetch(`${BASE}/api/products`)
  if (!res.ok) throw new Error('Error al cargar productos')
  return res.json()
}

export async function getProduct(slug: string): Promise<ProductData> {
  const res = await fetch(`${BASE}/api/products/${slug}`)
  if (!res.ok) throw new Error('Producto no encontrado')
  return res.json()
}

export async function productCheckout(data: { product_id: number; interval: string; buyer_email: string; buyer_name: string }): Promise<{ checkout_url: string | null; session_id?: string; token?: string; free?: boolean }> {
  return apiPost('/api/products/checkout', data)
}

export async function adminGetProducts(): Promise<ProductData[]> {
  return apiGet('/api/admin/products')
}

export async function adminCreateProduct(data: Partial<ProductData>): Promise<{ ok: boolean; id: number }> {
  return apiPost('/api/admin/products', data)
}

export async function adminUpdateProduct(id: number, data: Partial<ProductData>): Promise<{ ok: boolean }> {
  return apiPut(`/api/admin/products/${id}`, data)
}

export async function adminDeleteProduct(id: number): Promise<{ ok: boolean }> {
  return apiDelete(`/api/admin/products/${id}`)
}

export async function adminGetPurchases(): Promise<PurchaseData[]> {
  return apiGet('/api/admin/purchases')
}

export async function adminCreatePurchase(data: { product_id: number; buyer_email: string; buyer_name?: string; interval?: string; amount?: number; expires_in_days?: number }): Promise<{ ok: boolean; id: number; token: string }> {
  return apiPost('/api/admin/purchases', data)
}

export async function adminRegenerateToken(purchaseId: number): Promise<{ ok: boolean; token: string }> {
  return apiPost(`/api/admin/purchases/${purchaseId}/regenerate-token`, {})
}
