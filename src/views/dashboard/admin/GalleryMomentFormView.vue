<template>
  <div class="gm gm-form-page">
    <header class="gm-head">
      <div class="gm-head-text">
        <h1>{{ editingId ? 'Ubah Momen' : 'Tambah Momen' }}</h1>
        <p>{{ editingId ? 'Perbarui info, foto, atau video momen ini.' : 'Isi info singkat, lalu tambahkan foto atau video.' }}</p>
      </div>
    </header>

    <PageSkeleton v-if="loading" variant="form" :rows="5" label="Memuat formulir momen" />

    <div v-else-if="loadError" class="gm-empty is-error" role="alert">
      <p>{{ loadError }}</p>
      <div class="gm-form-err-acts">
        <button type="button" class="gm-btn is-secondary" @click="load">Coba lagi</button>
        <router-link to="/dashboard/dokumentasi" class="gm-btn is-ghost">Ke daftar dokumentasi</router-link>
      </div>
    </div>

    <template v-else>
      <form id="gm-moment-form" class="gm-form-body" novalidate @submit.prevent="saveMoment">
        <!-- Section 1: Info Momen -->
        <div class="gm-section-card">
          <div class="gm-field">
            <label for="gm-title">Judul Momen <span class="gm-req">*</span></label>
            <input
              id="gm-title"
              v-model="form.title"
              type="text"
              class="gm-input"
              maxlength="100"
              required
              placeholder="Contoh: Munaqosyah Santri 2026"
            />
          </div>

          <div class="gm-row-2">
            <div class="gm-field">
              <label for="gm-cat">Kategori <span class="gm-req">*</span></label>
              <div class="gm-cat-inline">
                <select id="gm-cat" v-model="form.categoryId" class="gm-input">
                  <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.label }}</option>
                </select>
                <button type="button" class="gm-btn-mini" @click="quickCatOpen = !quickCatOpen">
                  {{ quickCatOpen ? 'Batal' : '+ Baru' }}
                </button>
              </div>
              <div v-if="quickCatOpen" class="gm-quick-cat">
                <input
                  v-model="quickCatName"
                  type="text"
                  class="gm-input"
                  maxlength="40"
                  placeholder="Nama kategori baru…"
                  @keydown.enter.prevent="addQuickCategory"
                />
                <button type="button" class="gm-btn is-primary gm-btn-sm" :disabled="quickCatBusy || !quickCatName.trim()" @click="addQuickCategory">
                  {{ quickCatBusy ? '…' : 'Simpan' }}
                </button>
              </div>
            </div>

            <div class="gm-field">
              <label for="gm-date">Tanggal Momen</label>
              <input id="gm-date" v-model="form.momentDate" type="date" class="gm-input" />
            </div>
          </div>

          <div class="gm-field">
            <div class="gm-label-row">
              <label for="gm-caption">Keterangan Singkat</label>
              <span class="gm-counter">{{ form.caption.length }}/400</span>
            </div>
            <textarea
              id="gm-caption"
              v-model="form.caption"
              class="gm-input gm-textarea"
              rows="2"
              maxlength="400"
              placeholder="Ceritakan singkat kegiatan ini (opsional)…"
            ></textarea>
          </div>
        </div>

        <!-- Section 2: Foto Dokumentasi (clean grid, zero overlap, simple 2-mode switcher) -->
        <div class="gm-section-card">
          <div class="gm-label-row">
            <label class="gm-section-title">Foto Dokumentasi ({{ totalPhotos }})</label>
            <span class="gm-hint-inline">Upload {{ uploadedPhotoCount }}/{{ MAX_UPLOADED_PHOTOS }} · Link bebas</span>
          </div>

          <div v-if="formPhotos.length" class="gm-photo-grid">
            <div v-for="(p, idx) in visibleFormPhotos" :key="p.key" class="gm-photo-tile" :class="{ 'is-broken': p.broken }">
              <img
                :src="p.thumbUrl || p.previewUrl"
                :alt="`Foto ${idx + 1}`"
                loading="lazy"
                decoding="async"
                referrerpolicy="no-referrer"
                class="gm-photo-thumb"
                @load="p.broken = false"
                @error="p.broken = true"
              />
              <span v-if="p.broken" class="gm-photo-broken-msg">
                Gagal dimuat · pastikan link publik
              </span>
              <span v-if="p.source" class="gm-source-pill">
                {{ p.source === 'gdrive' ? 'Drive' : p.source === 'dropbox' ? 'Dropbox' : 'Link' }}
              </span>
              <span v-if="idx === 0" class="gm-cover-pill">Sampul</span>
              <button
                v-else
                type="button"
                class="gm-cover-set"
                @click="makeCover(idx)"
              >
                Jadikan sampul
              </button>
              <button
                type="button"
                class="gm-photo-rm"
                :aria-label="`Hapus foto ${idx + 1}`"
                @click="removeFormPhoto(idx)"
              >
                ×
              </button>
            </div>
          </div>

          <button
            v-if="formPhotos.length > FORM_PREVIEW_LIMIT"
            type="button"
            class="gm-expand-btn"
            @click="showAllFormPhotos = !showAllFormPhotos"
          >
            {{
              showAllFormPhotos
                ? 'Ringkas tampilan foto'
                : `Lihat semua foto (${formPhotos.length - FORM_PREVIEW_LIMIT} lagi)`
            }}
          </button>

          <!-- Simple 2-Tab Source Switcher (no stacked double drop zones on mobile) -->
          <div class="gm-mode-tabs" role="tablist" aria-label="Cara tambah foto">
            <button
              type="button"
              role="tab"
              :aria-selected="photoAddMode === 'link'"
              class="gm-mode-tab"
              :class="{ 'is-active': photoAddMode === 'link' }"
              @click="photoAddMode = 'link'"
            >
              Tempel Link Online
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="photoAddMode === 'upload'"
              class="gm-mode-tab"
              :class="{ 'is-active': photoAddMode === 'upload' }"
              @click="photoAddMode = 'upload'"
            >
              Upload HP / PC ({{ uploadedPhotoCount }}/{{ MAX_UPLOADED_PHOTOS }})
            </button>
          </div>

          <div v-if="photoAddMode === 'link'" class="gm-link-box">
            <div class="gm-link-row">
              <textarea
                v-model="photoLinkInput"
                class="gm-input gm-link-input"
                rows="2"
                placeholder="Tempel link Google Drive / URL foto (bisa banyak sekaligus, 1 per baris)…"
                :disabled="saving"
                @keydown.ctrl.enter.prevent="addPhotosFromLinks"
              ></textarea>
              <button
                type="button"
                class="gm-btn is-secondary gm-link-btn"
                :disabled="saving || !photoLinkInput.trim()"
                @click="addPhotosFromLinks"
              >
                Ambil Foto
              </button>
            </div>
            <p v-if="photoLinkError" class="gm-error-text" role="alert">{{ photoLinkError }}</p>
            <p v-else class="gm-link-hint">
              Bebas jumlah · mendukung Google Drive (termasuk .HEIC), Dropbox, atau URL gambar publik.
            </p>
          </div>

          <template v-else>
            <label v-if="uploadedPhotoCount < MAX_UPLOADED_PHOTOS" class="gm-upload-drop" :class="{ 'is-busy': compressing }">
              <input
                type="file"
                accept="image/*"
                multiple
                class="sr-only"
                :disabled="compressing || saving"
                @change="onPickFiles"
              />
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>
                {{ compressing ? 'Mengompres foto…' : `Pilih foto (sisa ${MAX_UPLOADED_PHOTOS - uploadedPhotoCount}, otomatis dikompres)` }}
              </span>
            </label>
            <p v-else class="gm-upload-cap-note">
              Batas {{ MAX_UPLOADED_PHOTOS }} foto upload tercapai — gunakan tab <strong>Tempel Link Online</strong> untuk menambah foto lagi tanpa batas.
            </p>
          </template>
        </div>

        <!-- Section 3: Video Dokumentasi -->
        <div class="gm-section-card">
          <div class="gm-label-row">
            <label class="gm-section-title">Video Dokumentasi ({{ formVideos.length }})</label>
            <span class="gm-hint-inline">Opsional · YT / IG / Drive</span>
          </div>

          <div v-if="formVideos.length" class="gm-photo-grid">
            <div v-for="(v, idx) in visibleFormVideos" :key="v.key" class="gm-photo-tile gm-video-tile">
              <img
                v-if="v.thumbnailUrl && !v.thumbBroken"
                :src="galleryPhotoThumbSrc({ url: v.thumbnailUrl }, 360)"
                :alt="`Video ${idx + 1}`"
                loading="lazy"
                decoding="async"
                referrerpolicy="no-referrer"
                class="gm-photo-thumb"
                @error="v.thumbBroken = true"
              />
              <div v-else class="gm-video-tile-fallback" :class="`is-${v.platform}`">
                <span>▶</span>
                <small>{{ v.platform === 'gdrive' ? 'Drive' : v.platform === 'instagram' ? 'IG' : 'YouTube' }}</small>
              </div>
              <span class="gm-source-pill">
                ▶ {{ v.platform === 'gdrive' ? 'Drive' : v.platform === 'instagram' ? 'IG' : 'YouTube' }}
              </span>
              <span class="gm-cover-pill is-video-num">Video {{ idx + 1 }}</span>
              <button
                type="button"
                class="gm-photo-rm"
                :aria-label="`Hapus video ${idx + 1}`"
                @click="removeFormVideo(idx)"
              >
                ×
              </button>
            </div>
          </div>

          <button
            v-if="formVideos.length > FORM_PREVIEW_LIMIT"
            type="button"
            class="gm-expand-btn"
            @click="showAllFormVideos = !showAllFormVideos"
          >
            {{
              showAllFormVideos
                ? 'Ringkas tampilan video'
                : `Lihat semua video (${formVideos.length - FORM_PREVIEW_LIMIT} lagi)`
            }}
          </button>

          <div class="gm-link-box">
            <div class="gm-link-row">
              <textarea
                v-model="videoLinkInput"
                class="gm-input gm-link-input"
                rows="2"
                placeholder="Tempel link video YouTube, Instagram, atau Google Drive (1 per baris)…"
                :disabled="saving"
                @keydown.ctrl.enter.prevent="addVideosFromLinks"
              ></textarea>
              <button
                type="button"
                class="gm-btn is-secondary gm-link-btn"
                :disabled="saving || !videoLinkInput.trim()"
                @click="addVideosFromLinks"
              >
                Ambil Video
              </button>
            </div>
            <p v-if="videoLinkError" class="gm-error-text" role="alert">{{ videoLinkError }}</p>
            <p v-else class="gm-link-hint">
              Diputar langsung di web. Untuk Google Drive pastikan izin file <strong>Siapa saja yang memiliki link</strong>.
            </p>
          </div>
        </div>

        <!-- Switches -->
        <div class="gm-switches">
          <label class="gm-check">
            <input v-model="form.published" type="checkbox" />
            <span>
              <strong>Langsung tayang di web</strong>
              <small>Matikan bila ingin simpan sebagai draf dulu.</small>
            </span>
          </label>
          <label class="gm-check">
            <input v-model="form.pinned" type="checkbox" />
            <span>
              <strong>Pin sebagai unggulan</strong>
              <small>Tampil di posisi paling depan di beranda &amp; galeri.</small>
            </span>
          </label>
        </div>

        <p v-if="formError" class="gm-form-alert" role="alert">{{ formError }}</p>
      </form>

      <!-- stays above the phone's bottom bar while scrolling; thumb-reachable -->
      <div class="gm-form-bar">
        <span v-if="dirty" class="gm-form-dirty">Belum disimpan</span>
        <button type="button" class="gm-btn is-ghost" :disabled="saving" @click="cancel">Batal</button>
        <button type="submit" form="gm-moment-form" class="gm-btn is-primary gm-submit-btn" :disabled="saving || compressing">
          {{ saving ? 'Menyimpan…' : (editingId ? 'Simpan Perubahan' : (form.published ? 'Tayangkan Momen' : 'Simpan sebagai Draf')) }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import { useToast } from '@/composables/useToast'
import { useDialog } from '@/composables/useDialog'
import {
  MAX_UPLOADED_PHOTOS,
  galleryPhotoSrc,
  galleryPhotoThumbSrc,
  momentVideosOf,
  parseVideoUrl,
  parseImageUrl,
  compressGalleryPhoto,
} from '@/utils/galleryMedia'
import '@/styles/gallery-admin.css'

// /dashboard/dokumentasi/baru (new moment) and /dashboard/dokumentasi/:id/ubah (edit). A full page instead of the old
// pop-up: the form is long (photos, videos) and a phone's back gesture no longer throws the work away — leaving with
// unsaved changes asks first (our own dialog), and so does closing the tab.

const route = useRoute()
const router = useRouter()
const { success, error: showError } = useToast()
const { ask } = useDialog()

const editingId = computed(() => String(route.params.id || ''))
const detailPath = computed(() => `/dashboard/dokumentasi/${encodeURIComponent(editingId.value)}`)

const loading = ref(true)
const loadError = ref('')
const categories = ref([])
const saving = ref(false)
const saved = ref(false)
const compressing = ref(false)
const formError = ref('')
const quickCatOpen = ref(false)
const quickCatName = ref('')
const quickCatBusy = ref(false)
const FORM_PREVIEW_LIMIT = 6
const photoLinkInput = ref('')
const photoLinkError = ref('')
const videoLinkInput = ref('')
const videoLinkError = ref('')
const photoAddMode = ref('link')
const showAllFormPhotos = ref(false)
const showAllFormVideos = ref(false)

const todayWib = () => new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10)
const form = ref({
  title: '',
  categoryId: 'suasana-ngaji',
  momentDate: todayWib(),
  caption: '',
  published: true,
  pinned: false,
})

// Unified list of existing + newly selected photos:
const formPhotos = ref([])
const formVideos = ref([])
const totalPhotos = computed(() => formPhotos.value.length)
const visibleFormPhotos = computed(() =>
  showAllFormPhotos.value ? formPhotos.value : formPhotos.value.slice(0, FORM_PREVIEW_LIMIT),
)
const visibleFormVideos = computed(() =>
  showAllFormVideos.value ? formVideos.value : formVideos.value.slice(0, FORM_PREVIEW_LIMIT),
)
// Only uploaded files (stored in Firestore) count toward the 6-photo upload limit; external links are unlimited.
const uploadedPhotoCount = computed(
  () => formPhotos.value.filter((p) => p.kind === 'new' || (p.kind === 'existing' && !p.source)).length,
)

/* ---------- unsaved changes ---------- */
const snapshot = () =>
  JSON.stringify({
    form: form.value,
    photos: formPhotos.value.map((p) => p.key),
    videos: formVideos.value.map((v) => v.key),
    photoLink: photoLinkInput.value.trim(),
    videoLink: videoLinkInput.value.trim(),
  })
const initial = ref('')
const dirty = computed(() => !loading.value && !loadError.value && !saved.value && initial.value !== '' && snapshot() !== initial.value)

function onBeforeUnload(e) {
  if (!dirty.value) return
  e.preventDefault()
  e.returnValue = ''
}

onBeforeRouteLeave(async () => {
  if (!dirty.value || saving.value) return !saving.value
  return ask({
    title: 'Tinggalkan halaman ini?',
    message: 'Perubahan momen belum disimpan dan akan hilang.',
    confirmText: 'Buang perubahan',
    cancelText: 'Tetap di sini',
    tone: 'danger',
  })
})

/* ---------- load ---------- */
async function load() {
  loading.value = true
  loadError.value = ''
  initial.value = ''
  try {
    const { data } = await api.get('/gallery/manage', { cache: false })
    categories.value = Array.isArray(data?.categories) ? data.categories : []
    const moments = Array.isArray(data?.moments) ? data.moments : []
    if (editingId.value) {
      const m = moments.find((x) => x.id === editingId.value)
      if (!m) {
        loadError.value = 'Momen ini tidak ditemukan. Mungkin sudah dihapus.'
        return
      }
      fillFrom(m)
    } else {
      form.value.categoryId = categories.value[0]?.id || 'suasana-ngaji'
    }
    initial.value = snapshot()
  } catch (err) {
    loadError.value =
      err.response?.status === 403
        ? 'Akses Kelola Dokumentasi belum aktif pada akun ini. Minta admin mencentang "Kelola dokumentasi" di menu Akun Pengguna.'
        : err.response?.data?.error || 'Gagal memuat data dokumentasi.'
  } finally {
    loading.value = false
  }
}

function fillFrom(m) {
  formPhotos.value = (m.photos || []).map((p) => ({
    key: `ex_${p.id}`,
    kind: 'existing',
    id: p.id,
    source: p.source || '',
    broken: false,
    previewUrl: galleryPhotoSrc(p),
    thumbUrl: galleryPhotoThumbSrc(p, 360),
  }))
  photoAddMode.value = formPhotos.value.some((p) => p.source) || !formPhotos.value.length ? 'link' : 'upload'
  formVideos.value = momentVideosOf(m).map((v, i) => ({
    key: `vid_${v.platform}_${v.id}_${i}`,
    ...v,
    rawUrl: v.rawUrl || v.canonicalUrl || '',
    thumbBroken: false,
  }))
  form.value = {
    title: m.title || '',
    categoryId: m.categoryId || categories.value[0]?.id || 'lainnya',
    momentDate: m.momentDate || todayWib(),
    caption: m.caption || '',
    published: m.published !== false,
    pinned: m.pinned === true,
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', onBeforeUnload)
  load()
})
onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))

/* ---------- leave ---------- */
// back to where the person came from (the list or the moment page), else to the natural parent page
function cancel() {
  if (saving.value) return
  const back = window.history.state?.back
  if (typeof back === 'string' && back.startsWith('/dashboard/dokumentasi')) router.back()
  else router.push(editingId.value ? detailPath.value : '/dashboard/dokumentasi')
}

/* ---------- photos & videos ---------- */
async function onPickFiles(event) {
  const files = [...(event.target.files || [])]
  event.target.value = ''
  if (!files.length) return
  formError.value = ''

  const remaining = MAX_UPLOADED_PHOTOS - uploadedPhotoCount.value
  if (remaining <= 0) {
    showError(`Batas ${MAX_UPLOADED_PHOTOS} foto upload tercapai. Gunakan link online untuk menambah foto lagi.`)
    return
  }
  const picked = files.slice(0, remaining)
  if (files.length > remaining) {
    showError(`Maksimal ${MAX_UPLOADED_PHOTOS} foto upload per momen. Hanya ${remaining} foto pertama yang diproses.`)
  }

  compressing.value = true
  try {
    for (const file of picked) {
      const compressed = await compressGalleryPhoto(file)
      formPhotos.value.push({
        key: `new_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        kind: 'new',
        ...compressed,
        previewUrl: compressed.dataBase64,
        thumbUrl: compressed.dataBase64,
      })
    }
    showAllFormPhotos.value = true
  } catch (err) {
    formError.value = err?.message || 'Gagal memproses foto yang dipilih.'
  } finally {
    compressing.value = false
  }
}

function makeCover(idx) {
  if (idx <= 0 || idx >= formPhotos.value.length) return
  const next = [...formPhotos.value]
  const [picked] = next.splice(idx, 1)
  next.unshift(picked)
  formPhotos.value = next
}

function removeFormPhoto(idx) {
  formPhotos.value = formPhotos.value.filter((_, i) => i !== idx)
}

function addPhotosFromLinks() {
  photoLinkError.value = ''
  formError.value = ''
  const rawLines = photoLinkInput.value
    .split(/[\n\r\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (!rawLines.length) return

  const parsedBatch = []
  const errors = []
  for (const line of rawLines) {
    const res = parseImageUrl(line)
    if (!res.ok) {
      errors.push(res.error)
    } else if (!formPhotos.value.some((p) => p.previewUrl === res.value.url) && !parsedBatch.some((p) => p.url === res.value.url)) {
      parsedBatch.push(res.value)
    }
  }

  if (parsedBatch.length) {
    for (const item of parsedBatch) {
      formPhotos.value.push({
        key: `ext_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        kind: 'new-link',
        externalUrl: item.rawUrl,
        source: item.source,
        broken: false,
        previewUrl: item.url,
        thumbUrl: galleryPhotoThumbSrc({ url: item.url }, 360),
      })
    }
    photoLinkInput.value = ''
    showAllFormPhotos.value = true
  }

  if (errors.length) {
    photoLinkError.value = errors[0]
  }
}

function removeFormVideo(idx) {
  formVideos.value = formVideos.value.filter((_, i) => i !== idx)
}

function addVideosFromLinks() {
  videoLinkError.value = ''
  formError.value = ''
  const rawLines = videoLinkInput.value
    .split(/[\n\r\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (!rawLines.length) return

  const parsedBatch = []
  const errors = []
  for (const line of rawLines) {
    const res = parseVideoUrl(line)
    if (!res.ok) {
      errors.push(res.error)
    } else if (res.value) {
      const key = `${res.value.platform}:${res.value.id}`
      const dup =
        formVideos.value.some((v) => `${v.platform}:${v.id}` === key) ||
        parsedBatch.some((v) => `${v.platform}:${v.id}` === key)
      if (!dup) parsedBatch.push(res.value)
    }
  }

  if (parsedBatch.length) {
    for (const v of parsedBatch) {
      formVideos.value.push({
        key: `vid_${v.platform}_${v.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        ...v,
        thumbBroken: false,
      })
    }
    videoLinkInput.value = ''
    showAllFormVideos.value = true
  }

  if (errors.length) {
    videoLinkError.value = errors[0]
  }
}

async function addQuickCategory() {
  const label = quickCatName.value.trim()
  if (!label || quickCatBusy.value) return
  quickCatBusy.value = true
  try {
    const { data } = await api.post('/gallery/categories', { label })
    if (Array.isArray(data?.categories)) categories.value = data.categories
    if (data?.category?.id) form.value.categoryId = data.category.id
    quickCatName.value = ''
    quickCatOpen.value = false
    success(`Kategori "${label}" ditambahkan.`)
  } catch (err) {
    showError(err.response?.data?.error || 'Gagal menambah kategori.')
  } finally {
    quickCatBusy.value = false
  }
}

/* ---------- save ---------- */
async function saveMoment() {
  if (saving.value) return
  formError.value = ''
  if (!form.value.title.trim()) {
    formError.value = 'Judul momen wajib diisi.'
    document.getElementById('gm-title')?.focus()
    return
  }
  // If user pasted photo or video link(s) and tapped Save directly, resolve them automatically
  if (photoLinkInput.value.trim()) {
    addPhotosFromLinks()
    if (photoLinkError.value) {
      formError.value = photoLinkError.value
      return
    }
  }
  if (videoLinkInput.value.trim()) {
    addVideosFromLinks()
    if (videoLinkError.value) {
      formError.value = videoLinkError.value
      return
    }
  }
  if (!formPhotos.value.length && !formVideos.value.length) {
    formError.value = 'Tambahkan minimal 1 foto atau 1 link video YouTube / Instagram / Google Drive.'
    return
  }

  saving.value = true
  try {
    const videoUrls = formVideos.value.map((v) => v.rawUrl || v.canonicalUrl).filter(Boolean)
    const toPayloadPhoto = (p) =>
      p.kind === 'new-link'
        ? { externalUrl: p.externalUrl }
        : {
            dataBase64: p.dataBase64,
            contentType: p.contentType,
            width: p.width,
            height: p.height,
          }

    let momentId = editingId.value
    if (!editingId.value) {
      const { data } = await api.post(
        '/gallery/moments',
        {
          title: form.value.title.trim(),
          caption: form.value.caption.trim(),
          categoryId: form.value.categoryId,
          momentDate: form.value.momentDate,
          videoUrls,
          published: form.value.published,
          pinned: form.value.pinned,
          photos: formPhotos.value.map(toPayloadPhoto),
        },
        { timeout: 45000 },
      )
      momentId = data?.id || ''
      success(form.value.published ? 'Momen berhasil ditayangkan di landing page.' : 'Momen disimpan sebagai draf.')
    } else {
      const keepPhotoIds = formPhotos.value.filter((p) => p.kind === 'existing').map((p) => p.id)
      const newPhotos = []
      const photoOrder = []
      for (const p of formPhotos.value) {
        if (p.kind === 'existing') {
          photoOrder.push(`existing:${p.id}`)
        } else {
          const idx = newPhotos.length
          newPhotos.push(toPayloadPhoto(p))
          photoOrder.push(`new:${idx}`)
        }
      }
      await api.put(
        `/gallery/moments/${encodeURIComponent(editingId.value)}`,
        {
          title: form.value.title.trim(),
          caption: form.value.caption.trim(),
          categoryId: form.value.categoryId,
          momentDate: form.value.momentDate,
          videoUrls,
          published: form.value.published,
          pinned: form.value.pinned,
          keepPhotoIds,
          newPhotos,
          photoOrder,
        },
        { timeout: 45000 },
      )
      success('Perubahan momen disimpan.')
    }
    saved.value = true
    // the moment's own page; editing opened from it goes back there (no second copy of it in the history)
    const target = momentId ? `/dashboard/dokumentasi/${encodeURIComponent(momentId)}` : '/dashboard/dokumentasi'
    // (compared without ?tab=…: the moment page keeps its open tab in the address)
    const back = String(window.history.state?.back || '').split('?')[0]
    if (editingId.value && back === target) router.back()
    else router.replace(target)
  } catch (err) {
    formError.value = err.response?.data?.error || 'Gagal menyimpan momen. Periksa koneksi lalu coba lagi.'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.gm-form-page {
  max-width: 760px;
}
.gm-form-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.gm-form-err-acts {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}
.gm-form-bar {
  position: sticky;
  bottom: calc(var(--nav-h, 0px) + var(--nav-over, 0px) + 12px); /* above the floating phone bottom bar */
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
  padding: 10px 12px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.14);
  box-shadow: 0 12px 32px -12px rgba(3, 41, 29, 0.35);
}
.gm-form-dirty {
  margin-right: auto;
  font-size: 0.78rem;
  font-weight: 700;
  color: #b45309;
}
@media (max-width: 600px) {
  .gm-form-bar .gm-submit-btn {
    flex: 1 1 auto;
  }
}
</style>
