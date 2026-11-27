<template>
  <!-- Ambil alih PJ Absen (backend absen_pj_service.js takeOver): the PJ before hears it by WhatsApp -->
  <Teleport to="body">
    <div v-if="open" class="pt-overlay" @click.self="close" @keydown.esc="close">
      <section class="pt" role="dialog" aria-modal="true" aria-labelledby="pt-title">
        <header class="pt-head">
          <h2 id="pt-title">Ambil alih PJ Absen</h2>
          <button type="button" class="pt-x" aria-label="Tutup" :disabled="busy" @click="close">✕</button>
        </header>
        <p class="pt-lead">
          PJ Absen sesi {{ slotLabel }} sekarang <strong>{{ pj?.guruName }}</strong>. Bila Antum mengambil alih, sisa sesi ini menjadi
          tanggung jawab Antum, dan {{ pj?.guruName }} diberi kabar lewat WhatsApp. Absen yang sudah dicatat tetap atas nama pencatatnya.
        </p>
        <label class="pt-field" for="pt-reason">
          <span>Alasan</span>
          <textarea
            id="pt-reason"
            v-model="reason"
            class="pt-input"
            rows="2"
            maxlength="200"
            placeholder="Contoh: Ustadz A pulang lebih awal"
            :disabled="busy"
          ></textarea>
        </label>
        <div class="pt-quick" role="group" aria-label="Alasan cepat">
          <button v-for="q in QUICK" :key="q" type="button" class="pt-chip" :disabled="busy" @click="reason = q">{{ q }}</button>
        </div>
        <p v-if="needsHadir" class="pt-note">Antum belum absen hadir: kehadiran Antum ikut tercatat saat menahan tombol.</p>
        <p v-if="error" class="pt-error" role="alert">{{ error }}</p>
        <HoldConfirm
          :label="'Tahan untuk ambil alih PJ'"
          :sub="reasonOk ? 'Tekan dan tahan sampai lingkaran penuh' : 'Tulis alasan dulu (minimal 3 huruf)'"
          :busy-label="'Mengambil alih…'"
          :disabled="!reasonOk"
          :busy="busy"
          tone="gold"
          @confirm="submit"
        />
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import api from '@/services/api'
import HoldConfirm from './HoldConfirm.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  date: { type: String, required: true },
  slot: { type: String, required: true },
  slotLabel: { type: String, required: true },
  pj: { type: Object, default: null },
  needsHadir: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'done'])

const QUICK = ['PJ pulang lebih awal', 'PJ ada keperluan mendadak', 'PJ mengajar di kelas lain']
const reason = ref('')
const busy = ref(false)
const error = ref('')
const reasonOk = computed(() => reason.value.trim().length >= 3)

watch(
  () => props.open,
  (v) => {
    if (v) {
      reason.value = ''
      error.value = ''
    }
  },
)

function close() {
  if (!busy.value) emit('close')
}

async function submit() {
  if (busy.value || !reasonOk.value) return
  busy.value = true
  error.value = ''
  try {
    const { data } = await api.post('/santri-presence/pj/takeover', { date: props.date, slot: props.slot, reason: reason.value.trim(), confirmHadir: true })
    emit('done', data)
  } catch (err) {
    error.value = err.response?.data?.error || 'Belum bisa mengambil alih. Coba lagi.'
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.pt-overlay {
  position: fixed;
  inset: 0;
  z-index: 9990;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(3, 25, 17, 0.45);
}
@media (min-width: 768px) {
  .pt-overlay { align-items: center; }
}
.pt {
  display: grid;
  gap: 12px;
  width: 100%;
  max-width: 520px;
  max-height: 92vh;
  overflow-y: auto;
  padding: 18px 16px calc(18px + env(safe-area-inset-bottom));
  border-radius: 20px 20px 0 0;
  background: #fff;
  color: #0b3b2a;
  box-sizing: border-box;
}
@media (min-width: 768px) {
  .pt { border-radius: 20px; padding: 22px; }
}
.pt-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.pt-head h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 800;
}
.pt-x {
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 12px;
  background: rgba(11, 59, 42, 0.06);
  font: inherit;
  color: inherit;
  cursor: pointer;
}
.pt-lead {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.5;
  color: #475a50;
}
.pt-field {
  display: grid;
  gap: 6px;
  font-size: 0.86rem;
  font-weight: 700;
}
.pt-input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(11, 59, 42, 0.22);
  font: inherit;
  font-weight: 500;
  color: inherit;
  box-sizing: border-box;
  resize: vertical;
}
.pt-input:focus {
  outline: 2px solid #0a5c40;
  outline-offset: 1px;
}
.pt-quick {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.pt-chip {
  min-height: 36px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(11, 59, 42, 0.18);
  background: #fbf9f3;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  color: #0b3b2a;
  cursor: pointer;
}
.pt-note {
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fff8ed;
  border: 1px solid #f1cf94;
  font-size: 0.84rem;
  color: #7c3a06;
}
.pt-error {
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  font-size: 0.86rem;
  color: #b42318;
}
</style>
