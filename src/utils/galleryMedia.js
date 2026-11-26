// Shared helpers for Dokumentasi & Galeri (YouTube/Instagram/Google Drive embed parsing, photo URL, client-side compression).

const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/
const INSTAGRAM_CODE_RE = /^[A-Za-z0-9_-]{5,40}$/
const GDRIVE_ID_RE = /^[A-Za-z0-9_-]{10,80}$/

export const MAX_UPLOADED_PHOTOS = 6
export const MAX_GALLERY_PHOTOS = MAX_UPLOADED_PHOTOS // alias for backward compatibility
export const PHOTO_TARGET_BYTES = 520 * 1024

export function momentVideosOf(moment) {
  if (!moment) return []
  if (Array.isArray(moment.videos) && moment.videos.length) {
    return moment.videos.filter((v) => v && v.embedUrl)
  }
  return moment.video && moment.video.embedUrl ? [moment.video] : []
}

// Pick balanced Masonry column count so desktop never shows awkward empty columns (e.g. 4 photos -> 2x2 full width)
export function chooseMasonryColumnCount(photoCount, isDesktop = true) {
  if (photoCount <= 1) return 1
  if (!isDesktop) return 2
  if (photoCount === 2 || photoCount === 4) return 2
  return 3
}

// True left-to-right balanced Masonry: fills the top row strictly left -> right first,
// then places remaining photos into whichever column is currently shortest (preserving natural aspect ratios).
export function distributeMasonryColumns(photos = [], colCount = 3, ratioMap = {}) {
  const safeCols = Math.max(1, Math.min(colCount, photos.length || 1))
  const cols = Array.from({ length: safeCols }, () => [])
  const heights = Array(safeCols).fill(0)

  photos.forEach((photo, idx) => {
    const key = photo?.id || idx
    const measured = ratioMap[key]
    const stored =
      photo?.width > 0 && photo?.height > 0 ? photo.height / photo.width : null
    const rawRatio = Number(measured || stored || 0.75)
    const ratio = Math.min(2.0, Math.max(0.45, Number.isFinite(rawRatio) ? rawRatio : 0.75))

    let targetCol = idx
    if (idx >= safeCols) {
      targetCol = 0
      for (let c = 1; c < safeCols; c++) {
        if (heights[c] < heights[targetCol] - 0.001) targetCol = c
      }
    }
    cols[targetCol].push({ photo, idx })
    heights[targetCol] += ratio + 0.06
  })

  return cols
}

const API_BASE = String(
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
    'http://localhost:5000/api',
).replace(/\/+$/, '')

// Resize Google Drive thumbnail URLs to match their rendered slot (w320 thumbs, w800 cards, w1600 lightbox)
// so large external albums stay fast on mobile networks & Lighthouse performance audits.
function sizedExternalUrl(url, width) {
  const s = String(url || '')
  if (!width || !s) return s
  if (/^https:\/\/drive\.google\.com\/thumbnail\?/i.test(s)) {
    return s.includes('sz=') ? s.replace(/sz=w\d+/i, `sz=w${width}`) : `${s}&sz=w${width}`
  }
  return s
}

export function galleryPhotoSrc(photoOrId, { width = null } = {}) {
  if (!photoOrId) return ''
  if (typeof photoOrId === 'object') {
    if (photoOrId.url) return sizedExternalUrl(photoOrId.url, width)
    return photoOrId.id ? `${API_BASE}/gallery/photos/${encodeURIComponent(photoOrId.id)}` : ''
  }
  return `${API_BASE}/gallery/photos/${encodeURIComponent(photoOrId)}`
}

export function galleryPhotoThumbSrc(photoOrId, width = 320) {
  return galleryPhotoSrc(photoOrId, { width })
}

export function galleryPhotoCardSrc(photoOrId) {
  return galleryPhotoSrc(photoOrId, { width: 800 })
}

function isUnsafeHost(hostname) {
  const h = String(hostname || '').toLowerCase().replace(/^\[|\]$/g, '')
  if (!h || h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal')) return true
  if (h === '::1' || h.startsWith('fe80:') || h.startsWith('fc') || h.startsWith('fd')) return true
  const ipv4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])]
    if (a === 10 || a === 127 || a === 0) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
  }
  return false
}

export function parseImageUrl(rawUrl) {
  const trimmed = String(rawUrl || '').trim()
  if (!trimmed) return { ok: false, error: 'Tempel link foto terlebih dahulu.' }
  if (trimmed.length > 2000) return { ok: false, error: 'Link foto terlalu panjang.' }

  let url
  try {
    url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
  } catch {
    return { ok: false, error: 'Format link foto tidak valid.' }
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    return { ok: false, error: 'Link foto harus menggunakan https://.' }
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '')
  if (isUnsafeHost(host) || !host.includes('.')) {
    return { ok: false, error: 'Gunakan link foto online publik yang valid.' }
  }
  const segments = url.pathname.split('/').filter(Boolean)

  if (host === 'drive.google.com') {
    if (segments.includes('folders')) {
      return {
        ok: false,
        error: 'Ini link folder Google Drive. Klik titik tiga pada foto → Bagikan → Salin link file fotonya.',
      }
    }
    let fileId = ''
    const dIdx = segments.indexOf('d')
    if (dIdx >= 1 && segments[0] === 'file' && dIdx + 1 < segments.length) {
      fileId = segments[dIdx + 1]
    } else if (['open', 'uc', 'thumbnail'].includes(segments[0])) {
      fileId = url.searchParams.get('id') || ''
    }
    if (!GDRIVE_ID_RE.test(fileId)) {
      return {
        ok: false,
        error: 'Link foto Google Drive tidak dikenali. Contoh: https://drive.google.com/file/d/.../view',
      }
    }
    return {
      ok: true,
      value: {
        source: 'gdrive',
        url: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`,
        rawUrl: trimmed,
      },
    }
  }

  if (host === 'dropbox.com' || host === 'dl.dropboxusercontent.com') {
    const clean = new URL(url.toString())
    clean.protocol = 'https:'
    clean.searchParams.delete('dl')
    clean.searchParams.set('raw', '1')
    return {
      ok: true,
      value: {
        source: 'dropbox',
        url: clean.toString(),
        rawUrl: trimmed,
      },
    }
  }

  return {
    ok: true,
    value: {
      source: 'url',
      url: url.toString(),
      rawUrl: trimmed,
    },
  }
}

export function parseVideoUrl(rawUrl) {
  const trimmed = String(rawUrl || '').trim()
  if (!trimmed) return { ok: true, value: null }

  let url
  try {
    url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
  } catch {
    return { ok: false, error: 'Link video tidak valid. Gunakan link YouTube, Instagram, atau Google Drive.' }
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

  if (host === 'drive.google.com') {
    let fileId = ''
    const dIdx = segments.indexOf('d')
    if (dIdx >= 1 && segments[0] === 'file' && dIdx + 1 < segments.length) {
      fileId = segments[dIdx + 1]
    } else if (segments[0] === 'open' || segments[0] === 'uc') {
      fileId = url.searchParams.get('id') || ''
    }
    if (!GDRIVE_ID_RE.test(fileId)) {
      return {
        ok: false,
        error: 'Link Google Drive harus berupa link file video (bukan folder). Contoh: https://drive.google.com/file/d/.../view',
      }
    }
    return {
      ok: true,
      value: {
        platform: 'gdrive',
        mediaKind: 'video',
        id: fileId,
        aspect: 'landscape',
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        canonicalUrl: `https://drive.google.com/file/d/${fileId}/view`,
        thumbnailUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
        rawUrl: trimmed,
      },
    }
  }

  return { ok: false, error: 'Hanya mendukung link video dari YouTube, Instagram (post / Reel), atau Google Drive.' }
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
  if (video.platform === 'gdrive') {
    return 'Video Google Drive'
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
