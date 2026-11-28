// Rapor (Laporan Perkembangan Santri), user decisions 2026-11-28: the paper form's subjects, opened by the admin for
// every jilid, filled by the jilid's teachers on the phone, published per jilid, read + signed by the wali.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { squash, has } from "./helpers/sourceText.js";
import * as rapor from "../src/utils/rapor.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (rel) => squash(fs.readFileSync(path.join(here, "..", "src", rel), "utf8"));
const require = createRequire(import.meta.url);
let backend = null;
try {
  backend = require("../../backend/src/utils/rapor.js");
} catch {
  /* no backend checkout next to this repo */
}

test("the subjects and rules are the same as the server's", { skip: !backend && "backend repo not found" }, () => {
  assert.deepEqual(rapor.INTI, backend.INTI);
  assert.deepEqual(rapor.PENUNJANG, backend.PENUNJANG);
  assert.deepEqual(rapor.SIKAP, backend.SIKAP);
  assert.deepEqual(rapor.SIFAT, backend.SIFAT);
  const p = { extraSubjects: ["Praktik Wudhu", ""] };
  const scores = { makhorijul: 9, tajwid: 8.8, shifatul: 8.6, tartil: 9.2, ghorib: 8.4, akhlaq: 9.5, p6: 7 };
  assert.deepEqual(rapor.summaryOf(scores, p), backend.summaryOf(scores, p));
  for (const c of ["1", "5", "6", "7"]) {
    assert.equal(rapor.nextClassOf(c), backend.nextClassOf(c));
    assert.equal(rapor.decisionText("naik", c), backend.decisionText("naik", c));
  }
});

test("menu and routes: 'Penilaian' became 'Rapor' for admin and guru; old links go to Rapor", () => {
  const layout = read("views/dashboard/DashboardLayout.vue");
  assert.ok(!has(layout, "'/dashboard/grading'") && !has(layout, "'/dashboard/admin-grading'"));
  assert.equal((fs.readFileSync(path.join(here, "..", "src/views/dashboard/DashboardLayout.vue"), "utf8").match(/to: '\/dashboard\/rapor'/g) || []).length, 2);
  const routes = read("router/index.js");
  for (const p of ['path: "rapor"', 'path: "rapor/:periodId"', 'path: "rapor/:periodId/santri/:santriId"', 'path: "rapor/:periodId/santri/:santriId/cetak"', 'path: "santri/:santriId/rapor/:periodId"', 'path: "santri/:santriId/rapor/:periodId/cetak"']) assert.ok(has(routes, p), p);
  assert.ok(has(routes, '{ path: "grading", redirect: "/dashboard/rapor" }'));
});

test("the teacher's page: autosave with retry, one tap per choice, 'Selesai & paraf', next child", () => {
  const e = read("views/dashboard/rapor/RaporEdit.vue");
  assert.ok(has(e, 'inputmode="decimal"') && has(e, 'enterkeyhint="next"'), "numbers on the phone keyboard, Enter = next");
  assert.ok(has(e, "timer = setTimeout(flush, [3000, 8000, 20000][Math.min(retry++, 2)])"), "a dropped connection retries");
  assert.ok(has(e, "/done`)"));
  assert.ok(has(e, "onBeforeRouteLeave("));
  assert.ok(has(e, "position: sticky;"), "the save bar stays on screen");
  assert.ok(!/confirm\(/.test(e));
});

test("admin board: publish per jilid, revision with a reason, take back, susulan, promotions", () => {
  const b = read("views/dashboard/rapor/RaporBoard.vue");
  for (const piece of ["/publish`, { classId: j.classId })", "/revision`, { note })", "/unpublish`)", "/susulan`, { on: !r.susulan })", "/promotions`, {})"]) assert.ok(has(b, piece), piece);
  assert.ok(has(b, "multiline: true"), "the revision reason is a text box");
});

test("wali: published rapor only, detail with note + signature, PDF A4 portrait in two pages", () => {
  const list = read("views/wali/WaliRapor.vue");
  assert.ok(has(list, "data.value?.published || []"));
  assert.ok(has(list, 'v-if="data.rapor.length" class="w-section-title">Penilaian sebelumnya'), "the old Penilaian only when there is some");
  const detail = read("views/wali/WaliRaporDetail.vue");
  assert.ok(has(detail, "useWaliResource("));
  assert.ok(has(detail, "/sign`, { note: note.value })"));
  const paper = read("components/rapor/RaporPaper.vue");
  assert.ok(has(paper, "break-after: page"));
  assert.ok(has(paper, "Mengetahui,"));
  const cetak = read("views/wali/WaliRaporCetak.vue");
  assert.ok(has(cetak, "@page { size: A4 portrait;"));
  const data = read("utils/waliData.js");
  assert.ok(has(data, "keys: () => ['raporDetail:*', 'rapor:*']"));
});

test("Kepala TPQ: chosen by the admin, signs on Profil with its own signature", () => {
  const home = read("views/dashboard/rapor/RaporHome.vue");
  assert.ok(has(home, "api.put('/rapor/settings/kepala', { uid })"));
  const profile = read("views/dashboard/guru/ProfileView.vue");
  assert.ok(has(profile, 'endpoint="/signatures/kepala"'));
});
