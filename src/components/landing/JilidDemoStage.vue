<template>
  <div
    ref="rootEl"
    class="jd"
    :class="[`is-j${jilid}`, { 'is-paused': isPaused, 'is-reduced': reducedMotion }]"
    role="region"
    :aria-label="`Peraga interaktif materi Jilid ${jilid}: ${meta.subtitle}`"
  >
    <!-- Top bar: subtle stage label + play/pause control -->
    <div class="jd-top">
      <div class="jd-label">
        <span class="jd-dot" :class="{ 'is-live': isRunning }" aria-hidden="true"></span>
        <span>{{ meta.subtitle }}</span>
      </div>
      <button
        type="button"
        class="jd-ctrl"
        :aria-label="isPaused ? `Putar peraga Jilid ${jilid}` : `Jeda peraga Jilid ${jilid}`"
        :aria-pressed="isPaused"
        @click="togglePause"
      >
        <svg v-if="isPaused" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <polygon points="6,4 20,12 6,20" />
        </svg>
        <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
        <span>{{ isPaused ? 'Putar' : 'Jeda' }}</span>
      </button>
    </div>

    <!-- ================================================================ -->
    <!-- JILID 1: Huruf Tunggal Hijaiyah & Fathah (titik pembeda + 1 beat) -->
    <!-- ================================================================ -->
    <div v-if="jilid === 1" class="jd-body">
      <div class="jd-j1-tiles" dir="rtl" role="group" aria-label="Pilih contoh huruf Jilid 1">
        <button
          v-for="(item, i) in J1_ITEMS"
          :key="item.latin"
          type="button"
          class="jd-j1-tile"
          :class="{ 'is-active': step === i }"
          :aria-pressed="step === i"
          @click="selectStep(i)"
        >
          <span class="jd-arab jd-j1-glyph" lang="ar">{{ item.arab }}</span>
          <span class="jd-j1-latin">{{ item.latin }}</span>
          <span class="jd-j1-dots" aria-hidden="true">
            <i v-for="d in item.dots" :key="d" class="jd-j1-pip"></i>
          </span>
        </button>
      </div>
      <div class="jd-caption">
        <span class="jd-tag">1 ketukan tegas</span>
        <span class="jd-cap-text">
          <strong>{{ J1_ITEMS[step].latin }}</strong> · {{ J1_ITEMS[step].hint }}
        </span>
      </div>
    </div>

    <!-- ================================================================ -->
    <!-- JILID 2: Huruf Sambung & Kasrah / Dhammah (terpisah -> menyatu)  -->
    <!-- ================================================================ -->
    <div v-else-if="jilid === 2" class="jd-body">
      <div class="jd-j2-arena" @click="toggleJ2Join">
        <!-- Phase A: Separated letters sliding inward -->
        <div
          class="jd-j2-split"
          :class="{ 'is-merging': j2Joined }"
          dir="rtl"
          aria-hidden="true"
        >
          <div
            v-for="(part, idx) in activeJ2.parts"
            :key="`${j2WordIdx}-${idx}`"
            class="jd-j2-piece"
            :class="`is-pos-${idx}`"
          >
            <span class="jd-arab jd-j2-char" lang="ar">{{ part.arab }}</span>
            <span class="jd-j2-vowel">{{ part.vowel }}</span>
          </div>
        </div>

        <!-- Phase B: Joined word revealed smoothly -->
        <div class="jd-j2-joined" :class="{ 'is-shown': j2Joined }">
          <span class="jd-arab jd-j2-word" dir="rtl" lang="ar">{{ activeJ2.joined }}</span>
          <svg class="jd-j2-arc" viewBox="0 0 180 16" fill="none" aria-hidden="true">
            <path
              d="M12 6 Q90 16 168 6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
          <span class="jd-j2-reading">{{ activeJ2.reading }}</span>
        </div>
      </div>

      <div class="jd-controls-row">
        <div class="jd-pill-group" role="group" aria-label="Fase huruf sambung">
          <button
            type="button"
            class="jd-pill"
            :aria-pressed="!j2Joined"
            @click="setJ2State(false)"
          >
            Terpisah
          </button>
          <button
            type="button"
            class="jd-pill"
            :aria-pressed="j2Joined"
            @click="setJ2State(true)"
          >
            Bersambung
          </button>
        </div>
        <div class="jd-pill-group" role="group" aria-label="Pilih contoh kata Jilid 2">
          <button
            v-for="(w, i) in J2_WORDS"
            :key="w.reading"
            type="button"
            class="jd-pill jd-arab-pill"
            lang="ar"
            dir="rtl"
            :aria-pressed="j2WordIdx === i"
            @click="selectJ2Word(i)"
          >
            {{ w.joined }}
          </button>
        </div>
      </div>
    </div>

    <!-- ================================================================ -->
    <!-- JILID 3: Kaidah Mad Thabi'i (1 ketukan pendek vs 2 ketukan mad)  -->
    <!-- ================================================================ -->
    <div v-else-if="jilid === 3" class="jd-body">
      <div class="jd-j3-compare" dir="rtl">
        <!-- Short 1 beat -->
        <button
          type="button"
          class="jd-j3-card"
          :class="{ 'is-active': !j3IsLong }"
          :aria-pressed="!j3IsLong"
          @click="setJ3Phase(0)"
        >
          <span class="jd-j3-badge">Pendek · 1 ketukan</span>
          <span class="jd-arab jd-j3-glyph" lang="ar">{{ activeJ3.shortArab }}</span>
          <span class="jd-j3-latin">{{ activeJ3.shortLatin }}</span>
          <div class="jd-j3-meter is-short" aria-hidden="true">
            <span class="jd-beat-dot"></span>
          </div>
        </button>

        <!-- Long 2 beats (Mad Thabi'i) -->
        <button
          type="button"
          class="jd-j3-card is-mad"
          :class="{ 'is-active': j3IsLong }"
          :aria-pressed="j3IsLong"
          @click="setJ3Phase(1)"
        >
          <span class="jd-j3-badge is-gold">Mad · 2 harakat</span>
          <span class="jd-arab jd-j3-glyph" lang="ar">
            <span>{{ activeJ3.baseArab }}</span><span class="jd-gold-accent">{{ activeJ3.madArab }}</span>
          </span>
          <span class="jd-j3-latin">{{ activeJ3.longLatin }}</span>
          <div class="jd-j3-meter is-long" aria-hidden="true">
            <span class="jd-beat-dot"></span>
            <span class="jd-beat-bar"><i class="jd-beat-fill"></i></span>
            <span class="jd-beat-dot"></span>
          </div>
        </button>
      </div>

      <div class="jd-controls-row">
        <div class="jd-pill-group" role="group" aria-label="Pilih huruf mad Jilid 3">
          <button
            v-for="(m, i) in J3_ITEMS"
            :key="m.id"
            type="button"
            class="jd-pill"
            :aria-pressed="j3Idx === i"
            @click="selectJ3Item(i)"
          >
            <span class="jd-arab" lang="ar" dir="rtl">{{ m.fullArab }}</span>
            <span>{{ m.label }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ================================================================ -->
    <!-- JILID 4: Tanwin, Sukun & Pantulan Qolqolah (ق ط ب ج د)          -->
    <!-- ================================================================ -->
    <div v-else-if="jilid === 4" class="jd-body">
      <div class="jd-j4-stage">
        <div class="jd-j4-word-wrap" :key="`q-${step}-${pulseKey}`">
          <span class="jd-arab jd-j4-word" dir="rtl" lang="ar">{{ activeJ4.example }}</span>
          <!-- SVG Rebound Arc visualizing crisp Qolqolah bounce -->
          <svg class="jd-j4-arc" viewBox="0 0 160 36" fill="none" aria-hidden="true">
            <path
              class="jd-j4-path"
              d="M126 10 Q96 34 72 16 Q50 2 28 24"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-dasharray="4 4"
            />
            <circle class="jd-j4-ball" cx="72" cy="16" r="4.5" fill="currentColor" />
          </svg>
        </div>

        <div class="jd-j4-info">
          <span class="jd-tag">Pantul jernih</span>
          <strong>{{ activeJ4.reading }}</strong>
          <span class="jd-cap-text">{{ activeJ4.hint }}</span>
        </div>
      </div>

      <div class="jd-pill-group jd-j4-letters" dir="rtl" role="group" aria-label="5 huruf Qolqolah">
        <button
          v-for="(q, i) in J4_ITEMS"
          :key="q.letter"
          type="button"
          class="jd-pill jd-q-btn"
          :aria-pressed="step === i"
          @click="selectStep(i)"
        >
          <span class="jd-arab" lang="ar">{{ q.letter }}</span>
        </button>
      </div>
    </div>

    <!-- ================================================================ -->
    <!-- JILID 5: Tasydid, Idgham & Ghunnah (gelombang dengung 2 harakat) -->
    <!-- ================================================================ -->
    <div v-else-if="jilid === 5" class="jd-body">
      <div class="jd-j5-stage" :key="`g-${step}-${pulseKey}`">
        <!-- Acoustic hum wave SVG above the Arabic word -->
        <div class="jd-j5-waves" aria-hidden="true">
          <span class="jd-wave is-w1"></span>
          <span class="jd-wave is-w2"></span>
          <span class="jd-wave is-w3"></span>
          <span class="jd-wave is-w4"></span>
          <span class="jd-wave is-w5"></span>
        </div>

        <div class="jd-arab jd-j5-word" dir="rtl" lang="ar">
          <span>{{ activeJ5.before }}</span><span class="jd-gold-accent">{{ activeJ5.focus }}</span><span>{{ activeJ5.after }}</span>
        </div>

        <div class="jd-j5-hold" aria-hidden="true">
          <span class="jd-j5-hold-label">Dengung · 2 harakat</span>
          <span class="jd-j5-track"><i class="jd-j5-fill"></i></span>
        </div>

        <p class="jd-j5-desc">
          <strong>{{ activeJ5.reading }}</strong> · {{ activeJ5.hint }}
        </p>
      </div>

      <div class="jd-pill-group" role="group" aria-label="Pilih contoh dengung Jilid 5">
        <button
          v-for="(g, i) in J5_ITEMS"
          :key="g.label"
          type="button"
          class="jd-pill"
          :aria-pressed="step === i"
          @click="selectStep(i)"
        >
          <span class="jd-arab" lang="ar" dir="rtl">{{ g.chipArab }}</span>
          <span>{{ g.label }}</span>
        </button>
      </div>
    </div>

    <!-- ================================================================ -->
    <!-- JILID 6: Tanda Waqaf & Transisi Mushaf                           -->
    <!-- ================================================================ -->
    <div v-else class="jd-body">
      <div class="jd-j6-mushaf" :key="`w-${step}-${pulseKey}`">
        <div class="jd-j6-badge-row">
          <span class="jd-arab jd-j6-sign" lang="ar" dir="rtl">{{ activeJ6.sign }}</span>
          <div class="jd-j6-meta">
            <strong>{{ activeJ6.name }}</strong>
            <span>{{ activeJ6.rule }}</span>
          </div>
          <span class="jd-j6-action" :class="activeJ6.tone">{{ activeJ6.action }}</span>
        </div>

        <!-- Mini mushaf reading flow bar (RTL: flows right-to-left, pauses or continues at waqaf sign) -->
        <div class="jd-j6-flow" aria-hidden="true">
          <span class="jd-j6-track">
            <i class="jd-j6-cursor" :class="activeJ6.continues ? 'is-continue' : 'is-stop'"></i>
          </span>
          <span class="jd-j6-marker" :class="activeJ6.tone">
            <span class="jd-arab" lang="ar">{{ activeJ6.sign }}</span>
          </span>
        </div>

        <p class="jd-j6-hint">{{ activeJ6.hint }}</p>
      </div>

      <div class="jd-pill-group" dir="rtl" role="group" aria-label="Pilih tanda waqaf Jilid 6">
        <button
          v-for="(w, i) in J6_ITEMS"
          :key="w.name"
          type="button"
          class="jd-pill jd-w-btn"
          :aria-pressed="step === i"
          @click="selectStep(i)"
        >
          <span class="jd-arab" lang="ar">{{ w.sign }}</span>
          <span class="jd-w-short" dir="ltr">{{ w.short }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  jilid: {
    type: Number,
    required: true,
    validator: (v) => v >= 1 && v <= 6,
  },
})

const META = {
  1: { subtitle: 'Peraga Jilid 1 · Huruf & Titik', steps: 3, interval: 1850 },
  2: { subtitle: 'Peraga Jilid 2 · Huruf Sambung', steps: 4, interval: 2200 },
  3: { subtitle: 'Peraga Jilid 3 · Ritme 2 Harakat', steps: 6, interval: 1850 },
  4: { subtitle: 'Peraga Jilid 4 · Pantulan Qolqolah', steps: 5, interval: 1950 },
  5: { subtitle: 'Peraga Jilid 5 · Dengung Ghunnah', steps: 3, interval: 2500 },
  6: { subtitle: 'Peraga Jilid 6 · Tanda Waqaf Mushaf', steps: 4, interval: 2450 },
}

const J1_ITEMS = [
  { arab: 'بَ', latin: 'BA', dots: 1, hint: '1 titik di bawah' },
  { arab: 'تَ', latin: 'TA', dots: 2, hint: '2 titik di atas' },
  { arab: 'ثَ', latin: 'TSA', dots: 3, hint: '3 titik di atas' },
]

const J2_WORDS = [
  {
    joined: 'كُتِبَ',
    reading: 'KU · TI · BA',
    parts: [
      { arab: 'كُ', vowel: 'u' },
      { arab: 'تِ', vowel: 'i' },
      { arab: 'بَ', vowel: 'a' },
    ],
  },
  {
    joined: 'عَمِلَ',
    reading: "'A · MI · LA",
    parts: [
      { arab: 'عَ', vowel: 'a' },
      { arab: 'مِ', vowel: 'i' },
      { arab: 'لَ', vowel: 'a' },
    ],
  },
]

const J3_ITEMS = [
  { id: 'alif', shortArab: 'بَ', shortLatin: 'ba', baseArab: 'بَ\u200D', madArab: '\u200Dا', fullArab: 'بَا', longLatin: 'baa', label: 'Alif' },
  { id: 'ya', shortArab: 'بِ', shortLatin: 'bi', baseArab: 'بِ\u200D', madArab: '\u200Dيْ', fullArab: 'بِيْ', longLatin: 'bii', label: "Ya'" },
  { id: 'waw', shortArab: 'بُ', shortLatin: 'bu', baseArab: 'بُ\u200D', madArab: '\u200Dوْ', fullArab: 'بُوْ', longLatin: 'buu', label: 'Wawu' },
]

const J4_ITEMS = [
  { letter: 'ب', example: 'اَبْ', reading: 'ab-e', hint: 'Ba sukun memantul ringan' },
  { letter: 'ج', example: 'اَجْ', reading: 'aj-e', hint: 'Jim sukun memantul jelas' },
  { letter: 'د', example: 'اَدْ', reading: 'ad-e', hint: 'Dal sukun memantul tegas' },
  { letter: 'ط', example: 'اَطْ', reading: 'ath-e', hint: 'Tha sukun tebal & memantul' },
  { letter: 'ق', example: 'اَقْ', reading: 'aq-e', hint: 'Qaf sukun pangkal lidah memantul' },
]

const J5_ITEMS = [
  { before: 'اِ', focus: 'نَّ', after: '', chipArab: 'اِنَّ', label: 'Nun Tasydid', reading: 'in—na', hint: 'Tahan dengung 2 harakat di hidung' },
  { before: 'عَ\u200D', focus: '\u200Dمَّ', after: '', chipArab: 'عَمَّ', label: 'Mim Tasydid', reading: "'am—ma", hint: 'Bibir rapat, dengung lembut 2 harakat' },
  { before: 'مِ\u200D', focus: '\u200Dنْ مَّ\u200D', after: '\u200Dاءٍ', chipArab: 'مِنْ مَّاءٍ', label: 'Idgham', reading: 'mim—maa’in', hint: 'Nun sukun melebur ke Mim berdengung' },
]

const J6_ITEMS = [
  { sign: 'مـ', short: 'Lazim', name: 'Waqaf Lazim', rule: 'Wajib berhenti di sini', action: 'Berhenti', tone: 'is-stop', continues: false, hint: 'Berhenti agar makna ayat tetap tepat, lalu lanjutkan ayat berikutnya.' },
  { sign: 'قلى', short: 'Aula', name: 'Al-Waqfu Aula', rule: 'Lebih utama berhenti', action: 'Utama berhenti', tone: 'is-gold', continues: false, hint: 'Disarankan berhenti sejenak untuk mengambil napas dengan tenang.' },
  { sign: 'ج', short: 'Jaiz', name: 'Waqaf Jaiz', rule: 'Boleh berhenti atau lanjut', action: 'Boleh berhenti', tone: 'is-mint', continues: false, hint: 'Santri berlatih memilih jeda napas yang tepat saat membaca mushaf.' },
  { sign: 'لا', short: 'Wasal', name: 'La Waqfa Fihi', rule: 'Teruskan bacaan', action: 'Lanjut', tone: 'is-go', continues: true, hint: 'Hindari berhenti di tengah kalimat; sambung bacaan hingga tanda berikutnya.' },
]

const meta = computed(() => META[props.jilid] || META[1])

const rootEl = ref(null)
const step = ref(0)
const pulseKey = ref(0)
const userPaused = ref(false)
const inView = ref(false)
const tabVisible = ref(true)
const reducedMotion = ref(false)

// Derived states for multi-axis stages (Jilid 2 & Jilid 3)
// Jilid 2: steps 0..3 -> (word 0 split, word 0 joined, word 1 split, word 1 joined)
const j2WordIdx = computed(() => Math.floor(step.value / 2) % J2_WORDS.length)
const j2Joined = computed(() => step.value % 2 === 1)
const activeJ2 = computed(() => J2_WORDS[j2WordIdx.value])

// Jilid 3: steps 0..5 -> pairs of (short, long) across Alif, Ya', Wawu
const j3Idx = computed(() => Math.floor(step.value / 2) % J3_ITEMS.length)
const j3IsLong = computed(() => step.value % 2 === 1)
const activeJ3 = computed(() => J3_ITEMS[j3Idx.value])

const activeJ4 = computed(() => J4_ITEMS[step.value % J4_ITEMS.length])
const activeJ5 = computed(() => J5_ITEMS[step.value % J5_ITEMS.length])
const activeJ6 = computed(() => J6_ITEMS[step.value % J6_ITEMS.length])

const isPaused = computed(() => userPaused.value || reducedMotion.value)
const isRunning = computed(() => !isPaused.value && inView.value && tabVisible.value)

let timer = null
let io = null
let motionMq = null

function clearTick() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function syncTimer() {
  clearTick()
  if (!isRunning.value) return
  timer = setInterval(() => {
    step.value = (step.value + 1) % meta.value.steps
    pulseKey.value += 1
  }, meta.value.interval)
}

function selectStep(i) {
  step.value = i % meta.value.steps
  pulseKey.value += 1
  syncTimer()
}

function togglePause() {
  if (reducedMotion.value) {
    // Allow explicit manual play even if OS prefers reduced motion
    reducedMotion.value = false
    userPaused.value = false
  } else {
    userPaused.value = !userPaused.value
  }
  syncTimer()
}

function setJ2State(joined) {
  step.value = j2WordIdx.value * 2 + (joined ? 1 : 0)
  pulseKey.value += 1
  syncTimer()
}

function toggleJ2Join() {
  setJ2State(!j2Joined.value)
}

function selectJ2Word(idx) {
  // Show separated first so the user immediately sees the merge on the next beat
  step.value = idx * 2
  pulseKey.value += 1
  syncTimer()
}

function setJ3Phase(longFlag) {
  step.value = j3Idx.value * 2 + (longFlag ? 1 : 0)
  pulseKey.value += 1
  syncTimer()
}

function selectJ3Item(idx) {
  step.value = idx * 2 + 1 // jump straight to the Mad Thabi'i comparison highlight
  pulseKey.value += 1
  syncTimer()
}

function handleVisibility() {
  tabVisible.value = typeof document === 'undefined' ? true : !document.hidden
  syncTimer()
}

function handleReducedMotion(e) {
  reducedMotion.value = !!e.matches
  syncTimer()
}

onMounted(() => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    motionMq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotion.value = !!motionMq.matches
    if (motionMq.addEventListener) motionMq.addEventListener('change', handleReducedMotion)
    else if (motionMq.addListener) motionMq.addListener(handleReducedMotion)
  }

  if (typeof document !== 'undefined') {
    tabVisible.value = !document.hidden
    document.addEventListener('visibilitychange', handleVisibility)
  }

  if (typeof IntersectionObserver !== 'undefined' && rootEl.value) {
    io = new IntersectionObserver(
      (entries) => {
        inView.value = entries.some((e) => e.isIntersecting)
        syncTimer()
      },
      { threshold: 0.25 },
    )
    io.observe(rootEl.value)
  } else {
    inView.value = true
    syncTimer()
  }
})

onBeforeUnmount(() => {
  clearTick()
  if (io) io.disconnect()
  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', handleVisibility)
  }
  if (motionMq) {
    if (motionMq.removeEventListener) motionMq.removeEventListener('change', handleReducedMotion)
    else if (motionMq.removeListener) motionMq.removeListener(handleReducedMotion)
  }
})
</script>

<style scoped>
.jd {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  border-radius: 1.5rem;
  background: linear-gradient(155deg, #053d2c 0%, #03291d 100%);
  border: 1px solid rgba(252, 211, 77, 0.24);
  box-shadow: 0 22px 44px -28px rgba(3, 41, 29, 0.65);
  color: #ecfdf5;
  overflow: hidden;
  min-width: 0;
}

@media (min-width: 640px) {
  .jd {
    padding: 18px 20px;
  }
}

.jd::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: var(--lp-khatam-gold);
  background-size: 56px 56px;
  opacity: 0.055;
  pointer-events: none;
}

.jd::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 42%, rgba(252, 211, 77, 0.12), transparent 68%);
  pointer-events: none;
}

.jd > * {
  position: relative;
  z-index: 1;
}

/* Header */
.jd-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.jd-label {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.76rem;
  font-weight: 700;
  color: #fde68a;
  min-width: 0;
}

.jd-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(252, 211, 77, 0.35);
  flex: none;
  transition: background 0.25s ease;
}

.jd-dot.is-live {
  background: #34d399;
  box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.22);
}

.jd-ctrl {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 32px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(252, 211, 77, 0.26);
  background: rgba(255, 255, 255, 0.06);
  color: #fef3c7;
  font: inherit;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  flex: none;
  transition: background 0.18s ease, border-color 0.18s ease;
}

.jd-ctrl:hover {
  background: rgba(252, 211, 77, 0.14);
  border-color: rgba(252, 211, 77, 0.5);
}

.jd-body {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  flex: 1;
}

.jd-arab {
  font-family: "Amiri", "Traditional Arabic", serif;
  font-weight: 700;
  line-height: 1.65;
  text-rendering: optimizeLegibility;
}

.jd-gold-accent {
  color: #fcd34d;
}

.jd-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 9px;
  border-radius: 999px;
  background: rgba(252, 211, 77, 0.15);
  border: 1px solid rgba(252, 211, 77, 0.32);
  color: #fde68a;
  font-size: 0.7rem;
  font-weight: 700;
  white-space: nowrap;
}

.jd-caption {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px 10px;
  text-align: center;
}

.jd-cap-text {
  font-size: 0.8rem;
  color: rgba(236, 253, 245, 0.86);
}

.jd-cap-text strong {
  color: #fff;
}

/* Shared interactive pills */
.jd-controls-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.jd-pill-group {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
}

.jd-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-height: 34px;
  padding: 2px 11px;
  border-radius: 999px;
  border: 1px solid rgba(252, 211, 77, 0.22);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(236, 253, 245, 0.85);
  font: inherit;
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.jd-pill:hover {
  background: rgba(252, 211, 77, 0.12);
}

.jd-pill[aria-pressed="true"] {
  background: rgba(252, 211, 77, 0.22);
  border-color: #fcd34d;
  color: #fef3c7;
}

.jd-arab-pill {
  font-family: "Amiri", serif;
  font-size: 0.98rem;
  line-height: 1.3;
  padding: 2px 12px;
}

/* ======================== JILID 1 ======================== */
.jd-j1-tiles {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.jd-j1-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 12px 6px 10px;
  border-radius: 16px;
  border: 1px solid rgba(252, 211, 77, 0.16);
  background: rgba(255, 255, 255, 0.045);
  color: rgba(236, 253, 245, 0.78);
  font: inherit;
  cursor: pointer;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), background 0.25s ease, border-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease;
}

.jd-j1-tile.is-active {
  transform: translateY(-4px);
  background: rgba(252, 211, 77, 0.14);
  border-color: rgba(252, 211, 77, 0.72);
  color: #fff;
  box-shadow: 0 12px 24px -16px rgba(252, 211, 77, 0.65);
}

.jd-j1-glyph {
  font-size: clamp(2.1rem, 5vw, 2.75rem);
  line-height: 1.5;
}

.jd-j1-latin {
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #fde68a;
}

.jd-j1-dots {
  display: inline-flex;
  gap: 4px;
  margin-top: 4px;
  min-height: 7px;
}

.jd-j1-pip {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(252, 211, 77, 0.3);
  transition: background 0.25s ease, transform 0.25s ease;
}

.jd-j1-tile.is-active .jd-j1-pip {
  background: #fcd34d;
  transform: scale(1.2);
}

/* ======================== JILID 2 ======================== */
.jd-j2-arena {
  position: relative;
  min-height: 118px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  border: 1px solid rgba(252, 211, 77, 0.15);
  background: rgba(255, 255, 255, 0.04);
  cursor: pointer;
  overflow: hidden;
  padding: 10px;
}

.jd-j2-split {
  grid-area: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(12px, 4vw, 26px);
  transition: opacity 0.42s cubic-bezier(0.16, 1, 0.3, 1);
}

.jd-j2-split.is-merging {
  opacity: 0;
  pointer-events: none;
}

.jd-j2-piece {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 10px 6px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(252, 211, 77, 0.2);
  transition: transform 0.48s cubic-bezier(0.16, 1, 0.3, 1);
}

.jd-j2-split.is-merging .jd-j2-piece.is-pos-0 {
  transform: translateX(-28px) scale(0.86);
}

.jd-j2-split.is-merging .jd-j2-piece.is-pos-1 {
  transform: scale(0.86);
}

.jd-j2-split.is-merging .jd-j2-piece.is-pos-2 {
  transform: translateX(28px) scale(0.86);
}

.jd-j2-char {
  font-size: clamp(1.95rem, 4.6vw, 2.45rem);
  line-height: 1.5;
  color: #fff;
}

.jd-j2-vowel {
  font-size: 0.7rem;
  font-weight: 800;
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(252, 211, 77, 0.16);
  color: #fde68a;
}

.jd-j2-joined {
  grid-area: 1 / 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0;
  transform: scale(0.9);
  pointer-events: none;
  transition: opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1), transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

.jd-j2-joined.is-shown {
  opacity: 1;
  transform: scale(1);
}

.jd-j2-word {
  font-size: clamp(2.4rem, 5.5vw, 3.1rem);
  line-height: 1.45;
  color: #fff;
}

.jd-j2-arc {
  width: 132px;
  height: 12px;
  color: #fcd34d;
  margin-top: -6px;
}

.jd-j2-reading {
  margin-top: 2px;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: #fde68a;
}

/* ======================== JILID 3 ======================== */
.jd-j3-compare {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.jd-j3-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 11px 8px 12px;
  border-radius: 16px;
  border: 1px solid rgba(252, 211, 77, 0.16);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(236, 253, 245, 0.78);
  font: inherit;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), background 0.25s ease, border-color 0.25s ease;
}

.jd-j3-card.is-active {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(252, 211, 77, 0.65);
  color: #fff;
  transform: translateY(-2px);
}

.jd-j3-card.is-mad.is-active {
  background: rgba(252, 211, 77, 0.14);
}

.jd-j3-badge {
  font-size: 0.68rem;
  font-weight: 700;
  color: rgba(236, 253, 245, 0.75);
}

.jd-j3-badge.is-gold {
  color: #fde68a;
}

.jd-j3-glyph {
  font-size: clamp(2rem, 4.8vw, 2.65rem);
  line-height: 1.5;
}

.jd-j3-latin {
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #fde68a;
}

.jd-j3-meter {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  max-width: 108px;
  height: 12px;
  margin-top: 2px;
}

.jd-beat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(252, 211, 77, 0.3);
  flex: none;
  transition: background 0.2s ease, transform 0.2s ease;
}

.jd-j3-card.is-active .jd-beat-dot {
  background: #fcd34d;
  transform: scale(1.18);
}

.jd-beat-bar {
  position: relative;
  flex: 1;
  height: 4px;
  border-radius: 999px;
  background: rgba(252, 211, 77, 0.2);
  overflow: hidden;
}

.jd-beat-fill {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background: #fcd34d;
  transform-origin: right center;
  transform: scaleX(0);
}

.jd-j3-card.is-mad.is-active .jd-beat-fill {
  animation: jd-fill-rtl 1.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.jd.is-paused .jd-j3-card.is-mad.is-active .jd-beat-fill {
  animation: none;
  transform: scaleX(1);
}

/* ======================== JILID 4 ======================== */
.jd-j4-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 10px 10px;
  border-radius: 16px;
  border: 1px solid rgba(252, 211, 77, 0.16);
  background: rgba(255, 255, 255, 0.04);
}

.jd-j4-word-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.jd-j4-word {
  font-size: clamp(2.45rem, 5.8vw, 3.1rem);
  line-height: 1.45;
  color: #fff;
}

.jd-j4-arc {
  width: 136px;
  height: 30px;
  color: #fcd34d;
  margin-top: -6px;
}

.jd-j4-path {
  opacity: 0.6;
}

.jd-j4-ball {
  transform-origin: 72px 16px;
  animation: jd-qolqolah-rebound 1.25s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.jd.is-paused .jd-j4-ball {
  animation: none;
}

.jd-j4-info {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px 8px;
  font-size: 0.8rem;
  text-align: center;
}

.jd-j4-info strong {
  color: #fff;
}

.jd-q-btn {
  min-width: 40px;
  padding: 2px 10px;
}

.jd-q-btn .jd-arab {
  font-size: 1.15rem;
  line-height: 1.25;
}

/* ======================== JILID 5 ======================== */
.jd-j5-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 12px 10px;
  border-radius: 16px;
  border: 1px solid rgba(252, 211, 77, 0.16);
  background: rgba(255, 255, 255, 0.04);
}

.jd-j5-waves {
  display: inline-flex;
  align-items: flex-end;
  gap: 5px;
  height: 18px;
}

.jd-wave {
  width: 4px;
  height: 14px;
  border-radius: 999px;
  background: #fcd34d;
  opacity: 0.75;
  transform-origin: center bottom;
  animation: jd-hum 1.3s ease-in-out infinite;
}

.jd-wave.is-w1 { height: 8px; animation-delay: 0ms; }
.jd-wave.is-w2 { height: 14px; animation-delay: 140ms; }
.jd-wave.is-w3 { height: 18px; animation-delay: 280ms; }
.jd-wave.is-w4 { height: 14px; animation-delay: 140ms; }
.jd-wave.is-w5 { height: 8px; animation-delay: 0ms; }

.jd.is-paused .jd-wave {
  animation: none;
}

.jd-j5-word {
  font-size: clamp(2.25rem, 5.2vw, 2.9rem);
  line-height: 1.48;
  color: #fff;
}

.jd-j5-hold {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 240px;
}

.jd-j5-hold-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #fde68a;
  white-space: nowrap;
}

.jd-j5-track {
  flex: 1;
  height: 5px;
  border-radius: 999px;
  background: rgba(252, 211, 77, 0.2);
  overflow: hidden;
}

.jd-j5-fill {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #34d399, #fcd34d);
  transform-origin: left center;
  transform: scaleX(0);
  animation: jd-fill-ltr 1.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.jd.is-paused .jd-j5-fill {
  animation: none;
  transform: scaleX(1);
}

.jd-j5-desc {
  margin: 2px 0 0;
  font-size: 0.78rem;
  text-align: center;
  color: rgba(236, 253, 245, 0.85);
}

.jd-j5-desc strong {
  color: #fff;
}

/* ======================== JILID 6 ======================== */
.jd-j6-mushaf {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 13px 14px;
  border-radius: 16px;
  border: 1px solid rgba(252, 211, 77, 0.24);
  background: rgba(255, 255, 255, 0.05);
}

.jd-j6-badge-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.jd-j6-sign {
  display: inline-grid;
  place-items: center;
  min-width: 48px;
  height: 44px;
  padding: 0 10px;
  border-radius: 12px;
  background: rgba(252, 211, 77, 0.16);
  border: 1px solid rgba(252, 211, 77, 0.55);
  color: #fcd34d;
  font-size: 1.5rem;
  line-height: 1.1;
}

.jd-j6-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1 1 110px;
}

.jd-j6-meta strong {
  font-size: 0.9rem;
  color: #fff;
}

.jd-j6-meta span {
  font-size: 0.75rem;
  color: rgba(236, 253, 245, 0.78);
}

.jd-j6-action {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  white-space: nowrap;
}

.jd-j6-action.is-stop { background: rgba(251, 146, 60, 0.22); color: #fed7aa; border: 1px solid rgba(251, 146, 60, 0.45); }
.jd-j6-action.is-gold { background: rgba(252, 211, 77, 0.2); color: #fef3c7; border: 1px solid rgba(252, 211, 77, 0.45); }
.jd-j6-action.is-mint { background: rgba(52, 211, 153, 0.2); color: #a7f3d0; border: 1px solid rgba(52, 211, 153, 0.45); }
.jd-j6-action.is-go { background: rgba(56, 189, 248, 0.2); color: #bae6fd; border: 1px solid rgba(56, 189, 248, 0.45); }

.jd-j6-flow {
  position: relative;
  display: flex;
  align-items: center;
  height: 26px;
}

.jd-j6-track {
  position: relative;
  width: 100%;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  overflow: hidden;
}

.jd-j6-cursor {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(270deg, rgba(252, 211, 77, 0.2), #fcd34d);
  transform-origin: right center;
}

.jd-j6-cursor.is-stop {
  animation: jd-waqaf-stop 1.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.jd-j6-cursor.is-continue {
  animation: jd-waqaf-go 1.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.jd.is-paused .jd-j6-cursor.is-stop {
  animation: none;
  transform: scaleX(0.5);
}

.jd.is-paused .jd-j6-cursor.is-continue {
  animation: none;
  transform: scaleX(1);
}

.jd-j6-marker {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: inline-grid;
  place-items: center;
  min-width: 28px;
  height: 24px;
  padding: 0 6px;
  border-radius: 999px;
  background: #03291d;
  border: 1.5px solid #fcd34d;
  color: #fde68a;
  font-size: 0.86rem;
  line-height: 1;
}

.jd-j6-hint {
  margin: 0;
  font-size: 0.77rem;
  line-height: 1.45;
  color: rgba(236, 253, 245, 0.84);
}

.jd-w-btn .jd-arab {
  font-size: 0.98rem;
  line-height: 1.2;
}

.jd-w-short {
  font-size: 0.7rem;
  opacity: 0.85;
}

/* Focus visibility */
.jd-ctrl:focus-visible,
.jd-pill:focus-visible,
.jd-j1-tile:focus-visible,
.jd-j3-card:focus-visible {
  outline: 2.5px solid #fcd34d;
  outline-offset: 2px;
}

/* Keyframes (transform + opacity only, 60fps composited) */
@keyframes jd-fill-rtl {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

@keyframes jd-fill-ltr {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

@keyframes jd-qolqolah-rebound {
  0% { transform: translate(48px, -8px) scale(0.75); opacity: 0.2; }
  38% { transform: translate(10px, 12px) scale(1.15); opacity: 1; }
  62% { transform: translate(-8px, -6px) scale(1.05); opacity: 1; }
  100% { transform: translate(-38px, 8px) scale(0.9); opacity: 0.9; }
}

@keyframes jd-hum {
  0%, 100% { transform: scaleY(0.45); opacity: 0.55; }
  50% { transform: scaleY(1); opacity: 1; }
}

@keyframes jd-waqaf-stop {
  0% { transform: scaleX(0); }
  65% { transform: scaleX(0.5); }
  100% { transform: scaleX(0.5); }
}

@keyframes jd-waqaf-go {
  0% { transform: scaleX(0); }
  100% { transform: scaleX(1); }
}

@media (prefers-reduced-motion: reduce) {
  .jd-j1-tile,
  .jd-j2-piece,
  .jd-j2-split,
  .jd-j2-joined,
  .jd-j3-card {
    transition: opacity 0.2s ease, background 0.2s ease, border-color 0.2s ease;
    transform: none !important;
  }

  .jd-beat-fill,
  .jd-j4-ball,
  .jd-wave,
  .jd-j5-fill,
  .jd-j6-cursor {
    animation: none !important;
  }
}
</style>
