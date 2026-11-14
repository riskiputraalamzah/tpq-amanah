<template>
  <div>
    <PageSkeleton v-if="loading" :rows="5" label="Memuat rapor" />
    <div v-else-if="loadError" class="w-card w-center">
      <p class="w-note is-danger" role="alert">{{ loadError }}</p>
      <router-link to="/wali" class="w-btn w-btn-ghost">Kembali ke beranda</router-link>
    </div>

    <template v-else>
      <router-link to="/wali" class="w-link back-link">← Beranda</router-link>
      <h1 class="w-title">Rapor &amp; riwayat jilid</h1>
      <p class="w-lead">{{ data.santri.name }} · sekarang di <strong>{{ levelName(data.santri.classId) || 'belum ada jilid' }}</strong></p>

      <!-- riwayat jilid -->
      <h2 class="w-section-title">Riwayat jilid</h2>
      <ol class="jl" aria-label="Riwayat jilid">
        <li v-for="j in data.jilid" :key="j.classId" :class="{ 'is-current': j.current }">
          <span class="jl-dot" aria-hidden="true">{{ j.classId === '7' ? 'M' : j.classId }}</span>
          <span class="jl-text">
            <strong>{{ levelName(j.classId) }}<span v-if="j.current" class="jl-now">sekarang</span></strong>
            <span>{{ j.since ? `sejak ${longDate(j.since)}` : 'jilid saat ini' }}</span>
          </span>
        </li>
      </ol>
      <p class="w-help jl-help">Tanggal diambil dari catatan KBM dan perubahan jilid oleh admin.</p>

      <!-- nilai -->
      <h2 class="w-section-title">Nilai dari ustadz/ustadzah</h2>
      <div v-if="!data.rapor.length" class="w-card w-center empty">
        <p class="w-help">Belum ada nilai untuk ananda. Nilai muncul di sini setelah ustadz/ustadzah mengisinya.</p>
      </div>
      <article v-for="p in data.rapor" :key="p.id" class="w-card rp">
        <header class="rp-head">
          <div>
            <h3 class="rp-name">{{ p.name }}</h3>
            <p class="rp-dates">{{ p.startDate ? `${shortDate(p.startDate)} - ${shortDate(p.endDate)}` : '' }}</p>
            <p v-if="p.running" class="rp-run">Periode masih berjalan, nilai bisa bertambah.</p>
          </div>
          <div class="rp-avg" :aria-label="`Rata-rata ${fmt(p.average)} dari 10`">
            <strong>{{ fmt(p.average) }}</strong>
            <span>rata-rata</span>
          </div>
        </header>
        <ul class="rp-list">
          <li v-for="(x, i) in p.items" :key="i" class="rp-item">
            <div class="rp-row">
              <span class="rp-crit">{{ x.criteria }}</span>
              <strong class="rp-score">{{ fmt(x.score) }}</strong>
            </div>
            <span class="rp-bar" aria-hidden="true"><span :style="{ width: `${Math.max(0, Math.min(100, x.score * 10))}%` }"></span></span>
            <span v-if="x.notes || x.guruName" class="rp-note">{{ x.notes }}<template v-if="x.notes && x.guruName"> · </template><template v-if="x.guruName">{{ x.guruName }}</template></span>
          </li>
        </ul>
      </article>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'

const route = useRoute()
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : '')
const longDate = (iso) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`
const shortDate = (iso) => (iso ? `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1].slice(0, 3)} ${iso.slice(0, 4)}` : '')
// scores the Indonesian way: 8,5
const fmt = (n) => (Number.isInteger(n) ? String(n) : String(n).replace('.', ','))

const loading = ref(true)
const loadError = ref('')
const data = ref(null)

onMounted(async () => {
  try {
    const { data: d } = await api.get(`/wali/santri/${route.params.santriId}/rapor`, { cache: false })
    data.value = d
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Rapor belum bisa dimuat. Periksa koneksi lalu coba lagi.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.back-link {
  display: inline-block;
  margin-bottom: 6px;
  text-decoration: none;
}

.jl {
  margin: 0;
  padding: 0;
  list-style: none;
}

.jl li {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 14px;
}

.jl li:not(:last-child)::after {
  content: "";
  position: absolute;
  left: 17px;
  top: 38px;
  bottom: 0;
  width: 2px;
  background: #cfe1d7;
}

.jl-dot {
  flex: none;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e3f1ea;
  color: #0a5c40;
  font-weight: 800;
}

.jl li.is-current .jl-dot {
  background: #0a5c40;
  color: #fcd34d;
  box-shadow: 0 0 0 4px #e3f1ea;
}

.jl-text {
  display: flex;
  flex-direction: column;
}

.jl-text strong {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #0b3b2a;
}

.jl-text > span {
  font-size: 0.86rem;
  color: #5b6b62;
}

.jl-now {
  padding: 2px 8px;
  border-radius: 999px;
  background: #fef3c7;
  color: #7c3a0d;
  font-size: 0.72rem;
  font-weight: 800;
}

.jl-help {
  margin: 0;
}

.empty {
  padding: 18px;
}

.rp {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rp-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.rp-name {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 800;
  color: #0b3b2a;
}

.rp-dates {
  margin: 2px 0 6px;
  font-size: 0.82rem;
  color: #5b6b62;
}

.rp-run {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: #1d4f8a;
}

.rp-avg {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 70px;
  padding: 8px 10px;
  border-radius: 14px;
  background: linear-gradient(150deg, #0a5c40, #053d2c);
  color: #fff;
}

.rp-avg strong {
  font-size: 1.5rem;
  line-height: 1.1;
  color: #fcd34d;
  font-variant-numeric: tabular-nums;
}

.rp-avg span {
  font-size: 0.7rem;
  color: rgba(209, 250, 229, 0.85);
}

.rp-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 10px;
}

.rp-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rp-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.rp-crit {
  font-size: 0.92rem;
  color: #0b3b2a;
}

.rp-score {
  font-variant-numeric: tabular-nums;
  color: #0a5c40;
}

.rp-bar {
  display: block;
  height: 6px;
  border-radius: 999px;
  background: #e4ece7;
  overflow: hidden;
}

.rp-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #0a5c40, #34a36d);
}

.rp-note {
  font-size: 0.8rem;
  color: #5b6b62;
}
</style>
