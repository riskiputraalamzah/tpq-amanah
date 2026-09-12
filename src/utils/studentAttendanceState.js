export function parseSessionDate(value) {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "object") {
    if (typeof value.toDate === "function") {
      try {
        const d = value.toDate();
        return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
      } catch {
        return null;
      }
    }
    const s = value._seconds ?? value.seconds;
    if (s === undefined || s === null) return null;
    const d = new Date(Number(s) * 1000);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
    if (m) {
      const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function formatSessionDateID(value) {
  const d = parseSessionDate(value);
  if (!d) return "Tanggal tidak tersedia";
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatTimeID(date = new Date()) {
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function resolveInitialStatus(existingCount, rosterCount) {
  if (rosterCount <= 0) return "empty";
  return existingCount > 0 ? "saved" : "unsaved";
}

export function applyAllPresent(rows) {
  return (rows || []).map((row) => ({ ...row, status: "hadir" }));
}

export function saveButtonLabel({ saving, justSaved } = {}) {
  if (saving) return "Menyimpan...";
  if (justSaved) return "Tersimpan";
  return "Simpan Absensi";
}

export function isSessionFuture(value, now = new Date()) {
  const d = parseSessionDate(value);
  if (!d) return false;
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return day.getTime() > today.getTime();
}