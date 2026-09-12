<template>
  <div class="admin-savings">
    <header class="page-header">
      <div class="header-row">
        <div>
          <h1>Rekap Notulen Keuangan</h1>
          <p>Lihat semua buku catatan keuangan dari seluruh guru</p>
        </div>
        <button class="btn-create" @click="showCreateModal = true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Buku Baru</span>
        </button>
      </div>
    </header>

    <!-- Global Stats -->
    <div class="stats-grid" v-if="!loading">
      <div class="stat-card glass-card">
        <div class="stat-icon-box icon-books">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-val">{{ allBooks.length }}</span>
          <span class="stat-label">Total Buku</span>
        </div>
      </div>

      <div class="stat-card glass-card">
        <div class="stat-icon-box icon-active">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-val">{{ allBooks.filter(b => b.status === 'active').length }}</span>
          <span class="stat-label">Buku Aktif</span>
        </div>
      </div>

      <div class="stat-card glass-card stat-card-total">
        <div class="stat-icon-box icon-total">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <circle cx="12" cy="12" r="2" />
            <path d="M6 12h.01M18 12h.01" />
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-val grand-amount">Rp {{ formatCurrency(grandTotal) }}</span>
          <span class="stat-label">Grand Total Saldo</span>
        </div>
      </div>

      <div class="stat-card glass-card">
        <div class="stat-icon-box icon-tx">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="2" width="6" height="4" rx="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <line x1="9" y1="12" x2="15" y2="12" />
            <line x1="9" y1="16" x2="15" y2="16" />
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-val">{{ totalTransactions }}</span>
          <span class="stat-label">Total Transaksi</span>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar glass-card" v-if="!loading && allBooks.length > 0">
      <div class="filter-search-wrap">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input v-model="searchQ" type="text" class="search-input" placeholder="Cari judul buku..." />
      </div>

      <div class="filter-controls-wrap">
        <div class="filter-item">
          <label class="filter-label">Guru:</label>
          <select v-model="filterGuru" class="filter-select">
            <option value="">Semua Guru</option>
            <option v-for="g in guruList" :key="g.id" :value="g.id">{{ g.name }}</option>
          </select>
        </div>

        <div class="filter-item">
          <label class="filter-label">Status:</label>
          <select v-model="filterStatus" class="filter-select">
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="closed">Ditutup</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="books-grid">
      <div v-for="i in 4" :key="i" class="book-skeleton glass-card"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredBooks.length === 0" class="empty-state glass-card">
      <div class="empty-icon-circle">
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <circle cx="12" cy="12" r="2" />
          <path d="M6 12h.01M18 12h.01" />
        </svg>
      </div>
      <h3>{{ allBooks.length === 0 ? 'Belum Ada Buku Catatan' : 'Tidak Ada Hasil' }}</h3>
      <p>{{ allBooks.length === 0 ? 'Guru belum membuat buku catatan keuangan apapun.' : 'Coba ubah kata kunci atau filter pencarian Anda.' }}</p>
    </div>

    <!-- Books List -->
    <div v-else class="books-grid">
      <div
        v-for="book in filteredBooks"
        :key="book.id"
        class="book-card glass-card"
        :class="{ closed: book.status === 'closed' }"
        @click="router.push(`/dashboard/savings/${book.id}`)"
      >
        <div class="book-card-header">
          <div class="book-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div class="book-badges">
            <span class="book-badge" :class="book.status">
              {{ book.status === 'active' ? 'Aktif' : 'Ditutup' }}
            </span>
            <span v-if="book.isPublished" class="book-shared-pill">🌐 Bersama</span>
          </div>
        </div>

        <p class="guru-tag">👤 Oleh {{ book.createdByName }}</p>
        <h3 class="book-title">{{ book.title }}</h3>
        <p class="book-desc" v-if="book.description">{{ book.description }}</p>

        <div class="book-stats">
          <div class="bstat">
            <span class="bstat-val">{{ book.santriCount || 0 }}</span>
            <span class="bstat-label">Anggota</span>
          </div>
          <div class="bstat">
            <span class="bstat-val">{{ book.totalTransactions || 0 }}</span>
            <span class="bstat-label">Transaksi</span>
          </div>
          <div class="bstat">
            <span class="bstat-val amount">Rp {{ formatCurrency(book.totalBalance || 0) }}</span>
            <span class="bstat-label">Saldo</span>
          </div>
        </div>

        <div class="book-footer">
          <span class="book-date">{{ formatDate(book.createdAt) }}</span>
          <span class="book-open-link">
            Buka Detail
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
        </div>
      </div>
    </div>

    <!-- Create Book Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal glass-card">
        <div class="modal-header">
          <h3>Buat Buku Baru</h3>
          <button class="close-btn" @click="showCreateModal = false">&times;</button>
        </div>
        <div class="form-group">
          <label class="form-label">Judul Buku *</label>
          <input
            v-model="createForm.title"
            type="text"
            class="form-input"
            placeholder="cth: Kas Guru April 2026"
            maxlength="100"
          />
        </div>
        <div class="form-group">
          <label class="form-label">Deskripsi (Opsional)</label>
          <textarea
            v-model="createForm.description"
            class="form-input"
            rows="3"
            placeholder="Catatan tentang buku ini..."
          ></textarea>
        </div>
        <div class="info-note">
          🌐 Buku yang dibuat admin otomatis dipublish dan bisa dilihat oleh semua guru.
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showCreateModal = false">Batal</button>
          <button class="btn-save" @click="createBook" :disabled="creating">
            {{ creating ? 'Menyimpan...' : 'Buat Buku' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { success, error: showError } = useToast()

const allBooks = ref([])
const loading = ref(true)
const showCreateModal = ref(false)
const creating = ref(false)
const createForm = ref({ title: '', description: '' })
const filterGuru = ref('')
const filterStatus = ref('')
const searchQ = ref('')

const grandTotal = computed(() => allBooks.value.reduce((s, b) => s + (b.totalBalance || 0), 0))
const totalTransactions = computed(() => allBooks.value.reduce((s, b) => s + (b.totalTransactions || 0), 0))

const guruList = computed(() => {
  const map = new Map()
  allBooks.value.forEach(b => {
    if (!map.has(b.createdBy)) map.set(b.createdBy, { id: b.createdBy, name: b.createdByName })
  })
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
})

const filteredBooks = computed(() => {
  return allBooks.value.filter(b => {
    if (filterGuru.value && b.createdBy !== filterGuru.value) return false
    if (filterStatus.value && b.status !== filterStatus.value) return false
    if (searchQ.value && !b.title.toLowerCase().includes(searchQ.value.toLowerCase())) return false
    return true
  })
})

const formatCurrency = (n) => (n || 0).toLocaleString('id-ID')
const formatDate = (d) => {
  if (!d) return '-'
  const dt = d?.seconds ? new Date(d.seconds * 1000) : new Date(d)
  return isNaN(dt) ? '-' : dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const createBook = async () => {
  if (!createForm.value.title.trim()) { showError('Judul buku wajib diisi'); return }
  creating.value = true
  try {
    await api.post('/savings/books', { ...createForm.value, isPublished: true })
    success('Buku berhasil dibuat dan dipublish ke semua guru')
    showCreateModal.value = false
    createForm.value = { title: '', description: '' }
    const { data } = await api.get('/savings/books')
    allBooks.value = data
  } catch (e) {
    showError(e.response?.data?.error || 'Gagal membuat buku')
  } finally {
    creating.value = false
  }
}

onMounted(async () => {
  try {
    const { data } = await api.get('/savings/books')
    allBooks.value = data
  } catch (e) {
    showError('Gagal memuat data tabungan')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.admin-savings {
  padding-top: 0;
}

.page-header {
  margin-bottom: var(--space-xl);
}

.header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--primary-dark);
  margin-bottom: 4px;
}

.page-header p {
  font-size: 0.95rem;
  color: var(--gray-600);
}

.btn-create {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-xl);
  background: var(--primary-gradient);
  color: white;
  border-radius: var(--radius-lg);
  font-weight: 600;
  font-size: 0.9rem;
  box-shadow: 0 4px 15px rgba(27, 94, 32, 0.3);
  white-space: nowrap;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.btn-create:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(27, 94, 32, 0.4);
}

@media (max-width: 640px) {
  .header-row {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-create {
    width: 100%;
    justify-content: center;
  }
}

/* ── Stats Grid ── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-sm);
  }

  .stat-card-total {
    grid-column: 1 / -1;
  }

  .stat-card {
    padding: var(--space-md) !important;
  }

  .stat-icon-box {
    width: 38px !important;
    height: 38px !important;
  }
}

@media (max-width: 360px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
}

.stat-icon-box {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-books {
  background: rgba(33, 150, 243, 0.12);
  color: #1976d2;
}

.icon-active {
  background: rgba(46, 125, 50, 0.12);
  color: #2e7d32;
}

.icon-total {
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
}

.icon-tx {
  background: rgba(14, 165, 233, 0.14);
  color: #0284c7;
}

.stat-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.stat-val {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--primary-dark);
  line-height: 1.2;
}

.stat-val.grand-amount {
  font-size: clamp(1rem, 2.3vw, 1.25rem);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-label {
  font-size: 0.72rem;
  color: var(--gray-500);
  margin-top: 2px;
}

/* ── Filter Bar ── */
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-xl);
  margin-bottom: var(--space-xl);
  flex-wrap: wrap;
}

.filter-search-wrap {
  position: relative;
  flex: 1;
  min-width: 220px;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: var(--gray-400);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 10px 14px 10px 38px;
  border: 1.5px solid var(--gray-200);
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  outline: none;
  background: white;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(27, 94, 32, 0.1);
}

.filter-controls-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.filter-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--gray-600);
  white-space: nowrap;
}

.filter-select {
  padding: 9px 12px;
  border: 1.5px solid var(--gray-200);
  border-radius: var(--radius-lg);
  font-size: 0.85rem;
  background: white;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
}

.filter-select:focus {
  border-color: var(--primary);
}

@media (max-width: 640px) {
  .filter-bar {
    padding: var(--space-md);
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-sm);
  }

  .filter-search-wrap {
    width: 100%;
  }

  .filter-controls-wrap {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-sm);
  }

  .filter-item {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }

  .filter-select {
    width: 100%;
  }
}

/* ── Books Grid ── */
.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: var(--space-lg);
}

@media (max-width: 480px) {
  .books-grid {
    grid-template-columns: 1fr;
    gap: var(--space-md);
  }
}

.book-skeleton {
  height: 220px;
  border-radius: var(--radius-xl);
  animation: pulse 1.5s ease infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}

.book-card {
  padding: var(--space-xl);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  position: relative;
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 36px rgba(27, 94, 32, 0.14);
}

.book-card:hover .book-open-link {
  color: var(--primary-dark);
  gap: 6px;
}

.book-card.closed {
  opacity: 0.72;
}

.book-card.closed:hover {
  transform: none;
}

.book-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.book-icon-box {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: rgba(27, 94, 32, 0.08);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.book-badges {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.book-badge {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.book-badge.active {
  background: rgba(76, 175, 80, 0.15);
  color: var(--success);
}

.book-badge.closed {
  background: rgba(158, 158, 158, 0.15);
  color: var(--gray-500);
}

.book-shared-pill {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  background: rgba(33, 150, 243, 0.12);
  color: #1565c0;
  white-space: nowrap;
}

.guru-tag {
  font-size: 0.74rem;
  color: var(--gray-500);
  margin-bottom: var(--space-xs);
}

.book-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--primary-dark);
  margin-bottom: var(--space-xs);
  line-height: 1.35;
}

.book-desc {
  font-size: 0.8rem;
  color: var(--gray-500);
  margin-bottom: var(--space-lg);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.45;
}

.book-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-xs);
  background: var(--gray-50);
  border-radius: var(--radius-lg);
  padding: var(--space-md) var(--space-sm);
  margin-top: auto;
  margin-bottom: var(--space-md);
}

.bstat {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-width: 0;
}

.bstat-val {
  font-weight: 700;
  color: var(--primary-dark);
  font-size: 0.88rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.bstat-val.amount {
  font-size: 0.76rem;
  color: var(--primary-dark);
}

.bstat-label {
  font-size: 0.65rem;
  color: var(--gray-500);
  margin-top: 2px;
}

.book-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-xs);
}

.book-date {
  font-size: 0.75rem;
  color: var(--gray-400);
}

.book-open-link {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--primary);
  display: inline-flex;
  align-items: center;
  gap: 3px;
  transition: all 0.2s ease;
}

/* ── Empty State ── */
.empty-state {
  text-align: center;
  padding: var(--space-3xl) var(--space-xl);
}

.empty-icon-circle {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  margin: 0 auto var(--space-lg);
  background: rgba(27, 94, 32, 0.08);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(27, 94, 32, 0.08);
}

.empty-state h3 {
  color: var(--primary-dark);
  font-size: 1.15rem;
  font-weight: 700;
  margin-bottom: var(--space-sm);
}

.empty-state p {
  color: var(--gray-500);
  font-size: 0.9rem;
  max-width: 440px;
  margin: 0 auto var(--space-xl);
  line-height: 1.5;
}

/* ── Modal ── */
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
  max-width: 480px;
  padding: var(--space-2xl);
  max-height: 90vh;
  overflow-y: auto;
}

@media (max-width: 480px) {
  .modal {
    padding: var(--space-lg);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xl);
}

.modal-header h3 {
  font-size: 1.15rem;
  color: var(--primary-dark);
  font-weight: 700;
}

.close-btn {
  font-size: 1.5rem;
  color: var(--gray-400);
  line-height: 1;
  padding: 4px 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: var(--radius-sm);
}

.close-btn:hover {
  color: var(--gray-700);
  background: var(--gray-100);
}

.form-group {
  margin-bottom: var(--space-lg);
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: var(--space-sm);
}

.form-input {
  width: 100%;
  padding: var(--space-md) var(--space-lg);
  border: 2px solid var(--gray-200);
  border-radius: var(--radius-lg);
  font-size: 0.9rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
  resize: vertical;
}

.form-input:focus {
  border-color: var(--primary);
}

.info-note {
  padding: var(--space-md) var(--space-lg);
  background: rgba(33, 150, 243, 0.08);
  border-radius: var(--radius-lg);
  border-left: 3px solid #1565c0;
  font-size: 0.8rem;
  color: #1565c0;
  margin-bottom: var(--space-xl);
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
}

@media (max-width: 480px) {
  .modal-actions {
    flex-direction: column-reverse;
  }
  .btn-cancel, .btn-save {
    width: 100%;
    text-align: center;
    justify-content: center;
  }
}

.btn-cancel {
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-lg);
  color: var(--gray-600);
  background: var(--gray-100);
  font-weight: 600;
  transition: background 0.2s;
  border: none;
  cursor: pointer;
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
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.btn-save:hover {
  opacity: 0.9;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
