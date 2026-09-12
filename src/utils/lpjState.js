export const NOTE_NO_ATTENDANCE = "Tidak ada presensi kehadiran";
export const NOTE_PRESENT_NO_SESSION = "Hadir namun tidak ada jurnal KBM";

const MONTH_NAMES_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function currentPeriod(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function periodLabel(period) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(period || "").trim());
  if (!m) return String(period || "-");
  const idx = Number(m[2]) - 1;
  if (idx < 0 || idx > 11) return String(period);
  return `${MONTH_NAMES_ID[idx]} ${m[1]}`;
}

export function statusLabel(status) {
  const map = { draft: "Draft", submitted: "Diajukan", approved: "Disetujui" };
  return map[String(status || "").toLowerCase()] || String(status || "-");
}

function journalMissing(session) {
  const material = session?.journal?.material;
  return !material || String(material).trim().length === 0;
}

export function resolveDayAction(day, sessionsByDate, now = new Date()) {
  const sessions = (sessionsByDate && sessionsByDate[day.date]) || [];
  if (day.isCovered && day.statusClassification === "permitted_absence") {
    return { kind: "none", label: "Lengkap" };
  }
  if (!day.isCovered) {
    if (String(day.note || "").includes(NOTE_NO_ATTENDANCE)) {
      return { kind: "link", label: "Isi Absensi", to: "/dashboard/attendance", primary: false };
    }
    if (String(day.note || "").includes(NOTE_PRESENT_NO_SESSION)) {
      if (isFutureDay(day.date, now)) {
        return { kind: "disabled", label: "KBM / Mengajar", reason: "Belum dapat diisi" };
      }
      return { kind: "link", label: "KBM / Mengajar", to: `/dashboard/kbm?date=${day.date}`, primary: true };
    }
    return { kind: "link", label: "Isi Absensi", to: "/dashboard/attendance" };
  }
  const withoutAttendance = sessions.find(
    (s) => !Array.isArray(s.studentAttendances) || s.studentAttendances.length === 0,
  );
  if (withoutAttendance && ["teaching", "special_non_kbm"].includes(withoutAttendance.type)) {
    return { kind: "link", label: "Lengkapi Absensi Santri", to: `/dashboard/kbm/${withoutAttendance.id}/absensi`, primary: true };
  }
  const withoutJournal = sessions.find(
    (s) => ["teaching", "special_non_kbm"].includes(s.type) && journalMissing(s),
  );
  if (withoutJournal) {
    return { kind: "link", label: "Lengkapi Jurnal", to: `/dashboard/kbm/${withoutJournal.id}/jurnal`, primary: false };
  }
  return { kind: "none", label: "Lengkap" };
}

export function incompleteMessage(completeness) {
  const missing = Number(completeness?.missingDays || 0);
  return `Belum lengkap — masih ada ${missing} hari yang belum terpenuhi`;
}
export function resolveKbmDateFromQuery(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return null;
  if (d.getFullYear() !== Number(m[1]) || d.getMonth() !== Number(m[2]) - 1 || d.getDate() !== Number(m[3])) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

export function toLocalDayKey(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isFutureDay(dateStr, now = new Date()) {
  if (!/^(\d{4})-(\d{2})-(\d{2})$/.test(String(dateStr || "").trim())) return false;
  const todayKey = toLocalDayKey(now);
  if (!todayKey) return false;
  return String(dateStr).trim() > todayKey;
}
