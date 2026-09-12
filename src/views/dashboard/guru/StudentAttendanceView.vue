<template>
  <div class="student-attendance-view">
    <header class="page-header">
      <div>
        <h1>Absensi Santri</h1>
        <p>Catat kehadiran santri untuk sesi mengajar yang dipilih</p>
      </div>
      <button type="button" class="btn-link btn-back-kbm" @click="router.push('/dashboard/kbm')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        <span>Kembali ke KBM</span>
      </button>
    </header>

    <!-- Session Workflow Tabs (Seamless Switching) -->
    <nav class="session-nav-tabs" aria-label="Navigasi Sesi">
      <button type="button" class="nav-tab active">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <span>Absensi Santri</span>
        <span class="tab-badge">{{ roster.length }} Santri</span>
      </button>

      <button
        type="button"
        class="nav-tab"
        @click="router.push(`/dashboard/kbm/${sessionId}/jurnal`)"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <span>Jurnal KBM</span>
        <span class="tab-arrow-icon">&rarr;</span>
      </button>
    </nav>

    <div v-if="loading" class="glass-card loading-state">
      <div class="loading-spinner"></div>
      <p>Memuat sesi dan daftar santri...</p>
    </div>

    <div v-else-if="loadError" class="glass-card">
      <div class="alert alert-error">{{ loadError }}</div>
      <p class="mt-2">Pilih sesi dari Riwayat KBM lalu tekan "Isi Absensi Santri".</p>
    </div>

    <template v-else>
      <div class="attendance-layout">
        <!-- Sidebar: Session Context & Realtime Tally -->
        <section class="glass-card session-context">
          <div class="session-card-header">
            <div class="session-icon-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <h2>Detail Sesi</h2>
              <span class="session-date-tag">{{ formatDate(session.date) }}</span>
            </div>
          </div>

          <div class="context-grid">
            <div class="context-item">
              <span class="context-label">Jilid / Marhalah</span>
              <strong class="context-val">{{ levelName }}</strong>
            </div>
            <div class="context-item">
              <span class="context-label">Sesi / Gelombang</span>
              <strong class="context-val">{{ slotName }}</strong>
            </div>
            <div class="context-item">
              <span class="context-label">Pertemuan Ke</span>
              <strong class="context-val">{{ session.meetingNumber ? 'Ke-' + session.meetingNumber : '-' }}</strong>
            </div>
            <div class="context-item">
              <span class="context-label">Aktivitas</span>
              <strong class="context-val">{{ activityName }}</strong>
            </div>
            <div class="context-item context-item-full">
              <span class="context-label">Guru Pengajar</span>
              <div class="teacher-row">
                <strong class="context-val">{{ session.guruName || "-" }}</strong>
                <span v-if="session.substituteFor" class="badge badge-info">Guru Badal</span>
              </div>
            </div>
          </div>

          <!-- Real-time Attendance Tally Widget -->
          <div class="live-tally-box" v-if="isTeaching && roster.length > 0">
            <div class="tally-header">
              <span class="tally-title">Ringkasan Kehadiran</span>
              <span class="tally-percent">{{ attendancePercent }}% Hadir</span>
            </div>

            <div class="tally-progress-track">
              <div
                class="tally-progress-fill"
                :style="{ width: attendancePercent + '%' }"
              ></div>
            </div>

            <div class="tally-chips">
              <div class="tally-chip hadir">
                <span class="dot"></span>
                <span class="label">Hadir:</span>
                <strong class="count">{{ attendanceSummary.hadir }}</strong>
              </div>
              <div class="tally-chip izin">
                <span class="dot"></span>
                <span class="label">Izin:</span>
                <strong class="count">{{ attendanceSummary.izin }}</strong>
              </div>
              <div class="tally-chip sakit">
                <span class="dot"></span>
                <span class="label">Sakit:</span>
                <strong class="count">{{ attendanceSummary.sakit }}</strong>
              </div>
              <div class="tally-chip alfa">
                <span class="dot"></span>
                <span class="label">Alfa:</span>
                <strong class="count">{{ attendanceSummary.alfa }}</strong>
              </div>
            </div>
          </div>
        </section>

        <!-- Main Content: Student Roster -->
        <section v-if="!isTeaching" class="glass-card">
          <div class="alert alert-error">
            Sesi ini bukan sesi mengajar. Absensi santri hanya tersedia untuk sesi mengajar.
          </div>
        </section>

        <section v-else class="glass-card roster-main-card">
          <div class="roster-toolbar">
            <div class="roster-title-box">
              <h2>Daftar Santri ({{ roster.length }})</h2>
              <span class="roster-class-pill">{{ levelName }}</span>
            </div>
            <button
              type="button"
              class="btn btn-secondary btn-all-present"
              :disabled="roster.length === 0 || saving"
              @click="markAllPresent"
              title="Set semua santri menjadi Hadir"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Semua Hadir</span>
            </button>
          </div>

          <div v-if="roster.length === 0" class="alert alert-error">
            Belum ada santri terdaftar pada {{ levelName }}.
          </div>

          <template v-else>
            <!-- Desktop & Tablet Table with Quick Status Chips -->
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th style="width: 50px;">No</th>
                    <th>Nama Santri</th>
                    <th style="min-width: 280px;">Status Kehadiran</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(row, idx) in roster"
                    :key="row.id"
                    :class="'row-status-' + row.status"
                  >
                    <td class="text-center text-muted font-semibold">{{ idx + 1 }}</td>
                    <td>
                      <div class="student-name-cell">
                        <div class="student-avatar" :class="'avatar-' + row.status">
                          {{ getInitials(row.name) }}
                        </div>
                        <span class="student-name">{{ row.name }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="status-action-cell">
                        <!-- Quick 1-Tap Status Selector Segmented Pills -->
                        <div class="status-segmented-control" role="group" :aria-label="'Pilih kehadiran ' + row.name">
                          <button
                            type="button"
                            class="seg-btn seg-hadir"
                            :class="{ active: row.status === 'hadir' }"
                            @click="setStatus(row, 'hadir')"
                          >
                            Hadir
                          </button>
                          <button
                            type="button"
                            class="seg-btn seg-izin"
                            :class="{ active: row.status === 'izin' }"
                            @click="setStatus(row, 'izin')"
                          >
                            Izin
                          </button>
                          <button
                            type="button"
                            class="seg-btn seg-sakit"
                            :class="{ active: row.status === 'sakit' }"
                            @click="setStatus(row, 'sakit')"
                          >
                            Sakit
                          </button>
                          <button
                            type="button"
                            class="seg-btn seg-alfa"
                            :class="{ active: row.status === 'alfa' }"
                            @click="setStatus(row, 'alfa')"
                          >
                            Alfa
                          </button>
                        </div>

                        <!-- Native select fallback / screen reader accessible -->
                        <select
                          v-model="row.status"
                          class="form-input status-select sr-only-custom"
                          :aria-label="'Status kehadiran ' + row.name"
                          @change="onEdit"
                        >
                          <option
                            v-for="opt in statusOptionsFor(row)"
                            :key="opt.value"
                            :value="opt.value"
                          >
                            {{ opt.label }}
                          </option>
                        </select>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Mobile Card Layout -->
            <ul class="roster-cards">
              <li
                v-for="(row, idx) in roster"
                :key="row.id"
                class="roster-card"
                :class="'card-status-' + row.status"
              >
                <div class="roster-card-top">
                  <div class="student-avatar" :class="'avatar-' + row.status">
                    {{ getInitials(row.name) }}
                  </div>
                  <div class="roster-info">
                    <span class="roster-num">#{{ idx + 1 }}</span>
                    <span class="roster-name">{{ row.name }}</span>
                  </div>
                </div>

                <div class="roster-status-segmented">
                  <button
                    type="button"
                    class="seg-btn seg-hadir"
                    :class="{ active: row.status === 'hadir' }"
                    @click="setStatus(row, 'hadir')"
                  >
                    Hadir
                  </button>
                  <button
                    type="button"
                    class="seg-btn seg-izin"
                    :class="{ active: row.status === 'izin' }"
                    @click="setStatus(row, 'izin')"
                  >
                    Izin
                  </button>
                  <button
                    type="button"
                    class="seg-btn seg-sakit"
                    :class="{ active: row.status === 'sakit' }"
                    @click="setStatus(row, 'sakit')"
                  >
                    Sakit
                  </button>
                  <button
                    type="button"
                    class="seg-btn seg-alfa"
                    :class="{ active: row.status === 'alfa' }"
                    @click="setStatus(row, 'alfa')"
                  >
                    Alfa
                  </button>
                </div>

                <label class="roster-status sr-only-custom">
                  <span>Status</span>
                  <select
                    v-model="row.status"
                    class="form-input"
                    :aria-label="'Status kehadiran ' + row.name"
                    @change="onEdit"
                  >
                    <option
                      v-for="opt in statusOptionsFor(row)"
                      :key="opt.value"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </option>
                  </select>
                </label>
              </li>
            </ul>

            <!-- Save Feedback & Status -->
            <div class="save-feedback-area">
              <div v-if="saveStatus !== 'empty'" class="save-status" :class="'save-' + saveStatus">
                <span v-if="saveStatus === 'saved'">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="status-icon">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Tersimpan<span v-if="lastSavedAt"> · Terakhir disimpan {{ lastSavedAt }}</span>
                </span>
                <span v-else-if="saveStatus === 'unsaved'">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="status-icon">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  Ada perubahan belum disimpan
                </span>
                <span v-else-if="saveStatus === 'saving'">
                  <span class="inline-spinner"></span>
                  Menyimpan absensi...
                </span>
                <span v-else-if="saveStatus === 'error'">
                  Gagal menyimpan. Periksa kembali.
                </span>
              </div>

              <div v-if="isFuture" class="alert alert-error">
                Sesi ini berada di masa depan. Absensi santri tidak dapat disimpan.
              </div>

              <div
                v-if="saveMessage"
                class="alert"
                :class="saveOk ? 'alert-success' : 'alert-error'"
              >
                {{ saveMessage }}
              </div>

              <!-- Main Save Action CTA -->
              <button
                type="button"
                class="mt-4 btn btn-primary btn-save-attendance"
                :disabled="!dirty || saving || roster.length === 0 || isFuture"
                @click="save"
              >
                <svg v-if="!saving" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                <span>{{ saveButtonLabel({ saving: saving, justSaved: justSaved }) }}</span>
              </button>
            </div>
          </template>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/services/api";
import {
  formatSessionDateID,
  formatTimeID,
  resolveInitialStatus,
  isSessionFuture,
  applyAllPresent,
  saveButtonLabel,
} from "@/utils/studentAttendanceState";

const STATUS_OPTIONS = [
  { value: "hadir", label: "Hadir" },
  { value: "izin", label: "Izin" },
  { value: "sakit", label: "Sakit" },
  { value: "alfa", label: "Alfa" },
];

const route = useRoute();
const router = useRouter();
const sessionId = route.params.id;

const loading = ref(true);
const loadError = ref("");
const session = ref({});
const sessionSlots = ref([]);
const classes = ref([]);
const roster = ref([]);
const dirty = ref(false);
const saving = ref(false);
const saveMessage = ref("");
const saveOk = ref(false);
const saveStatus = ref("empty");
const lastSavedAt = ref("");
const justSaved = ref(false);
let justSavedTimer = null;

const levelId = computed(() =>
  session.value ? String(session.value.levelId || session.value.classId || "") : "",
);

const levelName = computed(() => {
  const found = classes.value.find((c) => String(c.id) === levelId.value);
  return found ? found.name : session.value.className || "-";
});

const slotName = computed(() => {
  const slot = sessionSlots.value.find((s) => s.id === session.value.sessionSlotId);
  return slot ? `${slot.name} (${slot.startTime} - ${slot.endTime})` : session.value.sessionSlotId || "-";
});

const activityName = computed(() => {
  if (session.value.type === "teaching") return "KBM Normal";
  return session.value.activityName || "Non-KBM";
});

const isTeaching = computed(() =>
  ["teaching", "special_non_kbm"].includes(session.value.type),
);

const isFuture = computed(() => isSessionFuture(session.value.date));

const statusOptionsFor = (row) => {
  if (STATUS_OPTIONS.some((o) => o.value === row.status)) return STATUS_OPTIONS;
  return [{ value: row.status, label: row.status }, ...STATUS_OPTIONS];
};

const formatDate = (val) => formatSessionDateID(val);

const attendanceSummary = computed(() => {
  const s = { total: roster.value.length, hadir: 0, izin: 0, sakit: 0, alfa: 0 };
  for (const r of roster.value) {
    const st = String(r.status || "").toLowerCase();
    if (st === "hadir" || st === "present") s.hadir += 1;
    else if (st === "izin") s.izin += 1;
    else if (st === "sakit") s.sakit += 1;
    else if (st === "alfa" || st === "alpa") s.alfa += 1;
  }
  return s;
});

const attendancePercent = computed(() => {
  if (roster.value.length === 0) return 0;
  return Math.round((attendanceSummary.value.hadir / roster.value.length) * 100);
});

const setStatus = (row, newStatus) => {
  if (row.status === newStatus) return;
  row.status = newStatus;
  onEdit();
};

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const onEdit = () => {
  dirty.value = true;
  saveStatus.value = "unsaved";
  saveMessage.value = "";
};

const markAllPresent = () => {
  roster.value = applyAllPresent(roster.value);
  dirty.value = true;
  saveStatus.value = "unsaved";
  saveMessage.value = "";
};

const fetchData = async () => {
  loading.value = true;
  loadError.value = "";
  try {
    const [sessionRes, slotsRes, classesRes] = await Promise.all([
      api.get(`/teaching_sessions/${sessionId}`),
      api.get("/teaching_sessions/slots"),
      api.get("/classes"),
    ]);
    session.value = sessionRes.data;
    sessionSlots.value = slotsRes.data;
    classes.value = classesRes.data;

    if (["teaching", "special_non_kbm"].includes(session.value.type)) {
      const rosterRes = await api.get("/santri", {
        params: { classId: String(session.value.levelId || session.value.classId || "") },
      });
      const existing = new Map(
        (session.value.studentAttendances || []).map((s) => [s.santriId, s.status]),
      );
      roster.value = rosterRes.data.map((s) => ({
        id: s.id,
        name: s.name,
        status: existing.get(s.id) || "hadir",
      }));
      dirty.value = existing.size === 0 && roster.value.length > 0;
      saveStatus.value = resolveInitialStatus(existing.size, roster.value.length);
      saveMessage.value = "";
    }
  } catch (error) {
    if (error.response?.status === 404) {
      loadError.value = "Sesi tidak ditemukan. Tidak ada sesi yang dipilih.";
    } else if (error.response?.status === 403) {
      loadError.value = "Anda tidak memiliki akses ke sesi ini.";
    } else {
      loadError.value = error.response?.data?.error || "Gagal memuat data absensi.";
    }
  } finally {
    loading.value = false;
  }
};

const save = async () => {
  if (!dirty.value || saving.value) return;
  saving.value = true;
  saveStatus.value = "saving";
  saveMessage.value = "";
  try {
    await api.put(`/teaching_sessions/${sessionId}`, {
      studentAttendances: roster.value.map((row) => ({
        santriId: row.id,
        name: row.name,
        status: row.status,
      })),
    });
    dirty.value = false;
    saveOk.value = true;
    saveStatus.value = "saved";
    lastSavedAt.value = formatTimeID();
    saveMessage.value = "Absensi santri berhasil disimpan.";
    justSaved.value = true;
    if (justSavedTimer) clearTimeout(justSavedTimer);
    justSavedTimer = setTimeout(() => {
      justSaved.value = false;
    }, 2500);
    const sessionRes = await api.get(`/teaching_sessions/${sessionId}`);
    session.value = sessionRes.data;
  } catch (error) {
    saveOk.value = false;
    saveStatus.value = "error";
    saveMessage.value = error.response?.data?.error || "Gagal menyimpan absensi santri.";
  } finally {
    saving.value = false;
  }
};

onMounted(fetchData);
</script>

<style scoped>
.student-attendance-view {
  padding-top: 60px;
}
@media (min-width: 1024px) {
  .student-attendance-view {
    padding-top: 0;
  }
}
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
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
.btn-link {
  background: none;
  border: none;
  color: var(--primary-dark);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  padding: 8px 4px;
}

.btn-back-kbm {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--gray-200, #e5e7eb);
  border-radius: 10px;
  color: var(--primary-dark, #1b5e20);
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.btn-back-kbm:hover {
  background: var(--primary, #2e7d32);
  color: #ffffff;
  border-color: var(--primary, #2e7d32);
  transform: translateX(-3px);
  text-decoration: none;
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.2);
}

/* --- Session Workflow Tabs --- */
.session-nav-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 1.5rem;
  background: rgba(0, 0, 0, 0.04);
  padding: 5px;
  border-radius: 12px;
  width: fit-content;
  max-width: 100%;
  overflow-x: auto;
}

.nav-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 9px;
  border: none;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--gray-600, #4b5563);
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.nav-tab:hover:not(.active) {
  background: rgba(255, 255, 255, 0.65);
  color: var(--gray-900, #111827);
}

.nav-tab.active {
  background: #ffffff;
  color: var(--primary-dark, #1b5e20);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  font-weight: 700;
}

.tab-badge {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  background: rgba(46, 125, 50, 0.12);
  color: #1b5e20;
  font-weight: 700;
}

.tab-arrow-icon {
  color: var(--gray-400, #9ca3af);
  margin-left: 2px;
  transition: transform 0.2s ease;
}

.nav-tab:hover .tab-arrow-icon {
  transform: translateX(3px);
  color: var(--primary-dark, #1b5e20);
}

/* --- Glass Cards & Layout --- */
.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: var(--radius-xl, 16px);
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  margin-bottom: var(--space-xl, 24px);
}

.attendance-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  align-items: start;
  max-width: 100%;
}

.attendance-layout .glass-card {
  min-width: 0;
  margin-bottom: 0;
}

@media (min-width: 1200px) {
  .attendance-layout {
    grid-template-columns: 360px 1fr;
    gap: 24px;
  }
  .attendance-layout .session-context {
    position: sticky;
    top: 16px;
  }
}

/* --- Session Context Sidebar --- */
.session-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--gray-200, #e5e7eb);
}

.session-icon-badge {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(46, 125, 50, 0.1);
  color: var(--primary-dark, #1b5e20);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.session-card-header h2 {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--primary-dark, #1b5e20);
  margin: 0 0 2px 0;
}

.session-date-tag {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--gray-500, #6b7280);
}

.context-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}

.context-item {
  background: var(--gray-50, #f9fafb);
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--gray-100, #f3f4f6);
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.context-item-full {
  grid-column: 1 / -1;
}

.context-label {
  font-size: 0.74rem;
  font-weight: 600;
  color: var(--gray-500, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.context-val {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--gray-800, #1f2937);
}

.teacher-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

/* --- Real-Time Attendance Tally Widget --- */
.live-tally-box {
  background: #ffffff;
  border: 1.5px solid rgba(46, 125, 50, 0.2);
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.tally-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}

.tally-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--gray-700, #374151);
}

.tally-percent {
  font-size: 0.88rem;
  font-weight: 800;
  color: var(--primary-dark, #1b5e20);
}

.tally-progress-track {
  height: 7px;
  background: var(--gray-200, #e5e7eb);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 12px;
}

.tally-progress-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--primary-gradient, linear-gradient(90deg, #1b5e20, #43a047));
  transition: width 0.3s ease;
}

.tally-chips {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.tally-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
}

.tally-chip .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.tally-chip.hadir {
  background: rgba(46, 125, 50, 0.1);
  color: #1b5e20;
}
.tally-chip.hadir .dot {
  background: #2e7d32;
}

.tally-chip.izin {
  background: rgba(2, 132, 199, 0.1);
  color: #0369a1;
}
.tally-chip.izin .dot {
  background: #0284c7;
}

.tally-chip.sakit {
  background: rgba(217, 119, 6, 0.1);
  color: #b45309;
}
.tally-chip.sakit .dot {
  background: #d97706;
}

.tally-chip.alfa {
  background: rgba(220, 38, 38, 0.1);
  color: #b91c1c;
}
.tally-chip.alfa .dot {
  background: #dc2626;
}

.tally-chip .count {
  margin-left: auto;
  font-weight: 800;
  font-size: 0.85rem;
}

/* --- Roster Main Card & Toolbar --- */
.roster-main-card {
  padding: 1.5rem;
}

.roster-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--gray-200, #e5e7eb);
}

.roster-title-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.roster-title-box h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary-dark, #1b5e20);
  margin: 0;
}

.roster-class-pill {
  padding: 3px 10px;
  background: rgba(46, 125, 50, 0.1);
  color: #1b5e20;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
}

.btn-all-present {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  background: #e8f5e9;
  color: #1b5e20;
  border: 1.5px solid rgba(46, 125, 50, 0.3);
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-all-present:hover:not(:disabled) {
  background: #1b5e20;
  color: #ffffff;
  border-color: #1b5e20;
  box-shadow: 0 4px 14px rgba(27, 94, 32, 0.25);
  transform: translateY(-1px);
}

.btn-all-present:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* --- Table Styles --- */
.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  padding: 12px 14px;
  text-align: left;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--gray-600, #4b5563);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  background: var(--gray-50, #f9fafb);
  border-bottom: 1px solid var(--gray-200, #e5e7eb);
}

.data-table td {
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid var(--gray-100, #f3f4f6);
  font-size: 0.92rem;
  vertical-align: middle;
}

.data-table tbody tr:hover {
  background: rgba(240, 253, 244, 0.4);
}

.student-name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.student-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: #ffffff;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.student-avatar.avatar-hadir {
  background: #2e7d32;
}
.student-avatar.avatar-izin {
  background: #0284c7;
}
.student-avatar.avatar-sakit {
  background: #d97706;
}
.student-avatar.avatar-alfa {
  background: #dc2626;
}

.student-name {
  font-weight: 600;
  color: var(--gray-900, #111827);
}

/* --- Status Segmented Control (Fast 1-Tap) --- */
.status-action-cell {
  display: flex;
  align-items: center;
}

.status-segmented-control {
  display: inline-flex;
  align-items: center;
  background: #f3f4f6;
  padding: 3px;
  border-radius: 10px;
  gap: 3px;
  border: 1px solid var(--gray-200, #e5e7eb);
}

.seg-btn {
  border: none;
  background: transparent;
  padding: 6px 14px;
  border-radius: 7px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--gray-600, #4b5563);
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.seg-btn:hover:not(.active) {
  background: rgba(255, 255, 255, 0.65);
  color: var(--gray-900, #111827);
}

.seg-btn.active.seg-hadir {
  background: #1b5e20;
  color: #ffffff;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(27, 94, 32, 0.28);
}

.seg-btn.active.seg-izin {
  background: #0284c7;
  color: #ffffff;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(2, 132, 199, 0.28);
}

.seg-btn.active.seg-sakit {
  background: #d97706;
  color: #ffffff;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(217, 119, 6, 0.28);
}

.seg-btn.active.seg-alfa {
  background: #dc2626;
  color: #ffffff;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(220, 38, 38, 0.28);
}

/* Hidden accessible fallback */
.sr-only-custom {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.status-select {
  max-width: 180px;
}

/* --- Mobile Cards Layout --- */
.roster-cards {
  display: none;
  list-style: none;
  margin: 14px 0 0;
  padding: 0;
}

/* --- Save Feedback Area & Buttons --- */
.save-feedback-area {
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--gray-200, #e5e7eb);
}

.save-status {
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-icon {
  flex-shrink: 0;
}

.save-saved {
  background: rgba(46, 125, 50, 0.1);
  color: #1b5e20;
  border: 1px solid rgba(46, 125, 50, 0.2);
}

.save-unsaved {
  background: rgba(234, 88, 12, 0.1);
  color: #c2410c;
  border: 1px solid rgba(234, 88, 12, 0.2);
}

.save-saving {
  background: rgba(2, 132, 199, 0.1);
  color: #0369a1;
  border: 1px solid rgba(2, 132, 199, 0.2);
}

.save-error {
  background: rgba(220, 38, 38, 0.1);
  color: #b91c1c;
  border: 1px solid rgba(220, 38, 38, 0.2);
}

.inline-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(2, 132, 199, 0.3);
  border-top-color: #0369a1;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.btn-save-attendance {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 24px;
  background: var(--primary-gradient, linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%));
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  box-shadow: 0 4px 16px rgba(27, 94, 32, 0.28);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-save-attendance:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(27, 94, 32, 0.38);
  filter: brightness(1.05);
}

.btn-save-attendance:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Badges & Alerts */
.badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-info {
  background: rgba(33, 150, 243, 0.1);
  color: #1565c0;
}

.alert {
  padding: 12px 16px;
  border-radius: 10px;
  margin-top: var(--space-md, 16px);
  font-size: 0.88rem;
  font-weight: 500;
}

.alert-success {
  background: rgba(76, 175, 80, 0.1);
  color: #2e7d32;
  border: 1px solid rgba(76, 175, 80, 0.2);
}

.alert-error {
  background: rgba(244, 67, 54, 0.1);
  color: #c62828;
  border: 1px solid rgba(244, 67, 54, 0.2);
}

.btn {
  padding: 12px 20px;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary);
  color: white;
  width: 100%;
}

.btn-secondary {
  background: var(--gray-200);
  color: var(--gray-700);
  white-space: nowrap;
}

.mt-2 {
  margin-top: var(--space-sm);
}

.mt-4 {
  margin-top: var(--space-xl);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 12px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(46, 125, 50, 0.2);
  border-top-color: #1b5e20;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.student-attendance-view {
  max-width: 100%;
  overflow-x: clip;
}

/* --- Mobile Responsiveness --- */
@media (max-width: 767px) {
  .student-attendance-view .table-responsive {
    display: none;
  }

  .roster-cards {
    display: grid;
    gap: 12px;
  }

  .roster-card {
    border: 1px solid var(--gray-200, #e5e7eb);
    border-radius: 12px;
    padding: 14px;
    background: #ffffff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .roster-card-top {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .roster-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .roster-num {
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--gray-400, #9ca3af);
  }

  .roster-name {
    font-size: 0.98rem;
    font-weight: 700;
    color: var(--gray-900, #111827);
  }

  .roster-status-segmented {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
    background: #f3f4f6;
    padding: 3px;
    border-radius: 10px;
  }

  .roster-status-segmented .seg-btn {
    min-height: 44px;
    font-size: 0.85rem;
    padding: 8px 4px;
    text-align: center;
    justify-content: center;
  }

  .roster-status {
    display: grid;
    gap: 6px;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--gray-700);
  }

  .roster-status select {
    font-size: 16px;
    min-height: 44px;
  }

  .roster-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .roster-toolbar .btn {
    min-height: 44px;
    width: 100%;
    justify-content: center;
  }

  .student-attendance-view .btn-primary {
    min-height: 48px;
    font-size: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .page-header .btn-link {
    text-align: left;
    min-height: 44px;
  }
}

@media (min-width: 768px) {
  .status-select {
    min-height: 44px;
  }
  .roster-toolbar .btn,
  .student-attendance-view .btn-primary {
    min-height: 44px;
  }
}
</style>