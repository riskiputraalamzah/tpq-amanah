import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { boardColumns, cellInfo, filterGurus, issueChips, issuesOf, longDate, monthTitle } from "../src/utils/kbmMonitor.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (file) => fs.readFileSync(path.join(here, "../src", file), "utf8");

const guru = {
  id: "ella",
  name: "Ella",
  needsAction: 2,
  counts: { complete: 1, incomplete: 1, not_created: 1, no_attendance: 0, leave: 1 },
  cells: {
    "2026-11-02": { state: "complete", sessions: [{ id: "a", complete: true, missing: [] }] },
    "2026-11-03": { state: "incomplete", sessions: [{ id: "b", complete: false, missing: ["jurnal"] }, { id: "c", complete: false, missing: ["absen santri", "jurnal"] }] },
    "2026-11-04": { state: "leave", attendance: "sakit", sessions: [] },
    "2026-11-05": { state: "not_created", sessions: [] },
  },
};

test("board shows weekdays only and labels each cell", () => {
  const days = [
    { date: "2026-11-01", weekday: 0, kind: "weekend" },
    { date: "2026-11-02", weekday: 1, kind: "active" },
    { date: "2026-11-06", weekday: 5, kind: "holiday", holidayName: "Libur Yayasan" },
    { date: "2026-11-12", weekday: 4, kind: "future" },
  ];
  assert.deepEqual(boardColumns(days).map((d) => d.date), ["2026-11-02", "2026-11-06", "2026-11-12"]);
  assert.equal(cellInfo(guru, days[1]).symbol, "✓");
  assert.equal(cellInfo(guru, days[2]).label, "Libur: Libur Yayasan");
  assert.equal(cellInfo(guru, days[3]).state, "future");
  assert.equal(cellInfo(guru, { date: "2026-11-03", kind: "active" }).label, "KBM belum lengkap (jurnal, absen santri belum diisi)");
  assert.equal(cellInfo(guru, { date: "2026-11-04", kind: "active" }).label, "Tercatat sakit");
});

test("issues are newest first and leave days are not issues", () => {
  assert.deepEqual(issuesOf(guru).map((i) => [i.date, i.state]), [["2026-11-05", "not_created"], ["2026-11-03", "incomplete"]]);
  assert.deepEqual(issueChips(guru.counts).map((c) => c.text), ["1 belum lengkap", "1 KBM belum dibuat"]);
});

test("search and 'perlu tindak lanjut' filter", () => {
  const list = [guru, { ...guru, id: "febi", name: "Febi", needsAction: 0 }];
  assert.deepEqual(filterGurus(list, { search: "feb" }).map((g) => g.id), ["febi"]);
  assert.deepEqual(filterGurus(list, { onlyIssues: true }).map((g) => g.id), ["ella"]);
  assert.equal(monthTitle("2026-11"), "November 2026");
  assert.equal(longDate("2026-11-03"), "Selasa, 3 November");
});

test("Monitor KBM is an admin-only page with one data request", () => {
  const router = read("router/index.js");
  const layout = read("views/dashboard/DashboardLayout.vue");
  const view = read("views/dashboard/admin/KbmMonitorView.vue");
  assert.match(router, /path: "kbm-monitor",[\s\S]*?KbmMonitorView\.vue[\s\S]*?meta: \{ role: "admin" \}/);
  assert.ok(layout.includes('to="/dashboard/kbm-monitor"'));
  assert.equal((view.match(/api\.get\('\/kbm-monitor'/g) || []).length, 1, "the page loads with a single request");
  assert.ok(view.includes("api.post(`/kbm-monitor/${detail.value.guru.id}/nudge`"), "nudge button");
  assert.ok(view.includes("PageSkeleton"), "shared skeleton while loading");
  assert.ok(!/transition:\s*all/.test(view) && !/@keyframes/.test(view), "no heavy animations");
});
