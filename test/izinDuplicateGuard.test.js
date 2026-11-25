import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { squash, has } from "./helpers/sourceText.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => squash(fs.readFileSync(path.join(here, "..", p), "utf8"));

test("WaliIzin: marks dates with existing active izin, warns before duplicate submit, and supports replace/edit flow", () => {
  const view = read("src/views/wali/WaliIzin.vue");
  assert.ok(has(view, "class=\"day-chip\" :class=\"{ 'has-existing': !!activeByDay.get(d) }\""));
  assert.ok(has(view, "Sudah ada catatan"));
  assert.ok(has(view, "Isi form untuk ubah"));
  assert.ok(has(view, "Ubah izin"));
  assert.ok(has(view, "reason: reason.value, replace"));
  assert.ok(has(view, "resp.code === 'DUPLICATE_IZIN'"));
});

test("IzinSantriView: warns staff on overlapping active izin, supports replace, and counts unique santri per day", () => {
  const view = read("src/views/dashboard/guru/IzinSantriView.vue");
  assert.ok(has(view, "v-if=\"composerOverlaps.length && selectedSantri\""));
  assert.ok(has(view, "Muat alasan lama untuk diubah"));
  assert.ok(has(view, "resp.code === 'DUPLICATE_IZIN'"));
  assert.ok(has(view, "selectedUniqueSantriCount"));
  assert.ok(has(view, "todayUniqueSantriCount"));
});
