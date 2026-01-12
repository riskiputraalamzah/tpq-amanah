<template>
  <div class="admin-grading-view">
    <header class="page-header">
      <div>
        <h1>📋 Kelola Periode Penilaian</h1>
        <p>Buat dan kelola periode ujian untuk guru</p>
      </div>
      <button class="btn btn-primary" @click="openCreateModal">+ Periode Baru</button>
    </header>

    <!-- Tab Toggle -->
    <div class="tab-toggle">
      <button class="tab-btn" :class="{ active: !showArchived }" @click="showArchived = false">
        Periode Aktif
      </button>
      <button class="tab-btn" :class="{ active: showArchived }" @click="showArchived = true">
        Diarsipkan ({{ archivedCount }})
      </button>
    </div>

    <div class="periods-grid">
      <div v-if="loading" v-for="i in 3" :key="i" class="period-card glass-card">
        <SkeletonLoader type="title" />
        <SkeletonLoader type="paragraph" />
      </div>

      <div v-else-if="filteredPeriods.length === 0" class="empty-state glass-card">
        <p v-if="showArchived">Belum ada periode yang diarsipkan.</p>
        <p v-else>Belum ada periode penilaian. Klik "Periode Baru" untuk membuat.</p>
      </div>

      <div v-else v-for="period in filteredPeriods" :key="period.id" class="period-card glass-card" :class="{ archived: period.status === 'archived' }">
        <div class="period-status" :class="period.status">{{ period.status === 'archived' ? 'Diarsipkan' : 'Aktif' }}</div>
        <h3>{{ period.name }}</h3>
        <p class="period-dates">
          <strong>Dari:</strong> {{ formatDate(period.startDate) }}<br/>
          <strong>Sampai:</strong> {{ formatDate(period.endDate) }}
        </p>
        <p v-if="period.description" class="period-desc">{{ period.description }}</p>
        <p class="period-count">{{ period.gradeCount }} santri dinilai</p>

        <!-- Guru Recap -->
        <div v-if="period.guruRecap && period.guruRecap.length > 0" class="guru-recap">
          <strong>Guru yang menilai:</strong>
          <div class="guru-list">
            <span v-for="g in period.guruRecap" :key="g.guruId" class="guru-chip">{{ g.guruName }} ({{ g.count }})</span>
          </div>
        </div>

        <div class="card-actions">
          <div class="card-actions-row">
            <router-link v-if="period.status !== 'archived'" :to="`/dashboard/admin-grading/${period.id}`" class="btn btn-sm btn-primary btn-action">Lihat Rekap</router-link>
            <button @click="openEditModal(period)" class="btn btn-sm btn-secondary btn-action">Edit</button>
          </div>
          <button v-if="period.gradeCount === 0 && period.status !== 'archived'" @click="deletePeriod(period)" class="btn btn-sm btn-danger btn-action-full">Hapus</button>
          <button v-else-if="period.status !== 'archived'" @click="archivePeriod(period)" class="btn btn-sm btn-warning btn-action-full">Arsipkan</button>
          <button v-if="period.status === 'archived'" @click="unarchivePeriod(period)" class="btn btn-sm btn-secondary btn-action-full">Aktifkan</button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Period Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal glass-card">
        <h3>{{ editMode ? 'Edit Periode Penilaian' : 'Buat Periode Penilaian Baru' }}</h3>
        <div class="form-group">
          <label class="form-label">Nama Periode</label>
          <input v-model="form.name" type="text" class="form-input" placeholder="Contoh: Ujian Kenaikan Jilid Juni 2024" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Tanggal Mulai</label>
            <input v-model="form.startDate" type="date" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Tanggal Selesai</label>
            <input v-model="form.endDate" type="date" class="form-input" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Deskripsi (opsional)</label>
          <textarea v-model="form.description" class="form-input" rows="2"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeModal">Batal</button>
          <button class="btn btn-primary" @click="savePeriod" :disabled="saving">{{ saving ? 'Menyimpan...' : (editMode ? 'Simpan Perubahan' : 'Buat Periode') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import { useToast, useConfirm } from '@/composables/useToast'

const { success, error: showError, warning } = useToast()
const { confirm } = useConfirm()

const periods = ref([])
const loading = ref(true)
const showModal = ref(false)
const editMode = ref(false)
const saving = ref(false)
const showArchived = ref(false)
const form = ref({ id: null, name: '', startDate: '', endDate: '', description: '', status: 'active' })

const filteredPeriods = computed(() => {
  return periods.value.filter(p => showArchived.value ? p.status === 'archived' : p.status !== 'archived')
})

const archivedCount = computed(() => {
  return periods.value.filter(p => p.status === 'archived').length
})

const formatDate = (d) => {
  if (!d) return '-'
  let date
  if (d._seconds !== undefined) date = new Date(d._seconds * 1000)
  else if (d.seconds !== undefined) date = new Date(d.seconds * 1000)
  else date = new Date(d)
  return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

const toInputDate = (d) => {
  if (!d) return ''
  let date
  if (d._seconds !== undefined) date = new Date(d._seconds * 1000)
  else if (d.seconds !== undefined) date = new Date(d.seconds * 1000)
  else date = new Date(d)
  if (isNaN(date.getTime())) return ''
  return date.toISOString().split('T')[0]
}

const fetchPeriods = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/grading/periods')
    periods.value = data
  } catch (e) { console.log('Failed to fetch periods') }
  finally { loading.value = false }
}

const openCreateModal = () => {
  editMode.value = false
  form.value = { id: null, name: '', startDate: '', endDate: '', description: '', status: 'active' }
  showModal.value = true
}

const openEditModal = (period) => {
  editMode.value = true
  form.value = { 
    id: period.id, 
    name: period.name, 
    startDate: toInputDate(period.startDate), 
    endDate: toInputDate(period.endDate), 
    description: period.description || '',
    status: period.status
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  form.value = { id: null, name: '', startDate: '', endDate: '', description: '', status: 'active' }
}

const savePeriod = async () => {
  if (!form.value.name || !form.value.startDate || !form.value.endDate) {
    warning('Nama dan tanggal wajib diisi')
    return
  }
  if (new Date(form.value.endDate) < new Date(form.value.startDate)) {
    warning('Tanggal selesai harus setelah tanggal mulai')
    return
  }
  saving.value = true
  try {
    if (editMode.value) {
      await api.put(`/grading/periods/${form.value.id}`, form.value)
    } else {
      await api.post('/grading/periods', form.value)
    }
    success('Periode berhasil disimpan')
    await fetchPeriods()
    closeModal()
  } catch (e) { showError('Gagal menyimpan periode') }
  finally { saving.value = false }
}

const deletePeriod = async (period) => {
  const confirmed = await confirm('Apakah Anda yakin ingin menghapus periode ini secara permanen?', { type: 'danger', confirmText: 'Ya, Hapus' })
  if (!confirmed) return
  
  try {
    await api.delete(`/grading/periods/${period.id}`)
    success('Periode berhasil dihapus')
    await fetchPeriods()
  } catch (e) { showError('Gagal menghapus') }
}

const archivePeriod = async (period) => {
  const confirmed = await confirm('Arsipkan periode ini? Periode yang diarsipkan tidak akan terlihat oleh guru.', { type: 'warning', confirmText: 'Ya, Arsipkan' })
  if (!confirmed) return
  
  try {
    await api.put(`/grading/periods/${period.id}`, { ...period, startDate: toInputDate(period.startDate), endDate: toInputDate(period.endDate), status: 'archived' })
    success('Periode berhasil diarsipkan')
    await fetchPeriods()
  } catch (e) { showError('Gagal mengarsipkan') }
}

const unarchivePeriod = async (period) => {
  try {
    await api.put(`/grading/periods/${period.id}`, { ...period, startDate: toInputDate(period.startDate), endDate: toInputDate(period.endDate), status: 'active' })
    success('Periode berhasil diaktifkan')
    await fetchPeriods()
  } catch (e) { showError('Gagal mengaktifkan') }
}

onMounted(fetchPeriods)
</script>

<style scoped>
.admin-grading-view { padding-top: 60px; }
@media (min-width: 1024px) { .admin-grading-view { padding-top: 0; } }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--space-md); margin-bottom: var(--space-xl); }
.page-header h1 { color: var(--primary-dark); }

.tab-toggle { display: flex; gap: var(--space-sm); margin-bottom: var(--space-xl); }
.tab-btn { padding: var(--space-md) var(--space-xl); border-radius: var(--radius-lg); font-weight: 500; color: var(--gray-600); background: rgba(255, 255, 255, 0.7); transition: all 0.2s; }
.tab-btn:hover { background: var(--white); }
.tab-btn.active { background: var(--primary-gradient); color: var(--white); }

.periods-grid { display: grid; grid-template-columns: repeat(1, 1fr); gap: var(--space-lg); }
@media (min-width: 768px) { .periods-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .periods-grid { grid-template-columns: repeat(3, 1fr); } }
.period-card { padding: var(--space-xl); background: rgba(255,255,255,0.9); position: relative; }
.period-card.archived { opacity: 0.7; }
.period-status { position: absolute; top: var(--space-md); right: var(--space-md); padding: var(--space-xs) var(--space-sm); border-radius: var(--radius-sm); font-size: 0.7rem; text-transform: uppercase; font-weight: 600; }
.period-status.active { background: rgba(76,175,80,0.15); color: #388e3c; }
.period-status.archived { background: rgba(255,152,0,0.15); color: #f57c00; }
.period-card h3 { color: var(--primary-dark); margin-bottom: var(--space-sm); padding-right: 80px; }
.period-dates { color: var(--gray-600); font-size: 0.875rem; line-height: 1.6; }
.period-desc { color: var(--gray-500); font-size: 0.875rem; margin-top: var(--space-sm); }
.period-count { font-size: 0.75rem; color: var(--accent-dark); font-weight: 600; margin-top: var(--space-sm); }

.guru-recap { margin-top: var(--space-md); padding: var(--space-sm); background: var(--gray-50); border-radius: var(--radius-md); font-size: 0.75rem; }
.guru-recap strong { color: var(--gray-600); display: block; margin-bottom: var(--space-xs); }
.guru-list { display: flex; flex-wrap: wrap; gap: var(--space-xs); }
.guru-chip { background: rgba(27, 94, 32, 0.1); color: var(--primary); padding: 2px 8px; border-radius: var(--radius-sm); }

.card-actions { display: flex; flex-direction: column; gap: var(--space-sm); margin-top: var(--space-md); }
.card-actions-row { display: flex; gap: var(--space-sm); }
.btn-action { flex: 1; border-radius: var(--radius-full) !important; padding: var(--space-md) var(--space-lg); }
.btn-action-full { width: 100%; border-radius: var(--radius-full) !important; padding: var(--space-md) var(--space-lg); }
.btn-warning { background: #ff9800; color: white; }
.empty-state { padding: var(--space-3xl); text-align: center; color: var(--gray-500); grid-column: 1 / -1; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: var(--z-modal); padding: var(--space-lg); }
.modal { width: 100%; max-width: 500px; padding: var(--space-xl); background: var(--white); }
.modal h3 { color: var(--primary-dark); margin-bottom: var(--space-lg); }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md); }
.modal-actions { display: flex; gap: var(--space-md); justify-content: flex-end; margin-top: var(--space-xl); }
</style>
