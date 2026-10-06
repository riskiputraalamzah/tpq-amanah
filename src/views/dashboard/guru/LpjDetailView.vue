<template>
  <div class="lpj-detail-view">
    <!-- Top Header -->
    <header class="page-header">
      <div class="header-main">
        <div class="header-title-row">
          <h1>LPJ {{ periodLabel(report.period) }}</h1>
          <span class="status-pill-header" :class="statusBadgeClass(report.status)">
            {{ statusIcon(report.status) }} {{ statusLabel(report.status) }}
          </span>
        </div>
        <p class="header-subtitle">
          Rekap kelengkapan bulanan &bull; <strong>{{ guruName }}</strong>
        </p>
      </div>

      <button type="button" class="btn btn-secondary btn-back-header" @click="backLabel">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        <span>{{ isAdmin ? "Kembali ke Rekap LPJ" : "Kembali ke LPJ Bulanan" }}</span>
      </button>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="glass-card loading-card">
      <SkeletonLoader type="title" />
      <SkeletonLoader type="paragraph" />
      <div class="skeleton-grid mt-4">
        <SkeletonLoader type="card" height="180px" />
        <SkeletonLoader type="card" height="180px" />
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="glass-card error-card">
      <div class="alert alert-error">
        <strong>⚠️ Gagal Memuat:</strong> {{ loadError }}
      </div>
      <button type="button" class="btn btn-primary mt-4" @click="fetchData">
        Coba Lagi
      </button>
    </div>

    <!-- Main Content -->
    <template v-else>
      <div class="lpj-layout">
        <!-- Left Side: Summary, Completeness Meter & Workflow Actions -->
        <aside class="lpj-sidebar">
          <!-- Summary Card -->
          <section class="glass-card summary-card">
            <div class="card-header-clean">
              <span class="header-icon">📊</span>
              <h2>Ringkasan Laporan</h2>
            </div>

            <dl class="context-grid">
              <div class="context-item">
                <dt>Periode</dt>
                <dd>{{ periodLabel(report.period) }}</dd>
              </div>
              <div class="context-item">
                <dt>Guru</dt>
                <dd class="guru-name-val">{{ guruName }}</dd>
              </div>
              <div class="context-item">
                <dt>Hari Operasional</dt>
                <dd>{{ completeness?.totalExpectedDays ?? "-" }} Hari</dd>
              </div>
              <div class="context-item">
                <dt>Hari KBM Valid</dt>
                <dd class="text-success font-bold">{{ teachingDays }} Hari</dd>
              </div>
              <div class="context-item">
                <dt>Aktivitas Khusus</dt>
                <dd class="text-info">{{ specialDays }} Hari</dd>
              </div>
              <div class="context-item">
                <dt>Izin / Tidak Hadir</dt>
                <dd class="text-warning">{{ absentDays }} Hari</dd>
              </div>
            </dl>
          </section>

          <!-- Completeness Meter Card -->
          <section class="glass-card completeness-card">
            <div class="card-header-clean">
              <span class="header-icon">🎯</span>
              <h2>Kelengkapan LPJ</h2>
            </div>

            <div class="completeness-hero">
              <div class="pct-circle">
                <strong class="completeness-pct">{{ completeness ? `${completeness.percentage}%` : "0%" }}</strong>
              </div>
              <div class="pct-meta">
                <span class="pct-status" :class="completeness?.percentage === 100 ? 'text-success' : 'text-warning'">
                  {{ completeness?.percentage === 100 ? "Lengkap 100%" : "Belum Lengkap" }}
                </span>
                <p class="pct-desc text-muted">
                  {{ completeness ? `${completeness.coveredDays} dari ${completeness.totalExpectedDays} hari terpenuhi` : "Menghitung data..." }}
                </p>
              </div>
            </div>

            <div
              v-if="completeness"
              class="progress-track"
              role="progressbar"
              :aria-valuenow="completeness.percentage"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div
                class="progress-fill"
                :class="{ 'fill-complete': completeness.percentage === 100 }"
                :style="{ width: completeness.percentage + '%' }"
              />
            </div>

            <div class="stats-pills-row mt-4">
              <div class="stat-mini-pill pill-covered">
                <span class="stat-lbl">Terpenuhi:</span>
                <strong>{{ completeness?.coveredDays ?? 0 }} hari</strong>
              </div>
              <div class="stat-mini-pill pill-missing">
                <span class="stat-lbl">Kurang:</span>
                <strong>{{ completeness?.missingDays ?? 0 }} hari</strong>
              </div>
            </div>
          </section>

          <!-- Action & Submission Card -->
          <section class="glass-card workflow-card">
            <div class="card-header-clean">
              <span class="header-icon">⚡</span>
              <h2>Pusat Aksi &amp; Status</h2>
            </div>

            <div v-if="actionMessage" class="alert mb-3" :class="actionOk ? 'alert-success' : 'alert-error'">
              {{ actionMessage }}
            </div>

            <!-- Guru Workflow Status -->
            <div v-if="!isAdmin" class="workflow-content">
              <div v-if="report.status === 'draft' && completeness && completeness.percentage < 100" class="status-box box-warning">
                <div class="box-icon">⚠️</div>
                <div class="box-text">
                  <strong>LPJ Belum Lengkap</strong>
                  <p>{{ incompleteMessage(completeness) }}. Lengkapi seluruh sesi dan presensi sebelum mengajukan.</p>
                </div>
              </div>

              <div v-else-if="report.status === 'draft'" class="status-box box-success">
                <div class="box-icon">🎉</div>
                <div class="box-text">
                  <strong>Semua Hari Terpenuhi!</strong>
                  <p>Administrasi LPJ bulan ini sudah 100% lengkap dan siap diajukan untuk disetujui Admin.</p>
                </div>
              </div>

              <div v-else-if="report.status === 'submitted'" class="status-box box-info">
                <div class="box-icon">⏳</div>
                <div class="box-text">
                  <strong>Menunggu Persetujuan Admin</strong>
                  <p>Laporan telah diajukan. Seluruh data terkunci dan sedang diverifikasi oleh Admin.</p>
                </div>
              </div>

              <div v-else-if="report.status === 'approved'" class="status-box box-approved">
                <div class="box-icon">✅</div>
                <div class="box-text">
                  <strong>LPJ Telah Disetujui</strong>
                  <p>Laporan telah disahkan resmi oleh Admin TPQ Amanah.</p>
                </div>
              </div>

              <button
                v-if="report.status === 'draft'"
                type="button"
                class="btn btn-primary btn-submit w-full mt-3"
                :disabled="!canSubmit || submitting"
                @click="submit"
              >
                <span v-if="submitting" class="inline-spinner mr-2"></span>
                <span>{{ submitting ? "Mengajukan..." : "🚀 Ajukan LPJ ke Admin" }}</span>
              </button>
            </div>

            <!-- Admin Workflow Actions -->
            <div v-if="isAdmin" class="workflow-content">
              <div v-if="report.status === 'submitted'" class="status-box box-info mb-3">
                <div class="box-icon">📋</div>
                <div class="box-text">
                  <strong>Verifikasi Laporan Guru</strong>
                  <p>Silakan tinjau rincian harian di sebelah kanan. Pastikan materi jurnal dan absensi santri sudah sesuai.</p>
                </div>
              </div>

              <div v-if="report.status === 'draft'" class="status-box box-warning mb-3">
                <div class="box-icon">📝</div>
                <div class="box-text">
                  <strong>Status Draft</strong>
                  <p>Guru masih dalam proses melengkapi administrasi bulanan.</p>
                </div>
              </div>

              <div v-if="report.status === 'approved'" class="status-box box-approved mb-3">
                <div class="box-icon">✅</div>
                <div class="box-text">
                  <strong>Laporan Sudah Disetujui</strong>
                  <p>Laporan LPJ guru ini telah resmi disetujui.</p>
                </div>
              </div>

              <div class="admin-buttons-stack">
                <button
                  v-if="report.status === 'submitted'"
                  type="button"
                  class="btn btn-primary btn-action-admin"
                  :disabled="acting"
                  @click="approve"
                >
                  <span v-if="acting" class="inline-spinner mr-2"></span>
                  <span>✅ Setujui Laporan LPJ</span>
                </button>

                <button
                  v-if="report.status === 'submitted' || report.status === 'approved'"
                  type="button"
                  class="btn btn-outline-danger btn-action-admin"
                  :disabled="acting"
                  @click="reopen"
                >
                  <span v-if="acting" class="inline-spinner mr-2"></span>
                  <span>↩️ Kembalikan ke Draft (Minta Revisi)</span>
                </button>
              </div>
            </div>

            <!-- SPTJM Document Navigation -->
            <button
              type="button"
              class="btn btn-secondary w-full mt-3 btn-sptjm-link"
              @click="router.push(`/dashboard/lpj/${reportId}/sptjm`)"
            >
              <span>📄 Lihat Kesiapan SPTJM</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </section>

          <!-- Signed Document Upload (Admin Only) -->
          <SignedDocumentUpload v-if="isAdmin && report" :report-id="reportId" />
        </aside>

        <!-- Right Side: Daily Breakdown with Expandable Detailed Inspection -->
        <main class="lpj-main">
          <section class="glass-card days-container">
            <!-- Filter & Toolbar -->
            <div class="days-toolbar">
              <div class="toolbar-left">
                <h2>Rincian Harian</h2>
                <span class="count-badge">{{ filteredDays.length }} dari {{ days.length }} Hari</span>
              </div>

              <div class="toolbar-right">
                <!-- Filter Tabs -->
                <div class="filter-tabs" role="tablist">
                  <button
                    type="button"
                    class="tab-btn"
                    :class="{ active: filterTab === 'all' }"
                    @click="filterTab = 'all'"
                  >
                    Semua ({{ days.length }})
                  </button>
                  <button
                    type="button"
                    class="tab-btn tab-btn-covered"
                    :class="{ active: filterTab === 'covered' }"
                    @click="filterTab = 'covered'"
                  >
                    Lengkap ({{ coveredCount }})
                  </button>
                  <button
                    type="button"
                    class="tab-btn tab-btn-missing"
                    :class="{ active: filterTab === 'missing' }"
                    @click="filterTab = 'missing'"
                  >
                    Belum Lengkap ({{ missingCount }})
                  </button>
                </div>

                <!-- Accordion Quick Toggle -->
                <button
                  type="button"
                  class="btn-toggle-all"
                  @click="toggleAllDays"
                  :title="isAllExpanded ? 'Tutup Semua Rincian' : 'Buka Semua Rincian'"
                >
                  {{ isAllExpanded ? "Tutup Semua ▴" : "Buka Semua ▾" }}
                </button>
              </div>
            </div>

            <!-- Empty State -->
            <div v-if="filteredDays.length === 0" class="empty-state">
              <div class="empty-icon">📂</div>
              <h3>Tidak ada hari operasional</h3>
              <p class="text-muted">Tidak ditemukan hari yang cocok dengan filter yang dipilih.</p>
              <button
                v-if="filterTab !== 'all'"
                type="button"
                class="btn btn-secondary btn-sm mt-3"
                @click="filterTab = 'all'"
              >
                Tampilkan Semua Hari
              </button>
            </div>

            <!-- Daily Cards List -->
            <div v-else class="days-cards-list">
              <article
                v-for="day in filteredDays"
                :key="day.date"
                class="day-card"
                :class="[
                  dayBorderClass(day),
                  { 'is-expanded': isExpanded(day.date) }
                ]"
              >
                <!-- Day Header Row (Clickable) -->
                <div class="day-card-header" @click="toggleDay(day.date)">
                  <div class="day-header-left">
                    <div class="date-badge-box">
                      <span class="day-name">{{ getDayName(day.date) }}</span>
                      <strong class="day-num">{{ getDayNumber(day.date) }}</strong>
                    </div>

                    <div class="day-meta-info">
                      <div class="day-title-row">
                        <h3 class="day-full-date">{{ formatDay(day.date) }}</h3>
                        <span class="badge" :class="dayBadgeClass(day)">
                          {{ dayLabel(day) }}
                        </span>
                      </div>
                      <p class="day-summary-text text-muted">{{ day.note }}</p>
                    </div>
                  </div>

                  <div class="day-header-right">
                    <!-- Status Indicator -->
                    <span
                      class="day-status-pill"
                      :class="day.isCovered ? (isAbsenceDay(day) ? 'pill-permitted' : 'pill-complete') : 'pill-incomplete'"
                    >
                      <span class="dot"></span>
                      <span>{{ day.isCovered ? "Lengkap" : "Belum Lengkap" }}</span>
                    </span>

                    <!-- Quick Action if Missing & Draft -->
                    <router-link
                      v-if="!day.isCovered && !isLockedForTeacher && dayAction(day).kind === 'link'"
                      :to="dayAction(day).to"
                      class="btn btn-primary btn-sm btn-quick-action"
                      @click.stop
                    >
                      {{ dayAction(day).label }}
                    </router-link>

                    <!-- Accordion Toggle Chevron -->
                    <button
                      type="button"
                      class="btn-expand-chevron"
                      :aria-expanded="isExpanded(day.date)"
                      :aria-label="'Buka detail ' + day.date"
                      @click.stop="toggleDay(day.date)"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        class="chevron-icon"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Expanded Content (Detailed Inspection & Management) -->
                <transition name="expand">
                  <div v-if="isExpanded(day.date)" class="day-card-body">
                    <!-- Section 1: Teacher Attendance Verification -->
                    <div class="detail-section section-attendance">
                      <div class="section-title-bar">
                        <span class="sec-icon">🕒</span>
                        <h4>Presensi Kehadiran Guru</h4>
                      </div>

                      <div class="att-detail-box">
                        <div class="att-status-line">
                          <span class="label">Status Kehadiran:</span>
                          <strong :class="attStatusColor(getTeacherAtt(day.date)?.status || day.attendanceStatus)">
                            {{ formatAttStatus(getTeacherAtt(day.date)?.status || day.attendanceStatus) }}
                          </strong>
                          <span v-if="getTeacherAtt(day.date)?.createdAt || getTeacherAtt(day.date)?.date" class="att-time-tag">
                            {{ formatWibTime(getTeacherAtt(day.date)?.createdAt || getTeacherAtt(day.date)?.date) }}
                          </span>
                        </div>

                        <div v-if="getTeacherAtt(day.date)?.notes" class="att-notes-box">
                          <span class="label">Catatan Guru:</span>
                          <span class="note-val">"{{ getTeacherAtt(day.date)?.notes }}"</span>
                        </div>

                        <div v-if="isAbsenceDay(day)" class="absence-alert-box">
                          ℹ️ Guru tercatat <strong>{{ dayLabel(day) }}</strong> pada tanggal ini. Hari ini sah sebagai administrasi lengkap tanpa sesi KBM.
                        </div>
                      </div>
                    </div>

                    <!-- Section 2: Teaching Sessions (KBM & Jurnal) -->
                    <div class="detail-section section-sessions">
                      <div class="section-title-bar">
                        <span class="sec-icon">📖</span>
                        <h4>
                          Sesi Pembelajaran ({{ getSessions(day.date).length }} Sesi)
                        </h4>
                      </div>

                      <!-- If Sessions Exist -->
                      <div v-if="getSessions(day.date).length > 0" class="sessions-stack">
                        <div
                          v-for="(session, sIdx) in getSessions(day.date)"
                          :key="session.id"
                          class="session-inner-card"
                        >
                          <!-- Session Header -->
                          <div class="session-card-top">
                            <div class="session-main-badges">
                              <span class="class-badge">{{ session.className || 'Jilid' }}</span>
                              <span class="slot-badge">{{ session.slotName || session.sessionSlotId }}</span>
                              <span v-if="session.meetingNumber" class="rpp-badge">
                                Pertemuan Ke-{{ session.meetingNumber }}
                                <span v-if="session.advancesRpp" class="rpp-sub">(Maju)</span>
                              </span>
                              <span v-if="session.substituteFor" class="badge badge-info">
                                Guru Badal
                              </span>
                            </div>

                            <!-- Lock or Manage Actions -->
                            <div class="session-actions-top">
                              <!-- If Draft & Teacher/Admin can manage -->
                              <template v-if="canManageSession">
                                <router-link
                                  :to="`/dashboard/kbm/${session.id}/jurnal`"
                                  class="btn btn-secondary btn-xs btn-action-kbm"
                                  title="Ubah Materi Jurnal"
                                >
                                  ✏️ Jurnal
                                </router-link>
                                <router-link
                                  :to="`/dashboard/kbm/${session.id}/absensi`"
                                  class="btn btn-secondary btn-xs btn-action-kbm"
                                  title="Ubah Absensi Santri"
                                >
                                  📋 Absensi
                                </router-link>
                                <button
                                  type="button"
                                  class="btn btn-outline-danger btn-xs btn-delete-session"
                                  title="Hapus Sesi Mengajar"
                                  @click="openDeleteModal(session, day)"
                                >
                                  🗑️ Hapus
                                </button>
                              </template>

                              <!-- If Locked -->
                              <span v-else class="locked-badge" title="Data terkunci karena LPJ sedang diajukan/disetujui">
                                🔒 Terkunci
                              </span>
                            </div>
                          </div>

                          <!-- Session Activity & Journal Material -->
                          <div class="session-content-grid">
                            <div class="journal-box">
                              <div class="journal-box-lbl">
                                <span>Materi Pembelajaran (Jurnal):</span>
                              </div>
                              <div class="journal-box-val">
                                <p>{{ session.journal?.material || "Belum ada materi jurnal." }}</p>
                              </div>
                              <div v-if="session.journal?.notes" class="journal-notes-row">
                                <span class="notes-lbl">Catatan Tambahan:</span>
                                <em>"{{ session.journal.notes }}"</em>
                              </div>
                            </div>

                            <!-- Student Attendance Summary for Session -->
                            <div class="student-tally-box">
                              <div class="tally-header">
                                <span class="tally-title">Kehadiran Santri:</span>
                                <strong class="tally-pct">
                                  {{ studentAttendanceRate(session.studentAttendances) }}% Hadir
                                </strong>
                              </div>

                              <!-- Chips Summary -->
                              <div class="tally-chips">
                                <span class="tally-chip chip-hadir">
                                  {{ getTally(session.studentAttendances).hadir }} Hadir
                                </span>
                                <span v-if="getTally(session.studentAttendances).izin > 0" class="tally-chip chip-izin">
                                  {{ getTally(session.studentAttendances).izin }} Izin
                                </span>
                                <span v-if="getTally(session.studentAttendances).sakit > 0" class="tally-chip chip-sakit">
                                  {{ getTally(session.studentAttendances).sakit }} Sakit
                                </span>
                                <span v-if="getTally(session.studentAttendances).alfa > 0" class="tally-chip chip-alfa">
                                  {{ getTally(session.studentAttendances).alfa }} Alfa
                                </span>
                              </div>

                              <!-- Toggle Student Roster View -->
                              <button
                                v-if="(session.studentAttendances || []).length > 0"
                                type="button"
                                class="btn-toggle-roster"
                                @click="toggleStudentRoster(session.id)"
                              >
                                {{ isRosterExpanded(session.id) ? "Sembunyikan Daftar Santri ▴" : `Lihat ${session.studentAttendances.length} Santri ▾` }}
                              </button>

                              <!-- Expandable Student Roster List -->
                              <div v-if="isRosterExpanded(session.id)" class="roster-inline-drawer">
                                <div class="roster-grid">
                                  <div
                                    v-for="(st, idx) in session.studentAttendances"
                                    :key="st.santriId || idx"
                                    class="student-item-chip"
                                    :class="'st-' + (st.status || 'hadir')"
                                  >
                                    <span class="st-name">{{ st.name }}</span>
                                    <span class="st-status-tag">{{ st.status || 'hadir' }}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- If No Sessions on this day -->
                      <div v-else-if="!isAbsenceDay(day)" class="empty-sessions-box">
                        <p class="empty-text text-muted">
                          Belum ada sesi pembelajaran yang tercatat pada tanggal ini.
                        </p>
                        <router-link
                          v-if="!isLockedForTeacher"
                          :to="`/dashboard/kbm?date=${day.date}`"
                          class="btn btn-primary btn-sm btn-input-kbm mt-2"
                        >
                          ➕ Input Sesi KBM Sekarang
                        </router-link>
                      </div>
                    </div>
                  </div>
                </transition>
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
              Apakah Anda yakin ingin menghapus sesi <strong>{{ deletingSession.className }}</strong> ({{ deletingSession.slotName }}) pada <strong>{{ formatDay(deletingSessionDay?.date) }}</strong>?
            </p>
            <div class="alert alert-warning mt-3">
              Materi jurnal dan presensi santri pada sesi ini akan dihapus. Hari ini akan kembali dihitung sebagai belum lengkap.
            </div>
          </div>

          <div class="modal-danger-actions">
            <button
              type="button"
              class="btn btn-secondary"
              :disabled="deletingLoading"
              @click="closeDeleteModal"
            >
              Batal
            </button>
            <button
              type="button"
              class="btn btn-danger"
              :disabled="deletingLoading"
              @click="confirmDeleteSession"
            >
              <span v-if="deletingLoading" class="inline-spinner mr-2"></span>
              <span>{{ deletingLoading ? "Menghapus..." : "Ya, Hapus Sesi" }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import api from "@/services/api";
import { useToast } from "@/composables/useToast";
import SkeletonLoader from "@/components/SkeletonLoader.vue";
import SignedDocumentUpload from "@/components/SignedDocumentUpload.vue";
import {
  periodLabel,
  statusLabel,
  incompleteMessage,
  resolveDayAction,
} from "@/utils/lpjState";

const { success: showSuccess, error: showError, warning: showWarning } = useToast();

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const reportId = route.params.id;

const isAdmin = computed(() => authStore.user?.role === "admin");
const loading = ref(true);
const loadError = ref("");
const report = ref({});
const completeness = ref(null);
const sessionsByDate = ref({});
const attendancesByDate = ref({});
const teachers = ref([]);
const submitting = ref(false);
const acting = ref(false);
const actionMessage = ref("");
const actionOk = ref(false);

// Filter & Accordion UI State
const filterTab = ref("all");
const expandedDates = ref(new Set());
const expandedRosters = ref(new Set());

// Delete Modal State
const deletingSession = ref(null);
const deletingSessionDay = ref(null);
const deletingLoading = ref(false);

const isLockedForTeacher = computed(() => {
  return report.value.status === "submitted" || report.value.status === "approved";
});

const canManageSession = computed(() => {
  if (isAdmin.value) {
    return report.value.status === "draft";
  }
  return report.value.status === "draft";
});

const statusBadgeClass = (status) => {
  if (status === "approved") return "badge-success";
  if (status === "submitted") return "badge-info";
  return "badge-warning";
};

const statusIcon = (status) => {
  if (status === "approved") return "✅";
  if (status === "submitted") return "⏳";
  return "📝";
};

const guruName = computed(() => {
  if (!isAdmin.value) return authStore.user?.displayName || authStore.user?.name || "-";
  const found = teachers.value.find((t) => t.id === report.value.guruId);
  return found ? found.displayName || found.name || report.value.guruId : report.value.guruId || "-";
});

const days = computed(() => completeness.value?.dailyDetails || []);

const coveredCount = computed(() => days.value.filter((d) => d.isCovered).length);
const missingCount = computed(() => days.value.filter((d) => !d.isCovered).length);

const filteredDays = computed(() => {
  if (filterTab.value === "covered") {
    return days.value.filter((d) => d.isCovered);
  }
  if (filterTab.value === "missing") {
    return days.value.filter((d) => !d.isCovered);
  }
  return days.value;
});

const isAllExpanded = computed(() => {
  return filteredDays.value.length > 0 && filteredDays.value.every((d) => expandedDates.value.has(d.date));
});

const toggleAllDays = () => {
  if (isAllExpanded.value) {
    expandedDates.value.clear();
  } else {
    filteredDays.value.forEach((d) => expandedDates.value.add(d.date));
  }
};

const isExpanded = (dateStr) => expandedDates.value.has(dateStr);

const toggleDay = (dateStr) => {
  if (expandedDates.value.has(dateStr)) {
    expandedDates.value.delete(dateStr);
  } else {
    expandedDates.value.add(dateStr);
  }
};

const isRosterExpanded = (sessionId) => expandedRosters.value.has(sessionId);

const toggleStudentRoster = (sessionId) => {
  if (expandedRosters.value.has(sessionId)) {
    expandedRosters.value.delete(sessionId);
  } else {
    expandedRosters.value.add(sessionId);
  }
};

const teachingDays = computed(() =>
  days.value.filter((d) => d.statusClassification === "present_teaching").length,
);

const specialDays = computed(() =>
  days.value.filter((d) => d.statusClassification === "present_special").length,
);

const absentDays = computed(() =>
  days.value.filter((d) => isAbsenceDay(d)).length,
);

const canSubmit = computed(
  () => report.value.status === "draft" && (completeness.value?.percentage ?? 0) === 100,
);

const isAbsenceDay = (day) => {
  const att = String(day.attendanceStatus || "").toLowerCase();
  const cls = String(day.statusClassification || "").toLowerCase();
  const note = String(day.note || "").toLowerCase();
  return (
    ["tidak_hadir", "izin", "sakit", "alfa", "alpa"].includes(att) ||
    ["permitted_absence", "unattended_absence", "unexcused_absence", "absence"].includes(cls) ||
    /status:\s*(tidak\s*hadir|izin|sakit|alpa|alfa)/i.test(note)
  );
};

const dayLabel = (day) => {
  const att = String(day.attendanceStatus || "").toLowerCase();
  const cls = String(day.statusClassification || "").toLowerCase();
  const note = String(day.note || "").toLowerCase();

  if (att === "tidak_hadir" || cls === "unattended_absence" || cls === "absence" || note.includes("status: tidak hadir")) {
    return "Tidak Hadir";
  }
  if (att === "alfa" || att === "alpa" || cls === "unexcused_absence" || note.includes("status: alpa")) {
    return "Alpa";
  }
  if (att === "izin" || att === "sakit" || cls === "permitted_absence" || note.includes("status: izin") || note.includes("status: sakit")) {
    return "Izin / Sakit";
  }
  if (day.statusClassification === "present_teaching") return "Hadir + KBM";
  if (day.statusClassification === "present_special") return "Hadir + Khusus";
  if (day.statusClassification === "present_non_kbm") return "Hadir + Non-KBM";
  return day.isCovered ? "Lengkap" : "Belum lengkap";
};

const dayBorderClass = (day) => {
  if (!day.isCovered) return "border-missing";
  if (isAbsenceDay(day)) return "border-permitted";
  return "border-covered";
};

const dayBadgeClass = (day) => {
  if (isAbsenceDay(day)) return "badge-permitted";
  return day.isCovered ? "badge-success" : "badge-warning";
};

const formatDay = (dateStr) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr || ""));
  if (!m) return String(dateStr);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const getDayName = (dateStr) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr || ""));
  if (!m) return "";
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString("id-ID", {
    weekday: "short",
  });
};

const getDayNumber = (dateStr) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr || ""));
  return m ? Number(m[3]) : "";
};

const dayAction = (day) => resolveDayAction(day, sessionsByDate.value, new Date(), reportId);

const getSessions = (dateStr) => {
  return sessionsByDate.value[dateStr] || [];
};

const getTeacherAtt = (dateStr) => {
  return attendancesByDate.value[dateStr] || null;
};

const formatAttStatus = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "hadir") return "Hadir Tepat Waktu";
  if (s === "izin") return "Izin";
  if (s === "sakit") return "Sakit";
  if (s === "tidak_hadir") return "Tidak Hadir";
  if (s === "alfa" || s === "alpa") return "Alpa";
  return "Belum Mengisi Absen";
};

const attStatusColor = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "hadir") return "text-success font-semibold";
  if (s === "izin" || s === "sakit") return "text-warning font-semibold";
  if (s === "tidak_hadir" || s === "alfa") return "text-danger font-semibold";
  return "text-muted";
};

const formatWibTime = (val) => {
  if (!val) return "";
  try {
    const s = val.seconds ?? val._seconds;
    const d = s !== undefined ? new Date(Number(s) * 1000) : new Date(val);
    if (isNaN(d.getTime())) return "";
    return `Pukul ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} WIB`;
  } catch {
    return "";
  }
};

const getTally = (attendances) => {
  const res = { hadir: 0, izin: 0, sakit: 0, alfa: 0 };
  if (!Array.isArray(attendances)) return res;
  for (const a of attendances) {
    const st = String(a.status || "").toLowerCase();
    if (st === "hadir") res.hadir++;
    else if (st === "izin") res.izin++;
    else if (st === "sakit") res.sakit++;
    else if (st === "alfa" || st === "alpa") res.alfa++;
  }
  return res;
};

const studentAttendanceRate = (attendances) => {
  if (!Array.isArray(attendances) || attendances.length === 0) return 0;
  const t = getTally(attendances);
  return Math.round((t.hadir / attendances.length) * 100);
};

const backLabel = () => {
  router.push(isAdmin.value ? "/dashboard/admin-lpj" : "/dashboard/lpj");
};

const toDateKey = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    const s = value._seconds ?? value.seconds;
    if (s === undefined || s === null) return "";
    const d = new Date(Number(s) * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value).trim());
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
};

const fetchData = async () => {
  loading.value = true;
  loadError.value = "";
  try {
    const reportRes = await api.get(`/ljp/reports/${reportId}`);
    report.value = reportRes.data;

    const compRes = await api.get(`/ljp/reports/${reportId}/completeness?refresh=true`);
    completeness.value = compRes.data;

    const [year, month] = String(report.value.period || "").split("-").map(Number);
    if (year && month) {
      const params = { month, year };
      if (isAdmin.value && report.value.guruId) {
        params.guruId = report.value.guruId;
        try {
          const usersRes = await api.get("/users", { params: { role: "guru" } });
          teachers.value = Array.isArray(usersRes.data) ? usersRes.data : [];
        } catch {
          teachers.value = [];
        }
      }

      const [sessRes, attRes] = await Promise.all([
        api.get("/teaching_sessions", { params }),
        api.get(isAdmin.value ? "/attendance" : "/attendance/me", { params }),
      ]);

      const groupedSess = {};
      for (const s of sessRes.data || []) {
        const key = toDateKey(s.date);
        if (!key) continue;
        if (!groupedSess[key]) groupedSess[key] = [];
        groupedSess[key].push(s);
      }
      sessionsByDate.value = groupedSess;

      const groupedAtt = {};
      for (const a of attRes.data || []) {
        if (a.type === "student_attendance") continue;
        const key = toDateKey(a.date);
        if (!key) continue;
        groupedAtt[key] = a;
      }
      attendancesByDate.value = groupedAtt;

      // Auto-expand the first 2 completed days so user immediately sees rich details
      const firstCovered = days.value.filter((d) => d.isCovered).slice(0, 2);
      firstCovered.forEach((d) => expandedDates.value.add(d.date));
    }
  } catch (error) {
    if (error.response?.status === 404) {
      loadError.value = "Laporan tidak ditemukan.";
    } else if (error.response?.status === 403) {
      loadError.value = "Anda tidak memiliki akses ke laporan ini.";
    } else {
      loadError.value = error.response?.data?.error || "Gagal memuat detail LPJ.";
    }
  } finally {
    loading.value = false;
  }
};

const refresh = async () => {
  const reportRes = await api.get(`/ljp/reports/${reportId}`);
  report.value = reportRes.data;
  const compRes = await api.get(`/ljp/reports/${reportId}/completeness?refresh=true`);
  completeness.value = compRes.data;
};

const submit = async () => {
  submitting.value = true;
  actionMessage.value = "";
  try {
    await api.post(`/ljp/reports/${reportId}/submit`);
    actionOk.value = true;
    actionMessage.value = "LPJ berhasil diajukan ke Admin.";
    showSuccess("LPJ berhasil diajukan ke Admin!");
    await refresh();
    await fetchData();
  } catch (error) {
    actionOk.value = false;
    const details = error.response?.data?.details;
    actionMessage.value = details
      ? `LPJ belum lengkap. ${incompleteMessage(details)}.`
      : error.response?.data?.error || "Gagal mengajukan LPJ.";
    showError(actionMessage.value);
  } finally {
    submitting.value = false;
  }
};

const approve = async () => {
  if (!confirm("Apakah Anda yakin ingin menyetujui laporan LPJ ini? Data akan disahkan dan dikunci.")) return;
  acting.value = true;
  actionMessage.value = "";
  try {
    await api.post(`/ljp/reports/${reportId}/approve`);
    actionOk.value = true;
    actionMessage.value = "Laporan berhasil disetujui.";
    showSuccess("Laporan LPJ berhasil disetujui!");
    await refresh();
    await fetchData();
  } catch (error) {
    actionOk.value = false;
    actionMessage.value = error.response?.data?.error || "Gagal menyetujui laporan.";
    showError(actionMessage.value);
  } finally {
    acting.value = false;
  }
};

const reopen = async () => {
  if (!confirm("Kembalikan laporan ini ke status Draft? Guru akan dapat mengubah kembali rincian KBM dan jurnal.")) return;
  acting.value = true;
  actionMessage.value = "";
  try {
    await api.post(`/ljp/reports/${reportId}/reopen`);
    actionOk.value = true;
    actionMessage.value = "Laporan berhasil dikembalikan ke status Draft.";
    showSuccess("Laporan dikembalikan ke status Draft!");
    await refresh();
    await fetchData();
  } catch (error) {
    actionOk.value = false;
    actionMessage.value = error.response?.data?.error || "Gagal mengembalikan laporan.";
    showError(actionMessage.value);
  } finally {
    acting.value = false;
  }
};

// Delete Session Functions
const openDeleteModal = (session, day) => {
  deletingSession.value = session;
  deletingSessionDay.value = day;
};

const closeDeleteModal = () => {
  if (deletingLoading.value) return;
  deletingSession.value = null;
  deletingSessionDay.value = null;
};

const confirmDeleteSession = async () => {
  if (!deletingSession.value) return;
  deletingLoading.value = true;
  try {
    await api.delete(`/teaching_sessions/${deletingSession.value.id}`);
    showSuccess("Sesi mengajar berhasil dihapus.");
    closeDeleteModal();
    await fetchData();
  } catch (error) {
    showError(error.response?.data?.error || "Gagal menghapus sesi KBM.");
  } finally {
    deletingLoading.value = false;
  }
};

onMounted(fetchData);
</script>

<style scoped>
.lpj-detail-view {
  padding-top: 60px;
}
@media (min-width: 1024px) {
  .lpj-detail-view {
    padding-top: 0;
  }
}

/* Page Header */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: var(--space-xl);
  flex-wrap: wrap;
}
.header-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.header-title-row h1 {
  font-size: 1.85rem;
  font-weight: 800;
  color: var(--primary-dark);
  margin: 0;
  letter-spacing: -0.02em;
}
.header-subtitle {
  font-size: 0.95rem;
  color: var(--gray-600);
  margin-top: 4px;
}
.status-pill-header {
  font-size: 0.8rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.btn-back-header {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  padding: 8px 14px;
}

/* Glass Card Global */
.glass-card {
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: var(--radius-xl);
  padding: var(--space-lg);
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04);
  margin-bottom: var(--space-lg);
}
.card-header-clean {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: var(--space-md);
  padding-bottom: var(--space-xs);
  border-bottom: 1px solid var(--gray-200);
}
.card-header-clean h2 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--primary-dark);
  margin: 0;
}
.header-icon {
  font-size: 1.15rem;
}

/* 2-Column Responsive Layout */
.lpj-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-lg);
  align-items: start;
}
@media (min-width: 1024px) {
  .lpj-layout {
    grid-template-columns: 360px minmax(0, 1fr);
    gap: var(--space-xl);
  }
  .lpj-sidebar {
    position: sticky;
    top: 24px;
    display: flex;
    flex-direction: column;
    gap: 0;
  }
}

/* Context Grid */
.context-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 0;
}
.context-item dt {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--gray-500);
}
.context-item dd {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--gray-800);
  margin: 2px 0 0;
}
.guru-name-val {
  color: var(--primary-dark) !important;
}

/* Completeness Card */
.completeness-hero {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 14px;
}
.pct-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--primary-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
  flex-shrink: 0;
}
.completeness-pct {
  font-size: 1.45rem;
  font-weight: 800;
}
.pct-status {
  font-size: 0.95rem;
  font-weight: 700;
}
.pct-desc {
  font-size: 0.85rem;
  margin: 2px 0 0;
}
.progress-track {
  height: 10px;
  border-radius: 999px;
  background: var(--gray-100);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 999px;
  background: #f59e0b;
  transition: width 0.4s ease;
}
.progress-fill.fill-complete {
  background: #10b981;
}
.stats-pills-row {
  display: flex;
  gap: 8px;
}
.stat-mini-pill {
  flex: 1;
  padding: 8px 10px;
  border-radius: var(--radius-md);
  font-size: 0.82rem;
  display: flex;
  flex-direction: column;
}
.stat-mini-pill strong {
  font-size: 0.95rem;
  margin-top: 2px;
}
.pill-covered {
  background: rgba(16, 185, 129, 0.1);
  color: #065f46;
}
.pill-missing {
  background: rgba(245, 158, 11, 0.1);
  color: #92400e;
}

/* Workflow Action Card */
.status-box {
  display: flex;
  gap: 10px;
  padding: 12px;
  border-radius: var(--radius-md);
  font-size: 0.86rem;
}
.status-box .box-icon {
  font-size: 1.3rem;
  line-height: 1;
}
.status-box strong {
  display: block;
  font-size: 0.9rem;
  margin-bottom: 2px;
}
.status-box p {
  margin: 0;
  line-height: 1.35;
}
.box-warning {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
}
.box-success {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
}
.box-info {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
}
.box-approved {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}
.admin-buttons-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.btn-action-admin {
  width: 100%;
  padding: 10px;
  font-size: 0.9rem;
}
.btn-sptjm-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.88rem;
  padding: 10px 14px;
}

/* Right Side: Days Container */
.days-container {
  padding: var(--space-xl);
}
.days-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: var(--space-lg);
  flex-wrap: wrap;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.toolbar-left h2 {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--primary-dark);
  margin: 0;
}
.count-badge {
  font-size: 0.8rem;
  font-weight: 600;
  background: var(--gray-100);
  color: var(--gray-700);
  padding: 3px 10px;
  border-radius: 999px;
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.filter-tabs {
  display: flex;
  background: var(--gray-100);
  padding: 3px;
  border-radius: var(--radius-lg);
  gap: 2px;
}
.tab-btn {
  background: transparent;
  border: none;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--gray-600);
  padding: 6px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}
.tab-btn:hover {
  color: var(--gray-900);
}
.tab-btn.active {
  background: white;
  color: var(--primary-dark);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}
.btn-toggle-all {
  background: transparent;
  border: 1px solid var(--gray-300);
  color: var(--gray-700);
  font-size: 0.82rem;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
}
.btn-toggle-all:hover {
  background: var(--gray-50);
}

/* Day Cards List */
.days-cards-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.day-card {
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  background: white;
  transition: all 0.2s ease;
  overflow: hidden;
}
.day-card:hover {
  border-color: var(--gray-300);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
}
.day-card.border-covered {
  border-left: 5px solid #10b981;
}
.day-card.border-permitted {
  border-left: 5px solid #f59e0b;
  background: #fffdfa;
}
.day-card.border-missing {
  border-left: 5px solid #f97316;
}

/* Day Header */
.day-card-header {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  cursor: pointer;
  user-select: none;
}
.day-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}
.date-badge-box {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.date-badge-box .day-name {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--gray-500);
  line-height: 1;
}
.date-badge-box .day-num {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--primary-dark);
  line-height: 1.1;
}
.day-meta-info {
  min-width: 0;
}
.day-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.day-full-date {
  font-size: 0.98rem;
  font-weight: 750;
  color: var(--gray-900);
  margin: 0;
}
.day-summary-text {
  font-size: 0.84rem;
  margin: 2px 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.day-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.day-status-pill {
  font-size: 0.78rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}
.day-status-pill .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.pill-complete {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}
.pill-complete .dot {
  background: #10b981;
}
.pill-permitted {
  background: rgba(245, 158, 11, 0.15);
  color: #b45309;
}
.pill-permitted .dot {
  background: #f59e0b;
}
.pill-incomplete {
  background: rgba(249, 115, 22, 0.12);
  color: #c2410c;
}
.pill-incomplete .dot {
  background: #f97316;
}
.btn-quick-action {
  white-space: nowrap;
}
.btn-expand-chevron {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--gray-400);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 6px;
  transition: transform 0.2s ease, color 0.2s ease;
}
.day-card.is-expanded .chevron-icon {
  transform: rotate(180deg);
  color: var(--primary);
}

/* Day Card Body (Expanded Detail) */
.day-card-body {
  border-top: 1px solid var(--gray-100);
  padding: 16px;
  background: #fcfdfd;
}
.detail-section {
  margin-bottom: 16px;
}
.detail-section:last-child {
  margin-bottom: 0;
}
.section-title-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}
.section-title-bar h4 {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--gray-700);
  margin: 0;
}
.section-title-bar .sec-icon {
  font-size: 0.95rem;
}

/* Attendance Detail Box */
.att-detail-box {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  padding: 10px 14px;
}
.att-status-line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
  flex-wrap: wrap;
}
.att-status-line .label {
  color: var(--gray-600);
}
.att-time-tag {
  font-size: 0.8rem;
  font-weight: 600;
  background: var(--gray-100);
  color: var(--gray-700);
  padding: 2px 8px;
  border-radius: 4px;
}
.att-notes-box {
  font-size: 0.85rem;
  margin-top: 6px;
  color: var(--gray-600);
}
.absence-alert-box {
  font-size: 0.85rem;
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
  padding: 8px 12px;
  border-radius: 6px;
  margin-top: 8px;
}

/* Sessions Stack */
.sessions-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.session-inner-card {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
}
.session-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.session-main-badges {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.class-badge {
  font-size: 0.8rem;
  font-weight: 750;
  background: rgba(16, 185, 129, 0.15);
  color: #047857;
  padding: 3px 8px;
  border-radius: 6px;
}
.slot-badge {
  font-size: 0.8rem;
  font-weight: 600;
  background: var(--gray-100);
  color: var(--gray-700);
  padding: 3px 8px;
  border-radius: 6px;
}
.rpp-badge {
  font-size: 0.78rem;
  font-weight: 600;
  background: #eff6ff;
  color: #1d4ed8;
  padding: 3px 8px;
  border-radius: 6px;
}
.rpp-sub {
  font-size: 0.72rem;
  opacity: 0.8;
}
.session-actions-top {
  display: flex;
  align-items: center;
  gap: 6px;
}
.btn-xs {
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
}
.btn-outline-danger {
  background: transparent;
  border: 1px solid #ef4444;
  color: #ef4444;
}
.btn-outline-danger:hover:not(:disabled) {
  background: #fef2f2;
}
.locked-badge {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--gray-500);
  background: var(--gray-100);
  padding: 3px 8px;
  border-radius: 4px;
}

/* Session Content Grid */
.session-content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}
@media (min-width: 768px) {
  .session-content-grid {
    grid-template-columns: 3fr 2fr;
  }
}
.journal-box {
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  padding: 10px 12px;
}
.journal-box-lbl {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--gray-600);
  margin-bottom: 4px;
}
.journal-box-val p {
  font-size: 0.88rem;
  color: var(--gray-800);
  margin: 0;
  line-height: 1.45;
  white-space: pre-line;
}
.journal-notes-row {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed var(--gray-200);
  font-size: 0.82rem;
  color: var(--gray-600);
}
.notes-lbl {
  font-weight: 600;
  margin-right: 4px;
}

/* Student Tally Box */
.student-tally-box {
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  padding: 10px 12px;
}
.tally-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.tally-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--gray-600);
}
.tally-pct {
  font-size: 0.84rem;
  color: var(--primary-dark);
}
.tally-chips {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.tally-chip {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
}
.chip-hadir {
  background: #d1fae5;
  color: #065f46;
}
.chip-izin {
  background: #fef3c7;
  color: #92400e;
}
.chip-sakit {
  background: #fee2e2;
  color: #991b1b;
}
.chip-alfa {
  background: #f3f4f6;
  color: #374151;
}
.btn-toggle-roster {
  background: none;
  border: none;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--primary);
  cursor: pointer;
  padding: 2px 0;
  display: block;
}
.btn-toggle-roster:hover {
  text-decoration: underline;
}
.roster-inline-drawer {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--gray-200);
  max-height: 180px;
  overflow-y: auto;
}
.roster-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 4px;
}
.student-item-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.78rem;
  background: white;
  border: 1px solid var(--gray-200);
}
.st-hadir {
  border-left: 3px solid #10b981;
}
.st-izin {
  border-left: 3px solid #f59e0b;
}
.st-sakit {
  border-left: 3px solid #ef4444;
}
.st-alfa {
  border-left: 3px solid #6b7280;
}
.st-status-tag {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: capitalize;
  color: var(--gray-600);
}

.empty-sessions-box {
  background: white;
  border: 1px dashed var(--gray-300);
  border-radius: var(--radius-md);
  padding: 16px;
  text-align: center;
}
.empty-text {
  font-size: 0.88rem;
  margin: 0;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}
.delete-modal-card {
  max-width: 440px;
  width: 100%;
  padding: 24px;
  border-radius: var(--radius-xl);
}
.modal-danger-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.modal-danger-header h3 {
  font-size: 1.25rem;
  font-weight: 800;
  color: #991b1b;
  margin: 0;
}
.danger-icon {
  font-size: 1.5rem;
}
.modal-danger-body p {
  font-size: 0.95rem;
  color: var(--gray-700);
  line-height: 1.5;
  margin: 0;
}
.modal-danger-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
.btn-danger {
  background: #dc2626;
  color: white;
}
.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

/* Utilities */
.w-full {
  width: 100%;
}
.mt-2 { margin-top: 8px; }
.mt-3 { margin-top: 12px; }
.mt-4 { margin-top: 16px; }
.mb-3 { margin-bottom: 12px; }
.mr-2 { margin-right: 8px; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.text-success { color: #059669; }
.text-warning { color: #d97706; }
.text-info { color: #2563eb; }
.text-danger { color: #dc2626; }

.inline-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  vertical-align: middle;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Mobile Media Queries */
@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  .btn-back-header {
    justify-content: center;
  }
  .days-container {
    padding: var(--space-md);
  }
  .days-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .toolbar-right {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-tabs {
    width: 100%;
    justify-content: space-between;
  }
  .tab-btn {
    flex: 1;
    text-align: center;
    padding: 6px 4px;
    font-size: 0.75rem;
  }
  .day-card-header {
    padding: 10px 12px;
  }
  .day-header-left {
    gap: 10px;
  }
  .date-badge-box {
    width: 38px;
    height: 38px;
  }
  .date-badge-box .day-num {
    font-size: 1rem;
  }
  .day-full-date {
    font-size: 0.9rem;
  }
  .day-summary-text {
    font-size: 0.78rem;
  }
  .day-header-right {
    gap: 6px;
  }
  .day-status-pill {
    display: none; /* Hide pill on ultra small screens, border color & badges communicate status */
  }
}
</style>
