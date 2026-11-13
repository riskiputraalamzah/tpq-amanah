import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCalendar, dayState, normalizeLevel, longDate, shiftPeriod } from "../src/utils/kbmCalendar.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const kbmView = fs.readFileSync(path.join(here, "../src/views/dashboard/guru/KbmView.vue"), "utf8");
const picker = fs.readFileSync(path.join(here, "../src/components/KbmDatePicker.vue"), "utf8");

const day = (date, extra = {}) => ({
  date,
  weekday: new Date(`${date}T12:00:00Z`).getUTCDay(),
  kind: "active",
  holidayName: null,
  attendance: null,
  sessions: [],
  ...extra,
});
// sessions as the calendar API returns them: with their completeness
const malamJilid6 = { id: "s1", sessionSlotId: "wave_2", levelId: "6", type: "teaching", complete: true, missing: [] };
const soreJilid5Open = { id: "s2", sessionSlotId: "wave_1", levelId: "5", type: "teaching", complete: false, missing: ["jurnal"] };
const opts = { minDate: "2026-11-01", maxDate: "2026-11-11" };

test("a day with KBM is 'done' when every KBM is complete - whatever sesi or jilid it was", () => {
  const info = dayState(day("2026-11-03", { attendance: "hadir", sessions: [malamJilid6] }), opts);
  assert.equal(info.state, "done");
  assert.equal(info.label, "KBM lengkap");
  const two = dayState(day("2026-11-03", { attendance: "hadir", sessions: [malamJilid6, { ...malamJilid6, id: "s3", levelId: "7" }] }), opts);
  assert.deepEqual([two.state, two.count, two.label], ["done", 2, "2 KBM, semua lengkap"]);
});

test("a day with a KBM still missing student attendance or journal is 'incomplete'", () => {
  const info = dayState(day("2026-11-03", { attendance: "hadir", sessions: [malamJilid6, soreJilid5Open] }), opts);
  assert.equal(info.state, "incomplete");
  assert.match(info.label, /2 KBM, 1 belum lengkap/);
});

test("the day state never depends on a sesi/jilid selection (the old cause of the '1' badges)", () => {
  const withSelection = dayState(day("2026-11-03", { sessions: [malamJilid6] }), { ...opts, slotId: "wave_1", classId: "1" });
  assert.equal(withSelection.state, "done");
});

test("Marhalah levels compare like the backend key", () => {
  assert.equal(normalizeLevel("marhalah"), "7");
  assert.equal(normalizeLevel("8"), "7");
  assert.equal(normalizeLevel("6"), "6");
});

test("present without KBM, not checked in, on leave, holiday, weekend, future, outside the period", () => {
  assert.equal(dayState(day("2026-11-04", { attendance: "hadir" }), opts).state, "needs");
  assert.equal(dayState(day("2026-11-05"), opts).state, "no-att");
  const leave = dayState(day("2026-11-09", { attendance: "sakit" }), opts);
  assert.deepEqual([leave.state, leave.label], ["absent", "Tercatat sakit"]);
  assert.equal(dayState(day("2026-11-06", { kind: "holiday", holidayName: "Libur Yayasan" }), opts).label, "Libur: Libur Yayasan");
  assert.equal(dayState(day("2026-11-07", { kind: "weekend" }), opts).state, "off");
  assert.equal(dayState(day("2026-11-12", { kind: "future" }), opts).state, "off");
  assert.equal(dayState(day("2026-11-10"), { ...opts, maxDate: "2026-11-09" }).state, "off");
  assert.equal(dayState(day("2026-10-30"), opts).label, "Di luar periode aktif");
});

test("month grid starts on Sunday like the attendance calendar; empty days are filled, days with KBM are opened", () => {
  const days = ["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05"].map((d, i) =>
    day(d, [{ kind: "weekend" }, { attendance: "hadir" }, { attendance: "hadir", sessions: [malamJilid6] }, {}, { attendance: "hadir", sessions: [soreJilid5Open] }][i]),
  );
  const view = buildCalendar({ period: "2026-11", today: "2026-11-04", days }, { ...opts, selectedDate: "2026-11-04" });
  assert.equal(view.title, "November 2026");
  assert.equal(view.leadingBlanks, 0, "1 Nov 2026 is a Sunday: first column");
  const oct = buildCalendar({ period: "2026-10", today: "2026-11-04", days: [day("2026-10-01")] });
  assert.equal(oct.leadingBlanks, 4, "1 Oct 2026 is a Thursday: after Min, Sen, Sel, Rab");
  assert.ok(picker.includes("['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']"), "headers in the same order");
  assert.deepEqual(view.needsDates, ["2026-11-02"]);
  assert.deepEqual(view.incompleteDates, ["2026-11-05"]);
  const [sun, mon, tue, wed, thu] = view.cells;
  assert.equal(sun.selectable, false);
  assert.deepEqual([mon.selectable, mon.openable], [true, false], "hadir without KBM: fill it");
  assert.deepEqual([tue.selectable, tue.openable], [false, true], "KBM saved: open the day");
  assert.deepEqual([thu.state, thu.openable], ["incomplete", true]);
  assert.ok(wed.isToday && wed.isSelected);
  assert.match(tue.ariaLabel, /^Selasa, 3 November 2026\. KBM lengkap/);
  assert.equal(longDate("2026-11-11"), "Rabu, 11 November 2026");
});

test("month arrows: back to the first recorded month, forward up to the current month", () => {
  assert.equal(shiftPeriod("2026-01", -1), "2025-12");
  assert.equal(shiftPeriod("2026-12", 1), "2027-01");
  assert.equal(shiftPeriod("2026-07", 4), "2026-11");
  assert.equal(shiftPeriod("", 1), "");
  const nov = buildCalendar({ period: "2026-11", firstPeriod: "2026-01", today: "2026-11-12", days: [] });
  assert.deepEqual([nov.prevPeriod, nov.nextPeriod], ["2026-10", ""], "no future month");
  const jan = buildCalendar({ period: "2026-01", firstPeriod: "2026-01", today: "2026-11-12", days: [] });
  assert.deepEqual([jan.prevPeriod, jan.nextPeriod], ["", "2026-02"], "nothing before January 2026");
  const jul = buildCalendar({ period: "2026-07", firstPeriod: "2026-01", today: "2026-11-12", days: [] });
  assert.deepEqual([jul.title, jul.prevPeriod, jul.nextPeriod], ["Juli 2026", "2026-06", "2026-08"]);
});

test("a month the teacher can no longer fill: nothing to fill, existing KBM still opens", () => {
  const days = [
    day("2026-07-13", { attendance: "hadir" }),
    day("2026-07-14", { attendance: "hadir", sessions: [malamJilid6] }),
    day("2026-07-15"),
  ];
  const closed = buildCalendar({ period: "2026-07", firstPeriod: "2026-01", today: "2026-11-12", canFill: false, days });
  assert.equal(closed.canFill, false);
  assert.deepEqual(closed.cells.map((c) => c.state), ["off", "done", "off"]);
  assert.deepEqual(closed.cells.map((c) => c.selectable), [false, false, false]);
  assert.equal(closed.cells[1].openable, true, "already saved KBM can be opened");
  assert.deepEqual(closed.needsDates, [], "nothing to fill in a closed month");
  const open = buildCalendar({ period: "2026-07", firstPeriod: "2026-01", today: "2026-11-12", canFill: true, days });
  assert.deepEqual(open.cells.map((c) => c.state), ["needs", "done", "no-att"], "an LPJ month is fillable like the current one");
  assert.deepEqual(open.needsDates, ["2026-07-13"]);
});

test("KBM page: no sesi/jilid form any more; the calendar is the page and filling goes to the Daily Workspace", () => {
  assert.ok(!kbmView.includes('id="input-kbm-slot"') && !kbmView.includes('id="input-kbm-class"'), "no sesi / jilid dropdowns");
  assert.ok(!kbmView.includes("submitSession"), "KBM is not created from this page");
  assert.ok(kbmView.includes("<KbmDatePicker"), "uses the KBM calendar");
  assert.ok(kbmView.includes('@pick="pickDay"'), "a tap on a day is handled by the page");
  assert.ok(kbmView.includes("/dashboard/kbm/daily-workspace?date=${date}&from=kbm"), "an empty day opens the Daily Workspace on that date");
  assert.ok(kbmView.includes('role="dialog"') && kbmView.includes("sheetSessions"), "a day with KBM opens its own sheet");
  assert.ok(kbmView.includes("Tambah KBM lain di tanggal ini"), "a second class the same day is still possible");
  assert.ok(kbmView.includes("Perlu Dilengkapi") && kbmView.includes("todoItems"), "short to-do list instead of the full history");
  assert.ok(!kbmView.includes("filteredHistory"), "the full history list is gone");
});

test("KBM page: the viewed month moves with the arrows and with ?date from links, and reloads its data", () => {
  assert.ok(kbmView.includes('@change-month="changeMonth"'), "picker arrows change the month");
  assert.ok(kbmView.includes("viewedMonth = ref((contextualDate || todayString).slice(0, 7))"), "?date opens that month");
  assert.ok(kbmView.includes('api.get("/teaching_sessions/calendar", { params: { period: viewedMonth.value } })'), "calendar of the viewed month");
  assert.ok(kbmView.includes("if (request !== monthRequest) return;"), "fast taps: the latest month wins");
  assert.ok(kbmView.includes("openSheet(contextualDate)"), "coming back to a day with KBM shows that day again");
});

test("delete: the dialog closes itself after deleting (the old guard kept it open)", () => {
  const confirm = kbmView.slice(kbmView.indexOf("const confirmDeleteSession"), kbmView.indexOf("// The calendar's own month changes"));
  assert.ok(confirm.includes("deletingSession.value = null;"), "closed directly, not through closeDeleteModal()");
  assert.ok(!confirm.includes("closeDeleteModal()"), "closeDeleteModal refuses while deletingLoading is on");
  assert.ok(confirm.indexOf("deletingSession.value = null;") < confirm.indexOf("showSuccess("), "closed before the message shows");
});

test("calendar legend explains every mark; no selection-dependent hint left", () => {
  for (const text of ["KBM lengkap", "Absen santri / jurnal belum", "Hadir, KBM belum diisi", "Belum absen", "Libur / izin"]) {
    assert.ok(picker.includes(text), text);
  }
  assert.ok(!picker.includes("Pilih sesi &amp; jilid dulu"), "the old hint is gone");
  assert.ok(!picker.includes("Ada KBM jilid/sesi lain"), "the confusing '1' badge is gone");
});
