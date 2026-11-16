import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { squash, has } from "./helpers/sourceText.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const view = squash(fs.readFileSync(path.join(here, "..", "src/views/dashboard/guru/AbsenSantriView.vue"), "utf8"));

test("Absen Santri: the Sore/Malam switch is in the sticky bar, with how many are recorded in each sesi", () => {
  assert.ok(has(view, '<div ref="bar" class="as-bar">'));
  assert.ok(has(view, '.as-bar { position: sticky;'));
  assert.ok(has(view, "{{ slotCount(s.id) }} dicatat"));
  assert.ok(has(view, "loadOther(d, sl, mine)"), "the other sesi is read for its count");
});

test("Absen Santri: another sesi's jilid is not shown as a bare 0/N; it points to its own sesi", () => {
  assert.ok(has(view, "`belum ada yang ikut sesi ${slotLabel.value}`"));
  assert.ok(has(view, "Lihat di sesi {{ otherSlot.label }} · {{ otherRecordedOf(g.classId) }}/{{ g.items.length }} dicatat ›"));
  assert.ok(has(view, "...groups.value.filter((g) => g.own), ...groups.value.filter((g) => !g.own"), "this sesi's jilid first");
  assert.ok(has(view, "scrollAfterLoad = true"), "after switching sesi, back to the top of the list");
});
