<template>
  <div class="admin-attendance-view">
    <header class="page-header">
      <div>
        <h1>Rekap Absensi Guru</h1>
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
            <LineIcon name="bolt" :size="16" />
            <span>Aksi</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
              :class="{ rotated: dropdownOpen }">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <transition name="dropdown">
            <div v-if="dropdownOpen" class="dropdown-menu">
              <button class="dropdown-item" @click="exportToPDF" :disabled="loading || exporting">
                <LineIcon :name="exporting ? 'clock' : 'file'" :size="17" />
                <span>{{ exporting ? 'Mengunduh…' : 'Export PDF' }}</span>
              </button>
              <button class="dropdown-item" @click="exportToExcel" :disabled="loading || exportingExcel">
                <LineIcon :name="exportingExcel ? 'clock' : 'table'" :size="17" />
                <span>{{ exportingExcel ? 'Menyiapkan…' : 'Export Excel' }}</span>
              </button>
              <button class="dropdown-item" @click="openAddModal">
                <LineIcon name="plus" :size="17" />
                <span>Tambah absensi</span>
              </button>
              <button class="dropdown-item" @click="openHolidayModal">
                <LineIcon name="calendar" :size="17" />
                <span>Kelola hari libur</span>
              </button>
              <button class="dropdown-item" @click="openQuickSettingsModal">
                <LineIcon name="link" :size="17" />
                <span>Pengaturan link WA</span>
              </button>
              <button class="dropdown-item dropdown-item-danger" @click="openResetTestingModal()">
                <LineIcon name="refresh" :size="17" />
                <span>Reset sesi testing</span>
              </button>
            </div>
          </transition>
        </div>

        <!-- Simple Export Button for Guru -->
        <button v-else class="btn btn-export" @click="exportToPDF" :disabled="loading || exporting">
          <LineIcon :name="exporting ? 'clock' : 'file'" :size="17" />
          <span>{{ exporting ? 'Mengunduh…' : 'Export PDF' }}</span>
        </button>
        <button v-if="!isAdmin" class="btn btn-export" @click="exportToExcel" :disabled="loading || exportingExcel">
          <LineIcon :name="exportingExcel ? 'clock' : 'table'" :size="17" />
          <span>{{ exportingExcel ? 'Menyiapkan…' : 'Export Excel' }}</span>
        </button>
      </div>
    </header>

    <!-- Holiday Banner -->
    <div v-if="loadingHolidays" class="holiday-alert skeleton-holiday-alert" style="margin-bottom: var(--space-lg);">
      <div class="skeleton-icon"></div>
      <div class="skeleton-text-container">
        <div class="skeleton-text label"></div>
        <div class="skeleton-text name"></div>
      </div>
    </div>
    <template v-else>
      <div v-if="todayHoliday.isHoliday" class="ta-notice" role="status">
        <span class="ta-notice-icon"><LineIcon name="star" :size="18" /></span>
        <span class="ta-notice-text"><strong>Hari ini libur nasional</strong><span>{{ todayHoliday.holidayName }}</span></span>
      </div>
      <div v-else-if="tomorrowHoliday.isHoliday" class="ta-notice" role="status">
        <span class="ta-notice-icon"><LineIcon name="calendar" :size="18" /></span>
        <span class="ta-notice-text"><strong>Besok libur nasional</strong><span>{{ tomorrowHoliday.holidayName }}</span></span>
      </div>
    </template>

    <!-- Summary Cards -->
    <div class="summary-row">
      <div class="summary-card glass-card">
        <div class="summary-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
        <div class="summary-content">
          <span v-if="loading" class="summary-value-skeleton"></span>
          <span v-else class="summary-value">{{ teachers.length }}</span>
          <span class="summary-label">Total Guru</span>
        </div>
      </div>
      <div class="summary-card glass-card">
        <div class="summary-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
        <div class="summary-content">
          <span v-if="loading" class="summary-value-skeleton"></span>
          <span v-else class="summary-value">{{ activeDays }} Hari</span>
          <span class="summary-label">Hari Efektif</span>
        </div>
      </div>
      <div class="summary-card glass-card">
        <div class="summary-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>
        <div class="summary-content">
          <span v-if="loading" class="summary-value-skeleton"></span>
          <span v-else class="summary-value">{{ totalAttendance }}</span>
          <span class="summary-label">Total Kehadiran</span>
        </div>
      </div>
      <div class="summary-card glass-card highlight">
        <div class="summary-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/></svg></div>
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
        <label for="ta-teacher-filter">Tampilkan</label>
        <div class="select-wrapper">
          <select id="ta-teacher-filter" v-model="selectedTeacherId" class="form-input form-select filter-select">
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
            <button type="button" class="nav-btn" aria-label="Bulan sebelumnya" @click="prevMonth" :disabled="isFirstMonth">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <strong class="month-title" aria-live="polite">{{ monthNames[currentMonth] }} {{ currentYear }}</strong>
            <button type="button" class="nav-btn" aria-label="Bulan berikutnya" @click="nextMonth" :disabled="isLastAllowedMonth">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>

          <!-- Same look as the guru calendar: Min first, marks in the corner -->
          <div class="weekdays" aria-hidden="true">
            <span v-for="day in dayNames" :key="day">{{ day }}</span>
          </div>
          <div class="calendar-grid" :class="{ 'is-all': selectedTeacherId === 'all' }" role="group"
            :aria-label="`Kalender absensi, ${monthNames[currentMonth]} ${currentYear}`">
            <span v-for="n in firstDayOfMonth" :key="'empty-' + n" aria-hidden="true"></span>

            <button v-for="date in daysInMonth" :key="date" type="button" class="calendar-cell" :class="getCellClass(date)"
              :title="getHolidayForDate(date)?.name || ''" :aria-pressed="selectedDate === date" @click="showDateDetail(date)">
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

              <!-- One teacher: the same marks as the guru calendar -->
              <template v-else>
                <span v-if="getTeacherAttendanceForDate(date)?.status === 'hadir'" class="mark mark-hadir" aria-hidden="true">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
                <span v-else-if="getTeacherAttendanceForDate(date)" class="mark mark-tidak" aria-hidden="true">✕</span>
                <span v-else-if="isExpectedDay(date)" class="mark mark-empty" aria-hidden="true"></span>
              </template>

              <span v-if="getHolidayForDate(date)" class="cell-holiday-dot" aria-hidden="true"></span>
            </button>
          </div>

          <!-- Legend -->
          <ul class="calendar-legend" aria-label="Keterangan">
            <template v-if="selectedTeacherId === 'all'">
              <li><span class="legend-initial">UA</span>Inisial guru yang hadir</li>
            </template>
            <template v-else>
              <li><span class="mark mark-hadir"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><polyline points="20 6 9 17 4 12" /></svg></span>Hadir</li>
              <li><span class="mark mark-tidak">✕</span>Tidak hadir (izin / sakit)</li>
              <li><span class="mark mark-empty"></span>Belum absen</li>
            </template>
            <li><span class="swatch-libur"></span>Hari libur</li>
            <li><span class="swatch-off"></span>Akhir pekan / belum tiba</li>
          </ul>
          <p class="calendar-tip">Ketuk tanggal untuk melihat detail{{ selectedTeacherId === 'all' ? ' siapa saja yang hadir' : '' }}.</p>
        </template>

        <!-- Date Detail Popup -->
          <Teleport to="body">
          <div v-if="selectedDate" class="ta-day-overlay" @click="selectedDate = null"></div>
          <div v-if="selectedDate" class="ta-day-sheet" role="dialog" aria-modal="true">
          <div class="popup-header">
            <h4>{{ formatFullDate(selectedDate) }}</h4>
            <button type="button" class="close-btn sheet-close" aria-label="Tutup" @click="selectedDate = null">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>

          <!-- Check-in Time - Below Date Header (for single teacher view) -->
          <div v-if="
            !loading && selectedTeacherId !== 'all' && getTeacherCheckinTime(selectedDate)
          " class="popup-checkin-time-header">
            <span class="checkin-icon">🕐</span>
            <span>{{ getTeacherCheckinTime(selectedDate) }}</span>
          </div>

          <!-- Holiday Info -->
          <div v-if="!loading && getHolidayForDate(selectedDate)" class="popup-holiday">
            <span class="holiday-icon">🎉</span>
            <div>
              <div class="holiday-label">
                {{ getHolidayForDate(selectedDate).isCustom ? 'Hari Libur (Custom)' : 'Libur Nasional' }}</div>
              <div class="holiday-name">
                {{ getHolidayForDate(selectedDate).name }}
              </div>
            </div>
          </div>

          <div v-if="loading" class="popup-content">
            <div class="calendar-loading p-4" style="padding-top: 0;">
              <!-- Skeleton single teacher / status badge -->
              <div v-if="selectedTeacherId !== 'all'" class="skeleton-grid"
                style="grid-template-columns: 1fr; gap: 16px; align-items: center; justify-content: center; display: flex; flex-direction: column;">
                <div class="skeleton-cell"
                  style="width: 140px; height: 36px; border-radius: 9999px; margin-bottom: 8px;"></div>
                <div class="skeleton-cell" style="width: 80%; height: 16px; border-radius: 4px;"></div>
                <div class="skeleton-cell" style="width: 160px; height: 38px; border-radius: 9999px; margin-top: 24px;">
                </div>
              </div>

              <!-- Skeleton for all teachers (List view) -->
              <template v-else>
                <div class="skeleton-section" style="margin-bottom: 24px;">
                  <div class="skeleton-cell"
                    style="width: 120px; height: 18px; border-radius: 4px; margin-bottom: 12px;"></div>
                  <div class="skeleton-grid" style="grid-template-columns: 1fr 1fr; gap: 8px; padding: 0 16px;">
                    <div v-for="i in 4" :key="i" class="skeleton-item"
                      style="display: flex; align-items: center; gap: 8px; padding: 6px 8px; background: var(--gray-50); border-radius: 8px;">
                      <div class="skeleton-cell" style="width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0;">
                      </div>
                      <div style="display: flex; flex-direction: column; gap: 4px; width: 100%;">
                        <div class="skeleton-cell" style="width: 70%; height: 12px; border-radius: 3px;"></div>
                        <div class="skeleton-cell" style="width: 40%; height: 10px; border-radius: 3px;"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="skeleton-section">
                  <div class="skeleton-cell"
                    style="width: 100px; height: 18px; border-radius: 4px; margin-bottom: 12px;"></div>
                  <div class="skeleton-grid" style="grid-template-columns: 1fr 1fr; gap: 8px; padding: 0 16px;">
                    <div v-for="i in 2" :key="'absent-' + i" class="skeleton-item"
                      style="display: flex; align-items: center; gap: 8px; padding: 6px 8px; background: var(--gray-50); border-radius: 8px;">
                      <div class="skeleton-cell" style="width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0;">
                      </div>
                      <div class="skeleton-cell" style="width: 80%; height: 12px; border-radius: 3px;"></div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
          <div v-else class="popup-content">
            <template v-if="selectedTeacherId === 'all'">
              <!-- Weekend Only (no action buttons) -->
              <div v-if="isWeekend(selectedDate) && !getHolidayForDate(selectedDate)" class="popup-section" style="text-align: center; padding: 20px 0">
                <div style="font-size: 3rem; margin-bottom: 10px">🏝️</div>
                <h5 style="font-size: 1.1rem; color: var(--primary-dark); margin-bottom: 8px;">Tidak Ada KBM</h5>
                <p class="text-muted">Akhir Pekan (Weekend)</p>
              </div>

              <!-- National/Custom Holiday (with admin actions) -->
              <div v-else-if="getHolidayForDate(selectedDate)" class="popup-section">
                <!-- Holiday info + icon -->
                <div style="text-align: center; padding: 10px 0 16px">
                  <div style="font-size: 3rem; margin-bottom: 10px">🏝️</div>
                  <h5 style="font-size: 1.1rem; color: var(--primary-dark); margin-bottom: 4px;">Tidak Ada KBM</h5>
                  <p class="text-muted" style="margin-bottom: 0">
                    {{ getHolidayForDate(selectedDate).isCustom ? 'Hari Libur' : 'Hari Libur Nasional' }}
                  </p>
                </div>

                <!-- Show teachers who were marked present on this holiday -->
                <div v-if="getPresentTeachersWithTime(selectedDate).length > 0" class="popup-section" style="border-top: 1px solid var(--gray-200); padding-top: 16px">
                  <h5>✅ Guru Masuk di Hari Libur ({{ getPresentTeachersWithTime(selectedDate).length }})</h5>
                  <div class="teacher-list-popup">
                    <div v-for="t in getPresentTeachersWithTime(selectedDate)" :key="t.id" class="popup-teacher-item">
                      <div class="mini-avatar" :style="{ backgroundColor: getTeacherColor(t.displayName) }">
                        {{ getInitials(t.displayName) }}
                      </div>
                      <div class="teacher-info">
                        <span class="teacher-name">{{ t.displayName }}</span>
                        <span v-if="t.checkinTime" class="checkin-time">{{ t.checkinTime }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Admin Action Buttons -->
                <div v-if="isAdmin" class="popup-holiday-actions" style="border-top: 1px solid var(--gray-200); padding-top: 16px; margin-top: 12px;">
                  <button class="btn-action-primary" style="width: 100%; margin-bottom: 8px;" @click="openAddModal(selectedDate)">
                    ➕ Catat Kehadiran Guru
                  </button>
                  <button v-if="!getHolidayForDate(selectedDate).isCustom" class="btn-action-danger" style="width: 100%;" @click="dismissNationalHoliday(selectedDate)">
                    🗑️ Hapus Libur Nasional Ini
                  </button>
                </div>
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

                  <div v-if="isAdmin && !isWeekend(selectedDate)"
                    class="mt-2 text-center">
                    <button class="btn-action-secondary mx-auto" @click="
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
                  v-if="!getTeacherAttendanceForDate(selectedDate) && isAdmin && !isWeekend(selectedDate)"
                  class="mt-3 text-center">
                  <button class="btn-action-primary mx-auto" @click="openAddModal(selectedDate, selectedTeacherId)"
                    :disabled="loading">
                    + Input Absensi
                  </button>
                </div>
              </div>
            </template>
          </div>
          </div>
          </Teleport>
      </div>
    </div>

    <!-- Per-teacher recap: one row per teacher, columns line up, total at the bottom -->
    <section v-if="!loading" class="ta-teachers" aria-labelledby="ta-teachers-title">
      <div class="ta-teachers-head">
        <h2 id="ta-teachers-title">Rekap per guru</h2>
        <span class="ta-teachers-month">{{ selectedMonthLabel }}</span>
      </div>

      <p v-if="!teachersWithStats.length" class="ta-empty">Belum ada guru untuk ditampilkan.</p>

      <table v-else class="ta-table">
        <thead>
          <tr>
            <th scope="col">Guru</th>
            <th scope="col" class="ta-col-bar"><span class="sr-only">Perbandingan </span>Kehadiran</th>
            <th scope="col" class="ta-num">Hadir</th>
            <th scope="col" class="ta-num">Tidak hadir</th>
            <th scope="col" class="ta-num">Gaji</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="teacher in teachersWithStats" :key="teacher.id">
            <th scope="row" class="ta-who">
              <span class="ta-who-inner">
                <span class="ta-avatar" :style="{ background: getTeacherColor(teacher.displayName) }" aria-hidden="true">
                  {{ getInitials(teacher.displayName) }}
                </span>
                <span class="ta-who-text">
                  <strong>{{ teacher.displayName }}</strong>
                  <span>{{ teacher.position || "Pengajar" }}</span>
                </span>
              </span>
            </th>
            <td class="ta-col-bar" aria-hidden="true">
              <span class="ta-bar" :title="`${teacher.hadirCount} hadir, ${teacher.tidakHadirCount} tidak hadir`">
                <span class="ta-bar-hadir" :style="{ flexGrow: teacher.hadirCount }"></span>
                <span class="ta-bar-tidak" :style="{ flexGrow: teacher.tidakHadirCount }"></span>
              </span>
            </td>
            <td class="ta-num ta-hadir" data-label="Hadir">{{ teacher.hadirCount }}</td>
            <td class="ta-num" :class="{ 'ta-tidak': teacher.tidakHadirCount > 0 }" data-label="Tidak hadir">{{ teacher.tidakHadirCount }}</td>
            <td class="ta-num ta-pay" data-label="Gaji">Rp {{ formatCurrency(teacher.hadirCount * 10000) }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" class="ta-who">Total {{ teachersWithStats.length }} guru</th>
            <td class="ta-col-bar" aria-hidden="true"></td>
            <td class="ta-num ta-hadir" data-label="Hadir">{{ totalAttendance }}</td>
            <td class="ta-num" data-label="Tidak hadir">{{ totalTidakHadir }}</td>
            <td class="ta-num ta-pay" data-label="Gaji">Rp {{ formatCurrency(totalSalary) }}</td>
          </tr>
        </tfoot>
      </table>
    </section>

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
              <LineIcon name="check" :size="17" :stroke="2.6" /> Hadir
            </button>
            <button class="status-btn" :class="{
              active: form.status === 'tidak_hadir',
              tidak: form.status === 'tidak_hadir',
            }" @click="form.status = 'tidak_hadir'">
              <LineIcon name="x" :size="17" :stroke="2.6" /> Tidak hadir
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

    <!-- Quick Settings Modal -->
      <div v-if="showQuickSettingsModal" class="modal-overlay" @click.self="closeQuickSettingsModal">
        <div class="modal glass-card quick-settings-modal">
        <h3>Pengaturan link absensi WA</h3>

        <PageSkeleton v-if="quickSettingsLoading" variant="inline" :rows="3" label="Memuat pengaturan" />

        <template v-else>
          <div class="settings-info-box">
            <strong>Pengaturan ini berlaku sejak disimpan.</strong>
            <span>Link lama yang dibuat sebelum pengaturan terakhir disimpan akan otomatis tidak berlaku.</span>
          </div>

          <div class="form-group">
            <label class="form-label">Mode Expired</label>
            <select v-model="quickSettingsForm.mode" class="form-input form-select">
              <option value="end_of_day">Sampai 23.59 WIB</option>
              <option value="minutes">Durasi menit setelah dikirim</option>
              <option value="custom_time">Sampai jam tertentu</option>
            </select>
          </div>

          <div v-if="quickSettingsForm.mode === 'minutes'" class="form-group">
            <label class="form-label">Durasi Aktif (menit)</label>
            <input v-model.number="quickSettingsForm.minutes" type="number" min="1" max="1440" class="form-input" />
          </div>

          <div v-if="quickSettingsForm.mode === 'custom_time'" class="form-group">
            <label class="form-label">Jam Expired (WIB)</label>
            <input v-model="quickSettingsForm.expiresAtTime" type="time" class="form-input" />
          </div>

          <div class="settings-preview">
            {{ quickSettingsPreview }}
          </div>

          <div class="modal-actions">
            <button class="btn btn-secondary" @click="closeQuickSettingsModal">
              Batal
            </button>
            <button class="btn btn-primary" @click="saveQuickSettings" :disabled="savingQuickSettings">
              {{ savingQuickSettings ? "Menyimpan..." : "Simpan" }}
            </button>
          </div>
        </template>
        </div>
      </div>

    <!-- Holiday Management Modal -->
      <div v-if="showHolidayModal" class="modal-overlay" @click.self="closeHolidayModal">
        <div class="modal glass-card holiday-modal">
        <div class="holiday-modal-header">
          <h3>Kelola hari libur</h3>
          <button type="button" class="close-btn ta-close" aria-label="Tutup" @click="closeHolidayModal">
            <LineIcon name="x" :size="18" :stroke="2.4" />
          </button>
        </div>

        <!-- Add Holiday Form -->
        <div class="holiday-form">
          <h4>Tambah Hari Libur</h4>
          <div class="form-group">
            <label class="form-label">Tanggal Mulai</label>
            <input v-model="holidayForm.startDate" type="date" class="form-input" :min="holidayMinDate"
              :max="holidayMaxDate" />
          </div>
          <div class="form-group">
            <label class="form-label">Tanggal Selesai (opsional, untuk range)</label>
            <input v-model="holidayForm.endDate" type="date" class="form-input" :min="holidayMinDate"
              :max="holidayMaxDate" />
          </div>
          <div class="form-group">
            <label class="form-label">Keterangan Libur</label>
            <input v-model="holidayForm.name" type="text" class="form-input"
              placeholder="Contoh: Libur Semester Genap, Cuti Bersama Idul Fitri" />
          </div>
          <button class="btn btn-primary" @click="saveHoliday" :disabled="savingHoliday" style="width: 100%">
            {{ savingHoliday ? 'Menyimpan…' : 'Tambah hari libur' }}
          </button>
        </div>

        <!-- Existing Custom Holidays List -->
        <div class="holiday-list">
          <h4>Hari Libur Custom Bulan Ini ({{ monthNames[currentMonth] }} {{ currentYear }})</h4>
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

        <!-- Dismissed National Holidays List -->
        <div class="holiday-list" v-if="dismissedHolidaysForMonth.length > 0">
          <h4>🚫 Libur Nasional yang Dihapus</h4>
          <div class="holiday-items">
            <div v-for="d in dismissedHolidaysForMonth" :key="d.id" class="holiday-item dismissed-item">
              <div class="holiday-item-info">
                <span class="holiday-item-date">{{ formatHolidayDate(d.date) }}</span>
                <span class="holiday-item-name" style="text-decoration: line-through; opacity: 0.7">{{ d.originalName }}</span>
              </div>
              <button class="btn-restore-holiday" @click="restoreDismissedHoliday(d.date)" title="Kembalikan libur nasional">
                ♻️ Restore
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Reset Testing Modal -->
    <Teleport to="body">
      <div v-if="showResetTestingModal" class="modal-overlay" @click.self="closeResetTestingModal">
        <div class="modal glass-card reset-testing-modal-card">
          <div class="reset-modal-header">
            <div class="reset-header-icon">
              <LineIcon name="refresh" :size="22" />
            </div>
            <div>
              <h3 class="modal-title">Reset Sesi KBM & Absen (Testing Tool)</h3>
              <p class="modal-subtitle">Bersihkan data testing tanpa perlu menghapus manual di Firebase Console</p>
            </div>
          </div>

          <div class="reset-modal-body">
            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label font-semibold">Pilih Guru:</label>
                <select v-model="resetForm.guruId" class="form-input form-select" @change="fetchResetPreview" :disabled="resetSubmitting">
                  <option value="" disabled>-- Pilih Guru --</option>
                  <option v-for="t in teachers" :key="t.id" :value="t.id">
                    {{ t.displayName }}
                  </option>
                </select>
              </div>

              <div class="form-group flex-1">
                <label class="form-label font-semibold">Pilih Tanggal:</label>
                <input
                  v-model="resetForm.date"
                  type="date"
                  class="form-input"
                  @change="fetchResetPreview"
                  :disabled="resetSubmitting"
                />
              </div>
            </div>

            <!-- Preview Data Section -->
            <div class="preview-section mt-3">
              <PageSkeleton v-if="resetPreviewLoading" variant="inline" :rows="3" label="Memeriksa data di tanggal ini" />

              <div v-else-if="!resetPreviewData" class="preview-hint">
                Pilih guru dan tanggal untuk memeriksa data sesi dan absensi.
              </div>

              <div v-else class="preview-result">
                <div v-if="hasDataToReset" class="preview-found-box">
                  <div class="preview-found-title">
                    <span>🔍 Data Ditemukan di Database:</span>
                  </div>

                  <ul class="preview-items-list">
                    <li v-if="resetPreviewData.sessions && resetPreviewData.sessions.length > 0" class="preview-item">
                      <span class="preview-icon">📚</span>
                      <div>
                        <strong>{{ resetPreviewData.sessions.length }} Sesi KBM di teaching_sessions:</strong>
                        <div class="text-xs text-gray-600 mt-1">
                          <span v-for="s in resetPreviewData.sessions" :key="s.id" class="badge-session mr-1">
                            {{ s.className }} ({{ s.slotName || (String(s.slotId).includes('2') || String(s.slotId).includes('malam') ? 'Sesi Malam' : 'Sesi Sore') }}) — {{ s.activityName }}
                          </span>
                        </div>
                      </div>
                    </li>
                    <li v-else class="preview-item text-gray-400">
                      <span class="preview-icon">⚪</span>
                      <span>Tidak ada sesi di <code>teaching_sessions</code></span>
                    </li>

                    <li v-if="resetPreviewData.studentAttendanceCount > 0" class="preview-item">
                      <span class="preview-icon">👦</span>
                      <span><strong>{{ resetPreviewData.studentAttendanceCount }}</strong> presensi santri di <code>attendance</code></span>
                    </li>
                    <li v-else class="preview-item text-gray-400">
                      <span class="preview-icon">⚪</span>
                      <span>Tidak ada presensi santri</span>
                    </li>

                    <li v-if="resetPreviewData.teacherAttendance" class="preview-item">
                      <span class="preview-icon">👨‍🏫</span>
                      <span>Absen Guru: Status <strong>{{ resetPreviewData.teacherAttendance.status.toUpperCase() }}</strong></span>
                    </li>
                    <li v-else class="preview-item text-gray-400">
                      <span class="preview-icon">⚪</span>
                      <span>Absen guru belum tercatat / sudah terhapus</span>
                    </li>

                    <li v-if="resetPreviewData.quickLinksCount > 0" class="preview-item">
                      <span class="preview-icon">🔗</span>
                      <span><strong>{{ resetPreviewData.quickLinksCount }}</strong> token link WhatsApp di <code>attendance_quick_links</code></span>
                    </li>
                  </ul>

                  <!-- Checkboxes for Options -->
                  <div class="reset-options-box mt-3">
                    <div class="options-title font-semibold mb-2">Pilihan yang akan dibersihkan:</div>
                    <label class="checkbox-label">
                      <input type="checkbox" v-model="resetForm.resetTeachingSessions" :disabled="resetSubmitting" />
                      <span>Hapus Sesi Mengajar & Jurnal (teaching_sessions)</span>
                    </label>
                    <label class="checkbox-label">
                      <input type="checkbox" v-model="resetForm.resetStudentAttendance" :disabled="resetSubmitting" />
                      <span>Hapus Presensi Santri Terkait</span>
                    </label>
                    <label class="checkbox-label">
                      <input type="checkbox" v-model="resetForm.resetTeacherAttendance" :disabled="resetSubmitting" />
                      <span>Hapus Absensi Guru</span>
                    </label>
                    <label class="checkbox-label">
                      <input type="checkbox" v-model="resetForm.resetQuickLinks" :disabled="resetSubmitting" />
                      <span>Reset / Hapus Token Link WhatsApp</span>
                    </label>
                  </div>
                </div>

                <div v-else class="preview-empty-box">
                  <span>✅ Bersih! Tidak ada data KBM, absensi, atau link WA pada tanggal ini. Guru dapat mulai testing dari awal.</span>
                </div>
              </div>
            </div>

            <div class="reset-notice-box mt-3">
              <span class="notice-icon">💡</span>
              <span class="notice-text">
                Fitur ini khusus mempermudah testing. Sekali klik, data KBM & absensi pada tanggal tersebut terhapus bersih dan Anda bisa langsung tes alur link WA kembali.
              </span>
            </div>
          </div>

          <div class="modal-actions mt-4">
            <button type="button" class="btn btn-secondary" :disabled="resetSubmitting" @click="closeResetTestingModal">
              Tutup
            </button>
            <button
              type="button"
              class="btn btn-danger btn-reset-action"
              :disabled="resetSubmitting || !hasDataToReset || resetPreviewLoading"
              @click="submitResetTesting"
            >
              <span v-if="resetSubmitting">Sedang Mereset...</span>
              <span v-else>🗑️ Reset Data Terpilih</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import api from "@/services/api";
import { useToast } from "@/composables/useToast";
import { useDialog } from "@/composables/useDialog";
import {
  fetchHolidays,
  isTodayHoliday,
  isTomorrowHoliday,
  getHolidaysForMonth,
} from "@/services/holidayService";
import { loadPdfLibs } from "@/utils/pdf";
import { loadExcelLib, downloadWorkbook } from "@/utils/excel";
import { buildAttendanceWorkbook, attendanceFilename } from "@/utils/excelExports";
import { prefetchWhenIdle } from "@/utils/prefetch";
import PageSkeleton from "@/components/PageSkeleton.vue";
import LineIcon from "@/components/LineIcon.vue";
import { useAuthStore } from "@/stores/auth";

const { success, error: showError, warning } = useToast();
const { ask } = useDialog();
const authStore = useAuthStore();

const isAdmin = computed(() => authStore.isAdmin);
const canViewFutureCalendar = computed(() => {
  const permissions = authStore.user?.permissions?.features || [];
  return isAdmin.value || permissions.includes("admin-attendance-view");
});

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
const loadingHolidays = ref(true);

// Custom holidays state
const customHolidays = ref([]);
const showHolidayModal = ref(false);
const savingHoliday = ref(false);
const holidayForm = ref({
  startDate: "",
  endDate: "",
  name: "",
});

// WhatsApp one-click attendance link settings
const showQuickSettingsModal = ref(false);
const quickSettingsLoading = ref(false);
const savingQuickSettings = ref(false);
const quickSettingsForm = ref({
  mode: "end_of_day",
  minutes: 5,
  expiresAtTime: "23:59",
});

// Dismissed national holidays state
const dismissedHolidays = ref([]);

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
    const records = attendanceData.value.filter((a) => a.guruId === t.id && a.type !== "student_attendance");
    const uniqueDays = new Map();
    records.forEach((a) => {
      const d = parseDate(a.date);
      if (d) {
        const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        if (!uniqueDays.has(dayKey) || a.status === "hadir") {
          uniqueDays.set(dayKey, a);
        }
      }
    });
    const uniqueRecords = Array.from(uniqueDays.values());
    const hadirCount = uniqueRecords.filter((a) => a.status === "hadir").length;
    const tidakHadirCount = uniqueRecords.filter((a) => a.status !== "hadir").length;
    return { ...t, hadirCount, tidakHadirCount };
  });
});

// Modal state
const showModal = ref(false);
const saving = ref(false);
const exporting = ref(false);
const exportingExcel = ref(false);

// Reset Testing Modal state
const showResetTestingModal = ref(false);
const resetPreviewLoading = ref(false);
const resetPreviewData = ref(null);
const resetSubmitting = ref(false);
const resetForm = ref({
  guruId: "",
  date: new Date().toLocaleDateString("sv-SE"),
  resetTeachingSessions: true,
  resetStudentAttendance: true,
  resetTeacherAttendance: true,
  resetQuickLinks: true,
});

const hasDataToReset = computed(() => {
  if (!resetPreviewData.value) return false;
  const p = resetPreviewData.value;
  return (
    (p.sessions && p.sessions.length > 0) ||
    p.studentAttendanceCount > 0 ||
    !!p.teacherAttendance ||
    p.quickLinksCount > 0
  );
});

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
  const maxDate = getMaxCalendarDate();

  for (let year = startYear; year <= maxDate.getFullYear(); year++) {
    const monthStart = year === startYear ? startMonth : 0;
    const monthEnd = year === maxDate.getFullYear() ? maxDate.getMonth() : 11;

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

const totalTidakHadir = computed(() => teachersWithStats.value.reduce((sum, t) => sum + t.tidakHadirCount, 0));
const selectedMonthLabel = computed(() => availableMonths.value.find((m) => m.value === selectedMonth.value)?.label || "");

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

const quickSettingsPreview = computed(() => {
  if (quickSettingsForm.value.mode === "minutes") {
    return `Link WA akan aktif selama ${quickSettingsForm.value.minutes || 0} menit setelah dikirim.`;
  }

  if (quickSettingsForm.value.mode === "custom_time") {
    return `Link WA akan aktif sampai pukul ${quickSettingsForm.value.expiresAtTime || "--:--"} WIB pada hari pengiriman.`;
  }

  return "Link WA akan aktif sampai pukul 23.59 WIB pada hari pengiriman.";
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

// Computed: dismissed national holidays filtered for current month
const dismissedHolidaysForMonth = computed(() => {
  const m = currentMonth.value + 1;
  const y = currentYear.value;
  return dismissedHolidays.value.filter(d => {
    const [dy, dm] = d.date.split('-').map(Number);
    return dy === y && dm === m;
  });
});

// Calendar computed
const isCurrentMonth = computed(() => {
  return (
    currentMonth.value === today.getMonth() &&
    currentYear.value === today.getFullYear()
  );
});

const getMaxCalendarDate = () => {
  const maxDate = new Date(today.getFullYear(), today.getMonth(), 1);
  if (canViewFutureCalendar.value) {
    maxDate.setMonth(maxDate.getMonth() + 12);
  }
  return maxDate;
};

const isLastAllowedMonth = computed(() => {
  const maxDate = getMaxCalendarDate();
  return (
    currentYear.value === maxDate.getFullYear() &&
    currentMonth.value === maxDate.getMonth()
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
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
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
  "#168058", // Green
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
  if (name.toLowerCase().includes("riski")) return "#000000";
  return teacherColorMap.value[name] || palette[0];
};

// Calendar functions
const getHolidayForDate = (date) => {
  return monthHolidays.value.find((h) => h.date === date);
};

const updateMonthHolidays = () => {
  // Merge national holidays with custom holidays, excluding dismissed national holidays
  const national = getHolidaysForMonth(
    currentMonth.value,
    currentYear.value,
    holidays.value,
  );
  
  // Filter out dismissed national holidays
  const dismissedDates = new Set(dismissedHolidaysForMonth.value.map(d => {
    return parseInt(d.date.split('-')[2]);
  }));
  const filteredNational = national.filter(h => !dismissedDates.has(h.date));
  
  const custom = customHolidaysForMonth.value.map(h => ({
    date: parseInt(h.date.split('-')[2]),
    name: h.name,
    isCustom: true,
  }));
  // Merge, avoiding duplicates by date
  const merged = [...filteredNational];
  for (const ch of custom) {
    if (!merged.some(m => m.date === ch.date)) {
      merged.push(ch);
    }
  }
  monthHolidays.value = merged;
};

const getAttendanceForDate = (date) => {
  return attendanceData.value.filter((a) => {
    if (a.type === "student_attendance") return false;
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

  const seenGurus = new Set();
  const uniquePresent = presentAttendance.filter((a) => {
    if (seenGurus.has(a.guruId)) return false;
    seenGurus.add(a.guruId);
    return true;
  });

  return uniquePresent.map((a) => {
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
    if (a.type === "student_attendance") return false;
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

// A weekday up to today that is not a holiday: attendance was expected that day.
const isExpectedDay = (date) => {
  const d = new Date(currentYear.value, currentMonth.value, date);
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return d <= end && !isWeekend(date) && !getHolidayForDate(date);
};

// One state per day, same look as the guru calendar (and the KBM calendar).
const getCellClass = (date) => {
  const classes = [];
  const off = !isExpectedDay(date);
  if (selectedTeacherId.value === "all") {
    if (getPresentTeachersForDate(date).length > 0) classes.push("has-attendance");
    else if (off) classes.push("is-off");
  } else {
    const attendance = getTeacherAttendanceForDate(date);
    if (attendance) classes.push(attendance.status === "hadir" ? "is-hadir" : "is-tidak");
    else if (off) classes.push("is-off");
  }
  if (getHolidayForDate(date)) classes.push("is-libur");
  if (currentYear.value === today.getFullYear() && currentMonth.value === today.getMonth() && date === today.getDate()) classes.push("is-today");
  if (selectedDate.value === date) classes.push("is-selected");
  return classes;
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
  fetchData();
};

const nextMonth = () => {
  if (isLastAllowedMonth.value) return;
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
  // Update selectedMonth to sync with calendar
  selectedMonth.value = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, "0")}`;
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

    const [holidayList, { data: guruData }, { data: attData }] = await Promise.all([
      fetchHolidays(year),
      api.get("/users?role=guru"),
      api.get("/attendance", { params: { month, year } }),
      // Custom and dismissed holidays for the selected month
      fetchCustomHolidays(),
      fetchDismissedHolidays(),
    ]);

    holidays.value = holidayList;
    teachers.value = guruData.sort((a, b) =>
      a.displayName.localeCompare(b.displayName),
    );
    assignTeacherColors(teachers.value);
    attendanceData.value = (attData || []).filter(a => a.type !== 'student_attendance');
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

// Reset Testing Methods
const openResetTestingModal = (dateStr = null, guruId = null) => {
  dropdownOpen.value = false;
  resetForm.value.guruId = guruId || (teachers.value.length > 0 ? teachers.value[0].id : "");
  resetForm.value.date = dateStr || new Date().toLocaleDateString("sv-SE");
  resetForm.value.resetTeachingSessions = true;
  resetForm.value.resetStudentAttendance = true;
  resetForm.value.resetTeacherAttendance = true;
  resetForm.value.resetQuickLinks = true;
  showResetTestingModal.value = true;
  fetchResetPreview();
};

const closeResetTestingModal = () => {
  showResetTestingModal.value = false;
  resetPreviewData.value = null;
};

const fetchResetPreview = async () => {
  if (!resetForm.value.guruId || !resetForm.value.date) {
    resetPreviewData.value = null;
    return;
  }
  resetPreviewLoading.value = true;
  try {
    const res = await api.get("/teaching_sessions/admin/check-reset-data", {
      params: {
        guruId: resetForm.value.guruId,
        date: resetForm.value.date,
      },
    });
    resetPreviewData.value = res.data;
  } catch (err) {
    console.error("Fetch reset preview error:", err);
    resetPreviewData.value = null;
  } finally {
    resetPreviewLoading.value = false;
  }
};

const submitResetTesting = async () => {
  if (!resetForm.value.guruId || !resetForm.value.date || resetSubmitting.value || !hasDataToReset.value) return;

  const teacher = teachers.value.find((t) => t.id === resetForm.value.guruId);
  const teacherName = teacher?.displayName || "Guru";
  const [y, m, d] = resetForm.value.date.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  const formattedDate = dateObj.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const okReset = await ask({
    title: "Reset data testing?",
    message: `Data ${teacherName} pada ${formattedDate} dihapus: sesi KBM, presensi santri, absen guru, dan link WA yang dipilih.`,
    tone: "danger",
    confirmText: "Reset data",
  });
  if (!okReset) return;

  resetSubmitting.value = true;
  try {
    const res = await api.post("/teaching_sessions/admin/reset-session", {
      guruId: resetForm.value.guruId,
      date: resetForm.value.date,
      options: {
        resetTeachingSessions: resetForm.value.resetTeachingSessions,
        resetStudentAttendance: resetForm.value.resetStudentAttendance,
        resetTeacherAttendance: resetForm.value.resetTeacherAttendance,
        resetQuickLinks: resetForm.value.resetQuickLinks,
      },
    });

    success(res.data.message || "Data testing berhasil direset!");

    // Instantly update the preview so the UI flips to "Bersih" immediately
    await fetchResetPreview();

    // Refresh calendar in background
    await fetchData();

    // Close modal automatically after 1 second
    setTimeout(() => {
      showResetTestingModal.value = false;
      resetPreviewData.value = null;
    }, 1000);
  } catch (err) {
    console.error("Submit reset error:", err);
    showError(err.response?.data?.error || "Gagal mereset data sesi testing.");
  } finally {
    resetSubmitting.value = false;
  }
};

const onGuruChange = () => {
  const t = teachers.value.find((t) => t.id === form.value.guruId);
  form.value.guruName = t?.displayName || "";
};

const fetchQuickSettings = async () => {
  quickSettingsLoading.value = true;
  try {
    const { data } = await api.get("/attendance/quick-settings");
    quickSettingsForm.value = {
      mode: data.mode || "end_of_day",
      minutes: data.minutes || 5,
      expiresAtTime: data.expiresAtTime || "23:59",
    };
  } catch (e) {
    console.error("Fetch quick attendance settings error:", e);
    showError(e.response?.data?.error || "Gagal memuat pengaturan link WA");
  } finally {
    quickSettingsLoading.value = false;
  }
};

const openQuickSettingsModal = async () => {
  dropdownOpen.value = false;
  showQuickSettingsModal.value = true;
  await fetchQuickSettings();
};

const closeQuickSettingsModal = () => {
  showQuickSettingsModal.value = false;
};

const saveQuickSettings = async () => {
  if (quickSettingsForm.value.mode === "minutes") {
    const minutes = Number(quickSettingsForm.value.minutes);
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 1440) {
      warning("Durasi menit harus di antara 1 sampai 1440");
      return;
    }
  }

  if (quickSettingsForm.value.mode === "custom_time" && !quickSettingsForm.value.expiresAtTime) {
    warning("Jam expired wajib diisi");
    return;
  }

  savingQuickSettings.value = true;
  try {
    const payload = {
      mode: quickSettingsForm.value.mode,
      minutes: Number(quickSettingsForm.value.minutes) || 5,
      expiresAtTime: quickSettingsForm.value.expiresAtTime || "23:59",
    };
    await api.put("/attendance/quick-settings", payload);
    success("Pengaturan link absensi WA berhasil disimpan");
    closeQuickSettingsModal();
  } catch (e) {
    console.error("Save quick attendance settings error:", e);
    showError(e.response?.data?.error || "Gagal menyimpan pengaturan link WA");
  } finally {
    savingQuickSettings.value = false;
  }
};

// Export to PDF
const exportToPDF = async () => {
  dropdownOpen.value = false;

  if (teachersWithStats.value.length === 0) {
    warning("Tidak ada data untuk di-export");
    return;
  }

  exporting.value = true;

  try {
    const { jsPDF, autoTable } = await loadPdfLibs();
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

// Export to Excel: the same numbers as the PDF, plus a per-day grid for the month.
const exportToExcel = async () => {
  dropdownOpen.value = false;

  if (teachersWithStats.value.length === 0) {
    warning("Tidak ada data untuk di-export");
    return;
  }

  exportingExcel.value = true;
  try {
    const ExcelJS = await loadExcelLib();
    const period = selectedMonth.value;
    const toKey = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const records = [];
    for (const a of attendanceData.value) {
      if (a.type === "student_attendance") continue;
      const d = parseDate(a.date);
      if (d) records.push({ guruId: a.guruId, date: toKey(d), status: a.status });
    }

    const workbook = buildAttendanceWorkbook(ExcelJS, {
      period,
      teachers: teachersWithStats.value.map((t) => ({
        id: t.id,
        name: t.displayName,
        hadirCount: t.hadirCount,
        tidakHadirCount: t.tidakHadirCount,
      })),
      records: records.filter((r) => r.date.startsWith(period)),
      holidays: monthHolidays.value.map((h) => ({
        date: `${period}-${String(h.date).padStart(2, "0")}`,
        name: h.name,
      })),
      exportedAt: new Date(),
    });

    const filename = attendanceFilename({ period });
    await downloadWorkbook(workbook, filename);
    success(`Berhasil mengunduh ${filename}`);
  } catch (e) {
    console.error("Export Excel error:", e);
    showError("Gagal mengexport Excel");
  } finally {
    exportingExcel.value = false;
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

// Dismissed national holidays functions
const fetchDismissedHolidays = async () => {
  try {
    const { data } = await api.get('/holidays/dismissed', {
      params: { month: currentMonth.value + 1, year: currentYear.value }
    });
    dismissedHolidays.value = data;
    updateMonthHolidays();
  } catch (e) {
    console.error('Fetch dismissed holidays error:', e);
  }
};

const dismissNationalHoliday = async (date) => {
  const holiday = getHolidayForDate(date);
  if (!holiday || holiday.isCustom) return;

  const fullDate = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
  const okDismiss = await ask({
    title: "Hapus libur nasional?",
    message: `"${holiday.name}" pada ${formatFullDate(date)} dihapus. Hari ini dianggap hari kerja biasa.`,
    tone: "danger",
    confirmText: "Hapus libur",
  });
  if (!okDismiss) return;

  try {
    await api.post('/holidays/dismiss-national', {
      date: fullDate,
      originalName: holiday.name,
    });
    success('Libur nasional berhasil dihapus');
    selectedDate.value = null;
    await fetchDismissedHolidays();
  } catch (e) {
    console.error('Dismiss national holiday error:', e);
    showError(e.response?.data?.error || 'Gagal menghapus libur nasional');
  }
};

const restoreDismissedHoliday = async (dateStr) => {
  if (!(await ask({ title: "Kembalikan libur nasional?", message: "Hari ini kembali dihitung sebagai hari libur.", confirmText: "Kembalikan" }))) return;
  try {
    await api.delete(`/holidays/dismiss-national/${dateStr}`);
    success('Libur nasional berhasil dikembalikan');
    await fetchDismissedHolidays();
  } catch (e) {
    console.error('Restore dismissed holiday error:', e);
    showError('Gagal mengembalikan libur nasional');
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

// Computed for holiday modal date limits
const holidayMinDate = computed(() => {
  const m = String(currentMonth.value + 1).padStart(2, '0');
  const y = currentYear.value;
  return `${y}-${m}-01`;
});

const holidayMaxDate = computed(() => {
  const m = String(currentMonth.value + 1).padStart(2, '0');
  const y = currentYear.value;
  const lastDay = new Date(y, currentMonth.value + 1, 0).getDate();
  return `${y}-${m}-${lastDay}`;
});

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
  if (!(await ask({ title: "Hapus hari libur?", message: "Hari ini kembali dihitung sebagai hari kerja.", tone: "danger", confirmText: "Hapus" }))) return;
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
  prefetchWhenIdle([loadPdfLibs]);

  loadingHolidays.value = true;
  await fetchData();
  
  loadingHolidays.value = false;
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
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--primary-dark);
  margin-bottom: 4px;
}

.page-header p {
  color: var(--gray-600);
  font-size: 0.95rem;
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

.header-actions > :not(:first-child) {
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
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  color: #fcd34d;
  background: linear-gradient(145deg, #053d2c, #03261a);
  box-shadow: inset 0 0 0 1px rgba(252, 211, 77, 0.28);
}

.summary-card.highlight .summary-icon {
  color: #053d2c;
  background: linear-gradient(145deg, #fde68a, #fcd34d);
  box-shadow: inset 0 0 0 1px rgba(180, 83, 9, 0.25);
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

.ta-day-sheet .mini-avatar {
  margin: 0 !important;
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
  color: #0f6b4a;
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
  color: #0f6b4a;
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

.holiday-alert-name {
  font-size: 1.1rem;
  font-weight: 600;
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

.quick-settings-modal {
  max-width: 520px;
}

.settings-info-box,
.settings-preview {
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-md);
}

.settings-info-box {
  display: grid;
  gap: 4px;
  color: var(--primary-dark);
  background: rgba(76, 175, 80, 0.12);
  border: 1px solid rgba(76, 175, 80, 0.24);
}

.settings-info-box span {
  color: var(--gray-600);
  font-size: 0.9rem;
}

.settings-preview {
  color: #1565c0;
  background: rgba(33, 150, 243, 0.1);
  border: 1px solid rgba(33, 150, 243, 0.22);
  font-size: 0.95rem;
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
  color: #168058;
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

  .mini-avatar {
    width: 14px;
    height: 14px;
    font-size: 0.4rem;
  }

  .more-indicator {
    font-size: 0.45rem;
    margin-top: 0;
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

@media (max-width: 640px) {

  .mini-avatar {
    width: 10px;
    /* Smaller avatars */
    height: 10px;
    font-size: 0.3rem;
  }
}

@media (max-width: 430px) {
  .header-actions select {
    flex: 1 !important;
  }

  .mini-avatar {
    width: 8px !important;
    /* Smaller avatars */
    height: 8px !important;
    font-size: 0.2rem !important;
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
/* Custom Action Buttons */
.btn-action-primary {
  background: linear-gradient(135deg, #4caf50, #43a047);
  color: white;
  padding: 8px 24px;
  border-radius: 9999px;
  font-weight: 600;
  border: none;
  box-shadow: 0 4px 6px -1px rgba(76, 175, 80, 0.3), 0 2px 4px -1px rgba(76, 175, 80, 0.1);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.9rem;
  letter-spacing: 0.3px;
}

.btn-action-primary:hover {
  background: linear-gradient(135deg, #43a047, #168058);
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(76, 175, 80, 0.4), 0 4px 6px -2px rgba(76, 175, 80, 0.2);
}

.btn-action-secondary {
  background: white;
  color: #4b5563;
  padding: 8px 24px;
  border-radius: 9999px;
  font-weight: 600;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.9rem;
  letter-spacing: 0.3px;
}

.btn-action-secondary:hover {
  border-color: #d1d5db;
  color: #1f2937;
  background: #f9fafb;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.btn-action-danger {
  background: linear-gradient(135deg, #ef5350, #e53935);
  color: white;
  padding: 8px 24px;
  border-radius: 9999px;
  font-weight: 600;
  border: none;
  box-shadow: 0 4px 6px -1px rgba(239, 83, 80, 0.3), 0 2px 4px -1px rgba(239, 83, 80, 0.1);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.9rem;
  letter-spacing: 0.3px;
  cursor: pointer;
}

.btn-action-danger:hover {
  background: linear-gradient(135deg, #e53935, #d32f2f);
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(239, 83, 80, 0.4), 0 4px 6px -2px rgba(239, 83, 80, 0.2);
}

.btn-restore-holiday {
  background: linear-gradient(135deg, #66bb6a, #43a047);
  color: white;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-weight: 600;
  border: none;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-restore-holiday:hover {
  background: linear-gradient(135deg, #43a047, #168058);
  transform: translateY(-1px);
}

.dismissed-item {
  background: rgba(239, 83, 80, 0.05);
  border: 1px dashed rgba(239, 83, 80, 0.3);
}

@media (max-width: 768px) {
  .admin-attendance-view {
    padding-top: 56px;
  }

  .summary-content {

    align-items: center;
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
    width: 40px;
    height: 40px;
    border-radius: 11px;
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

  .mini-avatar {
    width: 12px;
    height: 12px;
    font-size: 0.35rem;
  }

  .more-indicator {
    font-size: 0.5rem;
  }

  .popup-header h4 {
    font-size: 0.9rem;
  }

  .teacher-list-popup {

    padding: 0 var(--space-sm);
  }

  .popup-teacher-item {
    font-size: 0.8rem;
    padding: 4px 6px;
  }

  /* Modals */
  .modal {
    max-width: 100%;
    padding: var(--space-lg);
  }

  .modal h3 {
    font-size: 1.1rem;
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
    width: 34px;
    height: 34px;
    border-radius: 10px;
  }

  .summary-value {
    font-size: 0.95rem;
  }

  .summary-label {
    font-size: 0.65rem;
  }

  .mini-avatar {
    width: 8px;
    /* Smaller avatars */
    height: 8px;
    font-size: 0.2rem;
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

/* --- Reset Testing Modal Styles --- */
.reset-testing-modal-card {
  max-width: 540px;
  width: 95%;
  padding: 1.75rem;
  border-radius: 18px;
  background: white;
  box-shadow: 0 25px 35px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.reset-modal-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 1.25rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid var(--gray-200, #e5e7eb);
}

.reset-header-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: #fef2f2;
  color: #dc2626;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.form-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.preview-section {
  border-radius: 12px;
  background: #f9fafb;
  border: 1px solid var(--gray-200, #e5e7eb);
  padding: 1rem;
}

.preview-hint {
  color: var(--gray-500, #6b7280);
  font-size: 0.85rem;
  text-align: center;
  padding: 0.5rem;
}

.preview-found-title {
  font-weight: 700;
  font-size: 0.9rem;
  color: #b91c1c;
  margin-bottom: 0.75rem;
}

.preview-items-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  font-size: 0.88rem;
}

.preview-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: var(--gray-800, #1f2937);
}

.badge-session {
  display: inline-block;
  background: #e0f2fe;
  color: #0369a1;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.preview-empty-box {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
  padding: 0.85rem;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 500;
}

.reset-options-box {
  background: white;
  border: 1px solid var(--gray-200, #e5e7eb);
  border-radius: 8px;
  padding: 0.75rem 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  margin-bottom: 0.4rem;
  cursor: pointer;
  color: var(--gray-700, #374151);
}

.reset-notice-box {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 0.8rem;
  color: #92400e;
}

.dropdown-item-danger {
  color: #dc2626 !important;
}

.dropdown-item-danger:hover {
  background: #fef2f2 !important;
}

.btn-danger {
  background: #dc2626;
  color: white;
  border: none;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ================================================================ admin attendance: actions, notice, per-teacher recap */
.dropdown-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.dropdown-item {
  display: flex !important;
  align-items: center;
  gap: 10px;
  min-height: 44px;
}

.dropdown-item svg {
  flex: none;
  color: #0a5c40;
}

.dropdown-item-danger svg {
  color: #b42318;
}

.btn-export {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.ta-notice {
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

.ta-notice-icon {
  flex: none;
  width: 38px;
  height: 38px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  background: #fcd34d;
  color: #4a2c05;
}

.ta-notice-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  font-size: 0.85rem;
}

.ta-notice-text strong {
  font-size: 0.9rem;
}

.ta-close {
  width: 44px;
  height: 44px;
  display: grid !important;
  place-items: center;
  border-radius: 12px;
  border: 1px solid rgba(11, 59, 42, 0.15) !important;
  background: #fff !important;
  color: #2f4339;
}

.reset-header-icon {
  display: grid;
  place-items: center;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

/* per-teacher recap */
.ta-teachers {
  margin-top: 1.5rem;
  padding: 18px 18px 8px;
  border-radius: 20px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.1);
  box-shadow: 0 1px 2px rgba(3, 41, 29, 0.05), 0 10px 26px -14px rgba(3, 41, 29, 0.2);
}

.ta-teachers-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.ta-teachers-head h2 {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--lp-ink, #0b3b2a);
}

.ta-teachers-head h2::before {
  content: "";
  flex: none;
  width: 8px;
  height: 8px;
  background: var(--lp-gold-deep, #b45309);
  transform: rotate(45deg);
}

.ta-teachers-month {
  font-size: 0.85rem;
  font-weight: 600;
  color: #5b6b62;
}

.ta-empty {
  margin: 8px 0 14px;
  color: #5b6b62;
}

.ta-table {
  width: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}

.ta-table thead th {
  padding: 8px 10px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #5b6b62;
  text-align: left;
  border-bottom: 1px solid rgba(11, 59, 42, 0.12);
}

.ta-table tbody td,
.ta-table tbody th,
.ta-table tfoot td,
.ta-table tfoot th {
  padding: 10px;
  border-bottom: 1px solid rgba(11, 59, 42, 0.07);
  vertical-align: middle;
}

.ta-table tbody tr:hover {
  background: #f7faf8;
}

.ta-table tfoot th,
.ta-table tfoot td {
  border-bottom: 0;
  border-top: 1.5px solid rgba(11, 59, 42, 0.18);
  font-weight: 800;
  color: var(--lp-ink, #0b3b2a);
}

.ta-table tfoot th {
  font-size: 0.9rem;
  text-align: left;
}

.ta-num {
  text-align: right !important;
  white-space: nowrap;
  font-weight: 700;
  color: var(--lp-ink, #0b3b2a);
}

.ta-hadir {
  color: #0a5c40;
}

.ta-tidak {
  color: #b42318;
}

.ta-pay {
  color: #5b3a06;
}

.ta-who {
  text-align: left;
  font-weight: 400;
}

.ta-avatar {
  flex: none;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 800;
}

.ta-who-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.ta-who-text strong {
  color: var(--lp-ink, #0b3b2a);
  font-size: 0.95rem;
}

.ta-who-text span {
  font-size: 0.8rem;
  color: #5b6b62;
}

.ta-col-bar {
  width: 32%;
}

.ta-bar {
  display: flex;
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: #eef2ef;
}

.ta-bar-hadir {
  background: #0a5c40;
}

.ta-bar-tidak {
  background: #e7826f;
}

/* phones: each teacher becomes a block; numbers keep their labels */
@media (max-width: 720px) {
  .ta-teachers {
    padding: 14px 14px 4px;
  }

  .ta-table thead {
    display: none;
  }

  .ta-table,
.ta-table tbody,
.ta-table tfoot {
    display: block;
  }

  .ta-table tr {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px 8px;
    padding: 12px 0;
    border-bottom: 1px solid rgba(11, 59, 42, 0.08);
  }

  .ta-table tfoot tr {
    border-bottom: 0;
    border-top: 1.5px solid rgba(11, 59, 42, 0.18);
  }

  .ta-table tbody td,
.ta-table tbody th,
.ta-table tfoot td,
.ta-table tfoot th {
    padding: 0;
    border: 0 !important;
  }

  .ta-table .ta-who,
.ta-table .ta-col-bar {
    grid-column: 1 / -1;
    width: auto;
  }

  .ta-table tfoot .ta-col-bar {
    display: none;
  }

  .ta-num {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left !important;
    font-size: 1rem;
  }

  .ta-num::before {
    content: attr(data-label);
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #5b6b62;
  }
}

/* ================================================================ admin calendar: the same look as the guru calendar */
.filter-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.filter-section label {
  font-weight: 700;
  color: var(--lp-ink, #0b3b2a);
  font-size: 0.9rem;
}

.select-wrapper {
  flex: 1;
  max-width: 320px;
}

.calendar-container {
  padding: 18px;
  border-radius: 20px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.1);
  box-shadow: 0 1px 2px rgba(3, 41, 29, 0.05), 0 10px 26px -14px rgba(3, 41, 29, 0.2);
}

/* who is who in the "Semua guru" view */
.teacher-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(11, 59, 42, 0.08);
}

.legend-teacher {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 0.55rem;
  font-weight: 800;
}

.legend-name {
  font-size: 0.8rem;
  color: #2f4339;
  font-weight: 600;
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

.nav-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.nav-btn:focus-visible,
.calendar-cell:focus-visible,
.sheet-close:focus-visible {
  outline: 3px solid var(--primary-300, #81c784);
  outline-offset: 1px;
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

.calendar-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 48px;
  padding: 4px 2px;
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

/* "Semua guru": taller cells for the initials */
.calendar-grid.is-all .calendar-cell {
  min-height: 74px;
  justify-content: flex-start;
  padding-top: 6px;
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

.calendar-cell.has-attendance {
  background: #fff;
  border-color: rgba(11, 59, 42, 0.12);
}

.calendar-cell.is-off {
  background: transparent;
  color: var(--gray-300);
}

.calendar-cell.is-off .cell-date {
  text-decoration: line-through;
  text-decoration-color: var(--gray-300);
}

.calendar-cell.is-today {
  border-color: var(--primary);
}

.calendar-cell.is-selected {
  border-color: var(--primary);
  box-shadow: inset 0 0 0 1px var(--primary);
}

.cell-date {
  line-height: 1;
}

.cell-avatars {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 3px;
  max-width: 100%;
}

.calendar-grid .mini-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 0.5rem;
  font-weight: 800;
}

.calendar-grid .more-indicator {
  font-size: 0.62rem;
  font-weight: 700;
  color: #5b6b62;
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

.legend-initial {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #0a5c40;
  color: #fff;
  font-size: 0.45rem;
  font-weight: 800;
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

/* day detail: bottom sheet on phones, dialog on larger screens (same as the guru page) */
.ta-day-overlay {
  position: fixed;
  inset: 0;
  z-index: 9990;
  background: rgba(3, 41, 29, 0.45);
}

.ta-day-sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9991;
  width: 100%;
  max-height: 86dvh;
  overflow-y: auto;
  background: #fbf9f3;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -20px 50px -20px rgba(0, 0, 0, 0.45);
  padding-bottom: env(safe-area-inset-bottom);
}

@media (min-width: 640px) {
  .ta-day-sheet {
    left: 50%;
    right: auto;
    bottom: auto;
    top: 50%;
    width: min(520px, calc(100vw - 48px));
    transform: translate(-50%, -50%);
    border-radius: 20px;
    max-height: 82vh;
  }
}

.ta-day-sheet .popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px 12px;
  border-bottom: 1px solid rgba(11, 59, 42, 0.08);
}

.ta-day-sheet .popup-header h4 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--lp-ink, #0b3b2a);
}

.sheet-close {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(11, 59, 42, 0.15) !important;
  background: #fff !important;
  color: #2f4339;
  display: grid !important;
  place-items: center;
  cursor: pointer;
}

/* ---------------------------------------------------------------- per-teacher table: name cell layout lives inside */
.ta-who {
  display: table-cell;
}

.ta-who-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

@media (max-width: 720px) {
  .ta-who {
    display: block;
  }

  .ta-table tr {
    gap: 4px 8px;
    padding: 10px 0;
  }

  .ta-avatar {
    width: 32px;
    height: 32px;
    font-size: 0.72rem;
  }

  .ta-who-text strong {
    font-size: 0.92rem;
  }

  .ta-bar {
    height: 6px;
    margin: 2px 0;
  }

  .ta-num {
    font-size: 0.92rem;
  }

  .ta-num::before {
    font-size: 0.62rem;
  }
}

@media (max-width: 640px) {
  .calendar-container {
    padding: 12px;
  }

  .calendar-grid.is-all .calendar-cell {
    min-height: 62px;
  }

  .calendar-grid .mini-avatar {
    width: 14px;
    height: 14px;
    font-size: 0;
  }

  .filter-section {
    flex-wrap: wrap;
  }

  .select-wrapper {
    max-width: none;
  }
}
</style>

