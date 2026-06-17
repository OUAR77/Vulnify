import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SiteLayout } from '@/components/ui/site-layout'
import { FloatingPathsEffect, HomeContent } from '@/components/ui/home-content'
import { BlogPage, PrivacidadPage, TerminosPage, CookiesPage, CasosExitoPage, ServicioPage } from '@/pages/pages'
import { LoginPage, RegisterPage } from '@/pages/auth'
import { ForgotPasswordPage } from '@/pages/forgot-password'
import { ResetPasswordPage } from '@/pages/reset-password'
import { DashboardPage } from '@/components/ui/dashboard-page'
import { AdminPage } from '@/components/ui/admin-page'
import { VerifyEmailPage } from '@/components/ui/verify-email-page'
import { NotFound } from '@/components/ui/not-found-2'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { AuthProvider } from '@/lib/auth-context'

function HomePage() {
  return (
    <>
      <FloatingPathsEffect />
      <div className="relative z-10">
        <HomeContent />
      </div>
    </>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route element={<SiteLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/privacidad" element={<PrivacidadPage />} />
              <Route path="/terminos" element={<TerminosPage />} />
              <Route path="/cookies" element={<CookiesPage />} />
              <Route path="/casos-de-exito" element={<CasosExitoPage />} />
              <Route path="/contacto" element={<HomePage />} />
              <Route path="/servicios/:slug" element={<ServicioPage />} />
              <Route path="/sobre-nosotros" element={<HomePage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
