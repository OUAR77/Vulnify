import './App.css'
import { BrowserRouter, Routes, Route, useOutletContext } from 'react-router-dom'
import { SiteLayout } from '@/components/ui/site-layout'
import { FloatingPathsEffect, HomeContent } from '@/components/ui/home-content'
import { BlogPage, PrivacidadPage, TerminosPage, CookiesPage, CasosExitoPage, ServicioPage } from '@/pages/pages'
import { ErrorBoundary } from '@/components/ui/error-boundary'

function HomePage() {
  const { setAboutOpen } = useOutletContext<{ setAboutOpen: (v: boolean) => void }>()
  return (
    <>
      <FloatingPathsEffect />
      <div className="relative z-10">
        <HomeContent onAboutOpen={() => setAboutOpen(true)} />
      </div>
    </>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
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
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
