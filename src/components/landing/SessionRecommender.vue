<template>
  <div class="sr-card" role="region" aria-labelledby="sr-heading">
    <div class="sr-grid">
      <!-- Left: 1-tap child profile chooser -->
      <div class="sr-left">
        <h3 id="sr-heading" class="sr-title">Bingung pilih sesi? Cek rekomendasi untuk ananda</h3>
        <p class="sr-sub">
          Pilih usia atau jadwal sekolah anak — kami bantu pilihkan sesi yang paling nyaman beserta estimasi biaya awal.
        </p>

        <div class="sr-options" role="radiogroup" aria-label="Pilih usia atau jadwal sekolah ananda">
          <button
            v-for="(opt, idx) in PROFILES"
            :key="opt.id"
            type="button"
            role="radio"
            class="sr-opt"
            :aria-checked="selected === idx"
            @click="selected = idx"
          >
            <strong>{{ opt.label }}</strong>
            <span>{{ opt.hint }}</span>
          </button>
        </div>
      </div>

      <!-- Right: Live recommendation + transparent cost breakdown -->
      <div class="sr-result" :class="current.isMalam ? 'is-malam' : 'is-sore'">
        <div class="sr-res-head">
          <span class="sr-res-pill">{{ current.session }}</span>
          <span class="sr-res-time">{{ current.time }}</span>
        </div>

        <p class="sr-res-why">{{ current.reason }}</p>

        <div class="sr-cost">
          <div class="sr-cost-row">
            <span>Estimasi masuk awal <small>(daftar ulang + 2 buku)</small></span>
            <strong>Rp53.000</strong>
          </div>
          <div class="sr-cost-row">
            <span>Infaq / SPP bulanan</span>
            <strong>Rp20.000 / bln</strong>
          </div>
          <p class="sr-cost-note">
            Formulir online <strong>gratis</strong>. Pembayaran dilakukan setelah ananda diterima.
          </p>
        </div>

        <div class="sr-actions">
          <router-link to="/daftar" class="lp-btn-gold sr-cta-primary">
            <span>Daftar {{ current.session }}</span>
          </router-link>
          <a
            :href="waLink"
            target="_blank"
            rel="noopener noreferrer"
            class="sr-cta-wa"
          >
            Tanya koordinator via WA
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

defineProps({
  waLink: {
    type: String,
    required: true,
  },
})

const PROFILES = [
  {
    id: 'paud',
    label: 'PAUD / TK (4–6 thn)',
    hint: 'Baru mulai mengenal huruf',
    session: 'Sesi Sore',
    time: '15:30 – 17:00 WIB',
    isMalam: false,
    reason: 'Jam masih segar sebelum Maghrib dan ramah bagi anak usia dini agar belajar huruf hijaiyah tanpa mengantuk.',
  },
  {
    id: 'sd-reguler',
    label: 'SD Kelas 1–4 (Reguler)',
    hint: 'Pulang sekolah siang hari',
    session: 'Sesi Sore',
    time: '15:30 – 17:00 WIB',
    isMalam: false,
    reason: 'Cocok sepulang sekolah reguler: selesai mengaji pukul 17:00, malam harinya leluasa istirahat dan mengerjakan PR.',
  },
  {
    id: 'sd-fullday',
    label: 'SD Full-Day',
    hint: 'Pulang sekolah sore hari',
    session: 'Sesi Malam',
    time: '18:00 – 19:30 WIB',
    isMalam: true,
    reason: 'Ananda punya waktu istirahat, mandi, dan shalat Maghrib dulu di rumah sebelum berangkat mengaji pukul 18:00.',
  },
  {
    id: 'lanjutan',
    label: 'SD 5–6 / SMP / Tahfidz',
    hint: 'Jilid 5–6 atau Al-Qur’an',
    session: 'Sesi Malam',
    time: '18:00 – 19:30 WIB',
    isMalam: true,
    reason: 'Suasana ba’da Maghrib lebih tenang dan khusyuk — ideal untuk Jilid 5–6, pendalaman mushaf Al-Qur’an, dan hafalan.',
  },
]

const selected = ref(0)
const current = computed(() => PROFILES[selected.value])
</script>

<style scoped>
.sr-card {
  max-width: 64rem;
  margin: 2.5rem auto 0;
  padding: 1.35rem;
  border-radius: 1.5rem;
  background: #fbf9f3;
  border: 1px solid rgba(180, 83, 9, 0.18);
  box-shadow: 0 20px 38px -28px rgba(5, 61, 44, 0.35);
}

@media (min-width: 640px) {
  .sr-card {
    padding: 1.75rem 2rem;
  }
}

.sr-grid {
  display: grid;
  gap: 1.25rem;
  align-items: stretch;
}

@media (min-width: 960px) {
  .sr-grid {
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
    gap: 1.75rem;
  }
}

.sr-title {
  margin: 0 0 0.35rem;
  font-size: 1.15rem;
  font-weight: 800;
  color: #0b3b2a;
}

.sr-sub {
  margin: 0 0 1rem;
  font-size: 0.86rem;
  line-height: 1.55;
  color: #475a50;
}

.sr-options {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
}

@media (min-width: 520px) {
  .sr-options {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.sr-opt {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 54px;
  padding: 10px 13px;
  border-radius: 14px;
  border: 1.5px solid rgba(11, 59, 42, 0.14);
  background: #fff;
  color: #0b3b2a;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.sr-opt:hover {
  border-color: rgba(10, 92, 64, 0.45);
}

.sr-opt[aria-checked="true"] {
  border-color: #0a5c40;
  background: #eef6f1;
  box-shadow: 0 8px 18px -14px rgba(10, 92, 64, 0.45);
}

.sr-opt strong {
  font-size: 0.86rem;
  font-weight: 800;
  color: #0b3b2a;
}

.sr-opt span {
  font-size: 0.74rem;
  color: #5b6b62;
}

/* Result panel */
.sr-result {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  padding: 1.2rem 1.3rem;
  border-radius: 1.25rem;
  border: 1px solid rgba(180, 83, 9, 0.22);
  background: linear-gradient(160deg, #fffaf0 0%, #fff 100%);
  color: #0b3b2a;
  transition: background 0.25s ease, border-color 0.25s ease;
}

.sr-result.is-malam {
  background: linear-gradient(155deg, #053d2c 0%, #03291d 100%);
  border-color: rgba(252, 211, 77, 0.35);
  color: #ecfdf5;
}

.sr-res-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.sr-res-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 11px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 800;
  background: #fef3c7;
  color: #92400e;
  border: 1px solid rgba(180, 83, 9, 0.28);
}

.sr-result.is-malam .sr-res-pill {
  background: rgba(252, 211, 77, 0.18);
  color: #fde68a;
  border-color: rgba(252, 211, 77, 0.45);
}

.sr-res-time {
  font-size: 0.9rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.sr-res-why {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.5;
  opacity: 0.92;
}

.sr-cost {
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(11, 59, 42, 0.05);
  border: 1px solid rgba(11, 59, 42, 0.1);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sr-result.is-malam .sr-cost {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(252, 211, 77, 0.18);
}

.sr-cost-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.8rem;
}

.sr-cost-row small {
  opacity: 0.75;
}

.sr-cost-row strong {
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.sr-cost-note {
  margin: 2px 0 0;
  padding-top: 6px;
  border-top: 1px dashed rgba(11, 59, 42, 0.15);
  font-size: 0.73rem;
  opacity: 0.84;
}

.sr-result.is-malam .sr-cost-note {
  border-top-color: rgba(252, 211, 77, 0.2);
}

.sr-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
}

.sr-cta-primary {
  min-height: 44px;
  padding: 0 1.25rem;
  font-size: 0.88rem;
}

.sr-cta-wa {
  font-size: 0.82rem;
  font-weight: 700;
  color: #0a5c40;
  text-decoration: underline;
  text-underline-offset: 4px;
}

.sr-result.is-malam .sr-cta-wa {
  color: #fde68a;
}

.sr-opt:focus-visible,
.sr-cta-wa:focus-visible {
  outline: 2.5px solid #b45309;
  outline-offset: 2px;
}

.sr-result.is-malam .sr-cta-wa:focus-visible {
  outline-color: #fcd34d;
}
</style>
