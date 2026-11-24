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

test("Absen Santri: guru has an optional 'Hanya jilid saya' checkbox scoped strictly to the active sesi", () => {
  assert.ok(has(view, "const onlyMyJilid = ref(false)"), "defaults to all jilids");
  assert.ok(has(view, "api.get('/santri-changes/me', { cache: false })"), "reads guru's actual taught jilids even with all-jilid access");
  assert.ok(
    has(view, "const mySlotClassIds = computed(() => myClassIds.value.filter((id) => (sheet.value?.defaultClassIds || []).includes(id)))"),
    "only considers the guru's jilid(s) that actually belong to the currently selected sesi",
  );
  assert.ok(has(view, `v-if="!isAdmin && mySlotClassIds.length" class="as-my-toggle"`), "hidden on a sesi that does not contain the guru's jilid");
  assert.ok(has(view, `v-model="onlyMyJilid" type="checkbox"`));
  assert.ok(has(view, "Hanya jilid saya"));
  assert.ok(has(view, "groups.value .filter((g) => g.own)"), "never pulls another sesi's jilid into the current sesi");
  assert.ok(has(view, "const isOpen = (g) => g.searching || (opened.value[g.classId] ?? g.own)"), "another sesi's jilid never auto-expands");
  assert.ok(has(view, "onlyMyJilid.value = false"), "resets filter when switching sesi or date");
});

test("Absen Santri: recording a non-titipan santri from another sesi requires explicit confirmation", () => {
  assert.ok(has(view, "async function otherSlotOk(santriId, nextStatus)"));
  assert.ok(has(view, "if (titipHere(s) || (sh.defaultClassIds || []).includes(s.classId)) return true"));
  assert.ok(has(view, "if (!(await otherSlotOk(santriId, same ? null : status))) return"));
  assert.ok(has(view, "title: `Catat ${s.name} di sesi ${slotLabel.value}?`"));
});

test("Absen Santri: long session window hint collapses into a compact tooltip on mobile", () => {
  assert.ok(has(view, `class="as-hint-trigger"`));
  assert.ok(has(view, `Ketentuan jam absen`));
  assert.ok(has(view, `id="as-hint-tooltip" class="as-hint-popover" role="tooltip"`));
  assert.ok(has(view, `@media (max-width: 639px)`));
});
