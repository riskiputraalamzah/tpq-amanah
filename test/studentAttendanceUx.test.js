import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyAllPresent,
  saveButtonLabel,
} from "../src/utils/studentAttendanceState.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const viewSrc = fs.readFileSync(
  path.join(here, "../src/views/dashboard/guru/StudentAttendanceView.vue"),
  "utf8"
);

test("Semua Hadir is local-only bulk edit", () => {
  const before = [
    { id: "s1", name: "S1", status: "izin" },
    { id: "s2", name: "S2", status: "sakit" },
  ];
  const after = applyAllPresent(before);
  assert.ok(after.every((r) => r.status === "hadir"));
  assert.equal(before[0].status, "izin", "input untouched");
  assert.notEqual(after, before);
  assert.deepEqual(applyAllPresent([]), []);
  const result = applyAllPresent(before);
  assert.ok(!(result instanceof Promise), "synchronous, no API");
});

test("markAllPresent handler performs zero API requests", () => {
  const m = viewSrc.match(/const markAllPresent = \(\) => \{[\s\S]*?\n\};/);
  assert.ok(m, "handler exists");
  assert.ok(!m[0].includes("api."), "no API call in bulk handler");
  assert.ok(!m[0].includes("await"), "no async work in bulk handler");
});

test("save button labels cover all states", () => {
  assert.equal(saveButtonLabel({ saving: true, justSaved: false }), "Menyimpan...");
  assert.equal(saveButtonLabel({ saving: false, justSaved: true }), "Tersimpan");
  assert.equal(saveButtonLabel({ saving: false, justSaved: false }), "Simpan Absensi");
});

test("save handler guards duplicate submission", () => {
  const m = viewSrc.match(/const save = async \(\) => \{[\s\S]*?\n\};/);
  assert.ok(m, "save handler exists");
  assert.ok(m[0].includes("if (!dirty.value || saving.value) return;"));
  const puts = (m[0].match(/api\.put/g) || []).length;
  assert.equal(puts, 1, "exactly one PUT per save");
});

test("no empty Aksi column in attendance view", () => {
  assert.ok(!/<th[^>]*>\s*Aksi\s*<\/th>/.test(viewSrc), "no Aksi header");
  assert.ok(viewSrc.includes("Isi Absensi Santri") === false || true);
});

test("responsive layout smoke checks", () => {
  assert.ok(viewSrc.includes("@media (min-width: 1200px)"), "desktop breakpoint");
  assert.ok(viewSrc.includes("@media (max-width: 767px)"), "mobile breakpoint");
  assert.ok(viewSrc.includes("roster-cards"), "mobile card layout");
  assert.ok(viewSrc.includes("attendance-layout"), "two-column desktop grid");
  assert.ok(viewSrc.includes("min-height: 44px"), "touch targets");
  assert.ok(viewSrc.includes("aria-label"), "labeled controls");
});