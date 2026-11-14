<template>
  <div class="pa">
    <header class="pa-head">
      <div>
        <h1>Pengumuman Wali</h1>
        <p>Tampil di beranda portal wali, dan bisa dikirim lewat WhatsApp ke wali yang tertaut.</p>
      </div>
      <button type="button" class="pa-btn pa-btn-primary" @click="openForm()">
        <LineIcon name="plus" :size="17" /> Buat pengumuman
      </button>
    </header>

    <PageSkeleton v-if="loading" :rows="4" label="Memuat pengumuman" />
    <p v-else-if="loadError" class="pa-note is-danger" role="alert">{{ loadError }}</p>
    <div v-else-if="!list.length" class="pa-empty">
      <p class="pa-empty-title">Belum ada pengumuman untuk wali.</p>
      <p class="pa-sub">Contoh: libur TPQ, jadwal munaqosyah, rapat wali santri.</p>
    </div>

    <ul v-else class="pa-list">
      <li v-for="a in list" :key="a.id" class="pa-item">
        <div class="pa-item-top">
          <strong>{{ a.title }}</strong>
          <span class="pa-pill" :class="`is-${STATE[a.state].tone}`">{{ STATE[a.state].label }}</span>
        </div>
        <p class="pa-body">{{ a.body }}</p>
        <p class="pa-sub">
          {{ targetLabel(a.classIds) }} · {{ shortDate(a.startDate) }} - {{ shortDate(a.endDate) }}<template v-if="a.createdByName"> · oleh {{ a.createdByName }}</template>
        </p>
        <p v-if="a.wa" class="pa-wa">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path :d="WA_PATH" /></svg>
          WhatsApp: <strong>{{ a.wa.sent }}/{{ a.wa.total }}</strong> terkirim<template v-if="a.wa.failed">, {{ a.wa.failed }} gagal</template><template v-if="a.wa.waiting">, {{ a.wa.waiting }} menunggu</template>
        </p>
        <div class="pa-actions">
          <button type="button" class="pa-btn pa-btn-ghost" @click="openForm(a)"><LineIcon name="pencil" :size="15" /> Ubah</button>
          <button type="button" class="pa-btn pa-btn-ghost is-danger" @click="remove(a)">Hapus</button>
        </div>
      </li>
    </ul>

    <!-- the form -->
    <div v-if="form" class="pa-overlay" @click.self="form = null">
      <section class="pa-sheet" role="dialog" aria-modal="true" aria-labelledby="pa-form-title">
        <header class="pa-sheet-head">
          <h3 id="pa-form-title">{{ form.id ? 'Ubah pengumuman' : 'Pengumuman baru' }}</h3>
          <button type="button" class="pa-close" aria-label="Tutup" @click="form = null"><LineIcon name="x" :size="20" /></button>
        </header>
        <form class="pa-sheet-body" @submit.prevent="save">
          <label class="pa-field"><span>Judul</span>
            <input v-model="form.title" class="pa-input" maxlength="100" placeholder="Contoh: Libur Maulid Nabi" required />
          </label>
          <label class="pa-field"><span>Isi pengumuman</span>
            <textarea v-model="form.body" class="pa-input pa-textarea" maxlength="1500" placeholder="Tulis dengan bahasa yang sopan dan jelas untuk orang tua." required></textarea>
            <small class="pa-sub">{{ form.body.length }}/1500</small>
          </label>

          <div class="pa-field">
            <span id="pa-target">Untuk</span>
            <div class="pa-chips" role="group" aria-labelledby="pa-target">
              <button type="button" class="pa-chip" :aria-pressed="!form.classIds.length" @click="form.classIds = []">Semua wali</button>
              <button v-for="c in CLASSES" :key="c" type="button" class="pa-chip" :aria-pressed="form.classIds.includes(c)" @click="toggleClass(c)">{{ levelName(c) }}</button>
            </div>
          </div>

          <div class="pa-grid2">
            <label class="pa-field"><span>Tampil mulai</span><input v-model="form.startDate" type="date" class="pa-input" :min="form.id ? undefined : today" /></label>
            <label class="pa-field"><span>Sampai</span><input v-model="form.endDate" type="date" class="pa-input" :min="form.startDate || today" /></label>
          </div>

          <div v-if="!form.id" class="pa-wa-box">
            <label class="pa-check">
              <input v-model="form.sendWa" type="checkbox" />
              <span>Kirim juga lewat <strong>WhatsApp</strong> ke wali yang tertaut
                <small class="pa-sub">{{ recipients === null ? 'Menghitung…' : `${recipients} nomor wali` }} · dikirim bertahap, tidak di jam 21:00-06:30</small></span>
            </label>
            <div v-if="form.sendWa" class="pa-preview">
              <p class="pa-preview-label">Contoh pesan</p>
              <p class="pa-preview-text">{{ previewText }}</p>
            </div>
          </div>
          <p v-else-if="form.sendWa" class="pa-note">WhatsApp untuk pengumuman ini sudah dikirim dan tidak dikirim ulang. Perubahan hanya tampil di portal wali.</p>

          <button type="submit" class="pa-btn pa-btn-primary" :disabled="busy">{{ busy ? 'Menyimpan…' : form.id ? 'Simpan perubahan' : form.sendWa ? 'Terbitkan & kirim WhatsApp' : 'Terbitkan' }}</button>
        </form>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import LineIcon from '@/components/LineIcon.vue'
import { useToast } from '@/composables/useToast'
import { useDialog } from '@/composables/useDialog'

const toast = useToast()
const { ask } = useDialog()
const WA_PATH = 'M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.8-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.4.6-.3.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3Z'
const CLASSES = ['1', '2', '3', '4', '5', '6', '7']
const STATE = { shown: { label: 'Tampil', tone: 'ok' }, scheduled: { label: 'Terjadwal', tone: 'info' }, ended: { label: 'Selesai', tone: 'idle' } }
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const today = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10)
const plusDays = (iso, n) => new Date(new Date(`${iso}T12:00:00Z`).getTime() + n * 86400000).toISOString().slice(0, 10)
const levelName = (id) => (String(id) === '7' ? 'Marhalah' : `Jilid ${id}`)
const shortDate = (iso) => (iso ? `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}` : '')
const targetLabel = (ids) => (ids?.length ? ids.map(levelName).join(', ') : 'Semua wali')

const loading = ref(true)
const loadError = ref('')
const list = ref([])
const form = ref(null)
const busy = ref(false)
const recipients = ref(null)

const previewText = computed(() => [
  "Assalamu'alaikum Bapak/Ibu wali dari *(nama ananda)*.",
  '',
  '📢 *Pengumuman TPQ Amanah*',
  `*${form.value?.title || '(judul)'}*`,
  '',
  form.value?.body || '(isi pengumuman)',
  '',
  `_Pengumuman ini juga bisa dibaca di portal wali: ${window.location.origin}/wali_`,
].join('\n'))

async function load() {
  try {
    const { data } = await api.get('/wali-announcements/admin', { cache: false })
    list.value = data
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Pengumuman belum bisa dimuat.'
  } finally {
    loading.value = false
  }
}

function openForm(a = null) {
  form.value = a
    ? { id: a.id, title: a.title, body: a.body, classIds: [...a.classIds], startDate: a.startDate, endDate: a.endDate, sendWa: a.sendWa }
    : { id: '', title: '', body: '', classIds: [], startDate: today, endDate: plusDays(today, 7), sendWa: false }
}

function toggleClass(c) {
  const ids = form.value.classIds
  form.value.classIds = ids.includes(c) ? ids.filter((x) => x !== c) : [...ids, c].sort()
}

async function countRecipients() {
  if (!form.value || form.value.id) return
  recipients.value = null
  try {
    const { data } = await api.get('/wali-announcements/admin/recipients', { params: { classIds: form.value.classIds.join(',') }, cache: false })
    recipients.value = data.count
  } catch {
    recipients.value = 0
  }
}
// a new announcement: how many numbers the WhatsApp would go to, again whenever the jilid change
watch(
  () => (form.value && !form.value.id ? form.value.classIds.join(',') || 'all' : null),
  (key) => {
    if (key) countRecipients()
  },
)

async function save() {
  const f = form.value
  if (!f.id && f.sendWa) {
    const ok = await ask({
      title: 'Kirim lewat WhatsApp?',
      message: `"${f.title}" dikirim ke ${recipients.value ?? 'semua'} nomor wali ${f.classIds.length ? `(${targetLabel(f.classIds)})` : ''} secara bertahap. Pesan yang sudah terkirim tidak bisa ditarik.`,
      confirmText: 'Terbitkan & kirim',
    })
    if (!ok) return
  }
  busy.value = true
  try {
    const body = { title: f.title, body: f.body, classIds: f.classIds, startDate: f.startDate, endDate: f.endDate, sendWa: f.sendWa }
    if (f.id) {
      await api.put(`/wali-announcements/admin/${f.id}`, body)
      toast.success('Pengumuman diperbarui')
    } else {
      const { data } = await api.post('/wali-announcements/admin', body)
      toast.success(data.queued ? `Pengumuman terbit. WhatsApp ke ${data.queued} wali sedang dikirim bertahap.` : 'Pengumuman terbit di portal wali')
    }
    form.value = null
    await load()
  } catch (err) {
    toast.error(err.response?.data?.error || 'Belum tersimpan. Coba lagi.')
  } finally {
    busy.value = false
  }
}

async function remove(a) {
  const ok = await ask({
    title: 'Hapus pengumuman?',
    message: `"${a.title}" hilang dari portal wali.${a.wa?.waiting ? ` ${a.wa.waiting} pesan WhatsApp yang belum terkirim dibatalkan.` : ''}`,
    tone: 'danger',
    confirmText: 'Hapus',
  })
  if (!ok) return
  try {
    await api.delete(`/wali-announcements/admin/${a.id}`)
    toast.success('Pengumuman dihapus')
    await load()
  } catch (err) {
    toast.error(err.response?.data?.error || 'Belum terhapus.')
  }
}

onMounted(load)
</script>

<style scoped>
.pa {
  padding-top: 60px;
}

@media (min-width: 1024px) {
  .pa {
    padding-top: 0;
  }
}

.pa-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.pa-head h1 {
  margin: 0 0 4px;
  font-size: 1.75rem;
  font-weight: 800;
  color: #0b3b2a;
}

.pa-head p {
  margin: 0;
  color: #475a50;
}

.pa-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 42px;
  padding: 0 14px;
  border-radius: 11px;
  border: 0;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
}

.pa-btn-primary {
  color: #fff;
  background: linear-gradient(135deg, #0a5c40, #053d2c);
}

.pa-btn-ghost {
  color: #0b3b2a;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.22);
}

.pa-btn-ghost.is-danger {
  color: #b42318;
  border-color: rgba(180, 35, 24, 0.35);
}

.pa-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.pa-btn:focus-visible,
.pa-chip:focus-visible,
.pa-close:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

.pa-empty {
  padding: 28px 16px;
  border-radius: 16px;
  background: #fff;
  border: 1px dashed rgba(11, 59, 42, 0.2);
  text-align: center;
}

.pa-empty-title {
  margin: 0 0 4px;
  font-weight: 700;
  color: #0b3b2a;
}

.pa-sub {
  margin: 0;
  font-size: 0.82rem;
  color: #5b6b62;
}

.pa-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.pa-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.1);
}

.pa-item-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px 10px;
}

.pa-item-top strong {
  font-size: 1.02rem;
  color: #0b3b2a;
}

.pa-body {
  margin: 0;
  font-size: 0.9rem;
  color: #2f4339;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pa-wa {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 0.84rem;
  color: #0f6b3c;
}

.pa-actions {
  display: flex;
  gap: 8px;
  margin-top: 2px;
}

.pa-pill {
  display: inline-flex;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
}

.pa-pill.is-ok { background: #e3f1ea; color: #0a5c40; }
.pa-pill.is-info { background: #e6f0fb; color: #1d4f8a; }
.pa-pill.is-idle { background: #eef0ef; color: #4b5a52; }

.pa-note {
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: #eef6f1;
  color: #0a4a34;
  font-size: 0.88rem;
}

.pa-note.is-danger {
  background: #fdecea;
  color: #7a1810;
}

.pa-overlay {
  position: fixed;
  inset: 0;
  z-index: 9990;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(3, 41, 29, 0.45);
}

.pa-sheet {
  width: 100%;
  max-height: 92dvh;
  overflow-y: auto;
  background: #fbf9f3;
  border-radius: 20px 20px 0 0;
  padding-bottom: env(safe-area-inset-bottom);
}

@media (min-width: 640px) {
  .pa-overlay {
    align-items: center;
    padding: 24px;
  }
  .pa-sheet {
    max-width: 600px;
    border-radius: 20px;
  }
}

.pa-sheet-head {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: #fbf9f3;
  border-bottom: 1px solid rgba(11, 59, 42, 0.08);
}

.pa-sheet-head h3 {
  margin: 0;
  font-size: 1.12rem;
  font-weight: 800;
  color: #0b3b2a;
}

.pa-close {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(11, 59, 42, 0.15);
  background: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.pa-sheet-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 18px 22px;
}

.pa-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 0.86rem;
  font-weight: 700;
  color: #0b3b2a;
}

.pa-input {
  width: 100%;
  min-height: 44px;
  padding: 0 12px;
  border-radius: 11px;
  border: 1px solid rgba(11, 59, 42, 0.22);
  background: #fff;
  font: inherit;
  font-weight: 400;
  color: #0b3b2a;
  box-sizing: border-box;
}

.pa-textarea {
  min-height: 130px;
  padding: 10px 12px;
  resize: vertical;
}

.pa-input:focus {
  border-color: #0a5c40;
  outline: none;
  box-shadow: 0 0 0 3px rgba(10, 92, 64, 0.14);
}

.pa-grid2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.pa-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pa-chip {
  min-height: 38px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(11, 59, 42, 0.2);
  background: #fff;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  color: #2f4339;
  cursor: pointer;
}

.pa-chip[aria-pressed="true"] {
  border-color: #0a5c40;
  background: #0a5c40;
  color: #fff;
}

.pa-wa-box {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.12);
}

.pa-check {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.9rem;
  color: #0b3b2a;
}

.pa-check input {
  width: 20px;
  height: 20px;
  margin-top: 1px;
  accent-color: #0a5c40;
}

.pa-check small {
  display: block;
  margin-top: 2px;
}

.pa-preview {
  padding: 10px 12px;
  border-radius: 12px;
  background: #e7f6ee;
}

.pa-preview-label {
  margin: 0 0 4px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #0f6b3c;
}

.pa-preview-text {
  margin: 0;
  font-size: 0.84rem;
  line-height: 1.5;
  color: #1f2d27;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
