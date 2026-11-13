// Student attendance status, one spelling for every page. Older KBM saved from the Daily Workspace used "alpa":
// it is the same as "alfa" (reports already count both), so it must select the Alfa button too.
export const STUDENT_STATUSES = ["hadir", "izin", "sakit", "alfa"];
export function normalizeStudentStatus(value) {
  const s = String(value ?? "").trim().toLowerCase();
  if (s === "alpa" || s === "alpha") return "alfa";
  if (s === "present") return "hadir";
  return STUDENT_STATUSES.includes(s) ? s : "";
}

export function summarizeStudentAttendance(list) {
  const rows = Array.isArray(list) ? list : [];
  const summary = { total: rows.length, hadir: 0, izin: 0, sakit: 0, alfa: 0, alpa: 0 };
  for (const row of rows) {
    const status = String(row?.status || "").toLowerCase();
    if (status === "hadir" || status === "present") summary.hadir += 1;
    else if (status === "izin") summary.izin += 1;
    else if (status === "sakit") summary.sakit += 1;
    else if (status === "alfa") summary.alfa += 1;
    else summary.alpa += 1;
  }
  return summary;
}

export function resolveJournalInitialStatus(material) {
  return material && String(material).trim().length > 0 ? "saved" : "draft";
}

export function journalSaveButtonLabel({ saving, justSaved }) {
  if (saving) return "Menyimpan...";
  if (justSaved) return "Tersimpan";
  return "Simpan Jurnal";
}
export const JOURNAL_PLACEHOLDER = "KBM (Menunggu Update Jurnal)";

export function isJournalFilled(material) {
  const text = String(material || "").trim();
  if (!text) return false;
  return !text.includes(JOURNAL_PLACEHOLDER);
}

export function summarizeSessionWorkflow(session) {
  const list = Array.isArray(session?.studentAttendances) ? session.studentAttendances : [];
  const hadir = list.filter((r) => String(r?.status || "").toLowerCase() === "hadir" || String(r?.status || "").toLowerCase() === "present").length;
  return {
    attTotal: list.length,
    attHadir: hadir,
    attFilled: list.length > 0,
    journalFilled: isJournalFilled(session?.journal?.material),
  };
}

const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

// "YYYY-MM-DD" of a session date (Firestore {_seconds}, Date or string), in the browser's day like the KBM calendar.
export function sessionDateString(value) {
  if (!value) return "";
  if (typeof value === "string") return /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : "";
  let d = null;
  if (value._seconds !== undefined) d = new Date(value._seconds * 1000);
  else if (value.seconds !== undefined) d = new Date(value.seconds * 1000);
  else if (value instanceof Date) d = value;
  if (!d || isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// "Back to KBM" lands on the session's own day, so an earlier month being completed stays open.
export function kbmDayLink(dateValue) {
  const date = sessionDateString(dateValue);
  return date ? `/dashboard/kbm?date=${date}` : "/dashboard/kbm";
}

// Right after saving one half of a KBM (student attendance or journal): what to do next.
//   saved: "absensi" | "jurnal"; session: the saved session (with studentAttendances + journal)
export function nextStepAfterSave({ saved, session, sessionId }) {
  const w = summarizeSessionWorkflow(session);
  const date = sessionDateString(session?.date);
  const month = date ? MONTH_NAMES[Number(date.slice(5, 7)) - 1] : "";
  const back = { label: month ? `Kembali ke kalender ${month}` : "Kembali ke kalender", to: kbmDayLink(date) };
  const toJournal = `/dashboard/kbm/${sessionId}/jurnal`;
  const toAttendance = `/dashboard/kbm/${sessionId}/absensi`;

  if (saved === "absensi") {
    if (!w.journalFilled) return { title: "Absensi santri tersimpan", primary: { label: "Lanjut isi Jurnal", to: toJournal }, secondary: back };
    return { title: "Absensi tersimpan, KBM ini lengkap", primary: { label: month ? `Selesai, ke kalender ${month}` : "Selesai", to: back.to }, secondary: { label: "Buka Jurnal", to: toJournal } };
  }
  if (!w.attFilled) return { title: "Jurnal tersimpan", primary: { label: "Lanjut isi Absensi Santri", to: toAttendance }, secondary: back };
  return { title: "Jurnal tersimpan, KBM ini lengkap", primary: { label: month ? `Selesai, ke kalender ${month}` : "Selesai", to: back.to }, secondary: { label: "Buka Absensi", to: toAttendance } };
}
