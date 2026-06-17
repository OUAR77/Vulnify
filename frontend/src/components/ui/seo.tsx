import { Helmet } from "react-helmet-async"

interface SEOProps {
  title?: string
  description?: string
}

const SITE = "https://vulnify.es"

export function SEO({ title, description }: SEOProps) {
  const fullTitle = title ? `${title} · Vulnify` : "Vulnify · Desarrollo Web & IA"
  const desc = description || "Creamos tu web con inteligencia artificial. Desarrollo web, integraciones IA, APIs y consultoría digital para empresas."

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={SITE} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>
  )
}
