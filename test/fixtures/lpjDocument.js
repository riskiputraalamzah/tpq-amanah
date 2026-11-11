// A realistic teacher document, shaped like GET /lpj/:id/teachers/:guruId/document returns it.
// October–November 2026, "today" = 12 November 2026.

const SANTRI = ["Ahmad Fauzi", "Aisyah Putri", "Bilqis", "Daffa Alfarizi", "Ellen", "Fatimah Az-Zahra", "Hani", "Muhammad Rizky", "Nada", "Zaki"];
const BADAL_SANTRI = ["Al Ghozali", "Aldebaran", "Aiza", "Citra", "Dimas"];
const TODAY = "2026-11-12";

const pad = (n) => String(n).padStart(2, "0");
const weekdayOf = (date) => new Date(`${date}T12:00:00Z`).getUTCDay();

function students(names, date) {
  const seed = Number(date.slice(8, 10));
  return names.map((name, i) => {
    let status = "hadir";
    if ((seed + i) % 11 === 0) status = "izin";
    else if ((seed + i) % 13 === 0) status = "sakit";
    else if ((seed + i) % 17 === 0) status = "alfa";
    return { santriId: `s-${name}`, name, status };
  });
}

function month(period, label) {
  const [y, m] = period.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const days = [];
  for (let d = 1; d <= last; d++) {
    const date = `${period}-${pad(d)}`;
    const weekday = weekdayOf(date);
    let kind = "active";
    let holidayName = null;
    if (weekday === 0 || weekday === 6) kind = "weekend";
    else if (date === "2026-10-20") {
      kind = "holiday";
      holidayName = "Libur Yayasan";
    } else if (date > TODAY) kind = "future";

    let attendance = null;
    let state = null;
    const sessions = [];
    if (kind === "active") {
      if (date === "2026-10-06") attendance = { status: "izin", notes: "Acara keluarga" };
      else if (date === "2026-11-11") attendance = null;
      else attendance = { status: "hadir", notes: "" };

      if (attendance?.status === "hadir") {
        const isThursday = weekday === 4;
        sessions.push({
          id: `j6-${date}`,
          date,
          slotId: "wave_1",
          slot: "Sesi Sore",
          level: "Jilid 6",
          levelKey: "6",
          meetingNumber: isThursday ? null : d,
          material: isThursday ? "Yasin & Tahlil" : date === "2026-11-10" ? "" : `Halaman ${d} – ${d + 1}, makharijul huruf dan tajwid bacaan mad thabi'i`,
          notes: d % 5 === 0 ? "Santri perlu mengulang halaman sebelumnya" : "",
          supporting: d % 3 === 0 ? "Hafalan doa sehari-hari" : "",
          substituteFor: null,
          students: date === "2026-11-10" ? [] : students(SANTRI, date),
          complete: date !== "2026-11-10",
          missing: date === "2026-11-10" ? ["absen santri", "jurnal"] : [],
        });
        if (weekday === 1) {
          sessions.push({
            id: `j5-${date}`,
            date,
            slotId: "wave_2",
            slot: "Sesi Malam",
            level: "Jilid 5",
            levelKey: "5",
            meetingNumber: d,
            material: `Halaman ${d + 10}`,
            notes: "",
            substituteFor: "Ustadz Riski",
            students: students(BADAL_SANTRI, date),
            complete: true,
            missing: [],
          });
        }
      }
      if (!attendance) state = "no_attendance";
      else if (attendance.status !== "hadir") state = "leave";
      else state = sessions.every((s) => s.complete) ? "complete" : "incomplete";
    }
    days.push({ date, weekday, kind, holidayName, attendance, state, sessions });
  }
  const counted = days.filter((x) => x.state);
  return {
    period,
    label,
    days,
    counts: {
      teachingDays: counted.length,
      hadir: days.filter((x) => x.attendance?.status === "hadir").length,
      izin: days.filter((x) => x.attendance?.status === "izin").length,
      sakit: 0,
      tidakHadir: 0,
      noAttendance: counted.filter((x) => x.state === "no_attendance").length,
      complete: counted.filter((x) => x.state === "complete").length,
    },
  };
}

export function sampleLpjDocument(overrides = {}) {
  return {
    batch: { id: "b1", title: "LPJ Insentif Guru Oktober – November 2026", startPeriod: "2026-10", endPeriod: "2026-11", rangeLabel: "Oktober – November 2026", docDate: "2026-11-30" },
    tpq: { name: "TPQ Amanah", address: "Jl. Kertanegara No. 20 RT 05 RW 11 Sawotratap", headName: "Riski Putra Alamzah, S.Kom", nsq: "411235151939" },
    guru: { id: "aini", name: "Ulrotul Aini", nik: "3515164906000004", birthPlace: "Sidoarjo", birthDate: "2000-06-09", address: "Jl. Anusapati RT 03 RW 12 Sawotratap", position: "Guru/Pengajar TPQ" },
    ready: false,
    missingProfile: [],
    months: [month("2026-10", "Oktober 2026"), month("2026-11", "November 2026")],
    ...overrides,
  };
}
