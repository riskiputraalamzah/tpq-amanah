<template>
  <!-- PJ Absen (backend services/absen_pj_service.js): the first teacher who opens today's sesi answers for its roll
       call. Hold to open; a teacher not marked present yet is marked hadir in the same hold. -->
  <section ref="root" class="po" :class="{ 'is-join': joining, 'is-celebrate': celebrate }" aria-live="polite">
    <template v-if="celebrate">
      <div class="po-celebrate" role="status">
        <span class="po-burst" aria-hidden="true">
          <svg viewBox="0 0 64 64" width="64" height="64">
            <circle class="po-burst-ring" cx="32" cy="32" r="26" />
            <path class="po-burst-check" d="M20 33l8 8 16-17" />
          </svg>
          <span v-for="n in 8" :key="n" class="po-spark" :style="{ '--a': `${n * 45}deg` }"></span>
        </span>
        <p class="po-celebrate-title">{{ celebrateTitle }}</p>
        <p class="po-celebrate-text">{{ celebrateText }}</p>
      </div>
    </template>
    <template v-else>
      <div class="po-head">
        <span class="po-badge" aria-hidden="true">{{ joining ? '🤝' : '📋' }}</span>
        <div>
          <h2 class="po-title">{{ title }}</h2>
          <p class="po-lead">{{ lead }}</p>
        </div>
      </div>
      <ul v-if="!joining" class="po-points">
        <li>Antum menjadi <strong>PJ Absen sesi {{ slotLabel }}</strong> hari ini.</li>
        <li>Santri yang belum terlihat saat doa pembuka boleh dikosongkan dulu, nanti dipastikan guru KBM-nya.</li>
        <li>Bila guru jilidnya tidak masuk, santri yang masih kosong menjadi tanggung jawab Antum.</li>
      </ul>
      <p v-if="needsHadir" class="po-hadir">
        Antum belum absen hadir. Dengan menahan tombol ini, kehadiran Antum hari ini ikut tercatat<template v-if="early">
          sebagai <strong>datang awal, bantu sesi {{ slotLabel }}</strong></template>.
      </p>
      <p v-if="error" class="po-error" role="alert">
        {{ error }}
        <router-link v-if="errorCode === 'GURU_NOT_HADIR'" to="/dashboard/attendance" class="po-link">Buka Absensi</router-link>
      </p>
      <HoldConfirm
        :label="holdLabel"
        :sub="'Tekan dan tahan sampai lingkaran penuh'"
        :holding-label="'Tahan terus…'"
        :busy-label="joining ? 'Mencatat…' : 'Membuka absen…'"
        :busy="busy"
        :tone="joining ? 'gold' : 'emerald'"
        @confirm="submit"
      />
    </template>
  </section>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import api from '@/services/api'
import HoldConfirm from './HoldConfirm.vue'

const props = defineProps({
  date: { type: String, required: true },
  slot: { type: String, required: true },
  slotLabel: { type: String, required: true },
  pj: { type: Object, default: null }, // the sesi's PJ: joining as a helper
  needsHadir: { type: Boolean, default: false },
  early: { type: Boolean, default: false },
})
const emit = defineEmits(['opened'])

const busy = ref(false)
const error = ref('')
const errorCode = ref('')
const celebrate = ref(false)
const root = ref(null)
const result = ref(null)
const joining = computed(() => !!props.pj)

const title = computed(() => (joining.value ? `Bantu absen sesi ${props.slotLabel}` : `Buka Absen Sesi ${props.slotLabel}`))
const lead = computed(() =>
  joining.value
    ? `PJ Absen sesi ini ${props.pj.guruName}. Catat kehadiran Antum dulu, lalu Antum bisa ikut mengabsen santri.`
    : 'Absen awal saat doa pembuka. Yang membuka absen sesi ini bertanggung jawab atas absennya.',
)
const holdLabel = computed(() => {
  if (joining.value) return 'Tahan: catat hadir & bantu absen'
  return props.needsHadir ? `Tahan: catat hadir & buka absen ${props.slotLabel}` : `Tahan untuk buka absen ${props.slotLabel}`
})
const celebrateTitle = computed(() => (result.value?.role === 'pj' ? `Antum PJ Absen ${props.slotLabel} hari ini` : 'Kehadiran Antum tercatat'))
const celebrateText = computed(() =>
  result.value?.role === 'pj'
    ? 'Bismillah. Silakan absen santri saat doa pembuka.'
    : `Silakan bantu absen. PJ sesi ini ${result.value?.pj?.guruName || ''}.`,
)

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

async function submit() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  errorCode.value = ''
  try {
    // the hold is the confirmation of being here now: also for the teacher's own attendance
    const { data } = await api.post('/santri-presence/pj/open', { date: props.date, slot: props.slot, confirmHadir: true })
    result.value = data
    celebrate.value = true
    // the hold button may be low on the screen: bring the (shorter) success card into view
    nextTick(() => root.value?.scrollIntoView?.({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' }))
    setTimeout(() => emit('opened', data), reduced() ? 900 : 1900)
  } catch (err) {
    const data = err.response?.data || {}
    errorCode.value = data.code || ''
    error.value = data.error || 'Absen belum bisa dibuka. Coba lagi.'
    if (data.code === 'PJ_GURU_ONLY' || data.notOpenYet) emit('opened', null)
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.po {
  margin: 0 0 14px;
  padding: 16px;
  border-radius: 20px;
  background: linear-gradient(160deg, #ffffff 0%, #f3faf6 100%);
  border: 1px solid rgba(10, 92, 64, 0.22);
  box-shadow: 0 14px 30px -24px rgba(5, 61, 44, 0.55);
  color: #0b3b2a;
}
.po.is-join {
  background: linear-gradient(160deg, #ffffff 0%, #fff8ed 100%);
  border-color: #f1cf94;
}
.po-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.po-badge {
  flex: none;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(10, 92, 64, 0.08);
  font-size: 1.35rem;
}
.po-title {
  margin: 0;
  font-size: 1.12rem;
  font-weight: 800;
  line-height: 1.3;
}
.po-lead {
  margin: 4px 0 0;
  font-size: 0.88rem;
  line-height: 1.5;
  color: #475a50;
}
.po-points {
  display: grid;
  gap: 6px;
  margin: 12px 0 0;
  padding: 0 0 0 18px;
  font-size: 0.86rem;
  line-height: 1.45;
  color: #31463c;
}
.po-hadir {
  margin: 12px 0 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fff8ed;
  border: 1px solid #f1cf94;
  font-size: 0.85rem;
  line-height: 1.45;
  color: #7c3a06;
}
.po-error {
  margin: 12px 0 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  font-size: 0.86rem;
  color: #b42318;
}
.po-link {
  margin-left: 6px;
  font-weight: 700;
  color: #0a5c40;
}
.po :deep(.hc) {
  margin-top: 14px;
}
/* success: the check draws, a soft ring of sparks */
.po-celebrate {
  display: grid;
  justify-items: center;
  gap: 6px;
  padding: 10px 0 6px;
  text-align: center;
}
.po-burst {
  position: relative;
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
}
.po-burst-ring {
  fill: #e7f5ee;
  stroke: #0a5c40;
  stroke-width: 3;
  transform-origin: 32px 32px;
  animation: po-ring 520ms cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
}
.po-burst-check {
  fill: none;
  stroke: #0a5c40;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 40;
  stroke-dashoffset: 40;
  animation: po-draw 420ms 260ms ease-out forwards;
}
.po-spark {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 7px;
  height: 7px;
  margin: -3.5px 0 0 -3.5px;
  border-radius: 50%;
  background: #f59e0b;
  opacity: 0;
  transform: rotate(var(--a)) translateY(0);
  animation: po-spark 700ms 320ms ease-out forwards;
}
.po-spark:nth-child(even) {
  background: #0a5c40;
}
.po-celebrate-title {
  margin: 6px 0 0;
  font-size: 1.1rem;
  font-weight: 800;
  opacity: 0;
  animation: po-up 380ms 380ms ease-out forwards;
}
.po-celebrate-text {
  margin: 0;
  font-size: 0.88rem;
  color: #475a50;
  opacity: 0;
  animation: po-up 380ms 480ms ease-out forwards;
}
@keyframes po-ring {
  from {
    transform: scale(0.4);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
@keyframes po-draw {
  to {
    stroke-dashoffset: 0;
  }
}
@keyframes po-spark {
  0% {
    opacity: 0;
    transform: rotate(var(--a)) translateY(-18px);
  }
  30% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: rotate(var(--a)) translateY(-42px);
  }
}
@keyframes po-up {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .po-burst-ring,
  .po-burst-check,
  .po-celebrate-title,
  .po-celebrate-text {
    animation: none;
    opacity: 1;
    stroke-dashoffset: 0;
    transform: none;
  }
  .po-spark {
    display: none;
  }
}
</style>
