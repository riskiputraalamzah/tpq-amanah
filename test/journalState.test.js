import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const { summarizeStudentAttendance, resolveJournalInitialStatus, journalSaveButtonLabel, isJournalFilled, summarizeSessionWorkflow, JOURNAL_PLACEHOLDER } = await import("../src/utils/journalState.js");

test("journal summary counts display-only attendance", () => {
  const summary = summarizeStudentAttendance([
    { status: "hadir" },
    { status: "hadir" },
    { status: "izin" },
    { status: "sakit" },
  ]);
  assert.equal(summary.total, 4);
  assert.equal(summary.hadir, 2);
  assert.equal(summary.izin, 1);
  assert.equal(summary.sakit, 1);
});

test("journal summary handles empty and legacy statuses", () => {
  assert.deepEqual(summarizeStudentAttendance([]), { total: 0, hadir: 0, izin: 0, sakit: 0, alfa: 0, alpa: 0 });
  const legacy = summarizeStudentAttendance([{ status: "present" }]);
  assert.equal(legacy.hadir, 1);
});

test("journal initial status reflects server material", () => {
  assert.equal(resolveJournalInitialStatus("RPP 1"), "saved");
  assert.equal(resolveJournalInitialStatus(""), "draft");
  assert.equal(resolveJournalInitialStatus(null), "draft");
});

test("journal save button labels cover saving/saved states", () => {
  assert.equal(journalSaveButtonLabel({ saving: true, justSaved: false }), "Menyimpan...");
  assert.equal(journalSaveButtonLabel({ saving: false, justSaved: true }), "Tersimpan");
  assert.equal(journalSaveButtonLabel({ saving: false, justSaved: false }), "Simpan Jurnal");
});

test("JournalView responsive smoke: stacked layout, full-width save, state UX", () => {
  const viewPath = path.join(here, "../src/views/dashboard/guru/JournalView.vue");
  const src = fs.readFileSync(viewPath, "utf8");
  assert.match(src, /Jurnal/);
  assert.match(src, /journal:\s*\{ material/);
  assert.match(src, /@media/);
  assert.match(src, /100%/);
  assert.match(src, /Menyimpan/);
  assert.match(src, /Ada perubahan belum disimpan/);
  assert.match(src, /activityName/);
  assert.ok(!src.includes("v-model=\"row.status\""), "journal must not edit attendance");
});
test("journal filled state ignores server placeholder", () => {
  assert.equal(isJournalFilled("Iqro 6 hal 10"), true);
  assert.equal(isJournalFilled(JOURNAL_PLACEHOLDER), false);
  assert.equal(isJournalFilled("  " + JOURNAL_PLACEHOLDER + "  "), false);
  assert.equal(isJournalFilled(""), false);
  assert.equal(isJournalFilled(null), false);
});

test("session workflow summary derives from server data only", () => {
  const w = summarizeSessionWorkflow({
    studentAttendances: [{ status: "hadir" }, { status: "hadir" }, { status: "izin" }],
    journal: { material: "RPP 1" },
  });
  assert.equal(w.attTotal, 3);
  assert.equal(w.attHadir, 2);
  assert.equal(w.attFilled, true);
  assert.equal(w.journalFilled, true);
  const empty = summarizeSessionWorkflow({ studentAttendances: [], journal: { material: JOURNAL_PLACEHOLDER } });
  assert.equal(empty.attFilled, false);
  assert.equal(empty.journalFilled, false);
});

test("KBM history exposes Absensi and Jurnal actions with server states", () => {
  const src = fs.readFileSync(path.join(here, "../src/views/dashboard/guru/KbmView.vue"), "utf8");
  assert.match(src, /Absensi Santri/);
  assert.match(src, /Jurnal/);
  assert.match(src, /status-chips/);
  assert.match(src, /attChipLabel/);
  assert.match(src, /journalChipLabel/);
  assert.match(src, /Absensi Belum diisi/);
  assert.match(src, /Jurnal Tersimpan/);
  assert.match(src, /btn btn-primary btn-sm/);
  assert.match(src, /btn btn-secondary btn-sm/);
});

test("KBM history adds no per-row API round-trip", () => {
  const src = fs.readFileSync(path.join(here, "../src/views/dashboard/guru/KbmView.vue"), "utf8");
  const historyBlock = src.slice(src.indexOf("Riwayat KBM"), src.indexOf("</template>"));
  assert.ok(!historyBlock.includes("api.get"), "chips must use loaded history data only");
});

test("LPJ day actions keep primary hierarchy without duplicate editors", () => {
  const src = fs.readFileSync(path.join(here, "../src/views/dashboard/guru/LpjDetailView.vue"), "utf8");
  assert.match(src, /dayAction\(day\)\.primary/);
  assert.ok(!src.includes("studentAttendances:") || src.includes("summarizeStudentAttendance"), "no attendance editor in LPJ detail");
});

test("JournalView context, nav button, save glyphs, primary CTA", () => {
  const src = fs.readFileSync(path.join(here, "../src/views/dashboard/guru/JournalView.vue"), "utf8");
  assert.match(src, /breadcrumb/);
  assert.match(src, /Buka Absensi Santri/);
  assert.match(src, /kbm\/\$\{sessionId\}\/absensi/);
  assert.match(src, /Tersimpan/);
  assert.match(src, /Ada perubahan belum disimpan/);
  assert.match(src, /btn btn-primary btn-save/);
  assert.match(src, /dapat diubah guru/);
  assert.ok(!src.includes("v-model=\"row.status\""), "journal must not edit attendance");
  assert.ok(!src.includes("studentAttendances:"), "journal must not PUT attendance");
});

test("journal views responsive smoke", () => {
  for (const f of ["../src/views/dashboard/guru/JournalView.vue", "../src/views/dashboard/guru/KbmView.vue"]) {
    const src = fs.readFileSync(path.join(here, f), "utf8");
    assert.match(src, /@media/);
    assert.match(src, /100%/);
  }
});
