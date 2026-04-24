<template>
  <div class="admin-savings">
    <header class="page-header">
      <h1>Rekap Notulen Keuangan</h1>
      <p>Lihat semua buku catatan keuangan dari seluruh guru</p>
    </header>

    <!-- Global Stats -->
    <div class="stats-grid" v-if="!loading">
      <div class="stat-card glass-card">
        <div class="stat-icon" style="background:linear-gradient(135deg,#667eea,#764ba2)">📚</div>
        <div class="stat-info"><span class="stat-val">{{ allBooks.length }}</span><span class="stat-label">Total
            Buku</span></div>
      </div>
      <div class="stat-card glass-card">
        <div class="stat-icon" style="background:linear-gradient(135deg,#11998e,#38ef7d)">✅</div>
        <div class="stat-info"><span class="stat-val">{{allBooks.filter(b => b.status === 'active').length}}</span><span
            class="stat-label">Buku Aktif</span></div>
      </div>
      <div class="stat-card glass-card">
        <div class="stat-icon" style="background:linear-gradient(135deg,#f6d365,#fda085)">💰</div>
        <div class="stat-info"><span class="stat-val">Rp {{ formatCurrency(grandTotal) }}</span><span
            class="stat-label">Grand Total</span></div>
      </div>
      <div class="stat-card glass-card">
        <div class="stat-icon" style="background:linear-gradient(135deg,#4facfe,#00f2fe)">📋</div>
        <div class="stat-info"><span class="stat-val">{{ totalTransactions }}</span><span class="stat-label">Total
            Transaksi</span></div>
      </div>
    </div>

    <!-- Filter -->
    <div class="filter-bar glass-card" v-if="!loading && allBooks.length > 0">
      <div class="filter-item">
        <label class="filter-label">Filter Guru:</label>
        <select v-model="filterGuru" class="filter-select">
          <option value="">Semua Guru</option>
          <option v-for="g in guruList" :key="g.id" :value="g.id">{{ g.name }}</option>
        </select>
      </div>
      <div class="filter-item">
        <label class="filter-label">Status:</label>
        <select v-model="filterStatus" class="filter-select">
          <option value="">Semua</option>
          <option value="active">Aktif</option>
          <option value="closed">Ditutup</option>
        </select>
      </div>
      <div class="filter-item">
        <input v-model="searchQ" type="text" class="search-input" placeholder="Cari judul buku..." />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="books-grid">
      <div v-for="i in 4" :key="i" class="book-skeleton glass-card"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredBooks.length === 0" class="empty-state glass-card">
      <div class="empty-icon">🏦</div>
      <h3>{{ allBooks.length === 0 ? 'Belum Ada Buku Catatan' : 'Tidak Ada Hasil' }}</h3>
      <p>{{ allBooks.length === 0 ? 'Guru belum membuat buku catatan keuangan apapun' : 'Coba ubah filter pencarian' }}
      </p>
    </div>

    <!-- Books List -->
    <div v-else class="books-grid">
      <div v-for="book in filteredBooks" :key="book.id" class="book-card glass-card"
        :class="{ closed: book.status === 'closed' }" @click="router.push(`/dashboard/savings/${book.id}`)">
        <div class="book-top">
          <div class="book-left">
            <span class="book-icon">📒</span>
            <div>
              <h3 class="book-title">{{ book.title }}</h3>
              <span class="guru-tag">👤 {{ book.createdByName }}</span>
            </div>
          </div>
          <span class="book-badge" :class="book.status">{{ book.status === 'active' ? 'Aktif' : 'Ditutup' }}</span>
        </div>
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
            <span class="bstat-label">Terkumpul</span>
          </div>
        </div>
        <div class="book-date">{{ formatDate(book.createdAt) }}</div>
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
const { error: showError } = useToast()

const allBooks = ref([])
const loading = ref(true)
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

.page-header h1 {
  font-size: 1.75rem;
  color: var(--primary-dark);
}

.page-header p {
  color: var(--gray-600);
  margin-top: 2px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 400px) {
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

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-val {
  font-weight: 700;
  color: var(--primary-dark);
  font-size: 1rem;
}

.stat-label {
  font-size: 0.72rem;
  color: var(--gray-500);
  margin-top: 2px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-lg) var(--space-xl);
  margin-bottom: var(--space-xl);
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.filter-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--gray-600);
  white-space: nowrap;
}

.filter-select {
  padding: var(--space-sm) var(--space-md);
  border: 1.5px solid var(--gray-200);
  border-radius: var(--radius-lg);
  font-size: 0.8rem;
  outline: none;
}

.filter-select:focus {
  border-color: var(--primary);
}

.search-input {
  padding: var(--space-sm) var(--space-md);
  border: 1.5px solid var(--gray-200);
  border-radius: var(--radius-lg);
  font-size: 0.8rem;
  outline: none;
  width: 180px;
}

.search-input:focus {
  border-color: var(--primary);
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-lg);
}

@media (max-width: 480px) {
  .books-grid {
    grid-template-columns: 1fr;
  }
}

.book-skeleton {
  height: 180px;
  animation: pulse 1.5s ease infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1
  }

  50% {
    opacity: .5
  }
}

.book-card {
  padding: var(--space-xl);
  cursor: pointer;
  transition: all 0.25s ease;
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 50px rgba(27, 94, 32, 0.18);
}

.book-card.closed {
  opacity: 0.7;
}

.book-card.closed:hover {
  transform: none;
}

.book-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-md);
}

.book-left {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.book-icon {
  font-size: 1.8rem;
}

.book-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary-dark);
  margin-bottom: 2px;
}

.guru-tag {
  font-size: 0.72rem;
  color: var(--gray-500);
}

.book-badge {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  white-space: nowrap;
}

.book-badge.active {
  background: rgba(76, 175, 80, 0.15);
  color: var(--success);
}

.book-badge.closed {
  background: rgba(158, 158, 158, 0.15);
  color: var(--gray-500);
}

.book-desc {
  font-size: 0.78rem;
  color: var(--gray-400);
  margin-bottom: var(--space-md);
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.book-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-sm);
  background: var(--gray-50);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  margin-bottom: var(--space-md);
}

.bstat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bstat-val {
  font-weight: 700;
  color: var(--primary-dark);
  font-size: 0.875rem;
}

.bstat-val.amount {
  font-size: 0.75rem;
  color: var(--success);
}

.bstat-label {
  font-size: 0.65rem;
  color: var(--gray-500);
  margin-top: 2px;
}

.book-date {
  font-size: 0.72rem;
  color: var(--gray-400);
  text-align: right;
}

.empty-state {
  text-align: center;
  padding: var(--space-3xl) var(--space-xl);
}

.empty-icon {
  font-size: 3.5rem;
  margin-bottom: var(--space-lg);
}

.empty-state h3 {
  color: var(--primary-dark);
  margin-bottom: var(--space-sm);
}

.empty-state p {
  color: var(--gray-500);
  font-size: 0.9rem;
}
</style>
