<template>
  <div class="savings-detail">
    <div class="page-header">
      <button class="back-btn" @click="router.back()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Kembali
      </button>
      <div class="header-info" v-if="book">
        <div class="title-row">
          <h1>{{ book.title }}</h1>
          <span class="book-badge" :class="book.status">{{ book.status === 'active' ? 'Aktif' : 'Ditutup' }}</span>
        </div>
        <p v-if="book.description">{{ book.description }}</p>
        <p class="book-meta">Dibuat oleh {{ book.createdByName }} · {{ formatDate(book.createdAt) }}</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <template v-else>
      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="sum-card glass-card">
          <div class="sum-icon" style="background:linear-gradient(135deg,#11998e,#38ef7d)">👥</div>
          <div class="sum-info"><span class="sum-val">{{ summary.length }}</span><span class="sum-label">Anggota</span>
          </div>
        </div>
        <div class="sum-card glass-card">
          <div class="sum-icon" style="background:linear-gradient(135deg,#4facfe,#00f2fe)">📋</div>
          <div class="sum-info"><span class="sum-val">{{ transactions.length }}</span><span
              class="sum-label">Transaksi</span></div>
        </div>
        <div class="sum-card glass-card">
          <div class="sum-icon" style="background:linear-gradient(135deg,#f6d365,#fda085)">💰</div>
          <div class="sum-info"><span class="sum-val">Rp {{ formatCurrency(totalBalance) }}</span><span
              class="sum-label">Total Terkumpul</span></div>
        </div>
      </div>

      <!-- Add Transaction (only if active) -->
      <div v-if="book?.status === 'active'" class="add-section glass-card">
        <h2>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Catat Setoran Baru
        </h2>
        <div class="add-form">
          <!-- Santri Select Mode -->
          <div class="form-group" style="position:relative">
            <label class="form-label">Nama Anggota *</label>

            <div class="santri-input-modes">
              <button class="mode-btn" :class="{ active: inputMode === 'select' }"
                @click="inputMode = 'select'; resetSantriInput()" type="button">
                Pilih dari Riwayat
              </button>
              <button class="mode-btn" :class="{ active: inputMode === 'search' }"
                @click="inputMode = 'search'; resetSantriInput()" type="button">
                Input Data Baru
              </button>
            </div>

            <select v-if="inputMode === 'select'" v-model="selectedExistingSantri" class="form-input mt-2"
              @change="onSelectExisting">
              <option value="">-- Pilih Anggota --</option>
              <option v-for="s in summary" :key="s.santriId" :value="s.santriId">
                {{ s.santriName }}
              </option>
            </select>

            <div v-else class="mt-2" style="position:relative">
              <input v-model="newTx.santriName" type="text" class="form-input" placeholder="Ketik nama anggota..."
                @input="searchSantri" @focus="showSuggestions = true" autocomplete="off" />
              <div v-if="showSuggestions && suggestions.length" class="suggestions-dropdown">
                <div v-for="s in suggestions" :key="s.id" class="suggestion-item" @mousedown.prevent="selectSantri(s)">
                  {{ s.name }}</div>
              </div>
            </div>
          </div>

          <!-- Amount -->
          <div class="form-group">
            <label class="form-label">Jumlah Setoran (Rp) *</label>
            <input v-model="newTx.amount" type="number" class="form-input" placeholder="cth: 5000" min="1" step="1"
              @input="sanitizeAmount" />
          </div>
          <!-- Date -->
          <div class="form-group">
            <label class="form-label">Waktu Setoran (Jam & Menit) *</label>
            <input v-model="newTx.date" type="datetime-local" class="form-input" :max="nowStr" />
          </div>
          <!-- Notes -->
          <div class="form-group">
            <label class="form-label">Catatan (Opsional)</label>
            <input v-model="newTx.notes" type="text" class="form-input" placeholder="cth: Uang jajan hari ini" />
          </div>
          <button class="btn-add" @click="addTransaction" :disabled="submitting">
            {{ submitting ? 'Menyimpan...' : 'Simpan Setoran' }}
          </button>
        </div>
      </div>

      <!-- Closed notice -->
      <div v-else class="closed-notice glass-card">
        🔒 Buku tabungan ini sudah ditutup. Tidak ada transaksi baru yang dapat ditambahkan.
      </div>

      <!-- Per-Santri Summary -->
      <div class="section glass-card">
        <h2>Ringkasan per Anggota</h2>
        <div v-if="summary.length === 0" class="empty-text">Belum ada data anggota</div>
        <div v-else class="santri-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Transaksi</th>
                <th>Total Tabungan</th>
                <th>Terakhir Setor</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in summary" :key="s.santriId">
                <td><span class="santri-name">{{ s.santriName }}</span></td>
                <td class="center">{{ s.transactionCount }}x</td>
                <td class="amount-cell">Rp {{ formatCurrency(s.balance) }}</td>
                <td class=" muted">{{ formatDateTime(s.lastTransaction) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Transaction History -->
      <div class="section glass-card">
        <div class="section-header">
          <h2>Riwayat Transaksi</h2>
          <input v-model="searchTx" type="text" class="search-input" placeholder="Cari nama anggota..." />
        </div>
        <div v-if="filteredTx.length === 0" class="empty-text">Belum ada transaksi</div>
        <div v-else class="tx-list">
          <div v-for="tx in filteredTx" :key="tx.id" class="tx-item">
            <div class="tx-avatar">{{ tx.santriName?.charAt(0)?.toUpperCase() }}</div>
            <div class="tx-info">
              <span class="tx-santri">{{ tx.santriName }}</span>
              <span class="tx-notes">{{ tx.notes || 'Tidak ada catatan' }}</span>
              <span class="tx-meta">{{ formatDateTime(tx.date) }} · dicatat oleh {{ tx.recordedByName }}</span>
            </div>
            <div class="tx-right">
              <span class="tx-amount">+Rp {{ formatCurrency(tx.amount) }}</span>
              <div class="tx-actions">
                <button class="icon-btn edit" @click="openEditTx(tx)" title="Edit" v-if="book?.status === 'active'">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button class="icon-btn delete" @click="confirmDeleteTx(tx)" title="Hapus">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Edit Tx Modal -->
    <div v-if="editingTx" class="modal-overlay" @click.self="editingTx = null">
      <div class="modal glass-card">
        <div class="modal-header">
          <h3>Edit Transaksi</h3>
          <button class="close-btn" @click="editingTx = null">×</button>
        </div>
        <div class="form-group">
          <label class="form-label">Jumlah (Rp)</label>
          <input v-model="editForm.amount" type="number" class="form-input" min="1" step="1" />
        </div>
        <div class="form-group">
          <label class="form-label">Waktu Setoran</label>
          <input v-model="editForm.date" type="datetime-local" class="form-input" :max="nowStr" />
        </div>
        <div class="form-group">
          <label class="form-label">Catatan</label>
          <input v-model="editForm.notes" type="text" class="form-input" />
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="editingTx = null">Batal</button>
          <button class="btn-save" @click="saveEditTx" :disabled="saving">{{ saving ? 'Menyimpan...' : 'Simpan'
            }}</button>
        </div>
      </div>
    </div>

    <!-- Delete Tx Confirm -->
    <div v-if="deletingTx" class="modal-overlay" @click.self="deletingTx = null">
      <div class="modal glass-card confirm-modal">
        <div class="confirm-icon">🗑️</div>
        <h3>Hapus Transaksi?</h3>
        <p>Setoran <strong>Rp {{ formatCurrency(deletingTx.amount) }}</strong> atas nama <strong>{{
          deletingTx.santriName
            }}</strong> akan dihapus.</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="deletingTx = null">Batal</button>
          <button class="btn-delete" @click="deleteTx" :disabled="saving">{{ saving ? 'Menghapus...' : 'Ya, Hapus'
            }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const { success, error: showError } = useToast()
const bookId = route.params.bookId

const book = ref(null)
const summary = ref([])
const transactions = ref([])
const loading = ref(true)
const submitting = ref(false)
const saving = ref(false)
const searchTx = ref('')
const suggestions = ref([])
const showSuggestions = ref(false)
const editingTx = ref(null)
const deletingTx = ref(null)
const editForm = ref({ amount: 0, date: '', notes: '' })

const getNowStr = () => {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

const nowStr = ref(getNowStr())
const inputMode = ref('select') // 'select' or 'search'
const selectedExistingSantri = ref('')

const newTx = ref({ santriId: '', santriName: '', amount: '', date: nowStr.value, notes: '' })

const totalBalance = computed(() => summary.value.reduce((s, x) => s + x.balance, 0))
const filteredTx = computed(() => {
  if (!searchTx.value.trim()) return transactions.value
  const q = searchTx.value.toLowerCase()
  return transactions.value.filter(t => t.santriName?.toLowerCase().includes(q))
})

const formatCurrency = (n) => (n || 0).toLocaleString('id-ID')
const formatDate = (d) => {
  if (!d) return '-'
  const dt = d?.seconds ? new Date(d.seconds * 1000) : new Date(d)
  return isNaN(dt) ? '-' : dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}
const formatDateTime = (d) => {
  if (!d) return '-'
  const dt = d?.seconds ? new Date(d.seconds * 1000) : new Date(d)
  return isNaN(dt) ? '-' : dt.toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const fetchAll = async () => {
  loading.value = true
  try {
    const [bookRes, txRes, sumRes] = await Promise.all([
      api.get(`/savings/books/${bookId}`),
      api.get(`/savings/books/${bookId}/transactions`),
      api.get(`/savings/books/${bookId}/summary`)
    ])
    book.value = bookRes.data
    transactions.value = txRes.data
    summary.value = sumRes.data

    // Default to search if no summary
    if (summary.value.length === 0) {
      inputMode.value = 'search'
    }
  } catch (e) {
    showError('Gagal memuat data buku tabungan')
  } finally {
    loading.value = false
  }
}

const sanitizeAmount = (e) => {
  // Hapus karakter bukan digit, lalu parse integer
  const raw = String(e.target.value).replace(/[^0-9]/g, '')
  newTx.value.amount = raw ? parseInt(raw, 10) : ''
}

const resetSantriInput = () => {
  selectedExistingSantri.value = ''
  newTx.value.santriId = ''
  newTx.value.santriName = ''
}

const onSelectExisting = () => {
  const selectedId = selectedExistingSantri.value
  if (!selectedId) {
    newTx.value.santriId = ''
    newTx.value.santriName = ''
    return
  }
  const s = summary.value.find(x => x.santriId === selectedId)
  if (s) {
    newTx.value.santriId = s.santriId
    newTx.value.santriName = s.santriName
  }
}

let searchTimer = null
const searchSantri = () => {
  clearTimeout(searchTimer)
  newTx.value.santriId = ''
  if (!newTx.value.santriName.trim() || newTx.value.santriName.length < 2) {
    suggestions.value = []
    return
  }
  searchTimer = setTimeout(async () => {
    try {
      const { data } = await api.get('/santri/search', { params: { q: newTx.value.santriName } })
      suggestions.value = data.slice(0, 6)
    } catch { suggestions.value = [] }
  }, 300)
}

const selectSantri = (s) => {
  newTx.value.santriId = s.id
  newTx.value.santriName = s.name
  suggestions.value = []
  showSuggestions.value = false
}

const addTransaction = async () => {
  if (!newTx.value.santriName.trim()) { showError('Nama anggota wajib diisi'); return }
  if (!newTx.value.santriId) {
    // Allow manual name entry - generate temp id from name
    newTx.value.santriId = 'manual_' + newTx.value.santriName.toLowerCase().replace(/\s+/g, '_')
  }
  if (!newTx.value.amount || parseInt(String(newTx.value.amount).replace(/[^0-9]/g, ''), 10) <= 0) { showError('Jumlah setoran harus lebih dari 0'); return }
  submitting.value = true
  try {
    // Generate ISO string from local datetime
    let finalDate
    if (newTx.value.date) {
      finalDate = new Date(newTx.value.date).toISOString()
    } else {
      finalDate = new Date().toISOString()
    }

    await api.post(`/savings/books/${bookId}/transactions`, {
      santriId: newTx.value.santriId,
      santriName: newTx.value.santriName.trim(),
      amount: parseInt(String(newTx.value.amount).replace(/[^0-9]/g, ''), 10),
      notes: newTx.value.notes,
      date: finalDate
    })
    success('Setoran berhasil dicatat')

    const currMode = inputMode.value
    resetSantriInput()
    newTx.value.amount = ''
    newTx.value.notes = ''
    nowStr.value = getNowStr()
    newTx.value.date = nowStr.value

    await fetchAll()
  } catch (e) {
    showError(e.response?.data?.error || 'Gagal mencatat setoran')
  } finally {
    submitting.value = false
  }
}

const openEditTx = (tx) => {
  editingTx.value = tx
  const d = tx.date?.seconds ? new Date(tx.date.seconds * 1000) : new Date(tx.date)

  editForm.value = {
    amount: tx.amount,
    date: isNaN(d) ? getNowStr() : new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16),
    notes: tx.notes || ''
  }
}

const saveEditTx = async () => {
  if (!editForm.value.amount || parseInt(String(editForm.value.amount), 10) <= 0) { showError('Jumlah harus lebih dari 0'); return }
  saving.value = true
  try {
    let finalDate = editForm.value.date ? new Date(editForm.value.date).toISOString() : new Date().toISOString()
    await api.put(`/savings/transactions/${editingTx.value.id}`, {
      amount: parseInt(String(editForm.value.amount).replace(/[^0-9]/g, ''), 10),
      date: finalDate,
      notes: editForm.value.notes
    })
    success('Transaksi berhasil diperbarui')
    editingTx.value = null
    await fetchAll()
  } catch (e) {
    showError(e.response?.data?.error || 'Gagal memperbarui transaksi')
  } finally {
    saving.value = false
  }
}

const confirmDeleteTx = (tx) => { deletingTx.value = tx }

const deleteTx = async () => {
  saving.value = true
  try {
    await api.delete(`/savings/transactions/${deletingTx.value.id}`)
    success('Transaksi berhasil dihapus')
    deletingTx.value = null
    await fetchAll()
  } catch (e) {
    showError(e.response?.data?.error || 'Gagal menghapus transaksi')
  } finally {
    saving.value = false
  }
}

onMounted(fetchAll)
</script>

<style scoped>
.savings-detail {
  padding-top: 60px;
}

@media (min-width: 1024px) {
  .savings-detail {
    padding-top: 0;
  }
}

.page-header {
  margin-bottom: var(--space-xl);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--primary);
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: var(--space-lg);
  padding: var(--space-sm) 0;
  transition: gap 0.2s;
}

.back-btn:hover {
  gap: var(--space-md);
}

.title-row {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.header-info h1 {
  font-size: 1.75rem;
  color: var(--primary-dark);
}

.header-info p {
  color: var(--gray-600);
  margin-top: 2px;
  font-size: 0.9rem;
}

.book-meta {
  color: var(--gray-400) !important;
  font-size: 0.8rem !important;
  margin-top: 4px;
}

.book-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 12px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
}

.book-badge.active {
  background: rgba(76, 175, 80, 0.15);
  color: var(--success);
}

.book-badge.closed {
  background: rgba(158, 158, 158, 0.15);
  color: var(--gray-500);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: var(--space-3xl);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--gray-200);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Summary */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

@media (max-width: 480px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}

.sum-card {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-lg);
}

.sum-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  flex-shrink: 0;
}

.sum-info {
  display: flex;
  flex-direction: column;
}

.sum-val {
  font-weight: 700;
  color: var(--primary-dark);
  font-size: 1rem;
}

.sum-label {
  font-size: 0.72rem;
  color: var(--gray-500);
  margin-top: 2px;
}

/* Add Section */
.add-section {
  padding: var(--space-xl);
  margin-bottom: var(--space-xl);
}

.add-section h2 {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: 1.05rem;
  color: var(--primary-dark);
  margin-bottom: var(--space-xl);
}

.add-form {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-md);
}

@media (max-width: 600px) {
  .add-form {
    grid-template-columns: 1fr;
  }
}

.add-form .form-group:last-of-type {
  grid-column: 1 / -1;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: var(--space-xs);
}

.form-input {
  padding: var(--space-md) var(--space-lg);
  border: 2px solid var(--gray-200);
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: var(--primary);
}

.mt-2 {
  margin-top: 8px;
}

/* Input Modes */
.santri-input-modes {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-xs);
}

.mode-btn {
  flex: 1;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--gray-100);
  color: var(--gray-600);
  border: 1px solid var(--gray-200);
  transition: all 0.2s;
}

.mode-btn.active {
  background: var(--primary-gradient);
  color: white;
  border-color: transparent;
}

.mode-btn:hover:not(.active) {
  background: var(--gray-200);
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  z-index: 50;
  max-height: 200px;
  overflow-y: auto;
}

.suggestion-item {
  padding: var(--space-md) var(--space-lg);
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.15s;
}

.suggestion-item:hover {
  background: var(--gray-50);
  color: var(--primary);
}

.btn-add {
  grid-column: 1 / -1;
  padding: var(--space-md) var(--space-xl);
  background: var(--primary-gradient);
  color: white;
  border-radius: var(--radius-lg);
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(27, 94, 32, 0.3);
}

.btn-add:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(27, 94, 32, 0.4);
}

.btn-add:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.closed-notice {
  padding: var(--space-xl);
  text-align: center;
  color: var(--gray-500);
  font-size: 0.9rem;
  margin-bottom: var(--space-xl);
}

/* Sections */
.section {
  padding: var(--space-xl);
  margin-bottom: var(--space-xl);
}

.section h2,
.section-header h2 {
  font-size: 1.05rem;
  color: var(--primary-dark);
  margin-bottom: var(--space-lg);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
  flex-wrap: wrap;
}

.search-input {
  padding: var(--space-sm) var(--space-md);
  border: 1.5px solid var(--gray-200);
  border-radius: var(--radius-lg);
  font-size: 0.8rem;
  outline: none;
  width: 200px;
}

.search-input:focus {
  border-color: var(--primary);
}

.empty-text {
  text-align: center;
  color: var(--gray-400);
  padding: var(--space-xl) 0;
  font-size: 0.9rem;
}

/* Table */
.santri-table-wrap {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table th {
  text-align: left;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--gray-500);
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--gray-100);
}

.data-table td {
  padding: var(--space-md);
  border-bottom: 1px solid var(--gray-50);
}

.data-table tr:last-child td {
  border-bottom: none;
}

.santri-name {
  font-weight: 600;
  color: var(--primary-dark);
}

.center {
  text-align: center;
}

.amount-cell {
  font-weight: 700;
  color: var(--success);
}

.muted {
  color: var(--gray-400);
  font-size: 0.8rem;
}

/* Transactions */
.tx-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.tx-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  background: var(--gray-50);
  transition: background 0.2s;
}

.tx-item:hover {
  background: rgba(27, 94, 32, 0.05);
}

.tx-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary-gradient);
  color: white;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.tx-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.tx-santri {
  font-weight: 600;
  color: var(--primary-dark);
  font-size: 0.875rem;
}

.tx-notes {
  color: var(--gray-500);
  font-size: 0.78rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tx-meta {
  color: var(--gray-400);
  font-size: 0.72rem;
  margin-top: 2px;
}

.tx-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-xs);
  flex-shrink: 0;
}

.tx-amount {
  font-weight: 700;
  color: var(--success);
  font-size: 0.9rem;
  white-space: nowrap;
}

.tx-actions {
  display: flex;
  gap: 4px;
}

.icon-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.icon-btn.edit {
  color: var(--info);
  background: rgba(33, 150, 243, 0.1);
}

.icon-btn.edit:hover {
  background: rgba(33, 150, 243, 0.2);
}

.icon-btn.delete {
  color: var(--error);
  background: rgba(244, 67, 54, 0.1);
}

.icon-btn.delete:hover {
  background: rgba(244, 67, 54, 0.2);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
  backdrop-filter: blur(4px);
}

.modal {
  width: 100%;
  max-width: 440px;
  padding: var(--space-2xl);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xl);
}

.modal-header h3 {
  font-size: 1.1rem;
  color: var(--primary-dark);
}

.close-btn {
  font-size: 1.5rem;
  color: var(--gray-400);
  line-height: 1;
  padding: 0 4px;
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
  transition: background 0.2s;
}

.btn-cancel:hover {
  background: var(--gray-200);
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
