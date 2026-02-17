<template>
  <div class="admin-attendance-view">
    <header class="page-header">
      <div>
        <h1>📊 Rekap Absensi Guru</h1>
        <p>Monitor kehadiran semua pengajar TPQ AMANAH</p>
      </div>
      <div class="header-actions">
        <select v-model="selectedMonth" class="form-input form-select" @change="fetchData">
          <option v-for="m in availableMonths" :key="m.value" :value="m.value">
            {{ m.label }}
          </option>
        </select>

        <!-- Dropdown Actions for Admin -->
        <div v-if="isAdmin" class="dropdown-wrapper" ref="dropdownRef">
          <button class="btn btn-primary dropdown-trigger" @click="toggleDropdown">
            <span>⚡ Aksi</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
              :class="{ rotated: dropdownOpen }">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <transition name="dropdown">
            <div v-if="dropdownOpen" class="dropdown-menu">
              <button class="dropdown-item" @click="exportToPDF" :disabled="loading || exporting">
                <span v-if="exporting">⏳ Mengunduh...</span>
                <span v-else>📄 Export PDF</span>
              </button>
              <button class="dropdown-item" @click="openAddModal">
                ➕ Tambah Absensi
              </button>
              <button class="dropdown-item" @click="openHolidayModal">
                📅 Kelola Hari Libur
              </button>
            </div>
          </transition>
        </div>

        <!-- Simple Export Button for Guru -->
        <button v-else class="btn btn-export" @click="exportToPDF" :disabled="loading || exporting">
          <span v-if="exporting">⏳ Mengunduh...</span>
          <span v-else>📄 Export PDF</span>
        </button>
      </div>
    </header>

    <!-- Holiday Banner -->
    <div v-if="todayHoliday.isHoliday" class="holiday-alert today-holiday">
      <div class="holiday-alert-icon">🎉</div>
      <div class="holiday-alert-content">
        <span class="holiday-alert-label">Hari Ini Libur Nasional</span>
        <span class="holiday-alert-name">{{ todayHoliday.holidayName }}</span>
      </div>
    </div>
    <div v-else-if="tomorrowHoliday.isHoliday" class="holiday-alert tomorrow-holiday">
      <div class="holiday-alert-icon">📅</div>
      <div class="holiday-alert-content">
        <span class="holiday-alert-label">Besok Libur Nasional</span>
        <span class="holiday-alert-name">{{
          tomorrowHoliday.holidayName
        }}</span>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="summary-row">
      <div class="summary-card glass-card">
        <div class="summary-icon">👥</div>
        <div class="summary-content">
          <span v-if="loading" class="summary-value-skeleton"></span>
          <span v-else class="summary-value">{{ teachers.length }}</span>
          <span class="summary-label">Total Guru</span>
        </div>
      </div>
      <div class="summary-card glass-card">
        <div class="summary-icon">📅</div>
        <div class="summary-content">
          <span v-if="loading" class="summary-value-skeleton"></span>
          <span v-else class="summary-value">{{ activeDays }} Hari</span>
          <span class="summary-label">Hari Efektif</span>
        </div>
      </div>
      <div class="summary-card glass-card">
        <div class="summary-icon">✅</div>
        <div class="summary-content">
          <span v-if="loading" class="summary-value-skeleton"></span>
          <span v-else class="summary-value">{{ totalAttendance }}</span>
          <span class="summary-label">Total Kehadiran</span>
        </div>
      </div>
      <div class="summary-card glass-card highlight">
        <div class="summary-icon">💰</div>
        <div class="summary-content">
          <span v-if="loading" class="summary-value-skeleton wide"></span>
          <span v-else class="summary-value">Rp {{ formatCurrency(totalSalary) }}</span>
          <span class="summary-label">Total Gaji Bulan Ini</span>
        </div>
      </div>
    </div>

    <!-- Calendar Section -->
    <div class="calendar-wrapper">
      <!-- Filter moved outside/above calendar grid to match Guru style cleanliness -->
      <div class="filter-section">
        <label>Filter Guru:</label>
        <div class="select-wrapper">
          <select v-model="selectedTeacherId" class="form-input form-select filter-select">
            <option value="all">Semua Guru</option>
            <option v-for="t in teachers" :key="t.id" :value="t.id">
              {{ t.displayName }}
            </option>
          </select>
        </div>
      </div>

      <div class="calendar-container">
        <!-- Teacher Legend (Compact) -->
        <div class="teacher-legend" v-if="selectedTeacherId === 'all' && !loading">
          <div v-for="teacher in teachers" :key="teacher.id" class="legend-teacher">
            <span class="legend-avatar" :style="{ background: getTeacherColor(teacher.displayName) }">
              {{ getInitials(teacher.displayName) }}
            </span>
            <span class="legend-name">{{ teacher.displayName }}</span>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="calendar-loading">
          <div class="skeleton-calendar-header">
            <div class="skeleton-nav-btn"></div>
            <div class="skeleton-month"></div>
            <div class="skeleton-nav-btn"></div>
          </div>
          <div class="skeleton-grid">
            <div v-for="i in 35" :key="i" class="skeleton-cell"></div>
          </div>
        </div>

        <!-- Calendar Grid -->
        <template v-else>
          <!-- Month Navigation -->
          <div class="calendar-header">
            <button class="nav-btn" @click="prevMonth" :disabled="isFirstMonth">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <h3>{{ monthNames[currentMonth] }} {{ currentYear }}</h3>
            <button class="nav-btn" @click="nextMonth" :disabled="isCurrentMonth">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          <div class="calendar-grid">
            <!-- Day Headers -->
            <div class="day-header" v-for="day in dayNames" :key="day">
              {{ day }}
            </div>

            <!-- Empty cells for alignment -->
            <div v-for="n in firstDayOfMonth" :key="'empty-' + n" class="calendar-cell empty"></div>

            <!-- Date Cells -->
            <div v-for="date in daysInMonth" :key="date" class="calendar-cell" :class="getCellClass(date)"
              :title="getHolidayForDate(date)?.name || ''" @click="showDateDetail(date)">
              <span class="cell-date">{{ date }}</span>

              <!-- Teacher Avatars for ALL mode (Compact) -->
              <div v-if="selectedTeacherId === 'all'" class="cell-avatars">
                <!-- COMPACT VIEW AVATARS -->
                <div v-for="teacher in getVisibleTeachers(date)" :key="teacher.id" class="mini-avatar" :style="{
                  backgroundColor: getTeacherColor(teacher.displayName),
                }" :title="teacher.displayName">
                  {{ getInitials(teacher.displayName) }}
                </div>
                <div v-if="getHiddenCount(date) > 0" class="more-indicator">
                  +{{ getHiddenCount(date) }}
                </div>
              </div>

              <!-- Single Teacher Status -->
              <div v-else class="cell-status-single">
                <span v-if="getTeacherAttendanceForDate(date)" class="status-icon" :class="getTeacherAttendanceForDate(date).status === 'hadir'
                  ? 'hadir'
                  : 'tidak'
                  ">
                  {{
                    getTeacherAttendanceForDate(date).status === "hadir"
                      ? "✓"
                      : "✗"
                  }}
                </span>
              </div>

              <span class="cell-holiday-dot" v-if="getHolidayForDate(date)">🎉</span>
            </div>
          </div>

          <!-- Legend -->
          <div class="calendar-legend">
            <div class="legend-item">
              <span class="legend-dot hadir"></span> Hadir
            </div>
            <div class="legend-item">
              <span class="legend-dot tidak"></span> Tidak Hadir
            </div>
            <div class="legend-item">
              <span class="legend-dot empty"></span> Tidak Ada Data
            </div>
            <div class="legend-item">
              <span class="legend-dot libur"></span> Hari Libur
            </div>
          </div>
        </template>

        <!-- Date Detail Popup -->
        <div v-if="selectedDate" class="calendar-popup-overlay" @click="selectedDate = null"></div>
        <div v-if="selectedDate" class="calendar-popup glass-card">
          <div class="popup-header">
            <h4>{{ formatFullDate(selectedDate) }}</h4>
            <button class="close-btn" @click="selectedDate = null">×</button>
          </div>

          <!-- Check-in Time - Below Date Header (for single teacher view) -->
          <div v-if="
            selectedTeacherId !== 'all' && getTeacherCheckinTime(selectedDate)
          " class="popup-checkin-time-header">
            <span class="checkin-icon">🕐</span>
            <span>{{ getTeacherCheckinTime(selectedDate) }}</span>
          </div>

          <!-- Holiday Info -->
          <div v-if="getHolidayForDate(selectedDate)" class="popup-holiday">
            <span class="holiday-icon">🎉</span>
            <div>
              <div class="holiday-label">
                {{ getHolidayForDate(selectedDate).isCustom ? 'Hari Libur (Custom)' : 'Libur Nasional' }}</div>
              <div class="holiday-name">
                {{ getHolidayForDate(selectedDate).name }}
              </div>
            </div>
          </div>

          <div class="popup-content">
            <template v-if="selectedTeacherId === 'all'">
              <!-- Holiday/Weekend Logic -->
              <div v-if="
                getHolidayForDate(selectedDate) || isWeekend(selectedDate)
              " class="popup-section" style="text-align: center; padding: 20px 0">
                <div style="font-size: 3rem; margin-bottom: 10px">🏝️</div>
                <h5 style="
                    font-size: 1.1rem;
                    color: var(--primary-dark);
                    margin-bottom: 8px;
                  ">
                  Tidak Ada KBM
                </h5>
                <p class="text-muted">
                  {{
                    getHolidayForDate(selectedDate)
                      ? (getHolidayForDate(selectedDate).isCustom ? 'Hari Libur' : 'Hari Libur Nasional')
                      : 'Akhir Pekan (Weekend)'
                  }}
                </p>
              </div>

              <!-- Normal Days Logic -->
              <template v-else>
                <!-- SECTION 1: HADIR -->
                <div class="popup-section">
                  <h5>
                    ✅ Hadir ({{
                      getPresentTeachersWithTime(selectedDate).length
                    }})
                  </h5>
                  <div class="teacher-list-popup">
                    <div v-for="t in getPresentTeachersWithTime(selectedDate)" :key="t.id" class="popup-teacher-item">
                      <div class="mini-avatar" :style="{
                        backgroundColor: getTeacherColor(t.displayName),
                      }">
                        {{ getInitials(t.displayName) }}
                      </div>
                      <div class="teacher-info">
                        <span class="teacher-name">{{ t.displayName }}</span>
                        <span v-if="t.checkinTime" class="checkin-time">{{
                          t.checkinTime
                        }}</span>
                      </div>
                    </div>
                    <div v-if="
                      getPresentTeachersWithTime(selectedDate).length === 0
                    " class="text-muted">
                      Tidak ada data hadir
                    </div>
                  </div>
                </div>

                <!-- SECTION 2: TIDAK HADIR (Recorded as Izin/Sakit/Alpa) -->
                <div class="popup-section">
                  <h5>
                    ❌ Tidak Hadir ({{
                      getRecordedAbsentTeachersForDate(selectedDate).length
                    }})
                  </h5>
                  <div class="teacher-list-popup">
                    <div v-for="t in getRecordedAbsentTeachersForDate(
                      selectedDate,
                    )" :key="t.id" class="popup-teacher-item">
                      <div class="mini-avatar" :style="{
                        backgroundColor: getTeacherColor(t.displayName),
                      }">
                        {{ getInitials(t.displayName) }}
                      </div>
                      <span>{{ t.displayName }}</span>
                    </div>
                    <div v-if="
                      getRecordedAbsentTeachersForDate(selectedDate)
                        .length === 0
                    " class="text-muted">
                      Nihil
                    </div>
                  </div>
                </div>

                <!-- SECTION 3: BELUM ABSEN (No Record) -->
                <div class="popup-section">
                  <h5>
                    ⏳ Belum Absen ({{
                      getUnrecordedTeachersForDate(selectedDate).length
                    }})
                  </h5>
                  <div class="teacher-list-popup">
                    <div v-for="t in getUnrecordedTeachersForDate(selectedDate)" :key="t.id" class="popup-teacher-item"
                      style="opacity: 0.6">
                      <div class="mini-avatar" style="background-color: var(--gray-400)">
                        {{ getInitials(t.displayName) }}
                      </div>
                      <span>{{ t.displayName }}</span>
                    </div>
                    <div v-if="
                      getUnrecordedTeachersForDate(selectedDate).length === 0
                    " class="text-muted">
                      Semua sudah absen
                    </div>
                  </div>
                </div>
              </template>
            </template>

            <template v-else>
              <!-- Single Teacher Detail -->
              <div class="popup-single-teacher">
                <template v-if="getTeacherAttendanceForDate(selectedDate)">
                  <div class="status-badge large" :class="getTeacherAttendanceForDate(selectedDate).status">
                    {{
                      getTeacherAttendanceForDate(selectedDate).status ===
                        "hadir"
                        ? "✅ HADIR"
                        : "❌ TIDAK HADIR"
                    }}
                  </div>
                  <p class="popup-notes">
                    <strong>Catatan:</strong>
                    {{ getTeacherAttendanceForDate(selectedDate).notes || "-" }}
                  </p>

                  <div v-if="isAdmin && !getHolidayForDate(selectedDate) && !isWeekend(selectedDate)" class="mt-2">
                    <button class="btn btn-sm btn-outline-secondary" @click="
                      openAddModal(
                        selectedDate,
                        selectedTeacherId,
                        getTeacherAttendanceForDate(selectedDate),
                      )
                      ">
                      ✏️ Ubah Status
                    </button>
                  </div>
                </template>
                <p v-else class="text-muted">
                  Tidak ada data absensi untuk tanggal ini.
                </p>

                <div
                  v-if="!getTeacherAttendanceForDate(selectedDate) && isAdmin && !getHolidayForDate(selectedDate) && !isWeekend(selectedDate)"
                  class="mt-3">
                  <button class="btn btn-sm btn-outline-primary" @click="openAddModal(selectedDate, selectedTeacherId)">
                    + Input Absensi
                  </button>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Teachers Stats Summary -->
    <div class="teachers-stats glass-card" v-if="!loading">
      <h3>📊 Statistik Per Guru</h3>
      <div class="stats-grid">
        <div v-for="teacher in teachersWithStats" :key="teacher.id" class="stat-card"
          :style="{ '--teacher-color': getTeacherColor(teacher.displayName) }">
          <div class="stat-card-header">
            <span class="stat-avatar" :style="{ background: getTeacherColor(teacher.displayName) }">
              {{ getInitials(teacher.displayName) }}
            </span>
            <div class="stat-info">
              <h4>{{ teacher.displayName }}</h4>
              <p>{{ teacher.position || "Pengajar" }}</p>
            </div>
          </div>
          <div class="stat-card-body">
            <div class="stat-item hadir">
              <span class="stat-value">{{ teacher.hadirCount }}</span>
              <span class="stat-label">Hadir</span>
            </div>
            <div class="stat-item tidak">
              <span class="stat-value">{{ teacher.tidakHadirCount }}</span>
              <span class="stat-label">Tidak Hadir</span>
            </div>
            <div class="stat-item gaji">
              <span class="stat-value">Rp {{ formatCurrency(teacher.hadirCount * 10000) }}</span>
              <span class="stat-label">Gaji</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Attendance Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal glass-card">
        <h3>Tambah Data Absensi</h3>

        <!-- Summary for Quick Add (Hidden Inputs) -->
        <div v-if="form.isQuickAdd" class="p-3 mb-4 border border-green-100 rounded-lg bg-green-50">
          <p class="text-sm text-green-800" style="margin: 0; font-weight: 500">
            📝 Mencatat absensi untuk:
          </p>
          <p class="text-base font-bold text-green-700" style="margin: 4px 0">
            {{teachers.find((t) => t.id === form.guruId)?.displayName}}
          </p>
          <p class="text-xs text-green-600" style="margin: 0">
            Tanggal:
            {{
              new Date(form.date).toLocaleDateString("id-ID", {
                dateStyle: "full",
              })
            }}
          </p>
        </div>

        <div v-if="!form.isQuickAdd" class="form-group">
          <label class="form-label">Tanggal</label>
          <input v-model="form.date" type="date" class="form-input" />
        </div>

        <div v-if="!form.isQuickAdd" class="form-group">
          <label class="form-label">Guru</label>
          <select v-model="form.guruId" class="form-input form-select" @change="onGuruChange">
            <option value="">-- Pilih Guru --</option>
            <option v-for="t in teachers" :key="t.id" :value="t.id">
              {{ t.displayName }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Status</label>
          <div class="status-buttons">
            <button class="status-btn" :class="{
              active: form.status === 'hadir',
              hadir: form.status === 'hadir',
            }" @click="form.status = 'hadir'">
              ✅ Hadir
            </button>
            <button class="status-btn" :class="{
              active: form.status === 'tidak_hadir',
              tidak: form.status === 'tidak_hadir',
            }" @click="form.status = 'tidak_hadir'">
              ❌ Tidak Hadir
            </button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Keterangan (opsional)</label>
          <input v-model="form.notes" type="text" class="form-input" placeholder="Contoh: Izin sakit" />
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeModal">Batal</button>
          <button class="btn btn-primary" @click="saveAttendance" :disabled="saving">
            {{ saving ? "Menyimpan..." : "Simpan" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Holiday Management Modal -->
    <div v-if="showHolidayModal" class="modal-overlay" @click.self="closeHolidayModal">
      <div class="modal glass-card holiday-modal">
        <div class="holiday-modal-header">
          <h3>📅 Kelola Hari Libur</h3>
          <button class="close-btn" @click="closeHolidayModal">×</button>
        </div>

        <!-- Add Holiday Form -->
        <div class="holiday-form">
          <h4>Tambah Hari Libur</h4>
          <div class="form-group">
            <label class="form-label">Tanggal Mulai</label>
            <input v-model="holidayForm.startDate" type="date" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Tanggal Selesai (opsional, untuk range)</label>
            <input v-model="holidayForm.endDate" type="date" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Keterangan Libur</label>
            <input v-model="holidayForm.name" type="text" class="form-input"
              placeholder="Contoh: Libur Semester Genap, Cuti Bersama Idul Fitri" />
          </div>
          <button class="btn btn-primary" @click="saveHoliday" :disabled="savingHoliday" style="width: 100%">
            {{ savingHoliday ? 'Menyimpan...' : '➕ Tambah Hari Libur' }}
          </button>
        </div>

        <!-- Existing Custom Holidays List -->
        <div class="holiday-list">
          <h4>Hari Libur Bulan Ini ({{ monthNames[currentMonth] }} {{ currentYear }})</h4>
          <div v-if="customHolidaysForMonth.length === 0" class="text-muted" style="text-align: center; padding: 16px">
            Belum ada hari libur custom untuk bulan ini
          </div>
          <div v-else class="holiday-items">
            <div v-for="h in customHolidaysForMonth" :key="h.id" class="holiday-item">
              <div class="holiday-item-info">
                <span class="holiday-item-date">{{ formatHolidayDate(h.date) }}</span>
                <span class="holiday-item-name">{{ h.name }}</span>
              </div>
              <button class="btn-delete-holiday" @click="deleteHoliday(h.id)" title="Hapus hari libur">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import api from "@/services/api";
import { useToast } from "@/composables/useToast";
import {
  fetchHolidays,
  isTodayHoliday,
  isTomorrowHoliday,
  getHolidaysForMonth,
} from "@/services/holidayService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuthStore } from "@/stores/auth";

const { success, error: showError, warning } = useToast();
const authStore = useAuthStore();

const isAdmin = computed(() => authStore.isAdmin);

const today = new Date();
const monthNames = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

// State
const loading = ref(true);
const teachers = ref([]);
const attendanceData = ref([]);
const selectedMonth = ref(
  `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`,
);
const holidays = ref([]);
const monthHolidays = ref([]);

// Custom holidays state
const customHolidays = ref([]);
const showHolidayModal = ref(false);
const savingHoliday = ref(false);
const holidayForm = ref({
  startDate: "",
  endDate: "",
  name: "",
});

// Calendar state
const currentMonth = ref(today.getMonth());
const currentYear = ref(today.getFullYear());
const selectedDate = ref(null);

// Dropdown state
const dropdownOpen = ref(false);
const dropdownRef = ref(null);

// Filter state
const selectedTeacherId = ref("all");

// Computed for holidays
const todayHoliday = computed(() => isTodayHoliday(holidays.value));
const tomorrowHoliday = computed(() => isTomorrowHoliday(holidays.value));

const teachersWithStats = computed(() => {
  return teachers.value.map((t) => {
    const records = attendanceData.value.filter((a) => a.guruId === t.id);
    const hadirCount = records.filter((a) => a.status === "hadir").length;
    const tidakHadirCount = records.filter((a) => a.status !== "hadir").length;
    return { ...t, hadirCount, tidakHadirCount };
  });
});

// Modal state
const showModal = ref(false);
const saving = ref(false);
const exporting = ref(false);
const form = ref({
  date: "",
  guruId: "",
  guruName: "",
  status: "hadir",
  notes: "",
});

const availableMonths = computed(() => {
  const months = [];
  const startYear = 2026;
  const startMonth = 0;

  for (let year = startYear; year <= today.getFullYear(); year++) {
    const monthStart = year === startYear ? startMonth : 0;
    const monthEnd = year === today.getFullYear() ? today.getMonth() : 11;

    for (let month = monthStart; month <= monthEnd; month++) {
      months.push({
        value: `${year}-${String(month + 1).padStart(2, "0")}`,
        label: `${monthNames[month]} ${year}`,
      });
    }
  }

  return months.reverse();
});

const totalAttendance = computed(() => {
  return teachersWithStats.value.reduce((sum, t) => sum + t.hadirCount, 0);
});

const totalSalary = computed(() => {
  return totalAttendance.value * 10000;
});

// Computed: active working days (excluding weekends, national holidays, custom holidays)
const activeDays = computed(() => {
  const daysCount = new Date(currentYear.value, currentMonth.value + 1, 0).getDate();
  let count = 0;
  for (let day = 1; day <= daysCount; day++) {
    const dateObj = new Date(currentYear.value, currentMonth.value, day);
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Weekend
    if (monthHolidays.value.some(h => h.date === day)) continue; // National or custom holiday
    count++;
  }
  return count;
});

// Computed: custom holidays filtered for current month
const customHolidaysForMonth = computed(() => {
  const m = currentMonth.value + 1;
  const y = currentYear.value;
  return customHolidays.value.filter(h => {
    const [hy, hm] = h.date.split('-').map(Number);
    return hy === y && hm === m;
  });
});

// Calendar computed
const isCurrentMonth = computed(() => {
  return (
    currentMonth.value === today.getMonth() &&
    currentYear.value === today.getFullYear()
  );
});

const isFirstMonth = computed(() => {
  return currentMonth.value === 0 && currentYear.value === 2026;
});

const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate();
});

const firstDayOfMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value, 1).getDay();
});

// Helper functions
const formatCurrency = (num) => num.toLocaleString("id-ID");

const parseDate = (val) => {
  if (!val) return null;
  if (val.toDate && typeof val.toDate === "function") {
    return val.toDate();
  }
  if (val._seconds !== undefined) {
    return new Date(val._seconds * 1000);
  }
  if (val.seconds !== undefined) {
    return new Date(val.seconds * 1000);
  }
  return new Date(val);
};

const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};
// Color Logic
const teacherColorMap = ref({});

// Predefined vibrant colors (Mejikuhibiniu + extras) - Mixed for contrast
const palette = [
  "#D32F2F", // Red
  "#1976D2", // Blue
  "#388E3C", // Green
  "#F57C00", // Orange
  "#7B1FA2", // Purple
  "#0097A7", // Cyan
  "#C2185B", // Pink
  "#AFB42B", // Lime
  "#5D4037", // Brown
  "#0288D1", // Light Blue
  "#E64A19", // Deep Orange
  "#512DA8", // Deep Purple
  "#00796B", // Teal
  "#FFA000", // Amber
  "#303F9F", // Indigo
  "#689F38", // Light Green
  "#455A64", // Blue Grey
  "#616161", // Grey
  "#000000", // Black
];

const assignTeacherColors = (teacherList) => {
  const map = {};
  teacherList.forEach((t, index) => {
    map[t.displayName] = palette[index % palette.length];
  });
  teacherColorMap.value = map;
};

const getTeacherColor = (name) => {
  if (!name) return "#888888";
  return teacherColorMap.value[name] || palette[0];
};

// Calendar functions
const getHolidayForDate = (date) => {
  return monthHolidays.value.find((h) => h.date === date);
};

const updateMonthHolidays = () => {
  // Merge national holidays with custom holidays
  const national = getHolidaysForMonth(
    currentMonth.value,
    currentYear.value,
    holidays.value,
  );
  const custom = customHolidaysForMonth.value.map(h => ({
    date: parseInt(h.date.split('-')[2]),
    name: h.name,
    isCustom: true,
  }));
  // Merge, avoiding duplicates by date
  const merged = [...national];
  for (const ch of custom) {
    if (!merged.some(m => m.date === ch.date)) {
      merged.push(ch);
    }
  }
  monthHolidays.value = merged;
};

const getAttendanceForDate = (date) => {
  return attendanceData.value.filter((a) => {
    const d = parseDate(a.date);
    return (
      d &&
      d.getDate() === date &&
      d.getMonth() === currentMonth.value &&
      d.getFullYear() === currentYear.value
    );
  });
};

const getPresentTeachersForDate = (date) => {
  const attendanceForDate = getAttendanceForDate(date);
  const presentTeacherIds = attendanceForDate
    .filter((a) => a.status === "hadir")
    .map((a) => a.guruId);

  return teachers.value.filter((t) => presentTeacherIds.includes(t.id));
};

// Get present teachers with check-in time for popup display (sorted by time descending - newest first)
const getPresentTeachersWithTime = (date) => {
  const attendanceForDate = getAttendanceForDate(date);
  const presentAttendance = attendanceForDate.filter(
    (a) => a.status === "hadir",
  );

  // Sort by createdAt descending (newest first)
  presentAttendance.sort((a, b) => {
    const timeA = parseDate(a.createdAt)?.getTime() || 0;
    const timeB = parseDate(b.createdAt)?.getTime() || 0;
    return timeB - timeA; // Descending order
  });

  return presentAttendance.map((a) => {
    const teacher = teachers.value.find((t) => t.id === a.guruId);
    return {
      id: a.guruId,
      displayName: teacher?.displayName || a.guruName || "Unknown",
      checkinTime: formatCheckinTime(a.createdAt),
    };
  });
};

// Format check-in time from createdAt timestamp
const formatCheckinTime = (timestamp) => {
  if (!timestamp) return null;
  const d = parseDate(timestamp);
  if (!d || isNaN(d.getTime())) return null;
  return d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
};

// Get check-in time for single teacher view
const getTeacherCheckinTime = (date) => {
  const attendance = getTeacherAttendanceForDate(date);
  if (!attendance || attendance.status !== "hadir") return null;
  return formatCheckinTime(attendance.createdAt);
};

const getAbsentTeachersForDate = (date) => {
  const present = getPresentTeachersForDate(date);
  const presentIds = present.map((t) => t.id);
  return teachers.value.filter((t) => !presentIds.includes(t.id));
};

const getTeacherAttendanceForDate = (date) => {
  if (selectedTeacherId.value === "all") return null;

  return attendanceData.value.find((a) => {
    const d = parseDate(a.date);
    return (
      d &&
      d.getDate() === date &&
      d.getMonth() === currentMonth.value &&
      d.getFullYear() === currentYear.value &&
      a.guruId === selectedTeacherId.value
    );
  });
};

const getCellClass = (date) => {
  const classes = [];

  if (selectedTeacherId.value === "all") {
    const presentTeachers = getPresentTeachersForDate(date);
    if (presentTeachers.length > 0) {
      classes.push("has-attendance");
    } else {
      classes.push("no-data");
    }
  } else {
    const attendance = getTeacherAttendanceForDate(date);
    if (!attendance) {
      classes.push("no-data");
    } else {
      classes.push(attendance.status === "hadir" ? "hadir" : "tidak");
    }
  }

  if (getHolidayForDate(date)) {
    classes.push("libur");
  }

  return classes.join(" ");
};

// Logic for Avatars
const isMobile = ref(false);
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 1024;
};

onMounted(() => {
  checkMobile();
  window.addEventListener("resize", checkMobile);
});

onUnmounted(() => {
  window.removeEventListener("resize", checkMobile);
});

const getVisibleTeachers = (date) => {
  const attendanceForDate = getAttendanceForDate(date);
  const presentAttendance = attendanceForDate.filter(
    (a) => a.status === "hadir",
  );

  // Sort by createdAt descending (newest first) - same as popup
  presentAttendance.sort((a, b) => {
    const timeA = parseDate(a.createdAt)?.getTime() || 0;
    const timeB = parseDate(b.createdAt)?.getTime() || 0;
    return timeB - timeA; // Descending order
  });

  // Map to teacher objects
  const sortedTeachers = presentAttendance
    .map((a) => {
      return teachers.value.find((t) => t.id === a.guruId);
    })
    .filter(Boolean); // Remove null/undefined

  if (isMobile.value) {
    return sortedTeachers.slice(0, 4);
  }
  return sortedTeachers;
};

const getHiddenCount = (date) => {
  if (!isMobile.value) return 0;
  const total = getPresentTeachersForDate(date).length;
  return Math.max(0, total - 4);
};

// Logic for Popup Sections
const getUnrecordedTeachersForDate = (date) => {
  const recordsForDate = getAttendanceForDate(date);
  const recordedIds = recordsForDate.map((a) => a.guruId);
  return teachers.value.filter((t) => !recordedIds.includes(t.id));
};

const getRecordedAbsentTeachersForDate = (date) => {
  const records = getAttendanceForDate(date).filter(
    (a) => a.status !== "hadir",
  );
  const ids = records.map((a) => a.guruId);
  return teachers.value.filter((t) => ids.includes(t.id));
};

const isWeekend = (date) => {
  const d = new Date(currentYear.value, currentMonth.value, date);
  const day = d.getDay();
  return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
};

const formatFullDate = (date) => {
  const d = new Date(currentYear.value, currentMonth.value, date);
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const showDateDetail = (date) => {
  selectedDate.value = date;
};

const prevMonth = () => {
  if (isFirstMonth.value) return;
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
  // Update selectedMonth to sync with calendar
  selectedMonth.value = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, "0")}`;
  fetchCustomHolidays();
  fetchData();
};

const nextMonth = () => {
  if (isCurrentMonth.value) return;
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
  // Update selectedMonth to sync with calendar
  selectedMonth.value = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, "0")}`;
  fetchCustomHolidays();
  fetchData();
};

// Dropdown functions
const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value;
};

const closeDropdownOnClickOutside = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    dropdownOpen.value = false;
  }
};

// Data fetching
const fetchData = async () => {
  loading.value = true;
  try {
    const [year, month] = selectedMonth.value.split("-").map(Number);

    // Update calendar state
    currentMonth.value = month - 1;
    currentYear.value = year;

    const { data: guruData } = await api.get("/users?role=guru");
    teachers.value = guruData.sort((a, b) =>
      a.displayName.localeCompare(b.displayName),
    );
    assignTeacherColors(teachers.value);

    const { data: attData } = await api.get("/attendance", {
      params: { month, year },
    });
    attendanceData.value = attData;

    updateMonthHolidays();
  } catch (e) {
    console.error("Fetch error:", e);
    showError("Gagal memuat data. Periksa izin akses.");
  } finally {
    loading.value = false;
  }
};

const openAddModal = (day = null, guruId = "", existingData = null) => {
  let dateStr = new Date().toLocaleDateString("sv-SE"); // Default today

  if (day) {
    const d = new Date(currentYear.value, currentMonth.value, day);
    dateStr = d.toLocaleDateString("sv-SE");
  }

  const isQuickAdd = !!(day && guruId);

  form.value = {
    date: dateStr,
    guruId: guruId || "",
    status: existingData ? existingData.status : "hadir",
    notes: existingData ? existingData.notes : "",
    isQuickAdd,
  };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const onGuruChange = () => {
  const t = teachers.value.find((t) => t.id === form.value.guruId);
  form.value.guruName = t?.displayName || "";
};

// Export to PDF
const exportToPDF = () => {
  dropdownOpen.value = false;

  if (teachersWithStats.value.length === 0) {
    warning("Tidak ada data untuk di-export");
    return;
  }

  exporting.value = true;

  try {
    const doc = new jsPDF();
    const [year, monthNum] = selectedMonth.value.split("-").map(Number);
    const monthName = monthNames[monthNum - 1];

    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("LAPORAN ABSENSI GURU", 105, 20, { align: "center" });

    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text("TPQ AMANAH", 105, 28, { align: "center" });

    doc.setFontSize(11);
    doc.text(`Periode: ${monthName} ${year}`, 105, 36, { align: "center" });

    // Line separator
    doc.setDrawColor(0, 100, 0);
    doc.setLineWidth(0.5);
    doc.line(14, 42, 196, 42);

    // Table data
    const tableData = teachersWithStats.value.map((teacher, index) => [
      index + 1,
      teacher.displayName,
      teacher.hadirCount,
      teacher.tidakHadirCount,
      `Rp ${formatCurrency(teacher.hadirCount * 10000)}`,
    ]);

    // Add table
    autoTable(doc, {
      startY: 48,
      head: [["No", "Nama Guru", "Hadir", "Izin/Tidak Hadir", "Gaji"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [34, 139, 34],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 15 },
        1: { halign: "center", cellWidth: 60 },
        2: { halign: "center", cellWidth: 25 },
        3: { halign: "center", cellWidth: 35 },
        4: { halign: "center", cellWidth: 45 },
      },
      styles: {
        fontSize: 10,
        cellPadding: 4,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    // Summary footer
    const finalY = (doc.lastAutoTable?.finalY || 100) + 10;

    // Calculate totals for PDF
    const totalHadirPDF = teachersWithStats.value.reduce(
      (sum, t) => sum + t.hadirCount,
      0,
    );
    const totalGajiPDF = totalHadirPDF * 10000;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Kehadiran: ${totalHadirPDF}`, 14, finalY);
    doc.text(`Total Gaji: Rp ${formatCurrency(totalGajiPDF)}`, 14, finalY + 6);

    // Calculate Active Days (Hari Efektif)
    let activeDaysCount = 0;
    const daysCount = new Date(year, monthNum, 0).getDate();

    for (let day = 1; day <= daysCount; day++) {
      const dateObj = new Date(year, monthNum - 1, day);
      const isWeekendDay = dateObj.getDay() === 0 || dateObj.getDay() === 6;
      const isHolidayDay = monthHolidays.value.some((h) => h.date === day);

      if (!isWeekendDay && !isHolidayDay) {
        activeDaysCount++;
      }
    }

    const maxSalary = activeDaysCount * 10000;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Total Hari Efektif: ${activeDaysCount} Hari`, 14, finalY + 14);
    doc.text(
      `Potensi Gaji Maksimal (per Guru): Rp ${formatCurrency(maxSalary)}`,
      14,
      finalY + 19,
    );

    // Custom holidays section in PDF (grouped by date range)
    const customHolidaysInMonth = customHolidaysForMonth.value;
    let yOffset = finalY + 28;
    if (customHolidaysInMonth.length > 0) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`Hari Libur Tambahan:`, 14, yOffset);
      yOffset += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      // Group consecutive holidays with the same name into ranges
      const sorted = [...customHolidaysInMonth].sort((a, b) => a.date.localeCompare(b.date));
      const groups = [];
      let currentGroup = null;

      for (const h of sorted) {
        const hDate = new Date(h.date + 'T00:00:00');
        if (currentGroup && currentGroup.name === h.name) {
          // Check if consecutive (difference of 1 day from last date in group)
          const lastDate = currentGroup.endDate;
          const diffDays = Math.round((hDate - lastDate) / (1000 * 60 * 60 * 24));
          if (diffDays <= 1) {
            currentGroup.endDate = hDate;
            currentGroup.count++;
            continue;
          }
        }
        // Start a new group
        currentGroup = { name: h.name, startDate: hDate, endDate: hDate, count: 1 };
        groups.push(currentGroup);
      }

      for (const g of groups) {
        const formatOpts = { day: 'numeric', month: 'long', year: 'numeric' };
        if (g.count === 1) {
          const dayName = g.startDate.toLocaleDateString('id-ID', { weekday: 'long' });
          const dateStr = g.startDate.toLocaleDateString('id-ID', formatOpts);
          doc.text(`  - ${dayName}, ${dateStr}: ${g.name}`, 14, yOffset);
        } else {
          const startStr = g.startDate.toLocaleDateString('id-ID', formatOpts);
          const endStr = g.endDate.toLocaleDateString('id-ID', formatOpts);
          doc.text(`  - ${startStr} s/d ${endStr}: ${g.name} (${g.count} hari)`, 14, yOffset);
        }
        yOffset += 4.5;
      }
      yOffset += 3;
    }

    // Generated date
    const now = new Date();
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text(
      `Dicetak pada: ${now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`,
      14,
      yOffset,
    );

    // Generate filename
    const filename = `${year}_${monthName.toLowerCase()}_report_absen.pdf`;

    // Save/download PDF
    doc.save(filename);

    success(`Berhasil mengunduh ${filename}`);
  } catch (e) {
    console.error("Export error:", e);
    showError("Gagal mengexport PDF");
  } finally {
    exporting.value = false;
  }
};

const saveAttendance = async () => {
  if (!form.value.date) {
    warning("Tanggal wajib diisi");
    return;
  }
  if (!form.value.guruId) {
    warning("Pilih guru terlebih dahulu");
    return;
  }
  saving.value = true;
  try {
    const teacher = teachers.value.find((t) => t.id === form.value.guruId);
    const payload = {
      guruId: form.value.guruId,
      guruName: teacher ? teacher.displayName : "",
      date: form.value.date,
      status: form.value.status,
      notes: form.value.notes,
    };

    await api.post("/attendance/admin", payload);

    success("Data absensi berhasil disimpan");
    closeModal();
    fetchData(); // Refresh grid
  } catch (e) {
    console.error("Save error:", e);
    showError(e.response?.data?.error || "Gagal menyimpan data");
  } finally {
    saving.value = false;
  }
};

// Custom holiday CRUD functions
const fetchCustomHolidays = async () => {
  try {
    const { data } = await api.get('/holidays', {
      params: { month: currentMonth.value + 1, year: currentYear.value }
    });
    customHolidays.value = data;
    updateMonthHolidays();
  } catch (e) {
    console.error('Fetch custom holidays error:', e);
  }
};

const openHolidayModal = () => {
  dropdownOpen.value = false;
  holidayForm.value = { startDate: '', endDate: '', name: '' };
  showHolidayModal.value = true;
};

const closeHolidayModal = () => {
  showHolidayModal.value = false;
};

const formatHolidayDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const saveHoliday = async () => {
  if (!holidayForm.value.name?.trim()) {
    warning('Keterangan libur wajib diisi');
    return;
  }
  if (!holidayForm.value.startDate) {
    warning('Tanggal mulai wajib diisi');
    return;
  }

  savingHoliday.value = true;
  try {
    // Generate date array from start to end
    const dates = [];
    const start = new Date(holidayForm.value.startDate + 'T00:00:00');
    const end = holidayForm.value.endDate
      ? new Date(holidayForm.value.endDate + 'T00:00:00')
      : start;

    if (end < start) {
      warning('Tanggal selesai harus setelah tanggal mulai');
      savingHoliday.value = false;
      return;
    }

    const current = new Date(start);
    while (current <= end) {
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      const dd = String(current.getDate()).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-${dd}`);
      current.setDate(current.getDate() + 1);
    }

    await api.post('/holidays', {
      dates,
      name: holidayForm.value.name.trim(),
    });

    success(`Berhasil menambahkan ${dates.length} hari libur`);
    holidayForm.value = { startDate: '', endDate: '', name: '' };
    await fetchCustomHolidays();
  } catch (e) {
    console.error('Save holiday error:', e);
    showError(e.response?.data?.error || 'Gagal menambahkan hari libur');
  } finally {
    savingHoliday.value = false;
  }
};

const deleteHoliday = async (id) => {
  if (!confirm('Yakin ingin menghapus hari libur ini?')) return;
  try {
    await api.delete(`/holidays/${id}`);
    success('Hari libur berhasil dihapus');
    await fetchCustomHolidays();
  } catch (e) {
    console.error('Delete holiday error:', e);
    showError('Gagal menghapus hari libur');
  }
};

onMounted(async () => {
  document.addEventListener("click", closeDropdownOnClickOutside);

  // Fetch national holidays
  holidays.value = await fetchHolidays();

  // Fetch custom holidays then merge
  await fetchCustomHolidays();

  // Fetch attendance data
  await fetchData();
});

onUnmounted(() => {
  document.removeEventListener("click", closeDropdownOnClickOutside);
});
</script>

<style scoped>
.admin-attendance-view {
  width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.page-header h1 {
  font-size: 1.5rem;
  color: var(--primary-dark);
  margin-bottom: 4px;
}

.page-header p {
  color: var(--gray-600);
  font-size: 0.875rem;
  margin: 0;
}

/* Header Actions */
.header-actions {
  display: flex;
  gap: var(--space-md);
  align-items: center;
  flex-wrap: nowrap;
  flex: 1;
}

.header-actions select {
  min-width: 160px;
  flex: 2;
}

.header-actions> :not(:first-child) {
  flex: 1;
}

/* Dropdown Styles */
.dropdown-wrapper {
  position: relative;
}

.dropdown-wrapper button {
  width: 100%;
}

.dropdown-trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg) !important;
}

.dropdown-trigger svg {
  transition: transform 0.2s ease;
}

.dropdown-trigger svg.rotated {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  min-width: 180px;
  z-index: 100;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: var(--space-md) var(--space-lg);
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 0.9rem;
}

.dropdown-item:hover {
  background: var(--gray-50);
}

.dropdown-item:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Export Button for Guru */
.btn-export {
  background: linear-gradient(135deg, #2196f3, #1976d2);
  color: white;
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-full);
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  white-space: nowrap;
}

.btn-export:hover:not(:disabled) {
  background: linear-gradient(135deg, #1976d2, #1565c0);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

.btn-export:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Summary Cards */
.summary-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.summary-card {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-xl);
  background: rgba(255, 255, 255, 0.95);
}

.summary-card.highlight {
  background: linear-gradient(135deg,
      rgba(255, 215, 0, 0.1),
      rgba(255, 193, 7, 0.15));
  border: 2px solid rgba(255, 193, 7, 0.3);
}

.summary-icon {
  font-size: 2.5rem;
}

.summary-content {
  display: flex;
  flex-direction: column;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-dark);
}

.summary-label {
  font-size: 0.875rem;
  color: var(--gray-500);
}

/* Calendar Section (Guru Style) */
.calendar-wrapper {
  margin-bottom: var(--space-xl);
}

.filter-section {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.filter-section label {
  font-weight: 600;
  color: var(--gray-700);
}

.select-wrapper {
  flex-grow: 1;
  max-width: 300px;
}

.calendar-container {
  padding: var(--space-xl);
  background: rgba(255, 255, 255, 0.95);
  /* Guru style white background */
  border-radius: var(--radius-xl);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Teacher Legend */
.teacher-legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--gray-50);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-lg);
  border: 1px solid var(--gray-100);
}

.legend-teacher {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 4px 8px;
  background: white;
  border-radius: var(--radius-full);
  border: 1px solid var(--gray-200);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.legend-avatar {
  width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.55rem;
}

.legend-name {
  font-size: 0.75rem;
  color: var(--gray-700);
  font-weight: 500;
}

/* Calendar Header */
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
  font-weight: 700;
}

.nav-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: var(--gray-100);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--gray-600);
}

.nav-btn:hover:not(:disabled) {
  background: var(--primary);
  color: white;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Calendar Grid */
/* Calendar Grid - Compact & Safe */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  /* Force columns to not expand */
  gap: 5px;
  /* Tighter gap */
  margin-top: var(--space-md);
  width: 100%;
}

.day-header {
  text-align: center;
  font-weight: 600;
  font-size: 0.75rem;
  color: var(--gray-500);
  padding: 4px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.calendar-popup .mini-avatar {
  margin: 0 !important;
}

.calendar-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: var(--radius-md);
  position: relative;
  background: #f8fafc;
  cursor: pointer;
  transition: transform 0.2s;
  border: 1px solid transparent;
  width: 100%;
  min-width: 0;
  min-height: 0;
  box-sizing: border-box;
  /* Crucial for borders */
  overflow: hidden;
}

.calendar-cell:hover:not(.empty) {
  transform: scale(1.05);
  /* box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); */
  z-index: 5;
  /* background: white; */
  /* border-color: var(--primary-light); */
}

.calendar-cell.empty {
  background: transparent;
  cursor: default;
}

.calendar-cell.has-attendance {
  background: white;
  border: 1px solid var(--gray-200);
}

.calendar-cell.hadir {
  background: rgba(76, 175, 80, 0.1);
  border: 2px solid #4caf50;
}

.calendar-cell.tidak {
  background: rgba(244, 67, 54, 0.1);
  border: 2px solid #f44336;
}

.calendar-cell.no-data {
  background: var(--gray-100);
  border: 1px dashed var(--gray-200);
}

.calendar-cell.libur {
  background: rgba(255, 193, 7, 0.15) !important;
  border: 2px solid #ffc107 !important;
}

.cell-date {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--gray-800);
  margin-bottom: 4px;
}

.cell-avatars {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2px;
  justify-content: center;
  width: 100%;
  padding: 0 4px;
}

.mini-avatar {
  width: 18px;
  height: 18px;
  border-radius: var(--radius-full);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.5rem;
  margin: 0 auto;
}

.more-indicator {
  font-size: 0.6rem;
  color: var(--gray-500);
  text-align: center;
  grid-column: 1 / -1;
  font-weight: 600;
  margin-top: 2px;
}

.cell-status-single {
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-icon {
  font-size: 1.2rem;
  font-weight: bold;
}

.status-icon.hadir {
  color: #4caf50;
}

.status-icon.tidak {
  color: #f44336;
}

.cell-holiday-dot {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 0.6rem;
  line-height: 1;
}

/* Calendar Legend */
.calendar-legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-lg);
  margin-top: var(--space-xl);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--gray-100);
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: 0.8rem;
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
  background: rgba(255, 193, 7, 0.3);
  border: 2px solid #ffc107;
}

/* Calendar Popup */
.calendar-popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 100;
  backdrop-filter: blur(2px);
}

.calendar-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 400px;
  background: white;
  border-radius: var(--radius-xl);
  z-index: 101;
  padding: 0;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.popup-header {
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--gray-100);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--gray-50);
  border-top-left-radius: var(--radius-xl);
  border-top-right-radius: var(--radius-xl);
}

.popup-header h4 {
  margin: 0;
  color: var(--primary-dark);
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--gray-400);
  line-height: 1;
}

.popup-holiday {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: rgba(255, 193, 7, 0.1);
  align-items: center;
  border-bottom: 1px solid rgba(255, 193, 7, 0.2);
}

.popup-holiday .holiday-icon {
  font-size: 1.2rem;
}

.popup-holiday .holiday-label {
  font-size: 0.7rem;
  color: #e65100;
  font-weight: 700;
  text-transform: uppercase;
}

.popup-holiday .holiday-name {
  font-weight: 600;
  color: #e65100;
}

.popup-content {
  padding: var(--space-lg);
  overflow-y: auto;
}

.popup-section {
  margin-bottom: var(--space-lg);
}

.popup-section h5 {
  font-size: 0.85rem;
  color: var(--gray-700);
  margin: 0 0 var(--space-sm) 0;
  font-weight: 600;
}

.teacher-list-popup {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-sm);
  padding: 0 1rem;
}

.popup-teacher-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  font-size: 0.85rem;
  padding: 6px 8px;
  background: var(--gray-50);
  border-radius: var(--radius-md);
  line-height: 1;
}

.popup-teacher-item .teacher-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.popup-teacher-item .teacher-name {
  font-weight: 500;
  color: var(--gray-800);
}

.popup-teacher-item .checkin-time {
  font-size: 0.7rem;
  color: var(--gray-500);
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 3px;
}

.popup-teacher-item .checkin-time::before {
  content: "🕐";
  font-size: 0.65rem;
}

.popup-checkin-time {
  font-size: 0.9rem;
  color: var(--gray-600);
  margin: 0 0 var(--space-md) 0;
  padding: var(--space-sm) var(--space-md);
  background: rgba(33, 150, 243, 0.1);
  border-radius: var(--radius-md);
  display: inline-block;
}

/* Check-in Time Header - Below Date */
.popup-checkin-time-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  background: linear-gradient(135deg,
      rgba(76, 175, 80, 0.1),
      rgba(46, 125, 50, 0.08));
  border-bottom: 1px solid rgba(76, 175, 80, 0.2);
  font-size: 0.85rem;
  color: #2e7d32;
  font-weight: 500;
}

.popup-checkin-time-header .checkin-icon {
  font-size: 0.9rem;
}

.popup-single-teacher {
  text-align: center;
}

.status-badge.large {
  display: inline-block;
  padding: var(--space-sm) var(--space-xl);
  border-radius: var(--radius-full);
  font-weight: 700;
  font-size: 1rem;
  margin-bottom: var(--space-md);
}

.status-badge.hadir {
  background: rgba(76, 175, 80, 0.15);
  color: #2e7d32;
}

.status-badge.tidak {
  background: rgba(244, 67, 54, 0.15);
  color: #c62828;
}

.text-muted {
  color: var(--gray-500);
  font-style: italic;
  font-size: 0.85rem;
}

/* Teachers Stats */
.teachers-stats {
  padding: var(--space-xl);
  background: rgba(255, 255, 255, 0.95);
  margin-top: var(--space-xl);
}

.teachers-stats h3 {
  color: var(--primary-dark);
  margin: 0 0 var(--space-lg) 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-lg);
}

.stat-card {
  background: var(--gray-50);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  border-left: 4px solid var(--teacher-color, var(--primary));
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-card-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.stat-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
}

.stat-info h4 {
  margin: 0;
  color: var(--primary-dark);
  font-size: 0.95rem;
}

.stat-info p {
  margin: 0;
  color: var(--gray-500);
  font-size: 0.75rem;
}

.stat-card-body {
  display: flex;
  gap: var(--space-lg);
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-item .stat-value {
  display: block;
  font-size: 1rem;
  font-weight: 700;
}

.stat-item .stat-label {
  font-size: 0.65rem;
  color: var(--gray-500);
  text-transform: uppercase;
}

.stat-item.hadir .stat-value {
  color: #4caf50;
}

.stat-item.tidak .stat-value {
  color: #f44336;
}

.stat-item.gaji .stat-value {
  color: #ff9800;
  font-size: 0.85rem;
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
  background: linear-gradient(135deg,
      rgba(255, 193, 7, 0.2),
      rgba(255, 152, 0, 0.25));
  border: 2px solid rgba(255, 152, 0, 0.4);
}

.tomorrow-holiday {
  background: linear-gradient(135deg,
      rgba(33, 150, 243, 0.15),
      rgba(30, 136, 229, 0.2));
  border: 2px solid rgba(33, 150, 243, 0.3);
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

/* Modal */
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
  margin-bottom: var(--space-lg);
}

.modal-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
  margin-top: var(--space-xl);
}

/* Status Buttons */
.status-buttons {
  display: flex;
  gap: var(--space-md);
}

.status-btn {
  flex: 1;
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  font-weight: 600;
  background: var(--gray-100);
  color: var(--gray-600);
  transition: all 0.2s;
  border: 2px solid transparent;
  cursor: pointer;
}

.status-btn.active.hadir {
  background: rgba(76, 175, 80, 0.15);
  color: #388e3c;
  border: 2px solid #4caf50;
}

.status-btn.active.tidak {
  background: rgba(244, 67, 54, 0.15);
  color: #c62828;
  border: 2px solid #f44336;
}

/* Skeleton Styles */
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

.skeleton-nav-btn,
.skeleton-month,
.skeleton-cell,
.summary-value-skeleton {
  background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
}

.calendar-loading {
  padding: var(--space-lg);
}

.skeleton-calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xl);
}

.skeleton-nav-btn {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
}

.skeleton-month {
  width: 150px;
  height: 28px;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.skeleton-cell {
  aspect-ratio: 1;
  border-radius: var(--radius-lg);
  min-height: 60px;
}

.summary-value-skeleton {
  display: inline-block;
  height: 32px;
  width: 50px;
  border-radius: var(--radius-md);
  vertical-align: middle;
}

.summary-value-skeleton.wide {
  width: 120px;
}

/* Mobile & Tablet Responsive (Compact View) */
@media (max-width: 1024px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
    margin-bottom: var(--space-md);
  }

  .popup-teacher-item {
    font-size: 0.7rem;
    gap: 3px;
  }

  .popup-teacher-item .checkin-time {
    font-size: 0.6rem;

    gap: 1px;
  }

  .popup-teacher-item .checkin-time::before {
    font-size: 0.5rem;
  }

  .header-actions {
    margin-top: var(--space-sm);

    gap: var(--space-sm);
  }

  .header-actions select {
    grid-column: 1 / -1;
    width: 100%;
  }

  .dropdown-wrapper,
  .btn-export {
    width: 100%;
  }

  .dropdown-trigger {
    width: 100%;
    justify-content: center;
  }

  .dropdown-menu {
    left: 0;
    right: 0;
  }

  .summary-row {
    grid-template-columns: 1fr;
    gap: var(--space-md);
  }

  .filter-section {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-xs);
  }

  .select-wrapper {
    max-width: none;
    width: 100%;
  }

  .calendar-container {
    padding: 6px;
    /* Reduced for mobile */
    overflow: visible;
    /* Allow content to show, grid should fit */
  }

  .teacher-legend {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 4px;
    padding: 8px;
    margin-bottom: var(--space-md);
  }

  .legend-teacher {
    width: 100%;
    justify-content: flex-start;
    padding: 2px 4px;
    min-width: 0;
  }

  .legend-name {
    display: block;
    font-size: 0.65rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .calendar-header {
    margin-bottom: var(--space-md);
  }

  .calendar-header h3 {
    font-size: 1rem;
  }

  .nav-btn {
    width: 32px;
    height: 32px;
  }

  .calendar-grid {
    gap: 1px;
    width: 100%;
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    /* Force strict width */
  }

  .day-header {
    font-size: 0.65rem;
    padding: 2px 0;
  }

  .calendar-cell {
    box-sizing: border-box;
    /* Ensure borders don't add width */
    padding: 0px;
    border-radius: var(--radius-sm);
    min-height: 0;
    min-width: 0;
    /* CRITICAL for grid shrinking */
    width: 100%;
    /* Ensure fits in grid track */
    aspect-ratio: 1;
    /* Force square shape */
  }

  .cell-date {
    font-size: 0.6rem;
    margin-top: 2px;
    margin-bottom: 0;
    line-height: 1.2;
  }

  .cell-avatars {
    gap: 1px;
    padding: 0 1px;
    margin-top: 1px;
  }

  .mini-avatar {
    width: 10px;
    /* Smaller avatars */
    height: 10px;
    font-size: 0.3rem;
  }

  .more-indicator {
    font-size: 0.45rem;
    margin-top: 0;
  }

  /* Status icon for single view */
  .status-icon {
    font-size: 0.9rem;
  }

  .holiday-alert {
    padding: var(--space-sm);
    gap: var(--space-sm);
    flex-wrap: wrap;
  }

  .holiday-alert-icon {
    font-size: 1.2rem;
  }

  .holiday-alert-label {
    font-size: 0.65rem;
    width: 100%;
  }

  .holiday-alert-name {
    font-size: 0.85rem;
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: var(--space-md);
  }

  .stat-card {
    padding: var(--space-md);
  }

  /* Skeleton Mobile Overrides */
  .skeleton-grid {
    gap: 1px;
  }

  .skeleton-cell {
    min-height: 0;
    border-radius: var(--radius-sm);
    aspect-ratio: 1;
  }

  .skeleton-calendar-header {
    margin-bottom: var(--space-md);
  }

  .skeleton-nav-btn {
    width: 32px;
    height: 32px;
  }

  .skeleton-month {
    width: 100px;
    height: 24px;
  }
}

/* Desktop Avatar Grid Override (Show All) */
@media (min-width: 1025px) {
  .cell-avatars {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    /* 3 columns on desktop for density */
    gap: 4px;
    align-content: start;
    padding: 2px;
  }
}

@media (max-width: 640px) {
  .legend-item {
    font-size: 0.5rem;
  }

  .calendar-legend {
    gap: var(--space-sm);
  }

  .teachers-stats {
    padding: var(--space-md) !important;
  }
}

@media (max-width: 430px) {
  .header-actions select {
    flex: 1 !important;
  }
}

/* Holiday Management Modal */
.holiday-modal {
  max-width: 560px;
  width: 95vw;
  max-height: 85vh;
  overflow-y: auto;
}

.holiday-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--gray-200);
}

.holiday-modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--primary-dark);
}

.holiday-modal-header .close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: var(--gray-100);
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.holiday-modal-header .close-btn:hover {
  background: var(--gray-200);
}

.holiday-form {
  background: rgba(34, 139, 34, 0.05);
  border: 1px solid rgba(34, 139, 34, 0.15);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  margin-bottom: var(--space-lg);
}

.holiday-form h4 {
  margin: 0 0 var(--space-md) 0;
  font-size: 1rem;
  color: var(--primary-dark);
}

.holiday-list {
  margin-top: var(--space-md);
}

.holiday-list h4 {
  margin: 0 0 var(--space-md) 0;
  font-size: 1rem;
  color: var(--gray-700);
}

.holiday-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  max-height: 250px;
  overflow-y: auto;
}

.holiday-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-sm) var(--space-md);
  background: rgba(255, 193, 7, 0.08);
  border: 1px solid rgba(255, 193, 7, 0.2);
  border-radius: var(--radius-md);
  transition: background 0.2s;
}

.holiday-item:hover {
  background: rgba(255, 193, 7, 0.15);
}

.holiday-item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.holiday-item-date {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--gray-800);
}

.holiday-item-name {
  font-size: 0.8rem;
  color: var(--gray-600);
}

.btn-delete-holiday {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: background 0.2s;
  opacity: 0.6;
}

.btn-delete-holiday:hover {
  background: rgba(211, 47, 47, 0.1);
  opacity: 1;
}

/* ===== RESPONSIVE MOBILE STYLES ===== */
@media (max-width: 768px) {
  .admin-attendance-view {
    padding-top: 56px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-md);
    margin-bottom: var(--space-lg);
  }

  .page-header h1 {
    font-size: 1.25rem;
  }

  .page-header p {
    font-size: 0.8rem;
  }

  /* Header actions: month select + action button side by side */
  .header-actions {
    width: 100%;
    gap: var(--space-sm);
  }

  .header-actions select {
    min-width: 0;
    font-size: 0.85rem;
  }

  /* Summary cards: 2x2 grid, compact */
  .summary-row {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-md);
    margin-bottom: var(--space-lg);
  }

  .summary-card {
    padding: var(--space-md);
    gap: var(--space-sm);
    flex-direction: column;
    text-align: center;
    min-width: 0;
  }

  .summary-icon {
    font-size: 1.8rem;
  }

  .summary-value {
    font-size: 1.1rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
  }

  .summary-label {
    font-size: 0.7rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
  }

  /* Holiday alert compact */
  .holiday-alert {
    padding: var(--space-md) var(--space-lg);
    gap: var(--space-md);
  }

  .holiday-alert-icon {
    font-size: 1.5rem;
  }

  .holiday-alert-name {
    font-size: 0.95rem;
  }

  .holiday-alert-label {
    font-size: 0.7rem;
  }

  /* Calendar section */
  .calendar-container {
    padding: var(--space-md);
  }

  .calendar-header h3 {
    font-size: 1rem;
  }

  .calendar-grid {
    gap: 3px;
  }

  .day-header {
    font-size: 0.65rem;
    padding: 2px 0;
  }

  .cell-date {
    font-size: 0.7rem;
    margin-bottom: 2px;
  }

  .cell-avatars {
    padding: 0 2px;
    gap: 1px;
  }

  .mini-avatar {
    width: 14px;
    height: 14px;
    font-size: 0.4rem;
  }

  .more-indicator {
    font-size: 0.5rem;
  }

  .status-icon {
    font-size: 0.9rem;
  }

  .cell-holiday-dot {
    font-size: 0.45rem;
    top: 1px;
    right: 1px;
  }

  /* Calendar Legend */
  .calendar-legend {
    gap: var(--space-sm);
    margin-top: var(--space-md);
    padding-top: var(--space-md);
    flex-wrap: wrap;
    justify-content: center;
  }

  .legend-item {
    font-size: 0.7rem;
    gap: 3px;
  }

  .legend-dot {
    width: 10px;
    height: 10px;
  }

  /* Teacher Legend */
  .teacher-legend {
    gap: 4px;
    padding: var(--space-sm);
    margin-bottom: var(--space-md);
  }

  .legend-teacher {
    padding: 2px 6px;
    font-size: 0.7rem;
  }

  .legend-avatar {
    width: 16px;
    height: 16px;
    font-size: 0.45rem;
  }

  .legend-name {
    font-size: 0.65rem;
  }

  /* Filter section */
  .filter-section {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-sm);
  }

  .select-wrapper {
    max-width: 100%;
  }

  /* Popup */
  .calendar-popup {
    width: 95%;
    max-width: none;
    max-height: 85vh;
  }

  .popup-header h4 {
    font-size: 0.9rem;
  }

  .teacher-list-popup {
    grid-template-columns: 1fr;
    padding: 0 var(--space-sm);
  }

  .popup-teacher-item {
    font-size: 0.8rem;
    padding: 4px 6px;
  }

  /* Stats Grid */
  .teachers-stats {
    padding: var(--space-md);
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: var(--space-md);
  }

  .stat-card {
    padding: var(--space-md);
  }

  .stat-avatar {
    width: 32px;
    height: 32px;
    font-size: 0.75rem;
  }

  .stat-info h4 {
    font-size: 0.85rem;
  }

  .stat-card-body {
    gap: var(--space-md);
  }

  .stat-item .stat-value {
    font-size: 0.9rem;
  }

  .stat-item .stat-label {
    font-size: 0.6rem;
  }

  /* Modals */
  .modal {
    max-width: 100%;
    padding: var(--space-lg);
  }

  .modal h3 {
    font-size: 1.1rem;
  }

  .status-buttons {
    flex-direction: column;
  }

  /* Holiday Modal */
  .holiday-modal {
    max-width: 100%;
    padding: var(--space-lg);
  }

  .holiday-modal-header h3 {
    font-size: 1rem;
  }
}

/* Extra small screens */
@media (max-width: 400px) {
  .summary-card {
    padding: var(--space-sm);
  }

  .summary-icon {
    font-size: 1.5rem;
  }

  .summary-value {
    font-size: 0.95rem;
  }

  .summary-label {
    font-size: 0.65rem;
  }

  .calendar-grid {
    gap: 2px;
  }

  .cell-date {
    font-size: 0.6rem;
  }

  .mini-avatar {
    width: 12px;
    height: 12px;
    font-size: 0.35rem;
  }

  .page-header h1 {
    font-size: 1.1rem;
  }

  .header-actions {
    flex-direction: column;
  }

  .header-actions select {
    width: 100%;
  }
}
</style>
