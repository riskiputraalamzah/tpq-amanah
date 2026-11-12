import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ws = fs.readFileSync(path.join(here, "../src/views/dashboard/guru/DailyWorkspace.vue"), "utf8").replace(/\r\n/g, "\n");
const kbm = fs.readFileSync(path.join(here, "../src/views/dashboard/guru/KbmView.vue"), "utf8").replace(/\r\n/g, "\n");

test("Daily Workspace: the sesi is set for the teacher, the picker only opens on 'Ganti'", () => {
  assert.ok(ws.includes('<div v-if="!slotPickerOpen" class="slot-summary">'), "a summary instead of two cards to choose from");
  assert.ok(ws.includes('@click="slotPickerOpen = true">Ganti</button>'), "escape hatch for badal / extra classes");
  assert.ok(ws.includes('<div v-else class="slots-grid">'), "the two cards only after 'Ganti'");
  assert.ok(ws.includes("if (!isAddingNewSession && data.defaultSlot?.slotId) {\n      selectSlot(data.defaultSlot.slotId);"), "server default on first load");
  assert.ok(/'Sesuai jadwal Anda dari admin'[\s\S]*'Sesuai KBM terakhir Anda'[\s\S]*'Menyesuaikan jam sekarang'/.test(ws), "says where the sesi comes from");
});

test("Daily Workspace: the jilid follows the selected sesi and stops when that sesi is done", () => {
  assert.ok(ws.includes("dailyContext.value?.suggestedLevelsBySlot"), "suggestion per sesi from the server");
  assert.ok(!ws.includes("dailyContext?.suggestedLevelId === item.levelId"), "no global suggestion badge any more");
  assert.equal((ws.match(/suggestedLevelForSlot === item\.levelId/g) || []).length, 4, "Rekomendasi badge + highlight for jilid and marhalah");
  assert.ok(ws.includes("if (!selectedLevelId.value) preselectLevelForSlot();"), "also after saving, for a second jilid in the same sesi");
  assert.ok(ws.includes('v-if="slotDoneToday && !selectedLevelId" class="slot-done-note"'), "clear 'already saved' state");
  assert.ok(ws.includes("if (selectedLevelId.value && isLevelSavedInSelectedSlot(selectedLevelId.value)) clearLevelSelection();"), "switching to a sesi where that jilid is saved clears it");
});

test("KBM page starts from the same scheduled sesi and ignores badal for the usual jilid", () => {
  assert.ok(kbm.includes("const scheduled = kbmCalendar.value?.scheduledSlotId;"));
  assert.ok(kbm.includes('.filter((s) => s.type === "teaching" && !s.substituteFor'));
  assert.ok(kbm.includes("latestTeaching(pool, form.value.sessionSlotId) || latestTeaching(pool)"), "jilid of the latest KBM in that sesi");
});
