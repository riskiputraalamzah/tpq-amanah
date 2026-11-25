<template>
  <section
    v-if="moments.length"
    id="dokumentasi"
    aria-labelledby="dokumentasi-title"
    class="lp-section lp-emerald lp-on-dark scroll-mt-28"
  >
    <span class="lp-fringe-top" aria-hidden="true"></span>

    <div class="lp-wrap">
      <SectionHeading
        dark
        heading-id="dokumentasi-title"
        title="Dokumentasi &amp; Suasana Kegiatan"
      >
        Potret nyata keseharian belajar Al-Qur'an, kebersamaan santri, kegiatan
        munaqosyah, hingga silaturahmi bersama wali santri di TPQ Amanah.
      </SectionHeading>

      <!-- Category Filter Pills (shown when more than 1 category has published moments) -->
      <div
        v-if="categories.length > 1"
        class="flex items-center justify-start gap-2 pb-2 mb-8 overflow-x-auto sm:justify-center sm:flex-wrap"
        role="tablist"
        aria-label="Filter kategori dokumentasi"
      >
        <button
          type="button"
          role="tab"
          :aria-selected="selectedCategory === 'all'"
          class="shrink-0 min-h-[38px] px-4 rounded-full text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          :class="
            selectedCategory === 'all'
              ? 'bg-amber-300 text-slate-950 shadow-sm'
              : 'bg-white/10 text-emerald-50 hover:bg-white/20 border border-amber-200/25'
          "
          @click="selectCategory('all')"
        >
          Semua ({{ moments.length }})
        </button>
        <button
          v-for="cat in categories"
          :key="cat.id"
          type="button"
          role="tab"
          :aria-selected="selectedCategory === cat.id"
          class="shrink-0 min-h-[38px] px-4 rounded-full text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          :class="
            selectedCategory === cat.id
              ? 'bg-amber-300 text-slate-950 shadow-sm'
              : 'bg-white/10 text-emerald-50 hover:bg-white/20 border border-amber-200/25'
          "
          @click="selectCategory(cat.id)"
        >
          {{ cat.label }}
        </button>
      </div>

      <!-- Curated Moment Grid -->
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="m in visibleMoments"
          :key="m.id"
          class="flex flex-col overflow-hidden lp-card lp-lift group"
        >
          <button
            type="button"
            class="flex flex-col flex-1 w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber-400"
            @click="openMoment(m, $event)"
          >
            <!-- 4:3 Media Cover -->
            <div class="relative w-full overflow-hidden aspect-[4/3] bg-emerald-950">
              <img
                v-if="coverOf(m) && !brokenCovers[m.id]"
                :src="coverOf(m)"
                :alt="m.title"
                loading="lazy"
                decoding="async"
                referrerpolicy="no-referrer"
                class="object-cover object-[50%_25%] w-full h-full transition-transform duration-500 group-hover:scale-[1.04]"
                @error="brokenCovers[m.id] = true"
              />
              <div
                v-else
                class="flex flex-col items-center justify-center w-full h-full gap-3 px-6 text-center bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-950 text-amber-200"
              >
                <span class="grid w-14 h-14 rounded-full place-items-center bg-amber-300/20 border border-amber-300/45 text-amber-200">
                  <svg class="w-6 h-6 ml-0.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <polygon points="6 4 20 12 6 20 6 4" />
                  </svg>
                </span>
                <span class="text-sm font-bold tracking-wide">
                  {{ momentVideosOf(m).length > 1 ? `${momentVideosOf(m).length} Video` : 'Putar Video' }}
                </span>
              </div>

              <!-- Play indicator when video-only with thumbnail -->
              <span
                v-if="momentVideosOf(m).length && !m.photos?.length && coverOf(m) && !brokenCovers[m.id]"
                class="absolute inset-0 grid place-items-center bg-slate-950/25 group-hover:bg-slate-950/35 transition-colors"
                aria-hidden="true"
              >
                <span class="grid w-14 h-14 rounded-full place-items-center bg-amber-400/95 text-slate-950 shadow-lg transition-transform duration-300 group-hover:scale-110">
                  <svg class="w-6 h-6 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="6 4 20 12 6 20 6 4" />
                  </svg>
                </span>
              </span>

              <!-- Top Badges -->
              <div class="absolute flex flex-wrap items-center gap-1.5 top-3 left-3 right-3">
                <span class="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-950/85 text-emerald-50 backdrop-blur-sm">
                  {{ m.categoryLabel }}
                </span>
                <span
                  v-if="m.pinned"
                  class="px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-300 text-slate-950"
                >
                  Unggulan
                </span>
              </div>

              <!-- Bottom Media Chips -->
              <div class="absolute flex flex-wrap items-center gap-1.5 bottom-3 right-3">
                <span
                  v-if="m.photos?.length > 1"
                  class="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-full bg-slate-950/75 text-white backdrop-blur-sm"
                >
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <circle cx="8.5" cy="9.5" r="1.5" />
                    <path d="m21 15-4.5-4.5a1.5 1.5 0 0 0-2.1 0L7 18" />
                  </svg>
                  {{ m.photos.length }} foto
                </span>
                <span
                  v-if="momentVideosOf(m).length"
                  class="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-400 text-slate-950 shadow-sm"
                >
                  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <polygon points="6 4 20 12 6 20 6 4" />
                  </svg>
                  {{ momentVideosOf(m).length > 1 ? `${momentVideosOf(m).length} video` : 'Video' }}
                </span>
              </div>
            </div>

            <!-- Card Body -->
            <div class="flex flex-col flex-1 p-5 text-[color:var(--lp-ink)]">
              <p class="mb-1.5 text-xs font-semibold text-amber-800">
                {{ formatMomentDate(m.momentDate) }}
              </p>
              <h3 class="text-base font-bold leading-snug lp-ink line-clamp-2">
                {{ m.title }}
              </h3>
              <p
                v-if="m.caption"
                class="mt-2 text-sm leading-relaxed lp-body line-clamp-2"
              >
                {{ m.caption }}
              </p>
              <span class="inline-flex items-center gap-1.5 mt-auto pt-4 text-sm font-bold text-emerald-800 group-hover:underline underline-offset-4">
                <span>{{ cardCtaLabel(m) }}</span>
                <span aria-hidden="true">&rarr;</span>
              </span>
            </div>
          </button>
        </article>
      </div>

      <!-- Show More / Less -->
      <div v-if="filteredMoments.length > INITIAL_LIMIT" class="flex justify-center mt-8">
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 min-h-[46px] px-6 rounded-xl border border-amber-200/45 bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          @click="showAll = !showAll"
        >
          {{
            showAll
              ? 'Tampilkan ringkas'
              : `Lihat semua dokumentasi (${filteredMoments.length} momen)`
          }}
        </button>
      </div>
    </div>

    <span class="lp-fringe-bottom is-paper" aria-hidden="true"></span>
  </section>

  <!-- Full-Screen Lightbox + Inline YouTube/Instagram Player -->
  <Teleport to="body">
    <div
      v-if="activeMoment"
      role="dialog"
      aria-modal="true"
      :aria-label="activeMoment.title"
      data-lenis-prevent
      class="fixed inset-0 z-[70] flex flex-col bg-slate-950/95 backdrop-blur-sm text-white"
      @click.self="closeModal"
    >
      <!-- Top Bar (respects mobile safe-area notch / Dynamic Island) -->
      <div
        class="flex items-start justify-between gap-3 px-4 pb-2.5 border-b border-white/10"
        style="padding-top: max(14px, env(safe-area-inset-top))"
      >
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2 text-xs font-semibold text-amber-300">
            <span>{{ activeMoment.categoryLabel }}</span>
            <span aria-hidden="true">&middot;</span>
            <span>{{ formatMomentDate(activeMoment.momentDate) }}</span>
          </div>
          <h3 class="mt-0.5 text-base sm:text-lg font-bold leading-snug text-white">
            {{ activeMoment.title }}
          </h3>
        </div>
        <button
          ref="closeBtnRef"
          type="button"
          aria-label="Tutup dokumentasi"
          class="grid shrink-0 transition-colors rounded-full place-items-center w-11 h-11 bg-white/10 hover:bg-white/20"
          @click="closeModal"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Mode Switcher when moment has BOTH photos and video(s) -->
      <div
        v-if="activeMoment.photos?.length && activeVideos.length"
        class="flex items-center justify-center gap-2 px-4 pt-3"
      >
        <button
          type="button"
          class="min-h-[38px] px-4 rounded-full text-sm font-bold transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          :class="modalMode === 'photos' ? 'bg-amber-300 text-slate-950' : 'bg-white/10 text-white hover:bg-white/20'"
          @click="modalMode = 'photos'"
        >
          Foto ({{ activeMoment.photos.length }})
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 min-h-[38px] px-4 rounded-full text-sm font-bold transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          :class="modalMode === 'video' ? 'bg-amber-300 text-slate-950' : 'bg-white/10 text-white hover:bg-white/20'"
          @click="modalMode = 'video'"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <polygon points="6 4 20 12 6 20 6 4" />
          </svg>
          Video ({{ activeVideos.length }})
        </button>
      </div>

      <!-- Stage: Photos OR Inline Video Player -->
      <div
        class="relative flex items-center justify-center flex-1 min-h-0 px-3 py-3 overflow-auto"
        @click.self="closeModal"
        @touchstart.passive="onTouchStart"
        @touchend.passive="onTouchEnd"
      >
        <!-- Photo Viewer -->
        <template v-if="modalMode === 'photos' && activeMoment.photos?.length">
          <button
            v-if="activeMoment.photos.length > 1"
            type="button"
            aria-label="Foto sebelumnya"
            class="absolute z-10 hidden sm:grid place-items-center left-4 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 transition-colors"
            @click="stepPhoto(-1)"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <img
            :src="galleryPhotoSrc(activeMoment.photos[activePhotoIdx])"
            :alt="`${activeMoment.title} - foto ${activePhotoIdx + 1}`"
            referrerpolicy="no-referrer"
            class="max-w-full max-h-full rounded-xl shadow-2xl object-contain select-none"
          />

          <button
            v-if="activeMoment.photos.length > 1"
            type="button"
            aria-label="Foto berikutnya"
            class="absolute z-10 hidden sm:grid place-items-center right-4 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 transition-colors"
            @click="stepPhoto(1)"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </template>

        <!-- Inline Video Embed Player (Google Drive / YouTube / Instagram, supports multiple videos) -->
        <template v-else-if="activeVideo">
          <button
            v-if="activeVideos.length > 1"
            type="button"
            aria-label="Video sebelumnya"
            class="absolute z-10 hidden sm:grid place-items-center left-4 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 transition-colors"
            @click="stepVideo(-1)"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <!-- Google Drive: adaptive theater height so vertical (9:16) and horizontal (16:9) Drive videos never crop on mobile/Safari -->
          <div
            v-if="activeVideo.platform === 'gdrive'"
            :key="activeVideo.embedUrl"
            class="w-full h-[min(66dvh,640px)] sm:h-[min(74dvh,680px)] max-w-4xl overflow-hidden bg-black rounded-2xl shadow-2xl border border-white/10"
          >
            <iframe
              :src="activeVideo.embedUrl"
              :title="activeMoment.title"
              class="w-full h-full border-0"
              allow="autoplay; fullscreen"
              allowfullscreen
              referrerpolicy="strict-origin-when-cross-origin"
            ></iframe>
          </div>

          <div
            v-else-if="activeVideo.platform === 'youtube'"
            :key="activeVideo.embedUrl"
            class="w-full overflow-hidden bg-black rounded-2xl shadow-2xl border border-white/10"
            :class="activeVideo.aspect === 'portrait' ? 'max-w-[380px] h-full max-h-[min(74dvh,680px)] aspect-[9/16]' : 'max-w-4xl aspect-video max-h-full'"
          >
            <iframe
              :src="activeVideo.embedUrl"
              :title="activeMoment.title"
              class="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share"
              allowfullscreen
              referrerpolicy="strict-origin-when-cross-origin"
            ></iframe>
          </div>

          <div
            v-else
            :key="activeVideo.embedUrl"
            class="flex flex-col items-center w-full max-w-[420px] gap-3"
          >
            <div class="w-full h-[min(68dvh,560px)] overflow-hidden bg-white rounded-2xl shadow-2xl border border-white/15">
              <iframe
                :src="activeVideo.embedUrl"
                :title="activeMoment.title"
                class="w-full h-full border-0"
                scrolling="no"
                allowtransparency="true"
                allowfullscreen
                referrerpolicy="strict-origin-when-cross-origin"
              ></iframe>
            </div>
            <p class="text-xs text-center text-emerald-100/80">
              Jika pratinjau Instagram terbatas oleh browser,
              <a
                :href="activeVideo.canonicalUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="font-bold text-amber-300 underline underline-offset-4"
              >
                buka langsung di Instagram &#8599;
              </a>
            </p>
          </div>

          <button
            v-if="activeVideos.length > 1"
            type="button"
            aria-label="Video berikutnya"
            class="absolute z-10 hidden sm:grid place-items-center right-4 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 transition-colors"
            @click="stepVideo(1)"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </template>
      </div>

      <!-- Bottom Caption, Photo/Video Strip & Controls (respects mobile home-indicator safe area) -->
      <div
        class="px-4 pt-3 border-t border-white/10 bg-slate-950/85"
        style="padding-bottom: max(16px, env(safe-area-inset-bottom))"
      >
        <p
          v-if="activeMoment.caption"
          class="max-w-3xl mx-auto text-sm leading-relaxed text-center text-emerald-50/90"
          :class="(modalMode === 'photos' && activeMoment.photos?.length > 1) || (modalMode === 'video' && activeVideos.length > 1) ? 'mb-3' : ''"
        >
          {{ activeMoment.caption }}
        </p>

        <!-- Photo pager & thumbs -->
        <div
          v-if="modalMode === 'photos' && activeMoment.photos?.length > 1"
          class="flex items-center justify-center max-w-4xl gap-2 mx-auto overflow-x-auto"
        >
          <button
            type="button"
            aria-label="Foto sebelumnya"
            class="grid sm:hidden place-items-center w-9 h-9 rounded-full bg-white/10 shrink-0"
            @click="stepPhoto(-1)"
          >
            &lsaquo;
          </button>
          <button
            v-for="(p, idx) in activeMoment.photos"
            :key="p.id"
            type="button"
            :aria-label="`Pilih foto ${idx + 1}`"
            class="w-12 h-9 overflow-hidden rounded-lg border-2 shrink-0 transition-opacity"
            :class="idx === activePhotoIdx ? 'border-amber-300 opacity-100' : 'border-transparent opacity-55 hover:opacity-90'"
            @click="activePhotoIdx = idx"
          >
            <img :src="galleryPhotoSrc(p)" alt="" referrerpolicy="no-referrer" class="object-cover w-full h-full" />
          </button>
          <button
            type="button"
            aria-label="Foto berikutnya"
            class="grid sm:hidden place-items-center w-9 h-9 rounded-full bg-white/10 shrink-0"
            @click="stepPhoto(1)"
          >
            &rsaquo;
          </button>
          <span class="ml-1 text-xs font-semibold tabular-nums text-emerald-100/80 shrink-0">
            {{ activePhotoIdx + 1 }} / {{ activeMoment.photos.length }}
          </span>
        </div>

        <!-- Video pager & selector when moment has multiple videos -->
        <div
          v-else-if="modalMode === 'video' && activeVideos.length > 1"
          class="flex items-center justify-center max-w-4xl gap-2 mx-auto overflow-x-auto"
        >
          <button
            type="button"
            aria-label="Video sebelumnya"
            class="grid sm:hidden place-items-center w-9 h-9 rounded-full bg-white/10 shrink-0"
            @click="stepVideo(-1)"
          >
            &lsaquo;
          </button>
          <button
            v-for="(v, idx) in activeVideos"
            :key="`${v.platform}-${v.id}-${idx}`"
            type="button"
            class="inline-flex items-center gap-1.5 min-h-[34px] px-3 rounded-full text-xs font-bold shrink-0 transition-colors"
            :class="idx === activeVideoIdx ? 'bg-amber-300 text-slate-950' : 'bg-white/10 text-white hover:bg-white/20'"
            @click="activeVideoIdx = idx"
          >
            <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <polygon points="6 4 20 12 6 20 6 4" />
            </svg>
            Video {{ idx + 1 }}
          </button>
          <button
            type="button"
            aria-label="Video berikutnya"
            class="grid sm:hidden place-items-center w-9 h-9 rounded-full bg-white/10 shrink-0"
            @click="stepVideo(1)"
          >
            &rsaquo;
          </button>
          <span class="ml-1 text-xs font-semibold tabular-nums text-emerald-100/80 shrink-0">
            {{ activeVideoIdx + 1 }} / {{ activeVideos.length }}
          </span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import api from '@/services/api'
import SectionHeading from '@/components/landing/SectionHeading.vue'
import { galleryPhotoSrc, momentVideosOf, formatMomentDate, videoPlatformLabel } from '@/utils/galleryMedia'

const INITIAL_LIMIT = 6
const emit = defineEmits(['ready'])

const moments = ref([])
const categories = ref([])
const selectedCategory = ref('all')
const showAll = ref(false)
const brokenCovers = ref({})

function platformShortName(video) {
  if (!video) return 'Video'
  if (video.platform === 'youtube') return 'YouTube'
  if (video.platform === 'gdrive') return 'Google Drive'
  if (video.platform === 'instagram') return 'Instagram'
  return 'Video'
}

const filteredMoments = computed(() => {
  if (selectedCategory.value === 'all') return moments.value
  return moments.value.filter((m) => m.categoryId === selectedCategory.value)
})

const visibleMoments = computed(() =>
  showAll.value ? filteredMoments.value : filteredMoments.value.slice(0, INITIAL_LIMIT),
)

function selectCategory(id) {
  selectedCategory.value = id
  showAll.value = false
}

function coverOf(m) {
  if (m.photos?.length) return galleryPhotoSrc(m.photos[0])
  const firstVideo = momentVideosOf(m)[0]
  if (firstVideo?.thumbnailUrl) return firstVideo.thumbnailUrl
  return ''
}

function cardCtaLabel(m) {
  const n = m.photos?.length || 0
  const v = momentVideosOf(m).length
  if (n > 0 && v > 0) return `Lihat ${n} foto & ${v > 1 ? `${v} video` : 'putar video'}`
  if (v > 0) return v > 1 ? `Putar ${v} video` : 'Putar video'
  return n > 1 ? `Lihat ${n} foto` : 'Lihat foto'
}

onMounted(async () => {
  try {
    const { data } = await api.get('/gallery/public')
    moments.value = Array.isArray(data?.moments) ? data.moments : []
    categories.value = Array.isArray(data?.categories) ? data.categories : []
    if (moments.value.length) {
      await nextTick()
      emit('ready')
    }
  } catch {
    moments.value = []
    categories.value = []
  }
})

/* ===== Lightbox & Inline Player ===== */
const activeMoment = ref(null)
const activePhotoIdx = ref(0)
const activeVideoIdx = ref(0)
const modalMode = ref('photos')
const closeBtnRef = ref(null)
let openerEl = null
let savedBody = null
let touchStartX = 0

const activeVideos = computed(() => momentVideosOf(activeMoment.value))
const activeVideo = computed(() => activeVideos.value[activeVideoIdx.value] || null)

function lockScroll() {
  const scrollbar = window.innerWidth - document.documentElement.clientWidth
  savedBody = { overflow: document.body.style.overflow, paddingRight: document.body.style.paddingRight }
  document.body.style.overflow = 'hidden'
  if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`
}

function unlockScroll() {
  if (!savedBody) return
  document.body.style.overflow = savedBody.overflow
  document.body.style.paddingRight = savedBody.paddingRight
  savedBody = null
}

async function openMoment(m, event) {
  openerEl = event?.currentTarget || null
  activeMoment.value = m
  activePhotoIdx.value = 0
  activeVideoIdx.value = 0
  modalMode.value = m.photos?.length ? 'photos' : 'video'
  lockScroll()
  document.addEventListener('keydown', onKeydown)
  await nextTick()
  closeBtnRef.value?.focus()
}

function closeModal() {
  activeMoment.value = null
  document.removeEventListener('keydown', onKeydown)
  unlockScroll()
  openerEl?.focus?.()
  openerEl = null
}

function stepPhoto(delta) {
  const total = activeMoment.value?.photos?.length || 0
  if (total <= 1) return
  activePhotoIdx.value = (activePhotoIdx.value + delta + total) % total
}

function stepVideo(delta) {
  const total = activeVideos.value.length
  if (total <= 1) return
  activeVideoIdx.value = (activeVideoIdx.value + delta + total) % total
}

function onKeydown(e) {
  if (e.key === 'Escape') closeModal()
  else if (modalMode.value === 'photos' && e.key === 'ArrowRight') stepPhoto(1)
  else if (modalMode.value === 'photos' && e.key === 'ArrowLeft') stepPhoto(-1)
  else if (modalMode.value === 'video' && e.key === 'ArrowRight') stepVideo(1)
  else if (modalMode.value === 'video' && e.key === 'ArrowLeft') stepVideo(-1)
}

function onTouchStart(e) {
  touchStartX = e.changedTouches?.[0]?.clientX || 0
}

function onTouchEnd(e) {
  if (modalMode.value !== 'photos') return
  const dx = (e.changedTouches?.[0]?.clientX || 0) - touchStartX
  if (Math.abs(dx) >= 44) stepPhoto(dx < 0 ? 1 : -1)
}

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  unlockScroll()
})
</script>
