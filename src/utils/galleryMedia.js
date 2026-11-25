// Shared helpers for Dokumentasi & Galeri (YouTube/Instagram embed parsing, photo URL, client-side compression).

const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/
const INSTAGRAM_CODE_RE = /^[A-Za-z0-9_-]{5,40}$/

export const MAX_GALLERY_PHOTOS = 6
export const PHOTO_TARGET_BYTES = 520 * 1024

const API_BASE = String(
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
    'http://localhost:5000/api',
).replace(/\/+$/, '')

export function galleryPhotoSrc(photoId) {
  if (!photoId) return ''
  return `${API_BASE}/gallery/photos/${encodeURIComponent(photoId)}`
}

export function parseVideoUrl(rawUrl) {
  const trimmed = String(rawUrl || '').trim()
  if (!trimmed) return { ok: true, value: null }

  let url
  try {
    url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
  } catch {
    return { ok: false, error: 'Link video tidak valid. Gunakan link YouTube atau Instagram.' }
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    return { ok: false, error: 'Link video harus menggunakan https://.' }
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '')
  const segments = url.pathname.split('/').filter(Boolean)

  if (host === 'youtu.be' || host === 'youtube.com' || host === 'youtube-nocookie.com') {
    let videoId = ''
    let isShorts = false
    if (host === 'youtu.be') {
      videoId = segments[0] || ''
    } else if (segments[0] === 'watch') {
      videoId = url.searchParams.get('v') || ''
    } else if (segments[0] === 'shorts') {
      videoId = segments[1] || ''
      isShorts = true
    } else if (segments[0] === 'embed' || segments[0] === 'live') {
      videoId = segments[1] || ''
    }
    if (!YOUTUBE_ID_RE.test(videoId)) {
      return { ok: false, error: 'Link YouTube tidak dikenali. Contoh: https://youtu.be/... atau youtube.com/watch?v=...' }
    }
    return {
      ok: true,
      value: {
        platform: 'youtube',
        mediaKind: isShorts ? 'shorts' : 'video',
        id: videoId,
        aspect: isShorts ? 'portrait' : 'landscape',
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`,
        canonicalUrl: isShorts ? `https://www.youtube.com/shorts/${videoId}` : `https://youtu.be/${videoId}`,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        rawUrl: trimmed,
      },
    }
  }

  if (host === 'instagram.com' || host === 'instagr.am') {
    const kindIdx = segments.findIndex((s) => ['p', 'reel', 'reels', 'tv'].includes(s.toLowerCase()))
    if (kindIdx === -1 || kindIdx + 1 >= segments.length) {
      return { ok: false, error: 'Link Instagram harus berupa postingan (/p/...) atau Reel (/reel/...).' }
    }
    const rawKind = segments[kindIdx].toLowerCase()
    const mediaKind = rawKind === 'reels' ? 'reel' : rawKind
    const code = segments[kindIdx + 1]
    if (!INSTAGRAM_CODE_RE.test(code)) {
      return { ok: false, error: 'Kode postingan/Reel Instagram tidak valid.' }
    }
    return {
      ok: true,
      value: {
        platform: 'instagram',
        mediaKind,
        id: code,
        aspect: mediaKind === 'reel' ? 'portrait' : 'square',
        embedUrl: `https://www.instagram.com/${mediaKind}/${code}/embed/`,
        canonicalUrl: `https://www.instagram.com/${mediaKind}/${code}/`,
        thumbnailUrl: null,
        rawUrl: trimmed,
      },
    }
  }

  return { ok: false, error: 'Hanya mendukung link video dari YouTube atau Instagram (post / Reel).' }
}

const MONTHS_SHORT_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

export function formatMomentDate(iso) {
  const s = String(iso || '').trim()
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return s
  const year = m[1]
  const month = MONTHS_SHORT_ID[Number(m[2]) - 1]
  const day = Number(m[3])
  return month ? `${day} ${month} ${year}` : s
}

export function videoPlatformLabel(video) {
  if (!video) return ''
  if (video.platform === 'youtube') {
    return video.mediaKind === 'shorts' ? 'YouTube Shorts' : 'Video YouTube'
  }
  if (video.platform === 'instagram') {
    return video.mediaKind === 'reel' ? 'Reel Instagram' : 'Post Instagram'
  }
  return 'Video'
}

function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('File gambar tidak bisa dibaca.'))
    }
    img.src = url
  })
}

export async function compressGalleryPhoto(file) {
  if (!file || !String(file.type || '').startsWith('image/')) {
    throw new Error('Pilih file foto (JPG, PNG, atau WEBP).')
  }
  const img = await loadImageElement(file)
  const steps = [
    [1400, 0.82],
    [1200, 0.74],
    [1024, 0.66],
    [860, 0.58],
  ]

  let lastResult = null
  for (const [maxSide, quality] of steps) {
    const scale = Math.min(1, maxSide / Math.max(img.width || 1, img.height || 1))
    const width = Math.max(1, Math.round(img.width * scale))
    const height = Math.max(1, Math.round(img.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, width, height)

    // Prefer WebP when supported; fall back to JPEG cleanly
    let dataUrl = canvas.toDataURL('image/webp', quality)
    let contentType = 'image/webp'
    if (!dataUrl.startsWith('data:image/webp')) {
      dataUrl = canvas.toDataURL('image/jpeg', quality)
      contentType = 'image/jpeg'
    }
    const approxBytes = Math.round((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75)
    lastResult = { dataBase64: dataUrl, contentType, width, height, sizeBytes: approxBytes }
    if (approxBytes <= PHOTO_TARGET_BYTES) return lastResult
  }

  return lastResult
}
