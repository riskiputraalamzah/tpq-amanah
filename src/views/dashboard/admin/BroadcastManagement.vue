<template>
  <div class="ann-management">
    <header class="page-header">
      <div class="header-content">
        <div>
          <h1>Kelola Broadcast WA</h1>
          <p>Kirim pesan WhatsApp massal (bulk) atau satuan (single) secara instan atau terjadwal</p>
        </div>
        <button class="btn-create" @click="openCreate">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Buat Broadcast
        </button>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="loading-state glass-card">
      <div class="spinner"></div>
      <span>Memuat data broadcast...</span>
    </div>

    <!-- Empty -->
    <div v-else-if="broadcasts.length === 0" class="empty-state glass-card">
      <div class="empty-icon">📨</div>
      <h3>Belum Ada Broadcast</h3>
      <p>Buat broadcast pesan pertama untuk mengirim pesan dinamis ke nomor WhatsApp.</p>
      <button class="btn-create m-auto" @click="openCreate">Buat Sekarang</button>
    </div>

    <!-- List -->
    <div v-else class="ann-list">
      <div v-for="bc in broadcasts" :key="bc.id" class="ann-card glass-card">
        <div class="ann-card-top">
          <div class="ann-left">
            <span class="ann-type-badge" :class="bc.type === 'bulk' ? 'badge-warning' : 'badge-info'">
              {{ bc.type === 'bulk' ? '👥 Massal (Bulk)' : '👤 Satuan (Single)' }}
            </span>
            <span class="ann-channel-badge font-semibold" :class="'wa-' + getStatusTone(bc.status)">
              WA {{ getStatusLabel(bc.status) }}
            </span>
            <span class="ann-role-badge">Total: {{ bc.recipients?.length || 0 }} Penerima</span>
          </div>
          <div class="ann-actions">
            <!-- Test Kirim -->
            <button class="icon-btn edit" @click="openTest(bc)" title="Kirim Test">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </button>
            <!-- Delete -->
            <button class="icon-btn delete" @click="confirmDelete(bc)" title="Hapus">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
              </svg>
            </button>
          </div>
        </div>

        <h3 class="ann-title">{{ bc.title }}</h3>
        
        <div class="template-box">
          <div class="template-label">Template Pesan:</div>
          <pre class="template-text">{{ bc.template }}</pre>
        </div>

        <div class="ann-meta">
          <span class="ann-dismiss">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Jadwal Kirim: {{ formatDate(bc.sendAt) }}
          </span>
          <span class="ann-date">Dibuat oleh: {{ bc.createdByName || '-' }} ({{ formatDate(bc.createdAt) }})</span>
        </div>

        <!-- Progress Summary -->
        <div class="ann-wa-schedule" style="margin-top: 15px;">
          <div class="ann-wa-schedule-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span>Status Pengiriman Detail</span>
          </div>

          <div class="ann-wa-summary">
            <span class="ann-wa-target text-green-700">Terkirim: {{ getSentCount(bc.recipients) }}</span>
            <span class="ann-wa-target text-red-600">Gagal: {{ getFailedCount(bc.recipients) }}</span>
            <span class="ann-wa-target text-gray-500">Menunggu: {{ getPendingCount(bc.recipients) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Form Modal -->
    <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
      <div class="modal glass-card" style="max-width: 700px;">
        <div class="modal-header">
          <h3>Buat Broadcast Baru</h3>
          <button class="close-btn" @click="closeForm">×</button>
        </div>

        <div class="form-group">
          <label>Judul Broadcast / Referensi Internal:</label>
          <input type="text" v-model="form.title" placeholder="Contoh: Tagihan SPP Guru Agustus" class="form-control" />
        </div>

        <div class="form-group">
          <label>Tipe Penerima:</label>
          <div class="channel-segment">
            <label class="segment-option" :class="{ active: form.type === 'single' }">
              <input type="radio" v-model="form.type" value="single" class="hidden-radio" />
              <div class="option-content">
                <span class="option-title">Satuan (Single)</span>
                <span class="option-desc">Kirim pesan tunggal ke satu nomor WA saja.</span>
              </div>
            </label>
            <label class="segment-option" :class="{ active: form.type === 'bulk' }">
              <input type="radio" v-model="form.type" value="bulk" class="hidden-radio" />
              <div class="option-content">
                <span class="option-title">Massal (Bulk)</span>
                <span class="option-desc">Kirim pesan massal dengan nama / data dinamis.</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Template Area -->
        <div class="form-group">
          <label>Template Pesan WhatsApp:</label>
          <textarea v-model="form.template" rows="5" placeholder="Contoh: Hello {nama}, token absensi anda adalah {token}." class="form-control font-mono"></textarea>
          <p class="wa-hint" style="margin-top: 5px;">
            Variabel dinamis dapat ditulis dengan tanda kurung kurawal, contoh: <strong>{nama}</strong>, <strong>{token}</strong>, <strong>{bulan}</strong>, dst.
          </p>
        </div>

        <!-- Single Form -->
        <div v-if="form.type === 'single'" class="single-fields glass-card p-4 mb-4">
          <h4 class="mb-3 font-semibold text-green-800">Detail Penerima</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Nama Penerima:</label>
              <input type="text" v-model="form.singleRecipient.name" placeholder="Ustadz Riski" class="form-control" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Nomor WhatsApp (dengan kode negara):</label>
              <input type="text" v-model="form.singleRecipient.number" placeholder="6282233361877" class="form-control" />
            </div>
          </div>
          <div class="mt-3">
            <label class="block text-xs font-semibold text-gray-700 mb-1">Variabel Kustom (JSON jika ada):</label>
            <textarea v-model="form.singleRecipient.variablesRaw" placeholder='{"token": "xyz123", "bulan": "Juli"}' rows="2" class="form-control font-mono text-xs"></textarea>
          </div>
        </div>

        <!-- Bulk Form -->
        <div v-if="form.type === 'bulk'" class="bulk-fields glass-card p-4 mb-4">
          <h4 class="mb-1 font-semibold text-green-800">Input Data CSV / Text</h4>
          <p class="text-xs text-gray-600 mb-3">Masukkan baris pertama sebagai header. Pisahkan dengan tanda koma (Nama dan Nomor wajib ada).</p>
          <textarea v-model="form.bulkRaw" rows="6" placeholder="Nama, Nomor, token, bulan&#10;Ustadz Riski, 6282233361877, abc888, Agustus&#10;Ustadzah Aini, 6289687136112, def999, Agustus" class="form-control font-mono text-xs"></textarea>
          <div class="mt-2 text-xs text-right">
            <span class="font-semibold text-blue-700" v-if="parsedBulkRecipients.length">
              ✓ Berhasil mendeteksi {{ parsedBulkRecipients.length }} baris data
            </span>
            <span class="text-red-600" v-else-if="form.bulkRaw.trim()">
              ⚠ Format data tidak terdeteksi atau baris data kosong
            </span>
          </div>
        </div>

        <!-- Live Preview -->
        <div class="preview-label wa-preview-label">Live Preview (Variabel Diterapkan):</div>
        <div class="wa-message-preview">
          <strong>📢 Preview Broadcast WA</strong>
          <span class="white-space-pre-wrap">{{ processedPreviewMessage }}</span>
          <div class="text-xs text-gray-400 mt-2 text-right">Target: {{ previewRecipientInfo }}</div>
        </div>

        <!-- Schedule Section -->
        <div class="form-group mt-4">
          <label>Jadwal Kirim:</label>
          <div class="flex items-center gap-4 mb-3">
            <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" v-model="form.sendImmediately" />
              <span>Kirim Sekarang (Instan)</span>
            </label>
          </div>
          <div v-if="!form.sendImmediately" class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-600 mb-1">Tanggal:</label>
              <input type="date" v-model="form.scheduleDate" class="form-control" />
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Jam:</label>
              <input type="time" v-model="form.scheduleTime" class="form-control" />
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="closeForm">Batal</button>
          <button class="btn-save" @click="saveBroadcast" :disabled="saving || !isFormValid">
            {{ saving ? 'Menyimpan...' : 'Jadwalkan Broadcast' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Test Modal -->
    <div v-if="testBroadcastBc" class="modal-overlay" @click.self="testBroadcastBc = null">
      <div class="modal glass-card confirm-modal" style="max-width: 450px;">
        <div class="confirm-icon">🧪</div>
        <h3>Kirim Test Broadcast</h3>
        <p class="text-sm text-gray-600 mb-4">Pesan test akan langsung dikirim oleh WA bot tanpa menunggu jadwal schedule.</p>
        
        <div class="form-group text-left mb-3">
          <label class="block text-xs font-semibold mb-1">Nama Target Test:</label>
          <input type="text" v-model="testForm.name" class="form-control" />
        </div>
        
        <div class="form-group text-left mb-4">
          <label class="block text-xs font-semibold mb-1">Nomor WA Target Test (Kode Negara):</label>
          <input type="text" v-model="testForm.number" class="form-control" />
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="testBroadcastBc = null">Batal</button>
          <button class="btn-test-wa" @click="sendTest" :disabled="saving || !testForm.number">
            {{ saving ? 'Mengirim...' : 'Kirim Test Sekarang' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirm -->
    <div v-if="deletingId" class="modal-overlay" @click.self="deletingId = null">
      <div class="modal glass-card confirm-modal">
        <div class="confirm-icon">🗑️</div>
        <h3>Hapus Broadcast?</h3>
        <p>Broadcast "<strong>{{ deletingTitle }}</strong>" dan riwayatnya akan dihapus permanen.</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="deletingId = null">Batal</button>
          <button class="btn-delete" @click="deleteBc" :disabled="saving">{{ saving ? 'Menghapus...' : 'Ya, Hapus' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const { success, error: showError } = useToast()

const broadcasts = ref([])
const loading = ref(true)
const saving = ref(false)
const showForm = ref(false)
const deletingId = ref(null)
const deletingTitle = ref('')

const testBroadcastBc = ref(null)
const testForm = ref({
  name: 'Ustadz Riski',
  number: '6282233361877'
})

const getDateInputValue = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getNextTimeInputValue = () => {
  const date = new Date(Date.now() + 15 * 60 * 1000)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const defaultForm = () => ({
  title: '',
  template: '',
  type: 'single',
  singleRecipient: {
    name: '',
    number: '',
    variablesRaw: ''
  },
  bulkRaw: '',
  sendImmediately: true,
  scheduleDate: getDateInputValue(),
  scheduleTime: getNextTimeInputValue()
})

const form = ref(defaultForm())

const getSentCount = (recipients = []) => recipients.filter(r => r.status === 'sent').length
const getFailedCount = (recipients = []) => recipients.filter(r => r.status === 'failed').length
const getPendingCount = (recipients = []) => recipients.filter(r => r.status === 'pending').length

const getStatusLabel = (status) => {
  const mapping = {
    scheduled: 'Dijadwalkan',
    processing: 'Sedang Diproses',
    sent: 'Terkirim',
    partial: 'Terkirim Sebagian',
    failed: 'Gagal',
    cancelled: 'Dibatalkan'
  }
  return mapping[status] || status
}

const getStatusTone = (status) => {
  const mapping = {
    scheduled: 'scheduled',
    processing: 'queued',
    sent: 'sent',
    partial: 'partial',
    failed: 'failed',
    cancelled: 'disabled'
  }
  return mapping[status] || 'disabled'
}

const formatDate = (d) => {
  if (!d) return 'Sekarang / Instan'
  const dt = new Date(d)
  return isNaN(dt) ? '-' : dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const parseCSV = (text) => {
  if (!text || !text.trim()) return []
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length <= 1) return []

  const originalHeader = lines[0].split(',').map(h => h.trim())
  const header = originalHeader.map(h => h.toLowerCase())
  const nameIdx = header.findIndex(h => h.includes('nama') || h.includes('name'))
  const numIdx = header.findIndex(h => h.includes('nomor') || h.includes('number') || h.includes('phone') || h.includes('telp'))

  if (nameIdx === -1 || numIdx === -1) return []

  const list = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim())
    if (cols.length < Math.max(nameIdx, numIdx)) continue

    const name = cols[nameIdx]
    const number = cols[numIdx]
    if (!name || !number) continue

    const variables = {}
    originalHeader.forEach((h, index) => {
      if (index !== nameIdx && index !== numIdx && cols[index] !== undefined) {
        variables[h] = cols[index]
      }
    });

    list.push({
      name,
      number,
      variables
    })
  }
  return list
}

const parsedBulkRecipients = computed(() => {
  if (form.value.type !== 'bulk') return []
  return parseCSV(form.value.bulkRaw)
})

const processedPreviewMessage = computed(() => {
  let template = form.value.template || 'Silakan masukkan template pesan...'
  let vars = {}

  if (form.value.type === 'single') {
    vars.nama = form.value.singleRecipient.name || '[Nama Penerima]'
    try {
      if (form.value.singleRecipient.variablesRaw.trim()) {
        const custom = JSON.parse(form.value.singleRecipient.variablesRaw)
        vars = { ...vars, ...custom }
      }
    } catch (e) {
      // ignore JSON parse error for preview
    }
  } else {
    const list = parsedBulkRecipients.value
    if (list.length > 0) {
      vars = {
        nama: list[0].name,
        ...list[0].variables
      }
    } else {
      vars = {
        nama: '[Nama Contoh]',
        token: '[Token Contoh]',
        bulan: '[Bulan Contoh]'
      }
    }
  }

  // Replace variables
  let message = template
  Object.keys(vars).forEach(key => {
    const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
    const regex = new RegExp(`{${escapedKey}}`, 'gi')
    const val = vars[key] !== undefined ? String(vars[key]) : ""
    message = message.replace(regex, val)
  });

  return message
})

const previewRecipientInfo = computed(() => {
  if (form.value.type === 'single') {
    return `${form.value.singleRecipient.name || 'Belum diisi'} (${form.value.singleRecipient.number || 'Belum diisi'})`
  } else {
    const list = parsedBulkRecipients.value
    if (list.length > 0) {
      return `${list[0].name} (${list[0].number}) [Baris 1 dari ${list.length}]`
    }
    return 'Belum ada data penerima bulk'
  }
})

const isFormValid = computed(() => {
  if (!form.value.title.trim()) return false
  if (!form.value.template.trim()) return false

  if (form.value.type === 'single') {
    return Boolean(form.value.singleRecipient.name.trim() && form.value.singleRecipient.number.trim())
  } else {
    return parsedBulkRecipients.value.length > 0
  }
})

const fetchBroadcasts = async () => {
  loading.value = true
  try {
    const res = await api.get('/broadcasts')
    broadcasts.value = res.data
  } catch (e) {
    showError('Gagal memuat data broadcast')
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  form.value = defaultForm()
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
}

const saveBroadcast = async () => {
  saving.value = true
  try {
    let recipients = []
    if (form.value.type === 'single') {
      let customVars = {}
      try {
        if (form.value.singleRecipient.variablesRaw.trim()) {
          customVars = JSON.parse(form.value.singleRecipient.variablesRaw)
        }
      } catch (e) {
        showError('Format JSON variabel kustom tidak valid')
        saving.value = false
        return
      }

      recipients = [{
        name: form.value.singleRecipient.name.trim(),
        number: form.value.singleRecipient.number.trim(),
        variables: customVars
      }]
    } else {
      recipients = parsedBulkRecipients.value
    }

    let sendAt = null
    if (!form.value.sendImmediately) {
      const dt = new Date(`${form.value.scheduleDate}T${form.value.scheduleTime}`)
      sendAt = dt.toISOString()
    }

    const payload = {
      title: form.value.title.trim(),
      template: form.value.template,
      type: form.value.type,
      sendAt,
      recipients
    }

    const res = await api.post('/broadcasts', payload)
    success(res.data.message || 'Broadcast berhasil dibuat')
    showForm.value = false
    fetchBroadcasts()
  } catch (e) {
    showError(e.response?.data?.error || 'Gagal menyimpan broadcast')
  } finally {
    saving.value = false
  }
}

const openTest = (bc) => {
  testBroadcastBc.value = bc
  testForm.value = {
    name: 'Ustadz Riski',
    number: '6282233361877'
  }
}

const sendTest = async () => {
  saving.value = true
  try {
    const res = await api.post(`/broadcasts/${testBroadcastBc.value.id}/test`, {
      targetNumber: testForm.value.number,
      targetName: testForm.value.name
    })

    // Now trigger Termux bot to send it immediately via /tes-broadcast endpoint on keep-alive
    // Depending on deployment, the bot endpoint might be hit directly or via proxy.
    // Since bot is operational in VM GCP at bot-tpq-amanah.riskiputraalamzah.my.id, we can fetch
    // its manual testing route. We will hit /tes-broadcast via the bot domain or local trigger.
    // To make sure the scheduling check triggers, we can call bot HTTP interface to trigger /tes-broadcast.
    try {
      const botBase = 'https://bot-tpq-amanah.riskiputraalamzah.my.id'
      await api.get(`${botBase}/tes-broadcast`)
    } catch (e) {
      console.warn('Bot local trigger failed, but job is saved in DB:', e.message)
    }

    success(res.data.message || 'Test broadcast berhasil disiapkan')
    testBroadcastBc.value = null
  } catch (e) {
    showError(e.response?.data?.error || 'Gagal mengirim test broadcast')
  } finally {
    saving.value = false
  }
}

const confirmDelete = (bc) => {
  deletingId.value = bc.id
  deletingTitle.value = bc.title
}

const deleteBc = async () => {
  saving.value = true
  try {
    await api.delete(`/broadcasts/${deletingId.value}`)
    success('Broadcast berhasil dihapus')
    deletingId.value = null
    fetchBroadcasts()
  } catch (e) {
    showError('Gagal menghapus broadcast')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchBroadcasts()
})
</script>

<style scoped>
/* Follow same visual styles from AnnouncementManagement.vue */
.ann-management {
  padding: var(--space-lg);
}

.page-header {
  margin-bottom: var(--space-xl);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-md);
}

.header-content h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-dark);
}

.header-content p {
  color: var(--gray-600);
  font-size: 0.875rem;
}

.btn-create {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-lg);
  background: var(--primary-gradient);
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
}

.btn-create.m-auto {
  margin: var(--space-md) auto 0;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xxl) var(--space-lg);
  text-align: center;
  min-height: 250px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(18, 140, 126, 0.1);
  border-radius: 50%;
  border-top-color: var(--primary);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: var(--space-md);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: var(--space-md);
}

.empty-state h3 {
  color: var(--primary-dark);
  font-weight: 600;
  margin-bottom: var(--space-xs);
}

.empty-state p {
  color: var(--gray-500);
  font-size: 0.875rem;
  max-width: 300px;
  margin-bottom: var(--space-md);
}

.ann-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.ann-card {
  padding: var(--space-lg);
  position: relative;
  transition: all 0.2s ease;
}

.ann-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-sm);
}

.ann-left {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.ann-type-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.badge-info {
  background: rgba(18, 140, 126, 0.1);
  color: var(--primary-dark);
}

.badge-warning {
  background: rgba(245, 158, 11, 0.1);
  color: #b45309;
}

.ann-role-badge,
.ann-channel-badge {
  font-size: 0.72rem;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  background: var(--gray-100);
  color: var(--gray-600);
}

.ann-actions {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--gray-100);
  color: var(--gray-600);
}

.toggle-btn.active {
  background: rgba(18, 140, 126, 0.1);
  color: var(--primary);
}

.icon-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gray-50);
  color: var(--gray-600);
  transition: all 0.2s;
}

.icon-btn:hover {
  background: var(--gray-200);
  color: var(--gray-800);
}

.icon-btn.delete:hover {
  background: #fee2e2;
  color: #ef4444;
}

.ann-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gray-800);
  margin-bottom: var(--space-xs);
}

.template-box {
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-md);
  margin-bottom: var(--space-md);
}

.template-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--gray-500);
  margin-bottom: 4px;
}

.template-text {
  font-family: var(--font-mono, monospace);
  font-size: 0.8rem;
  color: var(--gray-700);
  white-space: pre-wrap;
  margin: 0;
}

.ann-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--gray-500);
  border-top: 1px solid var(--gray-100);
  padding-top: var(--space-sm);
}

.ann-wa-schedule {
  background: rgba(18, 140, 126, 0.03);
  border: 1px solid rgba(18, 140, 126, 0.1);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
}

.ann-wa-schedule-label {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--primary-dark);
  margin-bottom: var(--space-sm);
}

.ann-wa-summary {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  font-size: 0.8rem;
  font-weight: 600;
}

.ann-wa-target {
  background: white;
  padding: 4px 10px;
  border-radius: var(--radius-md);
  border: 1px solid var(--gray-200);
}

/* Status tones */
.wa-scheduled {
  background: rgba(59, 130, 246, 0.1);
  color: #1d4ed8;
}

.wa-queued {
  background: rgba(245, 158, 11, 0.1);
  color: #b45309;
}

.wa-sent {
  background: rgba(16, 185, 129, 0.1);
  color: #047857;
}

.wa-partial {
  background: rgba(139, 92, 246, 0.1);
  color: #6d28d9;
}

.wa-failed {
  background: rgba(239, 68, 68, 0.1);
  color: #b91c1c;
}

/* Modals */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: var(--space-md);
}

.modal {
  width: 100%;
  max-width: 550px;
  background: white;
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
  border-bottom: 1px solid var(--gray-100);
  padding-bottom: var(--space-sm);
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary-dark);
}

.close-btn {
  font-size: 1.5rem;
  color: var(--gray-400);
}

.form-group {
  margin-bottom: var(--space-md);
}

.form-group label {
  display: block;
  font-size: 0.825rem;
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: 6px;
}

.form-control {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  color: var(--gray-800);
}

.form-control:focus {
  border-color: var(--primary);
  outline: none;
}

.channel-segment {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-sm);
}

.segment-option {
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.segment-option.active {
  border-color: var(--primary);
  background: rgba(18, 140, 126, 0.02);
}

.hidden-radio {
  display: none;
}

.option-title {
  display: block;
  font-weight: 600;
  color: var(--gray-800);
  font-size: 0.875rem;
  margin-bottom: 2px;
}

.option-desc {
  font-size: 0.75rem;
  color: var(--gray-500);
  line-height: 1.4;
  display: block;
}

.wa-hint {
  font-size: 0.72rem;
  color: var(--gray-500);
}

.preview-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--gray-500);
  margin: var(--space-md) 0 6px;
}

.wa-message-preview {
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  background: #F7FFFB;
  border: 1px solid rgba(18, 140, 126, 0.18);
  color: var(--gray-700);
  font-size: 0.82rem;
  line-height: 1.5;
}

.wa-message-preview strong {
  color: var(--primary-dark);
}

.wa-message-preview span {
  white-space: pre-wrap;
}

.modal-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
  margin-top: var(--space-xl);
}

.btn-cancel {
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-lg);
  color: var(--gray-600);
  background: var(--gray-100);
  font-weight: 600;
}

.btn-test-wa {
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-lg);
  color: #0B6B60;
  background: rgba(18, 140, 126, 0.12);
  font-weight: 700;
}

.btn-test-wa:hover {
  background: rgba(18, 140, 126, 0.18);
}

.btn-test-wa:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-save {
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-lg);
  background: var(--primary-gradient);
  color: white;
  font-weight: 600;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.confirm-modal {
  text-align: center;
  max-width: 380px;
}

.confirm-icon {
  font-size: 2.5rem;
  margin-bottom: var(--space-md);
}

.confirm-modal h3 {
  color: var(--primary-dark);
  margin-bottom: var(--space-sm);
}

.confirm-modal p {
  color: var(--gray-600);
  font-size: 0.875rem;
  line-height: 1.6;
}

.btn-delete {
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, #c62828, #f44336);
  color: white;
  font-weight: 600;
}

.btn-delete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
