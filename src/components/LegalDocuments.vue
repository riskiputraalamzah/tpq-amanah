<template>
  <section v-if="visibleDocuments.length" id="legalitas" aria-labelledby="legalitas-title"
    class="lp-section lp-emerald lp-on-dark scroll-mt-28">
    <span class="lp-fringe-top" aria-hidden="true"></span>

    <div class="lp-wrap">
      <SectionHeading dark heading-id="legalitas-title" title="Terdaftar Resmi, dan Dokumennya Bisa Anda Periksa">
        TPQ Amanah terdaftar sebagai Lembaga Pendidikan Al-Qur'an di Kementerian Agama Kabupaten Sidoarjo dan berada di bawah bimbingan Yayasan Belajar Membaca Al-Qur'an (BMQ) At-Tartil. Ketuk dokumen untuk melihatnya lebih jelas.
      </SectionHeading>

      <ul class="flex flex-wrap justify-center gap-5 pb-6 sm:gap-6">
        <li v-for="doc in visibleDocuments" :key="doc.id" class="w-full sm:w-[17rem]">
          <button type="button"
            class="lp-card lp-lift group flex w-full h-full gap-4 p-3 text-left sm:flex-col sm:gap-0 sm:p-4 text-[color:var(--lp-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300"
            @click="openDocument(doc, $event)">
            <span class="block w-24 overflow-hidden rounded-xl shrink-0 sm:w-full aspect-[3/4] bg-stone-100 ring-1 ring-amber-700/20 shadow-md">
              <img :src="documentSrc(doc, 'thumb')" alt="" width="480" height="640" loading="lazy" decoding="async"
                class="object-cover object-top w-full h-full transition-transform duration-500 group-hover:scale-[1.03]" />
            </span>
            <span class="flex flex-col justify-center min-w-0 sm:pt-4 sm:px-1 sm:pb-1">
              <span class="text-base font-bold leading-snug">{{ doc.title }}</span>
              <span class="mt-1 text-sm leading-snug lp-body">{{ doc.issuer }}</span>
              <span class="mt-2 text-sm font-semibold text-emerald-800">{{ doc.summary }}</span>
              <span v-if="doc.redacted"
                class="inline-flex self-start items-center px-2.5 py-1 mt-2 text-xs font-semibold border rounded-full border-amber-700/30 bg-amber-50 text-amber-900">
                Data pribadi disamarkan
              </span>
              <span class="mt-3 text-sm font-bold text-emerald-700 underline-offset-4 group-hover:underline">Lihat dokumen &rarr;</span>
            </span>
          </button>
        </li>
      </ul>
    </div>
    <span class="lp-fringe-bottom is-paper" aria-hidden="true"></span>
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
import SectionHeading from '@/components/landing/SectionHeading.vue'
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
