<template>
  <div class="dashboard-home">
    <header class="page-header">
      <h1>Dashboard</h1>
      <p>Selamat datang, {{ user?.displayName }}!</p>
    </header>

    <div class="dashboard-cards">
      <!-- Admin Cards -->
      <template v-if="isAdmin">
        <!-- Loading Skeleton for Total Users -->
        <div v-if="loading" class="stat-card glass-card animate-fadeInUp">
          <div class="stat-card-icon admin">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div class="stat-card-info">
            <SkeletonLoader type="text" width="50px" height="2rem" />
            <span class="stat-card-label">Total Users</span>
          </div>
        </div>
        <div v-else class="stat-card glass-card animate-fadeInUp">
          <div class="stat-card-icon admin">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div class="stat-card-info">
            <span class="stat-card-value">{{ stats.totalUsers }}</span>
            <span class="stat-card-label">Total Users</span>
          </div>
        </div>

        <!-- Loading Skeleton for Total Guru -->
        <div v-if="loading" class="stat-card glass-card animate-fadeInUp delay-100">
          <div class="stat-card-icon guru">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div class="stat-card-info">
            <SkeletonLoader type="text" width="40px" height="2rem" />
            <span class="stat-card-label">Total Guru</span>
          </div>
        </div>
        <div v-else class="stat-card glass-card animate-fadeInUp delay-100">
          <div class="stat-card-icon guru">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div class="stat-card-info">
            <span class="stat-card-value">{{ stats.totalGuru }}</span>
            <span class="stat-card-label">Total Guru</span>
          </div>
        </div>

        <!-- Total Santri - Hidden (not functioning yet)
        <div v-if="loading" class="stat-card glass-card animate-fadeInUp delay-200">
          <div class="stat-card-icon santri">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
            </svg>
          </div>
          <div class="stat-card-info">
            <SkeletonLoader type="text" width="45px" height="2rem" />
            <span class="stat-card-label">Total Santri</span>
          </div>
        </div>
        <div v-else class="stat-card glass-card animate-fadeInUp delay-200">
          <div class="stat-card-icon santri">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
            </svg>
          </div>
          <div class="stat-card-info">
            <span class="stat-card-value">{{ stats.totalSantri }}</span>
            <span class="stat-card-label">Total Santri</span>
          </div>
        </div>
        -->
      </template>

      <!-- Kehadiran Bulan Ini - Hidden for Admin (not functioning yet, only show for Guru) -->
        <template v-if="isGuru">
        <!-- Loading Skeleton for Kehadiran -->
        <div v-if="loading" class="stat-card glass-card animate-fadeInUp">
          <div class="stat-card-icon attendance">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div class="stat-card-info">
            <SkeletonLoader type="text" width="50px" height="2rem" />
            <span class="stat-card-label">Kehadiran Bulan Ini</span>
          </div>
        </div>
        <div v-else class="stat-card glass-card animate-fadeInUp">
          <div class="stat-card-icon attendance">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div class="stat-card-info">
            <span class="stat-card-value">{{ stats.attendanceThisMonth }}</span>
            <span class="stat-card-label">Kehadiran Bulan Ini</span>
          </div>
        </div>
        </template>

      <!-- Guru and Admin shared Cards -->
      <template v-if="isGuru || isAdmin">
        <!-- Loading Skeleton for Periode Penilaian -->
        <div v-if="loading" class="stat-card glass-card animate-fadeInUp" :class="{ 'delay-200': isAdmin, 'delay-100': isGuru }">
          <div class="stat-card-icon grading">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div class="stat-card-info">
            <SkeletonLoader type="text" width="40px" height="2rem" />
            <span class="stat-card-label">Periode Penilaian Aktif</span>
          </div>
        </div>
        <div v-else class="stat-card glass-card animate-fadeInUp" :class="{ 'delay-200': isAdmin, 'delay-100': isGuru }">
          <div class="stat-card-icon grading">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div class="stat-card-info">
            <span class="stat-card-value">{{ stats.activePeriods }}</span>
            <span class="stat-card-label">Periode Penilaian Aktif</span>
          </div>
        </div>
      </template>

      <!-- Santri Card -->
      <template v-if="isSantri">
        <div class="under-construction glass-card animate-fadeInUp">
          <div class="under-construction-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <h2>Fitur Dalam Pengembangan</h2>
          <p>Dashboard untuk Santri sedang dalam tahap pengembangan. Silakan hubungi guru atau admin untuk informasi lebih lanjut.</p>
        </div>
      </template>
    </div>

    <!-- Quick Actions -->
    <section v-if="isGuru || isAdmin" class="quick-actions">
      <h2>Aksi Cepat</h2>
      <div class="action-grid">
        <router-link to="/dashboard/attendance" class="action-card glass-card" v-if="isGuru">
          <div class="action-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <span>Isi Absensi</span>
        </router-link>
        <router-link to="/dashboard/admin-attendance" class="action-card glass-card" v-if="isAdmin">
          <div class="action-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <span>Rekap Absensi</span>
        </router-link>

        <router-link to="/dashboard/grading" class="action-card glass-card">
          <div class="action-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
          <span>Buat Penilaian</span>
        </router-link>

        <template v-if="isAdmin">
          <router-link to="/dashboard/users" class="action-card glass-card">
            <div class="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
            </div>
            <span>Tambah User</span>
          </router-link>

          <router-link to="/dashboard/content" class="action-card glass-card">
            <div class="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </div>
            <span>Edit Konten</span>
          </router-link>
        </template>
      </div>
    </section>

    <!-- Permissions-based Actions for Guru -->
    <section v-if="isGuru && hasCustomPermissions" class="permissions-actions">
      <h2>{{ user.permissions?.menuGroupName || 'Akses Khusus' }}</h2>
      <div class="action-grid">
        <!-- Rekap Absensi -->
        <router-link 
          v-if="hasPermission('admin-attendance-view')" 
          to="/dashboard/admin-attendance" 
          class="action-card glass-card permission-card"
        >
          <div class="action-icon permission-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <path d="M12 16v-4"/>
              <path d="M8 16v-2"/>
              <path d="M16 16v-3"/>
            </svg>
          </div>
          <span>Rekap Absensi</span>
        </router-link>

        <!-- Export PDF -->
        <button 
          v-if="hasPermission('export-pdf')" 
          class="action-card glass-card permission-card"
          @click="handleExportPDF"
          :disabled="exporting"
        >
          <div class="action-icon permission-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          </div>
          <span>{{ exporting ? 'Mengunduh...' : 'Export PDF' }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useToast } from '@/composables/useToast'

const { success, error: showError } = useToast()

const authStore = useAuthStore()

const user = computed(() => authStore.user)
const isAdmin = computed(() => authStore.isAdmin)
const isGuru = computed(() => authStore.isGuru)
const isSantri = computed(() => authStore.isSantri)

// Permissions helpers
const hasCustomPermissions = computed(() => {
  return isGuru.value && user.value?.permissions?.features?.length > 0
})

const hasPermission = (permissionId) => {
  return user.value?.permissions?.features?.includes(permissionId) || false
}

const loading = ref(true)
const exporting = ref(false)
const exportData = ref({ attendance: [], teachers: [] }) // Cache for synchronous export
const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const formatCurrency = (num) => num.toLocaleString('id-ID')

const stats = ref({
  totalUsers: 0,
  totalGuru: 0,
  totalSantri: 0,
  attendanceThisMonth: 0,
  activePeriods: 0
})

const fetchStats = async () => {
  loading.value = true
  try {
    if (isAdmin.value) {
      const { data: users } = await api.get('/users')
      stats.value.totalUsers = users.length
      stats.value.totalGuru = users.filter(u => u.role === 'guru').length
      stats.value.totalSantri = users.filter(u => u.role === 'santri').length
    }

    if (isGuru.value || isAdmin.value) {
      const { data: attendance } = await api.get('/attendance/me', {
        params: {
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear()
        }
      })
      stats.value.attendanceThisMonth = attendance.filter(a => a.status === 'hadir').length

      const { data: periods } = await api.get('/grading/periods')
      stats.value.activePeriods = periods.filter(p => p.status === 'active').length

      // Pre-fetch export data if user has permission (to allow sync download)
      if (hasPermission('export-pdf')) {
        const today = new Date()
        const year = today.getFullYear()
        
        try {
          // Parallel fetch for export data
          const [attResponse, teachersResponse] = await Promise.all([
            api.get('/attendance', { params: { month: today.getMonth() + 1, year } }),
            api.get('/users', { params: { role: 'guru' } })
          ])
          
          exportData.value.attendance = attResponse.data
          exportData.value.teachers = teachersResponse.data
        } catch (err) {
          console.error('Failed to pre-fetch export data:', err)
        }
      }
    }
  } catch (error) {
    console.log('Stats fetch error (API may not be running):', error)
  } finally {
    loading.value = false
  }
}

// Prepared export data (Computed for performance/consistency)
const exportStats = computed(() => {
  if (exportData.value.teachers.length === 0) return []
  
  const attendanceData = exportData.value.attendance
  return exportData.value.teachers.map(t => {
    const teacherAttendance = attendanceData.filter(a => a.guruId === t.id)
    const hadirCount = teacherAttendance.filter(a => a.status === 'hadir').length
    const tidakHadirCount = teacherAttendance.filter(a => a.status !== 'hadir').length
    return { ...t, hadirCount, tidakHadirCount }
  })
})

// Export PDF - directly download (Synchronous for consistency)
const handleExportPDF = () => {
  if (exportStats.value.length === 0) {
    showError('Data belum siap atau kosong. Silakan refresh.')
    return
  }

  exporting.value = true
  try {
    const today = new Date()
    const monthName = monthNames[today.getMonth()]
    const year = today.getFullYear()
    
    // Create PDF
    const doc = new jsPDF()
    
    // Header (Match AdminAttendanceView style exactly)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('LAPORAN ABSENSI GURU', 105, 20, { align: 'center' })
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    doc.text('TPQ AMANAH', 105, 28, { align: 'center' })
    
    doc.setFontSize(11)
    doc.text(`Periode: ${monthName} ${year}`, 105, 36, { align: 'center' })
    
    doc.setDrawColor(0, 100, 0)
    doc.setLineWidth(0.5)
    doc.line(14, 42, 196, 42)
    
    const tableData = exportStats.value.map((teacher, index) => [
      index + 1,
      teacher.displayName,
      teacher.hadirCount,
      teacher.tidakHadirCount,
      `Rp ${formatCurrency(teacher.hadirCount * 10000)}`
    ])
    
    autoTable(doc, {
      startY: 48,
      head: [['No', 'Nama Guru', 'Hadir', 'Izin/Tidak Hadir', 'Gaji']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [34, 139, 34],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { halign: 'center', cellWidth: 60 },
        2: { halign: 'center', cellWidth: 25 },
        3: { halign: 'center', cellWidth: 35 },
        4: { halign: 'center', cellWidth: 45 }
      },
      styles: { fontSize: 10, cellPadding: 4 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    })
    
    const totalHadir = exportStats.value.reduce((sum, t) => sum + t.hadirCount, 0)
    const totalGaji = totalHadir * 10000
    const finalY = (doc.lastAutoTable?.finalY || 100) + 10
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(`Total Kehadiran: ${totalHadir}`, 14, finalY)
    doc.text(`Total Gaji: Rp ${formatCurrency(totalGaji)}`, 14, finalY + 7)
    
    const now = new Date()
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.text(`Dicetak pada: ${now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, finalY + 18)
    
    const filename = `${year}_${monthName.toLowerCase()}_report_absen.pdf`
    doc.save(filename)
    
    success(`Berhasil mengunduh ${filename}`)
  } catch (error) {
    console.error('Export PDF error:', error)
    showError('Gagal mengexport PDF')
  } finally {
    exporting.value = false
  }
}

onMounted(() => {
  fetchStats()
})

// React to permission changes (e.g. after login/rehydration)
import { watch } from 'vue'
watch(() => user.value?.permissions, async (newVal) => {
  if (newVal) {
    await fetchStats()
  }
}, { deep: true })
</script>

<style scoped>
.dashboard-home {
  padding-top: 60px;
}

@media (min-width: 1024px) {
  .dashboard-home {
    padding-top: 0;
  }
}

.page-header {
  margin-bottom: var(--space-2xl);
}

.page-header h1 {
  font-size: 2rem;
  color: var(--primary-dark);
  margin-bottom: var(--space-xs);
}

.page-header p {
  color: var(--gray-600);
}

.dashboard-cards {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: var(--space-lg);
  margin-bottom: var(--space-2xl);
}

@media (min-width: 640px) {
  .dashboard-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .dashboard-cards {
    grid-template-columns: repeat(3, 1fr);
  }
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-xl);
  background: rgba(255, 255, 255, 0.9);
}

.stat-card-icon {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--white);
}

.stat-card-icon.admin { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.stat-card-icon.guru { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
.stat-card-icon.santri { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.stat-card-icon.attendance { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.stat-card-icon.grading { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }

.stat-card-info {
  display: flex;
  flex-direction: column;
}

.stat-card-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-dark);
  line-height: 1;
}

.stat-card-label {
  color: var(--gray-500);
  font-size: 0.875rem;
  margin-top: var(--space-xs);
}

/* Under Construction */
.under-construction {
  grid-column: 1 / -1;
  text-align: center;
  padding: var(--space-3xl);
  background: rgba(255, 255, 255, 0.9);
}

.under-construction-icon {
  color: var(--primary);
  margin-bottom: var(--space-lg);
}

.under-construction h2 {
  color: var(--primary);
  margin-bottom: var(--space-md);
}

.under-construction p {
  color: var(--gray-600);
  max-width: 500px;
  margin: 0 auto;
}

/* Quick Actions */
.quick-actions {
  margin-top: var(--space-2xl);
}

.quick-actions h2 {
  font-size: 1.25rem;
  color: var(--primary-dark);
  margin-bottom: var(--space-lg);
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-md);
}

@media (min-width: 768px) {
  .action-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-xl);
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  transition: all var(--transition-fast);
}

.action-card:hover {
  background: var(--primary);
  color: var(--white);
}

.action-icon {
  width: 50px;
  height: 50px;
  border-radius: var(--radius-full);
  background: var(--gray-100);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  transition: all var(--transition-fast);
}

.action-card:hover .action-icon {
  background: rgba(255, 255, 255, 0.2);
  color: var(--white);
}

.action-card span {
  font-weight: 500;
  font-size: 0.875rem;
}

/* Permissions Actions */
.permissions-actions {
  margin-top: var(--space-2xl);
}

.permissions-actions h2 {
  font-size: 1.25rem;
  color: var(--primary-dark);
  margin-bottom: var(--space-lg);
}

.permission-card {
  cursor: pointer;
  border: 2px solid transparent;
}

.permission-card:hover {
  border-color: var(--primary);
}

.permission-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
}

.permission-card:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

button.action-card {
  border: none;
  width: 100%;
}
</style>
