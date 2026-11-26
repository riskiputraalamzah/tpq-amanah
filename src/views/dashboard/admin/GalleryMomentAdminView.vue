<template>
  <div class="gm gmd">
    <PageSkeleton v-if="loading" variant="form" :rows="3" label="Memuat detail momen" />

    <div v-else-if="loadError" class="gm-empty is-error" role="alert">
      <p>{{ loadError }}</p>
      <div class="gmd-err-acts">
        <button v-if="!notFound" type="button" class="gm-btn is-secondary" @click="load">Coba lagi</button>
        <router-link to="/dashboard/dokumentasi" class="gm-btn is-ghost">Ke daftar dokumentasi</router-link>
      </div>
    </div>

    <template v-else-if="moment">
      <section class="gmd-hero" :class="{ 'is-hidden': !moment.published }">
        <div class="gmd-cover">
          <img
            v-if="cover && !coverBroken"
            :src="cover"
            :alt="moment.title"
            referrerpolicy="no-referrer"
            @error="coverBroken = true"
          />
          <div v-else class="gm-cover-video-fallback">
            <span>▶ {{ videoPlatformLabel(moment.video) }}</span>
          </div>
          <div class="gm-cover-top">
            <span class="gm-badge is-cat">{{ moment.categoryLabel }}</span>
            <span v-if="moment.pinned" class="gm-badge is-pin">Unggulan</span>
          </div>
          <div class="gm-cover-bottom">
            <span class="gm-status-tag" :class="moment.published ? 'is-live' : 'is-draft'">
              {{ moment.published ? 'Tayang di web' : 'Tersembunyi' }}
            </span>
          </div>
        </div>

        <div class="gmd-info">
          <p class="gmd-meta">
            {{ formatMomentDate(moment.momentDate) }}<span v-if="moment.createdByName"> · {{ moment.createdByName }}</span>
          </p>
          <h1 class="gmd-title">{{ moment.title }}</h1>
          <p v-if="moment.caption" class="gmd-caption">{{ moment.caption }}</p>

          <ul class="gmd-stats" aria-label="Ringkasan momen">
            <li><strong>{{ moment.photos?.length || 0 }}</strong> foto</li>
            <li><strong>{{ videos.length }}</strong> video</li>
            <li><strong>{{ commentTotal }}</strong> komentar</li>
            <li class="is-like"><strong>{{ moment.likesCount || 0 }}</strong> suka</li>
          </ul>

          <div v-if="moment.photos?.length > 1" class="gmd-strip" aria-label="Foto di momen ini">
            <img
              v-for="(p, i) in moment.photos.slice(0, 12)"
              :key="p.id"
              :src="galleryPhotoThumbSrc(p, 200)"
              :alt="`Foto ${i + 1}`"
              loading="lazy"
              decoding="async"
              referrerpolicy="no-referrer"
            />
          </div>

          <div class="gmd-actions">
            <router-link :to="`/dashboard/dokumentasi/${encodeURIComponent(moment.id)}/ubah`" class="gm-btn is-primary gmd-edit">
              Ubah momen
            </router-link>
            <a
              v-if="moment.published"
              :href="`/dokumentasi/${encodeURIComponent(moment.slug || moment.id)}`"
              target="_blank"
              rel="noopener noreferrer"
              class="gm-btn is-ghost"
            >Lihat di web ↗</a>
            <button v-if="moment.published" type="button" class="gm-btn is-ghost" @click="copyMomentLink(moment)">Salin link</button>
            <button type="button" class="gm-btn is-ghost" :class="{ 'is-pinned': moment.pinned }" :disabled="busyId === moment.id" @click="pin">
              {{ moment.pinned ? 'Lepas pin' : 'Pin unggulan' }}
            </button>
            <button type="button" class="gm-btn is-ghost" :disabled="busyId === moment.id" @click="publish">
              {{ moment.published ? 'Sembunyikan' : 'Tayangkan' }}
            </button>
            <button type="button" class="gm-btn is-ghost gmd-danger" :disabled="busyId === moment.id" @click="remove">Hapus</button>
          </div>
        </div>
      </section>

      <nav class="gmd-tabs" role="tablist" aria-label="Komentar dan suka">
        <button
          type="button"
          role="tab"
          class="gmd-tab"
          :class="{ 'is-active': tab === 'komentar' }"
          :aria-selected="tab === 'komentar'"
          @click="setTab('komentar')"
        >
          💬 Komentar <span class="gm-chip-n">{{ commentTotal }}</span>
        </button>
        <button
          v-if="isAdmin"
          type="button"
          role="tab"
          class="gmd-tab"
          :class="{ 'is-active': tab === 'suka' }"
          :aria-selected="tab === 'suka'"
          @click="setTab('suka')"
        >
          ♥ Suka <span class="gm-chip-n">{{ moment.likesCount || 0 }}</span>
        </button>
      </nav>

      <div role="tabpanel" class="gmd-panel">
        <GalleryCommentFeed
          v-if="tab === 'komentar'"
          :moment-id="moment.id"
          :moments="[moment]"
          :seen-at="seenAt"
          @loaded="onCommentsLoaded"
        />
        <GalleryLikeFeed
          v-else-if="tab === 'suka' && isAdmin"
          :moment-id="moment.id"
          :moments="[moment]"
          :likes-total="moment.likesCount || 0"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import GalleryCommentFeed from '@/components/gallery-admin/GalleryCommentFeed.vue'
import GalleryLikeFeed from '@/components/gallery-admin/GalleryLikeFeed.vue'
import { useAuthStore } from '@/stores/auth'
import { useGalleryMomentActions, momentCoverSrc } from '@/composables/useGalleryMomentActions'
import { galleryPhotoThumbSrc, momentVideosOf, formatMomentDate, videoPlatformLabel } from '@/utils/galleryMedia'
import { readSeenAt } from '@/utils/galleryAdmin'
import '@/styles/gallery-admin.css'

// /dashboard/dokumentasi/:id — one moment for the admin and a guru with the Dokumentasi access: what it shows, the
// quick actions, its comments (answer / delete) and, for the admin only, who liked it.

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { busyId, copyMomentLink, togglePublish, togglePin, confirmDelete } = useGalleryMomentActions()

const isAdmin = computed(() => authStore.user?.role === 'admin')
const momentId = computed(() => String(route.params.id || ''))

const loading = ref(true)
const loadError = ref('')
const notFound = ref(false)
const moment = ref(null)
const coverBroken = ref(false)
const commentTotal = ref(0)
// "Baru" = after this device last looked at the comments (the same mark as the Komentar tab)
const seenAt = ref(readSeenAt())

const cover = computed(() => momentCoverSrc(moment.value))
const videos = computed(() => (moment.value ? momentVideosOf(moment.value) : []))
const tab = computed(() => (route.query.tab === 'suka' && isAdmin.value ? 'suka' : 'komentar'))

function setTab(next) {
  router.replace({ query: { ...route.query, tab: next === 'komentar' ? undefined : next } })
}

async function load({ quiet = false } = {}) {
  if (!quiet) loading.value = true
  loadError.value = ''
  notFound.value = false
  try {
    const { data } = await api.get('/gallery/manage', { cache: false })
    const m = (data?.moments || []).find((x) => x.id === momentId.value)
    if (!m) {
      notFound.value = true
      loadError.value = 'Momen ini tidak ditemukan. Mungkin sudah dihapus.'
      moment.value = null
      return
    }
    moment.value = m
    coverBroken.value = false
  } catch (err) {
    loadError.value =
      err.response?.status === 403
        ? 'Akses Kelola Dokumentasi belum aktif pada akun ini. Minta admin mencentang "Kelola dokumentasi" di menu Akun Pengguna.'
        : err.response?.data?.error || 'Gagal memuat momen.'
  } finally {
    loading.value = false
  }
}

// the "n baru" mark of the Komentar tab is left alone here: it covers every moment, this page shows one
function onCommentsLoaded({ total }) {
  commentTotal.value = total
}

async function pin() {
  if (await togglePin(moment.value)) load({ quiet: true })
}
async function publish() {
  if (await togglePublish(moment.value)) load({ quiet: true })
}
async function remove() {
  if (await confirmDelete(moment.value)) router.replace('/dashboard/dokumentasi')
}

watch(momentId, () => load())
onMounted(async () => {
  await load()
  // the comment count before the tab is opened (the Suka tab opens straight from a link)
  if (moment.value && tab.value !== 'komentar') {
    try {
      const { data } = await api.get('/gallery/manage/comments', { params: { momentId: moment.value.id }, cache: false })
      commentTotal.value = Number(data?.total || 0)
    } catch {
      /* the tab loads them again */
    }
  }
})
</script>

<style scoped>
.gmd-err-acts {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}
.gmd-hero {
  display: grid;
  gap: 16px;
  padding: 12px;
  border-radius: 20px;
  background: #fff;
  border: 1px solid var(--line);
  box-shadow: 0 8px 20px -16px rgba(3, 41, 29, 0.35);
}
.gmd-hero.is-hidden {
  border-style: dashed;
}
@media (min-width: 900px) {
  .gmd-hero {
    grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
    align-items: start;
    padding: 16px;
  }
}
.gmd-cover {
  position: relative;
  aspect-ratio: 4 / 3;
  border-radius: 14px;
  overflow: hidden;
  background: #0b3b2a;
}
.gmd-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.gmd-info {
  min-width: 0;
}
.gmd-meta {
  margin: 0 0 4px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--muted);
}
.gmd-title {
  margin: 0 0 6px;
  font-size: 1.35rem;
  font-weight: 800;
  line-height: 1.25;
  color: var(--ink);
  overflow-wrap: anywhere;
}
.gmd-caption {
  margin: 0 0 12px;
  color: var(--body);
  font-size: 0.92rem;
  line-height: 1.5;
  white-space: pre-line;
}
.gmd-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0 0 12px;
  padding: 0;
  list-style: none;
}
.gmd-stats li {
  padding: 4px 10px;
  border-radius: 999px;
  background: #f3f7f4;
  font-size: 0.8rem;
  color: var(--body);
}
.gmd-stats strong {
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.gmd-stats li.is-like strong {
  color: #e11d48;
}
.gmd-strip {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}
.gmd-strip img {
  flex: none;
  width: 64px;
  height: 64px;
  border-radius: 10px;
  object-fit: cover;
  background: #e7efe9;
}
.gmd-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.gmd-actions .gmd-edit {
  grid-column: 1 / -1;
}
@media (min-width: 560px) {
  .gmd-actions {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
.gmd-actions .gm-btn {
  min-width: 0;
  white-space: normal;
  text-align: center;
  line-height: 1.2;
}
.gmd-actions .gm-btn.is-pinned {
  background: #fef3c7;
  border-color: #f59e0b;
  color: #92400e;
}
.gmd-actions .gmd-danger {
  color: #b42318;
  border-color: rgba(180, 35, 24, 0.24);
}
.gmd-tabs {
  display: flex;
  gap: 6px;
  margin: 20px 0 12px;
  padding: 4px;
  border-radius: 14px;
  background: #eef4f0;
}
.gmd-tab {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 44px;
  border: 0;
  border-radius: 11px;
  background: transparent;
  color: var(--body);
  font: inherit;
  font-size: 0.9rem;
  font-weight: 800;
  cursor: pointer;
}
.gmd-tab.is-active {
  background: #fff;
  color: var(--emerald);
  box-shadow: 0 2px 8px -4px rgba(3, 41, 29, 0.3);
}
</style>
