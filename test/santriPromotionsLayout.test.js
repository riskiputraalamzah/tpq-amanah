import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { squash, has } from "./helpers/sourceText.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => squash(fs.readFileSync(path.join(here, "..", p), "utf8"));

test("Kelola Santri (Admin) separates Daftar Santri and Riwayat Naik Jilid into clean tabs and puts Tambah Santri behind a header toggle", () => {
  const m = read("src/components/SantriManager.vue");
  assert.ok(has(m, `class="sm-tabs" role="tablist"`));
  assert.ok(has(m, `adminTab = 'roster'`));
  assert.ok(has(m, `adminTab = 'promotions'`));
  assert.ok(has(m, `v-show="!adminMode || adminTab === 'promotions'"`), "admin promotions sit in their own tab, never crowding Daftar Santri");
  assert.ok(has(m, `v-if="adminMode && addOpen"`), "Tambah Santri opens on demand so Daftar Santri stays above the fold");
  assert.ok(has(m, `if (classChanged) promotionsPanel.value?.reload()`), "manual admin jilid edits refresh the promotion history");
});

test("SantriPromotions (Admin) loads full promotion history with timeframe, source, route chips, and safe undo", () => {
  const p = read("src/components/santri/SantriPromotions.vue");
  assert.ok(has(p, `api.get('/santri-changes/promotions/history', { params: { days: 'all' }, cache: false })`));
  assert.ok(has(p, `Riwayat Naik Jilid ({{ filteredItems.length }})`));
  assert.ok(has(p, `class="pr-summary"`));
  assert.ok(has(p, `class="pr-routes"`));
  assert.ok(has(p, `v-if="h.canUndo"`));
  assert.ok(has(p, `defineExpose({ reload: load, recentCount, totalCount })`));
});
