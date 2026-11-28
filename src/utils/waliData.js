// The wali portal's data in one place: the store keys, how each is fetched, and the warm-up after Beranda
// (utils/waliCache.js keeps them; composables/useWaliResource.js shows them on a page).
import api from '@/services/api'
import { prefetch, invalidate } from '@/utils/waliCache'

// A change the parent made (any successful POST / PUT / DELETE of the portal) makes the data it touches old: the
// pages showing it ask again at once, the others on their next visit. One hook here instead of one per page.
const MUTATIONS = [
  { re: /^\/?wali\/(santri\/[^/]+\/izin|izin\/)/, keys: () => ['me', 'izin:*', 'progress:*'] },
  { re: /^\/?wali\/santri\/[^/]+\/absen-reports/, keys: () => ['reports:*'] },
  // Kartu Prestasi: a paraf changes the card and the badge on Beranda; a new signature changes how parafs look
  { re: /^\/?wali\/santri\/[^/]+\/prestasi/, keys: () => ['prestasi:*', 'me'] },
  { re: /^\/?signatures/, keys: () => ['prestasi:*', 'raporDetail:*'] },
  // Rapor: the parent's note + signature
  { re: /^\/?wali\/santri\/[^/]+\/rapor\//, keys: () => ['raporDetail:*', 'rapor:*'] },
  { re: /^\/?wali\/(santri\/|link|me)/, keys: () => ['me'] },
  { re: /^\/?pendaftaran/, keys: () => ['regs', 'me'] },
  { re: /^\/?wali-feedback/, keys: () => ['feedback'] },
]
let hooked = false
function hookMutations() {
  if (hooked || !api?.interceptors?.response) return
  hooked = true
  api.interceptors.response.use((response) => {
    const method = String(response?.config?.method || 'get').toLowerCase()
    if (method !== 'get') {
      const url = String(response.config.url || '').replace(/^https?:\/\/[^/]+/, '').replace(/^\/api/, '')
      const keys = MUTATIONS.filter((m) => m.re.test(url)).flatMap((m) => m.keys())
      if (keys.length) invalidate(...new Set(keys))
    }
    return response
  })
}
hookMutations()

const get = (url, params) => api.get(url, { cache: false, ...(params ? { params } : {}) }).then((r) => r.data)

export const WALI_KEYS = {
  me: 'me',
  regs: 'regs',
  feedback: 'feedback',
  announcements: 'announcements',
  izin: (santriId) => `izin:${santriId}`,
  progress: (santriId, month = '') => `progress:${santriId}:${month || 'now'}`,
  reports: (santriId) => `reports:${santriId}`,
  rapor: (santriId) => `rapor:${santriId}`,
  prestasi: (santriId, month = '') => `prestasi:${santriId}:${month || 'now'}`,
  raporDetail: (santriId, periodId) => `raporDetail:${santriId}:${periodId}`,
  kegiatan: (santriId) => `kegiatan:${santriId}`,
  kegiatanInfo: (santriId, activityId) => `kegiatanInfo:${santriId}:${activityId}`,
}

export const waliFetch = {
  me: () => get('/wali/me'),
  regs: () => get('/pendaftaran/mine').then((d) => d || []),
  feedback: () => get('/wali-feedback/mine').then((d) => d || []),
  announcements: () => get('/wali-announcements/mine').then((d) => (Array.isArray(d) ? d : [])),
  izin: (santriId) => get(`/wali/santri/${santriId}/izin`),
  progress: (santriId, month = '') => get(`/wali/santri/${santriId}/progress`, month ? { month } : null),
  reports: (santriId) => get(`/wali/santri/${santriId}/absen-reports`),
  rapor: (santriId) => get(`/wali/santri/${santriId}/rapor`),
  prestasi: (santriId, month = '') => get(`/wali/santri/${santriId}/prestasi`, month ? { month } : null),
  raporDetail: (santriId, periodId) => get(`/wali/santri/${santriId}/rapor/${periodId}`),
  kegiatan: (santriId) => get(`/wali/santri/${santriId}/kegiatan`),
  kegiatanInfo: (santriId, activityId) => get(`/wali/santri/${santriId}/kegiatan/${activityId}/info`),
}

// The pages a parent opens from Beranda: their code is fetched while the phone is idle, so the first tap does not wait
const PAGE_CHUNKS = [
  () => import('@/views/wali/WaliProgress.vue'),
  () => import('@/views/wali/WaliIzin.vue'),
  () => import('@/views/wali/WaliIzinPick.vue'),
  () => import('@/views/wali/WaliPengumuman.vue'),
  () => import('@/views/wali/WaliAkun.vue'),
  () => import('@/views/wali/WaliRapor.vue'),
  () => import('@/views/wali/WaliPrestasi.vue'),
  () => import('@/views/wali/WaliKegiatan.vue'),
]

const idle = (fn) => (typeof window !== 'undefined' && 'requestIdleCallback' in window ? window.requestIdleCallback(fn, { timeout: 1200 }) : setTimeout(fn, 300))

let warmedChunks = false
// After Beranda showed: first each child's progress and izin (what a parent opens most; small answers, asked together),
// then the code of the next pages one after another, so the phone's connection is not flooded. Nothing is shown; it
// only makes the next tap instant.
export function warmUpWali(santri = []) {
  idle(async () => {
    const kids = santri.filter((s) => s?.santriId).slice(0, 4)
    await Promise.all(
      kids.flatMap((s) => [
        prefetch(WALI_KEYS.izin(s.santriId), () => waliFetch.izin(s.santriId)),
        prefetch(WALI_KEYS.progress(s.santriId), () => waliFetch.progress(s.santriId)),
      ]),
    )
    if (!warmedChunks) {
      warmedChunks = true
      for (const load of PAGE_CHUNKS) await load().catch(() => {})
    }
  })
}

// the month before the one on screen (a parent going back through the months)
export function warmUpMonth(santriId, month) {
  if (!santriId || !month) return
  idle(() => prefetch(WALI_KEYS.progress(santriId, month), () => waliFetch.progress(santriId, month), { maxAgeMs: 5 * 60 * 1000 }))
}
