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
        style="scrollbar-width: none"
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
          @click="selectedCategory = 'all'"
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
          @click="selectedCategory = cat.id"
        >
          {{ cat.label }}
        </button>
      </div>

      <!-- Curated 3-Moment Highlight Grid (each links to its shareable SEO detail page) -->
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="m in highlightMoments"
          :key="m.id"
          class="flex flex-col overflow-hidden lp-card lp-lift group"
        >
          <router-link
            :to="`/dokumentasi/${encodeURIComponent(m.slug || m.id)}`"
            @mouseenter="prefetchGalleryPages"
            @touchstart.passive="prefetchGalleryPages"
            class="flex flex-col flex-1 w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber-400"
          >
            <!-- 4:3 Media Cover -->
            <div class="relative w-full overflow-hidden aspect-[4/3] bg-emerald-950">
              <img
                v-if="coverOf(m) && !brokenCovers[m.id]"
                :src="coverOf(m)"
                :alt="m.title"
                width="800"
                height="600"
                loading="lazy"
                decoding="async"
                fetchpriority="low"
                referrerpolicy="no-referrer"
                class="object-cover object-[50%_25%] w-full h-full transition-transform duration-500 group-hover:scale-[1.04]"
                @error="brokenCovers[m.id] = true"
              />
              <div
                v-else
                class="flex flex-col items-center justify-center w-full h-full gap-3 px-6 text-center bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-950 text-amber-200"
              >
                <span class="grid border rounded-full w-14 h-14 place-items-center bg-amber-300/20 border-amber-300/45 text-amber-200">
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
                class="absolute inset-0 grid transition-colors place-items-center bg-slate-950/25 group-hover:bg-slate-950/35"
                aria-hidden="true"
              >
                <span class="grid transition-transform duration-300 rounded-full shadow-lg w-14 h-14 place-items-center bg-amber-400/95 text-slate-950 group-hover:scale-110">
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
                  v-if="m.photos?.length"
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
                  class="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-full shadow-sm bg-amber-400 text-slate-950"
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
              <span class="inline-flex items-center gap-1.5 pt-4 mt-auto text-sm font-bold text-emerald-800 group-hover:underline underline-offset-4">
                <span>{{ cardCtaLabel(m) }}</span>
                <span aria-hidden="true">&rarr;</span>
              </span>
            </div>
          </router-link>
        </article>
      </div>

      <!-- Dedicated Full Gallery Archive CTA -->
      <div class="flex justify-center mt-9">
        <router-link
          :to="archiveTarget"
          @mouseenter="prefetchGalleryPages"
          @touchstart.passive="prefetchGalleryPages"
          class="inline-flex items-center justify-center gap-2.5 min-h-[48px] px-7 rounded-xl border border-amber-200/50 bg-white/10 hover:bg-amber-300 hover:text-slate-950 hover:border-amber-300 text-white text-sm font-bold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        >
          <span>
            {{
              moments.length > HIGHLIGHT_LIMIT
                ? `Lihat Semua Dokumentasi (${moments.length} momen)`
                : 'Buka Halaman Galeri Lengkap'
            }}
          </span>
          <span aria-hidden="true">&rarr;</span>
        </router-link>
      </div>
    </div>

    <span class="lp-fringe-bottom is-paper" aria-hidden="true"></span>
  </section>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import api from '@/services/api'
import SectionHeading from '@/components/landing/SectionHeading.vue'
import {
  galleryPhotoCardSrc,
  momentVideosOf,
  formatMomentDate,
} from '@/utils/galleryMedia'

const HIGHLIGHT_LIMIT = 3
const emit = defineEmits(['ready'])

const moments = ref([])
const categories = ref([])
const selectedCategory = ref('all')
const brokenCovers = ref({})
let pagesPrefetched = false

function prefetchGalleryPages() {
  if (pagesPrefetched) return
  pagesPrefetched = true
  import('@/views/GalleryArchiveView.vue').catch(() => {})
  import('@/views/GalleryMomentDetailView.vue').catch(() => {})
}

const filteredMoments = computed(() => {
  if (selectedCategory.value === 'all') return moments.value
  return moments.value.filter((m) => m.categoryId === selectedCategory.value)
})

const highlightMoments = computed(() => filteredMoments.value.slice(0, HIGHLIGHT_LIMIT))

const archiveTarget = computed(() =>
  selectedCategory.value === 'all'
    ? '/dokumentasi'
    : { path: '/dokumentasi', query: { kategori: selectedCategory.value } },
)

function coverOf(m) {
  if (m.photos?.length) return galleryPhotoCardSrc(m.photos[0])
  const firstVideo = momentVideosOf(m)[0]
  if (firstVideo?.thumbnailUrl) return galleryPhotoCardSrc({ url: firstVideo.thumbnailUrl })
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
</script>
