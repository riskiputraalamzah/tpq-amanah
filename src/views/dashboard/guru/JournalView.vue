<template>
  <div class="journal-view">
    <header class="page-header">
      <div>
        <h1>Jurnal KBM</h1>
        <p>Tinjau materi RPP dan lengkapi catatan jurnal sesi mengajar</p>
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
      <button
        type="button"
        class="nav-tab"
        @click="router.push(`/dashboard/kbm/${sessionId}/absensi`)"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <span>Absensi Santri</span>
        <span class="tab-badge">{{ summary.hadir }}/{{ summary.total }} Hadir</span>
      </button>

      <button type="button" class="nav-tab active">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <span>Jurnal KBM</span>
        <span class="tab-status-dot" :class="isFilled ? 'is-filled' : 'is-draft'"></span>
      </button>
    </nav>

    <div v-if="loading" class="glass-card loading-state">
      <div class="loading-spinner"></div>
      <p>Memuat jurnal sesi...</p>
    </div>

    <div v-else-if="loadError" class="glass-card">
      <div class="alert alert-error">{{ loadError }}</div>
      <p class="mt-2">Pilih sesi dari Riwayat KBM lalu tekan "Jurnal".</p>
    </div>

    <template v-else>
      <nav class="breadcrumb glass-card" aria-label="Konteks sesi">
        <span class="crumb-item">KBM</span>
        <span class="crumb-sep">&rarr;</span>
        <span class="crumb-item">{{ levelName }}</span>
        <span class="crumb-sep">&rarr;</span>
        <span class="crumb-item">{{ slotName }}</span>
        <span class="crumb-sep">&rarr;</span>
        <span class="crumb-item">{{ formatDate(session.date) }}</span>
        <span class="crumb-sep">&rarr;</span>
        <strong class="crumb-current">Jurnal</strong>
      </nav>

      <div class="journal-layout">
        <!-- Sidebar: Session Context & Attendance Summary -->
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
            <div class="context-item" v-if="isSpecial">
              <span class="context-label">Kegiatan Khusus</span>
              <strong class="context-val">{{ session.activityName || "-" }}</strong>
            </div>
            <div class="context-item">
              <span class="context-label">Status RPP</span>
              <div class="rpp-status-badge">
                <span class="badge" :class="session.advancesRpp ? 'badge-success' : 'badge-warning'">
                  {{ session.advancesRpp ? "Maju" : "Tetap" }}
                </span>
              </div>
            </div>
            <div class="context-item context-item-full">
              <span class="context-label">Guru Pengajar</span>
              <div class="teacher-row">
                <strong class="context-val">{{ session.guruName || "-" }}</strong>
                <span v-if="session.substituteFor" class="badge badge-info">Guru Badal</span>
              </div>
            </div>
          </div>

          <!-- Fixed Attendance Summary Card (No more duplicate texts!) -->
          <div class="attendance-summary-card">
            <div class="summary-card-top">
              <div class="summary-title-row">
                <h3>Ringkasan Kehadiran Santri</h3>
                <span class="attendance-count-pill">{{ summary.hadir }} / {{ summary.total }} Hadir</span>
              </div>
              <div class="summary-progress-track">
                <div
                  class="summary-progress-fill"
                  :style="{ width: (summary.total > 0 ? Math.round((summary.hadir / summary.total) * 100) : 0) + '%' }"
                ></div>
              </div>
            </div>

            <div class="summary-chips-grid">
              <div class="summary-chip chip-hadir">
                <span class="dot"></span>
                <span class="chip-lbl">Hadir:</span>
                <strong class="chip-num">{{ summary.hadir }}</strong>
              </div>
              <div class="summary-chip chip-izin" v-if="summary.izin > 0">
                <span class="dot"></span>
                <span class="chip-lbl">Izin:</span>
                <strong class="chip-num">{{ summary.izin }}</strong>
              </div>
              <div class="summary-chip chip-sakit" v-if="summary.sakit > 0">
                <span class="dot"></span>
                <span class="chip-lbl">Sakit:</span>
                <strong class="chip-num">{{ summary.sakit }}</strong>
              </div>
              <div class="summary-chip chip-alfa" v-if="summary.alfa + summary.alpa > 0">
                <span class="dot"></span>
                <span class="chip-lbl">Alfa:</span>
                <strong class="chip-num">{{ summary.alfa + summary.alpa }}</strong>
              </div>
            </div>

            <p class="summary-note text-muted">
              Ubah kehadiran melalui Absensi Santri. Jurnal hanya menampilkan ringkasan.
            </p>

            <button
              type="button"
              class="btn btn-secondary btn-sm btn-open-attendance"
              @click="router.push(`/dashboard/kbm/${sessionId}/absensi`)"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Buka Absensi Santri</span>
            </button>
          </div>
        </section>

        <!-- Main Content: Jurnal Editor -->
        <section v-if="!isJournalable" class="glass-card">
          <div class="alert alert-error">
            Sesi ini bukan sesi mengajar. Jurnal hanya tersedia untuk sesi mengajar.
          </div>
        </section>

        <section v-else class="glass-card journal-editor">
          <div class="editor-header">
            <div class="editor-icon-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <div>
              <h2>Materi &amp; Catatan Jurnal</h2>
              <p class="editor-subtitle">Tinjau materi RPP dan lengkapi evaluasi pembelajaran guru</p>
            </div>
          </div>

          <div v-if="isSpecial" class="alert alert-warning">
            Kegiatan khusus: jurnal memakai nama kegiatan. Tidak memajukan pertemuan maupun RPP.
          </div>

          <div class="editor-fields">
            <label class="field">
              <div class="field-label-bar">
                <span class="field-title">Materi (dari RPP, dapat diubah guru)</span>
                <span class="field-badge required">Wajib</span>
              </div>
              <textarea
                v-model="material"
                class="form-input editor-textarea"
                rows="5"
                placeholder="Tuliskan materi pembelajaran yang diajarkan pada sesi ini..."
                :disabled="saving"
                @input="onEdit"
              />
            </label>

            <label class="field">
              <div class="field-label-bar">
                <span class="field-title">Catatan guru</span>
                <span class="field-badge optional">Opsional</span>
              </div>
              <textarea
                v-model="notes"
                class="form-input editor-textarea notes-textarea"
                rows="4"
                placeholder="Catatan perkembangan santri, kendala mengajar, atau evaluasi kelas..."
                :disabled="saving"
                @input="onEdit"
              />
            </label>
          </div>

          <!-- Save Feedback Area -->
          <div class="save-feedback-area">
            <div v-if="journalStatus !== 'draft'" class="save-status" :class="'save-' + journalStatus">
              <span v-if="journalStatus === 'saved'">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="status-icon">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Tersimpan<span v-if="lastSavedAt"> · Terakhir disimpan {{ lastSavedAt }}</span>
              </span>
              <span v-else-if="journalStatus === 'unsaved'">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="status-icon">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Ada perubahan belum disimpan
              </span>
              <span v-else-if="journalStatus === 'saving'">
                <span class="inline-spinner"></span>
                Menyimpan...
              </span>
              <span v-else-if="journalStatus === 'error'">
                Gagal menyimpan. Periksa kembali.
              </span>
            </div>
            <div v-else class="save-status save-draft">
              <span>Belum ada materi jurnal tersimpan untuk sesi ini.</span>
            </div>

            <div
              v-if="saveMessage"
              class="alert"
              :class="saveOk ? 'alert-success' : 'alert-error'"
            >
              {{ saveMessage }}
            </div>

            <!-- Save CTA Button -->
            <button
              type="button"
              class="mt-4 btn btn-primary btn-save"
              :disabled="!dirty || saving"
              @click="save"
            >
              <svg v-if="!saving" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              <span>{{ saveLabel }}</span>
            </button>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/services/api";
import { formatSessionDateID, formatTimeID } from "@/utils/studentAttendanceState";
import {
  summarizeStudentAttendance,
  resolveJournalInitialStatus,
  journalSaveButtonLabel,
  isJournalFilled,
} from "@/utils/journalState";

const route = useRoute();
const router = useRouter();
const sessionId = route.params.id;

const loading = ref(true);
const loadError = ref("");
const session = ref({});
const sessionSlots = ref([]);
const classes = ref([]);
const material = ref("");
const notes = ref("");
const dirty = ref(false);
const saving = ref(false);
const saveMessage = ref("");
const saveOk = ref(false);
const journalStatus = ref("draft");
const lastSavedAt = ref("");
const justSaved = ref(false);
let justSavedTimer = null;

const isFilled = computed(() => isJournalFilled(material.value));

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

const isSpecial = computed(() => session.value.type === "special_non_kbm");

const activityName = computed(() => {
  if (session.value.type === "teaching") return "KBM Normal";
  return session.value.activityName || "Non-KBM";
});

const isJournalable = computed(() =>
  ["teaching", "special_non_kbm"].includes(session.value.type),
);

const summary = computed(() => summarizeStudentAttendance(session.value.studentAttendances));

const saveLabel = computed(() => journalSaveButtonLabel({ saving: saving.value, justSaved: justSaved.value }));

const formatDate = (val) => formatSessionDateID(val);

const onEdit = () => {
  dirty.value = true;
  journalStatus.value = "unsaved";
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
    material.value = session.value.journal?.material || "";
    notes.value = session.value.journal?.notes || "";
    dirty.value = false;
    journalStatus.value = resolveJournalInitialStatus(material.value);
    saveMessage.value = "";
  } catch (error) {
    if (error.response?.status === 404) {
      loadError.value = "Sesi tidak ditemukan. Tidak ada sesi yang dipilih.";
    } else if (error.response?.status === 403) {
      loadError.value = "Anda tidak memiliki akses ke sesi ini.";
    } else {
      loadError.value = error.response?.data?.error || "Gagal memuat jurnal sesi.";
    }
  } finally {
    loading.value = false;
  }
};

const save = async () => {
  if (!dirty.value || saving.value) return;
  saving.value = true;
  journalStatus.value = "saving";
  saveMessage.value = "";
  try {
    await api.put(`/teaching_sessions/${sessionId}`, {
      journal: { material: material.value, notes: notes.value },
    });
    dirty.value = false;
    saveOk.value = true;
    journalStatus.value = "saved";
    lastSavedAt.value = formatTimeID();
    saveMessage.value = "Jurnal berhasil disimpan.";
    justSaved.value = true;
    if (justSavedTimer) clearTimeout(justSavedTimer);
    justSavedTimer = setTimeout(() => {
      justSaved.value = false;
    }, 2500);
    const sessionRes = await api.get(`/teaching_sessions/${sessionId}`);
    session.value = sessionRes.data;
  } catch (error) {
    saveOk.value = false;
    journalStatus.value = "error";
    saveMessage.value = error.response?.data?.error || "Gagal menyimpan jurnal.";
  } finally {
    saving.value = false;
  }
};

onMounted(fetchData);
</script>

<style scoped>
.journal-view {
  padding-top: 60px;
  display: flex;
  flex-direction: column;
  max-width: 100%;
}

@media (min-width: 1024px) {
  .journal-view {
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

.tab-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.tab-status-dot.is-filled {
  background: #2e7d32;
  box-shadow: 0 0 0 2px rgba(46, 125, 50, 0.2);
}

.tab-status-dot.is-draft {
  background: #d97706;
  box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.2);
}

/* --- Breadcrumb Pill --- */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 0.84rem;
  color: var(--gray-600, #4b5563);
  padding: 10px 16px;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.crumb-item {
  font-weight: 500;
  color: var(--gray-600, #4b5563);
}

.crumb-sep {
  color: var(--gray-400, #9ca3af);
  font-size: 0.85rem;
}

.crumb-current {
  color: var(--primary-dark, #1b5e20);
  font-weight: 700;
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
}

.journal-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  align-items: start;
}

@media (min-width: 1024px) {
  .journal-layout {
    grid-template-columns: 360px 1fr;
    gap: 24px;
  }
  .journal-layout .session-context {
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

.rpp-status-badge {
  margin-top: 2px;
}

/* --- Attendance Summary Card (No more duplicate texts!) --- */
.attendance-summary-card {
  background: #ffffff;
  border: 1.5px solid rgba(46, 125, 50, 0.2);
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.summary-card-top {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-title-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.attendance-summary-card h3 {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--gray-800, #1f2937);
  margin: 0;
}

.attendance-count-pill {
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--primary-dark, #1b5e20);
  background: rgba(46, 125, 50, 0.1);
  padding: 2px 8px;
  border-radius: 999px;
}

.summary-progress-track {
  height: 6px;
  background: var(--gray-200, #e5e7eb);
  border-radius: 999px;
  overflow: hidden;
}

.summary-progress-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--primary-gradient, linear-gradient(90deg, #1b5e20, #43a047));
  transition: width 0.3s ease;
}

.summary-chips-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.summary-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 8px;
  border-radius: 7px;
  font-size: 0.76rem;
  font-weight: 600;
}

.summary-chip.chip-hadir {
  background: rgba(46, 125, 50, 0.1);
  color: #1b5e20;
}
.summary-chip.chip-hadir .dot {
  background: #2e7d32;
}

.summary-chip.chip-izin {
  background: rgba(2, 132, 199, 0.1);
  color: #0369a1;
}
.summary-chip.chip-izin .dot {
  background: #0284c7;
}

.summary-chip.chip-sakit {
  background: rgba(217, 119, 6, 0.1);
  color: #b45309;
}
.summary-chip.chip-sakit .dot {
  background: #d97706;
}

.summary-chip.chip-alfa {
  background: rgba(220, 38, 38, 0.1);
  color: #b91c1c;
}
.summary-chip.chip-alfa .dot {
  background: #dc2626;
}

.summary-chip .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.summary-chip .chip-num {
  margin-left: auto;
  font-weight: 800;
}

.summary-note {
  font-size: 0.76rem;
  color: var(--gray-500, #6b7280);
  margin: 0;
  line-height: 1.4;
}

.btn-open-attendance {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  background: #f3f4f6;
  color: var(--gray-800, #1f2937);
  border: 1px solid var(--gray-200, #e5e7eb);
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-open-attendance:hover {
  background: var(--primary, #2e7d32);
  color: #ffffff;
  border-color: var(--primary, #2e7d32);
  box-shadow: 0 2px 8px rgba(46, 125, 50, 0.2);
}

/* --- Journal Editor --- */
.journal-editor {
  padding: 1.5rem;
}

.editor-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--gray-200, #e5e7eb);
}

.editor-icon-badge {
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

.editor-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary-dark, #1b5e20);
  margin: 0 0 2px 0;
}

.editor-subtitle {
  font-size: 0.85rem;
  color: var(--gray-500, #6b7280);
  margin: 0;
}

.editor-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
}

.field-label-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.field-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--gray-700, #374151);
}

.field-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 6px;
}

.field-badge.required {
  background: rgba(220, 38, 38, 0.08);
  color: #dc2626;
  border: 1px solid rgba(220, 38, 38, 0.2);
}

.field-badge.optional {
  background: var(--gray-100, #f3f4f6);
  color: var(--gray-500, #6b7280);
}

.editor-textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid var(--gray-300, #d1d5db);
  border-radius: 12px;
  font-size: 0.95rem;
  line-height: 1.6;
  resize: vertical;
  min-height: 6.5rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: #ffffff;
  color: var(--gray-800, #1f2937);
  box-sizing: border-box;
}

.editor-textarea:focus {
  outline: none;
  border-color: var(--primary, #2e7d32);
  box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.12);
}

.notes-textarea {
  min-height: 5.5rem;
}

/* --- Save Feedback Area --- */
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
  color: #2e7d32;
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

.save-draft {
  background: var(--gray-100, #f3f4f6);
  color: var(--gray-600, #4b5563);
  border: 1px solid var(--gray-200, #e5e7eb);
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

.btn-save {
  width: 100%;
  min-height: 2.75rem;
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

.btn-save:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(27, 94, 32, 0.38);
  filter: brightness(1.05);
}

.btn-save:disabled {
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
  white-space: nowrap;
}

.badge-info {
  background: rgba(33, 150, 243, 0.1);
  color: #1565c0;
}

.badge-success {
  background: rgba(46, 125, 50, 0.1);
  color: #1b5e20;
}

.badge-warning {
  background: rgba(234, 88, 12, 0.1);
  color: #c2410c;
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

.alert-warning {
  background: rgba(255, 152, 0, 0.1);
  color: #ef6c00;
  border: 1px solid rgba(255, 152, 0, 0.2);
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
}

.btn-secondary {
  background: var(--gray-200);
  color: var(--gray-700);
  white-space: nowrap;
}

.btn-sm {
  padding: 8px 14px;
  font-size: 0.85rem;
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

/* --- Mobile Responsiveness --- */
@media (max-width: 640px) {
  .journal-view {
    font-size: 0.95rem;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .page-header .btn-link {
    text-align: left;
    min-height: 44px;
  }

  .btn-save {
    width: 100%;
  }
}
</style>