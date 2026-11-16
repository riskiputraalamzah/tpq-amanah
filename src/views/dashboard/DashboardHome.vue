<template>
  <div class="dashboard-home">
    <header class="page-header">
      <h1>Dashboard</h1>
      <p>Selamat datang, {{ user?.displayName }}!</p>
    </header>

    <!-- the admin: what waits, today, and how the TPQ is doing (AdminDashboard.vue); the teachers keep theirs -->
    <AdminDashboard v-if="isAdmin" />
    <template v-else>

    <!-- New registrants waiting to be contacted (admin, or a guru given "Pendaftaran santri") -->
    <router-link v-if="seesRegistrations && newRegistrations" to="/dashboard/pendaftaran" class="reg-alert">
      <span class="reg-alert-num">{{ newRegistrations }}</span>
      <span class="reg-alert-text">
        <strong>Pendaftar baru menunggu dihubungi</strong>
        <span>Hubungi wali lewat WhatsApp, lalu jadwalkan penempatan jilid.</span>
      </span>
      <span class="reg-alert-go" aria-hidden="true">›</span>
    </router-link>

    <!-- Kelengkapan LPJ (hanya guru yang masuk LPJ) -->
    <LpjStatusCard v-if="isGuru" />

    <!-- the teacher: today's tasks, izin from the parents, who needs attention, my KBM, my jilid (GuruDashboard.vue) -->
    <GuruDashboard v-if="isGuru" />

    <!-- Permissions-based Actions for Guru -->
    <section v-if="isGuru && hasCustomPermissions" class="permissions-actions">
      <h2>Akses Khusus</h2>
      <div class="action-grid">
        <!-- Rekap Absensi -->
        <router-link v-if="hasPermission('admin-attendance-view')" to="/dashboard/admin-attendance"
          class="action-card glass-card permission-card">
          <div class="action-icon permission-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <path d="M12 16v-4" />
              <path d="M8 16v-2" />
              <path d="M16 16v-3" />
            </svg>
          </div>
          <span>Rekap Absensi</span>
        </router-link>

        <!-- Export PDF -->
        <button v-if="hasPermission('export-pdf')" class="action-card glass-card permission-card"
          @click="handleExportPDF" :disabled="exporting">
          <div class="action-icon permission-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <span>{{ exporting ? 'Mengunduh...' : 'Export PDF' }}</span>
        </button>
      </div>
    </section>
    </template>
  </div>
</template>

<script setup>
import { usePendaftaranCount } from '@/composables/usePendaftaranCount'
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import LpjStatusCard from '@/components/LpjStatusCard.vue'
import AdminDashboard from '@/views/dashboard/admin/AdminDashboard.vue'
import GuruDashboard from '@/views/dashboard/guru/GuruDashboard.vue'
import { loadPdfLibs } from '@/utils/pdf'
import { useToast } from '@/composables/useToast'

const { success, error: showError } = useToast()

const authStore = useAuthStore()

const user = computed(() => authStore.user)
const isAdmin = computed(() => authStore.isAdmin)
const { count: newRegistrations, refresh: refreshRegistrations } = usePendaftaranCount()
const seesRegistrations = computed(() => isAdmin.value || (authStore.user?.permissions?.features || []).includes('pendaftaran'))
onMounted(() => {
  if (seesRegistrations.value) refreshRegistrations()
})
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

const parseDate = (val) => {
  if (!val) return null
  if (val.toDate && typeof val.toDate === 'function') return val.toDate()
  if (val._seconds !== undefined) return new Date(val._seconds * 1000)
  if (val.seconds !== undefined) return new Date(val.seconds * 1000)
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

const fetchUserStats = async () => {
  const { data: users } = await api.get('/users')
  stats.value.totalUsers = users.length
  stats.value.totalGuru = users.filter(u => u.role === 'guru').length
  stats.value.totalSantri = users.filter(u => u.role === 'santri').length
}

const fetchMyAttendanceStats = async () => {
  const { data: attendance } = await api.get('/attendance/me', {
    params: {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    }
  })
  const uniqueDays = new Map()
  const myAtt = (attendance || []).filter(a => a.type !== 'student_attendance')
  myAtt.forEach(a => {
    const d = parseDate(a.date)
    if (d && !isNaN(d.getTime())) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (!uniqueDays.has(key) || a.status === 'hadir') {
        uniqueDays.set(key, a)
      }
    }
  })
  const uniqueList = uniqueDays.size > 0 ? Array.from(uniqueDays.values()) : myAtt
  stats.value.attendanceThisMonth = uniqueList.filter(a => a.status === 'hadir').length
}

const fetchPeriodStats = async () => {
  const { data: periods } = await api.get('/grading/periods')
  stats.value.activePeriods = periods.filter(p => p.status === 'active').length
}

// Pre-fetch export data if user has permission (so the download starts immediately on click)
const prepareExport = async () => {
  const today = new Date()
  const year = today.getFullYear()

  try {
    const [attResponse, teachersResponse] = await Promise.all([
      api.get('/attendance', { params: { month: today.getMonth() + 1, year } }),
      api.get('/users', { params: { role: 'guru' } }),
      loadPdfLibs()
    ])

    exportData.value.attendance = (attResponse.data || []).filter(a => a.type !== 'student_attendance')
    exportData.value.teachers = teachersResponse.data
  } catch (err) {
    console.error('Failed to pre-fetch export data:', err)
  }
}

const fetchStats = async () => {
  // the admin's numbers come from AdminDashboard (one request)
  if (isAdmin.value) return
  loading.value = true
  try {
    const isStaff = isGuru.value || isAdmin.value
    await Promise.all([
      isAdmin.value && fetchUserStats(),
      // the cards these fed are now GuruDashboard; only the PDF export (akses khusus) needs data here
      isStaff && hasPermission('export-pdf') && prepareExport()
    ])
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
    const teacherAttendance = attendanceData.filter(a => a.guruId === t.id && a.type !== 'student_attendance')
    const uniqueDays = new Map()
    teacherAttendance.forEach(a => {
      const d = parseDate(a.date)
      if (d && !isNaN(d.getTime())) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        if (!uniqueDays.has(key) || a.status === 'hadir') {
          uniqueDays.set(key, a)
        }
      }
    })
    const uniqueRecords = uniqueDays.size > 0 ? Array.from(uniqueDays.values()) : teacherAttendance
    const hadirCount = uniqueRecords.filter(a => a.status === 'hadir').length
    const tidakHadirCount = uniqueRecords.filter(a => a.status !== 'hadir').length
    return { ...t, hadirCount, tidakHadirCount }
  })
})

// Export PDF - directly download
const handleExportPDF = async () => {
  if (exportStats.value.length === 0) {
    showError('Data belum siap atau kosong. Silakan refresh.')
    return
  }

  exporting.value = true
  try {
    const { jsPDF, autoTable } = await loadPdfLibs()
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

const loadDashboard = () => fetchStats()

onMounted(loadDashboard)

// Only role and permissions change what this page loads; profile refreshes must not reload it.
watch(
  () => `${user.value?.role}|${user.value?.permissions?.features?.join(',') ?? ''}`,
  () => {
    if (user.value) loadDashboard()
  }
)
</script>

<style scoped>
.reg-alert {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
  padding: 14px 16px;
  border-radius: 16px;
  background: #fffbeb;
  border: 1px solid #f3d58b;
  color: #3b2404;
  text-decoration: none;
}

.reg-alert:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

.reg-alert-num {
  flex: none;
  display: grid;
  place-items: center;
  min-width: 44px;
  height: 44px;
  padding: 0 8px;
  border-radius: 12px;
  background: #b45309;
  color: #fff;
  font-size: 1.2rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.reg-alert-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.reg-alert-text strong {
  font-size: 0.98rem;
}

.reg-alert-text span {
  font-size: 0.85rem;
  color: #6b4a12;
}

.reg-alert-go {
  font-size: 1.6rem;
  line-height: 1;
  color: #b45309;
}

/* Operate surface: the ornament stays in the details (gold hairline, emerald/gold tiles); cards never move on hover. */

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
  font-weight: 700;
  color: var(--lp-ink);
  margin-bottom: var(--space-xs);
}

.page-header p {
  color: var(--lp-body);
}

/* gold rule with a diamond, the same mark the landing uses between headings and copy */
.page-header::after {
  content: "";
  display: block;
  width: 72px;
  height: 9px;
  margin-top: 0.85rem;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='72' height='9' viewBox='0 0 72 9'%3E%3Cpath d='M0 4.5H27M45 4.5H72' stroke='%23b45309' stroke-width='1'/%3E%3Cpath d='M36 0.5 L40 4.5 L36 8.5 L32 4.5 Z' fill='%23b45309'/%3E%3C/svg%3E") no-repeat center / 72px 9px;
  opacity: 0.85;
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

/* shared card surface: solid white, hairline border, soft emerald shadow, no blur and no lift */
.stat-card.glass-card,
.action-card.glass-card,
.under-construction.glass-card {
  background: #fff;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border: 1px solid rgba(11, 59, 42, 0.1);
  border-radius: 1.125rem;
  box-shadow: 0 1px 2px rgba(3, 41, 29, 0.05), 0 6px 18px -8px rgba(3, 41, 29, 0.14);
  transform: none;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-xl);
}

.stat-card-icon {
  flex: none;
  width: 60px;
  height: 60px;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--lp-gold);
  background: linear-gradient(145deg, var(--lp-emerald-1), var(--lp-emerald-2));
  box-shadow: inset 0 0 0 1px rgba(252, 211, 77, 0.28);
}

/* the "needs attention / result" tile is the one gold tile on the page */
.stat-card-icon.grading {
  color: var(--lp-emerald-1);
  background: linear-gradient(145deg, #fde68a, var(--lp-gold));
  box-shadow: inset 0 0 0 1px rgba(180, 83, 9, 0.25);
}

.stat-card-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.stat-card-value {
  font-size: 2.125rem;
  font-weight: 700;
  color: var(--lp-ink);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.stat-card-label {
  color: var(--lp-body);
  font-size: 0.875rem;
  margin-top: var(--space-xs);
}

/* Under Construction */
.under-construction {
  grid-column: 1 / -1;
  text-align: center;
  padding: var(--space-3xl);
}

.under-construction-icon {
  color: var(--lp-gold-deep);
  margin-bottom: var(--space-lg);
}

.under-construction h2 {
  color: var(--lp-ink);
  margin-bottom: var(--space-md);
}

.under-construction p {
  color: var(--lp-body);
  max-width: 500px;
  margin: 0 auto;
}

/* Quick Actions */
.quick-actions {
  margin-top: var(--space-2xl);
}

.quick-actions h2,
.permissions-actions h2 {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--lp-ink);
  margin-bottom: var(--space-lg);
}

/* small gold diamond before each section title, echoing the sidebar group labels */
.quick-actions h2::before,
.permissions-actions h2::before {
  content: "";
  flex: none;
  width: 8px;
  height: 8px;
  background: var(--lp-gold-deep);
  transform: rotate(45deg);
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
  color: var(--lp-ink);
  transition: background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}

.action-card:hover {
  background: var(--lp-emerald-1);
  border-color: var(--lp-emerald-1);
  color: #fff;
}

.action-card:focus-visible {
  outline: 3px solid var(--lp-gold-deep);
  outline-offset: 2px;
}

.action-card:active {
  transform: scale(0.985);
}

.action-icon {
  width: 50px;
  height: 50px;
  border-radius: var(--radius-full);
  background: #eef4ef;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--lp-emerald-1);
  transition: background-color 0.18s ease, color 0.18s ease;
}

.action-card:hover .action-icon {
  background: var(--lp-gold);
  color: var(--lp-emerald-1);
}

.action-card span {
  font-weight: 600;
  font-size: 0.875rem;
}

/* Permissions Actions */
.permissions-actions {
  margin-top: var(--space-2xl);
}

/* special-access cards carry a gold hairline so they read as a separate group */
.permission-card.glass-card {
  cursor: pointer;
  border-color: rgba(180, 83, 9, 0.3);
}

.permission-card.glass-card:hover {
  border-color: var(--lp-emerald-1);
}

.permission-icon {
  background: var(--lp-emerald-1) !important;
  color: var(--lp-gold) !important;
}

.permission-card:hover .permission-icon {
  background: var(--lp-gold) !important;
  color: var(--lp-emerald-1) !important;
}

.permission-card:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

button.action-card {
  width: 100%;
  font: inherit;
}

.savings-icon {
  background: #fdf1c9 !important;
  color: var(--lp-gold-deep) !important;
}

.savings-action:hover .savings-icon {
  background: var(--lp-gold) !important;
  color: var(--lp-emerald-1) !important;
}

@media (prefers-reduced-motion: reduce) {
  .action-card,
  .action-icon {
    transition: none;
  }
}
</style>
