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
          <span>Buku Baru</span>
        </button>
      </div>
    </header>

    <!-- Panduan Penggunaan (collapsible) -->
    <div class="guide-box glass-card" :class="{ collapsed: guideCollapsed }">
      <button class="guide-toggle" @click="guideCollapsed = !guideCollapsed">
        <div class="guide-toggle-left">
          <span class="guide-badge-icon">💡</span>
          <span class="guide-title">Cara Menggunakan Notulen Keuangan</span>
        </div>
        <div class="guide-toggle-right">
          <span class="guide-hint">{{ guideCollapsed ? 'Buka Panduan' : 'Tutup' }}</span>
          <svg class="guide-chevron" :class="{ rotated: !guideCollapsed }" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </button>
      <div class="guide-content" v-show="!guideCollapsed">
        <div class="guide-steps">
          <div class="guide-step">
            <div class="step-num">1</div>
            <div class="step-body">
              <strong>Buat Buku Baru</strong>
              <span>Klik tombol <em>"+ Buku Baru"</em>. Gunakan satu buku untuk satu kebutuhan, contoh: <em>"Kas Guru"</em>, <em>"Iuran Kegiatan"</em>, atau <em>"Tabungan Santri Kelas A"</em>.</span>
            </div>
          </div>
          <div class="guide-step">
            <div class="step-num">2</div>
            <div class="step-body">
              <strong>Atur Akses Buku</strong>
              <span>Buku bisa dibuat <em>Bersama</em> agar guru lain ikut melihat/mencatat, atau <em>Pribadi</em> agar hanya pemilik dan admin yang dapat mengaksesnya.</span>
            </div>
          </div>
          <div class="guide-step">
            <div class="step-num">3</div>
            <div class="step-body">
              <strong>Catat Pemasukan</strong>
              <span>Buka detail buku, pilih tab <em>Pemasukan</em>, lalu pilih anggota dari riwayat atau input nama baru. Nominal pemasukan akan menambah saldo buku dan ringkasan anggota.</span>
            </div>
          </div>
          <div class="guide-step">
            <div class="step-num">4</div>
            <div class="step-body">
              <strong>Catat Pengeluaran</strong>
              <span>Pilih tab <em>Pengeluaran</em>, isi keterangan seperti bisyarah, sampah, perlengkapan, atau kegiatan, lalu masukkan nominal. Pengeluaran akan mengurangi saldo buku.</span>
            </div>
          </div>
          <div class="guide-step">
            <div class="step-num">5</div>
            <div class="step-body">
              <strong>Pantau Saldo & Riwayat</strong>
              <span>Riwayat menampilkan pemasukan sebagai <em>+Rp</em> dan pengeluaran sebagai <em>-Rp</em>. Ringkasan anggota hanya menghitung pemasukan anggota, sedangkan saldo buku menghitung semua transaksi.</span>
            </div>
          </div>
          <div class="guide-step">
            <div class="step-num">6</div>
            <div class="step-body">
              <strong>Cetak PDF atau Tutup Buku</strong>
              <span>Gunakan <em>Cetak PDF</em> di detail buku untuk laporan pembukuan per bulan, rentang tanggal, atau semua transaksi. Jika buku sudah selesai dipakai, tutup buku agar tidak ada transaksi baru.</span>
            </div>
          </div>
          <div class="guide-step">
            <div class="step-num">7</div>
            <div class="step-body">
              <strong>Jika Link Tidak Bisa Dibuka</strong>
              <span>Jika buku yang pernah dibagikan berubah menjadi pribadi, guru lain akan melihat halaman info bahwa buku tidak tersedia dan isi buku tidak ditampilkan demi keamanan data.</span>
            </div>
          </div>
        </div>
        <div class="guide-tips">
          <span class="tip-badge">💡 Tips</span>
          <span>Satu buku sebaiknya dipakai terus untuk satu kas atau kegiatan. Saat laporan dibutuhkan, cetak PDF per bulan agar pembukuan tetap rapi.</span>
        </div>
      </div>
    </div>

    <!-- Stats Row (Responsive 3 Cards / Mobile 2+1 Layout) -->
    <div class="stats-row" v-if="!loading">
      <div class="stat-pill glass-card">
        <div class="pill-icon-wrapper icon-books">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        <div class="pill-info">
          <span class="pill-value">{{ books.length }}</span>
          <span class="pill-label">Total Buku</span>
        </div>
      </div>

      <div class="stat-pill glass-card">
        <div class="pill-icon-wrapper icon-active">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <div class="pill-info">
          <span class="pill-value">{{ books.filter(b => b.status === 'active').length }}</span>
          <span class="pill-label">Buku Aktif</span>
        </div>
      </div>

      <div class="stat-pill glass-card stat-saldo">
        <div class="pill-icon-wrapper icon-balance">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <circle cx="12" cy="12" r="2" />
            <path d="M6 12h.01M18 12h.01" />
          </svg>
        </div>
        <div class="pill-info">
          <span class="pill-value text-balance">Rp {{ formatCurrency(totalBalance) }}</span>
          <span class="pill-label">Total Saldo Terhimpun</span>
        </div>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="books-grid">
      <div v-for="i in 3" :key="i" class="book-card-skeleton glass-card"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="books.length === 0" class="empty-state glass-card">
      <div class="empty-icon-circle">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <circle cx="12" cy="12" r="2" />
          <path d="M6 12h.01M18 12h.01" />
        </svg>
      </div>
      <h3>Belum Ada Buku Tabungan</h3>
      <p>Buat buku catatan pertama untuk mulai mencatat pemasukan, pengeluaran, atau iuran kelompok Anda.</p>
      <button class="btn-create m-auto" @click="openCreateModal">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>Buat Buku Pertama</span>
      </button>
    </div>

    <!-- Books Grid -->
    <div v-else class="books-grid">
      <div
        v-for="book in books"
        :key="book.id"
        class="book-card glass-card"
        :class="{ 'closed': book.status === 'closed' }"
        @click="goToDetail(book.id)"
      >
        <div class="book-card-header">
          <div class="book-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div class="book-badges">
            <span class="book-status" :class="book.status">
              {{ book.status === 'active' ? 'Aktif' : 'Ditutup' }}
            </span>
            <span v-if="book.isPublished" class="book-shared-badge">🌐 Bersama</span>
            <span v-else-if="book.createdBy === authStore.user?.id" class="book-private-badge">🔒 Pribadi</span>
          </div>
        </div>

        <p v-if="book.createdBy !== authStore.user?.id" class="book-owner">
          👤 Oleh {{ book.createdByName }}
        </p>

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
            <span class="bstat-label">Saldo</span>
          </div>
        </div>

        <div class="book-footer">
          <span class="book-date">{{ formatDate(book.createdAt) }}</span>
          <!-- Dropdown menu: hanya owner yang bisa manage buku -->
          <div v-if="book.createdBy === authStore.user?.id" class="book-menu-wrap" @click.stop>
            <button
              class="dots-btn"
              @click="toggleMenu(book.id)"
              :aria-expanded="openMenuId === book.id"
              aria-label="Menu Aksi Buku"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
              </svg>
            </button>
            <div v-if="openMenuId === book.id" class="book-dropdown">
              <button class="dd-item" :class="{ active: book.isPublished }" @click="togglePublish(book); openMenuId = null">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                {{ book.isPublished ? 'Jadikan Pribadi' : 'Publish ke Guru Lain' }}
              </button>
              <button class="dd-item" @click="openEditModal(book); openMenuId = null">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit Buku
              </button>
              <button v-if="book.status === 'active'" class="dd-item warning" @click="confirmClose(book); openMenuId = null">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
                Tutup Buku
              </button>
              <button v-else class="dd-item success" @click="reopenBook(book); openMenuId = null">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="1 4 1 10 7 10"/>
                  <path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
                </svg>
                Buka Kembali
              </button>
              <div class="dd-divider"></div>
              <button class="dd-item danger" @click="confirmDelete(book); openMenuId = null">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4h6v2"/>
                </svg>
                Hapus Buku
              </button>
            </div>
          </div>
        </div><!-- /.book-footer -->
      </div><!-- /.book-card -->
    </div><!-- /.books-grid -->

    <!-- Create/Edit Modal -->
    <div v-if="showFormModal" class="modal-overlay" @click.self="closeFormModal">
      <div class="modal glass-card">
        <div class="modal-header">
          <h3>{{ editingBook ? 'Edit Buku Tabungan' : 'Buat Buku Tabungan Baru' }}</h3>
          <button class="close-btn" @click="closeFormModal">×</button>
        </div>
        <div class="form-group">
          <label class="form-label">Judul Buku *</label>
          <input v-model="form.title" type="text" class="form-input" placeholder="cth: Tabungan Ramadhan 2026" maxlength="100" />
        </div>
        <div class="form-group">
          <label class="form-label">Deskripsi (Opsional)</label>
          <textarea v-model="form.description" class="form-input" rows="3"
            placeholder="Catatan tambahan tentang buku tabungan ini..."></textarea>
        </div>
        <!-- Publish toggle hanya saat buat baru atau edit buku milik sendiri -->
        <div class="form-group" v-if="!editingBook || editingBook.createdBy === authStore.user?.id">
          <label class="publish-toggle-label">
            <span class="ptl-text">
              <strong>{{ form.isPublished ? '🌐 Dipublish' : '🔒 Pribadi' }}</strong>
              <span>{{ form.isPublished ? 'Semua guru bisa melihat & menginput data' : 'Hanya Anda yang bisa melihat buku ini' }}</span>
            </span>
            <button
              type="button"
              class="toggle-switch"
              :class="{ on: form.isPublished }"
              @click="form.isPublished = !form.isPublished"
            >
              <span class="toggle-knob"></span>
            </button>
          </label>
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
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const { success, error: showError } = useToast()
const authStore = useAuthStore()

const books = ref([])
const loading = ref(true)
const saving = ref(false)
const guideCollapsed = ref(true)
const openMenuId = ref(null)

const toggleMenu = (id) => {
  openMenuId.value = openMenuId.value === id ? null : id
}

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
  form.value = { title: '', description: '', isPublished: false }
  showFormModal.value = true
}

const openEditModal = (book) => {
  editingBook.value = book
  form.value = { title: book.title, description: book.description || '', isPublished: book.isPublished ?? false }
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
      success(`Buku tabungan berhasil dibuat${form.value.isPublished ? ' dan dipublish ke semua guru' : ''}`)
    }
    closeFormModal()
    await fetchBooks()
  } catch (e) {
    showError(e.response?.data?.error || 'Gagal menyimpan buku tabungan')
  } finally {
    saving.value = false
  }
}

const togglePublish = async (book) => {
  const newState = !book.isPublished
  try {
    await api.put(`/savings/books/${book.id}`, { isPublished: newState })
    // Replace array item to guarantee Vue reactivity
    const idx = books.value.findIndex(b => b.id === book.id)
    if (idx !== -1) books.value[idx] = { ...books.value[idx], isPublished: newState }
    success(newState ? 'Buku dipublish — semua guru bisa melihatnya' : 'Buku dijadikan pribadi')
  } catch (e) {
    showError(e.response?.data?.error || 'Gagal mengubah status publish')
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

onMounted(() => {
  fetchBooks()
  document.addEventListener('click', () => { openMenuId.value = null })
})
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
  font-weight: 700;
  color: var(--primary-dark);
  margin-bottom: 4px;
}

.page-header p {
  font-size: 0.95rem;
  color: var(--gray-600);
}

@media (max-width: 640px) {
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-create {
    width: 100%;
    justify-content: center;
  }
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
  background: transparent;
  border: none;
  cursor: pointer;
}

.guide-toggle:hover {
  background: rgba(27, 94, 32, 0.04);
}

.guide-toggle-left {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.guide-badge-icon {
  font-size: 1.25rem;
  line-height: 1;
  flex-shrink: 0;
}

.guide-title {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--primary-dark);
}

.guide-toggle-right {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
}

.guide-hint {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--primary);
}

.guide-chevron {
  color: var(--gray-400);
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.guide-chevron.rotated {
  transform: rotate(180deg);
}

.guide-content {
  padding: 0 var(--space-xl) var(--space-xl);
}

.guide-steps {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

@media (max-width: 680px) {
  .guide-steps {
    grid-template-columns: 1fr;
  }
  .guide-content {
    padding: 0 var(--space-lg) var(--space-lg);
  }
  .guide-toggle {
    padding: var(--space-md) var(--space-lg);
  }
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

/* ── Stats Row ── */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

.stat-pill {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
}

.pill-icon-wrapper {
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

.icon-balance {
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
}

.pill-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.pill-value {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--primary-dark);
  line-height: 1.2;
}

.pill-value.text-balance {
  font-size: clamp(1rem, 2.3vw, 1.25rem);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pill-label {
  font-size: 0.72rem;
  color: var(--gray-500);
  margin-top: 2px;
}

@media (max-width: 640px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-sm);
  }

  .stat-saldo {
    grid-column: 1 / -1;
  }

  .stat-pill {
    padding: var(--space-md);
  }

  .pill-icon-wrapper {
    width: 38px;
    height: 38px;
  }
}

@media (max-width: 360px) {
  .stats-row {
    grid-template-columns: 1fr;
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

.book-card-skeleton {
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
  position: relative;
  display: flex;
  flex-direction: column;
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 36px rgba(27, 94, 32, 0.14);
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
  margin-bottom: var(--space-md);
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

.book-status {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.book-status.active {
  background: rgba(76, 175, 80, 0.15);
  color: var(--success);
}

.book-status.closed {
  background: rgba(158, 158, 158, 0.15);
  color: var(--gray-500);
}

.book-shared-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  background: rgba(33, 150, 243, 0.12);
  color: #1565c0;
  white-space: nowrap;
}

.book-private-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  background: rgba(158, 158, 158, 0.12);
  color: var(--gray-500);
  white-space: nowrap;
}

.book-owner {
  font-size: 0.72rem;
  color: var(--gray-400);
  margin-bottom: var(--space-xs);
  margin-top: calc(-1 * var(--space-xs));
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

.bstat-val.balance {
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

/* ── Dots Dropdown Menu ── */
.book-menu-wrap {
  position: relative;
}

.dots-btn {
  width: 38px;
  height: 38px;
  min-width: 38px;
  min-height: 38px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray-500);
  transition: all 0.2s;
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
  cursor: pointer;
}

.dots-btn:hover {
  background: var(--gray-100);
  color: var(--gray-800);
}

.book-dropdown {
  position: absolute;
  right: 0;
  bottom: 44px;
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--gray-200);
  min-width: 200px;
  z-index: 100;
  padding: 6px;
  overflow: hidden;
}

.dd-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-size: 0.84rem;
  color: var(--gray-700);
  text-align: left;
  transition: background 0.15s;
  background: transparent;
  border: none;
  cursor: pointer;
}

.dd-item:hover {
  background: var(--gray-100);
}

.dd-item.active {
  color: #1565c0;
  font-weight: 600;
}

.dd-item.warning {
  color: var(--warning);
}

.dd-item.success {
  color: var(--success);
}

.dd-item.danger {
  color: var(--error);
}

.dd-item.danger:hover {
  background: rgba(244, 67, 54, 0.08);
}

.dd-divider {
  height: 1px;
  background: var(--gray-200);
  margin: 4px 0;
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

/* ── Buttons ── */
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
  border: none;
  cursor: pointer;
}

.btn-create:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(27, 94, 32, 0.4);
}

.m-auto {
  margin: 0 auto;
}

/* ── Publish toggle in form ── */
.publish-toggle-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  background: var(--gray-50);
  border-radius: var(--radius-lg);
  border: 2px solid var(--gray-200);
  cursor: pointer;
  gap: var(--space-md);
}

.ptl-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ptl-text strong {
  font-size: 0.875rem;
  color: var(--primary-dark);
}

.ptl-text span {
  font-size: 0.75rem;
  color: var(--gray-500);
}

.toggle-switch {
  flex-shrink: 0;
  width: 44px;
  height: 24px;
  background: var(--gray-300);
  border-radius: 50px;
  position: relative;
  transition: background 0.25s;
  cursor: pointer;
}

.toggle-switch.on {
  background: var(--primary);
}

.toggle-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  transition: transform 0.25s;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.toggle-switch.on .toggle-knob {
  transform: translateX(20px);
}

/* ── Modals ── */
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

.modal-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
  margin-top: var(--space-xl);
}

@media (max-width: 480px) {
  .modal-actions {
    flex-direction: column-reverse;
  }
  .btn-cancel, .btn-save, .btn-close-book, .btn-delete {
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

/* ── Confirm Modal ── */
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
  font-weight: 700;
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
  border: none;
  cursor: pointer;
}

.btn-delete {
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, #c62828, #f44336);
  color: white;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

.btn-close-book:disabled,
.btn-delete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
