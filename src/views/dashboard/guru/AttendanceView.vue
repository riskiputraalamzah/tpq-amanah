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
              <SkeletonLoader v-if="loadingTodayKbm" type="text" width="70%" />
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
          <button type="button" class="nav-btn" aria-label="Bulan sebelumnya" @click="prevMonth" :disabled="isFirstMonth">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <strong class="month-title" aria-live="polite">{{ calendarMonthNames[calendarMonth] }} {{ calendarYear }}</strong>
          <button type="button" class="nav-btn" aria-label="Bulan berikutnya" @click="nextMonth" :disabled="isCurrentCalendarMonth">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>

        <div v-if="loading" class="loading-calendar">
          <div class="skeleton-calendar-grid">
            <div v-for="i in 7" :key="'header-' + i" class="skeleton-day-header"></div>
            <div v-for="i in 35" :key="'cell-' + i" class="skeleton-calendar-cell"></div>
          </div>
        </div>

        <template v-else>
          <!-- Calendar Grid (same look as the KBM calendar: Min first, marks in the corner) -->
          <div class="weekdays" aria-hidden="true">
            <span v-for="day in calendarDayNames" :key="day">{{ day }}</span>
          </div>
          <div class="calendar-grid" role="group" :aria-label="`Kalender absensi, ${calendarMonthNames[calendarMonth]} ${calendarYear}`">
            <span v-for="n in firstDayOfMonth" :key="'empty-' + n" aria-hidden="true"></span>

            <button v-for="date in daysInMonth" :key="date" type="button" class="calendar-cell"
              :class="getCalendarCellClass(date)" :aria-pressed="selectedCalendarDate === date"
              :aria-label="getCalendarCellLabel(date)" :title="getHolidayForDate(date)?.name || ''"
              @click="showCalendarDetail(date)">
              <span class="cell-date">{{ date }}</span>
              <span v-if="getAttendanceForDate(date)?.status === 'hadir'" class="mark mark-hadir" aria-hidden="true">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><polyline points="20 6 9 17 4 12" /></svg>
              </span>
              <span v-else-if="getAttendanceForDate(date)" class="mark mark-tidak" aria-hidden="true">✕</span>
              <span v-else-if="isPastWorkday(date)" class="mark mark-empty" aria-hidden="true"></span>
              <span v-if="getHolidayForDate(date)" class="cell-holiday-dot" aria-hidden="true"></span>
            </button>
          </div>

          <!-- Legend -->
          <ul class="calendar-legend" aria-label="Keterangan">
            <li><span class="mark mark-hadir"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><polyline points="20 6 9 17 4 12" /></svg></span>Hadir</li>
            <li><span class="mark mark-tidak">✕</span>Tidak hadir (izin / sakit)</li>
            <li><span class="mark mark-empty"></span>Belum absen</li>
            <li><span class="swatch-libur"></span>Hari libur</li>
            <li><span class="swatch-off"></span>Akhir pekan / belum tiba</li>
          </ul>
          <p class="calendar-tip">Ketuk tanggal untuk melihat atau mengubah absensinya.</p>
        </template>
      </div>

      <!-- Calendar Detail Popup (under <body>, so a parent's transform cannot move it) -->
      <Teleport to="body">
      <div v-if="selectedCalendarDate" class="att-day-overlay" @click="selectedCalendarDate = null"></div>
      <div v-if="selectedCalendarDate" class="att-day-sheet" role="dialog" aria-modal="true" aria-labelledby="att-day-title">
        <div class="popup-header">
          <h4 id="att-day-title">{{ formatCalendarDate(selectedCalendarDate) }}</h4>
          <button type="button" class="sheet-close" aria-label="Tutup" @click="selectedCalendarDate = null">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
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

          <!-- Action buttons for existing attendance -->
          <div class="popup-actions">
            <button
              type="button"
              class="btn btn-sm btn-outline-primary w-full"
              @click="openEditForCalendarDay(selectedCalendarDate)"
            >
              ✏️ Ubah Status Absensi
            </button>
            <router-link
              v-if="selectedCalendarAttendance.status === 'hadir'"
              :to="getKbmWorkspaceUrlForDay(selectedCalendarDate)"
              class="btn btn-sm btn-primary w-full popup-kbm-link"
              @click="selectedCalendarDate = null"
            >
              📚 Buka KBM Tanggal Ini →
            </router-link>
          </div>
        </div>

        <div class="popup-content" v-else>
          <!-- Weekend notice -->
          <div v-if="isWeekendDay(selectedCalendarDate)" class="popup-weekend-box">
            <span class="popup-weekend-icon">🏖️</span>
            <div>
              <strong>Akhir Pekan (Sabtu / Minggu)</strong>
              <p>Presensi TPQ hanya berlaku untuk hari kerja aktif (Senin - Jumat).</p>
            </div>
          </div>

          <!-- Future month notice -->
          <div v-else-if="isFutureMonthSelection()" class="popup-future-box">
            <span class="popup-future-icon">⚠️</span>
            <div>
              <strong>Bulan Mendatang</strong>
              <p>Tidak dapat mengisi presensi untuk bulan yang akan datang.</p>
            </div>
          </div>

          <!-- Empty weekday - Can create attendance -->
          <div v-else class="popup-empty-action-box">
            <p class="popup-notes empty">Belum ada data absensi untuk tanggal ini.</p>
            <div class="popup-actions">
              <button
                type="button"
                class="btn btn-sm btn-primary w-full"
                @click="openCreateForCalendarDay(selectedCalendarDate)"
              >
                ➕ Isi Absensi Tanggal Ini
              </button>
            </div>
          </div>
        </div>
      </div>
      </Teleport>
    </div>

    <!-- Update / Create Attendance Modal -->
    <div v-if="showUpdateModal" class="modal-overlay" @click.self="closeUpdateModal">
      <div class="modal glass-card">
        <h3>{{ updateForm.mode === 'create' ? '➕ Catat Kehadiran Guru' : '✏️ Ubah Status Absensi' }}</h3>
        <p class="modal-date">{{ updateForm.dateFormatted }}</p>

        <div v-if="!updateForm.isToday" class="modal-date-alert">
          <span>🗓️ Mengisi absensi untuk tanggal yang dipilih pada kalender.</span>
        </div>

        <div class="form-group">
          <label class="form-label">Status Kehadiran</label>
          <div class="status-buttons modal-status">
            <button
              type="button"
              class="status-btn hadir"
              :class="{ active: updateForm.status === 'hadir' }"
              @click="updateForm.status = 'hadir'"
            >
              <span class="btn-icon">✓</span>
              <span class="btn-text">HADIR</span>
            </button>
            <button
              type="button"
              class="status-btn tidak-hadir"
              :class="{ active: updateForm.status === 'tidak_hadir' }"
              @click="updateForm.status = 'tidak_hadir'"
            >
              <span class="btn-icon">✗</span>
              <span class="btn-text">TIDAK HADIR</span>
            </button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Catatan (Opsional)</label>
          <input
            v-model="updateForm.notes"
            type="text"
            class="form-input"
            placeholder="Tambahkan catatan (izin, sakit, atau lainnya)..."
          />
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" @click="closeUpdateModal" :disabled="updating">
            Batal
          </button>
          <button type="button" class="btn btn-primary" @click="submitUpdate" :disabled="updating">
            {{ updating ? 'Menyimpan...' : (updateForm.mode === 'create' ? 'Simpan Absensi' : 'Simpan Perubahan') }}
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
import { useRoute } from 'vue-router'
import api from '@/services/api'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import { useToast } from '@/composables/useToast'
import { fetchHolidays, isTodayHoliday, isTomorrowHoliday, getHolidaysForMonth } from '@/services/holidayService'
import { resolveSessionSlotFullName } from '@/utils/sessionSlot'

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
const route = useRoute()
// ?month=YYYY-MM (links from the LPJ checklist) opens that month, between January 2026 and the current month.
const monthIndex = (year, month) => year * 12 + month
const requestedMonth = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(String(route.query.month || ''))
const currentMonthIndex = monthIndex(today.getFullYear(), today.getMonth())
const startMonthIndex = (() => {
  if (!requestedMonth) return currentMonthIndex
  const index = monthIndex(Number(requestedMonth[1]), Number(requestedMonth[2]) - 1)
  return index >= monthIndex(2026, 0) && index <= currentMonthIndex ? index : currentMonthIndex
})()
const selectedMonth = ref(`${Math.floor(startMonthIndex / 12)}-${String((startMonthIndex % 12) + 1).padStart(2, '0')}`)

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
  if (s.className) {
    if (s.className.toLowerCase().includes('marhalah')) return 'Marhalah'
    return s.className
  }
  const id = String(s.classId || s.levelId || '')
  if (id >= '1' && id <= '6') return `Jilid ${id}`
  if (['7', '8', '9'].includes(id) || id.toLowerCase().includes('marhalah')) return 'Marhalah'
  return id ? `Kelas ${id}` : 'Sesi Mengajar'
}

const formatSessionSlot = (s) => {
  if (!s) return '-'
  return resolveSessionSlotFullName(s.sessionSlotId || s.slotId || s.slotName, sessionSlots.value)
}

const todayDateString = computed(() => {
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
})

// Today's KBM is filled in the Daily Workspace (it picks the sesi and jilid); it returns here afterwards.
const todayKbmWorkspaceUrl = computed(() => `/dashboard/kbm/daily-workspace?date=${todayDateString.value}`)

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
const updateForm = ref({
  mode: 'update',
  date: null,
  dateStr: '',
  dateFormatted: '',
  status: '',
  notes: '',
  attendanceId: null,
  isToday: false
})

// Calendar state
const calendarMonth = ref(startMonthIndex % 12)
const calendarYear = ref(Math.floor(startMonthIndex / 12))
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

// The day is in the past (or today) on a weekday and not a holiday: attendance was expected.
const isPastWorkday = (date) => {
  const d = new Date(calendarYear.value, calendarMonth.value, date)
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return d <= end && !isWeekendDay(date) && !getHolidayForDate(date)
}

const isTodayCell = (date) => calendarYear.value === today.getFullYear() && calendarMonth.value === today.getMonth() && date === today.getDate()

// One state per day, same look as the KBM calendar.
const getCalendarCellClass = (date) => {
  const attendance = getAttendanceForDate(date)
  const holiday = getHolidayForDate(date)
  const classes = []
  if (attendance) classes.push(attendance.status === 'hadir' ? 'is-hadir' : 'is-tidak')
  else if (holiday || isWeekendDay(date) || !isPastWorkday(date)) classes.push('is-off')
  if (holiday && attendance) classes.push('is-libur-masuk')
  if (isTodayCell(date)) classes.push('is-today')
  if (selectedCalendarDate.value === date) classes.push('is-selected')
  return classes
}

const getCalendarCellLabel = (date) => {
  const attendance = getAttendanceForDate(date)
  const holiday = getHolidayForDate(date)
  let state = 'belum absen'
  if (attendance) state = attendance.status === 'hadir' ? 'hadir' : 'tidak hadir'
  else if (holiday) state = `libur: ${holiday.name}`
  else if (isWeekendDay(date)) state = 'akhir pekan'
  else if (!isPastWorkday(date)) state = 'belum tiba'
  return `${formatCalendarDate(date)}. ${state}`
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
  const [holidayList] = await Promise.all([
    fetchHolidays(calendarYear.value),
    fetchCustomHolidays(),
    fetchDismissedHolidays(),
    fetchAttendance()
  ])
  holidays.value = holidayList
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

// Calendar attendance creation & editing helpers
const getDateObjectForCalendarDay = (day) => {
  return new Date(calendarYear.value, calendarMonth.value, day, 12, 0, 0)
}

const getDateStringForCalendarDay = (day) => {
  const y = calendarYear.value
  const m = String(calendarMonth.value + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const isWeekendDay = (day) => {
  if (!day) return false
  const d = new Date(calendarYear.value, calendarMonth.value, day).getDay()
  return d === 0 || d === 6 // 0: Minggu, 6: Sabtu
}

const isFutureMonthSelection = () => {
  const nowY = today.getFullYear()
  const nowM = today.getMonth()
  return calendarYear.value > nowY || (calendarYear.value === nowY && calendarMonth.value > nowM)
}

const canCreateAttendanceForDay = (day) => {
  if (!day) return false
  if (isFutureMonthSelection()) return false
  if (isWeekendDay(day)) return false
  return true
}

const getKbmWorkspaceUrlForDay = (day) => {
  // the KBM calendar on that day: shows its KBM, or offers to fill it
  return `/dashboard/kbm?date=${getDateStringForCalendarDay(day)}`
}

const openUpdateModal = () => {
  if (!todayAttendance.value) return
  updateForm.value = {
    mode: 'update',
    date: today,
    dateStr: todayDateString.value,
    dateFormatted: `${dayName.value}, ${dateNumber.value} ${monthYear.value}`,
    status: todayAttendance.value.status === 'hadir' ? 'hadir' : 'tidak_hadir',
    notes: todayAttendance.value.notes || '',
    attendanceId: todayAttendance.value.id,
    isToday: true
  }
  showUpdateModal.value = true
}

const openCreateForCalendarDay = (day) => {
  if (!canCreateAttendanceForDay(day)) {
    if (isFutureMonthSelection()) {
      showError('Tidak dapat mengisi absensi untuk bulan yang akan datang')
    } else if (isWeekendDay(day)) {
      showError('Absensi hanya dapat dilakukan pada hari kerja (Senin - Jumat)')
    }
    return
  }
  const isToday = calendarYear.value === today.getFullYear() &&
                  calendarMonth.value === today.getMonth() &&
                  day === today.getDate()

  updateForm.value = {
    mode: 'create',
    date: getDateObjectForCalendarDay(day),
    dateStr: getDateStringForCalendarDay(day),
    dateFormatted: formatCalendarDate(day),
    status: 'hadir',
    notes: '',
    attendanceId: null,
    isToday
  }
  showUpdateModal.value = true
}

const openEditForCalendarDay = (day) => {
  const att = getAttendanceForDate(day)
  if (!att) return
  const isToday = calendarYear.value === today.getFullYear() &&
                  calendarMonth.value === today.getMonth() &&
                  day === today.getDate()

  updateForm.value = {
    mode: 'update',
    date: getDateObjectForCalendarDay(day),
    dateStr: getDateStringForCalendarDay(day),
    dateFormatted: formatCalendarDate(day),
    status: att.status === 'hadir' ? 'hadir' : 'tidak_hadir',
    notes: att.notes || '',
    attendanceId: att.id,
    isToday
  }
  showUpdateModal.value = true
}

const closeUpdateModal = () => {
  showUpdateModal.value = false
}

const submitUpdate = async () => {
  if (!updateForm.value.status) return

  if (isFutureMonthSelection()) {
    showError('Tidak dapat mengisi absensi untuk bulan yang akan datang')
    return
  }

  updating.value = true
  try {
    if (updateForm.value.mode === 'create') {
      await api.post('/attendance', {
        date: updateForm.value.dateStr || updateForm.value.date.toISOString(),
        status: updateForm.value.status,
        notes: updateForm.value.notes
      })

      success('Absensi berhasil disimpan')
      await fetchAttendance()

      if (updateForm.value.isToday) {
        if (updateForm.value.status === 'hadir') {
          await fetchTodayKbm()
          showPostAttendanceModal.value = true
        } else {
          todayKbmSessions.value = []
        }
      }
    } else {
      await api.put(`/attendance/${updateForm.value.attendanceId}`, {
        status: updateForm.value.status,
        notes: updateForm.value.notes
      })

      success('Absensi berhasil diperbarui')
      await fetchAttendance()

      if (updateForm.value.isToday) {
        if (updateForm.value.status === 'hadir') {
          await fetchTodayKbm()
        } else {
          todayKbmSessions.value = []
        }
      }
    }

    closeUpdateModal()
  } catch (e) {
    showError(e.response?.data?.error || 'Gagal menyimpan absensi')
  } finally {
    updating.value = false
  }
}

onMounted(async () => {
  loadingHolidays.value = true
  const attendanceLoaded = fetchAttendance()
  const [holidayList] = await Promise.all([
    fetchHolidays(calendarYear.value),
    fetchCustomHolidays(),
    fetchDismissedHolidays(),
    fetchCurrentMonthCustomHolidays(),
    fetchSessionSlots()
  ])

  holidays.value = holidayList
  loadingHolidays.value = false

  await attendanceLoaded
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
  background: linear-gradient(145deg, #0a5c40 0%, #053d2c 100%);
  border-radius: var(--radius-xl);
  color: white;
  width: 140px;
  flex-shrink: 0;
  align-self: stretch;
  box-shadow: inset 0 0 0 1px rgba(252, 211, 77, 0.3), 0 6px 18px rgba(3, 41, 29, 0.22);
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
  color: #fcd34d;
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
  color: #168058;
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
  color: #0f6b4a;
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
  color: #0f6b4a;
  font-weight: 500;
}

.popup-checkin-time-header .checkin-icon {
  font-size: 0.9rem;
}

/* Popup Actions & Enhanced Date State Styles */
.popup-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  margin-top: var(--space-md);
}

.popup-kbm-link {
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-weight: 600;
}

.popup-weekend-box,
.popup-future-box {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  font-size: 0.85rem;
  margin-bottom: var(--space-xs);
}

.popup-weekend-box {
  background: rgba(245, 158, 11, 0.12);
  border: 1px dashed rgba(217, 119, 6, 0.4);
  color: #92400e;
}

.popup-weekend-box strong,
.popup-future-box strong {
  display: block;
  font-size: 0.875rem;
  margin-bottom: 2px;
}

.popup-weekend-box p,
.popup-future-box p {
  margin: 0;
  line-height: 1.35;
  font-size: 0.8rem;
}

.popup-future-box {
  background: rgba(239, 68, 68, 0.12);
  border: 1px dashed rgba(220, 38, 38, 0.4);
  color: #991b1b;
}

.popup-weekend-icon,
.popup-future-icon {
  font-size: 1.4rem;
  line-height: 1;
  flex-shrink: 0;
}

.popup-empty-action-box {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.modal-date-alert {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.25);
  border-radius: var(--radius-md);
  color: #1d4ed8;
  font-size: 0.82rem;
  margin-bottom: var(--space-md);
}

.btn-outline-primary {
  background: transparent;
  color: var(--primary);
  border: 1.5px solid var(--primary);
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-outline-primary:hover:not(:disabled) {
  background: var(--primary);
  color: white;
}

.w-full {
  width: 100%;
}

@media (max-width: 640px) {

  .attendance-view {
    padding-top: 10px;
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
  background: #0f6b4a;
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

/* ---------------------------------------------------------------- attendance calendar (same look as the KBM calendar) */
.calendar-section {
  padding: 18px;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.month-title {
  color: var(--primary-dark);
  font-size: 0.95rem;
  text-align: center;
}

.nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--gray-200);
  border-radius: 10px;
  background: #fff;
  color: var(--primary-dark);
  cursor: pointer;
}

.nav-btn:hover:not(:disabled) {
  border-color: var(--primary);
}

.nav-btn:focus-visible,
.calendar-cell:focus-visible,
.sheet-close:focus-visible {
  outline: 3px solid var(--primary-300, #81c784);
  outline-offset: 1px;
}

.nav-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.loading-calendar {
  padding: 4px 0;
}

.weekdays,
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
}

.weekdays span {
  text-align: center;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--gray-500);
  padding-bottom: 4px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
}

.skeleton-day-header,
.skeleton-calendar-cell {
  background: linear-gradient(90deg, #ececec 25%, #f6f6f6 50%, #ececec 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 10px;
}

.skeleton-day-header {
  height: 16px;
  opacity: 0.7;
}

.skeleton-calendar-cell {
  min-height: 48px;
}

.calendar-cell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 10px;
  background: var(--gray-50, #f8fafc);
  color: var(--gray-800);
  font: inherit;
  font-weight: 600;
  font-size: 0.9rem;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.calendar-cell:hover {
  border-color: var(--primary);
}

.calendar-cell.is-hadir {
  background: #e3f1ea;
  color: #0a5c40;
}

.calendar-cell.is-tidak {
  background: #fdecea;
  color: #8e1b12;
}

.calendar-cell.is-off {
  background: transparent;
  color: var(--gray-300);
  text-decoration: line-through;
  text-decoration-color: var(--gray-300);
}

/* a holiday the teacher still came in: keep it readable, mark the holiday with a gold edge */
.calendar-cell.is-libur-masuk {
  box-shadow: inset 0 0 0 1.5px #d9a21b;
}

.calendar-cell.is-today {
  border-color: var(--primary);
}

.calendar-cell.is-selected {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
  text-decoration: none;
}

.mark {
  position: absolute;
  top: 2px;
  right: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.calendar-legend .mark {
  position: static;
  flex: none;
}

.mark-hadir,
.mark-tidak {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  color: #fff;
  font-size: 0.6rem;
  font-weight: 800;
  line-height: 1;
}

.mark-hadir {
  background: #0a5c40;
}

.mark-tidak {
  background: #b42318;
}

.mark-empty {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1.5px solid var(--gray-400);
}

.cell-holiday-dot {
  position: absolute;
  bottom: 4px;
  left: 50%;
  width: 5px;
  height: 5px;
  margin-left: -2.5px;
  border-radius: 50%;
  background: #d9a21b;
}

.calendar-cell.is-selected .mark-empty {
  border-color: #fff;
}

.calendar-legend {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  font-size: 0.72rem;
  color: var(--gray-600);
}

.calendar-legend li {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.swatch-off {
  width: 12px;
  height: 2px;
  background: var(--gray-300);
}

.swatch-libur {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #d9a21b;
}

.calendar-tip {
  margin: 8px 0 0;
  font-size: 0.75rem;
  color: var(--gray-500);
}

/* ---------------------------------------------------------------- day detail (same as the KBM day sheet) */
.att-day-overlay {
  position: fixed;
  inset: 0;
  z-index: 9990;
  background: rgba(3, 41, 29, 0.45);
}

.att-day-sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9991;
  width: 100%;
  max-height: 86dvh;
  overflow-y: auto;
  padding: 0;
  background: #fbf9f3;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -20px 50px -20px rgba(0, 0, 0, 0.45);
  padding-bottom: env(safe-area-inset-bottom);
}

@media (min-width: 640px) {
  .att-day-sheet {
    left: 50%;
    right: auto;
    bottom: auto;
    top: 50%;
    width: min(440px, calc(100vw - 48px));
    transform: translate(-50%, -50%);
    border-radius: 20px;
    max-height: 80vh;
  }
}

.att-day-sheet .popup-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 18px 12px;
  border-bottom: 1px solid rgba(11, 59, 42, 0.08);
}

.att-day-sheet .popup-header h4 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--lp-ink, #0b3b2a);
}

.sheet-close {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(11, 59, 42, 0.15);
  background: #fff;
  color: #2f4339;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.att-day-sheet .popup-content {
  padding: 16px 18px 20px;
}

.att-day-sheet .popup-checkin-time-header {
  margin: 12px 18px 0;
}

.att-day-sheet .holiday-banner {
  margin: 12px 18px 0;
}

.att-day-sheet .popup-actions .btn {
  min-height: 46px;
  border-radius: 12px;
}
</style>
