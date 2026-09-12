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
