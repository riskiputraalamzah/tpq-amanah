import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { groupByMonth, kbmGapDates, kbmLink, attendanceLink } from "../src/utils/lpjChecklist.js";

const here = path.dirname(fileURLToPath(import.meta.url));

test("gaps are grouped per month, oldest first, each pointing at its first date", () => {
  const groups = groupByMonth(["2026-08-03", "2026-07-14", "2026-07-13", "2026-09-01", "2026-07-14", "bad"]);
  assert.deepEqual(groups, [
    { period: "2026-07", label: "Juli", count: 2, first: "2026-07-13" },
    { period: "2026-08", label: "Agustus", count: 1, first: "2026-08-03" },
    { period: "2026-09", label: "September", count: 1, first: "2026-09-01" },
  ]);
  assert.deepEqual(groupByMonth([]), []);
  assert.equal(groupByMonth(["2025-12-01", "2026-01-05"])[0].label, "Desember 2025", "year shown when the range crosses a year");
});

test("KBM gap days: missing and incomplete, one entry per day", () => {
  const dates = kbmGapDates({
    missingKbm: ["2026-07-14"],
    incompleteKbm: [{ date: "2026-07-13", label: "Sesi Sore Jilid 1" }, { date: "2026-07-13", label: "Sesi Sore Jilid 3" }],
  });
  assert.deepEqual(dates, ["2026-07-13", "2026-07-14"]);
  assert.deepEqual(kbmGapDates(null), []);
});

test("links open the right month: KBM on the date, attendance on the month", () => {
  assert.equal(kbmLink("2026-07-13"), "/dashboard/kbm?date=2026-07-13");
  assert.equal(attendanceLink("2026-07"), "/dashboard/attendance?month=2026-07");
  const attendance = fs.readFileSync(path.join(here, "../src/views/dashboard/guru/AttendanceView.vue"), "utf8");
  assert.ok(attendance.includes("route.query.month"), "attendance page reads ?month=");
  assert.ok(attendance.includes("index >= monthIndex(2026, 0) && index <= currentMonthIndex"), "only January 2026 up to this month");
});
