<template>
  <div class="kbm-view">
    <!-- Top Header -->
    <header class="page-header">
      <div class="header-main">
        <div class="header-title-row">
          <h1>KBM / Mengajar</h1>
          <span class="period-pill" v-if="activePeriodLabel">
            📅 {{ activePeriodLabel }}
          </span>
        </div>
        <p class="header-subtitle">Catat dan pantau aktivitas belajar mengajar harian guru</p>
      </div>

      <div v-if="isFromAttendance" class="header-action">
        <router-link to="/dashboard/attendance" class="btn btn-secondary btn-sm btn-back-attendance">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Kembali ke Absensi</span>
        </router-link>
      </div>
    </header>

    <!-- Attendance Guidance Banner if redirected from attendance -->
    <div v-if="isFromAttendance" class="attendance-guidance-banner glass-card">
      <div class="banner-icon">📚</div>
      <div class="banner-content">
        <div class="banner-badge">FOKUS KBM HARI INI</div>
        <h3>Presensi Guru: HADIR ({{ formattedToday }})</h3>
        <p>
          Silakan catat sesi KBM hari ini, kemudian lanjutkan dengan mengisi <strong>Absensi Santri</strong> dan
          <strong>Jurnal KBM</strong>.
        </p>
      </div>
    </div>

    <!-- Locked Period Alert (if LPJ is already submitted or approved) -->
    <div v-if="isPeriodLocked" class="locked-period-banner glass-card">
      <div class="locked-icon">🔒</div>
      <div class="locked-text">
        <strong>Administrasi Periode Ini Sedang Dikunci</strong>
        <p>
          Laporan LPJ periode ini berstatus <strong>{{ lockedStatusText }}</strong>. Penambahan atau penghapusan sesi
          dinonaktifkan sementara.
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loadingInitial" class="loading-state glass-card">
      <div class="loading-spinner"></div>
      <p>Memuat data KBM &amp; sesi pembelajaran...</p>
    </div>

    <template v-else>
      <!-- Quick Metrics Summary (Responsive 4-Cards Grid) -->
      <section class="kbm-metrics-grid" aria-label="Statistik KBM">
        <div class="kbm-metric-card glass-card">
          <div class="metric-icon total">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div class="metric-info">
            <span class="metric-label">Total Sesi</span>
            <strong class="metric-value">{{ totalSessions }} <span class="metric-unit">Sesi</span></strong>
          </div>
        </div>

        <div class="kbm-metric-card glass-card">
          <div class="metric-icon today">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div class="metric-info">
            <span class="metric-label">Hari Ini</span>
            <strong class="metric-value">{{ todaySessions }} <span class="metric-unit">Sesi</span></strong>
          </div>
        </div>

        <div class="kbm-metric-card glass-card">
          <div class="metric-icon complete">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div class="metric-info">
            <span class="metric-label">Sudah Lengkap</span>
            <strong class="metric-value text-success-bold">
              {{ completeSessionsCount }} <span class="metric-unit">Sesi</span>
            </strong>
          </div>
        </div>

        <div class="kbm-metric-card glass-card" :class="{ 'card-attention': pendingSessionsCount > 0 }">
          <div class="metric-icon" :class="pendingSessionsCount > 0 ? 'pending' : 'neutral'">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div class="metric-info">
            <span class="metric-label">Perlu Dilengkapi</span>
            <strong class="metric-value" :class="pendingSessionsCount > 0 ? 'text-warning-bold' : ''">
              {{ pendingSessionsCount }} <span class="metric-unit">Sesi</span>
            </strong>
          </div>
        </div>
      </section>

      <!-- Main Layout: Sticky Form (Left) & Riwayat KBM (Right) -->
      <div class="content-grid">
        <!-- Sticky Form Input KBM -->
        <aside class="kbm-form-sticky-wrap">
          <section class="kbm-form glass-card" aria-labelledby="form-heading">
            <div class="card-header-row">
              <div class="card-header-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>
              <div>
                <h2 id="form-heading">Input Sesi Mengajar</h2>
                <p class="card-subtitle">Catat presensi santri &amp; jurnal KBM baru</p>
              </div>
            </div>

            <!-- Contextual notice if date passed via URL -->
            <div v-if="contextualDate && !isFromAttendance" class="contextual-date-banner">
              <div class="contextual-badge">
                <span>📅 Sesi tanggal: <strong>{{ formatContextualDate(form.date) }}</strong></span>
                <button v-if="form.date !== todayString" type="button" class="btn-reset-date" @click="setDateToday"
                  title="Ganti ke hari ini">
                  Hari Ini
                </button>
              </div>
            </div>

            <form @submit.prevent="submitSession" class="kbm-form-inner">
              <!-- Tanggal KBM -->
              <div class="form-group">
                <div class="form-label-row">
                  <label for="input-kbm-date">Tanggal KBM</label>
                  <div class="date-quick-helpers" v-if="!isFromAttendance && !isPeriodLocked">
                    <button type="button" class="quick-date-btn" :class="{ active: form.date === todayString }"
                      @click="setDateToday">
                      Hari Ini
                    </button>
                    <button type="button" class="quick-date-btn" :class="{ active: form.date === yesterdayString }"
                      @click="setDateYesterday">
                      Kemarin
                    </button>
                  </div>
                  <span v-if="isFromAttendance" class="badge-locked-date">🔒 Sesuai Absensi</span>
                </div>

                <input id="input-kbm-date" type="date" v-model="form.date"
                  :min="isFromAttendance ? todayString : minDateString" :max="todayString"
                  :disabled="isFromAttendance || isPeriodLocked" @change="validateEligibility" class="form-input"
                  :class="{ 'input-locked': isFromAttendance || isPeriodLocked }" required />
                <small v-if="isFromAttendance" class="help-text help-text-locked">
                  📌 Mengisi KBM dari alur absensi hari ini ({{ formattedToday }}).
                </small>
                <small v-else class="help-text">
                  Pilih hari ini atau tanggal sebelumnya dalam periode aktif.
                </small>
              </div>

              <!-- Pilih Jilid / Kelas -->
              <div class="form-group">
                <label for="input-kbm-class">Jilid / Kelas</label>
                <select id="input-kbm-class" v-model="form.classId" @change="validateEligibility" class="form-input"
                  :disabled="isPeriodLocked" required>
                  <option value="" disabled>Pilih Jilid / Kelas</option>
                  <option v-for="c in classes" :key="c.id" :value="c.id">
                    {{ c.name }}
                  </option>
                </select>
              </div>

              <!-- Sesi Pembelajaran -->
              <div class="form-group">
                <label for="input-kbm-slot">Sesi Pembelajaran</label>
                <select id="input-kbm-slot" v-model="form.sessionSlotId" class="form-input"
                  @change="validateEligibility" :disabled="isPeriodLocked" required>
                  <option value="" disabled>Pilih Sesi Pembelajaran</option>
                  <option v-for="s in sessionSlots" :key="s.id" :value="s.id">
                    {{ s.name }} ({{ s.startTime }} - {{ s.endTime }})
                  </option>
                </select>
              </div>

              <!-- Guru Badal Checkbox -->
              <div class="form-group badal-group" v-if="teachers.length > 0 && !isPeriodLocked">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="form.isSubstitute" />
                  <span>Menggantikan Guru Lain (Badal)</span>
                </label>
                <Transition name="fade">
                  <div v-if="form.isSubstitute" class="badal-dropdown-wrap">
                    <select v-model="form.substituteFor" class="form-input mt-2" required>
                      <option value="" disabled>Pilih Guru yang Digantikan</option>
                      <option v-for="t in teachers" :key="t.id" :value="t.id">
                        {{ t.displayName || t.name }}
                      </option>
                    </select>
                  </div>
                </Transition>
              </div>

              <!-- Live Validation / Eligibility Alert -->
              <div v-if="eligibilityMessage" class="alert" :class="isEligible ? 'alert-success' : 'alert-error'">
                <div class="alert-icon">
                  <svg v-if="isEligible" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div class="alert-content">
                  <span>{{ eligibilityMessage }}</span>
                  <router-link v-if="!isEligible && eligibilityRequiresAttendance" to="/dashboard/attendance"
                    class="alert-link-action">
                    Absen Masuk Sekarang →
                  </router-link>
                </div>
              </div>

              <!-- Submit Button -->
              <button type="submit" class="submit-kbm-btn" :class="{ 'is-eligible': isEligible && !isPeriodLocked }"
                :disabled="!isEligible || submitting || isPeriodLocked">
                <span v-if="submitting" class="inline-spinner"></span>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                <span>{{ submitting ? "Menyimpan Sesi..." : "Simpan Sesi KBM" }}</span>
              </button>
            </form>
          </section>
        </aside>

        <!-- Riwayat KBM Bulan Ini (Structured Task Cards) -->
        <main class="kbm-history-wrap">
          <section class="kbm-history glass-card" aria-labelledby="history-heading">
            <div class="history-card-header">
              <div class="history-title-wrap">
                <h2 id="history-heading">Riwayat KBM Bulan Ini</h2>
                <p class="card-subtitle">
                  Total {{ history.length }} sesi pembelajaran yang tercatat
                </p>
              </div>

              <!-- Filter Controls -->
              <div class="history-toolbar">
                <div class="filter-pills-row" role="tablist">
                  <button type="button" class="pill-tab-btn" :class="{ active: filterTab === 'all' }"
                    @click="filterTab = 'all'">
                    Semua ({{ history.length }})
                  </button>
                  <button type="button" class="pill-tab-btn pill-tab-pending"
                    :class="{ active: filterTab === 'needs_work' }" @click="filterTab = 'needs_work'">
                    Perlu Dilengkapi ({{ pendingSessionsCount }})
                  </button>
                  <button type="button" class="pill-tab-btn pill-tab-complete"
                    :class="{ active: filterTab === 'complete' }" @click="filterTab = 'complete'">
                    Lengkap ({{ completeSessionsCount }})
                  </button>
                </div>

                <div class="history-filter-wrapper" v-if="classes.length > 0">
                  <select v-model="historyFilter" class="filter-select" aria-label="Filter berdasarkan kelas">
                    <option value="all">Semua Kelas</option>
                    <option v-for="c in classes" :key="'f-' + c.id" :value="String(c.id)">
                      {{ c.name }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-if="filteredHistory.length === 0" class="empty-feed-state">
              <div class="empty-icon">📂</div>
              <h3>Tidak ada sesi KBM</h3>
              <p class="text-muted">
                {{
                  historyFilter !== "all" || filterTab !== "all"
                    ? "Tidak ada sesi yang cocok dengan filter yang dipilih."
                    : "Belum ada sesi KBM yang tercatat untuk bulan ini."
                }}
              </p>
              <button v-if="historyFilter !== 'all' || filterTab !== 'all'" type="button"
                class="btn btn-secondary btn-sm mt-3" @click="resetFilters">
                Reset Filter
              </button>
            </div>

            <!-- Structured Session Cards List -->
            <div v-else class="session-feed-list">
              <article v-for="session in filteredHistory" :key="session.id" class="session-structured-card" :class="{
                'is-complete': isWorkflowComplete(session),
                'is-pending': !isWorkflowComplete(session)
              }">
                <!-- Card Header: 2 Organized Rows -->
                <div class="card-meta-header">
                  <!-- Row 1: Date, Slot, and Delete Button -->
                  <div class="meta-top-row">
                    <div class="meta-date-slot">
                      <div class="date-badge-box">
                        <span class="day-short">{{ getDayName(session.date) }}</span>
                        <strong class="date-main">{{ formatDate(session.date) }}</strong>
                      </div>

                      <span class="slot-pill">
                        {{ getSessionSlotIcon(session.sessionSlotId) }} {{ getSessionName(session.sessionSlotId) }}
                        <span v-if="getSessionTime(session.sessionSlotId)" class="slot-time-text">
                          ({{ getSessionTime(session.sessionSlotId) }})
                        </span>
                      </span>
                    </div>

                    <!-- Delete button in Top-Right Corner -->
                    <div class="meta-actions-right">
                      <button v-if="!isPeriodLocked" type="button" class="btn-delete-card" title="Hapus sesi KBM ini"
                        @click="openDeleteModal(session)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          stroke-width="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        <span class="delete-text-btn">Hapus</span>
                      </button>
                      <span v-else class="locked-icon-pill" title="Terkunci karena LPJ diajukan/disetujui">
                        🔒
                      </span>
                    </div>
                  </div>

                  <!-- Row 2: Badges (Level, Activity, RPP, Badal) -->
                  <div class="meta-tags-row">
                    <span class="level-pill">{{ getLevelName(session) }}</span>

                    <span class="activity-pill">
                      {{ session.type === "teaching" ? "KBM Normal" : session.activityName || "Non-KBM" }}
                      <span v-if="session.meetingNumber" class="meeting-num">Ke-{{ session.meetingNumber }}</span>
                    </span>

                    <span class="rpp-pill" :class="session.advancesRpp ? 'rpp-maju' : 'rpp-tetap'">
                      {{ session.advancesRpp ? "RPP Maju" : "RPP Tetap" }}
                    </span>

                    <span v-if="session.substituteFor" class="badal-pill">
                      Guru Badal
                    </span>
                  </div>
                </div>

                <!-- Card Body: 2 Full-Width Task Action Blocks -->
                <div class="card-tasks-row" v-if="isWorkflowRow(session)">
                  <!-- Task 1: Presensi Santri -->
                  <div class="task-block" :class="workflowOf(session).attFilled ? 'task-complete' : 'task-pending'">
                    <div class="task-info-side">
                      <div class="task-title-row">
                        <span class="task-status-badge">
                          {{ workflowOf(session).attFilled ? '✓ Lengkap' : '⚠️ Belum Diisi' }}
                        </span>
                        <h4>Presensi Santri</h4>
                      </div>
                      <p class="task-summary-text">
                        {{ workflowOf(session).attFilled ? `${workflowOf(session).attHadir} dari
                        ${workflowOf(session).attTotal} santri hadir` : 'Daftar kehadiran santri belum dicatat' }}
                      </p>
                    </div>

                    <button type="button" class="btn-task-action"
                      :class="workflowOf(session).attFilled ? 'btn-task-edit' : 'btn-task-submit'"
                      @click="goAttendance(session.id)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                      </svg>
                      <span>{{ workflowOf(session).attFilled ? "Ubah Absensi" : "Isi Absensi Santri" }}</span>
                    </button>
                  </div>

                  <!-- Task 2: Jurnal KBM -->
                  <div class="task-block" :class="workflowOf(session).journalFilled ? 'task-complete' : 'task-pending'">
                    <div class="task-info-side">
                      <div class="task-title-row">
                        <span class="task-status-badge">
                          {{ workflowOf(session).journalFilled ? '✓ Lengkap' : '⚠️ Belum Diisi' }}
                        </span>
                        <h4>Jurnal Mengajar</h4>
                      </div>
                      <p class="task-summary-text">
                        {{
                          workflowOf(session).journalFilled ? `Materi KBM telah tersimpan rapi` : `Materi jurnal
                        pembelajaran belum diisi`
                        }}
                      </p>
                    </div>

                    <button type="button" class="btn-task-action"
                      :class="workflowOf(session).journalFilled ? 'btn-task-edit' : 'btn-task-submit'"
                      @click="goJournal(session.id)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                      <span>{{ workflowOf(session).journalFilled ? "Ubah Jurnal" : "Isi Jurnal KBM" }}</span>
                    </button>
                  </div>
                </div>
              </article>
            </div>
          </section>
        </main>
      </div>
    </template>

    <!-- Modal Konfirmasi Hapus Sesi -->
    <Teleport to="body">
      <div v-if="deletingSession" class="modal-overlay" @click.self="closeDeleteModal">
        <div class="modal glass-card delete-modal-card">
          <div class="modal-danger-header">
            <span class="danger-icon">⚠️</span>
            <h3>Hapus Sesi Mengajar?</h3>
          </div>

          <div class="modal-danger-body">
            <p>
              Apakah Anda yakin ingin menghapus sesi <strong>{{ getLevelName(deletingSession) }}</strong> ({{
                getSessionName(deletingSession.sessionSlotId) }}) pada <strong>{{ formatDate(deletingSession.date)
                }}</strong>?
            </p>
            <div class="alert alert-warning mt-3">
              Materi jurnal dan presensi santri pada sesi ini akan dihapus permanen.
            </div>
          </div>

          <div class="modal-danger-actions">
            <button type="button" class="btn btn-secondary" :disabled="deletingLoading" @click="closeDeleteModal">
              Batal
            </button>
            <button type="button" class="btn btn-danger" :disabled="deletingLoading" @click="confirmDeleteSession">
              <span v-if="deletingLoading" class="inline-spinner mr-2"></span>
              <span>{{ deletingLoading ? "Menghapus..." : "Ya, Hapus Sesi" }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Bimbingan Pasca Simpan KBM -->
    <Teleport to="body">
      <div v-if="showSessionCreatedModal" class="session-modal-overlay" @click.self="showSessionCreatedModal = false">
        <div class="session-modal glass-card">
          <div class="modal-icon-wrap">🎉</div>
          <h2>Sesi KBM Berhasil Disimpan!</h2>
          <p class="modal-desc">
            Sesi <strong>{{ createdSessionInfo?.className }}</strong> ({{ createdSessionInfo?.slotName }}) pada
            <strong>{{
              createdSessionInfo?.formattedDate }}</strong> telah berhasil disimpan.
          </p>

          <div class="modal-instruction-box">
            <div class="instruction-header">
              <span class="instruction-icon">📝</span>
              <strong>Langkah Selanjutnya:</strong>
            </div>
            <p class="instruction-text">
              Silakan lengkapi absensi kehadiran para santri dan materi jurnal mengajar untuk sesi ini.
            </p>
          </div>

          <div class="modal-action-buttons">
            <button type="button" class="btn btn-primary btn-action-flow"
              @click="router.push(`/dashboard/kbm/${createdSessionInfo.id}/absensi`)">
              📋 Isi Absensi Santri Sekarang →
            </button>
            <button type="button" class="btn btn-secondary btn-action-flow"
              @click="router.push(`/dashboard/kbm/${createdSessionInfo.id}/jurnal`)">
              📖 Isi Jurnal KBM Sekarang →
            </button>
            <button v-if="isFromAttendance" type="button" class="btn btn-outline-secondary btn-action-flow"
              @click="router.push('/dashboard/attendance')">
              ← Selesai &amp; Kembali ke Absensi
            </button>
            <button type="button" class="btn btn-link btn-dismiss-modal" @click="showSessionCreatedModal = false">
              Tutup &amp; Tambah Sesi Lain
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import api from "@/services/api";
import { useRoute, useRouter } from "vue-router";
import { resolveKbmDateFromQuery } from "@/utils/lpjState";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@/composables/useToast";
import { summarizeSessionWorkflow } from "@/utils/journalState";
import {
  resolveSessionSlotName,
  resolveSessionSlotTime,
} from "@/utils/sessionSlot";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { success: showSuccess, error: showError } = useToast();

const today = new Date();
const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

const getYesterdayString = () => {
  const y = new Date(today);
  y.setDate(y.getDate() - 1);
  return `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, "0")}-${String(y.getDate()).padStart(2, "0")}`;
};
const yesterdayString = getYesterdayString();

const minDateString = ref(
  `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`,
);

const loadingInitial = ref(true);
const submitting = ref(false);
const classes = ref([]);
const sessionSlots = ref([]);
const teachers = ref([]);
const history = ref([]);
const myAttendances = ref([]);
const operationalCalendar = ref(null);
const tpqProfile = ref(null);
const currentLpjReport = ref(null);

// Filters
const historyFilter = ref("all");
const filterTab = ref("all");

// Delete state
const deletingSession = ref(null);
const deletingLoading = ref(false);

const isFromAttendance = computed(() => route.query.from === "attendance");

const formattedToday = computed(() => {
  return today.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
});

const contextualDate = resolveKbmDateFromQuery(route.query.date);

const viewedPeriod = () => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(form.value.date || "");
  if (m) return { month: Number(m[2]), year: Number(m[1]) };
  return { month: today.getMonth() + 1, year: today.getFullYear() };
};

const activePeriodLabel = computed(() => {
  const p = viewedPeriod();
  const dateObj = new Date(p.year, p.month - 1, 1);
  return dateObj.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
});

const form = ref({
  date: isFromAttendance.value ? todayString : (contextualDate || todayString),
  classId: "",
  sessionSlotId: "",
  isSubstitute: false,
  substituteFor: "",
});

const isEligible = ref(false);
const eligibilityMessage = ref("");
const eligibilityRequiresAttendance = ref(false);
const showSessionCreatedModal = ref(false);
const createdSessionInfo = ref(null);

const isPeriodLocked = computed(() => {
  if (authStore.user?.role === "admin") return false;
  return (
    currentLpjReport.value?.status === "submitted" ||
    currentLpjReport.value?.status === "approved"
  );
});

const lockedStatusText = computed(() => {
  if (currentLpjReport.value?.status === "approved") return "Disetujui";
  if (currentLpjReport.value?.status === "submitted") return "Menunggu Persetujuan";
  return "Terkunci";
});

const setDateToday = () => {
  if (isFromAttendance.value || isPeriodLocked.value) return;
  form.value.date = todayString;
  validateEligibility();
};

const setDateYesterday = () => {
  if (isFromAttendance.value || isPeriodLocked.value) return;
  form.value.date = yesterdayString;
  validateEligibility();
};

const formatContextualDate = (dateStr) => {
  if (!dateStr) return "";
  const [y, m, d] = String(dateStr).split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const fetchInitialData = async () => {
  try {
    const periodObj = viewedPeriod();
    const periodStr = `${periodObj.year}-${String(periodObj.month).padStart(2, "0")}`;

    const [classesRes, slotsRes, calendarRes, historyRes, attRes, profileRes] =
      await Promise.all([
        api.get("/classes"),
        api.get("/teaching_sessions/slots"),
        api.get("/settings/operational-calendar"),
        api.get("/teaching_sessions", {
          params: periodObj,
        }),
        api.get("/attendance/me", {
          params: periodObj,
        }),
        api.get("/settings/tpq-profile"),
      ]);

    classes.value = classesRes.data || [];
    sessionSlots.value = slotsRes.data || [];
    operationalCalendar.value = calendarRes.data;
    history.value = historyRes.data || [];
    myAttendances.value = attRes.data || [];
    tpqProfile.value = profileRes.data;

    if (tpqProfile.value?.activeOperationalPeriod) {
      minDateString.value = `${tpqProfile.value.activeOperationalPeriod}-01`;
    }

    try {
      const lpjRes = await api.get("/ljp/reports", { params: { period: periodStr } });
      if (Array.isArray(lpjRes.data) && lpjRes.data.length > 0) {
        currentLpjReport.value = lpjRes.data[0];
      } else {
        currentLpjReport.value = null;
      }
    } catch {
      currentLpjReport.value = null;
    }

    try {
      const teachersRes = await api.get("/users/teachers/public");
      teachers.value = (teachersRes.data || []).filter(
        (t) => t.id !== authStore.user?.id,
      );
    } catch {
      teachers.value = [];
    }
  } catch (error) {
    console.error("Failed to load initial data", error);
    showError("Gagal memuat data KBM.");
  } finally {
    loadingInitial.value = false;
    validateEligibility();
  }
};

const validateEligibility = () => {
  isEligible.value = false;
  eligibilityMessage.value = "";
  eligibilityRequiresAttendance.value = false;

  if (isPeriodLocked.value) {
    eligibilityMessage.value = `Periode ini berstatus ${lockedStatusText.value}. Sesi tidak dapat diubah.`;
    return;
  }

  if (!form.value.date || !form.value.sessionSlotId) return;

  const selectedDate = new Date(form.value.date);

  // Check active operational period
  if (tpqProfile.value?.activeOperationalPeriod) {
    const sessionPeriod = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}`;
    if (sessionPeriod !== tpqProfile.value.activeOperationalPeriod) {
      eligibilityMessage.value = `Tanggal berada di luar periode operasional aktif (${tpqProfile.value.activeOperationalPeriod}).`;
      return;
    }
  }

  // Check active weekdays
  if (operationalCalendar.value && operationalCalendar.value.activeWeekdays) {
    const day = selectedDate.getDay();
    if (!operationalCalendar.value.activeWeekdays.includes(day)) {
      eligibilityMessage.value =
        "Tanggal yang dipilih bukan hari operasional TPQ.";
      return;
    }
  }

  // Check if session already exists for this guru on this date and slot
  const existing = history.value.find((s) => {
    let sDateStr = "";
    if (s.date?._seconds) {
      const d = new Date(s.date._seconds * 1000);
      sDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    } else if (typeof s.date === "string") {
      sDateStr = s.date.slice(0, 10);
    } else if (s.date instanceof Date) {
      sDateStr = `${s.date.getFullYear()}-${String(s.date.getMonth() + 1).padStart(2, "0")}-${String(s.date.getDate()).padStart(2, "0")}`;
    }
    return (
      sDateStr === form.value.date &&
      s.sessionSlotId === form.value.sessionSlotId
    );
  });

  if (existing) {
    eligibilityMessage.value =
      "Anda sudah memiliki sesi mengajar pada sesi ini di tanggal tersebut.";
    return;
  }

  // Check teacher attendance on that date
  const attendance = myAttendances.value.find((a) => {
    let aDateStr = "";
    if (a.date?._seconds) {
      const d = new Date(a.date._seconds * 1000);
      aDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    } else if (typeof a.date === "string") {
      aDateStr = a.date.slice(0, 10);
    } else if (a.date instanceof Date) {
      aDateStr = `${a.date.getFullYear()}-${String(a.date.getMonth() + 1).padStart(2, "0")}-${String(a.date.getDate()).padStart(2, "0")}`;
    }
    return aDateStr === form.value.date;
  });

  if (!attendance) {
    eligibilityRequiresAttendance.value = true;
    eligibilityMessage.value =
      "Anda belum mengisi absen kehadiran guru pada tanggal ini.";
    return;
  }

  if (attendance.status !== "hadir") {
    eligibilityMessage.value =
      `Status kehadiran Anda tercatat "${attendance.status || 'Tidak Hadir'}" pada tanggal ini. Sesi KBM hanya dapat dibuat jika hadir.`;
    return;
  }

  isEligible.value = true;
  eligibilityMessage.value = "Presensi guru valid (Hadir). Sesi siap disimpan.";
};

const submitSession = async () => {
  if (!isEligible.value || isPeriodLocked.value) return;
  submitting.value = true;
  try {
    const payload = {
      date: form.value.date,
      type: "teaching",
      classId: form.value.classId,
      sessionSlotId: form.value.sessionSlotId,
      substituteFor: form.value.isSubstitute ? form.value.substituteFor : null,
      journal: { material: "KBM (Menunggu Update Jurnal)" },
      studentAttendances: [],
    };

    const res = await api.post("/teaching_sessions", payload);

    // Refresh history
    const historyRes = await api.get("/teaching_sessions", {
      params: viewedPeriod(),
    });
    history.value = historyRes.data || [];

    const createdId = res.data?.id;
    const selectedClass = classes.value.find(
      (c) => String(c.id) === String(form.value.classId),
    );

    if (createdId) {
      createdSessionInfo.value = {
        id: createdId,
        className: selectedClass?.name || `Jilid ${form.value.classId}`,
        slotName: resolveSessionSlotName(form.value.sessionSlotId, sessionSlots.value),
        date: form.value.date,
        formattedDate: formatDate(form.value.date),
      };
      showSessionCreatedModal.value = true;
      showSuccess("Sesi KBM berhasil disimpan!");
    }

    // Reset fields except date
    form.value.classId = "";
    form.value.isSubstitute = false;
    form.value.substituteFor = "";

    validateEligibility();
  } catch (error) {
    showError(error.response?.data?.error || "Gagal menyimpan sesi mengajar");
  } finally {
    submitting.value = false;
  }
};

const formatDate = (val) => {
  if (!val) return "-";
  let d;
  if (val._seconds) d = new Date(val._seconds * 1000);
  else if (val.seconds) d = new Date(val.seconds * 1000);
  else d = new Date(val);

  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getDayName = (val) => {
  if (!val) return "";
  let d;
  if (val._seconds) d = new Date(val._seconds * 1000);
  else if (val.seconds) d = new Date(val.seconds * 1000);
  else d = new Date(val);

  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("id-ID", { weekday: "short" });
};

const getSessionName = (id) => {
  return resolveSessionSlotName(id, sessionSlots.value);
};

const getSessionTime = (id) => {
  return resolveSessionSlotTime(id, sessionSlots.value);
};

const getSessionSlotIcon = (slotId) => {
  const s = String(slotId || "").toLowerCase();
  if (s.includes("2") || s.includes("malam")) return "🌙";
  return "☀️";
};

const getLevelName = (session) => {
  if (!session) return "-";
  const levelId = session.levelId || session.classId;
  const found = classes.value.find((c) => String(c.id) === String(levelId));
  if (found) return found.name;
  return session.className || `Jilid ${levelId}`;
};

const isWorkflowRow = (session) =>
  session.type === "teaching" || session.type === "special_non_kbm";

const workflowOf = (session) => summarizeSessionWorkflow(session);

const isWorkflowComplete = (session) => {
  const w = workflowOf(session);
  return w.attFilled && w.journalFilled;
};

const goAttendance = (sessionId) => {
  router.push("/dashboard/kbm/" + sessionId + "/absensi");
};

const goJournal = (sessionId) => {
  router.push("/dashboard/kbm/" + sessionId + "/jurnal");
};

// Filter computation
const filteredHistory = computed(() => {
  return history.value.filter((s) => {
    // 1. Class filter
    if (historyFilter.value !== "all") {
      const levelId = String(s.levelId || s.classId || "");
      if (levelId !== historyFilter.value) return false;
    }

    // 2. Tab filter
    if (filterTab.value === "needs_work") {
      return !isWorkflowComplete(s);
    }
    if (filterTab.value === "complete") {
      return isWorkflowComplete(s);
    }
    return true;
  });
});

const resetFilters = () => {
  historyFilter.value = "all";
  filterTab.value = "all";
};

// Metrics
const totalSessions = computed(() => history.value.length);

const todaySessions = computed(() => {
  return history.value.filter((s) => {
    if (!s.date) return false;
    let sDateStr = "";
    if (s.date._seconds) {
      const d = new Date(s.date._seconds * 1000);
      sDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    } else if (typeof s.date === "string") {
      sDateStr = s.date.slice(0, 10);
    }
    return sDateStr === todayString;
  }).length;
});

const completeSessionsCount = computed(() => {
  return history.value.filter((s) => isWorkflowComplete(s)).length;
});

const pendingSessionsCount = computed(() => {
  return history.value.filter((s) => !isWorkflowComplete(s)).length;
});

// Delete modal handling
const openDeleteModal = (session) => {
  deletingSession.value = session;
};

const closeDeleteModal = () => {
  if (deletingLoading.value) return;
  deletingSession.value = null;
};

const confirmDeleteSession = async () => {
  if (!deletingSession.value) return;
  deletingLoading.value = true;
  try {
    await api.delete(`/teaching_sessions/${deletingSession.value.id}`);
    showSuccess("Sesi KBM berhasil dihapus.");
    closeDeleteModal();

    // Refresh history
    const historyRes = await api.get("/teaching_sessions", {
      params: viewedPeriod(),
    });
    history.value = historyRes.data || [];
    validateEligibility();
  } catch (error) {
    showError(error.response?.data?.error || "Gagal menghapus sesi KBM.");
  } finally {
    deletingLoading.value = false;
  }
};

onMounted(() => {
  fetchInitialData();
});
</script>

<style scoped>
.kbm-view {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;

  padding-top: 60px;
}

@media (min-width: 1024px) {
  .kbm-view {
    padding-top: 0;
  }
}

/* Page Header */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: var(--space-lg, 1.25rem);
  flex-wrap: wrap;
}

.header-main {
  min-width: 0;
}

.header-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.header-title-row h1 {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--primary-dark, #2e7d32);
  margin: 0;
  line-height: 1.2;
}

.period-pill {
  font-size: 0.78rem;
  font-weight: 600;
  padding: 3px 10px;
  background: rgba(46, 125, 50, 0.1);
  color: var(--primary-dark, #2e7d32);
  border-radius: 999px;
  border: 1px solid rgba(46, 125, 50, 0.2);
}

.header-subtitle {
  font-size: 0.9rem;
  color: var(--gray-600, #475569);
  margin: 4px 0 0 0;
}

.btn-back-attendance {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  font-size: 0.84rem;
  font-weight: 600;
}

/* Guidance Banner */
.attendance-guidance-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  margin-bottom: var(--space-lg, 1.25rem);
  background: linear-gradient(135deg, rgba(232, 245, 233, 0.95), rgba(200, 230, 201, 0.85));
  border: 1px solid rgba(76, 175, 80, 0.3);
  border-radius: var(--radius-lg, 12px);
}

.banner-icon {
  font-size: 1.8rem;
  flex-shrink: 0;
}

.banner-content {
  min-width: 0;
}

.banner-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 2px 7px;
  background: var(--primary, #2e7d32);
  color: #ffffff;
  border-radius: 4px;
  margin-bottom: 3px;
}

.banner-content h3 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary-dark, #1b5e20);
  margin: 0 0 3px 0;
}

.banner-content p {
  font-size: 0.85rem;
  color: var(--gray-700, #334155);
  margin: 0;
}

/* Locked Period Banner */
.locked-period-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin-bottom: var(--space-lg, 1.25rem);
  background: rgba(254, 243, 199, 0.9);
  border: 1px solid rgba(245, 158, 11, 0.4);
  border-radius: var(--radius-lg, 12px);
}

.locked-icon {
  font-size: 1.4rem;
  flex-shrink: 0;
}

.locked-text strong {
  font-size: 0.9rem;
  color: #92400e;
  display: block;
}

.locked-text p {
  font-size: 0.82rem;
  color: #78350f;
  margin: 2px 0 0 0;
}

/* Quick Metrics Summary (Responsive 4-Cards Grid) */
.kbm-metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: var(--space-lg, 1.25rem);
  width: 100%;
  box-sizing: border-box;
}

@media (min-width: 768px) {
  .kbm-metrics-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }
}

.kbm-metric-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px !important;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: var(--radius-lg, 12px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  min-width: 0;
}

.kbm-metric-card.card-attention {
  border-color: rgba(245, 158, 11, 0.4);
}

.metric-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  flex-shrink: 0;
}

.metric-icon.total {
  background: rgba(46, 125, 50, 0.12);
  color: #2e7d32;
}

.metric-icon.today {
  background: rgba(33, 150, 243, 0.12);
  color: #1976d2;
}

.metric-icon.complete {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
}

.metric-icon.pending {
  background: rgba(245, 158, 11, 0.14);
  color: #d97706;
}

.metric-icon.neutral {
  background: rgba(148, 163, 184, 0.15);
  color: #64748b;
}

.metric-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.metric-label {
  font-size: 0.72rem;
  color: var(--gray-500, #64748b);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.metric-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--gray-800, #1e293b);
  line-height: 1.2;
}

.metric-unit {
  font-size: 0.76rem;
  font-weight: 500;
  color: var(--gray-500, #64748b);
}

.text-success-bold {
  color: #059669 !important;
}

.text-warning-bold {
  color: #d97706 !important;
}

/* Glass Card Common */
.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: var(--radius-xl, 16px);
  padding: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

@media (min-width: 768px) {
  .glass-card {
    padding: var(--space-xl, 1.5rem);
  }
}

/* Main Content Grid: Sticky Sidebar + Main Content */
.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-lg, 1.25rem);
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  align-items: start;
}

@media (min-width: 1024px) {
  .content-grid {
    grid-template-columns: 340px minmax(0, 1fr);
    gap: 1.25rem;
  }

  .kbm-form-sticky-wrap {
    position: sticky;
    top: 20px;
    z-index: 15;
    max-height: calc(100vh - 40px);
    overflow-y: auto;
    padding-right: 2px;
  }

  .kbm-form-sticky-wrap::-webkit-scrollbar {
    width: 4px;
  }

  .kbm-form-sticky-wrap::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }
}

@media (min-width: 1280px) {
  .content-grid {
    grid-template-columns: 360px minmax(0, 1fr);
    gap: 1.5rem;
  }
}

/* Card Header */
.card-header-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: var(--space-md, 1rem);
  padding-bottom: var(--space-sm, 0.5rem);
  border-bottom: 1px solid var(--gray-200, #e2e8f0);
}

.card-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: rgba(46, 125, 50, 0.1);
  color: var(--primary-dark, #2e7d32);
  flex-shrink: 0;
}

.card-header-row h2 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--primary-dark, #2e7d32);
  margin: 0;
  line-height: 1.2;
}

.card-subtitle {
  font-size: 0.78rem;
  color: var(--gray-500, #64748b);
  margin: 2px 0 0 0;
}

/* Form Styles */
.kbm-form {
  min-width: 0;
  width: 100%;
}

.contextual-date-banner {
  margin-bottom: var(--space-md, 1rem);
}

.contextual-badge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(224, 242, 254, 0.85);
  border: 1px solid #bae6fd;
  border-radius: 8px;
  font-size: 0.78rem;
  color: #0369a1;
}

.btn-reset-date {
  background: none;
  border: none;
  color: #0284c7;
  font-size: 0.74rem;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
}

.form-group {
  margin-bottom: var(--space-md, 1rem);
}

.form-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 5px;
  flex-wrap: wrap;
}

.form-label-row label {
  font-weight: 600;
  color: var(--gray-700, #334155);
  font-size: 0.84rem;
  margin: 0;
}

.date-quick-helpers {
  display: flex;
  gap: 4px;
}

.quick-date-btn {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.quick-date-btn:hover {
  background: #e2e8f0;
}

.quick-date-btn.active {
  background: var(--primary, #2e7d32);
  color: #ffffff;
  border-color: var(--primary, #2e7d32);
}

.badge-locked-date {
  font-size: 0.7rem;
  color: #b45309;
  background: #fef3c7;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.form-input {
  width: 100%;
  padding: 9px 11px;
  border: 1px solid var(--gray-300, #cbd5e1);
  border-radius: var(--radius-md, 8px);
  font-size: 0.88rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
  background-color: #ffffff;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary, #2e7d32);
  box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.15);
}

.form-input.input-locked {
  background-color: #f8fafc;
  cursor: not-allowed;
  color: #64748b;
}

.help-text {
  display: block;
  font-size: 0.74rem;
  color: var(--gray-500, #64748b);
  margin-top: 4px;
  line-height: 1.35;
}

.help-text-locked {
  color: #0369a1;
}

.badal-group {
  padding: 8px 10px;
  background: rgba(248, 250, 252, 0.85);
  border: 1px solid var(--gray-200, #e2e8f0);
  border-radius: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 7px;
  font-weight: 500 !important;
  color: var(--gray-700, #334155);
  cursor: pointer;
  font-size: 0.84rem;
}

.checkbox-label input[type="checkbox"] {
  width: 15px;
  height: 15px;
  accent-color: var(--primary-dark, #2e7d32);
  cursor: pointer;
}

.badal-dropdown-wrap {
  margin-top: 5px;
}

/* Alert Box */
.alert {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 9px 12px;
  border-radius: 8px;
  margin-top: var(--space-md, 1rem);
  font-size: 0.82rem;
  font-weight: 500;
  line-height: 1.35;
}

.alert-icon {
  flex-shrink: 0;
  margin-top: 1px;
}

.alert-content {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.alert-link-action {
  font-weight: 700;
  color: #b91c1c;
  text-decoration: underline;
  font-size: 0.78rem;
}

.alert-success {
  background: rgba(46, 125, 50, 0.08);
  color: #1b5e20;
  border: 1px solid rgba(46, 125, 50, 0.2);
}

.alert-error {
  background: rgba(239, 68, 68, 0.08);
  color: #b91c1c;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.alert-warning {
  background: rgba(245, 158, 11, 0.1);
  color: #92400e;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

/* Submit Button */
.submit-kbm-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 11px 16px;
  border: none;
  border-radius: 9px;
  font-weight: 600;
  font-size: 0.92rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #cbd5e1;
  color: #64748b;
  margin-top: var(--space-md, 1rem);
}

.submit-kbm-btn.is-eligible {
  background: var(--primary-gradient, linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #388e3c 100%));
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(46, 125, 50, 0.25);
}

.submit-kbm-btn.is-eligible:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(46, 125, 50, 0.35);
}

.submit-kbm-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

/* History Wrapper & Section */
.kbm-history-wrap {
  min-width: 0;
  width: 100%;
}

.kbm-history {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.history-card-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: var(--space-md, 1rem);
  padding-bottom: var(--space-sm, 0.5rem);
  border-bottom: 1px solid var(--gray-200, #e2e8f0);
}

.history-title-wrap h2 {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--primary-dark, #2e7d32);
  margin: 0;
  line-height: 1.2;
}

.history-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

@media (max-width: 640px) {
  .history-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
}

/* Filter Pills */
.filter-pills-row {
  display: flex;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
  overflow-x: auto;
  max-width: 100%;
}

.pill-tab-btn {
  padding: 5px 9px;
  font-size: 0.76rem;
  font-weight: 600;
  border: none;
  background: transparent;
  color: #64748b;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.pill-tab-btn:hover {
  color: #1e293b;
}

.pill-tab-btn.active {
  background: #ffffff;
  color: var(--primary-dark, #1b5e20);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.pill-tab-pending.active {
  color: #b45309;
}

.pill-tab-complete.active {
  color: #15803d;
}

.history-filter-wrapper {
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .history-filter-wrapper {
    width: 100%;
  }
}

.filter-select {
  padding: 5px 10px;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid var(--gray-300, #cbd5e1);
  border-radius: 7px;
  background: #ffffff;
  color: var(--gray-700, #334155);
  outline: none;
  cursor: pointer;
  width: 100%;
  box-sizing: border-box;
}

.filter-select:focus {
  border-color: var(--primary);
}

/* Empty State */
.empty-feed-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 36px 16px;
  text-align: center;
}

.empty-icon {
  font-size: 2.2rem;
  margin-bottom: 6px;
}

.empty-feed-state h3 {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--gray-700, #334155);
  margin: 0 0 4px 0;
}

/* ============================================================
   STRUCTURED SESSION CARDS (NEAT, UNBREAKABLE & ZERO OVERFLOW)
   ============================================================ */
.session-feed-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  box-sizing: border-box;
}

.session-structured-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  background: #ffffff;
  border: 1px solid var(--gray-200, #e2e8f0);
  border-left: 5px solid #cbd5e1;
  border-radius: var(--radius-lg, 12px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
}

.session-structured-card:hover {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
}

.session-structured-card.is-complete {
  border-left-color: #2e7d32;
}

.session-structured-card.is-pending {
  border-left-color: #f59e0b;
}

/* Card Header: 2 Organized Rows */
.card-meta-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--gray-100, #f1f5f9);
  width: 100%;
  box-sizing: border-box;
}

/* Row 1: Date & Slot (Left) + Delete (Right) */
.meta-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
}

.meta-date-slot {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}

.date-badge-box {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 3px 8px;
  border-radius: 6px;
}

.day-short {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
}

.date-main {
  font-size: 0.88rem;
  font-weight: 700;
  color: #1e293b;
}

.slot-pill {
  font-size: 0.78rem;
  font-weight: 600;
  color: #0369a1;
  background: #e0f2fe;
  padding: 3px 8px;
  border-radius: 6px;
  white-space: nowrap;
}

.slot-time-text {
  color: #0284c7;
  font-weight: 500;
}

/* Delete Action Button in Header */
.meta-actions-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.btn-delete-card {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  color: #e11d48;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.74rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-delete-card:hover {
  background: #ffe4e6;
  border-color: #fda4af;
}

.delete-text-btn {
  display: inline;
}

.locked-icon-pill {
  font-size: 0.78rem;
  color: #94a3b8;
}

/* Row 2: Tag Badges Line */
.meta-tags-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  width: 100%;
}

.level-pill {
  font-size: 0.76rem;
  font-weight: 700;
  background: rgba(46, 125, 50, 0.1);
  color: var(--primary-dark, #2e7d32);
  padding: 2px 8px;
  border-radius: 6px;
  white-space: nowrap;
}

.activity-pill {
  font-size: 0.74rem;
  color: #475569;
  background: #f1f5f9;
  padding: 2px 7px;
  border-radius: 6px;
  font-weight: 500;
  white-space: nowrap;
}

.meeting-num {
  font-weight: 700;
  color: #1e293b;
  margin-left: 2px;
}

.rpp-pill {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
}

.rpp-maju {
  background: #dcfce7;
  color: #15803d;
}

.rpp-tetap {
  background: #fef3c7;
  color: #b45309;
}

.badal-pill {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  background: #ede9fe;
  color: #6d28d9;
  white-space: nowrap;
}

/* Card Body: 2 Full-Width Stacked Task Blocks */
.card-tasks-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
}

.task-block {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 9px;
  border: 1px solid var(--gray-200, #e2e8f0);
  background: #fafafa;
  transition: all 0.15s ease;
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
}

.task-block.task-complete {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.task-block.task-pending {
  background: #fffbeb;
  border-color: #fde68a;
}

@media (max-width: 520px) {
  .task-block {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
}

.task-info-side {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.task-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.task-title-row h4 {
  font-size: 0.86rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.task-status-badge {
  font-size: 0.66rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  padding: 1px 6px;
  border-radius: 4px;
}

.task-complete .task-status-badge {
  background: #dcfce7;
  color: #15803d;
}

.task-pending .task-status-badge {
  background: #fef3c7;
  color: #b45309;
}

.task-summary-text {
  font-size: 0.76rem;
  color: #64748b;
  margin: 0;
  line-height: 1.3;
}

.task-complete .task-summary-text {
  color: #166534;
}

.task-pending .task-summary-text {
  color: #92400e;
}

/* Task Action Buttons */
.btn-task-action {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 12px;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 7px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

@media (max-width: 520px) {
  .btn-task-action {
    width: 100%;
    justify-content: center;
  }
}

/* Primary when still pending */
.btn-task-submit {
  background: #2e7d32;
  color: #ffffff;
  border: 1px solid #2e7d32;
  box-shadow: 0 2px 6px rgba(46, 125, 50, 0.2);
}

.btn-task-submit:hover {
  background: #1b5e20;
  border-color: #1b5e20;
}

/* Soft edit when already complete */
.btn-task-edit {
  background: #ffffff;
  color: #334155;
  border: 1px solid #cbd5e1;
}

.btn-task-edit:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
  color: #0f172a;
}

/* Modals */
.modal-overlay,
.session-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}

.delete-modal-card {
  max-width: 440px;
  width: 100%;
  background: #ffffff !important;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-xl, 16px);
  padding: 24px;
}

.modal-danger-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.danger-icon {
  font-size: 1.6rem;
}

.modal-danger-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #b91c1c;
  margin: 0;
}

.modal-danger-body p {
  color: var(--gray-700, #334155);
  font-size: 0.92rem;
  line-height: 1.5;
  margin: 0;
}

.modal-danger-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.session-modal {
  max-width: 480px;
  width: 100%;
  background: #ffffff !important;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-xl, 16px);
  padding: 28px;
  text-align: center;
}

.modal-icon-wrap {
  font-size: 2.8rem;
  margin-bottom: 8px;
}

.session-modal h2 {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--primary-dark, #2e7d32);
  margin: 0 0 8px 0;
}

.modal-desc {
  font-size: 0.92rem;
  color: var(--gray-600, #475569);
  margin: 0 0 16px 0;
}

.modal-instruction-box {
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid var(--gray-200, #e2e8f0);
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 20px;
  text-align: left;
}

.instruction-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  font-size: 0.88rem;
  color: var(--gray-800, #1e293b);
}

.instruction-text {
  font-size: 0.84rem;
  color: var(--gray-600, #475569);
  margin: 0;
}

.modal-action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-action-flow {
  width: 100%;
  padding: 10px 16px;
  font-weight: 600;
  font-size: 0.92rem;
  justify-content: center;
}

.btn-dismiss-modal {
  background: none;
  border: none;
  color: var(--gray-500, #64748b);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 4px;
  padding: 6px;
}

.btn-dismiss-modal:hover {
  color: var(--gray-800, #1e293b);
  text-decoration: underline;
}

/* Loading & Spinners */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  gap: 12px;
  color: var(--gray-600);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(46, 125, 50, 0.15);
  border-top-color: #2e7d32;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.inline-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
