<template>
  <!-- "Ada yang dialfa PJ": the children someone else marked alfa at the opening du'a that this teacher now answers
       for (their jilid, or left by the PJ before a takeover). Each one is confirmed or changed here. -->
  <Teleport to="body">
    <div v-if="open" class="pr-overlay" @click.self="emit('close')" @keydown.esc="emit('close')">
      <section class="pr" role="dialog" aria-modal="true" aria-labelledby="pr-title">
        <header class="pr-head">
          <h2 id="pr-title">{{ title }}</h2>
          <button type="button" class="pr-x" aria-label="Tutup" @click="emit('close')">✕</button>
        </header>
        <p class="pr-lead">{{ lead }}</p>
        <ul class="pr-list">
          <li v-for="x in items" :key="x.santriId" class="pr-row" :class="{ 'is-done': decided[x.santriId] }">
            <div class="pr-name">
              <strong>{{ x.name }}</strong>
              <span class="pr-meta">{{ levelName(x.classId) }}<template v-if="x.byName"> · dialfa {{ x.byName }}</template></span>
            </div>
            <p v-if="decided[x.santriId]" class="pr-decided">✓ {{ LABEL[decided[x.santriId]] }}</p>
            <div v-else class="pr-choices" role="group" :aria-label="`Status ${x.name}`">
              <button type="button" class="pr-choice is-hadir" @click="pick(x, 'hadir')">Sudah datang</button>
              <button type="button" class="pr-choice is-izin" @click="pick(x, 'izin')">Izin</button>
              <button type="button" class="pr-choice is-sakit" @click="pick(x, 'sakit')">Sakit</button>
              <button type="button" class="pr-choice is-alfa" @click="pick(x, 'alfa')">Tetap alfa</button>
            </div>
          </li>
        </ul>
        <button type="button" class="pr-done" @click="emit('close')">{{ allDone ? 'Selesai' : 'Nanti saja' }}</button>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  items: { type: Array, default: () => [] }, // [{ santriId, name, classId, byName }]
  takeover: { type: Boolean, default: false }, // shown right after "Ambil alih PJ"
})
const emit = defineEmits(['close', 'pick'])

const LABEL = { hadir: 'Hadir', izin: 'Izin', sakit: 'Sakit', alfa: 'Tetap alfa (dikonfirmasi)' }
const decided = ref({})
const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : '')
const allDone = computed(() => props.items.every((x) => decided.value[x.santriId]))
const title = computed(() => `${props.items.length} santri dialfa saat absen awal`)
const lead = computed(() =>
  props.takeover
    ? 'Santri ini dialfa PJ sebelumnya. Pastikan memang tidak datang sampai pulang. Bila ternyata datang atau ada kabar, ubah di sini.'
    : 'Santri ini dialfa saat absen awal (doa pembuka) dan sekarang tanggung jawab Antum. Pastikan apakah sudah datang. Kabar alfa ke wali memakai nama dan nomor Antum.',
)

watch(
  () => props.open,
  (v) => {
    if (v) decided.value = {}
  },
)

function pick(x, status) {
  decided.value = { ...decided.value, [x.santriId]: status }
  emit('pick', { santriId: x.santriId, status })
}
</script>

<style scoped>
.pr-overlay {
  position: fixed;
  inset: 0;
  z-index: 9990;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(3, 25, 17, 0.45);
}
@media (min-width: 768px) {
  .pr-overlay { align-items: center; }
}
.pr {
  display: grid;
  gap: 12px;
  width: 100%;
  max-width: 560px;
  max-height: 92vh;
  overflow-y: auto;
  padding: 18px 16px calc(18px + env(safe-area-inset-bottom));
  border-radius: 20px 20px 0 0;
  background: #fff;
  color: #0b3b2a;
  box-sizing: border-box;
  animation: pr-in 260ms ease-out;
}
@media (min-width: 768px) {
  .pr { border-radius: 20px; padding: 22px; }
}
.pr-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.pr-head h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
}
.pr-x {
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 12px;
  background: rgba(11, 59, 42, 0.06);
  font: inherit;
  color: inherit;
  cursor: pointer;
}
.pr-lead {
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fff8ed;
  border: 1px solid #f1cf94;
  font-size: 0.86rem;
  line-height: 1.5;
  color: #7c3a06;
}
.pr-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.pr-row {
  display: grid;
  gap: 8px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid rgba(11, 59, 42, 0.12);
  background: #fff;
  transition: background 200ms ease;
}
.pr-row.is-done {
  background: #f3faf6;
}
.pr-name {
  display: grid;
  gap: 2px;
}
.pr-meta {
  font-size: 0.8rem;
  color: #5b6b62;
}
.pr-decided {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 700;
  color: #0a5c40;
}
.pr-choices {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}
@media (min-width: 480px) {
  .pr-choices { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
.pr-choice {
  min-height: 44px;
  padding: 0 8px;
  border-radius: 12px;
  border: 1px solid rgba(11, 59, 42, 0.18);
  background: #fff;
  font: inherit;
  font-size: 0.84rem;
  font-weight: 700;
  color: #0b3b2a;
  cursor: pointer;
}
.pr-choice.is-hadir { border-color: rgba(10, 92, 64, 0.4); color: #0a5c40; }
.pr-choice.is-izin { color: #1d4ed8; }
.pr-choice.is-sakit { color: #b45309; }
.pr-choice.is-alfa { border-color: rgba(180, 35, 24, 0.35); color: #b42318; }
.pr-done {
  min-height: 48px;
  border: 0;
  border-radius: 14px;
  background: #0a5c40;
  font: inherit;
  font-weight: 800;
  color: #fff;
  cursor: pointer;
}
@keyframes pr-in {
  from { transform: translateY(16px); opacity: 0; }
  to { transform: none; opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .pr { animation: none; }
}
</style>
