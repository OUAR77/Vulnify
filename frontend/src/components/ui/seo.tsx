import { Helmet } from "react-helmet-async"
import { useTranslation } from 'react-i18next'

interface SEOProps {
  title?: string
  description?: string
  image?: string
}

const SITE = "https://vulnify.es"

export function SEO({ title, description, image }: SEOProps) {
  const { t } = useTranslation()
  const defaultTitle = t('seo.default_title')
  const defaultDescription = t('seo.default_description')
  const fullTitle = title ? `${title} · Vulnify` : defaultTitle
  const desc = description || defaultDescription

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={SITE} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      {image && <meta property="og:image" content={image} />}
      {image && <meta name="twitter:image" content={image} />}
    </Helmet>
  )
}
