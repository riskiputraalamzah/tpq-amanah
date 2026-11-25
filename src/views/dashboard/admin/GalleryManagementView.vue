<template>
  <div class="gm">
    <header class="gm-head">
      <div class="gm-head-text">
        <h1>Dokumentasi &amp; Galeri</h1>
        <p>Unggah momen foto dan video (YouTube, Instagram, atau Google Drive) agar tampil langsung di landing page TPQ Amanah.</p>
      </div>
      <div class="gm-head-actions">
        <a href="/#dokumentasi" target="_blank" rel="noopener noreferrer" class="gm-btn is-ghost">
          Lihat di Web ↗
        </a>
        <button type="button" class="gm-btn is-secondary" @click="openCatModal">
          Kelola Kategori
        </button>
        <button type="button" class="gm-btn is-primary" @click="openCreate">
          + Tambah Momen
        </button>
      </div>
    </header>

    <!-- Summary strip -->
    <div class="gm-stats" aria-label="Ringkasan dokumentasi">
      <div class="gm-stat">
        <span class="gm-stat-val">{{ moments.length }}</span>
        <span class="gm-stat-lbl">Total Momen</span>
      </div>
      <div class="gm-stat">
        <span class="gm-stat-val is-emerald">{{ publishedCount }}</span>
        <span class="gm-stat-lbl">Tayang di Web</span>
      </div>
      <div class="gm-stat">
        <span class="gm-stat-val is-muted">{{ moments.length - publishedCount }}</span>
        <span class="gm-stat-lbl">Disembunyikan</span>
      </div>
      <div class="gm-stat">
        <span class="gm-stat-val is-gold">{{ videoCount }}</span>
        <span class="gm-stat-lbl">Dengan Video</span>
      </div>
    </div>

    <!-- Filters -->
    <div class="gm-toolbar">
      <div class="gm-chips" role="tablist" aria-label="Filter kategori">
        <button
          type="button"
          class="gm-chip"
          :class="{ 'is-active': selectedCategory === 'all' }"
          @click="selectedCategory = 'all'"
        >
          Semua <span class="gm-chip-n">{{ moments.length }}</span>
        </button>
        <button
          v-for="cat in categories"
          :key="cat.id"
          type="button"
          class="gm-chip"
          :class="{ 'is-active': selectedCategory === cat.id }"
          @click="selectedCategory = cat.id"
        >
          {{ cat.label }} <span class="gm-chip-n">{{ cat.count || 0 }}</span>
        </button>
      </div>
      <label class="gm-search-wrap">
        <span class="sr-only">Cari dokumentasi</span>
        <input
          v-model="search"
          type="search"
          class="gm-input gm-search"
          placeholder="Cari judul atau keterangan…"
        />
      </label>
    </div>

    <PageSkeleton v-if="loading" :stats="0" :rows="4" label="Memuat dokumentasi" />

    <div v-else-if="loadError" class="gm-empty is-error" role="alert">
      <p>{{ loadError }}</p>
      <button type="button" class="gm-btn is-secondary" @click="loadData">Coba lagi</button>
    </div>

    <div v-else-if="!filteredMoments.length" class="gm-empty">
      <div class="gm-empty-ico" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="8.5" cy="9.5" r="1.5" />
          <path d="m21 15-4.5-4.5a1.5 1.5 0 0 0-2.1 0L7 18" />
        </svg>
      </div>
      <p class="gm-empty-title">
        {{ moments.length ? 'Tidak ada momen yang cocok dengan filter ini.' : 'Belum ada dokumentasi diunggah.' }}
      </p>
      <p class="gm-empty-sub">
        {{ moments.length ? 'Coba pilih kategori lain atau hapus kata pencarian.' : 'Tambahkan foto kegiatan santri, suasana ngaji, atau video YouTube/Instagram agar landing page makin terpercaya.' }}
      </p>
      <button v-if="!moments.length" type="button" class="gm-btn is-primary" @click="openCreate">
        + Tambah Momen Pertama
      </button>
    </div>

    <div v-else class="gm-grid">
      <article v-for="m in filteredMoments" :key="m.id" class="gm-card" :class="{ 'is-hidden': !m.published }">
        <div class="gm-cover" @click="openEdit(m)">
          <img
            v-if="coverOf(m) && !brokenCovers[m.id]"
            :src="coverOf(m)"
            :alt="m.title"
            loading="lazy"
            referrerpolicy="no-referrer"
            class="gm-cover-img"
            @error="brokenCovers[m.id] = true"
          />
          <div v-else class="gm-cover-video-fallback">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <polygon points="6 4 20 12 6 20 6 4" fill="currentColor" />
            </svg>
            <span>{{ videoPlatformLabel(m.video) }}</span>
          </div>

          <div class="gm-cover-top">
            <span class="gm-badge is-cat">{{ m.categoryLabel }}</span>
            <span v-if="m.pinned" class="gm-badge is-pin">Unggulan</span>
          </div>

          <div class="gm-cover-bottom">
            <span v-if="m.photos?.length" class="gm-media-tag">
              {{ m.photos.length }} foto
            </span>
            <span v-if="momentVideosOf(m).length" class="gm-media-tag is-video">
              ▶ {{ momentVideosOf(m).length > 1 ? `${momentVideosOf(m).length} video` : videoPlatformLabel(momentVideosOf(m)[0]) }}
            </span>
            <span class="gm-status-tag" :class="m.published ? 'is-live' : 'is-draft'">
              {{ m.published ? 'Tayang' : 'Tersembunyi' }}
            </span>
          </div>
        </div>

        <div class="gm-body">
          <div class="gm-meta-line">
            <span>{{ formatMomentDate(m.momentDate) }}</span>
            <span v-if="m.createdByName">· {{ m.createdByName }}</span>
          </div>
          <h2 class="gm-card-title">{{ m.title }}</h2>
          <p v-if="m.caption" class="gm-card-caption">{{ m.caption }}</p>

          <div class="gm-actions">
            <button type="button" class="gm-act is-edit" @click="openEdit(m)">Ubah</button>
            <button
              type="button"
              class="gm-act"
              :class="{ 'is-pinned': m.pinned }"
              :disabled="busyId === m.id"
              @click="togglePin(m)"
            >
              {{ m.pinned ? 'Lepas Pin' : 'Pin' }}
            </button>
            <button
              type="button"
              class="gm-act"
              :disabled="busyId === m.id"
              @click="togglePublish(m)"
            >
              {{ m.published ? 'Sembunyikan' : 'Tayangkan' }}
            </button>
            <button
              type="button"
              class="gm-act is-danger"
              :disabled="busyId === m.id"
              @click="confirmDelete(m)"
            >
              Hapus
            </button>
          </div>
        </div>
      </article>
    </div>

    <!-- Create / Edit Moment Sheet -->
    <Teleport to="body">
      <div v-if="formOpen" class="gm-overlay" role="dialog" aria-modal="true" :aria-label="editingId ? 'Ubah momen dokumentasi' : 'Tambah momen dokumentasi'" @click.self="closeForm">
        <div class="gm-sheet">
          <div class="gm-sheet-head">
            <div>
              <h2>{{ editingId ? 'Ubah Momen' : 'Tambah Momen Dokumentasi' }}</h2>
              <p>Upload hingga {{ MAX_UPLOADED_PHOTOS }} foto dari HP/komputer (dikompres otomatis), atau tempel link foto &amp; video online sepuasnya.</p>
            </div>
            <button type="button" class="gm-close" aria-label="Tutup" @click="closeForm">×</button>
          </div>

          <form class="gm-sheet-body" @submit.prevent="saveMoment">
            <div class="gm-field">
              <label for="gm-title">Judul Momen <span class="gm-req">*</span></label>
              <input
                id="gm-title"
                v-model="form.title"
                type="text"
                class="gm-input"
                maxlength="100"
                required
                placeholder="Contoh: Munaqosyah Santri 2026 atau Pertemuan Wali Santri"
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
                rows="3"
                maxlength="400"
                placeholder="Ceritakan singkat suasana atau makna kegiatan ini untuk calon wali santri…"
              ></textarea>
            </div>

            <!-- Photos upload (max 6 compressed) + unlimited online link drop section -->
            <div class="gm-field">
              <div class="gm-label-row">
                <label>Foto Dokumentasi ({{ totalPhotos }} foto)</label>
                <span class="gm-hint-inline">Upload {{ uploadedPhotoCount }}/{{ MAX_UPLOADED_PHOTOS }} · Link online bebas</span>
              </div>

              <div v-if="formPhotos.length" class="gm-photo-grid" :class="{ 'is-scrollable': formPhotos.length > 6 }">
                <div v-for="(p, idx) in formPhotos" :key="p.key" class="gm-photo-tile" :class="{ 'is-broken': p.broken }">
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
                  {{ compressing ? 'Mengompres foto…' : `Upload foto dari HP / komputer (sisa ${MAX_UPLOADED_PHOTOS - uploadedPhotoCount}, otomatis dikompres)` }}
                </span>
              </label>
              <p v-else class="gm-upload-cap-note">
                Batas {{ MAX_UPLOADED_PHOTOS }} foto upload tercapai — masih bisa menambah foto tanpa batas lewat link online di bawah.
              </p>

              <div class="gm-link-box">
                <div class="gm-link-row">
                  <textarea
                    v-model="photoLinkInput"
                    class="gm-input gm-link-input"
                    rows="2"
                    placeholder="Tempel link foto Google Drive / URL gambar online (tanpa batas jumlah, bisa banyak sekaligus 1 per baris)…"
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
                  Link online (Google Drive termasuk iPhone <strong>.HEIC</strong>, Dropbox, atau URL gambar) tidak dibatasi &amp; otomatis disesuaikan ukurannya agar web tetap ngebut. Pastikan file Drive disetel <strong>Siapa saja yang memiliki link</strong>.
                </p>
              </div>

              <p class="gm-privacy-note">
                Pastikan foto layak tayang publik dan tidak menampilkan data pribadi santri (seperti NIK/alamat rumah).
              </p>
            </div>

            <!-- Video embed URLs drop section (unlimited external video links) -->
            <div class="gm-field">
              <div class="gm-label-row">
                <label>Video Dokumentasi ({{ formVideos.length }} video)</label>
                <span class="gm-hint-inline">Opsional · Link online bebas (YT / IG / Drive)</span>
              </div>

              <div v-if="formVideos.length" class="gm-photo-grid" :class="{ 'is-scrollable': formVideos.length > 6 }">
                <div v-for="(v, idx) in formVideos" :key="v.key" class="gm-photo-tile gm-video-tile">
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

              <div class="gm-link-box">
                <div class="gm-link-row">
                  <textarea
                    v-model="videoLinkInput"
                    class="gm-input gm-link-input"
                    rows="2"
                    placeholder="Tempel 1 atau beberapa link video YouTube, Instagram, atau Google Drive (tanpa batas jumlah, 1 per baris)…"
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
                  Video diputar langsung di website (dimuat saat diklik saja sehingga landing page tetap ringan). Untuk Google Drive, pastikan izin file <strong>Siapa saja yang memiliki link (Pelihat)</strong>.
                </p>
              </div>
            </div>

            <!-- Switches -->
            <div class="gm-switches">
              <label class="gm-check">
                <input v-model="form.published" type="checkbox" />
                <span>
                  <strong>Langsung tampilkan di Landing Page</strong>
                  <small>Matikan bila ingin menyimpan sebagai draf tersembunyi dulu.</small>
                </span>
              </label>
              <label class="gm-check">
                <input v-model="form.pinned" type="checkbox" />
                <span>
                  <strong>Pin sebagai unggulan</strong>
                  <small>Selalu tampil di posisi paling depan pada bagian Dokumentasi.</small>
                </span>
              </label>
            </div>

            <p v-if="formError" class="gm-form-alert" role="alert">{{ formError }}</p>

            <div class="gm-sheet-foot">
              <button type="button" class="gm-btn is-ghost" :disabled="saving" @click="closeForm">Batal</button>
              <button type="submit" class="gm-btn is-primary" :disabled="saving || compressing">
                {{ saving ? 'Menyimpan…' : (editingId ? 'Simpan Perubahan' : 'Tayangkan Momen') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Category Manager Modal -->
    <Teleport to="body">
      <div v-if="catModalOpen" class="gm-overlay" role="dialog" aria-modal="true" aria-label="Kelola kategori dokumentasi" @click.self="catModalOpen = false">
        <div class="gm-sheet gm-sheet-sm">
          <div class="gm-sheet-head">
            <div>
              <h2>Kelola Kategori</h2>
              <p>Tambah kategori khusus atau ubah nama kategori yang sudah ada.</p>
            </div>
            <button type="button" class="gm-close" aria-label="Tutup" @click="catModalOpen = false">×</button>
          </div>

          <div class="gm-sheet-body">
            <form class="gm-cat-add" @submit.prevent="addCategoryFromModal">
              <input
                v-model="newCatLabel"
                type="text"
                class="gm-input"
                maxlength="40"
                placeholder="Nama kategori baru (misal: Rihlah & Outbound)"
              />
              <button type="submit" class="gm-btn is-primary" :disabled="catBusy || !newCatLabel.trim()">
                Tambah
              </button>
            </form>

            <ul class="gm-cat-list">
              <li v-for="c in categories" :key="c.id" class="gm-cat-row">
                <template v-if="renamingCatId === c.id">
                  <input
                    v-model="renamingCatLabel"
                    type="text"
                    class="gm-input gm-cat-rename-input"
                    maxlength="40"
                    @keydown.enter.prevent="saveRenameCategory(c)"
                    @keydown.esc.prevent="renamingCatId = ''"
                  />
                  <div class="gm-cat-row-acts">
                    <button type="button" class="gm-act is-edit" :disabled="catBusy" @click="saveRenameCategory(c)">Simpan</button>
                    <button type="button" class="gm-act" @click="renamingCatId = ''">Batal</button>
                  </div>
                </template>
                <template v-else>
                  <div class="gm-cat-info">
                    <strong>{{ c.label }}</strong>
                    <span>{{ c.count || 0 }} momen</span>
                  </div>
                  <div class="gm-cat-row-acts">
                    <button type="button" class="gm-act" @click="startRename(c)">Ubah</button>
                    <button
                      v-if="c.id !== 'lainnya'"
                      type="button"
                      class="gm-act is-danger"
                      :disabled="catBusy"
                      @click="removeCategory(c)"
                    >
                      Hapus
                    </button>
                    <span v-else class="gm-cat-lock">Cadangan</span>
                  </div>
                </template>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import { useToast } from '@/composables/useToast'
import { useDialog } from '@/composables/useDialog'
import {
  MAX_UPLOADED_PHOTOS,
  galleryPhotoSrc,
  galleryPhotoCardSrc,
  galleryPhotoThumbSrc,
  momentVideosOf,
  parseVideoUrl,
  parseImageUrl,
  compressGalleryPhoto,
  formatMomentDate,
  videoPlatformLabel,
} from '@/utils/galleryMedia'

const { success, error: showError } = useToast()
const { ask } = useDialog()

const loading = ref(true)
const loadError = ref('')
const moments = ref([])
const categories = ref([])
const selectedCategory = ref('all')
const search = ref('')
const busyId = ref('')
const brokenCovers = ref({})
const previewThumbBroken = ref(false)

const publishedCount = computed(() => moments.value.filter((m) => m.published).length)
const videoCount = computed(() => moments.value.filter((m) => momentVideosOf(m).length > 0).length)

const filteredMoments = computed(() => {
  const q = search.value.trim().toLowerCase()
  return moments.value.filter((m) => {
    if (selectedCategory.value !== 'all' && m.categoryId !== selectedCategory.value) return false
    if (!q) return true
    return (
      (m.title || '').toLowerCase().includes(q) ||
      (m.caption || '').toLowerCase().includes(q) ||
      (m.categoryLabel || '').toLowerCase().includes(q)
    )
  })
})

function coverOf(m) {
  if (m.photos?.length) return galleryPhotoCardSrc(m.photos[0])
  const firstVideo = momentVideosOf(m)[0]
  if (firstVideo?.thumbnailUrl) return galleryPhotoCardSrc({ url: firstVideo.thumbnailUrl })
  return ''
}

async function loadData() {
  loading.value = true
  loadError.value = ''
  try {
    const { data } = await api.get('/gallery/manage', { cache: false })
    moments.value = Array.isArray(data?.moments) ? data.moments : []
    categories.value = Array.isArray(data?.categories) ? data.categories : []
    brokenCovers.value = {}
  } catch (err) {
    if (err.response?.status === 403) {
      loadError.value = 'Akses Kelola Dokumentasi belum aktif pada akun ini. Minta admin mencentang "Kelola dokumentasi" di menu Akun Pengguna, lalu ketuk Coba lagi.'
    } else {
      loadError.value = err.response?.data?.error || 'Gagal memuat data dokumentasi.'
    }
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

/* ===== Create / Edit Form ===== */
const todayWib = () => new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10)
const formOpen = ref(false)
const editingId = ref('')
const saving = ref(false)
const compressing = ref(false)
const formError = ref('')
const quickCatOpen = ref(false)
const quickCatName = ref('')
const quickCatBusy = ref(false)
const photoLinkInput = ref('')
const photoLinkError = ref('')
const videoLinkInput = ref('')
const videoLinkError = ref('')

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
// Only uploaded files (stored in Firestore) count toward the 6-photo upload limit; external links are unlimited.
const uploadedPhotoCount = computed(
  () => formPhotos.value.filter((p) => p.kind === 'new' || (p.kind === 'existing' && !p.source)).length,
)

function openCreate() {
  editingId.value = ''
  formError.value = ''
  quickCatOpen.value = false
  quickCatName.value = ''
  photoLinkInput.value = ''
  photoLinkError.value = ''
  videoLinkInput.value = ''
  videoLinkError.value = ''
  formPhotos.value = []
  formVideos.value = []
  form.value = {
    title: '',
    categoryId: categories.value[0]?.id || 'suasana-ngaji',
    momentDate: todayWib(),
    caption: '',
    published: true,
    pinned: false,
  }
  formOpen.value = true
}

function openEdit(m) {
  editingId.value = m.id
  formError.value = ''
  quickCatOpen.value = false
  quickCatName.value = ''
  photoLinkInput.value = ''
  photoLinkError.value = ''
  videoLinkInput.value = ''
  videoLinkError.value = ''
  formPhotos.value = (m.photos || []).map((p) => ({
    key: `ex_${p.id}`,
    kind: 'existing',
    id: p.id,
    source: p.source || '',
    broken: false,
    previewUrl: galleryPhotoSrc(p),
    thumbUrl: galleryPhotoThumbSrc(p, 360),
  }))
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
  formOpen.value = true
}

function closeForm() {
  if (saving.value) return
  formOpen.value = false
}

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
    if (Array.isArray(data?.categories)) {
      const counts = new Map(categories.value.map((c) => [c.id, c.count || 0]))
      categories.value = data.categories.map((c) => ({ ...c, count: counts.get(c.id) || 0 }))
    }
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

async function saveMoment() {
  formError.value = ''
  if (!form.value.title.trim()) {
    formError.value = 'Judul momen wajib diisi.'
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

    if (!editingId.value) {
      await api.post(
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
    formOpen.value = false
    await loadData()
  } catch (err) {
    formError.value = err.response?.data?.error || 'Gagal menyimpan momen. Periksa koneksi lalu coba lagi.'
  } finally {
    saving.value = false
  }
}

/* ===== Quick Card Actions ===== */
async function togglePublish(m) {
  busyId.value = m.id
  try {
    await api.put(`/gallery/moments/${encodeURIComponent(m.id)}`, { published: !m.published })
    success(!m.published ? 'Momen ditayangkan di landing page.' : 'Momen disembunyikan dari landing page.')
    await loadData()
  } catch (err) {
    showError(err.response?.data?.error || 'Gagal mengubah status tayang.')
  } finally {
    busyId.value = ''
  }
}

async function togglePin(m) {
  busyId.value = m.id
  try {
    await api.put(`/gallery/moments/${encodeURIComponent(m.id)}`, { pinned: !m.pinned })
    success(!m.pinned ? 'Momen dipin sebagai unggulan.' : 'Pin unggulan dilepas.')
    await loadData()
  } catch (err) {
    showError(err.response?.data?.error || 'Gagal mengubah pin unggulan.')
  } finally {
    busyId.value = ''
  }
}

async function confirmDelete(m) {
  const ok = await ask({
    title: `Hapus momen "${m.title}"?`,
    message: 'Seluruh foto di momen ini akan dihapus permanen dan langsung hilang dari landing page.',
    confirmText: 'Ya, hapus',
    cancelText: 'Batal',
    tone: 'danger',
  })
  if (!ok) return
  busyId.value = m.id
  try {
    await api.delete(`/gallery/moments/${encodeURIComponent(m.id)}`)
    success('Momen dokumentasi dihapus.')
    await loadData()
  } catch (err) {
    showError(err.response?.data?.error || 'Gagal menghapus momen.')
  } finally {
    busyId.value = ''
  }
}

/* ===== Category Manager Modal ===== */
const catModalOpen = ref(false)
const newCatLabel = ref('')
const catBusy = ref(false)
const renamingCatId = ref('')
const renamingCatLabel = ref('')

function openCatModal() {
  renamingCatId.value = ''
  newCatLabel.value = ''
  catModalOpen.value = true
}

async function addCategoryFromModal() {
  const label = newCatLabel.value.trim()
  if (!label || catBusy.value) return
  catBusy.value = true
  try {
    await api.post('/gallery/categories', { label })
    newCatLabel.value = ''
    success(`Kategori "${label}" ditambahkan.`)
    await loadData()
  } catch (err) {
    showError(err.response?.data?.error || 'Gagal menambah kategori.')
  } finally {
    catBusy.value = false
  }
}

function startRename(c) {
  renamingCatId.value = c.id
  renamingCatLabel.value = c.label
}

async function saveRenameCategory(c) {
  const label = renamingCatLabel.value.trim()
  if (!label || catBusy.value) return
  catBusy.value = true
  try {
    await api.put(`/gallery/categories/${encodeURIComponent(c.id)}`, { label })
    renamingCatId.value = ''
    success('Nama kategori diperbarui.')
    await loadData()
  } catch (err) {
    showError(err.response?.data?.error || 'Gagal mengubah kategori.')
  } finally {
    catBusy.value = false
  }
}

async function removeCategory(c) {
  const ok = await ask({
    title: `Hapus kategori "${c.label}"?`,
    message: c.count
      ? `${c.count} momen di kategori ini otomatis dipindahkan ke kategori "Lainnya".`
      : 'Kategori ini akan dihapus dari daftar pilihan.',
    confirmText: 'Ya, hapus',
    cancelText: 'Batal',
    tone: 'danger',
  })
  if (!ok) return
  catBusy.value = true
  try {
    await api.delete(`/gallery/categories/${encodeURIComponent(c.id)}`)
    if (selectedCategory.value === c.id) selectedCategory.value = 'all'
    success(`Kategori "${c.label}" dihapus.`)
    await loadData()
  } catch (err) {
    showError(err.response?.data?.error || 'Gagal menghapus kategori.')
  } finally {
    catBusy.value = false
  }
}
</script>

<style scoped>
.gm {
  --ink: #0b3b2a;
  --body: #475a50;
  --muted: #5b6b62;
  --emerald: #0a5c40;
  --line: rgba(11, 59, 42, 0.12);
  color: var(--ink);
}

.gm-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px 16px;
  margin-bottom: 16px;
}

.gm-head h1 {
  margin: 0 0 4px;
  font-size: 1.55rem;
  font-weight: 800;
}

.gm-head p {
  margin: 0;
  color: var(--body);
  font-size: 0.92rem;
  line-height: 1.45;
  max-width: 38rem;
}

.gm-head-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.gm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 42px;
  padding: 0 15px;
  border-radius: 11px;
  border: 1.5px solid transparent;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
}

.gm-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.gm-btn.is-primary {
  background: var(--emerald);
  color: #fff;
}

.gm-btn.is-primary:hover:not(:disabled) {
  background: #084b34;
}

.gm-btn.is-secondary {
  background: #fff;
  color: var(--emerald);
  border-color: rgba(10, 92, 64, 0.3);
}

.gm-btn.is-secondary:hover:not(:disabled) {
  background: #f0f8f4;
}

.gm-btn.is-ghost {
  background: #f3f7f4;
  color: var(--ink);
  border-color: var(--line);
}

.gm-btn.is-ghost:hover:not(:disabled) {
  background: #e8f1ec;
}

.gm-btn-sm {
  min-height: 40px;
  padding: 0 12px;
  font-size: 0.82rem;
}

.gm-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

@media (max-width: 640px) {
  .gm-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .gm-head-actions {
    width: 100%;
  }
  .gm-head-actions .gm-btn.is-primary {
    flex: 1 1 100%;
  }
  .gm-head-actions .gm-btn.is-secondary,
  .gm-head-actions .gm-btn.is-ghost {
    flex: 1 1 calc(50% - 4px);
  }
}

.gm-stat {
  display: flex;
  flex-direction: column;
  padding: 12px 14px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid var(--line);
}

.gm-stat-val {
  font-size: 1.35rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

.gm-stat-val.is-emerald { color: var(--emerald); }
.gm-stat-val.is-muted { color: var(--muted); }
.gm-stat-val.is-gold { color: #b45309; }

.gm-stat-lbl {
  margin-top: 2px;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--muted);
}

.gm-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 16px;
}

.gm-chips {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
  max-width: 100%;
}

.gm-chip {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: #fff;
  color: var(--body);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}

.gm-chip.is-active {
  background: var(--emerald);
  border-color: var(--emerald);
  color: #fff;
}

.gm-chip-n {
  font-size: 0.72rem;
  opacity: 0.8;
  font-variant-numeric: tabular-nums;
}

.gm-search-wrap {
  flex: 1 1 220px;
  max-width: 300px;
}

@media (max-width: 640px) {
  .gm-search-wrap {
    max-width: none;
    width: 100%;
  }
}

.gm-input {
  width: 100%;
  min-height: 42px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(11, 59, 42, 0.22);
  background: #fff;
  font: inherit;
  font-size: 0.9rem;
  color: var(--ink);
  box-sizing: border-box;
}

.gm-input:focus {
  outline: none;
  border-color: var(--emerald);
  box-shadow: 0 0 0 3px rgba(10, 92, 64, 0.14);
}

.gm-empty {
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 40px 20px;
  border-radius: 16px;
  border: 1px dashed rgba(11, 59, 42, 0.24);
  background: #fff;
  text-align: center;
}

.gm-empty.is-error {
  border-color: #f3b4ae;
  background: #fff8f7;
  color: #8e1b12;
}

.gm-empty-ico {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border-radius: 14px;
  background: #edf7f2;
  color: var(--emerald);
}

.gm-empty-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
}

.gm-empty-sub {
  margin: 0 0 6px;
  max-width: 28rem;
  font-size: 0.86rem;
  color: var(--body);
  line-height: 1.5;
}

.gm-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

@media (max-width: 1024px) {
  .gm-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 600px) {
  .gm-grid { grid-template-columns: 1fr; }
}

.gm-card {
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  background: #fff;
  border: 1px solid var(--line);
  overflow: hidden;
  box-shadow: 0 8px 20px -16px rgba(3, 41, 29, 0.35);
}

.gm-card.is-hidden {
  opacity: 0.8;
  border-style: dashed;
}

.gm-cover {
  position: relative;
  aspect-ratio: 4 / 3;
  background: #0b3b2a;
  overflow: hidden;
  cursor: pointer;
}

.gm-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.gm-cover-video-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, #073828, #0d5c42);
  color: #fde68a;
  font-weight: 700;
  font-size: 0.86rem;
}

.gm-cover-top {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.gm-badge {
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
}

.gm-badge.is-cat {
  background: rgba(11, 59, 42, 0.84);
  color: #ecfdf5;
}

.gm-badge.is-pin {
  background: #f59e0b;
  color: #1c1917;
}

.gm-cover-bottom {
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 8px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
}

.gm-media-tag {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.76);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
}

.gm-media-tag.is-video {
  background: rgba(180, 83, 9, 0.9);
}

.gm-status-tag {
  margin-left: auto;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 800;
}

.gm-status-tag.is-live {
  background: #dcfce7;
  color: #166534;
}

.gm-status-tag.is-draft {
  background: #f1f5f9;
  color: #475569;
}

.gm-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 12px 14px 14px;
}

.gm-meta-line {
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--muted);
  margin-bottom: 4px;
}

.gm-card-title {
  margin: 0 0 4px;
  font-size: 0.98rem;
  font-weight: 800;
  line-height: 1.3;
  color: var(--ink);
}

.gm-card-caption {
  margin: 0 0 10px;
  font-size: 0.82rem;
  line-height: 1.45;
  color: var(--body);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.gm-actions {
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid var(--line);
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.gm-act {
  flex: 1 1 auto;
  min-height: 34px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: #fff;
  color: var(--ink);
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

.gm-act:hover:not(:disabled) { background: #f3f7f4; }
.gm-act.is-edit { background: #edf7f2; border-color: rgba(10, 92, 64, 0.25); color: var(--emerald); }
.gm-act.is-pinned { background: #fef3c7; border-color: #f59e0b; color: #92400e; }
.gm-act.is-danger { color: #b42318; border-color: rgba(180, 35, 24, 0.24); }
.gm-act.is-danger:hover:not(:disabled) { background: #fef2f2; }

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}
</style>

<!-- Unscoped modal styles with self-contained tokens (Teleport renders outside scoped root) -->
<style>
.gm-overlay {
  --ink: #0b3b2a;
  --body: #475a50;
  --muted: #5b6b62;
  --emerald: #0a5c40;
  --line: rgba(11, 59, 42, 0.14);
  position: fixed;
  inset: 0;
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(3, 28, 20, 0.62);
  backdrop-filter: blur(4px);
  color: var(--ink);
}

.gm-sheet {
  width: 100%;
  max-width: 620px;
  max-height: 92dvh;
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  background: #fdfcf7;
  box-shadow: 0 24px 54px -16px rgba(3, 28, 20, 0.5);
  overflow: hidden;
}

.gm-sheet-sm {
  max-width: 480px;
}

@media (max-width: 600px) {
  .gm-overlay {
    align-items: flex-end;
    padding: 0;
  }
  .gm-sheet {
    max-width: 100%;
    max-height: 92dvh;
    border-radius: 20px 20px 0 0;
  }
}

.gm-sheet-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px 12px;
  border-bottom: 1px solid var(--line);
  background: #fff;
}

.gm-sheet-head h2 {
  margin: 0 0 2px;
  font-size: 1.12rem;
  font-weight: 800;
  color: var(--ink);
}

.gm-sheet-head p {
  margin: 0;
  font-size: 0.8rem;
  color: var(--muted);
}

.gm-close {
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: #fff;
  color: var(--ink);
  font-size: 1.3rem;
  line-height: 1;
  cursor: pointer;
}

.gm-sheet-body {
  padding: 16px 18px 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.gm-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.gm-field label {
  font-size: 0.84rem;
  font-weight: 700;
  color: var(--ink);
}

.gm-req { color: #b42318; }

.gm-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.gm-counter,
.gm-hint-inline {
  font-size: 0.74rem;
  font-weight: 600;
  color: var(--muted);
}

.gm-row-2 {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 12px;
}

@media (max-width: 540px) {
  .gm-row-2 { grid-template-columns: 1fr; }
}

.gm-cat-inline {
  display: flex;
  gap: 6px;
}

.gm-btn-mini {
  flex: none;
  min-height: 42px;
  padding: 0 11px;
  border-radius: 10px;
  border: 1px solid rgba(10, 92, 64, 0.3);
  background: #edf7f2;
  color: var(--emerald);
  font: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.gm-quick-cat {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}

.gm-textarea {
  resize: vertical;
  min-height: 78px;
}

.gm-photo-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.gm-photo-grid.is-scrollable {
  max-height: 290px;
  overflow-y: auto;
  padding-right: 4px;
  overscroll-behavior: contain;
}

.gm-photo-tile {
  position: relative;
  aspect-ratio: 4 / 3;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--line);
  background: #e9f0ec;
  content-visibility: auto;
  contain-intrinsic-size: 140px 105px;
}

.gm-upload-cap-note {
  margin: 0;
  padding: 8px 10px;
  border-radius: 10px;
  background: #f3f7f4;
  border: 1px solid var(--line);
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--body);
}

.gm-photo-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.gm-cover-pill {
  position: absolute;
  left: 6px;
  bottom: 6px;
  padding: 2px 7px;
  border-radius: 999px;
  background: #0a5c40;
  color: #fff;
  font-size: 0.68rem;
  font-weight: 800;
}

.gm-cover-set {
  position: absolute;
  left: 6px;
  bottom: 6px;
  padding: 2px 7px;
  border-radius: 999px;
  border: 0;
  background: rgba(15, 23, 42, 0.78);
  color: #fff;
  font: inherit;
  font-size: 0.66rem;
  font-weight: 700;
  cursor: pointer;
}

.gm-photo-rm {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  border: 0;
  background: rgba(180, 35, 24, 0.9);
  color: #fff;
  font-size: 0.95rem;
  line-height: 1;
  cursor: pointer;
}

.gm-upload-drop {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 52px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1.5px dashed rgba(10, 92, 64, 0.4);
  background: #f2f9f5;
  color: var(--emerald);
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;
}

.gm-upload-drop.is-busy {
  opacity: 0.7;
  cursor: wait;
}

.gm-photo-tile.is-broken {
  border: 1.5px solid #dc2626;
  background: #fef2f2;
}

.gm-photo-broken-msg {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 6px;
  text-align: center;
  background: rgba(254, 242, 242, 0.94);
  color: #991b1b;
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1.25;
}

.gm-source-pill {
  position: absolute;
  top: 5px;
  left: 5px;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.78);
  color: #fff;
  font-size: 0.64rem;
  font-weight: 700;
}

.gm-video-tile-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: #fff;
  font-weight: 800;
  background: linear-gradient(135deg, #0b3b2a, #0a5c40);
}

.gm-video-tile-fallback.is-gdrive {
  background: linear-gradient(135deg, #0a5c40, #1a73e8);
}

.gm-video-tile-fallback.is-instagram {
  background: linear-gradient(135deg, #c13584, #f56040);
}

.gm-video-tile-fallback small {
  font-size: 0.7rem;
  font-weight: 700;
}

.gm-cover-pill.is-video-num {
  background: rgba(180, 83, 9, 0.92);
}

.gm-link-box {
  margin-top: 6px;
  padding: 10px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.gm-link-row {
  display: flex;
  align-items: stretch;
  gap: 8px;
}

@media (max-width: 500px) {
  .gm-link-row {
    flex-direction: column;
  }
}

.gm-link-input {
  flex: 1;
  min-height: 56px;
  resize: vertical;
  font-size: 0.84rem !important;
}

.gm-link-btn {
  flex: none;
  background: #edf7f2 !important;
  color: var(--emerald) !important;
  border-color: rgba(10, 92, 64, 0.32) !important;
}

.gm-link-hint {
  margin: 0;
  font-size: 0.74rem;
  color: var(--muted);
  line-height: 1.4;
}

.gm-privacy-note {
  margin: 2px 0 0;
  font-size: 0.75rem;
  color: var(--muted);
  line-height: 1.4;
}

.gm-error-text {
  margin: 2px 0 0;
  font-size: 0.78rem;
  font-weight: 600;
  color: #b42318;
}

.gm-video-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid rgba(10, 92, 64, 0.25);
  background: #edf7f2;
}

.gm-video-thumb {
  width: 68px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
  flex: none;
}

.gm-video-thumb.is-ig {
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #c13584, #f56040);
  color: #fff;
  font-weight: 800;
  font-size: 0.85rem;
}

.gm-video-thumb.is-gd {
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #1a73e8, #0f9d58);
  color: #fff;
  font-weight: 800;
  font-size: 0.78rem;
}

.gm-video-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.gm-video-info strong {
  font-size: 0.82rem;
  color: var(--ink);
}

.gm-video-info span {
  font-size: 0.74rem;
  color: var(--body);
}

.gm-switches {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid var(--line);
}

.gm-check {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
}

.gm-check input {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  accent-color: var(--emerald);
  flex: none;
}

.gm-check strong {
  display: block;
  font-size: 0.86rem;
  color: var(--ink);
}

.gm-check small {
  display: block;
  font-size: 0.76rem;
  color: var(--muted);
}

.gm-form-alert {
  margin: 0;
  padding: 9px 12px;
  border-radius: 10px;
  background: #fdecea;
  color: #8e1b12;
  font-size: 0.84rem;
  font-weight: 600;
}

.gm-sheet-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--line);
}

.gm-overlay .gm-input {
  width: 100%;
  min-height: 42px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(11, 59, 42, 0.24);
  background: #fff;
  font: inherit;
  font-size: 0.9rem;
  color: var(--ink);
  box-sizing: border-box;
}

.gm-overlay .gm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 16px;
  border-radius: 10px;
  border: 1.5px solid transparent;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
}

.gm-overlay .gm-btn.is-primary {
  background: var(--emerald);
  color: #fff;
}

.gm-overlay .gm-btn.is-ghost {
  background: #fff;
  color: var(--ink);
  border-color: var(--line);
}

.gm-overlay .gm-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.gm-cat-add {
  display: flex;
  gap: 8px;
}

.gm-cat-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gm-cat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid var(--line);
}

.gm-cat-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.gm-cat-info strong {
  font-size: 0.9rem;
  color: var(--ink);
}

.gm-cat-info span {
  font-size: 0.76rem;
  color: var(--muted);
}

.gm-cat-row-acts {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: none;
}

.gm-cat-rename-input {
  flex: 1;
  min-height: 36px !important;
}

.gm-cat-lock {
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--muted);
  padding: 0 6px;
}

.gm-overlay .gm-act {
  min-height: 34px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: #fff;
  color: var(--ink);
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

.gm-overlay .gm-act.is-edit {
  background: #edf7f2;
  color: var(--emerald);
  border-color: rgba(10, 92, 64, 0.28);
}

.gm-overlay .gm-act.is-danger {
  color: #b42318;
  border-color: rgba(180, 35, 24, 0.25);
}
</style>
