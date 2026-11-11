import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCalendar, dayState, normalizeLevel, longDate } from "../src/utils/kbmCalendar.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const kbmView = fs.readFileSync(path.join(here, "../src/views/dashboard/guru/KbmView.vue"), "utf8");

const day = (date, extra = {}) => ({
  date,
  weekday: new Date(`${date}T12:00:00Z`).getUTCDay(),
  kind: "active",
  holidayName: null,
  attendance: null,
  sessions: [],
  ...extra,
});
const malamJilid6 = { id: "s1", sessionSlotId: "wave_2", levelId: "6", type: "teaching" };
const opts = { slotId: "wave_2", classId: "6", minDate: "2026-11-01", maxDate: "2026-11-11" };

test("a date with KBM for the same sesi + jilid is locked and opens that KBM", () => {
  const info = dayState(day("2026-11-03", { attendance: "hadir", sessions: [malamJilid6] }), opts);
  assert.equal(info.state, "filled");
  assert.equal(info.sessionId, "s1");
});

test("a second jilid in the same sesi stays selectable (Ustadzah Ella's case)", () => {
  const info = dayState(day("2026-11-03", { attendance: "hadir", sessions: [malamJilid6] }), { ...opts, classId: "5" });
  assert.equal(info.state, "partial");
  assert.equal(dayState(day("2026-11-03", { attendance: "hadir", sessions: [malamJilid6] }), { ...opts, slotId: "wave_1" }).state, "partial", "another sesi too");
});

test("Marhalah levels compare like the backend key", () => {
  assert.equal(normalizeLevel("marhalah"), "7");
  const info = dayState(day("2026-11-03", { sessions: [{ id: "m", sessionSlotId: "wave_2", levelId: "7" }] }), { ...opts, classId: "8" });
  assert.equal(info.state, "filled");
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

test("without sesi + jilid nothing is marked filled yet", () => {
  assert.equal(dayState(day("2026-11-03", { sessions: [malamJilid6] }), { ...opts, classId: "" }).state, "partial");
});

test("month grid starts on Monday and lists the days to complete", () => {
  const days = ["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04"].map((d, i) =>
    day(d, i === 0 ? { kind: "weekend" } : i === 1 ? { attendance: "hadir" } : i === 2 ? { attendance: "hadir", sessions: [malamJilid6] } : {}),
  );
  const view = buildCalendar({ period: "2026-11", today: "2026-11-04", days }, { ...opts, selectedDate: "2026-11-04" });
  assert.equal(view.title, "November 2026");
  assert.equal(view.leadingBlanks, 6, "1 Nov 2026 is a Sunday");
  assert.deepEqual(view.needsDates, ["2026-11-02"]);
  const [sun, mon, tue, wed] = view.cells;
  assert.equal(sun.selectable, false);
  assert.equal(mon.selectable, true);
  assert.deepEqual([tue.selectable, tue.openable], [false, true]);
  assert.ok(wed.isToday && wed.isSelected);
  assert.match(tue.ariaLabel, /^Selasa, 3 November 2026\. KBM sesi & jilid ini sudah diisi/);
  assert.equal(longDate("2026-11-11"), "Rabu, 11 November 2026");
});

test("KBM form: sesi and jilid come before the date, duplicates are checked per jilid", () => {
  const order = ["<!-- Sesi Pembelajaran -->", "<!-- Pilih Jilid / Kelas -->", "<!-- Tanggal KBM -->"].map((m) => kbmView.indexOf(m));
  assert.ok(order[0] < order[1] && order[1] < order[2], "Sesi -> Jilid -> Tanggal");
  assert.ok(kbmView.includes("<KbmDatePicker"), "uses the KBM calendar");
  assert.ok(kbmView.includes("normalizeLevel(s.levelId || s.classId) === selectedLevel"), "same sesi, other jilid is allowed");
  assert.ok(kbmView.includes('@open-session="openExistingSession"'), "filled dates open the existing KBM");
  assert.ok(kbmView.includes('api.get("/teaching_sessions/calendar")'));
});
