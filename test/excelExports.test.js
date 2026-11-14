import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import {
  attendanceFilename,
  buildAttendanceWorkbook,
  buildKbmMonitorWorkbook,
  buildSantriWorkbook,
  monitorFilename,
  santriFilename,
} from "../src/utils/excelExports.js";
import { safeSheetName } from "../src/utils/excel.js";

// Write to a real .xlsx buffer and read it back, exactly what a user's Excel will see.
const roundTrip = async (workbook) => {
  const buffer = await workbook.xlsx.writeBuffer();
  assert.ok(buffer.byteLength > 1000, "a real xlsx file is produced");
  const loaded = new ExcelJS.Workbook();
  await loaded.xlsx.load(buffer);
  return loaded;
};
const fill = (cell) => cell.fill?.fgColor?.argb;

test("file names carry the date or period, and mark filtered exports", () => {
  const date = new Date("2026-11-11T05:00:00Z");
  assert.equal(santriFilename({ date }), "Daftar-Santri-2026-11-11.xlsx");
  assert.equal(santriFilename({ date, filtered: true }), "Daftar-Santri-2026-11-11-filter.xlsx");
  assert.equal(monitorFilename({ period: "2026-11" }), "Monitor-KBM-2026-11.xlsx");
  assert.equal(attendanceFilename({ period: "2026-11" }), "Rekap-Absensi-Guru-2026-11.xlsx");
  assert.equal(safeSheetName("Perlu: Tindak/Lanjut [1]?"), "Perlu Tindak Lanjut 1");
  assert.equal(safeSheetName("x".repeat(50)).length, 31);
});

test("santri sheet: nomor induk is real text (never 4.11E+16), header frozen, filter on", async () => {
  const rows = [
    { nomorInduk: "411235151939-26-001", name: "Bilqis", level: "Marhalah", status: "Aktif" },
    { nomorInduk: "41123515193926002", name: "Ellen", level: "Jilid 6", status: "Lulus" },
    { nomorInduk: "", name: "Tanpa Nomor", level: "Belum ditentukan", status: "Nonaktif" },
  ];
  const wb = await roundTrip(buildSantriWorkbook(ExcelJS, { rows }));
  const ws = wb.getWorksheet("Daftar Santri");
  assert.deepEqual(ws.getRow(1).values.slice(1), ["No", "No. Induk", "Nama", "Jilid / Marhalah", "Status"]);
  assert.equal(ws.getCell("B2").value, "411235151939-26-001");
  assert.equal(typeof ws.getCell("B3").value, "string", "a digits-only number stays a string");
  assert.equal(ws.getCell("B3").value, "41123515193926002", "all 17 digits survive (Excel numbers keep only 15)");
  assert.equal(ws.getCell("B4").value, "Belum ada");
  assert.deepEqual([ws.getCell("A2").value, ws.getCell("A4").value], [1, 3]);
  assert.equal(ws.views[0].ySplit, 1, "header row is frozen");
  assert.ok(ws.autoFilter, "filter buttons on the header");
  assert.equal(fill(ws.getCell("A1")), "FF1B5E20");
});

test("santri sheet with no rows still opens cleanly", async () => {
  const wb = await roundTrip(buildSantriWorkbook(ExcelJS, { rows: [] }));
  assert.equal(wb.getWorksheet("Daftar Santri").rowCount, 1);
});

const cells = (states) => Object.fromEntries(states.map(([date, state, sessions = []]) => [date, { state, attendance: state === "leave" ? "sakit" : "hadir", sessions }]));
const guru = (name, states, counts, extra = {}) => ({
  id: name.toLowerCase(),
  name,
  counts: { complete: 0, incomplete: 0, not_created: 0, no_attendance: 0, leave: 0, ...counts },
  counted: Object.values({ ...counts }).reduce((a, b) => a + b, 0),
  needsAction: (counts.incomplete || 0) + (counts.not_created || 0) + (counts.no_attendance || 0),
  percent: 50,
  lastKbm: "2026-11-03",
  cells: cells(states),
  ...extra,
});
const days = [
  { date: "2026-11-02", weekday: 1, kind: "active" },
  { date: "2026-11-03", weekday: 2, kind: "active" },
  { date: "2026-11-04", weekday: 3, kind: "active" },
  { date: "2026-11-05", weekday: 4, kind: "active" },
  { date: "2026-11-06", weekday: 5, kind: "holiday", holidayName: "Libur Yayasan" },
  { date: "2026-11-07", weekday: 6, kind: "weekend" },
  { date: "2026-11-09", weekday: 1, kind: "future" },
];
const sess = (complete, missing = []) => ({ id: "s", slot: "Sesi Sore", level: "Jilid 1", complete, missing });

test("KBM monitor workbook: summary, board with colours and legend, follow-up list", async () => {
  const gurus = [
    guru("Ella", [["2026-11-02", "complete", [sess(true)]], ["2026-11-03", "incomplete", [sess(false, ["jurnal"])]], ["2026-11-04", "not_created"], ["2026-11-05", "no_attendance"]], { complete: 1, incomplete: 1, not_created: 1, no_attendance: 1 }),
    guru("Febi", [["2026-11-02", "complete", [sess(true)]], ["2026-11-03", "leave"], ["2026-11-04", "complete", [sess(true)]], ["2026-11-05", "complete", [sess(true)]]], { complete: 3, leave: 1 }, { percent: 100 }),
  ];
  gurus[1].needsAction = 0;
  const data = { period: "2026-11", days, summary: { teachingDays: 4 } };
  const wb = await roundTrip(buildKbmMonitorWorkbook(ExcelJS, { data, gurus, filterNote: "Perlu tindak lanjut saja" }));
  assert.deepEqual(wb.worksheets.map((w) => w.name), ["Ringkasan", "Papan", "Perlu Tindak Lanjut"]);

  const summary = wb.getWorksheet("Ringkasan");
  assert.equal(summary.getCell("A1").value, "Monitor KBM - November 2026");
  assert.match(summary.getCell("A2").value, /2 guru \| 4 hari mengajar \| Perlu tindak lanjut saja/);
  assert.match(summary.getCell("A3").value, /Lengkap 4 dari 8 hari \(50%\)/);
  assert.deepEqual(summary.getRow(6).values.slice(1, 4), ["Guru", "Hari dihitung", "Lengkap"], "header sits below the title block");
  assert.equal(summary.getCell("A7").value, "Ella");
  assert.equal(fill(summary.getCell("D7")), "FFFFF3C4", "belum lengkap is highlighted");
  assert.equal(summary.getCell("H7").value, 0.5);
  assert.equal(summary.views[0].ySplit, 6);

  const board = wb.getWorksheet("Papan");
  assert.deepEqual(board.getRow(1).values.slice(1, 6), ["Guru", "Sen 2", "Sel 3", "Rab 4", "Kam 5"]);
  assert.equal(board.getRow(1).values.includes("Sen 9"), true, "future weekday columns stay (empty)");
  assert.equal(board.getRow(1).values.includes("Sab 7"), false, "weekends are left out");
  assert.deepEqual([board.getCell("B2").value, board.getCell("C2").value, board.getCell("D2").value, board.getCell("E2").value], ["✓", "½", "!", "?"]);
  assert.equal(fill(board.getCell("B2")), "FFC8E6C9");
  assert.equal(fill(board.getCell("C2")), "FFFFF3C4");
  assert.equal(fill(board.getCell("D2")), "FFFFDCC7");
  assert.equal(board.getCell("C3").value, "–", "leave");
  assert.equal(fill(board.getCell("F2")), "FFE0E0E0", "holiday cell is greyed");
  const lastCol = board.getRow(2).values.length - 1;
  assert.equal(board.getRow(2).getCell(lastCol - 1).value, "1/4");
  assert.equal(board.getCell("A5").value, "Keterangan");

  const followUp = wb.getWorksheet("Perlu Tindak Lanjut");
  assert.deepEqual(followUp.getRow(1).values.slice(1), ["Guru", "Tanggal", "Hari", "Status", "Keterangan"]);
  assert.equal(followUp.rowCount, 4, "3 problem days for Ella, none for Febi");
  assert.equal(followUp.getCell("A2").value, "Ella");
  assert.ok(followUp.getCell("B2").value instanceof Date, "dates are real dates, so they sort and filter");
  assert.equal(followUp.getCell("B2").value.toISOString().slice(0, 10), "2026-11-03", "oldest first");
  assert.equal(followUp.getCell("C2").value, "Selasa");
  assert.equal(followUp.getCell("E2").value, "Sesi Sore Jilid 1: jurnal belum diisi");
  assert.equal(followUp.getCell("E3").value, "Hadir, tapi belum membuat KBM");
  assert.equal(followUp.getCell("E4").value, "Belum ada absen kehadiran guru");
});

test("KBM monitor workbook when everything is complete", async () => {
  const gurus = [guru("Febi", [["2026-11-02", "complete", [sess(true)]]], { complete: 1 }, { percent: 100, needsAction: 0 })];
  const wb = await roundTrip(buildKbmMonitorWorkbook(ExcelJS, { data: { period: "2026-11", days, summary: { teachingDays: 1 } }, gurus }));
  const followUp = wb.getWorksheet("Perlu Tindak Lanjut");
  assert.equal(followUp.getCell("D2").value, "Semua lengkap");
});

test("attendance workbook: totals, holidays and the per-day grid", async () => {
  const teachers = [
    { id: "ella", name: "Ella", hadirCount: 2, tidakHadirCount: 1 },
    { id: "febi", name: "Febi", hadirCount: 1, tidakHadirCount: 0 },
  ];
  const records = [
    { guruId: "ella", date: "2026-11-02", status: "hadir" },
    { guruId: "ella", date: "2026-11-03", status: "hadir" },
    { guruId: "ella", date: "2026-11-04", status: "sakit" },
    { guruId: "ella", date: "2026-11-04", status: "hadir" }, // a second record for the same day: hadir wins
    { guruId: "febi", date: "2026-11-02", status: "izin" },
  ];
  const holidays = [{ date: "2026-11-06", name: "Libur Yayasan" }];
  const wb = await roundTrip(buildAttendanceWorkbook(ExcelJS, { period: "2026-11", teachers, records, holidays }));
  assert.deepEqual(wb.worksheets.map((w) => w.name), ["Rekap", "Per Tanggal"]);

  const rekap = wb.getWorksheet("Rekap");
  assert.equal(rekap.getCell("A1").value, "LAPORAN ABSENSI GURU - TPQ AMANAH");
  assert.equal(rekap.getCell("A2").value, "Periode: November 2026");
  assert.deepEqual(rekap.getRow(5).values.slice(1), ["No", "Nama Guru", "Hadir", "Izin / Tidak Hadir", "Gaji"]);
  assert.deepEqual([rekap.getCell("B6").value, rekap.getCell("C6").value, rekap.getCell("D6").value, rekap.getCell("E6").value], ["Ella", 2, 1, 20000]);
  assert.equal(rekap.getCell("E6").numFmt, '"Rp" #,##0');
  const labels = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [rekap.getCell(`B${8 + i}`).value, rekap.getCell(`C${8 + i}`).value]));
  assert.equal(labels["Total kehadiran"], 3);
  assert.equal(labels["Total gaji"], 30000);
  assert.equal(labels["Total hari efektif"], "20 hari", "21 weekdays in Nov 2026 minus the holiday");
  assert.equal(labels["Potensi gaji maksimal per guru"], 200000);
  assert.equal(labels["Jumat, 6 November"], "Libur Yayasan");

  const grid = wb.getWorksheet("Per Tanggal");
  assert.equal(grid.getRow(1).getCell(2).value, "Min 1");
  assert.equal(grid.getRow(1).getCell(3).value, "Sen 2");
  const col = (day) => day + 1;
  assert.equal(grid.getRow(2).getCell(col(2)).value, "H");
  assert.equal(grid.getRow(2).getCell(col(4)).value, "H", "hadir wins over sakit on the same day");
  assert.equal(grid.getRow(3).getCell(col(2)).value, "I");
  assert.equal(fill(grid.getRow(2).getCell(col(2))), "FFC8E6C9");
  assert.equal(fill(grid.getRow(2).getCell(col(1))), "FFE0E0E0", "Sunday 1 Nov is greyed");
  assert.equal(fill(grid.getRow(2).getCell(col(6))), "FFE0E0E0", "holiday is greyed");
  assert.equal(grid.views[0].xSplit, 1);
});

test("the three pages offer Excel export, and exceljs is only loaded on click", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const read = (file) => readFileSync(fileURLToPath(new URL(`../src/${file}`, import.meta.url)), "utf8");
  const santri = read("components/SantriManager.vue");
  const monitor = read("views/dashboard/admin/KbmMonitorView.vue");
  const attendance = read("views/dashboard/admin/AdminAttendanceView.vue");
  const util = read("utils/excel.js");

  assert.ok(santri.includes("buildSantriWorkbook") && santri.includes("@click=\"exportExcel\""), "Kelola Santri");
  assert.ok(monitor.includes("buildKbmMonitorWorkbook") && monitor.includes("@click=\"exportExcel\""), "Monitor KBM");
  assert.ok(attendance.includes("buildAttendanceWorkbook") && attendance.includes("@click=\"exportToExcel\""), "Rekap Absensi");
  assert.ok(santri.includes("sortedRows.value.map"), "the santri export follows the sorted, filtered rows");
  assert.ok(monitor.includes("rows.value") && monitor.includes("filterNote"), "the monitor export follows the filters");

  assert.ok(util.includes("import('exceljs')"), "dynamic import: downloaded on demand");
  for (const [name, source] of [["SantriManager", santri], ["KbmMonitorView", monitor], ["AdminAttendanceView", attendance]]) {
    assert.ok(!/from ['"]exceljs['"]/.test(source), `${name} never imports exceljs statically`);
  }
});

test("full santri data: NIK/KK stay text, birth date is a real date, columns follow the form, summary per jilid", async () => {
  const { STEPS, STATUS, RELATIONS } = await import("../src/utils/santriProfile.js");
  const { buildSantriDataWorkbook, santriDataFilename } = await import("../src/utils/excelExports.js");
  const rows = [
    {
      santriId: "s1", name: "Ahmad", classId: "1", nomorInduk: "411235151939-26-001", profileStatus: "verified",
      data: { santri: { namaLengkap: "Ahmad Fauzi", jenisKelamin: "L", tanggalLahir: "2016-03-21", nik: "3515016103160002" }, keluarga: { noKK: "3515010101160099" }, ibu: { hp: "6281298765432" } },
      guardians: [{ relation: "ibu", phone: "6281298765432" }], hasKkPhoto: true, hasPendingIdentity: false,
      submittedAt: { _seconds: 1794000000 }, verifiedAt: { _seconds: 1794100000 }, verifiedByName: "Admin TPQ",
    },
    { santriId: "s2", name: "Budi", classId: "1", nomorInduk: "", profileStatus: "empty", data: {}, guardians: [] },
    { santriId: "s3", name: "Citra", classId: "7", nomorInduk: "", profileStatus: "submitted", data: {}, guardians: [{ relation: "ayah", phone: "6285711112222" }], hasPendingIdentity: true },
  ];
  assert.equal(santriDataFilename({ date: new Date("2026-11-14T05:00:00Z"), filtered: true }), "Data-Santri-Lengkap-2026-11-14-filter.xlsx");
  const wb = await roundTrip(buildSantriDataWorkbook(ExcelJS, { rows, steps: STEPS, status: STATUS, relations: RELATIONS, filterLabel: "Jilid 1" }));
  const sheet = wb.getWorksheet("Data Santri");
  const headerRow = 5;
  const headers = sheet.getRow(headerRow).values.slice(1);
  const col = (name) => headers.indexOf(name) + 1;
  assert.ok(col("NIK anak") > 0 && col("Nomor Kartu Keluarga (KK)") > 0 && col("Catatan kesehatan") > 0, headers.join(" | "));
  const first = sheet.getRow(headerRow + 1);
  assert.equal(first.getCell(col("NIK anak")).value, "3515016103160002");
  assert.equal(first.getCell(col("NIK anak")).numFmt, "@");
  assert.equal(first.getCell(col("Nomor Kartu Keluarga (KK)")).value, "3515010101160099");
  assert.ok(first.getCell(col("Tanggal lahir")).value instanceof Date);
  assert.equal(first.getCell(col("Jenis kelamin")).value, "Laki-laki");
  assert.equal(first.getCell(col("No. HP ibu")).value, "0812 9876 5432");
  assert.equal(first.getCell(col("Wali tertaut")).value, "Ibu 0812 9876 5432");
  assert.equal(first.getCell(col("Status data")).value, "Terverifikasi");
  assert.equal(fill(first.getCell(col("Status data"))), "FFC8E6C9");
  assert.equal(sheet.getRow(headerRow + 3).getCell(col("Perubahan identitas")).value, "Menunggu admin");
  assert.match(String(sheet.getCell(3, 1).value), /data pribadi/);
  const summary = wb.getWorksheet("Ringkasan per jilid");
  const sumRows = [5, 6, 7].map((r) => summary.getRow(r).values.slice(1, 9));
  assert.deepEqual(sumRows[0], ["Jilid 1", 2, 1, 1, 0, 0, 0, 1]);
  assert.deepEqual(sumRows[1], ["Marhalah", 1, 1, 0, 0, 1, 0, 0]);
  assert.deepEqual(sumRows[2], ["Jumlah", 3, 2, 1, 0, 1, 0, 1]);
});

test("pendaftaran: one row per registrant, the form's answers as text, dates as real dates", async () => {
  const { STEPS, REG_STATUS, shownValue } = await import("../src/utils/pendaftaran.js");
  const { buildRegistrationWorkbook, registrationFilename } = await import("../src/utils/excelExports.js");
  assert.equal(registrationFilename({ date: new Date("2026-11-14T05:00:00Z") }), "Pendaftaran-Santri-Baru-2026-11-14.xlsx");
  const rows = [
    {
      number: "PSB-2026-001",
      status: "scheduled",
      submittedAt: { _seconds: Date.UTC(2026, 10, 14, 3) / 1000 },
      phone: "6281234567890",
      schedule: { date: "2026-11-17", time: "15:30" },
      data: {
        santri: { namaLengkap: "Muhammad Rizky", jenisKelamin: "L", tanggalLahir: "2019-01-07" },
        riwayat: { pernahTpq: "baru", sesi: "sore" },
        ayah: { nama: "Ahmad", status: "hidup" },
      },
    },
  ];
  const wb = await roundTrip(buildRegistrationWorkbook(ExcelJS, { rows, steps: STEPS, shown: shownValue, status: REG_STATUS, exportedAt: new Date("2026-11-14T05:00:00Z") }));
  const sheet = wb.getWorksheet("Pendaftar");
  const header = sheet.getRow(5).values.slice(1);
  const at = (label) => header.indexOf(label) + 1;
  const row = sheet.getRow(6);
  assert.equal(row.getCell(at("No. Pendaftaran")).value, "PSB-2026-001");
  assert.equal(row.getCell(at("Status")).value, "Jadwal penempatan");
  assert.equal(row.getCell(at("No. WhatsApp")).value, "0812 3456 7890");
  assert.equal(row.getCell(at("Jenis kelamin")).value, "Laki-laki");
  assert.equal(row.getCell(at("Pilihan sesi mengaji")).value, "Sesi Sore");
  assert.equal(row.getCell(at("Status ayah")).value, "Masih hidup");
  assert.ok(row.getCell(at("Tanggal lahir")).value instanceof Date);
  assert.equal(row.getCell(at("Jadwal penempatan")).value, "17/11/2026 15:30");
});
