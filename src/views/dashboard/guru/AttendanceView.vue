<template>
  <div class="attendance-view">
    <header class="page-header at-head">
      <h1>Absensi Online</h1>
      <p>Catat kehadiran mengajar Anda setiap hari aktif, Senin sampai Jumat.</p>
    </header>

    <!-- Holiday notice (today or tomorrow) -->
    <div v-if="loadingHolidays" class="at-notice at-notice-loading" aria-hidden="true">
      <span class="at-notice-icon"></span>
      <span class="at-notice-lines"><i></i><i></i></span>
    </div>
    <template v-else>
      <div v-if="todayHoliday.isHoliday" class="at-notice" role="status">
        <span class="at-notice-icon"><LineIcon name="star" :size="18" /></span>
        <span class="at-notice-text">
          <strong>{{ todayHoliday.isCustom ? 'Hari ini libur' : 'Hari ini libur nasional' }}</strong>
          <span>{{ todayHoliday.holidayName }}</span>
        </span>
      </div>
      <div v-else-if="tomorrowHoliday.isHoliday" class="at-notice" role="status">
        <span class="at-notice-icon"><LineIcon name="calendar" :size="18" /></span>
        <span class="at-notice-text">
          <strong>Besok libur nasional</strong>
          <span>{{ tomorrowHoliday.holidayName }}</span>
        </span>
      </div>
    </template>

    <!-- Today -->
    <section class="at-today" aria-labelledby="at-today-title">
      <div class="at-date" aria-hidden="true">
        <span class="at-date-day">{{ dayName }}</span>
        <span class="at-date-num">{{ dateNumber }}</span>
        <span class="at-date-month">{{ monthYear }}</span>
      </div>

      <div class="at-today-body">
        <!-- loading -->
        <div v-if="loadingToday" class="at-loading" aria-busy="true">
          <SkeletonLoader type="text" height="22px" width="60%" />
          <SkeletonLoader type="text" height="16px" width="80%" />
          <SkeletonLoader type="text" height="44px" width="100%" />
        </div>

        <!-- already recorded -->
        <template v-else-if="todayAttendance">
          <div class="at-recorded">
            <span class="at-status-chip" :class="todayAttendance.status === 'hadir' ? 'is-hadir' : 'is-tidak'">
              <LineIcon :name="todayAttendance.status === 'hadir' ? 'check' : 'x'" :size="16" :stroke="2.6" />
              {{ todayAttendance.status === 'hadir' ? 'Hadir' : 'Tidak hadir' }}
            </span>
            <div class="at-recorded-text">
              <h2 id="at-today-title">
                {{ todayHoliday.isHoliday ? 'Masuk di hari libur' : 'Absensi hari ini sudah tercatat' }}
              </h2>
              <p v-if="todayHoliday.isHoliday">Anda masuk pada hari libur, dan admin telah mengabsenkan Anda.</p>
              <p v-else-if="todayAttendance.notes">Catatan: {{ todayAttendance.notes }}</p>
              <p v-else>Tersimpan dan sudah masuk rekap bulanan.</p>
            </div>
            <button v-if="!todayHoliday.isHoliday" type="button" class="at-btn-ghost" @click="openUpdateModal">
              <LineIcon name="pencil" :size="16" />
              Ubah status
            </button>
          </div>

          <!-- KBM of today (only when present) -->
          <div v-if="todayAttendance.status === 'hadir'" class="at-kbm">
            <div class="at-kbm-head">
              <span class="at-kbm-icon"><LineIcon name="book" :size="20" /></span>
              <div>
                <h3>KBM hari ini</h3>
                <SkeletonLoader v-if="loadingTodayKbm" type="text" width="70%" />
                <p v-else-if="todayKbmSessions.length === 0">Belum ada KBM. Lanjutkan dengan absensi santri dan jurnal mengajar.</p>
                <p v-else>{{ todayKbmSessions.length }} sesi sudah tersimpan.</p>
              </div>
            </div>

            <ul v-if="!loadingTodayKbm && todayKbmSessions.length > 0" class="at-kbm-list">
              <li v-for="s in todayKbmSessions" :key="s.id">
                <span class="at-kbm-done"><LineIcon name="check" :size="13" :stroke="3" /></span>
                <strong>{{ formatSessionClass(s) }}</strong>
                <span class="at-kbm-slot">{{ formatSessionSlot(s) }}</span>
                <span class="at-kbm-meta">
                  {{ s.type === 'teaching' ? 'KBM Normal' : (s.activityName || 'Non-KBM') }}<template v-if="s.meetingNumber"> · Pertemuan ke-{{ s.meetingNumber }}</template><template v-if="s.substituteFor"> · Badal</template>
                </span>
              </li>
            </ul>

            <router-link :to="todayKbmWorkspaceUrl" class="at-btn-primary">
              <LineIcon :name="todayKbmSessions.length === 0 ? 'pencil' : 'plus'" :size="17" />
              {{ todayKbmSessions.length === 0 ? 'Isi KBM & jurnal hari ini' : 'Buka / tambah KBM hari ini' }}
              <LineIcon name="arrow-right" :size="17" />
            </router-link>
          </div>

          <p v-else class="at-quiet">
            <LineIcon name="info" :size="18" />
            Anda tercatat tidak hadir hari ini, jadi tidak ada absensi santri atau jurnal yang perlu diisi.
          </p>
        </template>

        <!-- weekend -->
        <div v-else-if="isWeekend" class="at-rest">
          <span class="at-rest-icon"><LineIcon name="sun" :size="22" /></span>
          <div>
            <h2 id="at-today-title">Hari ini akhir pekan</h2>
            <p>Absensi hanya untuk Senin sampai Jumat.</p>
          </div>
        </div>

        <!-- holiday -->
        <div v-else-if="todayHoliday.isHoliday" class="at-rest is-holiday">
          <span class="at-rest-icon"><LineIcon name="star" :size="22" /></span>
          <div>
            <h2 id="at-today-title">{{ todayHoliday.isCustom ? 'Hari ini libur' : 'Hari ini libur nasional' }}</h2>
            <p class="at-rest-name">{{ todayHoliday.holidayName }}</p>
            <p>Tidak ada absensi untuk hari libur. Selamat beristirahat.</p>
          </div>
        </div>

        <!-- not recorded yet -->
        <div v-else class="at-form">
          <h2 id="at-today-title">Bagaimana kehadiran Anda hari ini?</h2>
          <p class="at-form-sub">Catat dulu kehadiran Anda, setelah itu KBM dan absensi santri bisa diisi.</p>

          <div class="at-choices" role="radiogroup" aria-labelledby="at-today-title">
            <button type="button" role="radio" class="at-choice is-hadir" :aria-checked="selectedStatus === 'hadir'"
              :class="{ active: selectedStatus === 'hadir' }" @click="selectedStatus = 'hadir'">
              <span class="at-choice-icon"><LineIcon name="check" :size="22" :stroke="2.6" /></span>
              <span class="at-choice-text">
                <strong>Hadir</strong>
                <span>Siap mengajar dan mengisi jurnal KBM</span>
              </span>
            </button>
            <button type="button" role="radio" class="at-choice is-tidak" :aria-checked="selectedStatus === 'tidak_hadir'"
              :class="{ active: selectedStatus === 'tidak_hadir' }" @click="selectedStatus = 'tidak_hadir'">
              <span class="at-choice-icon"><LineIcon name="x" :size="22" :stroke="2.6" /></span>
              <span class="at-choice-text">
                <strong>Tidak hadir</strong>
                <span>Izin, sakit, atau berhalangan</span>
              </span>
            </button>
          </div>

          <p v-if="selectedStatus" class="at-hint" aria-live="polite">
            <LineIcon name="info" :size="16" />
            {{ selectedStatus === 'hadir'
              ? 'Setelah disimpan, Anda langsung diarahkan untuk mengisi KBM hari ini.'
              : 'Dicatat sebagai tidak hadir di rekap bulanan. Tidak ada KBM yang perlu diisi hari ini.' }}
          </p>

          <label class="at-field">
            <span>Catatan <em>(opsional)</em></span>
            <input v-model="notes" type="text" placeholder="Misalnya: izin acara keluarga" />
          </label>

          <button type="button" class="at-btn-primary at-submit" :disabled="!selectedStatus || submitting" @click="submitAttendance">
            <template v-if="submitting">Menyimpan kehadiran…</template>
            <template v-else-if="selectedStatus === 'hadir'">Simpan hadir &amp; lanjut ke KBM <LineIcon name="arrow-right" :size="17" /></template>
            <template v-else-if="selectedStatus === 'tidak_hadir'">Simpan tidak hadir</template>
            <template v-else>Pilih status kehadiran dulu</template>
          </button>
        </div>
      </div>
    </section>

    <!-- Recap of the month shown in the calendar below -->
    <section class="at-recap" aria-labelledby="at-recap-title">
      <h2 id="at-recap-title" class="at-section-title">Rekap {{ calendarMonthNames[calendarMonth] }} {{ calendarYear }}</h2>
      <div class="at-ledger">
        <div class="at-ledger-cell">
          <span class="at-ledger-icon is-hadir"><LineIcon name="check" :size="18" :stroke="2.6" /></span>
          <span class="at-ledger-text">
            <span v-if="loading" class="at-ledger-skel"></span>
            <strong v-else>{{ monthlyStats.hadir }}</strong>
            <span>hari hadir</span>
          </span>
        </div>
        <div class="at-ledger-cell">
          <span class="at-ledger-icon is-tidak"><LineIcon name="x" :size="18" :stroke="2.6" /></span>
          <span class="at-ledger-text">
            <span v-if="loading" class="at-ledger-skel"></span>
            <strong v-else>{{ monthlyStats.tidakHadir }}</strong>
            <span>hari tidak hadir</span>
          </span>
        </div>
        <div class="at-ledger-cell is-pay">
          <span class="at-ledger-icon is-pay"><LineIcon name="coin" :size="18" /></span>
          <span class="at-ledger-text">
            <span v-if="loading" class="at-ledger-skel wide"></span>
            <strong v-else>Rp {{ formatCurrency(monthlyStats.hadir * 10000) }}</strong>
            <span>estimasi gaji · Rp 10.000 per hari hadir</span>
          </span>
        </div>
      </div>
    </section>

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
        <h3 class="at-modal-title">
          <span class="at-modal-title-icon"><LineIcon :name="updateForm.mode === 'create' ? 'plus' : 'pencil'" :size="18" /></span>
          {{ updateForm.mode === 'create' ? 'Catat kehadiran' : 'Ubah status absensi' }}
        </h3>
        <p class="at-modal-date">{{ updateForm.dateFormatted }}</p>

        <div v-if="!updateForm.isToday" class="at-modal-note">
          <LineIcon name="calendar" :size="16" />
          <span>Mengisi absensi untuk tanggal yang dipilih di kalender.</span>
        </div>

        <div class="form-group">
          <label class="form-label" id="at-modal-status">Status kehadiran</label>
          <div class="at-choices" role="radiogroup" aria-labelledby="at-modal-status">
            <button type="button" role="radio" class="at-choice is-hadir" :aria-checked="updateForm.status === 'hadir'"
              :class="{ active: updateForm.status === 'hadir' }" @click="updateForm.status = 'hadir'">
              <span class="at-choice-icon"><LineIcon name="check" :size="20" :stroke="2.6" /></span>
              <span class="at-choice-text"><strong>Hadir</strong></span>
            </button>
            <button type="button" role="radio" class="at-choice is-tidak" :aria-checked="updateForm.status === 'tidak_hadir'"
              :class="{ active: updateForm.status === 'tidak_hadir' }" @click="updateForm.status = 'tidak_hadir'">
              <span class="at-choice-icon"><LineIcon name="x" :size="20" :stroke="2.6" /></span>
              <span class="at-choice-text"><strong>Tidak hadir</strong></span>
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
          <div class="at-welcome">
            <div class="at-welcome-icon"><LineIcon name="check" :size="26" :stroke="2.8" /></div>
            <h3>Alhamdulillah, kehadiran tercatat</h3>
            <p>Status Anda hari ini: <strong>Hadir</strong></p>
          </div>

          <div class="at-welcome-next">
            <span class="at-kbm-icon"><LineIcon name="book" :size="20" /></span>
            <div>
              <strong>Lanjut isi KBM &amp; jurnal</strong>
              <p>Lengkapi absensi santri jilid Anda dan materi yang diajarkan hari ini.</p>
            </div>
          </div>

          <div class="at-welcome-actions">
            <button type="button" class="btn btn-secondary" @click="showPostAttendanceModal = false">
              Nanti Saja
            </button>
            <router-link :to="todayKbmWorkspaceUrl" class="btn btn-primary btn-direct-kbm"
              @click="showPostAttendanceModal = false">
              Isi KBM sekarang
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
import LineIcon from '@/components/LineIcon.vue'
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
// Today's own status: always from the current month, whatever month the calendar shows.
const loadingToday = ref(true)
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
    // Viewing the current month: the same list also tells today's status (no second request needed).
    if (calendarYear.value === today.getFullYear() && calendarMonth.value === today.getMonth()) {
      applyToday(attendanceHistory.value)
    }
  } catch (e) {
    console.log('Fetch error')
  } finally {
    loading.value = false
  }
}

// Today's record in a list of the current month's attendance (local date comparison).
const findToday = (list) => (list || []).find(a => {
  if (!a.date) return false
  let d
  if (a.date._seconds !== undefined) d = new Date(a.date._seconds * 1000)
  else if (a.date.seconds !== undefined) d = new Date(a.date.seconds * 1000)
  else d = new Date(a.date)
  return !isNaN(d.getTime()) &&
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
}) || null

const applyToday = (list) => {
  todayAttendance.value = findToday(list)
  loadingToday.value = false
  if (todayAttendance.value && todayAttendance.value.status === 'hadir') {
    fetchTodayKbm()
  } else {
    todayKbmSessions.value = []
  }
}

// The today card reads the CURRENT month, so moving the calendar to another month (or opening the page on
// ?month=...) never makes it look like today has not been filled in.
const fetchToday = async () => {
  loadingToday.value = true
  try {
    const { data } = await api.get('/attendance/me', {
      params: { month: today.getMonth() + 1, year: today.getFullYear() }
    })
    applyToday((data || []).filter(a => a.type !== 'student_attendance'))
  } catch (e) {
    console.log('Fetch today error')
  } finally {
    loadingToday.value = false
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
    if (calendarYear.value === today.getFullYear() && calendarMonth.value === today.getMonth()) {
      attendanceHistory.value.unshift(todayAttendance.value)
    }
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
      if (updateForm.value.isToday) await fetchToday()

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
      if (updateForm.value.isToday) await fetchToday()

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
  const viewingThisMonth = calendarYear.value === today.getFullYear() && calendarMonth.value === today.getMonth()
  if (!viewingThisMonth) fetchToday()
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

@keyframes bounce {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-8px);
  }
}

.notes-text {
  margin-top: var(--space-md);
  color: var(--gray-500);
  font-style: italic;
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

.modal-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
  margin-top: var(--space-xl);
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

/* Post-Attendance Modal */
.post-attendance-modal {
  max-width: 440px;
  width: 90%;
  padding: var(--space-xl);
  border-radius: var(--radius-2xl);
  background: white;
}

.btn-direct-kbm {
  font-weight: 600;
  text-decoration: none;
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

/* ================================================================ attendance page (guru): today + recap
   Operate surface in the dashboard world: ivory ground, emerald for "hadir", gold for pay and holidays.
   One drawn icon set (LineIcon); no emoji, no nested cards. */
.at-head {
  margin-bottom: 1.25rem;
}

.at-head h1 {
  font-size: 1.85rem;
  font-weight: 800;
  color: var(--lp-ink, #0b3b2a);
  letter-spacing: -0.01em;
  margin: 0 0 4px;
}

.at-head p {
  margin: 0;
  color: var(--lp-body, #475a50);
  font-size: 0.95rem;
}

.at-section-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 2rem 0 0.85rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--lp-ink, #0b3b2a);
}

.at-section-title::before {
  content: "";
  flex: none;
  width: 8px;
  height: 8px;
  background: var(--lp-gold-deep, #b45309);
  transform: rotate(45deg);
}

/* holiday notice */
.at-notice {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 1rem;
  padding: 12px 14px;
  border-radius: 14px;
  background: #fffbeb;
  border: 1px solid #f3d58b;
  color: #5b3a06;
}

.at-notice-icon {
  flex: none;
  width: 38px;
  height: 38px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  background: #fcd34d;
  color: #4a2c05;
}

.at-notice-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.at-notice-text strong {
  font-size: 0.9rem;
}

.at-notice-text span {
  font-size: 0.85rem;
}

.at-notice-loading .at-notice-icon {
  background: #f3e7c2;
}

.at-notice-lines {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.at-notice-lines i {
  display: block;
  height: 10px;
  width: 40%;
  border-radius: 6px;
  background: #f3e7c2;
}

.at-notice-lines i + i {
  width: 65%;
}

/* today */
.at-today {
  display: grid;
  grid-template-columns: 148px minmax(0, 1fr);
  gap: 18px;
  padding: 18px;
  border-radius: 20px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.1);
  box-shadow: 0 1px 2px rgba(3, 41, 29, 0.05), 0 10px 26px -14px rgba(3, 41, 29, 0.2);
}

.at-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 18px 10px;
  border-radius: 16px;
  color: #fff;
  background: linear-gradient(150deg, #0a5c40 0%, #053d2c 100%);
  box-shadow: inset 0 0 0 1px rgba(252, 211, 77, 0.3);
  text-align: center;
}

.at-date-day {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #fcd34d;
}

.at-date-num {
  font-size: 3.4rem;
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.03em;
}

.at-date-month {
  font-size: 0.85rem;
  font-weight: 600;
  opacity: 0.92;
  white-space: nowrap;
}

.at-today-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
}

.at-loading {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.at-today-body h2,
.at-today-body h3 {
  margin: 0;
  color: var(--lp-ink, #0b3b2a);
}

.at-today-body h2 {
  font-size: 1.2rem;
  font-weight: 800;
  text-wrap: balance;
}

.at-today-body p {
  margin: 0;
  color: var(--lp-body, #475a50);
  font-size: 0.9rem;
  line-height: 1.5;
}

/* recorded */
.at-recorded {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.at-recorded-text {
  flex: 1 1 220px;
  min-width: 0;
}

.at-status-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 0.9rem;
}

.at-status-chip.is-hadir {
  background: #e3f1ea;
  color: #0a5c40;
}

.at-status-chip.is-tidak {
  background: #fdecea;
  color: #8e1b12;
}

.at-btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1px solid rgba(11, 59, 42, 0.2);
  background: #fff;
  color: var(--lp-ink, #0b3b2a);
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.at-btn-ghost:hover {
  border-color: #0a5c40;
  background: #f3f8f5;
}

.at-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
  padding: 0 18px;
  border: 0;
  border-radius: 13px;
  background: linear-gradient(135deg, #0a5c40, #053d2c);
  color: #fff;
  font-weight: 700;
  font-size: 0.95rem;
  text-decoration: none;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(3, 41, 29, 0.2), 0 8px 18px -8px rgba(3, 41, 29, 0.55);
  transition: filter 0.15s ease;
}

.at-btn-primary:hover:not(:disabled) {
  filter: brightness(1.12);
}

.at-btn-primary:disabled {
  background: #d9e4de;
  color: #5b6b62;
  box-shadow: none;
  cursor: not-allowed;
}

.at-btn-ghost:focus-visible,
.at-btn-primary:focus-visible,
.at-choice:focus-visible,
.at-field input:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

/* KBM of today */
.at-kbm {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid rgba(11, 59, 42, 0.1);
}

.at-kbm-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.at-kbm-head h3 {
  font-size: 1rem;
  font-weight: 800;
}

.at-kbm-icon {
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: #0a5c40;
  color: #fcd34d;
}

.at-kbm-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.at-kbm-list li {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 10px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(11, 59, 42, 0.07);
}

.at-kbm-list li:first-child {
  border-top: 1px solid rgba(11, 59, 42, 0.07);
}

.at-kbm-list strong {
  color: var(--lp-ink, #0b3b2a);
  font-size: 0.95rem;
}

.at-kbm-done {
  flex: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #0a5c40;
  color: #fff;
}

.at-kbm-slot {
  padding: 3px 10px;
  border-radius: 999px;
  background: #e3f1ea;
  color: #0a5c40;
  font-size: 0.8rem;
  font-weight: 700;
}

.at-kbm-meta {
  margin-left: auto;
  font-size: 0.8rem;
  color: #5b6b62;
}

.at-quiet {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #f6f7f6;
  color: #3b4a42 !important;
}

/* weekend / holiday */
.at-rest {
  display: flex;
  align-items: center;
  gap: 14px;
}

.at-rest-icon {
  flex: none;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: #eef2ef;
  color: #3b4a42;
}

.at-rest.is-holiday .at-rest-icon {
  background: #fcd34d;
  color: #4a2c05;
}

.at-rest-name {
  font-weight: 700;
  color: #7c3a0d !important;
}

/* form */
.at-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.at-form-sub {
  margin-top: -6px !important;
}

.at-choices {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.at-choice {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 72px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1.5px solid rgba(11, 59, 42, 0.14);
  background: #fff;
  text-align: left;
  cursor: pointer;
  font: inherit;
  transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
}

.at-choice:hover {
  border-color: rgba(11, 59, 42, 0.35);
}

.at-choice-icon {
  flex: none;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #f1f3f2;
  color: #5b6b62;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.at-choice-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.at-choice-text strong {
  font-size: 1rem;
  color: var(--lp-ink, #0b3b2a);
}

.at-choice-text span {
  font-size: 0.82rem;
  color: #5b6b62;
}

.at-choice.is-hadir .at-choice-icon {
  background: #e3f1ea;
  color: #0a5c40;
}

.at-choice.is-tidak .at-choice-icon {
  background: #fdecea;
  color: #b42318;
}

.at-choice.is-hadir.active {
  border-color: #0a5c40;
  background: #f1f8f4;
  box-shadow: 0 0 0 3px rgba(10, 92, 64, 0.12);
}

.at-choice.is-hadir.active .at-choice-icon {
  background: #0a5c40;
  color: #fff;
}

.at-choice.is-tidak.active {
  border-color: #b42318;
  background: #fff6f5;
  box-shadow: 0 0 0 3px rgba(180, 35, 24, 0.1);
}

.at-choice.is-tidak.active .at-choice-icon {
  background: #b42318;
  color: #fff;
}

.at-hint {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.85rem !important;
}

.at-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.at-field > span {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--lp-ink, #0b3b2a);
}

.at-field em {
  font-style: normal;
  font-weight: 500;
  color: #5b6b62;
}

.at-field input {
  min-height: 46px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid rgba(11, 59, 42, 0.22);
  background: #fff;
  font: inherit;
  font-size: 0.95rem;
  color: var(--lp-ink, #0b3b2a);
}

.at-field input::placeholder {
  color: #7c8a83;
}

.at-submit {
  width: 100%;
}

/* recap ledger: one row, three readings divided by hairlines */
.at-ledger {
  display: grid;
  grid-template-columns: 1fr 1fr 1.4fr;
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.1);
  box-shadow: 0 1px 2px rgba(3, 41, 29, 0.05), 0 8px 22px -14px rgba(3, 41, 29, 0.18);
  overflow: hidden;
}

.at-ledger-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  min-width: 0;
}

.at-ledger-cell + .at-ledger-cell {
  border-left: 1px solid rgba(11, 59, 42, 0.08);
}

.at-ledger-cell.is-pay {
  background: #fffaeb;
}

.at-ledger-icon {
  flex: none;
  width: 38px;
  height: 38px;
  border-radius: 11px;
  display: grid;
  place-items: center;
}

.at-ledger-icon.is-hadir {
  background: #e3f1ea;
  color: #0a5c40;
}

.at-ledger-icon.is-tidak {
  background: #fdecea;
  color: #b42318;
}

.at-ledger-icon.is-pay {
  background: #fcd34d;
  color: #4a2c05;
}

.at-ledger-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.at-ledger-text strong {
  font-size: 1.6rem;
  font-weight: 800;
  line-height: 1.1;
  color: var(--lp-ink, #0b3b2a);
  font-variant-numeric: tabular-nums;
}

.at-ledger-cell.is-pay strong {
  color: #5b3a06;
}

.at-ledger-text > span:last-child {
  font-size: 0.8rem;
  color: #5b6b62;
}

.at-ledger-cell.is-pay .at-ledger-text > span:last-child {
  color: #7c5a1b;
}

.at-ledger-skel {
  display: block;
  width: 36px;
  height: 26px;
  margin-bottom: 2px;
  border-radius: 8px;
  background: #eef2ef;
}

.at-ledger-skel.wide {
  width: 120px;
}

/* the calendar section title matches, with the same air above it as the recap */
.history-section {
  margin-top: 2.25rem;
}

.history-section h2 {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--lp-ink, #0b3b2a);
}

.history-section h2::before {
  content: "";
  flex: none;
  width: 8px;
  height: 8px;
  background: var(--lp-gold-deep, #b45309);
  transform: rotate(45deg);
}

/* ---------------------------------------------------------------- dialogs of this page */
.at-modal-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 4px;
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--lp-ink, #0b3b2a);
}

.at-modal-title-icon {
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  background: #e3f1ea;
  color: #0a5c40;
}

.at-modal-date {
  margin: 0 0 12px;
  color: var(--lp-body, #475a50);
  font-size: 0.9rem;
}

.at-modal-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 14px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fffbeb;
  border: 1px solid #f3d58b;
  color: #5b3a06;
  font-size: 0.85rem;
}

.at-welcome {
  text-align: center;
}

.at-welcome-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 10px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #0a5c40;
  color: #fcd34d;
  box-shadow: 0 0 0 6px #e3f1ea;
}

.at-welcome h3 {
  margin: 0 0 6px;
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--lp-ink, #0b3b2a);
}

.at-welcome p {
  margin: 0;
  color: var(--lp-body, #475a50);
}

.at-welcome-next {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin: 16px 0;
  padding: 14px;
  border-radius: 14px;
  background: #f1f8f4;
  border: 1px solid #cfe6da;
  text-align: left;
}

.at-welcome-next strong {
  display: block;
  color: var(--lp-ink, #0b3b2a);
}

.at-welcome-next p {
  margin: 2px 0 0;
  font-size: 0.86rem;
  color: var(--lp-body, #475a50);
}

.at-welcome-actions {
  display: flex;
  gap: 10px;
}

.at-welcome-actions > * {
  flex: 1;
}

/* ---------------------------------------------------------------- phones */
@media (max-width: 640px) {
  .at-head {
    margin-bottom: 1rem;
  }

  .at-head h1 {
    font-size: 1.55rem;
  }

  .at-head p {
    font-size: 0.9rem;
  }

  /* status first, then the sentence, then the action: nothing squeezed side by side */
  .at-recorded {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .at-recorded .at-status-chip {
    align-self: flex-start;
  }

  .at-recorded-text {
    flex: none;
  }

  .at-today-body h2 {
    font-size: 1.1rem;
  }

  .at-section-title {
    margin-top: 1.75rem;
  }

  .history-section {
    margin-top: 1.75rem;
  }

  .at-today {
    grid-template-columns: minmax(0, 1fr);
    gap: 14px;
    padding: 14px;
  }

  /* date as a strip: the number on the left, day over month on the right */
  .at-date {
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: 14px;
    row-gap: 2px;
    align-items: center;
    padding: 12px 16px;
    text-align: left;
  }

  .at-date-num {
    grid-row: 1 / 3;
    font-size: 2.6rem;
  }

  .at-date-day {
    grid-column: 2;
    align-self: end;
    font-size: 0.72rem;
  }

  .at-date-month {
    grid-column: 2;
    align-self: start;
  }

  .at-recorded .at-btn-ghost {
    width: 100%;
    justify-content: center;
  }

  .at-choices {
    grid-template-columns: minmax(0, 1fr);
  }

  .at-kbm-meta {
    margin-left: 32px;
    flex-basis: 100%;
  }

  .at-kbm-list strong {
    font-size: 0.92rem;
  }

  .at-btn-primary {
    width: 100%;
  }

  .at-ledger {
    grid-template-columns: 1fr 1fr;
  }

  .at-ledger-cell.is-pay {
    grid-column: 1 / -1;
    border-left: 0;
    border-top: 1px solid rgba(11, 59, 42, 0.08);
  }

  .at-ledger-cell {
    padding: 14px;
  }

  .at-ledger-text strong {
    font-size: 1.35rem;
  }

  .at-welcome-actions {
    flex-direction: column-reverse;
  }
}

/* phones: the today card is one centred column - date, status, sentence, action - symmetric and calm */
@media (max-width: 640px) {
  .at-date {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    padding: 14px 16px;
    text-align: center;
  }

  .at-date-num {
    grid-row: auto;
    font-size: 2.8rem;
    order: 0;
  }

  .at-date-day,
  .at-date-month {
    grid-column: auto;
    align-self: center;
  }

  .at-recorded,
  .at-rest,
  .at-form {
    align-items: center;
    text-align: center;
  }

  .at-rest {
    flex-direction: column;
  }

  .at-recorded .at-status-chip {
    align-self: center;
  }

  .at-recorded-text p,
  .at-form p {
    margin-left: auto;
    margin-right: auto;
    max-width: 34ch;
  }

  .at-hint {
    justify-content: center;
    text-align: left;
  }

  .at-choices,
  .at-field,
  .at-submit {
    align-self: stretch;
    text-align: left;
  }

  .at-kbm-head {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 8px;
  }

  .at-kbm-list li {
    justify-content: center;
    text-align: center;
  }

  .at-kbm-meta {
    margin-left: 0;
    flex-basis: 100%;
  }

  .at-quiet {
    text-align: left;
  }

  .at-section-title {
    justify-content: center;
  }

  .history-section h2 {
    justify-content: center;
  }

  .history-header {
    justify-content: center;
  }

  .at-head {
    text-align: center;
  }

  .at-head p {
    max-width: 32ch;
    margin: 0 auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .at-choice,
  .at-choice-icon,
  .at-btn-ghost,
  .at-btn-primary {
    transition: none;
  }
}
</style>
