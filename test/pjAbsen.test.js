// PJ Absen (backend services/absen_pj_service.js): the source of the pieces on the Absen Santri page and the KBM form.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { squash, has } from "./helpers/sourceText.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (rel) => squash(fs.readFileSync(path.join(here, "..", "src", rel), "utf8"));
const hold = read("components/absen/HoldConfirm.vue");
const open = read("components/absen/PjOpenCard.vue");
const takeover = read("components/absen/PjTakeoverSheet.vue");
const recheck = read("components/absen/PjRecheckSheet.vue");
const view = read("views/dashboard/guru/AbsenSantriView.vue");
const kbm = read("views/dashboard/guru/DailyWorkspace.vue");

test("HoldConfirm: press and hold (pointer and keyboard), rolls back when let go early, no motion when reduced", () => {
  assert.ok(has(hold, '@pointerdown="start"'));
  assert.ok(has(hold, '@pointercancel="stop"'));
  assert.ok(has(hold, "if (e.key !== ' ' && e.key !== 'Enter') return"), "Space / Enter hold too");
  assert.ok(has(hold, "if (!done.value) rollBack()"));
  assert.ok(has(hold, "emit('confirm')"));
  assert.ok(has(hold, "@media (prefers-reduced-motion: reduce)"));
  assert.ok(has(hold, "@contextmenu.prevent"), "a long press does not open the phone's menu");
});

test("Buka Absen: the hold also confirms the teacher's own attendance; joining as a helper when a PJ exists", () => {
  assert.ok(has(open, "api.post('/santri-presence/pj/open', { date: props.date, slot: props.slot, confirmHadir: true })"));
  assert.ok(has(open, "datang awal, bantu sesi {{ slotLabel }}"));
  assert.ok(has(open, "'Tahan: catat hadir & bantu absen'"));
  assert.ok(has(open, "root.value?.scrollIntoView?.("), "the success card is brought into view");
});

test("Ambil alih PJ needs a reason before the hold; the check-again list re-marks in the teacher's name", () => {
  assert.ok(has(takeover, ':disabled="!reasonOk"'));
  assert.ok(has(takeover, "api.post('/santri-presence/pj/takeover'"));
  assert.ok(has(takeover, "<Teleport to=\"body\">"));
  assert.ok(has(recheck, "<Teleport to=\"body\">"));
  assert.ok(has(recheck, "Tetap alfa"));
  assert.ok(has(view, "queue(santriId, status) // also \"Tetap alfa\""));
});

test("Absen Santri page: a guru marks today's sesi only once it has a PJ; the admin is warned, never PJ", () => {
  assert.ok(has(view, "const canMark = computed(() => !!sheet.value?.canEdit && !(!isAdmin.value && isToday.value && isLive.value && !sheet.value?.pj))"));
  assert.ok(has(view, "if (!sh || isAdmin.value || !isLive.value || !isToday.value || !sh.pjMe) return false"));
  assert.ok(has(view, "Sesi ini belum dibuka PJ Absen. Admin tetap bisa mengisi dan mengoreksi, tetapi tidak menjadi PJ."));
  assert.ok(has(view, "tanggung jawab {{ groupGap(g).who }}"));
  assert.ok(has(view, "Dikosongkan (Mode Hujan) oleh"));
  assert.ok(has(view, "if (/^\\d{4}-\\d{2}-\\d{2}$/.test(qd) && qd <= today) date.value = qd"), "opens the sesi from the WhatsApp link");
});

test("KBM form: the alfa someone else wrote at the roll call and the children it did not record are pointed out", () => {
  assert.ok(has(kbm, "s.presenceSource === 'absen' && s.presenceById && s.presenceById !== authStore.user?.id"));
  assert.ok(has(kbm, "data.presenceNote && !s.fromPresence && !s.titip"));
  assert.ok(has(kbm, "remindPjCheck();"));
  assert.ok(has(kbm, "Belum tercatat saat absen awal, pastikan"));
});
