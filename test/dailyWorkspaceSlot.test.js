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

test("KBM page leaves sesi + jilid to the Daily Workspace, which also covers badal", () => {
  assert.ok(!kbm.includes("form.value.sessionSlotId"), "no sesi selection on the KBM page any more");
  assert.ok(kbm.includes("/dashboard/kbm/daily-workspace?date=${date}&from=kbm"));
  assert.ok(ws.includes('v-model="isBadal"') && ws.includes('v-model="substituteFor"'), "badal moved to the workspace");
  assert.ok(ws.includes("substituteFor: isBadal.value ? substituteFor.value : null"), "badal is sent with the KBM");
  assert.ok(ws.includes("(!isBadal.value || !!substituteFor.value)"), "badal needs the replaced teacher before saving");
});

test("Daily Workspace: an earlier day of a fillable month is open to every teacher, and returns to the KBM calendar", () => {
  assert.ok(ws.includes("data.canFill === false"), "the server decides (active period or an LPJ month)");
  assert.ok(!ws.includes("Backfill Khusus Guru LPJ"), "no more LPJ-only block for an earlier day");
  assert.ok(ws.includes("route.query.from === 'kbm' || targetDate.value < getTodayWibString()"));
  assert.ok(ws.includes("`/dashboard/kbm?date=${targetDate.value}`"), "back to the calendar on that day");
});
