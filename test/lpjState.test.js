import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const lpj = await import("../src/utils/lpjState.js");

test("period helpers label months without hardcoding September", () => {
  assert.equal(lpj.periodLabel("2026-09"), "September 2026");
  assert.equal(lpj.periodLabel("2026-01"), "Januari 2026");
  assert.equal(lpj.periodLabel("bad-input"), "bad-input");
  assert.match(lpj.currentPeriod(), /^\d{4}-\d{2}$/);
});

test("status labels follow draft-submitted-approved lifecycle", () => {
  assert.equal(lpj.statusLabel("draft"), "Draft");
  assert.equal(lpj.statusLabel("submitted"), "Diajukan");
  assert.equal(lpj.statusLabel("approved"), "Disetujui");
});

test("missing attendance navigates to Absensi", () => {
  const action = lpj.resolveDayAction(
    { date: "2026-09-04", isCovered: false, statusClassification: "missing", note: "Tidak ada presensi kehadiran" },
    {},
  );
  assert.equal(action.to, "/dashboard/attendance");
});

test("hadir without session navigates to KBM", () => {
  const action = lpj.resolveDayAction(
    { date: "2026-09-05", isCovered: false, statusClassification: "missing", note: "Hadir namun tidak ada jurnal KBM atau catatan Non-KBM" },
    {},
  );
  assert.equal(action.to, "/dashboard/kbm?date=2026-09-05");
});

test("session without student attendance links to Absensi Santri", () => {
  const action = lpj.resolveDayAction(
    { date: "2026-09-01", isCovered: true, statusClassification: "present_teaching", note: "x" },
    { "2026-09-01": [{ id: "sess1", type: "teaching", studentAttendances: [], journal: { material: "RPP" } }] },
  );
  assert.equal(action.to, "/dashboard/kbm/sess1/absensi");
});

test("session without journal links to Jurnal", () => {
  const action = lpj.resolveDayAction(
    { date: "2026-09-01", isCovered: true, statusClassification: "present_teaching", note: "x" },
    { "2026-09-01": [{ id: "sess1", type: "teaching", studentAttendances: [{ santriId: "a" }], journal: { material: "" } }] },
  );
  assert.equal(action.to, "/dashboard/kbm/sess1/jurnal");
});

test("complete day and permitted absence need no action", () => {
  const full = lpj.resolveDayAction(
    { date: "2026-09-01", isCovered: true, statusClassification: "present_teaching", note: "x" },
    { "2026-09-01": [{ id: "s1", type: "teaching", studentAttendances: [{ santriId: "a" }], journal: { material: "RPP" } }] },
  );
  assert.equal(full.kind, "none");
  const izin = lpj.resolveDayAction(
    { date: "2026-09-03", isCovered: true, statusClassification: "permitted_absence", note: "Sakit" },
    {},
  );
  assert.equal(izin.kind, "none");
});

test("incomplete message names missing day count", () => {
  assert.match(lpj.incompleteMessage({ missingDays: 3 }), /3 hari/);
});

test("MonthlyLpjView responsive smoke: cards, LPJ wording, no local percentage", () => {
  const src = fs.readFileSync(path.join(here, "../src/views/dashboard/guru/MonthlyLpjView.vue"), "utf8");
  assert.match(src, /LPJ Bulanan/);
  assert.match(src, /Lihat Detail/);
  assert.match(src, /\/ljp\/reports/);
  assert.match(src, /@media/);
  assert.match(src, /100%/);
  assert.ok(!src.includes("Math.round"), "percentage must come from backend");
  assert.match(src, /Belum Ada Laporan/);
  assert.match(src, /progressbar/);
  assert.match(src, /SkeletonLoader/);
  assert.match(src, /Tampilkan/);
});

test("LpjDetailView smoke: backend completeness, day actions, submit states", () => {
  const src = fs.readFileSync(path.join(here, "../src/views/dashboard/guru/LpjDetailView.vue"), "utf8");
  assert.match(src, /\/completeness/);
  assert.match(src, /\/submit/);
  assert.match(src, /\/approve/);
  assert.match(src, /\/reopen/);
  assert.match(src, /Belum lengkap/);
  assert.match(src, /@media/);
  assert.match(src, /100%/);
  assert.ok(!src.includes("Math.round"), "percentage must come from backend");
  assert.match(src, /Kelengkapan LPJ/);
  assert.match(src, /Rincian Harian/);
  assert.match(src, /Pengajuan/);
  assert.match(src, /progressbar/);
});

test("AdminLpjView smoke: period filter, approve, reopen", () => {
  const src = fs.readFileSync(path.join(here, "../src/views/dashboard/admin/AdminLpjView.vue"), "utf8");
  assert.match(src, /LPJ Guru/);
  assert.match(src, /\/approve/);
  assert.match(src, /\/reopen/);
  assert.match(src, /type="month"/);
  assert.match(src, /Belum ada laporan/);
  assert.match(src, /report-cards/);
  assert.match(src, /Tampilkan/);
});
test("LPJ day KBM action preserves exact ISO date in route", () => {
  const action = lpj.resolveDayAction(
    { date: "2026-09-05", isCovered: false, statusClassification: "missing", note: "Hadir namun tidak ada jurnal KBM atau catatan Non-KBM" },
    {},
  );
  assert.equal(action.to, "/dashboard/kbm?date=2026-09-05");
  assert.ok(!action.to.includes("September"), "must pass ISO date, not display text");
});

test("resolveKbmDateFromQuery accepts valid ISO incl backfill dates", () => {
  assert.equal(lpj.resolveKbmDateFromQuery("2026-09-05"), "2026-09-05");
  assert.equal(lpj.resolveKbmDateFromQuery("2026-09-01"), "2026-09-01");
});

test("resolveKbmDateFromQuery falls back to null without date", () => {
  assert.equal(lpj.resolveKbmDateFromQuery(undefined), null);
  assert.equal(lpj.resolveKbmDateFromQuery(""), null);
  assert.equal(lpj.resolveKbmDateFromQuery(null), null);
});

test("resolveKbmDateFromQuery rejects invalid without silent remap", () => {
  assert.equal(lpj.resolveKbmDateFromQuery("5 September 2026"), null);
  assert.equal(lpj.resolveKbmDateFromQuery("2026-13-01"), null);
  assert.equal(lpj.resolveKbmDateFromQuery("2026-02-30"), null);
  assert.equal(lpj.resolveKbmDateFromQuery("today"), null);
});

test("KbmView initializes date from route query before data fetch", () => {
  const src = fs.readFileSync(path.join(here, "../src/views/dashboard/guru/KbmView.vue"), "utf8");
  assert.match(src, /route\.query\.date/);
  assert.match(src, /resolveKbmDateFromQuery/);
  assert.match(src, /contextualDate \|\| todayString/);
  assert.match(src, /viewedPeriod/);
});

test("isFutureDay compares calendar days without hardcoded today", () => {
  const now = new Date(2026, 8, 12);
  assert.equal(lpj.isFutureDay("2026-09-13", now), true);
  assert.equal(lpj.isFutureDay("2026-09-14", now), true);
  assert.equal(lpj.isFutureDay("2026-09-12", now), false);
  assert.equal(lpj.isFutureDay("2026-09-11", now), false);
  assert.equal(lpj.isFutureDay("bad-date", now), false);
  const src = fs.readFileSync(path.join(here, "../src/utils/lpjState.js"), "utf8");
  assert.ok(!src.includes("2026-09-12"), "today must come from system date, not hardcoded");
});

test("future KBM day action disabled with no navigation target", () => {
  const now = new Date(2026, 8, 12);
  const action = lpj.resolveDayAction(
    { date: "2026-09-13", isCovered: false, statusClassification: "missing", note: "Hadir namun tidak ada jurnal KBM atau catatan Non-KBM" },
    {},
    now,
  );
  assert.equal(action.kind, "disabled");
  assert.equal(action.to, undefined);
  assert.equal(action.reason, "Belum dapat diisi");
});

test("today and past KBM days stay enabled with date context", () => {
  const now = new Date(2026, 8, 12);
  const day = (date) => ({ date, isCovered: false, statusClassification: "missing", note: "Hadir namun tidak ada jurnal KBM atau catatan Non-KBM" });
  assert.equal(lpj.resolveDayAction(day("2026-09-12"), {}, now).kind, "link");
  assert.equal(lpj.resolveDayAction(day("2026-09-11"), {}, now).to, "/dashboard/kbm?date=2026-09-11");
});

test("Lihat Detail is primary green CTA", () => {
  const src = fs.readFileSync(path.join(here, "../src/views/dashboard/guru/MonthlyLpjView.vue"), "utf8");
  assert.match(src, /btn-open-detail/);
  assert.match(src, /Lihat Detail/);
  assert.match(src, /btn-open-detail:hover/);
  assert.match(src, /--primary/);
  const btnAt = src.indexOf("class=\"btn-open-detail\"");
  const btnBlock = src.slice(btnAt, btnAt + 400);
  assert.ok(!btnBlock.includes("btn-secondary"), "Lihat Detail must not be grey secondary");
});

test("disabled future CTA is muted primary green and non-interactive", () => {
  const src = fs.readFileSync(path.join(here, "../src/views/dashboard/guru/LpjDetailView.vue"), "utf8");
  assert.match(src, /btn btn-primary btn-day btn-disabled/);
  assert.match(src, /<button[^>]*disabled>/);
  assert.match(src, /cursor: not-allowed/);
  assert.match(src, /opacity: 0\.55/);
  assert.match(src, /dayAction\(day\)\.reason/);
  const utilSrc = fs.readFileSync(path.join(here, "../src/utils/lpjState.js"), "utf8");
  assert.match(utilSrc, /Belum dapat diisi/);
  const disabledBlock = src.slice(src.indexOf("day-action-disabled"), src.indexOf("day-action-disabled") + 600);
  assert.ok(!disabledBlock.includes("router-link") && !disabledBlock.includes("@click") && !disabledBlock.includes("api."), "disabled CTA must not navigate or call API");
});

test("backend keeps authoritative future-date and attendance guards", () => {
  const src = fs.readFileSync(path.join(here, "../../backend/src/routes/teaching_sessions.js"), "utf8");
  assert.match(src, /sesi masa depan/);
  assert.match(src, /belum mengisi absen kehadiran/);
  assert.match(src, /periode operasional aktif/);
});
