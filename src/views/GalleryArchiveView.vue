<template>
  <div class="min-h-screen font-sans lp flex flex-col !bg-[#03291d]">
    <NavbarComponent />

    <!-- Emerald Header Band (high contrast under floating transparent Navbar) -->
    <section class="relative overflow-hidden lp-emerald lp-on-dark pt-28 pb-16 sm:pt-32 sm:pb-20">
      <div class="lp-wrap lp-page-rise">
        <nav aria-label="Breadcrumb" class="flex items-center justify-center gap-2 mb-5 text-xs sm:text-sm font-medium text-emerald-100/80">
          <router-link to="/" class="transition-colors hover:text-amber-300">
            Beranda
          </router-link>
          <span aria-hidden="true" class="text-amber-300/60">/</span>
          <span class="font-semibold text-amber-300" aria-current="page">Dokumentasi</span>
        </nav>

        <div class="max-w-3xl mx-auto text-center">
          <OrnamentRule class="mb-4" />
          <h1 class="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl text-balance">
            Dokumentasi &amp; Galeri Kegiatan
          </h1>
          <p class="mt-4 text-sm leading-relaxed sm:text-base text-emerald-100/85 text-pretty">
            Arsip potret kegiatan mengaji, munaqosyah, peringatan hari besar Islam, hingga
            kebersamaan santri dan wali di TPQ Amanah Sawotratap.
          </p>
        </div>

        <!-- Search & Category Filter -->
        <div class="max-w-4xl mx-auto mt-8 space-y-4">
          <div class="relative max-w-md mx-auto">
            <svg
              class="absolute w-4 h-4 pointer-events-none left-4 top-1/2 -translate-y-1/2 text-emerald-200/75"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path stroke-linecap="round" d="m20 20-3.5-3.5" />
            </svg>
            <input
              v-model="searchQuery"
              type="search"
              aria-label="Cari dokumentasi kegiatan"
              placeholder="Cari kegiatan, misalnya Munaqosyah, Maulid…"
              class="w-full min-h-[46px] pl-11 pr-4 text-base sm:text-sm text-white placeholder-emerald-100/60 border rounded-xl bg-white/10 border-amber-200/25 focus:outline-none focus:border-amber-300 focus:bg-white/15 transition-colors"
            />
          </div>

          <div
            v-if="categories.length > 1"
            class="flex items-center justify-start gap-2 pb-1 overflow-x-auto sm:justify-center sm:flex-wrap"
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
        </div>
      </div>

      <span class="lp-fringe-bottom" aria-hidden="true"></span>
    </section>

    <!-- Main Archive Grid -->
    <main class="relative flex-1 py-12 lp-ivory sm:py-16">
      <div class="lp-wrap">
        <!-- Loading Skeleton -->
        <div v-if="loading" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          <div
            v-for="n in 6"
            :key="n"
            class="overflow-hidden lp-card animate-pulse"
          >
            <div class="w-full aspect-[4/3] bg-emerald-950/10"></div>
            <div class="p-5 space-y-3">
              <div class="w-24 h-3 rounded bg-emerald-950/10"></div>
              <div class="w-3/4 h-5 rounded bg-emerald-950/15"></div>
              <div class="w-full h-3.5 rounded bg-emerald-950/10"></div>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div
          v-else-if="loadError"
          class="max-w-lg p-8 mx-auto text-center lp-card"
          role="alert"
        >
          <p class="text-base font-bold lp-ink">Gagal memuat dokumentasi</p>
          <p class="mt-2 text-sm lp-body">{{ loadError }}</p>
          <button type="button" class="mt-5 lp-btn-line" @click="fetchGallery">
            Coba Lagi
          </button>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="!filteredMoments.length"
          class="max-w-lg p-10 mx-auto text-center lp-card"
        >
          <p class="text-lg font-bold lp-ink">
            {{ moments.length ? 'Dokumentasi tidak ditemukan' : 'Belum ada dokumentasi tayang' }}
          </p>
          <p class="mt-2 text-sm lp-body">
            {{
              moments.length
                ? 'Coba ubah kata kunci pencarian atau pilih kategori lain.'
                : 'Dokumentasi kegiatan TPQ Amanah akan segera hadir di halaman ini.'
            }}
          </p>
          <div class="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button
              v-if="moments.length && (selectedCategory !== 'all' || searchQuery)"
              type="button"
              class="lp-btn-line"
              @click="resetFilters"
            >
              Tampilkan Semua
            </button>
            <router-link to="/" class="lp-btn-line">
              &larr; Kembali ke Beranda
            </router-link>
          </div>
        </div>

        <!-- Moments Grid -->
        <template v-else>
          <div class="flex flex-wrap items-center justify-between gap-2 mb-6 text-sm lp-body">
            <p>
              Menampilkan <strong class="font-bold lp-ink">{{ visibleMoments.length }}</strong> dari
              <strong class="font-bold lp-ink">{{ filteredMoments.length }}</strong> momen dokumentasi
            </p>
            <button
              v-if="selectedCategory !== 'all' || searchQuery"
              type="button"
              class="font-bold text-emerald-800 hover:underline underline-offset-4"
              @click="resetFilters"
            >
              Reset filter
            </button>
          </div>

          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <article
              v-for="m in visibleMoments"
              :key="m.id"
              class="flex flex-col overflow-hidden lp-card lp-lift group"
            >
              <router-link
                :to="`/dokumentasi/${encodeURIComponent(m.slug || m.id)}`"
                @mouseenter="prefetchDetailView"
                @touchstart.passive="prefetchDetailView"
                class="flex flex-col flex-1 w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber-500"
              >
                <!-- 4:3 Cover -->
                <div class="relative w-full overflow-hidden aspect-[4/3] bg-emerald-950">
                  <img
                    v-if="coverOf(m) && !brokenCovers[m.id]"
                    :src="coverOf(m)"
                    :alt="m.title"
                    width="800"
                    height="600"
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
                <div class="flex flex-col flex-1 p-5">
                  <p class="mb-1.5 text-xs font-semibold text-amber-800">
                    {{ formatMomentDate(m.momentDate) }}
                  </p>
                  <h2 class="text-base font-bold leading-snug lp-ink line-clamp-2">
                    {{ m.title }}
                  </h2>
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

          <!-- Incremental Load More (keeps DOM fast even with 100+ moments) -->
          <div v-if="filteredMoments.length > visibleLimit" class="flex justify-center mt-10">
            <button
              type="button"
              class="lp-btn-line"
              @click="visibleLimit += PAGE_SIZE"
            >
              Muat lebih banyak ({{ filteredMoments.length - visibleLimit }} momen lagi)
            </button>
          </div>
        </template>

        <!-- Helpful CTA Band -->
        <div class="p-6 mt-14 text-center lp-dark-panel sm:p-10">
          <p class="text-xs font-bold tracking-wider uppercase text-amber-300">
            TPQ Amanah Sawotratap
          </p>
          <h2 class="mt-2 text-xl font-extrabold text-white sm:text-2xl text-balance">
            Ingin Putra-Putri Belajar Al-Qur'an dengan Nyaman?
          </h2>
          <p class="max-w-xl mx-auto mt-2 text-sm leading-relaxed text-emerald-100/85">
            Daftar online dari HP sekitar 5 menit, tanpa biaya formulir dan tanpa tes yang menggugurkan.
          </p>
          <div class="flex flex-wrap items-center justify-center gap-3 mt-6">
            <router-link to="/daftar" class="lp-btn-gold">
              Daftar Santri Baru &rarr;
            </router-link>
            <router-link to="/" class="lp-btn-ghost">
              Kembali ke Beranda
            </router-link>
          </div>
        </div>
      </div>
    </main>

    <FooterComponent />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import '@/styles/landing.css'
import api from '@/services/api'
import NavbarComponent from '@/components/NavbarComponent.vue'
import FooterComponent from '@/components/FooterComponent.vue'
import OrnamentRule from '@/components/landing/OrnamentRule.vue'
import { useLenisScroll } from '@/composables/useLenisScroll'
import { applyPageSeo, SITE_URL } from '@/utils/seoMeta'
import {
  galleryPhotoCardSrc,
  momentVideosOf,
  formatMomentDate,
} from '@/utils/galleryMedia'

const PAGE_SIZE = 12

const route = useRoute()
const router = useRouter()
useLenisScroll()

let detailPrefetched = false
function prefetchDetailView() {
  if (detailPrefetched) return
  detailPrefetched = true
  import('@/views/GalleryMomentDetailView.vue').catch(() => {})
}

const loading = ref(true)
const loadError = ref('')
const moments = ref([])
const categories = ref([])
const selectedCategory = ref('all')
const searchQuery = ref('')
const visibleLimit = ref(PAGE_SIZE)
const brokenCovers = ref({})
let restoreSeo = null

const filteredMoments = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return moments.value.filter((m) => {
    if (selectedCategory.value !== 'all' && m.categoryId !== selectedCategory.value) {
      return false
    }
    if (!q) return true
    return (
      (m.title || '').toLowerCase().includes(q) ||
      (m.caption || '').toLowerCase().includes(q) ||
      (m.categoryLabel || '').toLowerCase().includes(q)
    )
  })
})

const visibleMoments = computed(() => filteredMoments.value.slice(0, visibleLimit.value))

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

function selectCategory(id) {
  selectedCategory.value = id
  visibleLimit.value = PAGE_SIZE
  const nextQuery = { ...route.query }
  if (id === 'all') delete nextQuery.kategori
  else nextQuery.kategori = id
  router.replace({ query: nextQuery })
}

function resetFilters() {
  searchQuery.value = ''
  selectCategory('all')
}

function updateSeo() {
  const catObj = categories.value.find((c) => c.id === selectedCategory.value)
  const title = catObj
    ? `Dokumentasi ${catObj.label} | TPQ Amanah Sawotratap`
    : 'Dokumentasi & Galeri Kegiatan | TPQ Amanah Sawotratap'
  const description = catObj
    ? `Kumpulan dokumentasi foto dan video kegiatan ${catObj.label} di TPQ Amanah Sawotratap, Gedangan, Sidoarjo.`
    : 'Kumpulan foto dan video kegiatan mengaji, munaqosyah, peringatan hari besar Islam, dan kebersamaan santri TPQ Amanah Sawotratap, Sidoarjo.'

  restoreSeo = applyPageSeo({
    title,
    description,
    canonicalPath: '/dokumentasi',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Beranda', item: `${SITE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Dokumentasi', item: `${SITE_URL}/dokumentasi` },
          ],
        },
        {
          '@type': 'CollectionPage',
          name: title,
          description,
          url: `${SITE_URL}/dokumentasi`,
          isPartOf: { '@id': `${SITE_URL}/#website` },
        },
      ],
    },
  })
}

async function fetchGallery() {
  loading.value = true
  loadError.value = ''
  try {
    const { data } = await api.get('/gallery/public')
    moments.value = Array.isArray(data?.moments) ? data.moments : []
    categories.value = Array.isArray(data?.categories) ? data.categories : []
    const qCat = String(route.query.kategori || '').trim()
    if (qCat && categories.value.some((c) => c.id === qCat)) {
      selectedCategory.value = qCat
    }
    updateSeo()
  } catch {
    loadError.value = 'Periksa koneksi internet Anda lalu coba muat ulang.'
  } finally {
    loading.value = false
  }
}

watch(selectedCategory, () => {
  if (!loading.value) updateSeo()
})

watch(searchQuery, () => {
  visibleLimit.value = PAGE_SIZE
})

onMounted(() => {
  updateSeo()
  fetchGallery()
})

onBeforeUnmount(() => {
  restoreSeo?.()
})
</script>
