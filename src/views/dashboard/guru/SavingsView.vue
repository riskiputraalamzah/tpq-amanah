<template>
  <div class="savings-view">
    <header class="page-header">
      <div class="header-content">
        <div>
          <h1>Notulen Keuangan</h1>
          <p>Kelola buku catatan keuangan & tabungan kelompok Anda</p>
        </div>
        <button class="btn-create" @click="openCreateModal">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Buku Baru
        </button>
      </div>
    </header>

    <!-- Panduan Penggunaan (collapsible) -->
    <div class="guide-box glass-card" :class="{ collapsed: guideCollapsed }">
      <button class="guide-toggle" @click="guideCollapsed = !guideCollapsed">
        <div class="guide-toggle-left">
          <span class="guide-icon">💡</span>
          <span class="guide-title">Cara Menggunakan Notulen Keuangan</span>
        </div>
        <svg class="guide-chevron" :class="{ rotated: !guideCollapsed }" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <div class="guide-content" v-show="!guideCollapsed">
        <div class="guide-steps">
          <div class="guide-step">
            <div class="step-num">1</div>
            <div class="step-body">
              <strong>Buat Buku Baru</strong>
              <span>Klik tombol <em>"+ Buku Baru"</em> di pojok kanan atas. Beri nama buku, contoh: <em>"Tabungan Santri Kelas A"</em>, <em>"Kas Guru April"</em>, atau <em>"Iuran Kegiatan"</em>.</span>
            </div>
          </div>
          <div class="guide-step">
            <div class="step-num">2</div>
            <div class="step-body">
              <strong>Buka Buku & Catat Setoran</strong>
              <span>Klik kartu buku untuk masuk ke detailnya. Pilih anggota dari riwayat atau ketik nama baru, lalu masukkan jumlah dan waktu setoran.</span>
            </div>
          </div>
          <div class="guide-step">
            <div class="step-num">3</div>
            <div class="step-body">
              <strong>Pantau Riwayat & Saldo</strong>
              <span>Semua setoran tercatat otomatis lengkap dengan waktu. Anda bisa melihat total per anggota dan keseluruhan kapan saja.</span>
            </div>
          </div>
          <div class="guide-step">
            <div class="step-num">4</div>
            <div class="step-body">
              <strong>Tutup Buku Jika Selesai</strong>
              <span>Jika dana sudah digunakan atau periode selesai, tutup buku dengan ikon <em>×</em>. Riwayat tetap tersimpan untuk keperluan audit.</span>
            </div>
          </div>
        </div>
        <div class="guide-tips">
          <span class="tip-badge">💡 Tips</span>
          Buku ini bisa dipakai untuk apa saja: tabungan santri, kas kelas, iuran guru, dana kegiatan, dll.
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-row" v-if="!loading">
      <div class="stat-pill glass-card">
        <span class="pill-icon">📚</span>
        <div><span class="pill-value">{{ books.length }}</span><span class="pill-label">Total Buku</span></div>
      </div>
      <div class="stat-pill glass-card">
        <span class="pill-icon">✅</span>
        <div><span class="pill-value">{{books.filter(b => b.status === 'active').length}}</span><span
            class="pill-label">Aktif</span></div>
      </div>
      <div class="stat-pill glass-card">
        <span class="pill-icon">💰</span>
        <div><span class="pill-value">Rp {{ formatCurrency(totalBalance) }}</span><span class="pill-label">Total
            Terkumpul</span></div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="books-grid">
      <div v-for="i in 3" :key="i" class="book-card-skeleton glass-card"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="books.length === 0" class="empty-state glass-card">
      <div class="empty-icon">🏦</div>
      <h3>Belum Ada Buku Tabungan</h3>
      <p>Buat buku catatan pertama untuk mulai mencatat setoran atau iuran</p>
      <button class="btn-create m-auto" @click="openCreateModal">Buat Buku Pertama</button>
    </div>

    <!-- Books Grid -->
    <div v-else class="books-grid">
      <div v-for="book in books" :key="book.id" class="book-card glass-card"
        :class="{ 'closed': book.status === 'closed' }" @click="goToDetail(book.id)">
        <div class="book-card-header">
          <div class="book-icon">📒</div>
          <span class="book-status" :class="book.status">
            {{ book.status === 'active' ? 'Aktif' : 'Ditutup' }}
          </span>
        </div>
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
            <span class="bstat-val balance">Rp {{ formatCurrency(book.totalBalance || 0) }}</span>
            <span class="bstat-label">Terkumpul</span>
          </div>
        </div>
        <div class="book-footer">
          <span class="book-date">{{ formatDate(book.createdAt) }}</span>
          <div class="book-actions" @click.stop>
            <button class="icon-btn edit" @click="openEditModal(book)" title="Edit">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button class="icon-btn close-book" v-if="book.status === 'active'" @click="confirmClose(book)"
              title="Tutup Buku">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <button class="icon-btn reopen" v-else @click="reopenBook(book)" title="Buka Kembali">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
              </svg>
            </button>
            <button class="icon-btn delete" @click="confirmDelete(book)" title="Hapus">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showFormModal" class="modal-overlay" @click.self="closeFormModal">
      <div class="modal glass-card">
        <div class="modal-header">
          <h3>{{ editingBook ? 'Edit Buku Tabungan' : 'Buat Buku Tabungan Baru' }}</h3>
          <button class="close-btn" @click="closeFormModal">×</button>
        </div>
        <div class="form-group">
          <label class="form-label">Judul Buku *</label>
          <input v-model="form.title" type="text" class="form-input" placeholder="cth: Tabungan Ramadhan 2026"
            maxlength="100" />
        </div>
        <div class="form-group">
          <label class="form-label">Deskripsi (Opsional)</label>
          <textarea v-model="form.description" class="form-input" rows="3"
            placeholder="Catatan tambahan tentang buku tabungan ini..."></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="closeFormModal">Batal</button>
          <button class="btn-save" @click="saveBook" :disabled="saving">
            {{ saving ? 'Menyimpan...' : (editingBook ? 'Simpan Perubahan' : 'Buat Buku') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm Close Modal -->
    <div v-if="showCloseModal" class="modal-overlay" @click.self="showCloseModal = false">
      <div class="modal glass-card confirm-modal">
        <div class="confirm-icon close-icon">🔒</div>
        <h3>Tutup Buku Tabungan?</h3>
        <p>Buku "<strong>{{ closingBook?.title }}</strong>" akan ditutup. Tidak ada transaksi baru yang bisa
          ditambahkan, namun riwayat tetap tersimpan.</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showCloseModal = false">Batal</button>
          <button class="btn-close-book" @click="closeBook" :disabled="saving">
            {{ saving ? 'Menutup...' : 'Ya, Tutup Buku' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm Delete Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal glass-card confirm-modal">
        <div class="confirm-icon delete-icon">🗑️</div>
        <h3>Hapus Buku Tabungan?</h3>
        <p>Buku "<strong>{{ deletingBook?.title }}</strong>" akan dihapus permanen. Hanya buku yang belum memiliki
          transaksi yang bisa dihapus.</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showDeleteModal = false">Batal</button>
          <button class="btn-delete" @click="deleteBook" :disabled="saving">
            {{ saving ? 'Menghapus...' : 'Ya, Hapus' }}
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

const books = ref([])
const loading = ref(true)
const saving = ref(false)
const guideCollapsed = ref(true) // collapsed by default, user can expand

const showFormModal = ref(false)
const showCloseModal = ref(false)
const showDeleteModal = ref(false)

const editingBook = ref(null)
const closingBook = ref(null)
const deletingBook = ref(null)

const form = ref({ title: '', description: '' })

const totalBalance = computed(() =>
  books.value.reduce((sum, b) => sum + (b.totalBalance || 0), 0)
)

const formatCurrency = (num) =>
  (num || 0).toLocaleString('id-ID')

const formatDate = (d) => {
  if (!d) return '-'
  const date = d?.seconds ? new Date(d.seconds * 1000) : new Date(d)
  return isNaN(date) ? '-' : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const fetchBooks = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/savings/books')
    books.value = data
  } catch (e) {
    showError('Gagal memuat daftar buku tabungan')
  } finally {
    loading.value = false
  }
}

const goToDetail = (id) => router.push(`/dashboard/savings/${id}`)

const openCreateModal = () => {
  editingBook.value = null
  form.value = { title: '', description: '' }
  showFormModal.value = true
}

const openEditModal = (book) => {
  editingBook.value = book
  form.value = { title: book.title, description: book.description || '' }
  showFormModal.value = true
}

const closeFormModal = () => {
  showFormModal.value = false
  editingBook.value = null
}

const saveBook = async () => {
  if (!form.value.title.trim()) {
    showError('Judul buku wajib diisi')
    return
  }
  saving.value = true
  try {
    if (editingBook.value) {
      await api.put(`/savings/books/${editingBook.value.id}`, form.value)
      success('Buku tabungan berhasil diperbarui')
    } else {
      await api.post('/savings/books', form.value)
      success('Buku tabungan berhasil dibuat')
    }
    closeFormModal()
    await fetchBooks()
  } catch (e) {
    showError(e.response?.data?.error || 'Gagal menyimpan buku tabungan')
  } finally {
    saving.value = false
  }
}

const confirmClose = (book) => {
  closingBook.value = book
  showCloseModal.value = true
}

const closeBook = async () => {
  if (!closingBook.value) return
  saving.value = true
  try {
    await api.put(`/savings/books/${closingBook.value.id}`, { status: 'closed' })
    success('Buku tabungan berhasil ditutup')
    showCloseModal.value = false
    await fetchBooks()
  } catch (e) {
    showError(e.response?.data?.error || 'Gagal menutup buku')
  } finally {
    saving.value = false
  }
}

const reopenBook = async (book) => {
  try {
    await api.put(`/savings/books/${book.id}`, { status: 'active' })
    success('Buku tabungan berhasil dibuka kembali')
    await fetchBooks()
  } catch (e) {
    showError(e.response?.data?.error || 'Gagal membuka buku')
  }
}

const confirmDelete = (book) => {
  deletingBook.value = book
  showDeleteModal.value = true
}

const deleteBook = async () => {
  if (!deletingBook.value) return
  saving.value = true
  try {
    await api.delete(`/savings/books/${deletingBook.value.id}`)
    success('Buku tabungan berhasil dihapus')
    showDeleteModal.value = false
    await fetchBooks()
  } catch (e) {
    showError(e.response?.data?.error || 'Gagal menghapus buku tabungan')
  } finally {
    saving.value = false
  }
}

onMounted(fetchBooks)
</script>

<style scoped>
.savings-view {
  padding-top: 60px;
}

@media (min-width: 1024px) {
  .savings-view {
    padding-top: 0;
  }
}

.page-header {
  margin-bottom: var(--space-xl);
}

.header-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.page-header h1 {
  font-size: 1.75rem;
  color: var(--primary-dark);
}

.page-header p {
  color: var(--gray-600);
  margin-top: 2px;
}

/* Stats */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

@media (max-width: 480px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
}

.stat-pill {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
}

.pill-icon {
  font-size: 1.5rem;
}

.stat-pill div {
  display: flex;
  flex-direction: column;
}

.pill-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--primary-dark);
}

.pill-label {
  font-size: 0.72rem;
  color: var(--gray-500);
}

/* Books Grid */
.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-lg);
}

@media (max-width: 480px) {
  .books-grid {
    grid-template-columns: 1fr;
  }
}

.book-card-skeleton {
  height: 200px;
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
  position: relative;
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

.book-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.book-icon {
  font-size: 2rem;
}

.book-status {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.book-status.active {
  background: rgba(76, 175, 80, 0.15);
  color: var(--success);
}

.book-status.closed {
  background: rgba(158, 158, 158, 0.15);
  color: var(--gray-500);
}

.book-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--primary-dark);
  margin-bottom: var(--space-xs);
  line-height: 1.3;
}

.book-desc {
  font-size: 0.8rem;
  color: var(--gray-500);
  margin-bottom: var(--space-lg);
  display: -webkit-box;
  -webkit-line-clamp: 2;
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
  margin-bottom: var(--space-lg);
}

.bstat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bstat-val {
  font-weight: 700;
  color: var(--primary-dark);
  font-size: 0.9rem;
}

.bstat-val.balance {
  font-size: 0.78rem;
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
}

.book-date {
  font-size: 0.75rem;
  color: var(--gray-400);
}

.book-actions {
  display: flex;
  gap: var(--space-xs);
}

.icon-btn {
  width: 30px;
  height: 30px;
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

.icon-btn.close-book {
  color: var(--warning);
  background: rgba(255, 152, 0, 0.1);
}

.icon-btn.close-book:hover {
  background: rgba(255, 152, 0, 0.2);
}

.icon-btn.reopen {
  color: var(--success);
  background: rgba(76, 175, 80, 0.1);
}

.icon-btn.reopen:hover {
  background: rgba(76, 175, 80, 0.2);
}

.icon-btn.delete {
  color: var(--error);
  background: rgba(244, 67, 54, 0.1);
}

.icon-btn.delete:hover {
  background: rgba(244, 67, 54, 0.2);
}

/* Empty */
.empty-state {
  text-align: center;
  padding: var(--space-3xl) var(--space-xl);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--space-lg);
}

.empty-state h3 {
  color: var(--primary-dark);
  margin-bottom: var(--space-sm);
}

.empty-state p {
  color: var(--gray-500);
  margin-bottom: var(--space-xl);
}

/* Buttons */
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
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(27, 94, 32, 0.3);
  white-space: nowrap;
}

.btn-create:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(27, 94, 32, 0.4);
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
  max-width: 480px;
  padding: var(--space-2xl);
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
}

.close-btn {
  font-size: 1.5rem;
  color: var(--gray-400);
  line-height: 1;
  padding: 0 4px;
}

.close-btn:hover {
  color: var(--gray-700);
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
  transition: all 0.2s;
}

.btn-save:hover {
  opacity: 0.9;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Confirm Modal */
.confirm-modal {
  text-align: center;
  max-width: 400px;
}

.confirm-icon {
  font-size: 3rem;
  margin-bottom: var(--space-lg);
}

.confirm-modal h3 {
  color: var(--primary-dark);
  margin-bottom: var(--space-md);
}

.confirm-modal p {
  color: var(--gray-600);
  font-size: 0.9rem;
  line-height: 1.6;
  margin-bottom: var(--space-lg);
}

.btn-close-book {
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, #f57c00, #ff9800);
  color: white;
  font-weight: 600;
}

.btn-delete {
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, #c62828, #f44336);
  color: white;
  font-weight: 600;
}

.btn-close-book:disabled,
.btn-delete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ── Panduan / Guide Box ── */
.guide-box {
  margin-bottom: var(--space-xl);
  overflow: hidden;
  transition: all 0.3s ease;
}

.guide-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-lg) var(--space-xl);
  text-align: left;
  transition: background 0.2s;
}
.guide-toggle:hover { background: rgba(27, 94, 32, 0.04); }

.guide-toggle-left {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.guide-icon { font-size: 1.2rem; flex-shrink: 0; }

.guide-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--primary-dark);
}

.guide-chevron {
  color: var(--gray-400);
  transition: transform 0.3s ease;
  flex-shrink: 0;
}
.guide-chevron.rotated { transform: rotate(180deg); }

.guide-content {
  padding: 0 var(--space-xl) var(--space-xl);
}

.guide-steps {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}
@media (max-width: 600px) {
  .guide-steps { grid-template-columns: 1fr; }
}

.guide-step {
  display: flex;
  gap: var(--space-md);
  align-items: flex-start;
  padding: var(--space-md) var(--space-lg);
  background: rgba(27, 94, 32, 0.04);
  border-radius: var(--radius-lg);
  border-left: 3px solid var(--primary);
}

.step-num {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--primary-gradient);
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.step-body strong {
  font-size: 0.82rem;
  color: var(--primary-dark);
  font-weight: 700;
}
.step-body span {
  font-size: 0.78rem;
  color: var(--gray-600);
  line-height: 1.5;
}
.step-body em {
  font-style: normal;
  font-weight: 600;
  color: var(--primary);
}

.guide-tips {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  background: rgba(251, 191, 36, 0.1);
  border-radius: var(--radius-lg);
  font-size: 0.8rem;
  color: var(--gray-700);
  line-height: 1.5;
  border: 1px solid rgba(251, 191, 36, 0.25);
}

.tip-badge {
  flex-shrink: 0;
  font-weight: 700;
  color: #92400e;
  white-space: nowrap;
}
</style>

