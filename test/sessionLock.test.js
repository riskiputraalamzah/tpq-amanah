import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pickMonthReport, lockMessage, isLockedStatus, sessionPeriod } from "../src/utils/lpjLock.js";
import { buildCalendar } from "../src/utils/kbmCalendar.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => fs.readFileSync(path.join(here, "..", p), "utf8");

test("the month's report: a locked one wins, otherwise the first", () => {
  assert.equal(pickMonthReport([{ status: "draft" }, { status: "approved" }]).status, "approved");
  assert.equal(pickMonthReport([{ status: "draft" }]).status, "draft");
  assert.equal(pickMonthReport(null), null);
  assert.deepEqual(["draft", "submitted", "approved", undefined].map(isLockedStatus), [false, true, true, false]);
  assert.match(lockMessage("approved"), /Disetujui.*hanya bisa dilihat.*Hubungi admin/);
  assert.match(lockMessage("submitted"), /Menunggu Persetujuan/);
  assert.equal(lockMessage("draft"), "");
});

test("session month in WIB from the API's date shapes", () => {
  assert.equal(sessionPeriod({ _seconds: Date.parse("2026-09-30T18:00:00Z") / 1000 }), "2026-10", "01:00 WIB on 1 Oct");
  assert.equal(sessionPeriod("2026-09-10"), "2026-09");
  assert.equal(sessionPeriod("2026-09-09T17:30:00.000Z"), "2026-09");
  assert.equal(sessionPeriod(null), "");
});

test("a locked month keeps its calendar: nothing to fill, existing KBM still opens, arrows still work", () => {
  const day = (date, extra) => ({ date, weekday: new Date(`${date}T12:00:00Z`).getUTCDay(), kind: "active", attendance: "hadir", sessions: [], ...extra });
  const calendar = {
    period: "2026-09", firstPeriod: "2026-01", today: "2026-11-12", canFill: true,
    days: [day("2026-09-29"), day("2026-09-30", { sessions: [{ id: "s30", sessionSlotId: "wave_2", levelId: "6", complete: true }] })],
  };
  const view = buildCalendar(calendar, { locked: true });
  assert.deepEqual(view.cells.map((c) => [c.state, c.selectable, c.openable]), [["off", false, false], ["done", false, true]]);
  assert.deepEqual([view.prevPeriod, view.nextPeriod], ["2026-08", "2026-10"], "month arrows stay available");
  assert.deepEqual(view.needsDates, []);
});

test("KBM page: the calendar never disappears because of a lock, and locked months read as view-only", () => {
  const kbm = read("src/views/dashboard/guru/KbmView.vue");
  assert.ok(kbm.includes('<KbmDatePicker v-if="kbmCalendar"'), "only a missing calendar hides it, never a lock");
  assert.ok(kbm.includes(':locked-reason="calendarLockedReason"'));
  assert.ok(kbm.includes('isPeriodLocked ? "Lihat Absensi"') && kbm.includes('isPeriodLocked ? "Lihat Jurnal"'), "no edit buttons in a locked month");
  assert.ok(kbm.includes('v-if="!isPeriodLocked" type="button" class="btn-delete-card"'), "no delete in a locked month");
  assert.ok(kbm.includes("monthFillable.value && sheetDate.value <= todayString"), "no 'Tambah KBM' in a locked or closed month");
  assert.ok(kbm.includes("currentLpjReport.value = pickMonthReport(lpjRes?.data);"));
  const picker = read("src/components/KbmDatePicker.vue");
  assert.ok(picker.includes('v-if="lockedReason"') && picker.includes("locked: !!props.lockedReason"));
});

test("journal and student attendance pages are read-only in a locked month", () => {
  for (const file of ["src/views/dashboard/guru/JournalView.vue", "src/views/dashboard/guru/StudentAttendanceView.vue"]) {
    const src = read(file);
    assert.ok(src.includes("useSessionLock()") && src.includes("checkLock(session.value);"), `${file} checks the lock`);
    assert.ok(src.includes('v-if="sessionLocked" class="alert alert-locked"'), `${file} explains the lock`);
    assert.ok(src.includes("if (!dirty.value || saving.value || sessionLocked.value) return;"), `${file} never saves when locked`);
  }
  const sa = read("src/views/dashboard/guru/StudentAttendanceView.vue");
  assert.ok(sa.includes("if (sessionLocked.value || row.status === newStatus) return;"), "status chips do nothing when locked");
  assert.ok(/<section v-if="!isTeaching"[\s\S]*?<section v-else class="glass-card roster-main-card"/.test(sa), "roster still shows (v-if / v-else intact)");
});
