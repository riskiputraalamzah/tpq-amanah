<template>
  <div class="gm">
    <header class="gm-head">
      <div class="gm-head-text">
        <h1>Dokumentasi &amp; Galeri</h1>
        <p>Unggah momen foto dan video (YouTube, Instagram, atau Google Drive) agar tampil langsung di landing page TPQ Amanah.</p>
      </div>
      <div class="gm-head-actions">
        <a href="/dokumentasi" target="_blank" rel="noopener noreferrer" class="gm-btn is-ghost">
          Lihat di Web ↗
        </a>
        <button type="button" class="gm-btn is-secondary" @click="openCatModal">
          Kelola Kategori
        </button>
        <router-link to="/dashboard/dokumentasi/baru" class="gm-btn is-primary">
          + Tambah Momen
        </router-link>
      </div>
    </header>

    <!-- Momen / Komentar (admin + guru with the access) / Suka (admin only) -->
    <nav class="gm-tabs" role="tablist" aria-label="Bagian dokumentasi">
      <button
        type="button"
        role="tab"
        class="gm-tab"
        :class="{ 'is-active': tab === 'momen' }"
        :aria-selected="tab === 'momen'"
        @click="setTab('momen')"
      >
        Momen <span class="gm-chip-n">{{ moments.length }}</span>
      </button>
      <button
        type="button"
        role="tab"
        class="gm-tab"
        :class="{ 'is-active': tab === 'komentar' }"
        :aria-selected="tab === 'komentar'"
        @click="setTab('komentar')"
      >
        Komentar
        <span v-if="newCommentCount" class="gm-new-badge">{{ newCommentCount }} baru</span>
        <span v-else class="gm-chip-n">{{ commentTotal }}</span>
      </button>
      <button
        v-if="isAdmin"
        type="button"
        role="tab"
        class="gm-tab"
        :class="{ 'is-active': tab === 'suka' }"
        :aria-selected="tab === 'suka'"
        @click="setTab('suka')"
      >
        Suka <span class="gm-chip-n">{{ likesTotal }}</span>
      </button>
    </nav>

    <PageSkeleton v-if="loading" :stats="0" :rows="4" label="Memuat dokumentasi" />

    <div v-else-if="loadError" class="gm-empty is-error" role="alert">
      <p>{{ loadError }}</p>
      <button type="button" class="gm-btn is-secondary" @click="loadData">Coba lagi</button>
    </div>

    <!-- ===== Komentar: every comment on every moment, newest activity first ===== -->
    <section v-else-if="tab === 'komentar'" role="tabpanel" aria-label="Semua komentar">
      <p class="gm-tab-intro">
        Komentar terbaru dari semua momen. Balas sebagai pengurus TPQ, atau hapus yang tidak pantas (balasannya ikut terhapus).
      </p>
      <GalleryCommentNotify />
      <GalleryCommentFeed :moments="moments" :seen-at="seenBefore" @loaded="onCommentsLoaded" />
    </section>

    <!-- ===== Suka (admin): who liked, from where, on what device ===== -->
    <section v-else-if="tab === 'suka' && isAdmin" role="tabpanel" aria-label="Semua suka">
      <p class="gm-tab-intro">
        Suka terbaru dari semua momen. Yang sudah login (wali, pengajar, admin) tampil dengan namanya; pengunjung tanpa login
        tampil dengan kode perangkat.
      </p>
      <GalleryLikeFeed :moments="moments" :likes-total="likesTotal" />
    </section>

    <!-- ===== Momen ===== -->
    <template v-else>
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
        <div class="gm-chips" role="group" aria-label="Filter kategori">
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

      <div v-if="!filteredMoments.length" class="gm-empty">
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
        <router-link v-if="!moments.length" to="/dashboard/dokumentasi/baru" class="gm-btn is-primary">
          + Tambah Momen Pertama
        </router-link>
      </div>

      <div v-else class="gm-grid">
        <article v-for="m in filteredMoments" :key="m.id" class="gm-card" :class="{ 'is-hidden': !m.published }">
          <router-link :to="detailPath(m)" class="gm-cover" :aria-label="`Buka ${m.title}`">
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
          </router-link>

          <div class="gm-body">
            <div class="gm-meta-line">
              <span>{{ formatMomentDate(m.momentDate) }}</span>
              <span v-if="m.createdByName"> · {{ m.createdByName }}</span>
              <span v-if="m.likesCount > 0" class="gm-likes-meta"> · ♥ {{ m.likesCount }}</span>
              <span v-if="commentCounts[m.id]" class="gm-comments-meta"> · 💬 {{ commentCounts[m.id] }}</span>
            </div>
            <router-link :to="detailPath(m)" class="gm-card-link">
              <h2 class="gm-card-title">{{ m.title }}</h2>
            </router-link>
            <p v-if="m.caption" class="gm-card-caption">{{ m.caption }}</p>

            <div class="gm-actions gm-actions-row">
              <router-link :to="`${detailPath(m)}/ubah`" class="gm-act is-edit">Ubah</router-link>
              <button v-if="m.published" type="button" class="gm-act is-share" @click="copyMomentLink(m)">
                Salin Link
              </button>
              <button
                type="button"
                class="gm-act gm-act-more"
                :aria-label="`Aksi lain untuk ${m.title}`"
                :disabled="busyId === m.id"
                @click="moreFor = m"
              >
                ⋯
              </button>
            </div>
          </div>
        </article>
      </div>
    </template>

    <!-- "⋯" on a card: the less frequent actions -->
    <Teleport to="body">
      <div v-if="moreFor" class="gm-overlay" role="dialog" aria-modal="true" :aria-label="`Aksi untuk ${moreFor.title}`" @click.self="moreFor = null">
        <div class="gm-sheet gm-sheet-sm">
          <div class="gm-sheet-head">
            <div>
              <h2>{{ moreFor.title }}</h2>
              <p>{{ moreFor.published ? 'Tayang di web' : 'Tersembunyi dari web' }}{{ moreFor.pinned ? ' · Unggulan' : '' }}</p>
            </div>
            <button type="button" class="gm-close" aria-label="Tutup" @click="moreFor = null">×</button>
          </div>
          <div class="gm-sheet-body gm-more-list">
            <router-link :to="detailPath(moreFor)" class="gm-more-item" @click="moreFor = null">
              <strong>Buka detail</strong><span>Komentar{{ isAdmin ? ', suka,' : '' }} dan ringkasan momen</span>
            </router-link>
            <button type="button" class="gm-more-item" @click="runMore(togglePin)">
              <strong>{{ moreFor.pinned ? 'Lepas pin unggulan' : 'Pin sebagai unggulan' }}</strong>
              <span>{{ moreFor.pinned ? 'Kembali ke urutan biasa' : 'Tampil paling depan di beranda & galeri' }}</span>
            </button>
            <button type="button" class="gm-more-item" @click="runMore(togglePublish)">
              <strong>{{ moreFor.published ? 'Sembunyikan dari web' : 'Tayangkan di web' }}</strong>
              <span>{{ moreFor.published ? 'Tidak terlihat pengunjung; komentar & suka tetap tersimpan' : 'Langsung terlihat di landing page' }}</span>
            </button>
            <button type="button" class="gm-more-item is-danger" @click="runMore(confirmDelete)">
              <strong>Hapus momen</strong><span>Foto, komentar, dan suka ikut terhapus permanen</span>
            </button>
          </div>
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
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import GalleryCommentFeed from '@/components/gallery-admin/GalleryCommentFeed.vue'
import GalleryCommentNotify from '@/components/gallery-admin/GalleryCommentNotify.vue'
import GalleryLikeFeed from '@/components/gallery-admin/GalleryLikeFeed.vue'
import { useToast } from '@/composables/useToast'
import { useDialog } from '@/composables/useDialog'
import { useAuthStore } from '@/stores/auth'
import { useGalleryMomentActions, momentCoverSrc } from '@/composables/useGalleryMomentActions'
import { readSeenAt, writeSeenAt, laterSeen, countNewComments } from '@/utils/galleryAdmin'
import { useGalleryCommentBadge } from '@/composables/useGalleryCommentBadge'
import { momentVideosOf, formatMomentDate, videoPlatformLabel } from '@/utils/galleryMedia'
import '@/styles/gallery-admin.css'

// Dokumentasi (admin, or a guru with the "gallery-manage" access). Three tabs: the moments, every comment (answer /
// delete), and — admin only — every like with who / where / which device. A moment opens its own page
// (/dashboard/dokumentasi/:id); adding and editing are pages too (/baru, /:id/ubah), no pop-up forms.

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { success, error: showError } = useToast()
const { ask } = useDialog()
const { busyId, copyMomentLink, togglePublish, togglePin, confirmDelete } = useGalleryMomentActions()

const isAdmin = computed(() => authStore.user?.role === 'admin')
const TABS = ['momen', 'komentar', 'suka']
const tab = computed(() => {
  const t = String(route.query.tab || 'momen')
  if (t === 'suka' && !isAdmin.value) return 'momen'
  return TABS.includes(t) ? t : 'momen'
})
function setTab(next) {
  router.replace({ query: { ...route.query, tab: next === 'momen' ? undefined : next } })
}

const loading = ref(true)
const loadError = ref('')
const moments = ref([])
const categories = ref([])
const selectedCategory = ref('all')
const search = ref('')
const brokenCovers = ref({})
const moreFor = ref(null)

const publishedCount = computed(() => moments.value.filter((m) => m.published).length)
const videoCount = computed(() => moments.value.filter((m) => momentVideosOf(m).length > 0).length)
const likesTotal = computed(() => moments.value.reduce((sum, m) => sum + (Number(m.likesCount) || 0), 0))
const detailPath = (m) => `/dashboard/dokumentasi/${encodeURIComponent(m.id)}`
const coverOf = momentCoverSrc

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

async function loadData({ quiet = false } = {}) {
  if (!quiet) loading.value = true
  loadError.value = ''
  try {
    const { data } = await api.get('/gallery/manage', { cache: false })
    moments.value = Array.isArray(data?.moments) ? data.moments : []
    categories.value = Array.isArray(data?.categories) ? data.categories : []
    brokenCovers.value = {}
    // the counts on the cards and the "baru" badge; the Komentar tab loads its own list
    if (tab.value !== 'komentar') loadCommentSummary()
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

/* ---------- comment counts + "baru" ---------- */
const commentCounts = ref({})
const commentTotal = ref(0)
const commentList = ref([])
const seenAt = ref(readSeenAt()) // the badge: since the Komentar tab was last opened
const seenBefore = ref(seenAt.value) // the "Baru" marks while the tab is open: since the visit before
const newCommentCount = computed(() => (tab.value === 'komentar' ? 0 : countNewComments(commentList.value, seenAt.value)))

const commentBadge = useGalleryCommentBadge()

async function loadCommentSummary() {
  try {
    const { data } = await api.get('/gallery/manage/comments', { cache: false })
    onCommentsLoaded({ total: Number(data?.total || 0), counts: data?.counts || {}, comments: data?.comments || [], seenAt: data?.seenAt })
  } catch {
    /* only the badges are missing; the tab shows the error */
  }
}

function onCommentsLoaded({ total, counts, comments, seenAt: fromServer = null }) {
  commentTotal.value = total
  commentCounts.value = counts || {}
  commentList.value = comments || []
  // the account's mark (another device may have looked since); while the tab is open its "Baru" marks stay put
  seenAt.value = laterSeen(seenAt.value, fromServer)
  if (tab.value !== 'komentar') seenBefore.value = seenAt.value
}

// opening the Komentar tab = they have been seen, on every device of this account (the marks stay until the tab is
// left; they start from the server's mark before this visit)
async function markSeen() {
  seenAt.value = writeSeenAt()
  commentBadge.clear()
  try {
    const { data } = await api.post('/gallery/manage/comments/seen')
    if (tab.value === 'komentar' && data?.previous) seenBefore.value = laterSeen(seenBefore.value, data.previous)
    if (data?.seenAt) seenAt.value = writeSeenAt(laterSeen(seenAt.value, data.seenAt))
  } catch {
    /* this device still remembers it */
  }
}

watch(
  tab,
  (t, prev) => {
    if (t === 'komentar') {
      seenBefore.value = seenAt.value
      markSeen()
    } else if (prev === 'komentar') {
      seenBefore.value = seenAt.value
    }
  },
  { immediate: true },
)

onMounted(loadData)

/* ---------- "⋯" actions ---------- */
async function runMore(action) {
  const m = moreFor.value
  if (!m) return
  moreFor.value = null
  if (await action(m)) await loadData({ quiet: true })
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
    await loadData({ quiet: true })
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
    await loadData({ quiet: true })
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
    await loadData({ quiet: true })
  } catch (err) {
    showError(err.response?.data?.error || 'Gagal menghapus kategori.')
  } finally {
    catBusy.value = false
  }
}
</script>

<style scoped>
.gm-tabs {
  display: flex;
  gap: 4px;
  margin: 0 0 16px;
  padding: 4px;
  border-radius: 14px;
  background: #eef4f0;
  overflow-x: auto;
}
.gm-tab {
  flex: 1 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 14px;
  border: 0;
  border-radius: 11px;
  background: transparent;
  color: var(--body);
  font: inherit;
  font-size: 0.9rem;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
}
.gm-tab.is-active {
  background: #fff;
  color: var(--emerald);
  box-shadow: 0 2px 8px -4px rgba(3, 41, 29, 0.3);
}
.gm-tab-intro {
  margin: 0 0 12px;
  font-size: 0.86rem;
  line-height: 1.5;
  color: var(--body);
}
.gm-new-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  background: #b45309;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 800;
}
.gm-comments-meta {
  color: var(--emerald);
  font-weight: 700;
}
.gm-cover {
  display: block;
}
.gm-card-link {
  color: inherit;
  text-decoration: none;
}
.gm-card-link:hover .gm-card-title {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.gm-actions-row {
  flex-direction: row;
}
.gm-actions-row .gm-act {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  text-decoration: none;
}
.gm-actions-row .gm-act-more {
  flex: 0 0 48px;
  font-size: 1.2rem;
  letter-spacing: 1px;
}
</style>

<!-- the "⋯" sheet is teleported to <body>: unscoped, gm- prefixed -->
<style>
.gm-more-list {
  gap: 8px;
}
.gm-more-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  width: 100%;
  min-height: 56px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: #fff;
  color: var(--ink);
  font: inherit;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}
.gm-more-item:hover {
  background: #f3f7f4;
}
.gm-more-item strong {
  font-size: 0.92rem;
}
.gm-more-item span {
  font-size: 0.78rem;
  color: var(--muted);
}
.gm-more-item.is-danger strong {
  color: #b42318;
}
.gm-more-item.is-danger:hover {
  background: #fef2f2;
}
</style>
