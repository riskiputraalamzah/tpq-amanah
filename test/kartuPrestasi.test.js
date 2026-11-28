// Kartu Prestasi Santri (user decisions 2026-11-28): light for the teachers (one tap Lanjut / Ulang on Absen Santri,
// score and note optional), the TPQ's criteria A/B/C, a card + paraf + print for the wali.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { squash, has } from "./helpers/sourceText.js";
import { SURAHS } from "../src/utils/surahs.js";
import * as kps from "../src/utils/kps.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (rel) => squash(fs.readFileSync(path.join(here, "..", "src", rel), "utf8"));
const require = createRequire(import.meta.url);
// the backend repo sits next to this one in the workspace; elsewhere the comparison is skipped
let backendSurahs = null;
let backendKps = null;
try {
  backendSurahs = require("../../backend/src/utils/surahs.js").SURAHS;
  backendKps = require("../../backend/src/utils/kps.js");
} catch {
  /* no backend checkout */
}

test("the surah list and the rules are the same as the server's", { skip: !backendKps && "backend repo not found" }, () => {
  assert.deepEqual(SURAHS, backendSurahs);
  for (const n of [10, 9.9, 8.6, 8.5, 7.6, 7.5, 7, 0, null]) assert.equal(kps.gradeOf(n), backendKps.gradeOf(n), `grade of ${n}`);
  const cases = [
    { kind: "jilid", jilid: "3", page: 15, result: "lanjut" },
    { kind: "jilid", jilid: "3", page: 36, result: "lanjut" },
    { kind: "jilid", jilid: "2", page: 9, result: "ulang" },
    { kind: "quran", surah: 67, ayatFrom: 21, ayatTo: 30, result: "lanjut" },
    { kind: "hafalan", surah: 114, ayatFrom: 1, ayatTo: 6, result: "lanjut" },
    { kind: "hafalan", surah: 100, ayatFrom: 1, ayatTo: 5, result: "ulang" },
  ];
  for (const t of cases) {
    assert.deepEqual(kps.nextPosition(t), backendKps.nextPosition(t));
    assert.equal(kps.nextText(t), backendKps.nextText(t));
    assert.equal(kps.placeText(t.kind, t), backendKps.placeText(t.kind, t));
  }
  assert.deepEqual(kps.suggestPlace("jilid", { jilid: "3", page: 36, done: true }, "4"), { jilid: "4", page: 1 });
  assert.equal(kps.mainKind("marhalah"), "quran");
});

test("Absen Santri: a 'Tes mengaji' mode with Lanjut / Ulang, only for the children who came", () => {
  const v = read("views/dashboard/guru/AbsenSantriView.vue");
  assert.ok(has(v, `@click="setMode('tes')"`));
  assert.ok(has(v, `@click="tapKps(s, 'lanjut')"`));
  assert.ok(has(v, `@click="tapKps(s, 'ulang')"`));
  assert.ok(has(v, `statusOf(s.id) === 'hadir' || Object.keys(testsOf(s.id)).length`), "the list in tes mode = the children marked hadir");
  assert.ok(has(v, "Isi yang dites saja, tidak wajib semua."));
  // unsent taps are not lost when leaving
  assert.ok(has(v, "const left = pending.size + kps.pendingCount.value"));
  assert.ok(has(v, "if (kps.pendingCount.value) kps.retryNow()"));
  // a child without a page yet opens the sheet instead of guessing
  assert.ok(has(v, "if (kps.quick(s, result) === 'need-place') openKps(s)"));
});

test("the quick tap saves in the background and retries a dropped connection", () => {
  const c = read("composables/useKpsDay.js");
  assert.ok(has(c, "const RETRY_MS = [4000, 10000, 25000]"));
  assert.ok(has(c, "if (current && current.result === result)"), "the same choice again takes the test back");
  assert.ok(has(c, "onRefused("), "a refusal is told and undone");
});

test("the sheet: score and note optional, a C suggests Ulang, delete asks first", () => {
  const s = read("components/kps/KpsTestSheet.vue");
  assert.ok(has(s, "Nilai <em>(boleh dikosongkan)</em>"));
  assert.ok(has(s, "result.value = g === 'C' ? 'ulang' : 'lanjut'"));
  assert.ok(has(s, "title: 'Hapus tes ini?'"));
  assert.ok(!/confirm\(/.test(s), "our own dialog, never confirm()");
});

test("wali portal: the card, paraf, print A4 portrait, WA choice and the tile with the badge", () => {
  const routes = read("router/index.js");
  for (const p of ['path: "santri/:santriId/prestasi"', 'path: "santri/:santriId/prestasi/cetak"', 'path: "tanda-tangan"']) assert.ok(has(routes, p), p);
  const page = read("views/wali/WaliPrestasi.vue");
  assert.ok(has(page, "useWaliResource("));
  assert.ok(has(page, "/prestasi/paraf"));
  const print = read("views/wali/WaliPrestasiCetak.vue");
  assert.ok(has(print, "@page { size: A4 portrait;"));
  for (const col of ["Tanggal", "Jilid / Surat", "Halaman / Ayat", "Ustadz / ah", "Paraf wali"]) assert.ok(has(print, col), col);
  const home = read("views/wali/WaliHome.vue");
  assert.ok(has(home, "/prestasi`"));
  assert.ok(has(home, "s.kpsUnsigned"));
  const akun = read("views/wali/WaliAkun.vue");
  assert.ok(has(akun, "api.put('/wali/me/prestasi-wa', { pref })"));
  assert.ok(has(akun, 'to="/wali/tanda-tangan"'));
  const data = read("utils/waliData.js");
  assert.ok(has(data, "keys: () => ['prestasi:*', 'me']"), "a paraf refreshes the card and the badge");
});

test("signature: drawn once, saved as an SVG path; also on the staff profile", () => {
  const pad = read("components/signature/SignaturePad.vue");
  assert.ok(has(pad, "touch-action: none"));
  const editor = read("components/signature/SignatureEditor.vue");
  assert.ok(has(editor, "api.put('/signatures/me', draft.value)"));
  const profile = read("views/dashboard/guru/ProfileView.vue");
  assert.ok(has(profile, "<SignatureEditor"));
});
