<template>
  <div class="attendance-view">
    <header class="page-header">
      <h1>Absensi Online</h1>
      <p>Catat kehadiran mengajar (Senin - Jumat)</p>
    </header>

    <!-- Holiday Banner -->
    <div v-if="loadingHolidays" class="holiday-alert skeleton-holiday-alert">
      <div class="skeleton-icon"></div>
      <div class="skeleton-text-container">
        <div class="skeleton-text label"></div>
        <div class="skeleton-text name"></div>
      </div>
    </div>
    <template v-else>
      <div v-if="todayHoliday.isHoliday" class="holiday-alert today-holiday">
        <div class="holiday-alert-icon">🎉</div>
        <div class="holiday-alert-content">
          <span class="holiday-alert-label">{{ todayHoliday.isCustom ? 'Hari Ini Libur' : 'Hari Ini Libur Nasional'
          }}</span>
          <span class="holiday-alert-name">{{ todayHoliday.holidayName }}</span>
        </div>
      </div>
      <div v-else-if="tomorrowHoliday.isHoliday" class="holiday-alert tomorrow-holiday">
        <div class="holiday-alert-icon">📅</div>
        <div class="holiday-alert-content">
          <span class="holiday-alert-label">Besok Libur Nasional</span>
          <span class="holiday-alert-name">{{ tomorrowHoliday.holidayName }}</span>
        </div>
      </div>
    </template>

    <!-- Today's Card - Prominent Design -->
    <!-- Today's Card - Prominent Symmetrical Design -->
    <div class="today-card glass-card">
      <!-- Loading State -->
      <div v-if="loading" class="loading-today">
        <SkeletonLoader type="text" height="24px" width="180px" />
        <SkeletonLoader type="text" height="40px" width="220px" />
        <SkeletonLoader type="text" height="20px" width="140px" />
      </div>

      <!-- Attendance Recorded State -->
      <div v-else-if="todayAttendance" class="today-attendance-recorded"
        :class="{ 'holiday-override': todayHoliday.isHoliday }">

        <!-- Top Row: Date Badge & Status Panel (Balanced & Symmetrical) -->
        <div class="attendance-header-panel">
          <div class="today-date-display">
            <span class="day-name">{{ dayName }}</span>
            <div class="date-number">{{ dateNumber }}</div>
            <span class="month-year">{{ monthYear }}</span>
          </div>

          <div class="att-status-card">
            <div class="att-status-info">
              <div class="status-badge-lg" :class="todayAttendance.status"
                :style="todayHoliday.isHoliday ? 'background: rgba(255, 193, 7, 0.2); color: #b45309; border-color: rgba(245, 158, 11, 0.4);' : ''">
                <span class="badge-icon">{{ todayAttendance.status === 'hadir' ? '✓' : '✗' }}</span>
                <span class="badge-text">{{ todayAttendance.status === 'hadir' ? 'HADIR' : 'TIDAK HADIR' }}</span>
              </div>
              <div class="att-status-texts">
                <h3 class="att-status-title">
                  {{ todayHoliday.isHoliday ? 'Absen Masuk (Hari Libur)' : 'Absensi Hari Ini Sudah Tercatat' }}
                </h3>
                <p v-if="todayHoliday.isHoliday" class="att-notes-text override-notice-inline">
                  📌 Anda masuk pada hari libur, dan admin telah mengabsenkan Anda.
                </p>
                <p v-else-if="todayAttendance.notes" class="att-notes-text">
                  Catatan: {{ todayAttendance.notes }}
                </p>
                <p v-else class="att-status-subtitle">
                  Kehadiran Anda telah tersimpan dan sinkron dengan rekap bulanan.
                </p>
              </div>
            </div>

            <div class="att-status-actions" v-if="!todayHoliday.isHoliday">
              <button class="btn btn-outline-secondary btn-sm btn-update-compact" @click="openUpdateModal">
                ✏️ Ubah Status
              </button>
            </div>
          </div>
        </div>

        <!-- Bottom Section: KBM Guidance Box (Full Width & Symmetrical) -->
        <div v-if="todayAttendance.status === 'hadir'" class="kbm-guidance-box">
          <div class="kbm-guidance-header">
            <div class="kbm-guidance-icon">📚</div>
            <div class="kbm-guidance-info">
              <h4>Kegiatan Belajar Mengajar (KBM) Hari Ini</h4>
              <p v-if="loadingTodayKbm" class="kbm-loading-text">
                Memeriksa status KBM hari ini...
              </p>
              <p v-else-if="todayKbmSessions.length === 0">
                Kehadiran Anda sudah tercatat! Silakan lanjutkan untuk mengisi absensi santri dan jurnal mengajar hari
                ini.
              </p>
              <p v-else>
                Alhamdulillah, Anda sudah mengisi <strong>{{ todayKbmSessions.length }} sesi KBM</strong> hari ini:
              </p>
            </div>
          </div>

          <!-- List of today's already filled sessions with rich formatting -->
          <div v-if="!loadingTodayKbm && todayKbmSessions.length > 0" class="today-sessions-list">
            <div v-for="s in todayKbmSessions" :key="s.id" class="today-session-item">
              <div class="session-item-badge">✓</div>
              <div class="session-item-details">
                <div class="session-item-header">
                  <span class="session-item-class">{{ formatSessionClass(s) }}</span>
                  <span class="session-item-slot-badge">{{ formatSessionSlot(s) }}</span>
                </div>
                <div class="session-item-sub">
                  <span class="session-item-activity">
                    {{ s.type === 'teaching' ? 'KBM Normal' : (s.activityName || 'Non-KBM') }}
                  </span>
                  <span v-if="s.meetingNumber" class="session-item-meeting">Pertemuan Ke-{{ s.meetingNumber }}</span>
                  <span v-if="s.substituteFor" class="session-item-badal">Badal</span>
                </div>
              </div>
            </div>
          </div>

          <div class="kbm-guidance-actions">
            <router-link :to="todayKbmWorkspaceUrl" class="btn btn-primary btn-kbm-cta">
              <span class="cta-icon">{{ todayKbmSessions.length === 0 ? '✍️' : '➕' }}</span>
              <span style="font-size: 0.80rem;">
                {{ todayKbmSessions.length === 0 ? `Mulai Isi KBM & Jurnal Hari Ini →` : `Buka / Tambah Sesi KBM Hari
                Ini →`
                }}
              </span>
            </router-link>
          </div>
        </div>

        <!-- Non-Hadir Information Box -->
        <div v-else class="not-hadir-box">
          <span class="not-hadir-icon">ℹ️</span>
          <div>
            <strong>Status: Tidak Hadir</strong>
            <p>Anda tercatat tidak hadir hari ini. Tidak ada kewajiban mengisi absensi santri atau jurnal mengajar.</p>
          </div>
        </div>
      </div>

      <!-- Weekend State -->
      <div v-else-if="isWeekend" class="today-panel-wrapper">
        <div class="today-date-display">
          <span class="day-name">{{ dayName }}</span>
          <div class="date-number">{{ dateNumber }}</div>
          <span class="month-year">{{ monthYear }}</span>
        </div>
        <div class="weekend-notice">
          <span class="weekend-icon">🏖️</span>
          <p>Hari ini adalah akhir pekan.<br />Absensi hanya untuk hari Senin - Jumat.</p>
        </div>
      </div>

      <!-- Holiday State -->
      <div v-else-if="todayHoliday.isHoliday" class="today-panel-wrapper">
        <div class="today-date-display">
          <span class="day-name">{{ dayName }}</span>
          <div class="date-number">{{ dateNumber }}</div>
          <span class="month-year">{{ monthYear }}</span>
        </div>
        <div class="holiday-notice">
          <span class="holiday-notice-icon">🎉</span>
          <h3>{{ todayHoliday.isCustom ? 'Hari Ini Libur' : 'Hari Ini Libur Nasional' }}</h3>
          <p class="holiday-notice-name">{{ todayHoliday.holidayName }}</p>
          <p class="holiday-notice-text">Tidak ada absensi untuk hari libur.<br />Selamat beristirahat! 🙏</p>
        </div>
      </div>

      <!-- Attendance Form (Belum Absen) -->
      <div v-else class="today-panel-wrapper">
        <div class="today-date-display">
          <span class="day-name">{{ dayName }}</span>
          <div class="date-number">{{ dateNumber }}</div>
          <span class="month-year">{{ monthYear }}</span>
        </div>

        <div class="attendance-form">
          <div class="attendance-form-header">
            <h3 class="form-title">Pilih Status Kehadiran Hari Ini</h3>
            <p class="form-subtitle">Silakan catat kehadiran Anda sebelum memulai sesi KBM dan absensi santri.</p>
          </div>

          <div class="status-buttons">
            <button type="button" class="status-btn hadir" :class="{ active: selectedStatus === 'hadir' }"
              @click="selectedStatus = 'hadir'">
              <div class="status-btn-icon">✓</div>
              <div class="status-btn-body">
                <span class="btn-title">HADIR</span>
                <span class="btn-desc">Siap mengajar & mengisi jurnal KBM</span>
              </div>
            </button>
            <button type="button" class="status-btn tidak-hadir" :class="{ active: selectedStatus === 'tidak_hadir' }"
              @click="selectedStatus = 'tidak_hadir'">
              <div class="status-btn-icon">✗</div>
              <div class="status-btn-body">
                <span class="btn-title">TIDAK HADIR</span>
                <span class="btn-desc">Izin, sakit, atau berhalangan</span>
              </div>
            </button>
          </div>

          <!-- Dynamic Context Preview -->
          <div v-if="selectedStatus === 'hadir'" class="status-context-preview hadir-preview">
            <span class="context-icon">💡</span>
            <span>Kehadiran Anda akan dicatat. Selanjutnya Anda dapat langsung mengisi absensi santri dan jurnal KBM
              hari
              ini.</span>
          </div>
          <div v-else-if="selectedStatus === 'tidak_hadir'" class="status-context-preview tidak-hadir-preview">
            <span class="context-icon">ℹ️</span>
            <span>Status tidak hadir akan dicatat pada rekap bulanan Anda. Tidak ada kewajiban mengisi sesi KBM hari
              ini.</span>
          </div>

          <div class="notes-input">
            <label class="form-label">Catatan Kehadiran (Opsional)</label>
            <input v-model="notes" type="text" class="form-input"
              placeholder="Tambahkan catatan jika izin, sakit, atau ada keterangan..." />
          </div>

          <button class="btn btn-primary btn-submit" @click="submitAttendance"
            :disabled="!selectedStatus || submitting">
            <span v-if="submitting">Menyimpan Kehadiran...</span>
            <span v-else-if="selectedStatus === 'hadir'">✓ Konfirmasi Hadir & Lanjut ke KBM →</span>
            <span v-else-if="selectedStatus === 'tidak_hadir'">Simpan Status Tidak Hadir</span>
            <span v-else>Pilih Status di Atas untuk Menyimpan</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Monthly Recap -->
    <div class="recap-section">
      <h2>Rekap Bulan Ini</h2>
      <div class="recap-cards">
        <div class="recap-card glass-card">
          <div class="recap-icon hadir">✓</div>
          <div v-if="loading" class="recap-value-skeleton"></div>
          <div v-else class="recap-value">{{ monthlyStats.hadir }}</div>
          <div class="recap-label">Hari Hadir</div>
        </div>
        <div class="recap-card glass-card">
          <div class="recap-icon tidak">✗</div>
          <div v-if="loading" class="recap-value-skeleton"></div>
          <div v-else class="recap-value">{{ monthlyStats.tidakHadir }}</div>
          <div class="recap-label">Tidak Hadir</div>
        </div>
        <div class="recap-card glass-card salary">
          <div class="recap-icon gaji">💰</div>
          <div v-if="loading" class="recap-value-skeleton wide"></div>
          <div v-else class="recap-value">Rp {{ formatCurrency(monthlyStats.hadir * 10000) }}</div>
          <div class="recap-label">Estimasi Gaji</div>
        </div>
      </div>
    </div>

    <!-- History Section - Calendar View -->
    <div class="history-section">
      <div class="history-header">
        <h2>Riwayat Absensi</h2>
      </div>

      <!-- Calendar Navigation -->
      <div class="calendar-section glass-card">
        <div class="calendar-header">
          <button class="nav-btn" @click="prevMonth" :disabled="isFirstMonth">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h3>{{ calendarMonthNames[calendarMonth] }} {{ calendarYear }}</h3>
          <button class="nav-btn" @click="nextMonth" :disabled="isCurrentCalendarMonth">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        <div v-if="loading" class="loading-calendar">
          <div class="skeleton-calendar-grid">
            <div v-for="i in 7" :key="'header-' + i" class="skeleton-day-header"></div>
            <div v-for="i in 35" :key="'cell-' + i" class="skeleton-calendar-cell"></div>
          </div>
        </div>

        <template v-else>
          <!-- Calendar Grid -->
          <div class="calendar-grid">
            <!-- Day Headers -->
            <div class="day-header" v-for="day in calendarDayNames" :key="day">{{ day }}</div>

            <!-- Empty cells for alignment -->
            <div v-for="n in firstDayOfMonth" :key="'empty-' + n" class="calendar-cell empty"></div>

            <!-- Date Cells -->
            <div v-for="date in daysInMonth" :key="date" class="calendar-cell" :class="getCalendarCellClass(date)"
              @click="showCalendarDetail(date)" :title="getHolidayForDate(date)?.name || ''">
              <span class="cell-date">{{ date }}</span>
              <span class="cell-status" v-if="getAttendanceForDate(date)">
                {{ getAttendanceForDate(date).status === 'hadir' ? '✓' : '✗' }}
              </span>
              <span class="cell-holiday-dot" v-if="getHolidayForDate(date)">🎉</span>
            </div>
          </div>

          <!-- Legend -->
          <div class="calendar-legend">
            <div class="legend-item"><span class="legend-dot hadir"></span> Hadir</div>
            <div class="legend-item"><span class="legend-dot tidak"></span> Tidak Hadir</div>
            <div class="legend-item"><span class="legend-dot empty"></span> Tidak Ada Data</div>
            <div class="legend-item"><span class="legend-dot libur"></span> Hari Libur</div>
          </div>
        </template>
      </div>

      <!-- Calendar Detail Popup -->
      <div v-if="selectedCalendarDate" class="calendar-popup-overlay" @click="selectedCalendarDate = null"></div>
      <div v-if="selectedCalendarDate" class="calendar-popup glass-card">
        <div class="popup-header">
          <h4>{{ formatCalendarDate(selectedCalendarDate) }}</h4>
          <button class="close-btn" @click="selectedCalendarDate = null">×</button>
        </div>

        <!-- Check-in Time - Below Date Header -->
        <div v-if="getCheckinTimeForPopup()" class="popup-checkin-time-header">
          <span class="checkin-icon">🕐</span>
          <span>{{ getCheckinTimeForPopup() }}</span>
        </div>

        <!-- Holiday Banner in Popup -->
        <div v-if="getHolidayForDate(selectedCalendarDate)" class="holiday-banner">
          <span class="holiday-icon">🎉</span>
          <div class="holiday-info">
            <span class="holiday-label">
              {{
                getHolidayForDate(selectedCalendarDate).isCustom ?
                  'Hari Libur' : 'Hari Libur Nasional' }}</span>
            <span class="holiday-name">{{ getHolidayForDate(selectedCalendarDate).name }}</span>
          </div>
        </div>

        <div class="popup-content" v-if="selectedCalendarAttendance">
          <div class="popup-status" :class="selectedCalendarAttendance.status"
            :style="getHolidayForDate(selectedCalendarDate) ? 'background: rgba(255, 193, 7, 0.15); color: #e65100;' : ''">
            {{ selectedCalendarAttendance.status === 'hadir' ? '✅ Hadir' : '❌ Tidak Hadir' }}
          </div>

          <p v-if="getHolidayForDate(selectedCalendarDate)" class="popup-notes"
            style="background-color: rgba(255, 193, 7, 0.15); color: #e65100; border: 1px dashed rgba(255, 152, 0, 0.3);">
            <strong>📌 Catatan Sistem:</strong><br />Anda masuk pada hari libur, dan admin telah mengabsenkan anda.
          </p>

          <p v-if="selectedCalendarAttendance.notes" class="popup-notes">
            <strong>Catatan:</strong> {{ selectedCalendarAttendance.notes }}
          </p>
          <p v-else-if="!getHolidayForDate(selectedCalendarDate)" class="popup-notes empty">Tidak ada catatan</p>
        </div>
        <div class="popup-content" v-else>
          <p class="popup-notes empty">Tidak ada data absensi</p>
        </div>
      </div>
    </div>

    <!-- Update Modal -->
    <div v-if="showUpdateModal" class="modal-overlay" @click.self="closeUpdateModal">
      <div class="modal glass-card">
        <h3>Ubah Status Absensi</h3>
        <p class="modal-date">{{ dayName }}, {{ dateNumber }} {{ monthYear }}</p>

        <div class="form-group">
          <label class="form-label">Status Kehadiran</label>
          <div class="status-buttons modal-status">
            <button class="status-btn hadir" :class="{ active: updateForm.status === 'hadir' }"
              @click="updateForm.status = 'hadir'">
              <span class="btn-icon">✓</span>
              <span class="btn-text">HADIR</span>
            </button>
            <button class="status-btn tidak-hadir" :class="{ active: updateForm.status === 'tidak_hadir' }"
              @click="updateForm.status = 'tidak_hadir'">
              <span class="btn-icon">✗</span>
              <span class="btn-text">TIDAK HADIR</span>
            </button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Catatan (Opsional)</label>
          <input v-model="updateForm.notes" type="text" class="form-input" placeholder="Tambahkan catatan..." />
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeUpdateModal">Batal</button>
          <button class="btn btn-primary" @click="submitUpdate" :disabled="updating">
            {{ updating ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Pasca Absen Hadir: Arahkan langsung ke KBM & Jurnal -->
    <Teleport to="body">
      <div v-if="showPostAttendanceModal" class="modal-overlay" @click.self="showPostAttendanceModal = false">
        <div class="modal glass-card post-attendance-modal">
          <div class="post-att-header text-center">
            <div class="post-att-icon">🎉</div>
            <h3 class="post-att-title">Alhamdulillah, Kehadiran Tercatat!</h3>
            <p class="post-att-subtitle">
              Status presensi Anda hari ini: <span class="badge-success-pill">HADIR</span>
            </p>
          </div>

          <div class="post-att-card">
            <div class="post-att-card-icon">📖</div>
            <div class="post-att-card-content">
              <strong>Lanjutkan Isi KBM & Jurnal Santri</strong>
              <p>Mari lengkapi absensi santri jilid Anda dan materi jurnal pembelajaran yang diajarkan hari ini.</p>
            </div>
          </div>

          <div class="post-att-actions">
            <button type="button" class="btn btn-secondary" @click="showPostAttendanceModal = false">
              Nanti Saja
            </button>
            <router-link :to="todayKbmWorkspaceUrl" class="btn btn-primary btn-direct-kbm"
              @click="showPostAttendanceModal = false">
              Isi KBM Sekarang →
            </router-link>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import { useToast } from '@/composables/useToast'
import { fetchHolidays, isTodayHoliday, isTomorrowHoliday, getHolidaysForMonth } from '@/services/holidayService'

const { success, error: showError } = useToast()

const today = new Date()
const isWeekend = computed(() => [0, 6].includes(today.getDay()))

const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const dayName = computed(() => dayNames[today.getDay()])
const dateNumber = computed(() => today.getDate())
const monthYear = computed(() => `${monthNames[today.getMonth()]} ${today.getFullYear()}`)

const selectedStatus = ref(null)
const notes = ref('')
const submitting = ref(false)
const loading = ref(true)
const loadingHolidays = ref(true)
const todayAttendance = ref(null)
const attendanceHistory = ref([])
const selectedMonth = ref(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`)

// Today KBM & Guidance state
const todayKbmSessions = ref([])
const loadingTodayKbm = ref(false)
const showPostAttendanceModal = ref(false)
const sessionSlots = ref([])

const fetchSessionSlots = async () => {
  try {
    const { data } = await api.get('/teaching_sessions/slots')
    if (Array.isArray(data)) {
      sessionSlots.value = data
    }
  } catch (e) {
    // Non-blocking fallback
  }
}

const formatSessionClass = (s) => {
  if (!s) return '-'
  if (s.className) return s.className
  const id = String(s.classId || s.levelId || '')
  if (id >= '1' && id <= '6') return `Jilid ${id}`
  if (id === '7') return 'Marhalah Ula'
  if (id === '8') return 'Marhalah Wustho'
  if (id === '9') return 'Marhalah Ukhro'
  return id ? `Kelas ${id}` : 'Sesi Mengajar'
}

const formatSessionSlot = (s) => {
  if (!s) return '-'
  // If session already has full slotName e.g. "Gelombang 2 / Malam (18:00 - 19:30)"
  if (s.slotName && s.slotName.includes('(')) return s.slotName

  const slotId = s.sessionSlotId || ''
  const foundSlot = sessionSlots.value.find((x) => x.id === slotId)
  if (foundSlot) {
    const time = foundSlot.startTime && foundSlot.endTime ? ` (${foundSlot.startTime} - ${foundSlot.endTime})` : ''
    return `${foundSlot.name}${time}`
  }

  const slotLower = String(slotId).toLowerCase()
  if (slotLower.includes('2') || slotLower.includes('malam') || slotLower.includes('wave_2')) {
    return 'Gelombang 2 / Malam (18:00 - 19:30)'
  }
  if (slotLower.includes('1') || slotLower.includes('sore') || slotLower.includes('wave_1')) {
    return 'Gelombang 1 / Sore (15:00 - 16:30)'
  }

  return s.slotName || slotId || 'Gelombang 1 / Sore'
}

const todayDateString = computed(() => {
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
})

const todayKbmWorkspaceUrl = computed(() => `/dashboard/kbm?date=${todayDateString.value}&from=attendance`)

const fetchTodayKbm = async () => {
  if (!todayAttendance.value || todayAttendance.value.status !== 'hadir') {
    todayKbmSessions.value = []
    return
  }
  loadingTodayKbm.value = true
  try {
    const { data } = await api.get('/teaching_sessions', {
      params: { date: todayDateString.value }
    })
    todayKbmSessions.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Fetch today KBM error:', e)
    todayKbmSessions.value = []
  } finally {
    loadingTodayKbm.value = false
  }
}

// Update modal state
const showUpdateModal = ref(false)
const updating = ref(false)
const updateForm = ref({ status: '', notes: '' })

// Calendar state
const calendarMonth = ref(today.getMonth())
const calendarYear = ref(today.getFullYear())
const calendarMonthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const calendarDayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const selectedCalendarDate = ref(null)

// Holiday state
const holidays = ref([])
const monthHolidays = ref([])
const customHolidays = ref([])
const dismissedHolidays = ref([])
// Store current month custom holidays separately for "Today" check
const currentMonthCustomHolidays = ref([])
const currentMonthDismissedHolidays = ref([])

// Computed for holidays
const todayHoliday = computed(() => {
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  // Check if today's national holiday was dismissed
  const isDismissed = currentMonthDismissedHolidays.value.some(d => d.date === todayStr)

  // Check national holidays first
  const national = isTodayHoliday(holidays.value)
  if (national.isHoliday && !isDismissed) return national

  // Check custom holidays for today using the separately fetched list
  const customH = currentMonthCustomHolidays.value.find(h => h.date === todayStr)
  if (customH) {
    return { isHoliday: true, holidayName: customH.name, isCustom: true }
  }
  return { isHoliday: false }
})

const tomorrowHoliday = computed(() => {
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`

  // Check if tomorrow's national holiday was dismissed
  const isDismissed = currentMonthDismissedHolidays.value.some(d => d.date === tomorrowStr)

  const national = isTomorrowHoliday(holidays.value)
  if (national.isHoliday && isDismissed) {
    return { isHoliday: false }
  }
  return national
})

const isCurrentCalendarMonth = computed(() => {
  return calendarMonth.value === today.getMonth() && calendarYear.value === today.getFullYear()
})

const isFirstMonth = computed(() => {
  return calendarMonth.value === 0 && calendarYear.value === 2026
})

const daysInMonth = computed(() => {
  return new Date(calendarYear.value, calendarMonth.value + 1, 0).getDate()
})

const firstDayOfMonth = computed(() => {
  return new Date(calendarYear.value, calendarMonth.value, 1).getDay()
})

const selectedCalendarAttendance = computed(() => {
  if (!selectedCalendarDate.value) return null
  return getAttendanceForDate(selectedCalendarDate.value)
})

const availableMonths = computed(() => {
  const months = []
  const startYear = 2026
  const startMonth = 0 // January (0-indexed)

  // Generate months from January 2026 up to current month
  for (let year = startYear; year <= today.getFullYear(); year++) {
    const monthStart = (year === startYear) ? startMonth : 0
    const monthEnd = (year === today.getFullYear()) ? today.getMonth() : 11

    for (let month = monthStart; month <= monthEnd; month++) {
      months.push({
        value: `${year}-${String(month + 1).padStart(2, '0')}`,
        label: `${monthNames[month]} ${year}`
      })
    }
  }

  // Sort descending (newest first)
  return months.reverse()
})

const monthlyStats = computed(() => {
  const filtered = attendanceHistory.value.filter(a => a.type !== 'student_attendance')
  const uniqueDays = new Map()
  filtered.forEach(a => {
    const d = parseDate(a.date)
    if (d) {
      const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (!uniqueDays.has(dayKey) || a.status === 'hadir') {
        uniqueDays.set(dayKey, a)
      }
    }
  })
  const uniqueRecords = Array.from(uniqueDays.values())
  const hadir = uniqueRecords.filter(a => a.status === 'hadir').length
  const tidakHadir = uniqueRecords.filter(a => a.status !== 'hadir').length
  return { hadir, tidakHadir }
})

const formatCurrency = (num) => {
  return num.toLocaleString('id-ID')
}

const formatDate = (d) => {
  if (!d) return '-'
  // Handle Firestore Timestamp format (_seconds or seconds)
  let date
  if (d.toDate && typeof d.toDate === 'function') {
    date = d.toDate()
  } else if (d._seconds !== undefined) {
    date = new Date(d._seconds * 1000)
  } else if (d.seconds !== undefined) {
    date = new Date(d.seconds * 1000)
  } else {
    date = new Date(d)
  }
  return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const formatHistoryDay = (d) => {
  if (!d) return '-'
  // Handle Firestore Timestamp format (_seconds or seconds)
  let date
  if (d.toDate && typeof d.toDate === 'function') {
    date = d.toDate()
  } else if (d._seconds !== undefined) {
    date = new Date(d._seconds * 1000)
  } else if (d.seconds !== undefined) {
    date = new Date(d.seconds * 1000)
  } else {
    date = new Date(d)
  }
  return isNaN(date.getTime()) ? '-' : dayNames[date.getDay()]
}

// Calendar helper functions
const parseDate = (val) => {
  if (!val) return null
  if (val.toDate && typeof val.toDate === 'function') return val.toDate()
  if (val._seconds !== undefined) return new Date(val._seconds * 1000)
  if (val.seconds !== undefined) return new Date(val.seconds * 1000)
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

const getAttendanceForDate = (date) => {
  return attendanceHistory.value.find(a => {
    if (a.type === 'student_attendance') return false
    const d = parseDate(a.date)
    return d && d.getDate() === date && d.getMonth() === calendarMonth.value && d.getFullYear() === calendarYear.value
  })
}

const getCalendarCellClass = (date) => {
  const classes = []
  const attendance = getAttendanceForDate(date)

  if (!attendance) {
    classes.push('no-data')
  } else {
    classes.push(attendance.status === 'hadir' ? 'hadir' : 'tidak')
  }

  // Check if this date is a holiday
  if (getHolidayForDate(date)) {
    classes.push('libur')
    if (attendance) classes.push('libur-override')
  }

  return classes.join(' ')
}

const getHolidayForDate = (date) => {
  return monthHolidays.value.find(h => h.date === date)
}

const updateMonthHolidays = () => {
  const national = getHolidaysForMonth(calendarMonth.value, calendarYear.value, holidays.value)

  const m = calendarMonth.value + 1
  const y = calendarYear.value

  // Filter out dismissed national holidays
  const dismissedDates = new Set(dismissedHolidays.value.filter(d => {
    const [dy, dm] = d.date.split('-').map(Number)
    return dy === y && dm === m
  }).map(d => parseInt(d.date.split('-')[2])))

  const filteredNational = national.filter(h => !dismissedDates.has(h.date))

  // Merge with custom holidays for current month
  const custom = customHolidays.value
    .filter(h => {
      const [hy, hm] = h.date.split('-').map(Number)
      return hy === y && hm === m
    })
    .map(h => ({
      date: parseInt(h.date.split('-')[2]),
      name: h.name,
      isCustom: true,
    }))
  const merged = [...filteredNational]
  for (const ch of custom) {
    if (!merged.some(m => m.date === ch.date)) {
      merged.push(ch)
    }
  }
  monthHolidays.value = merged
}

const fetchCustomHolidays = async () => {
  try {
    const { data } = await api.get('/holidays', {
      params: { month: calendarMonth.value + 1, year: calendarYear.value }
    })
    customHolidays.value = data
    updateMonthHolidays()
  } catch (e) {
    console.error('Fetch custom holidays error:', e)
  }
}

const fetchDismissedHolidays = async () => {
  try {
    const { data } = await api.get('/holidays/dismissed', {
      params: { month: calendarMonth.value + 1, year: calendarYear.value }
    })
    dismissedHolidays.value = data
    updateMonthHolidays()
  } catch (e) {
    console.error('Fetch dismissed holidays error:', e)
  }
}

const fetchCurrentMonthCustomHolidays = async () => {
  try {
    const { data: customData } = await api.get('/holidays', {
      params: { month: today.getMonth() + 1, year: today.getFullYear() }
    })
    currentMonthCustomHolidays.value = customData

    const { data: dismissedData } = await api.get('/holidays/dismissed', {
      params: { month: today.getMonth() + 1, year: today.getFullYear() }
    })
    currentMonthDismissedHolidays.value = dismissedData
  } catch (e) {
    console.error('Fetch current month holidays error:', e)
  }
}

const formatCalendarDate = (date) => {
  const d = new Date(calendarYear.value, calendarMonth.value, date)
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

// Format check-in time from createdAt timestamp
const formatCheckinTime = (timestamp) => {
  if (!timestamp) return null
  const d = parseDate(timestamp)
  if (!d || isNaN(d.getTime())) return null
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })
}

// Get check-in time for popup display
const getCheckinTimeForPopup = () => {
  if (!selectedCalendarAttendance.value) return null
  if (selectedCalendarAttendance.value.status !== 'hadir') return null
  return formatCheckinTime(selectedCalendarAttendance.value.createdAt)
}

const showCalendarDetail = (date) => {
  selectedCalendarDate.value = date
}

const refreshCalendarData = async () => {
  holidays.value = await fetchHolidays(calendarYear.value)
  await Promise.all([
    fetchCustomHolidays(),
    fetchDismissedHolidays(),
    fetchAttendance()
  ])
}

const prevMonth = () => {
  if (isFirstMonth.value) return
  if (calendarMonth.value === 0) {
    calendarMonth.value = 11
    calendarYear.value--
  } else {
    calendarMonth.value--
  }
  // Update selectedMonth and fetch
  selectedMonth.value = `${calendarYear.value}-${String(calendarMonth.value + 1).padStart(2, '0')}`
  refreshCalendarData()
}

const nextMonth = () => {
  if (isCurrentCalendarMonth.value) return
  if (calendarMonth.value === 11) {
    calendarMonth.value = 0
    calendarYear.value++
  } else {
    calendarMonth.value++
  }
  // Update selectedMonth and fetch
  selectedMonth.value = `${calendarYear.value}-${String(calendarMonth.value + 1).padStart(2, '0')}`
  refreshCalendarData()
}

const fetchAttendance = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/attendance/me', {
      params: {
        month: calendarMonth.value + 1,
        year: calendarYear.value
      }
    })
    attendanceHistory.value = (data || []).filter(a => a.type !== 'student_attendance')

    // Check for today's attendance using local date comparison
    const todayYear = today.getFullYear()
    const todayMonth = today.getMonth()
    const todayDate = today.getDate()

    todayAttendance.value = data.find(a => {
      if (!a.date) return false
      // Handle Firestore Timestamp format
      let d
      if (a.date._seconds !== undefined) {
        d = new Date(a.date._seconds * 1000)
      } else if (a.date.seconds !== undefined) {
        d = new Date(a.date.seconds * 1000)
      } else {
        d = new Date(a.date)
      }
      // Compare using local date components
      return !isNaN(d.getTime()) &&
        d.getFullYear() === todayYear &&
        d.getMonth() === todayMonth &&
        d.getDate() === todayDate
    }) || null

    if (todayAttendance.value && todayAttendance.value.status === 'hadir') {
      fetchTodayKbm()
    } else {
      todayKbmSessions.value = []
    }
  } catch (e) {
    console.log('Fetch error')
  } finally {
    loading.value = false
  }
}

const submitAttendance = async () => {
  if (!selectedStatus.value) return
  submitting.value = true
  try {
    const status = selectedStatus.value === 'hadir' ? 'hadir' : 'tidak_hadir'
    const { data } = await api.post('/attendance', {
      date: today.toISOString(),
      status,
      notes: notes.value
    })
    todayAttendance.value = {
      id: data.id,
      status,
      notes: notes.value,
      date: today,
      createdAt: new Date() // Add current timestamp for immediate display
    }
    attendanceHistory.value.unshift(todayAttendance.value)
    success('Absensi berhasil disimpan')

    if (status === 'hadir') {
      await fetchTodayKbm()
      showPostAttendanceModal.value = true
    } else {
      todayKbmSessions.value = []
    }
  } catch (e) {
    showError(e.response?.data?.error || 'Gagal menyimpan absensi')
  } finally {
    submitting.value = false
  }
}

const openUpdateModal = () => {
  updateForm.value = {
    status: todayAttendance.value.status === 'hadir' ? 'hadir' : 'tidak_hadir',
    notes: todayAttendance.value.notes || ''
  }
  showUpdateModal.value = true
}

const closeUpdateModal = () => {
  showUpdateModal.value = false
}

const submitUpdate = async () => {
  if (!updateForm.value.status) return
  updating.value = true
  try {
    await api.put(`/attendance/${todayAttendance.value.id}`, {
      status: updateForm.value.status,
      notes: updateForm.value.notes
    })

    // Update local state
    todayAttendance.value.status = updateForm.value.status
    todayAttendance.value.notes = updateForm.value.notes

    // Update in history list too
    const idx = attendanceHistory.value.findIndex(a => a.id === todayAttendance.value.id)
    if (idx !== -1) {
      attendanceHistory.value[idx].status = updateForm.value.status
      attendanceHistory.value[idx].notes = updateForm.value.notes
    }

    if (updateForm.value.status === 'hadir') {
      fetchTodayKbm()
    } else {
      todayKbmSessions.value = []
    }

    success('Absensi berhasil diperbarui')
    closeUpdateModal()
  } catch (e) {
    showError(e.response?.data?.error || 'Gagal memperbarui absensi')
  } finally {
    updating.value = false
  }
}

onMounted(async () => {
  loadingHolidays.value = true
  holidays.value = await fetchHolidays(calendarYear.value)
  await Promise.all([
    fetchCustomHolidays(),
    fetchDismissedHolidays(),
    fetchCurrentMonthCustomHolidays(),
    fetchSessionSlots()
  ])

  loadingHolidays.value = false

  // Fetch attendance
  await fetchAttendance()
})
</script>

<style scoped>
.attendance-view {
  padding-top: 60px;
}

@media (min-width: 1024px) {
  .attendance-view {
    padding-top: 0;
  }
}

.page-header {
  margin-bottom: var(--space-xl);
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

/* Today Card */
.today-card {
  display: flex;
  flex-direction: column;
  padding: var(--space-xl);
  margin-bottom: var(--space-2xl);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.95));
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: var(--radius-2xl);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02);
}

.today-panel-wrapper {
  display: flex;
  align-items: stretch;
  gap: var(--space-xl);
  width: 100%;
}

@media (max-width: 768px) {
  .today-card {
    padding: var(--space-lg);
  }

  .today-panel-wrapper {
    flex-direction: column;
    gap: var(--space-lg);
  }
}

.today-date-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl) 20px;
  background: linear-gradient(145deg, #059669 0%, #047857 60%, #065f46 100%);
  border-radius: var(--radius-xl);
  color: white;
  width: 140px;
  flex-shrink: 0;
  align-self: stretch;
  box-shadow: 0 6px 18px rgba(5, 150, 105, 0.22);
}

@media (max-width: 768px) {
  .today-date-display {
    width: 100%;
    max-width: none;
    padding: 16px 20px;
  }
}

.day-name {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  opacity: 0.9;
}

.date-number {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1;
  margin: 10px 0;
}

.month-year {
  font-size: 0.86rem;
  font-weight: 600;
  opacity: 0.95;
  white-space: nowrap;
}

.loading-today {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
}

.weekend-notice {
  flex: 1;
  min-width: 0;
  text-align: center;
  padding: var(--space-xl);
  color: var(--gray-500);
}

.weekend-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: var(--space-md);
}

/* Holiday Notice in Today Card */
.holiday-notice {
  flex: 1;
  min-width: 0;
  text-align: center;
  padding: var(--space-xl);
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.15), rgba(255, 152, 0, 0.1));
  border-radius: var(--radius-xl);
  border: 2px solid rgba(255, 152, 0, 0.3);
}

.holiday-notice-icon {
  font-size: 3.5rem;
  display: block;
  margin-bottom: var(--space-md);
  animation: bounce 1s ease infinite;
}

@keyframes bounce {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-8px);
  }
}

.holiday-notice h3 {
  color: #e65100;
  margin-bottom: var(--space-sm);
  font-size: 1.25rem;
}

.holiday-notice-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #e65100;
  margin-bottom: var(--space-md);
  padding: var(--space-sm) var(--space-lg);
  background: rgba(255, 152, 0, 0.15);
  border-radius: var(--radius-full);
  display: inline-block;
}

.holiday-notice-text {
  color: var(--gray-600);
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.5;
}

.holiday-override {
  background: rgba(139, 195, 74, 0.1);
  border: 2px dashed rgba(255, 152, 0, 0.3);
  border-radius: var(--radius-xl);
}

.override-notice {
  color: #e65100 !important;
  font-weight: 500;
  padding: var(--space-sm) var(--space-md);
  background: rgba(255, 152, 0, 0.1);
  border-radius: var(--radius-md);
  display: inline-block;
  margin-top: var(--space-lg) !important;
}

.today-attendance-recorded {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  width: 100%;
}

.attendance-header-panel {
  display: flex;
  align-items: stretch;
  gap: var(--space-lg);
  width: 100%;
}

@media (max-width: 768px) {
  .attendance-header-panel {
    flex-direction: column;
    gap: var(--space-md);
  }
}

.att-status-card {
  flex: 1;
  min-width: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-md);
  padding: 14px var(--space-xl);
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.95), rgba(241, 245, 249, 0.85));
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: var(--radius-xl);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
}

.att-status-info {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  min-width: 0;
  flex: 1;
}

.status-badge-lg {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: var(--radius-full);
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  flex-shrink: 0;
}

.status-badge-lg.hadir {
  background: #dcfce7;
  color: #15803d;
  border: 1.5px solid #86efac;
}

.status-badge-lg.tidak_hadir,
.status-badge-lg.izin,
.status-badge-lg.sakit {
  background: #fee2e2;
  color: #b91c1c;
  border: 1.5px solid #fca5a5;
}

.att-status-texts {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.att-status-title {
  font-size: 1.12rem;
  font-weight: 700;
  color: var(--gray-800);
  margin: 0;
  line-height: 1.3;
}

.att-status-subtitle {
  font-size: 0.84rem;
  color: var(--gray-500);
  margin: 2px 0 0 0;
  line-height: 1.4;
}

.att-notes-text {
  font-size: 0.84rem;
  color: var(--gray-600);
  font-style: italic;
  margin: 2px 0 0 0;
}

.override-notice-inline {
  color: #d97706 !important;
  font-weight: 600;
}

.att-status-actions {
  flex-shrink: 0;
}

.btn-update-compact {
  font-size: 0.85rem;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  color: var(--gray-700);
  border: 1px solid var(--gray-300);
  background: white;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-update-compact:hover {
  background: var(--gray-100);
  border-color: var(--gray-400);
  color: var(--gray-900);
}

@media (max-width: 768px) {
  .att-status-card {
    flex-direction: column;
    align-items: flex-start;
    padding: var(--space-md);
    gap: var(--space-md);
  }

  .att-status-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 10px;
    width: 100%;
  }

  .att-status-actions {
    width: 100%;
  }

  .btn-update-compact {
    width: 100%;
    justify-content: center;
    text-align: center;
  }
}

.notes-text {
  margin-top: var(--space-md);
  color: var(--gray-500);
  font-style: italic;
}

.attendance-form {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.attendance-form-header {
  margin-bottom: 2px;
}

.attendance-form-header .form-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--gray-800);
  margin: 0 0 4px 0;
}

.attendance-form-header .form-subtitle {
  font-size: 0.88rem;
  color: var(--gray-500);
  margin: 0;
  line-height: 1.4;
}

.status-buttons {
  display: flex;
  gap: var(--space-md);
  margin-top: 4px;
}

.status-btn {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: 16px 20px;
  border-radius: var(--radius-xl);
  border: 2px solid var(--gray-200);
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.status-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
}

.status-btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  font-size: 1.35rem;
  font-weight: 800;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.status-btn.hadir .status-btn-icon {
  background: #dcfce7;
  color: #16a34a;
}

.status-btn.tidak-hadir .status-btn-icon {
  background: #fee2e2;
  color: #dc2626;
}

.status-btn-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.status-btn .btn-title {
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: var(--gray-800);
}

.status-btn .btn-desc {
  font-size: 0.82rem;
  color: var(--gray-500);
  margin-top: 2px;
  line-height: 1.3;
}

.status-btn.hadir:hover,
.status-btn.hadir.active {
  border-color: #16a34a;
  background: #f0fdf4;
}

.status-btn.hadir.active .status-btn-icon {
  background: #16a34a;
  color: white;
}

.status-btn.hadir.active .btn-title {
  color: #15803d;
}

.status-btn.tidak-hadir:hover,
.status-btn.tidak-hadir.active {
  border-color: #dc2626;
  background: #fef2f2;
}

.status-btn.tidak-hadir.active .status-btn-icon {
  background: #dc2626;
  color: white;
}

.status-btn.tidak-hadir.active .btn-title {
  color: #b91c1c;
}

.notes-input {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 2px;
}

.notes-input .form-label {
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--gray-700);
  margin: 0;
}

.btn-submit {
  width: 100%;
  padding: 12px var(--space-xl);
  font-size: 0.90rem;
  font-weight: 700;
  border-radius: var(--radius-lg);
  margin-top: 4px;
  transition: all 0.2s ease;
}

.btn-submit:not(:disabled) {
  box-shadow: 0 4px 14px rgba(5, 150, 105, 0.28);
}

@media (max-width: 768px) {
  .status-buttons {
    flex-direction: column;
    gap: var(--space-sm);
  }

  .status-btn {
    padding: 12px 16px;
  }
}

/* Recap Section */
.recap-section {
  margin-bottom: var(--space-2xl);
}

.recap-section h2 {
  color: var(--primary-dark);
  margin-bottom: var(--space-lg);
}

.recap-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
}

@media (max-width: 768px) {
  .recap-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-sm);
  }

  .recap-card.salary {
    grid-column: 1 / -1;
    /* Full width - spans both columns */
  }
}

.recap-card {
  padding: var(--space-lg);
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
}

.recap-card.salary {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 193, 7, 0.1));
  border: 2px solid rgba(255, 193, 7, 0.3);
}

.recap-icon {
  font-size: 2rem;
  margin-bottom: var(--space-sm);
}

.recap-icon.hadir {
  color: #4caf50;
}

.recap-icon.tidak {
  color: #f44336;
}

.recap-icon.gaji {
  color: #ffc107;
}

.recap-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--primary-dark);
}

.recap-label {
  font-size: 0.875rem;
  color: var(--gray-500);
  margin-top: var(--space-xs);
}

/* Skeleton Loading for Recap Values */
.recap-value-skeleton {
  height: 1.75rem;
  width: 60px;
  margin: 0 auto;
  background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-md);
}

.recap-value-skeleton.wide {
  width: 120px;
}

/* History Section */
.history-section h2 {
  color: var(--primary-dark);
  margin-bottom: var(--space-lg);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
  flex-wrap: wrap;
  gap: var(--space-md);
}

.month-select {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-lg);
  border: 2px solid var(--gray-200);
  font-size: 0.875rem;
  background: white;
}

.loading-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.empty-history {
  padding: var(--space-2xl);
  text-align: center;
  color: var(--gray-500);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  background: rgba(255, 255, 255, 0.9);
}

.history-date {
  display: flex;
  flex-direction: column;
}

.history-day {
  font-weight: 600;
  color: var(--primary-dark);
}

.history-full-date {
  font-size: 0.75rem;
  color: var(--gray-500);
}

.history-status {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.status-badge {
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
}

.status-badge.hadir {
  background: rgba(76, 175, 80, 0.15);
  color: #388e3c;
}

.status-badge.tidak {
  background: rgba(244, 67, 54, 0.15);
  color: #d32f2f;
}

.history-notes {
  font-size: 0.75rem;
  color: var(--gray-500);
  font-style: italic;
}

/* Update Button */
.btn-update {
  margin-top: var(--space-lg);
  padding: var(--space-sm) var(--space-lg);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: var(--space-lg);
}

.modal {
  width: 100%;
  max-width: 450px;
  padding: var(--space-xl);
  background: var(--white);
  border-radius: var(--radius-xl);
}

.modal h3 {
  color: var(--primary-dark);
  margin-bottom: var(--space-sm);
}

.modal-date {
  color: var(--gray-500);
  margin-bottom: var(--space-lg);
}

.modal-status {
  margin-bottom: var(--space-md);
}

.modal-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
  margin-top: var(--space-xl);
}

/* Calendar Styles */
.calendar-section {
  padding: var(--space-xl);
  background: rgba(255, 255, 255, 0.95);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xl);
}

.calendar-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--primary-dark);
}

.nav-btn {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--gray-100);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background: var(--primary);
  color: white;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-calendar {
  padding: var(--space-lg);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.day-header {
  text-align: center;
  font-weight: 600;
  font-size: 0.75rem;
  color: var(--gray-500);
  padding: var(--space-sm);
}

/* Skeleton Calendar Styles */
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

.skeleton-calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--space-xs);
}

.skeleton-day-header,
.skeleton-calendar-cell {
  background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-md);
}

.skeleton-day-header {
  height: 20px;
  margin-bottom: var(--space-xs);
  opacity: 0.7;
}

.skeleton-calendar-cell {
  aspect-ratio: 1;
}

.calendar-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  background: var(--gray-50);
  font-size: 0.875rem;
}

.calendar-cell.empty {
  background: transparent;
  cursor: default;
}

.calendar-cell:not(.empty):hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.calendar-cell.hadir {
  background: rgba(76, 175, 80, 0.2);
  border: 2px solid #4caf50;
}

.calendar-cell.tidak {
  background: rgba(244, 67, 54, 0.2);
  border: 2px solid #f44336;
}

.calendar-cell.no-data {
  background: var(--gray-100);
  border: 1px dashed var(--gray-300);
}

.cell-date {
  font-weight: 600;
  color: var(--gray-800);
}

.cell-status {
  font-size: 0.625rem;
  margin-top: 1px;
}

.calendar-cell.hadir .cell-status {
  color: #2e7d32;
}

.calendar-cell.tidak .cell-status {
  color: #c62828;
}

.calendar-legend {
  display: flex;
  justify-content: center;
  gap: var(--space-lg);
  margin-top: var(--space-lg);
  padding-top: var(--space-md);
  border-top: 1px solid var(--gray-100);
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: 0.75rem;
  color: var(--gray-600);
}

.legend-dot {
  width: 14px;
  height: 14px;
  border-radius: 3px;
}

.legend-dot.hadir {
  background: rgba(76, 175, 80, 0.3);
  border: 2px solid #4caf50;
}

.legend-dot.tidak {
  background: rgba(244, 67, 54, 0.3);
  border: 2px solid #f44336;
}

.legend-dot.empty {
  background: var(--gray-100);
  border: 1px dashed var(--gray-300);
}

.legend-dot.libur {
  background: rgba(255, 193, 7, 0.4);
  border: 2px solid #ffc107;
}

/* Holiday Styles */
.calendar-cell.libur {
  background: rgba(255, 193, 7, 0.25) !important;
  border: 2px solid #ffc107 !important;
  position: relative;
}

.calendar-cell.libur-override {
  background: rgba(139, 195, 74, 0.2) !important;
  border: 2px dashed #ffc107 !important;
}

.calendar-cell.libur.no-data {
  border-style: solid !important;
}

.cell-holiday-dot {
  position: absolute;
  top: 1px;
  right: 1px;
  font-size: 0.4rem;
  line-height: 1;
}

/* Holiday Alert Banner */
.holiday-alert {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-lg) var(--space-xl);
  border-radius: var(--radius-xl);
  margin-bottom: var(--space-lg);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.today-holiday {
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.2), rgba(255, 152, 0, 0.25));
  border: 2px solid rgba(255, 152, 0, 0.4);
}

.tomorrow-holiday {
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.15), rgba(30, 136, 229, 0.2));
  border: 2px solid rgba(33, 150, 243, 0.3);
}

.skeleton-holiday-alert {
  background: var(--gray-50);
  border: 2px solid var(--gray-200);
}

.skeleton-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-text-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.skeleton-text {
  height: 16px;
  border-radius: 4px;
  background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-text.label {
  width: 150px;
}

.skeleton-text.name {
  width: 250px;
  height: 20px;
}

.holiday-alert-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.holiday-alert-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.holiday-alert-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.today-holiday .holiday-alert-label {
  color: #e65100;
}

.tomorrow-holiday .holiday-alert-label {
  color: #1565c0;
}

.holiday-alert-name {
  font-size: 1.1rem;
  font-weight: 600;
}

.today-holiday .holiday-alert-name {
  color: #e65100;
}

.tomorrow-holiday .holiday-alert-name {
  color: #1565c0;
}

/* Holiday Banner in Popup */
.holiday-banner {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.2), rgba(255, 152, 0, 0.2));
  border-bottom: 1px solid rgba(255, 193, 7, 0.3);
}

.holiday-icon {
  font-size: 1.5rem;
}

.holiday-info {
  display: flex;
  flex-direction: column;
}

.holiday-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  color: #e65100;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.holiday-name {
  font-size: 0.9rem;
  color: #e65100;
  font-weight: 500;
}

@media (max-width: 640px) {
  .holiday-alert {
    padding: var(--space-md);
  }

  .holiday-alert-icon {
    font-size: 1.5rem;
  }

  .holiday-alert-label {
    font-size: 0.7rem;
  }

  .holiday-alert-name {
    font-size: 0.95rem;
  }

  .cell-holiday-dot {
    font-size: 0.35rem;
  }
}

/* Calendar Popup */
.calendar-popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 100;
}

.calendar-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 350px;
  padding: 0;
  background: white;
  border-radius: var(--radius-xl);
  z-index: 101;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.calendar-popup .popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  background: var(--gray-50);
  border-bottom: 1px solid var(--gray-100);
}

.calendar-popup .popup-header h4 {
  margin: 0;
  font-size: 0.9rem;
  color: var(--primary-dark);
}

.calendar-popup .close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: var(--gray-400);
  cursor: pointer;
  line-height: 1;
}

.calendar-popup .close-btn:hover {
  color: var(--gray-600);
}

.calendar-popup .popup-content {
  padding: var(--space-lg);
}

.popup-status {
  display: inline-block;
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: var(--space-sm);
}

.popup-status.hadir {
  background: rgba(76, 175, 80, 0.15);
  color: #2e7d32;
}

.popup-status.tidak_hadir,
.popup-status.izin,
.popup-status.sakit {
  background: rgba(244, 67, 54, 0.15);
  color: #c62828;
}

.popup-notes {
  margin: 0;
  padding: var(--space-sm);
  background: var(--gray-50);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  color: var(--gray-700);
}

.popup-notes.empty {
  color: var(--gray-400);
  font-style: italic;
}

.popup-checkin-time {
  font-size: 0.85rem;
  color: var(--gray-600);
  margin: var(--space-sm) 0;
  padding: var(--space-xs) var(--space-sm);
  background: rgba(33, 150, 243, 0.1);
  border-radius: var(--radius-sm);
  display: inline-block;
}

/* Check-in Time Header - Below Date */
.popup-checkin-time-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(46, 125, 50, 0.08));
  border-bottom: 1px solid rgba(76, 175, 80, 0.2);
  font-size: 0.85rem;
  color: #2e7d32;
  font-weight: 500;
}

.popup-checkin-time-header .checkin-icon {
  font-size: 0.9rem;
}

@media (max-width: 640px) {

  /* Calendar Responsive Fixes */
  .calendar-section {
    padding: var(--space-sm);
  }

  .calendar-header {
    margin-bottom: var(--space-md);
  }

  .calendar-header h3 {
    font-size: 0.9rem;
  }

  .nav-btn {
    width: 32px;
    height: 32px;
  }

  .calendar-grid {
    gap: 2px;
  }

  .day-header {
    font-size: 0.65rem;
    padding: 2px 0;
  }

  .calendar-cell {
    border-radius: var(--radius-sm);
    font-size: 0.8rem;
  }

  .cell-date {
    font-size: 0.75rem;
  }

  .cell-status {
    font-size: 0.5rem;
    margin-top: 1px;
  }

  .calendar-legend {
    gap: var(--space-sm);
    margin-top: var(--space-md);
  }

  .legend-item {
    font-size: 0.5rem;
  }

  .attendance-view {
    padding-top: 10px;
  }
}

@media (max-width: 400px) {
  .calendar-section {
    padding: 4px;
  }

  .calendar-grid {
    gap: 1px;
  }

  .cell-date {
    font-size: 0.7rem;
  }

  .cell-status {
    font-size: 8px;
  }
}

/* KBM Guidance Box in Today Attendance Card */
.kbm-guidance-box {
  background: linear-gradient(135deg, rgba(236, 253, 245, 0.95), rgba(240, 253, 244, 0.8));
  border: 1.5px solid rgba(16, 185, 129, 0.35);
  border-radius: var(--radius-xl);
  padding: var(--space-lg);
  margin-top: var(--space-lg);
  text-align: left;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.08);
}

.kbm-guidance-header {
  display: flex;
  gap: var(--space-md);
  align-items: flex-start;
}

.kbm-guidance-icon {
  font-size: 2.2rem;
  flex-shrink: 0;
  line-height: 1;
}

.kbm-guidance-info h4 {
  color: #065f46;
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0 0 4px 0;
}

.kbm-guidance-info p {
  color: #047857;
  font-size: 0.88rem;
  margin: 0;
  line-height: 1.45;
}

.kbm-loading-text {
  font-style: italic;
  opacity: 0.8;
}

.today-sessions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
}

.today-session-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: var(--radius-lg);
  padding: 10px 14px;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.06);
}

.session-item-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #10b981;
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.session-item-details {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex: 1;
  min-width: 0;
  flex-wrap: wrap;
}

.session-item-header {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.session-item-class {
  font-weight: 700;
  font-size: 0.95rem;
  color: #065f46;
}

.session-item-slot-badge {
  font-size: 0.82rem;
  font-weight: 600;
  background: #d1fae5;
  color: #047857;
  padding: 2px 10px;
  border-radius: var(--radius-full);
  border: 1px solid #a7f3d0;
}

.session-item-sub {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  color: #059669;
}

.session-item-meeting {
  background: #e0f2fe;
  color: #0369a1;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.75rem;
  border: 1px solid #bae6fd;
}

.session-item-badal {
  background: #fef3c7;
  color: #b45309;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.75rem;
  border: 1px solid #fde68a;
}

@media (max-width: 768px) {
  .today-session-item {
    align-items: flex-start;
  }

  .session-item-details {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

.not-hadir-box {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: var(--radius-xl);
  padding: var(--space-md) var(--space-lg);
  margin-top: var(--space-sm);
}

.not-hadir-icon {
  font-size: 1.5rem;
  line-height: 1;
  flex-shrink: 0;
}

.not-hadir-box strong {
  color: #9a3412;
  font-size: 0.95rem;
  display: block;
  margin-bottom: 2px;
}

.not-hadir-box p {
  color: #c2410c;
  font-size: 0.85rem;
  margin: 0;
  line-height: 1.4;
}

.kbm-guidance-actions {
  margin-top: var(--space-md);
}

.btn-kbm-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 10px 20px;
  border-radius: var(--radius-lg);
  width: 100%;
  text-decoration: none;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
  transition: all 0.2s ease;
}

.btn-kbm-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(16, 185, 129, 0.35);
}

/* Post-Attendance Modal */
.post-attendance-modal {
  max-width: 440px;
  width: 90%;
  padding: var(--space-xl);
  border-radius: var(--radius-2xl);
  background: white;
}

.post-att-icon {
  font-size: 3rem;
  margin-bottom: var(--space-sm);
}

.post-att-title {
  color: var(--primary-dark);
  font-size: 1.3rem;
  margin-bottom: 6px;
}

.post-att-subtitle {
  color: var(--gray-600);
  font-size: 0.95rem;
  margin-bottom: var(--space-lg);
}

.badge-success-pill {
  background: #2e7d32;
  color: white;
  padding: 2px 10px;
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: 700;
}

.post-att-card {
  display: flex;
  gap: 12px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  margin-bottom: var(--space-xl);
  text-align: left;
}

.post-att-card-icon {
  font-size: 1.8rem;
  flex-shrink: 0;
}

.post-att-card-content strong {
  display: block;
  color: #166534;
  font-size: 0.95rem;
  margin-bottom: 4px;
}

.post-att-card-content p {
  color: #15803d;
  font-size: 0.85rem;
  margin: 0;
  line-height: 1.4;
}

.post-att-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
}

.btn-direct-kbm {
  font-weight: 600;
  text-decoration: none;
}

.status-context-preview {
  font-size: 0.80rem;
}
</style>
