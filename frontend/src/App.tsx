import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SiteLayout } from '@/components/ui/site-layout'
import { FloatingPathsEffect, HomeContent } from '@/components/ui/home-content'
import { BlogPage, PrivacidadPage, TerminosPage, CookiesPage, CasosExitoPage, ServicioPage } from '@/pages/pages'
import { SEO } from '@/components/ui/seo'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { AuthProvider } from '@/lib/auth-context'
import { HelmetProvider } from 'react-helmet-async'
import '@/lib/i18n'



const PortfolioPage = lazy(() => import('@/pages/portfolio').then(m => ({ default: m.PortfolioPage })))
const LoginPage = lazy(() => import('@/pages/auth').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/pages/auth').then(m => ({ default: m.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('@/pages/forgot-password').then(m => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('@/pages/reset-password').then(m => ({ default: m.ResetPasswordPage })))
const DashboardPage = lazy(() => import('@/components/ui/dashboard-page').then(m => ({ default: m.DashboardPage })))
const AdminPage = lazy(() => import('@/components/ui/admin-page').then(m => ({ default: m.AdminPage })))
const VerifyEmailPage = lazy(() => import('@/components/ui/verify-email-page').then(m => ({ default: m.VerifyEmailPage })))
const NotFound = lazy(() => import('@/components/ui/not-found-2').then(m => ({ default: m.NotFound })))
const BlogDetailPage = lazy(() => import('@/components/ui/blog-detail').then(m => ({ default: m.BlogDetailPage })))
const DemoExtractProperty = lazy(() => import('@/components/ui/demo-extract-property').then(m => ({ default: m.DemoExtractProperty })))
const ProductsPage = lazy(() => import('@/components/ui/products-page').then(m => ({ default: m.ProductsPage })))
const ProductDetailPage = lazy(() => import('@/components/ui/product-detail-page').then(m => ({ default: m.ProductDetailPage })))
const ProductAccessPage = lazy(() => import('@/components/ui/product-access-page').then(m => ({ default: m.ProductAccessPage })))
const CheckoutSuccessPage = lazy(() => import('@/components/ui/checkout-success-page').then(m => ({ default: m.CheckoutSuccessPage })))

function HomePage() {
  return (
    <>
      <SEO />
      <FloatingPathsEffect />
      <div className="relative z-10">
        <HomeContent />
      </div>
    </>
  )
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="min-h-screen bg-black" />}>{children}</Suspense>
}

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<SuspenseWrapper><LoginPage /></SuspenseWrapper>} />
            <Route path="/register" element={<SuspenseWrapper><RegisterPage /></SuspenseWrapper>} />
            <Route path="/forgot-password" element={<SuspenseWrapper><ForgotPasswordPage /></SuspenseWrapper>} />
            <Route path="/reset-password" element={<SuspenseWrapper><ResetPasswordPage /></SuspenseWrapper>} />
            <Route path="/verify-email" element={<SuspenseWrapper><VerifyEmailPage /></SuspenseWrapper>} />
            <Route path="/dashboard" element={<SuspenseWrapper><DashboardPage /></SuspenseWrapper>} />
            <Route path="/admin" element={<SuspenseWrapper><AdminPage /></SuspenseWrapper>} />
            <Route element={<SiteLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<SuspenseWrapper><BlogDetailPage /></SuspenseWrapper>} />
              <Route path="/privacidad" element={<PrivacidadPage />} />
              <Route path="/terminos" element={<TerminosPage />} />
              <Route path="/cookies" element={<CookiesPage />} />
              <Route path="/casos-de-exito" element={<SuspenseWrapper><CasosExitoPage /></SuspenseWrapper>} />
              <Route path="/contacto" element={<HomePage />} />
              <Route path="/servicios/:slug" element={<ServicioPage />} />
               <Route path="/sobre-nosotros" element={<HomePage />} />
               <Route path="/portfolio" element={<SuspenseWrapper><PortfolioPage /></SuspenseWrapper>} />
               <Route path="/productos" element={<SuspenseWrapper><ProductsPage /></SuspenseWrapper>} />
               <Route path="/productos/:slug" element={<SuspenseWrapper><ProductDetailPage /></SuspenseWrapper>} />
               <Route path="/demo/extraer-propiedad" element={<SuspenseWrapper><DemoExtractProperty /></SuspenseWrapper>} />
            </Route>
            <Route path="/checkout/success" element={<SuspenseWrapper><CheckoutSuccessPage /></SuspenseWrapper>} />
            <Route path="/acceso/:token" element={<SuspenseWrapper><ProductAccessPage /></SuspenseWrapper>} />
            <Route path="*" element={<SuspenseWrapper><NotFound /></SuspenseWrapper>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      </HelmetProvider>
    </ErrorBoundary>
  )
}

export default App
