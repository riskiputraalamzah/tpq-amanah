<template>
  <section v-if="visibleDocuments.length" id="legalitas" aria-labelledby="legalitas-title"
    class="py-20 lg:py-28 bg-gradient-to-br from-[#063f2e] via-[#094d39] to-[#042d21] text-white scroll-mt-28 relative overflow-hidden">
    <div class="absolute inset-0 islamic-pattern opacity-[0.06] pointer-events-none"></div>

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-3xl mx-auto mb-12 sm:mb-14">
        <div class="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-amber-300 uppercase bg-white/10 px-4 py-1.5 rounded-full border border-white/15 mb-4">
          Legalitas Lembaga
        </div>
        <h2 id="legalitas-title" class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight mb-4 text-balance">
          Terdaftar Resmi, dan Dokumennya Bisa Anda Periksa
        </h2>
        <p class="text-emerald-100/90 text-base sm:text-lg leading-relaxed">
          TPQ Amanah terdaftar sebagai Lembaga Pendidikan Al-Qur'an di Kementerian Agama Kabupaten Sidoarjo dan berada di bawah bimbingan Yayasan Belajar Membaca Al-Qur'an (BMQ) At-Tartil. Ketuk dokumen untuk melihatnya lebih jelas.
        </p>
      </div>

      <ul class="flex flex-wrap justify-center gap-5 sm:gap-6">
        <li v-for="doc in visibleDocuments" :key="doc.id" class="w-full sm:w-[17rem]">
          <button type="button"
            class="group w-full h-full flex sm:flex-col gap-4 sm:gap-0 text-left bg-white text-slate-900 rounded-3xl p-3 sm:p-4 shadow-lg shadow-black/20 hover:-translate-y-1 hover:shadow-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
            @click="openDocument(doc, $event)">
            <span class="block shrink-0 w-24 sm:w-full aspect-[3/4] overflow-hidden rounded-2xl bg-slate-100 border border-slate-200">
              <img :src="documentSrc(doc, 'thumb')" alt="" width="480" height="640" loading="lazy" decoding="async"
                class="w-full h-full object-cover object-top" />
            </span>
            <span class="flex flex-col justify-center min-w-0 sm:pt-4 sm:px-1 sm:pb-1">
              <span class="text-base font-bold leading-snug">{{ doc.title }}</span>
              <span class="mt-1 text-sm text-slate-600 leading-snug">{{ doc.issuer }}</span>
              <span class="mt-2 text-sm font-semibold text-emerald-800">{{ doc.summary }}</span>
              <span v-if="doc.redacted"
                class="mt-2 inline-flex self-start items-center rounded-full bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-1">
                Data pribadi disamarkan
              </span>
              <span class="mt-3 text-sm font-bold text-emerald-700 group-hover:underline underline-offset-4">Lihat dokumen &rarr;</span>
            </span>
          </button>
        </li>
      </ul>
    </div>
  </section>

  <Teleport to="body">
    <div v-if="activeDoc" ref="dialogRef" role="dialog" aria-modal="true" :aria-label="activeDoc.title" data-lenis-prevent
      class="fixed inset-0 z-[60] flex flex-col bg-slate-950/95 backdrop-blur-sm text-white">
      <div class="flex items-start justify-between gap-3 px-4 pt-3 pb-2">
        <div class="min-w-0">
          <p class="font-bold leading-snug">{{ activeDoc.title }}</p>
          <p class="text-sm text-emerald-100/80 leading-snug">{{ activeDoc.issuer }}</p>
        </div>
        <button ref="closeButtonRef" type="button" aria-label="Tutup dokumen"
          class="shrink-0 grid place-items-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          @click="closeDocument">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <p class="px-4 pb-2 text-sm text-emerald-100/90 leading-snug">{{ activeDoc.facts.join('  ·  ') }}</p>

      <div class="flex-1 min-h-0 overflow-auto px-3 pb-2" :class="zoomed ? '' : 'flex items-center justify-center'"
        style="touch-action: pan-x pan-y pinch-zoom" @click.self="closeDocument">
        <img :src="documentSrc(activeDoc)" :alt="activeDoc.alt" :width="activeDoc.width" :height="activeDoc.height"
          class="mx-auto rounded-lg bg-white shadow-2xl select-none"
          :class="zoomed ? 'w-[max(100%,56rem)] cursor-zoom-out' : 'max-h-full max-w-full w-auto h-auto object-contain cursor-zoom-in'"
          :style="zoomed ? { maxWidth: `${activeDoc.width}px` } : null"
          @click="zoomed = !zoomed" />
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 px-4 pt-2 pb-4">
        <div v-if="visibleDocuments.length > 1" class="flex items-center gap-1.5">
          <button type="button" aria-label="Dokumen sebelumnya"
            class="grid place-items-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 transition-colors" @click="step(-1)">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span class="min-w-[3.5rem] text-center text-sm font-semibold tabular-nums" aria-live="polite">{{ activeIndex + 1 }} / {{ visibleDocuments.length }}</span>
          <button type="button" aria-label="Dokumen berikutnya"
            class="grid place-items-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 transition-colors" @click="step(1)">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <span v-else></span>

        <div class="flex items-center gap-2">
          <button type="button"
            class="min-h-11 px-4 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-bold transition-colors"
            @click="zoomed = !zoomed">
            {{ zoomed ? 'Perkecil' : 'Perbesar' }}
          </button>
          <a :href="documentSrc(activeDoc)" target="_blank" rel="noopener noreferrer"
            class="inline-flex items-center min-h-11 px-4 rounded-full bg-white/10 hover:bg-white/20 text-sm font-semibold transition-colors">
            Buka gambar &#8599;
          </a>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import api from '@/services/api'
import { legalDocuments, documentSrc } from '@/data/legalDocuments'

// Documents stay hidden until the server confirms what may be shown. If the settings cannot be
// read, nothing is displayed, so a document an admin switched off never flashes onto the page.
const settings = ref(null)

const normalize = (raw) => ({
  enabled: raw?.enabled !== false,
  hiddenIds: Array.isArray(raw?.hiddenIds) ? raw.hiddenIds.filter((id) => typeof id === 'string') : [],
})

const visibleDocuments = computed(() => {
  if (!settings.value?.enabled) return []
  return legalDocuments.filter((doc) => !settings.value.hiddenIds.includes(doc.id))
})

onMounted(async () => {
  try {
    const { data } = await api.get('/content')
    settings.value = normalize(data?.legalitas)
  } catch {
    settings.value = null
  }
})

/* ===== Viewer ===== */

const activeId = ref(null)
const zoomed = ref(false)
const dialogRef = ref(null)
const closeButtonRef = ref(null)
let opener = null
let savedBody = null

const activeIndex = computed(() => visibleDocuments.value.findIndex((doc) => doc.id === activeId.value))
const activeDoc = computed(() => visibleDocuments.value[activeIndex.value] ?? null)

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

async function openDocument(doc, event) {
  opener = event.currentTarget
  activeId.value = doc.id
  zoomed.value = false
  lockScroll()
  document.addEventListener('keydown', onKeydown)
  await nextTick()
  closeButtonRef.value?.focus()
}

function closeDocument() {
  activeId.value = null
  document.removeEventListener('keydown', onKeydown)
  unlockScroll()
  opener?.focus()
  opener = null
}

function step(direction) {
  const total = visibleDocuments.value.length
  if (!total) return
  const next = (activeIndex.value + direction + total) % total
  activeId.value = visibleDocuments.value[next].id
  zoomed.value = false
}

function onKeydown(event) {
  if (event.key === 'Escape') {
    closeDocument()
  } else if (event.key === 'ArrowLeft') {
    step(-1)
  } else if (event.key === 'ArrowRight') {
    step(1)
  } else if (event.key === 'Tab' && dialogRef.value) {
    // Keep keyboard focus inside the open dialog.
    const focusable = [...dialogRef.value.querySelectorAll('button, a[href]')]
    if (!focusable.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
}

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  unlockScroll()
})
</script>
