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
        <p class="header-subtitle">Ketuk tanggal di kalender untuk melihat atau mengisi KBM hari itu</p>
      </div>

      <div v-if="canFillToday" class="header-action">
        <router-link :to="workspaceLink(todayString)" class="btn btn-primary btn-sm btn-fill-today">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>Isi KBM Hari Ini</span>
        </router-link>
      </div>
    </header>

    <!-- Locked Period Alert (if LPJ is already submitted or approved) -->
    <div v-if="isPeriodLocked" class="locked-period-banner glass-card">
      <div class="locked-icon">🔒</div>
      <div class="locked-text">
        <strong>Administrasi Periode Ini Sedang Dikunci</strong>
        <p>
          Laporan LPJ bulanan periode ini berstatus <strong>{{ lockedStatusText }}</strong>, jadi KBM bulan ini hanya
          bisa dilihat. Pakai panah di kalender untuk pindah ke bulan lain, atau hubungi admin bila perlu dikoreksi.
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <PageSkeleton v-if="loadingInitial" :stats="4" :rows="6" label="Memuat data KBM" />

    <template v-else>
      <!-- Quick Metrics Summary -->
      <section class="kbm-metrics-grid" aria-label="Ringkasan KBM bulan ini">
        <div class="kbm-metric-card glass-card">
          <div class="metric-icon total">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div class="metric-info">
            <span class="metric-label">Total KBM</span>
            <strong class="metric-value">{{ totalSessions }} <span class="metric-unit">Sesi</span></strong>
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
            <span class="metric-label">Belum Lengkap</span>
            <strong class="metric-value" :class="pendingSessionsCount > 0 ? 'text-warning-bold' : ''">
              {{ pendingSessionsCount }} <span class="metric-unit">Sesi</span>
            </strong>
          </div>
        </div>

        <div class="kbm-metric-card glass-card" :class="{ 'card-attention': needsDays.length > 0 }">
          <div class="metric-icon" :class="needsDays.length > 0 ? 'pending' : 'neutral'">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div class="metric-info">
            <span class="metric-label" title="Hadir, tetapi KBM belum diisi">Belum Ada KBM</span>
            <strong class="metric-value" :class="needsDays.length > 0 ? 'text-warning-bold' : ''">
              {{ needsDays.length }} <span class="metric-unit">Hari</span>
            </strong>
          </div>
        </div>
      </section>

      <div class="content-grid">
        <!-- The calendar is the page: every day shows its own state, tap it to see or fill that day -->
        <section class="kbm-calendar-card glass-card" aria-labelledby="calendar-heading">
          <h2 id="calendar-heading" class="sr-only">Kalender KBM</h2>
          <KbmDatePicker v-if="kbmCalendar" :calendar="kbmCalendar" :model-value="selectedDate" :max-date="todayString"
            :loading="monthLoading" :locked-reason="calendarLockedReason" @pick="pickDay" @change-month="changeMonth" />
          <p v-else class="calendar-error">Kalender belum bisa dimuat. Muat ulang halaman ini.</p>
        </section>

        <!-- Only what still needs action this month -->
        <section class="kbm-todo glass-card" aria-labelledby="todo-heading">
          <div class="todo-head">
            <h2 id="todo-heading">Perlu Dilengkapi</h2>
            <span class="todo-count" v-if="todoItems.length">{{ todoItems.length }}</span>
          </div>

          <p v-if="!todoItems.length" class="todo-empty">
            <span class="todo-empty-icon" aria-hidden="true">✓</span>
            {{ totalSessions ? `Semua KBM ${activePeriodLabel} sudah lengkap.` : `Belum ada KBM yang perlu dilengkapi di ${activePeriodLabel}.` }}
          </p>

          <ul v-else class="todo-list">
            <li v-for="item in todoItems" :key="item.key" class="todo-item" :class="`todo-${item.kind}`">
              <div class="todo-text">
                <strong>{{ item.dateLabel }}</strong>
                <span>{{ item.detail }}</span>
              </div>
              <button type="button" class="todo-action" @click="item.go()">
                {{ item.actionLabel }} <span aria-hidden="true">→</span>
              </button>
            </li>
          </ul>
        </section>
      </div>
    </template>

    <!-- Day sheet: the KBM of one date (bottom sheet on phones, dialog on larger screens) -->
    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="sheetDate" class="sheet-overlay" @click.self="closeSheet">
          <section ref="sheetEl" class="day-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" tabindex="-1">
            <header class="sheet-head">
              <div>
                <h3 id="sheet-title">{{ longDate(sheetDate) }}</h3>
                <p class="sheet-sub">{{ sheetSummary }}</p>
              </div>
              <button type="button" class="sheet-close" aria-label="Tutup" @click="closeSheet">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>

            <div class="sheet-body">
              <article v-for="session in sheetSessions" :key="session.id" class="sheet-kbm"
                :class="isWorkflowComplete(session) ? 'is-complete' : 'is-pending'">
                <div class="sheet-kbm-head">
                  <span class="slot-pill">{{ getSessionSlotIcon(session.sessionSlotId) }} {{ getSessionName(session.sessionSlotId) }}
                    <span v-if="getSessionTime(session.sessionSlotId)" class="slot-time-text">({{ getSessionTime(session.sessionSlotId) }})</span>
                  </span>
                  <span class="level-pill">{{ getLevelName(session) }}</span>
                  <span v-if="session.meetingNumber" class="activity-pill">Pertemuan ke-{{ session.meetingNumber }}</span>
                  <span v-if="session.substituteFor" class="badal-pill">Badal</span>
                </div>

                <dl class="sheet-kbm-rows">
                  <div class="sheet-row" :class="workflowOf(session).attFilled ? 'ok' : 'todo'">
                    <dt>Absen santri</dt>
                    <dd>{{ workflowOf(session).attFilled ? `${workflowOf(session).attHadir} dari ${workflowOf(session).attTotal} hadir` : 'Belum diisi' }}</dd>
                  </div>
                  <div class="sheet-row" :class="workflowOf(session).journalFilled ? 'ok' : 'todo'">
                    <dt>Jurnal</dt>
                    <dd>{{ workflowOf(session).journalFilled ? session.journal?.material : 'Belum diisi' }}</dd>
                  </div>
                </dl>

                <div class="sheet-kbm-actions">
                  <button type="button" class="btn-task-action" :class="workflowOf(session).attFilled ? 'btn-task-edit' : 'btn-task-submit'"
                    @click="goAttendance(session.id)">
                    {{ isPeriodLocked ? "Lihat Absensi" : workflowOf(session).attFilled ? "Absensi" : "Isi Absensi" }}
                  </button>
                  <button type="button" class="btn-task-action" :class="workflowOf(session).journalFilled ? 'btn-task-edit' : 'btn-task-submit'"
                    @click="goJournal(session.id)">
                    {{ isPeriodLocked ? "Lihat Jurnal" : workflowOf(session).journalFilled ? "Jurnal" : "Isi Jurnal" }}
                  </button>
                  <button v-if="!isPeriodLocked" type="button" class="btn-delete-card" @click="openDeleteModal(session)">
                    Hapus
                  </button>
                </div>
              </article>
            </div>

            <footer v-if="canAddOnSheetDate" class="sheet-foot">
              <router-link :to="workspaceLink(sheetDate)" class="sheet-add">
                <span aria-hidden="true">+</span> Tambah KBM lain di tanggal ini
              </router-link>
            </footer>
          </section>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete confirmation -->
    <Teleport to="body">
      <div v-if="deletingSession" class="modal-overlay delete-overlay" @click.self="closeDeleteModal">
        <div class="modal glass-card delete-modal-card" role="alertdialog" aria-modal="true" aria-labelledby="delete-title">
          <div class="modal-danger-header">
            <span class="danger-icon" aria-hidden="true">⚠️</span>
            <h3 id="delete-title">Hapus Sesi Mengajar?</h3>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import api from "@/services/api";
import PageSkeleton from "@/components/PageSkeleton.vue";
import KbmDatePicker from "@/components/KbmDatePicker.vue";
import { pickMonthReport, lockMessage } from "@/utils/lpjLock";
import { buildCalendar, longDate } from "@/utils/kbmCalendar";
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

const loadingInitial = ref(true);
const classes = ref([]);
const sessionSlots = ref([]);
const history = ref([]);
const currentLpjReport = ref(null);
// Month view from the backend: teaching days, holidays, attendance and the KBM saved per day (with completeness).
const kbmCalendar = ref(null);

// Delete state
const deletingSession = ref(null);
const deletingLoading = ref(false);

// ?date=YYYY-MM-DD (back from a KBM, a link from the LPJ card or the attendance page) opens that month and that day.
const contextualDate = resolveKbmDateFromQuery(route.query.date);

// The month shown in the calendar and the to-do list; the month arrows move it.
const viewedMonth = ref((contextualDate || todayString).slice(0, 7));
const monthLoading = ref(false);
const viewedPeriod = () => {
  const m = /^(\d{4})-(\d{2})$/.exec(viewedMonth.value || "");
  if (m) return { month: Number(m[2]), year: Number(m[1]) };
  return { month: today.getMonth() + 1, year: today.getFullYear() };
};

const activePeriodLabel = computed(() => {
  const p = viewedPeriod();
  const dateObj = new Date(p.year, p.month - 1, 1);
  return dateObj.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
});

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

const calendarLockedReason = computed(() => (isPeriodLocked.value ? lockMessage(currentLpjReport.value?.status) : ""));

// The same view the calendar draws, for the to-do list and the header button.
const calendarView = computed(() =>
  buildCalendar(kbmCalendar.value, { locked: isPeriodLocked.value, maxDate: todayString }),
);
const monthFillable = computed(() => calendarView.value.canFill);

// Filling always goes through the Daily Workspace: it picks the teacher's sesi (admin schedule) and jilid by itself.
const workspaceLink = (date) => `/dashboard/kbm/daily-workspace?date=${date}&from=kbm`;
const canFillToday = computed(() => {
  if (viewedMonth.value !== todayString.slice(0, 7) || !monthFillable.value) return false;
  const cell = calendarView.value.cells.find((c) => c.date === todayString);
  return !!cell && (cell.selectable || cell.openable);
});

const loadCalendar = async () => {
  try {
    const { data } = await api.get("/teaching_sessions/calendar", { params: { period: viewedMonth.value } });
    kbmCalendar.value = data;
  } catch {
    kbmCalendar.value = null;
  }
};

// Loads everything that belongs to the viewed month. The latest request wins if the teacher taps the arrows quickly.
let monthRequest = 0;
const loadMonthData = async () => {
  const request = ++monthRequest;
  monthLoading.value = true;
  try {
    const [historyRes, lpjRes, calendarRes] = await Promise.all([
      api.get("/teaching_sessions", { params: viewedPeriod() }),
      api.get("/ljp/reports", { params: { period: viewedMonth.value } }).catch(() => null),
      api.get("/teaching_sessions/calendar", { params: { period: viewedMonth.value } }).catch(() => null),
    ]);
    if (request !== monthRequest) return;
    history.value = historyRes.data || [];
    currentLpjReport.value = pickMonthReport(lpjRes?.data);
    kbmCalendar.value = calendarRes?.data || null;
  } catch (error) {
    if (request !== monthRequest) return;
    console.error("Failed to load month data", error);
    showError("Gagal memuat data bulan ini.");
  } finally {
    if (request === monthRequest) monthLoading.value = false;
  }
};

// Month arrows. The URL keeps the month, so coming back from a KBM lands here again.
const changeMonth = (period) => {
  if (!/^\d{4}-\d{2}$/.test(period || "") || period === viewedMonth.value) return;
  viewedMonth.value = period;
  closeSheet();
  router.replace({ query: { ...route.query, date: undefined, month: period } });
  loadMonthData();
};

// --- dates -------------------------------------------------------------------------------------------------------------
const dateOf = (val) => {
  if (!val) return "";
  if (typeof val === "string") return val.slice(0, 10);
  let d = null;
  if (val._seconds !== undefined) d = new Date(val._seconds * 1000);
  else if (val.seconds !== undefined) d = new Date(val.seconds * 1000);
  else if (val instanceof Date) d = val;
  if (!d || isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const shortDate = (date) => {
  const [y, m, d] = String(date).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });
};

// KBM of the viewed month, per date (full records: students, journal).
const sessionsByDate = computed(() => {
  const map = new Map();
  for (const s of history.value) {
    const date = dateOf(s.date);
    if (!date) continue;
    if (!map.has(date)) map.set(date, []);
    map.get(date).push(s);
  }
  for (const list of map.values()) {
    list.sort((a, b) => String(a.sessionSlotId || "").localeCompare(String(b.sessionSlotId || "")));
  }
  return map;
});

// --- day sheet ---------------------------------------------------------------------------------------------------------
const selectedDate = ref("");
const sheetDate = ref("");
const sheetEl = ref(null);
const sheetSessions = computed(() => sessionsByDate.value.get(sheetDate.value) || []);
const sheetSummary = computed(() => {
  const list = sheetSessions.value;
  const open = list.filter((s) => !isWorkflowComplete(s)).length;
  if (!list.length) return "";
  if (open === 0) return list.length > 1 ? `${list.length} KBM, semua lengkap` : "KBM lengkap";
  return `${list.length} KBM, ${open} belum lengkap`;
});
// Another class the same day (badal, a second jilid) - only while the month can still be filled.
const canAddOnSheetDate = computed(() => !!sheetDate.value && monthFillable.value && sheetDate.value <= todayString);

const openSheet = async (date) => {
  selectedDate.value = date;
  sheetDate.value = date;
  await nextTick();
  sheetEl.value?.focus();
};

const closeSheet = () => {
  sheetDate.value = "";
};

// A tap on the calendar: a day with KBM opens its sheet; an empty day goes straight to filling it.
const pickDay = (cell) => {
  if (cell.openable) {
    openSheet(cell.date);
    return;
  }
  if (cell.selectable) {
    selectedDate.value = cell.date;
    router.push(workspaceLink(cell.date));
  }
};

const onEscape = (event) => {
  if (event.key === "Escape" && sheetDate.value && !deletingSession.value) closeSheet();
};

// --- to-do list --------------------------------------------------------------------------------------------------------
const needsDays = computed(() => calendarView.value.needsDates || []);

const todoItems = computed(() => {
  const items = [];
  for (const s of history.value) {
    if (isWorkflowComplete(s)) continue;
    const w = workflowOf(s);
    const missing = [!w.attFilled && "absen santri", !w.journalFilled && "jurnal"].filter(Boolean).join(" & ");
    const date = dateOf(s.date);
    items.push({
      key: `s-${s.id}`,
      kind: "incomplete",
      date,
      dateLabel: shortDate(date),
      detail: `${getSessionName(s.sessionSlotId)} · ${getLevelName(s)} — ${missing} belum diisi`,
      actionLabel: isPeriodLocked.value ? "Lihat" : "Lengkapi",
      go: () => (w.attFilled ? goJournal(s.id) : goAttendance(s.id)),
    });
  }
  for (const date of needsDays.value) {
    items.push({
      key: `d-${date}`,
      kind: "needs",
      date,
      dateLabel: shortDate(date),
      detail: "Hadir, KBM belum diisi",
      actionLabel: "Isi KBM",
      go: () => router.push(workspaceLink(date)),
    });
  }
  return items.sort((a, b) => a.date.localeCompare(b.date));
});

// --- helpers -----------------------------------------------------------------------------------------------------------
const fetchInitialData = async () => {
  try {
    const periodObj = viewedPeriod();
    const [classesRes, slotsRes, historyRes, lpjRes, kbmCalendarRes] = await Promise.all([
      api.get("/classes"),
      api.get("/teaching_sessions/slots"),
      api.get("/teaching_sessions", { params: periodObj }),
      // Optional data: a failure here must not block the rest of the page
      api.get("/ljp/reports", { params: { period: viewedMonth.value } }).catch(() => null),
      api.get("/teaching_sessions/calendar", { params: { period: viewedMonth.value } }).catch(() => null),
    ]);

    classes.value = classesRes.data || [];
    sessionSlots.value = slotsRes.data || [];
    history.value = historyRes.data || [];
    currentLpjReport.value = pickMonthReport(lpjRes?.data);
    kbmCalendar.value = kbmCalendarRes?.data || null;
  } catch (error) {
    console.error("Failed to load initial data", error);
    showError("Gagal memuat data KBM.");
  } finally {
    loadingInitial.value = false;
  }
  // Back from a KBM of that day (or a link to it): show that day again.
  if (contextualDate) {
    selectedDate.value = contextualDate;
    if (sessionsByDate.value.get(contextualDate)?.length) openSheet(contextualDate);
  }
};

const formatDate = (val) => {
  const date = dateOf(val);
  if (!date) return "-";
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

const getSessionName = (id) => resolveSessionSlotName(id, sessionSlots.value);
const getSessionTime = (id) => resolveSessionSlotTime(id, sessionSlots.value);

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

const workflowOf = (session) => summarizeSessionWorkflow(session);

// "non-kbm" activities have no students or journal to fill.
const isWorkflowComplete = (session) => {
  if (session.type === "non-kbm") return true;
  const w = workflowOf(session);
  return w.attFilled && w.journalFilled;
};

const goAttendance = (sessionId) => router.push(`/dashboard/kbm/${sessionId}/absensi`);
const goJournal = (sessionId) => router.push(`/dashboard/kbm/${sessionId}/jurnal`);

// Metrics
const totalSessions = computed(() => history.value.length);
const completeSessionsCount = computed(() => history.value.filter((s) => isWorkflowComplete(s)).length);
const pendingSessionsCount = computed(() => history.value.filter((s) => !isWorkflowComplete(s)).length);

// --- delete ------------------------------------------------------------------------------------------------------------
const openDeleteModal = (session) => {
  deletingSession.value = session;
};

const closeDeleteModal = () => {
  if (deletingLoading.value) return;
  deletingSession.value = null;
};

const confirmDeleteSession = async () => {
  const session = deletingSession.value;
  if (!session) return;
  deletingLoading.value = true;
  try {
    await api.delete(`/teaching_sessions/${session.id}`);
    // Close the dialog first (it is closed even though deletingLoading is still on), then tell the result.
    deletingSession.value = null;
    showSuccess("Sesi KBM berhasil dihapus.");
    await loadMonthData();
    // Nothing left that day: the sheet has nothing to show.
    if (sheetDate.value && !sheetSessions.value.length) closeSheet();
  } catch (error) {
    showError(error.response?.data?.error || "Gagal menghapus sesi KBM.");
  } finally {
    deletingLoading.value = false;
  }
};

// The calendar's own month changes (e.g. ?date in another month after navigating within the page).
watch(
  () => route.query.date,
  (date) => {
    const valid = resolveKbmDateFromQuery(date);
    if (!valid || valid.slice(0, 7) === viewedMonth.value) return;
    viewedMonth.value = valid.slice(0, 7);
    loadMonthData();
  },
);

onMounted(() => {
  // ?month=YYYY-MM keeps the month across a reload or a back navigation
  if (!contextualDate && /^\d{4}-\d{2}$/.test(String(route.query.month || ""))) viewedMonth.value = String(route.query.month);
  window.addEventListener("keydown", onEscape);
  fetchInitialData();
});

onBeforeUnmount(() => window.removeEventListener("keydown", onEscape));
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
  color: var(--primary-dark, #0f6b4a);
  margin: 0;
  line-height: 1.2;
}

.period-pill {
  font-size: 0.78rem;
  font-weight: 600;
  padding: 3px 10px;
  background: rgba(46, 125, 50, 0.1);
  color: var(--primary-dark, #0f6b4a);
  border-radius: 999px;
  border: 1px solid rgba(46, 125, 50, 0.2);
}

.header-subtitle {
  font-size: 0.9rem;
  color: var(--gray-600, #475569);
  margin: 4px 0 0 0;
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
  color: #0f6b4a;
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
}

@media (min-width: 1280px) {
  .content-grid {
    grid-template-columns: 360px minmax(0, 1fr);
    gap: 1.5rem;
  }
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

.alert-success {
  background: rgba(46, 125, 50, 0.08);
  color: #0a5c40;
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

.level-pill {
  font-size: 0.76rem;
  font-weight: 700;
  background: rgba(46, 125, 50, 0.1);
  color: var(--primary-dark, #0f6b4a);
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

.badal-pill {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  background: #ede9fe;
  color: #6d28d9;
  white-space: nowrap;
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
  background: #0f6b4a;
  color: #ffffff;
  border: 1px solid #0f6b4a;
  box-shadow: 0 2px 6px rgba(46, 125, 50, 0.2);
}

.btn-task-submit:hover {
  background: #0a5c40;
  border-color: #0a5c40;
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
.modal-overlay {
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

/* Loading & Spinners */
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

/* ---------------------------------------------------------------- calendar page */
.btn-fill-today {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 18px;
  border-radius: 999px;
  text-decoration: none;
}

@media (min-width: 1024px) {
  .content-grid {
    grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  }
}

.kbm-calendar-card,
.kbm-todo {
  padding: 18px;
}

.kbm-calendar-card :deep(.kbm-picker) {
  border: 0;
  padding: 0;
}

.calendar-error {
  margin: 0;
  color: #b42318;
  font-size: 0.9rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.todo-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.todo-head h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--lp-ink, #0b3b2a);
}

.todo-count {
  min-width: 24px;
  height: 24px;
  padding: 0 7px;
  border-radius: 999px;
  background: #fef3c7;
  color: #7c3a0d;
  font-size: 0.78rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.todo-empty {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  padding: 14px;
  border-radius: 12px;
  background: #eef6f1;
  color: #0a5c40;
  font-weight: 600;
  font-size: 0.9rem;
}

.todo-empty-icon {
  flex: none;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #0a5c40;
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 0.85rem;
}

.todo-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(11, 59, 42, 0.1);
  background: #fff;
}

.todo-item.todo-incomplete {
  border-color: #f3d58b;
  background: #fffbeb;
}

.todo-item.todo-needs {
  border-color: #fed7aa;
  background: #fff7ed;
}

.todo-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.todo-text strong {
  font-size: 0.86rem;
  color: var(--lp-ink, #0b3b2a);
}

.todo-text span {
  font-size: 0.8rem;
  color: #5b4a2e;
  line-height: 1.35;
}

.todo-action {
  flex: none;
  min-height: 40px;
  padding: 0 12px;
  border-radius: 10px;
  border: 0;
  background: #0a5c40;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

.todo-action:hover {
  background: #053d2c;
}

.todo-action:focus-visible,
.sheet-close:focus-visible,
.sheet-add:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

/* ---------------------------------------------------------------- day sheet */
.sheet-overlay {
  position: fixed;
  inset: 0;
  z-index: 9990;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(3, 41, 29, 0.45);
}

.day-sheet {
  width: 100%;
  max-height: 86dvh;
  display: flex;
  flex-direction: column;
  background: #fbf9f3;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -20px 50px -20px rgba(0, 0, 0, 0.45);
  outline: none;
  padding-bottom: env(safe-area-inset-bottom);
}

@media (min-width: 640px) {
  .sheet-overlay {
    align-items: center;
    padding: 24px;
  }

  .day-sheet {
    max-width: 520px;
    border-radius: 20px;
    max-height: 80vh;
  }
}

.sheet-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 18px 12px;
  border-bottom: 1px solid rgba(11, 59, 42, 0.08);
}

.sheet-head h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--lp-ink, #0b3b2a);
}

.sheet-sub {
  margin: 2px 0 0;
  font-size: 0.85rem;
  color: #5b6b62;
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

.sheet-body {
  overflow-y: auto;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sheet-kbm {
  padding: 14px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.12);
}

.sheet-kbm.is-pending {
  border-color: #f3d58b;
}

.sheet-kbm-head {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.sheet-kbm-rows {
  margin: 0 0 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sheet-row {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 8px;
  font-size: 0.85rem;
}

.sheet-row dt {
  color: #5b6b62;
}

.sheet-row dd {
  margin: 0;
  font-weight: 600;
  color: var(--lp-ink, #0b3b2a);
  overflow-wrap: anywhere;
}

.sheet-row.todo dd {
  color: #b45309;
}

.sheet-row.ok dd::before {
  content: "✓ ";
  color: #0a5c40;
}

.sheet-kbm-actions {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 8px;
}

.sheet-kbm-actions .btn-task-action {
  justify-content: center;
  min-height: 44px;
}

.sheet-kbm-actions .btn-delete-card {
  min-height: 44px;
  padding: 0 14px;
}

.sheet-foot {
  padding: 12px 18px 18px;
  border-top: 1px solid rgba(11, 59, 42, 0.08);
}

.sheet-add {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 46px;
  border-radius: 12px;
  border: 1.5px dashed rgba(10, 92, 64, 0.45);
  color: #0a5c40;
  font-weight: 700;
  text-decoration: none;
  background: #fff;
}

.sheet-add:hover {
  background: #eef6f1;
}

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.2s ease;
}

.sheet-enter-active .day-sheet,
.sheet-leave-active .day-sheet {
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from .day-sheet,
.sheet-leave-to .day-sheet {
  transform: translateY(24px);
}

@media (prefers-reduced-motion: reduce) {
  .sheet-enter-active .day-sheet,
  .sheet-leave-active .day-sheet {
    transition: none;
  }
}

/* the delete dialog sits above the day sheet */
.delete-overlay {
  z-index: 9995;
}
</style>
