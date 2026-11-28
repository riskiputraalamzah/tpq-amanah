<template>
  <div class="rpx">
    <header class="rpx-head">
      <div>
        <h1>Rapor</h1>
        <p v-if="isAdmin">Buka periode rapor untuk semua jilid sekaligus, pantau pengisian guru, lalu terbitkan per jilid ke portal wali.</p>
        <p v-else>Isi rapor santri jilid Antum. Tersimpan otomatis; setelah lengkap tekan "Selesai &amp; paraf".</p>
      </div>
      <button v-if="isAdmin" type="button" class="rpx-btn is-primary" @click="editing = null; sheetOpen = true">+ Buka periode</button>
    </header>

    <!-- Kepala TPQ: whose name and signature go on every published rapor -->
    <section v-if="isAdmin && settings" class="rpx-card rh-kepala" aria-labelledby="rh-kepala">
      <div class="rh-kepala-text">
        <h2 id="rh-kepala">Kepala TPQ (tanda tangan "Mengetahui")</h2>
        <p v-if="settings.kepalaUid && settings.hasSignature" class="rh-ok">✓ {{ settings.kepalaName }} sudah menyimpan tanda tangan resmi.</p>
        <p v-else-if="settings.kepalaUid" class="rh-warn">{{ settings.kepalaName }} belum menyimpan tanda tangan. Minta beliau membukanya di menu Profil Saya.</p>
        <p v-else class="rh-warn">Belum dipilih. Rapor tetap bisa terbit, tanpa nama kepala.</p>
      </div>
      <label class="rpx-field rh-select">
        <span class="sr-only">Pilih Kepala TPQ</span>
        <select class="rpx-input" :value="settings.kepalaUid" :disabled="savingKepala" @change="setKepala($event.target.value)">
          <option value="">— Pilih guru —</option>
          <option v-for="c in settings.candidates || []" :key="c.uid" :value="c.uid">{{ c.name }}{{ c.role === 'admin' ? ' (admin)' : '' }}</option>
        </select>
      </label>
    </section>

    <PageSkeleton v-if="loading" :rows="3" label="Memuat periode rapor" />
    <p v-else-if="error" class="rpx-note is-danger" role="alert">{{ error }}</p>
    <template v-else>
      <h2 class="rpx-section-title">Periode</h2>
      <div v-if="!periods.length" class="rpx-card rpx-empty">
        {{ isAdmin ? 'Belum ada periode rapor. Tekan "Buka periode" untuk memulai.' : 'Belum ada periode rapor yang dibuka admin.' }}
      </div>
      <router-link v-for="p in periods" :key="p.id" :to="`/dashboard/rapor/${p.id}`" class="rpx-card rh-period">
        <div class="rh-period-top">
          <strong>{{ p.name }}</strong>
          <span class="rpx-pill" :class="`is-${PERIOD_STATUS[p.status]?.tone || 'muted'}`">{{ PERIOD_STATUS[p.status]?.label || p.status }}</span>
        </div>
        <span class="rh-meta">
          Kehadiran {{ shortDate(p.attendanceFrom) }} – {{ shortDate(p.attendanceTo) }}<template v-if="p.fillUntil"> · isi sampai {{ shortDate(p.fillUntil) }}</template>
        </span>
        <span class="rh-go" aria-hidden="true">›</span>
      </router-link>
    </template>

    <RaporPeriodSheet :open="sheetOpen" :period="editing" @close="sheetOpen = false" @saved="onSaved" @deleted="load" />
  </div>
</template>

<script setup>
import '@/styles/rapor.css'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import RaporPeriodSheet from '@/components/rapor/RaporPeriodSheet.vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { PERIOD_STATUS, shortDate } from '@/utils/rapor'

const authStore = useAuthStore()
const router = useRouter()
const toast = useToast()
const isAdmin = computed(() => authStore.user?.role === 'admin')
const periods = ref([])
const loading = ref(true)
const error = ref('')
const settings = ref(null)
const savingKepala = ref(false)
const sheetOpen = ref(false)
const editing = ref(null)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [p, s] = await Promise.all([api.get('/rapor/periods', { cache: false }), isAdmin.value ? api.get('/rapor/settings', { cache: false }) : Promise.resolve({ data: null })])
    periods.value = p.data || []
    settings.value = s.data
  } catch (err) {
    error.value = err?.response?.data?.error || 'Periode rapor belum bisa dimuat.'
  } finally {
    loading.value = false
  }
}
async function setKepala(uid) {
  savingKepala.value = true
  try {
    const { data } = await api.put('/rapor/settings/kepala', { uid })
    settings.value = data
    toast.success(uid ? `Kepala TPQ: ${data.kepalaName}` : 'Kepala TPQ dikosongkan')
  } catch (err) {
    toast.error(err?.response?.data?.error || 'Belum tersimpan.')
  } finally {
    savingKepala.value = false
  }
}
function onSaved(p) {
  if (!editing.value && p?.id) router.push(`/dashboard/rapor/${p.id}`)
  else load()
}
onMounted(load)
</script>

<style scoped>
.rh-kepala { display: grid; gap: 12px; margin-bottom: 6px; }
@media (min-width: 720px) {
  .rh-kepala { grid-template-columns: 1fr 280px; align-items: center; }
}
.rh-kepala h2 { margin: 0 0 4px; font-size: 1rem; font-weight: 800; }
.rh-kepala p { margin: 0; font-size: 0.86rem; line-height: 1.45; }
.rh-ok { color: var(--emerald); font-weight: 700; }
.rh-warn { color: #7c3a06; }
.rh-select { margin: 0; }
.rh-period {
  position: relative;
  display: grid;
  gap: 6px;
  padding-right: 40px;
  text-decoration: none;
  color: inherit;
}
.rh-period:hover { border-color: var(--line-strong); }
.rh-period-top { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; }
.rh-period-top strong { font-size: 1.05rem; }
.rh-meta { font-size: 0.84rem; color: var(--muted); }
.rh-go { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); font-size: 1.6rem; color: var(--muted); }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
</style>
