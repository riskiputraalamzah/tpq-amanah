import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ACCESS_CARDS, withAliases, PRESETS, GURU_DEFAULT_RIGHTS } from "../src/utils/guruRights.js";
import { squash, has } from "./helpers/sourceText.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => squash(fs.readFileSync(path.join(here, "..", p), "utf8"));

test("the guru's home: one card for each special access (the section only when there is one)", () => {
  const ids = ACCESS_CARDS.map((c) => c.id);
  for (const id of ["admin-attendance-view", "kbm-monitor", "pendaftaran", "wa-log", "kegiatan-manage", "all-jilid", "absen-santri-backdate"]) assert.ok(ids.includes(id), id);
  const home = read("src/views/dashboard/DashboardHome.vue");
  assert.ok(has(home, '<section v-if="isGuru && accessCards.length" class="permissions-actions"'));
  assert.ok(has(home, "ACCESS_CARDS.filter((c) => hasPermission(c.id))"));
});

test("an old 'Export PDF' is read as 'Rekap Absensi'; the coordinator preset; what every guru has", () => {
  assert.deepEqual(withAliases(["export-pdf"]).sort(), ["admin-attendance-view", "export-pdf"]);
  assert.deepEqual(PRESETS[0].features, ["pendaftaran", "kbm-monitor", "wa-log", "admin-attendance-view"]);
  assert.ok(GURU_DEFAULT_RIGHTS.some((r) => /ditetapkan admin/.test(r)), "verifying needs the jilid set by the admin");
});

test("the account's access follows the admin's change (a page change at most once a minute, back to the app)", () => {
  assert.ok(has(read("src/stores/auth.js"), "if (refreshing || Date.now() - lastRefresh < minIntervalMs) return refreshing"));
  const layout = read("src/views/dashboard/DashboardLayout.vue");
  assert.ok(has(layout, "authStore.refreshUser();"));
  assert.ok(has(layout, 'document.addEventListener("visibilitychange", onVisible);'));
});

test("a code still valid: asked before replacing it (one santri); a jilid's slips skip it by default", () => {
  const v = read("src/views/dashboard/admin/AdminWaliView.vue");
  assert.ok(has(v, "api.post('/wali/admin/codes', { santriId: r.santriId, replace })"));
  assert.ok(has(v, "if (ok) await makeCode(r, { replace: true })"));
  assert.ok(has(v, "skipActive: !slipRegen.value"));
  assert.ok(has(v, '<button v-if="canAct(r.classId) && r.guardians.length < 2"'), "codes only where the guru acts");
});
