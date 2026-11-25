// Lightweight per-route SEO metadata & JSON-LD manager for public pages (/dokumentasi, /dokumentasi/:slug).

export const SITE_URL = 'https://tpqamanahsawotratap.com'

export const DEFAULT_SEO = {
  title: 'TPQ Amanah | Taman Pendidikan Al-Quran Sidoarjo',
  description:
    "TPQ Amanah di Sawotratap, Sidoarjo: belajar Al-Qur'an metode At-Tartil 6 Jilid untuk anak usia 4 tahun sampai SMP. Sesi sore dan malam, Senin sampai Jumat.",
  canonicalUrl: `${SITE_URL}/`,
  image: `${SITE_URL}/og-image.png`,
  type: 'website',
}

function upsertMeta(attr, key, content) {
  if (typeof document === 'undefined' || !content) return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', String(content))
}

function upsertCanonical(href) {
  if (typeof document === 'undefined' || !href) return
  let link = document.head.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', String(href))
}

function upsertJsonLd(data) {
  if (typeof document === 'undefined') return
  const existing = document.head.querySelector('script[type="application/ld+json"][data-seo-ld="dynamic"]')
  if (!data) {
    existing?.remove()
    return
  }
  const el = existing || document.createElement('script')
  el.type = 'application/ld+json'
  el.setAttribute('data-seo-ld', 'dynamic')
  el.textContent = JSON.stringify(data)
  if (!existing) document.head.appendChild(el)
}

export function buildCanonicalUrl(path = '/') {
  const clean = String(path || '/').startsWith('/') ? String(path || '/') : `/${path}`
  return `${SITE_URL}${clean}`
}

export function applyPageSeo({
  title = DEFAULT_SEO.title,
  description = DEFAULT_SEO.description,
  canonicalPath = '/',
  image = DEFAULT_SEO.image,
  type = 'website',
  jsonLd = null,
} = {}) {
  if (typeof document === 'undefined') return () => {}

  const canonicalUrl = buildCanonicalUrl(canonicalPath)
  const resolvedImage = image || DEFAULT_SEO.image

  document.title = title
  upsertMeta('name', 'title', title)
  upsertMeta('name', 'description', description)
  upsertMeta('property', 'og:type', type)
  upsertMeta('property', 'og:title', title)
  upsertMeta('property', 'og:description', description)
  upsertMeta('property', 'og:url', canonicalUrl)
  upsertMeta('property', 'og:image', resolvedImage)
  upsertMeta('name', 'twitter:title', title)
  upsertMeta('name', 'twitter:description', description)
  upsertMeta('name', 'twitter:url', canonicalUrl)
  upsertMeta('name', 'twitter:image', resolvedImage)
  upsertCanonical(canonicalUrl)
  upsertJsonLd(jsonLd)

  return function restoreDefaultSeo() {
    if (typeof document === 'undefined') return
    document.title = DEFAULT_SEO.title
    upsertMeta('name', 'title', DEFAULT_SEO.title)
    upsertMeta('name', 'description', DEFAULT_SEO.description)
    upsertMeta('property', 'og:type', DEFAULT_SEO.type)
    upsertMeta('property', 'og:title', DEFAULT_SEO.title)
    upsertMeta('property', 'og:description', DEFAULT_SEO.description)
    upsertMeta('property', 'og:url', DEFAULT_SEO.canonicalUrl)
    upsertMeta('property', 'og:image', DEFAULT_SEO.image)
    upsertMeta('name', 'twitter:title', DEFAULT_SEO.title)
    upsertMeta('name', 'twitter:description', DEFAULT_SEO.description)
    upsertMeta('name', 'twitter:url', DEFAULT_SEO.canonicalUrl)
    upsertMeta('name', 'twitter:image', DEFAULT_SEO.image)
    upsertCanonical(DEFAULT_SEO.canonicalUrl)
    upsertJsonLd(null)
  }
}
