import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SHOW_NEW_REGISTRATION } from "../src/utils/waliFeatures.js";
import { squash, has } from "./helpers/sourceText.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => fs.readFileSync(path.join(here, "..", p), "utf8");

test("pengkinian data first: 'Daftarkan santri baru' is switched off in the wali portal, the slip code is the one way in", () => {
  assert.equal(SHOW_NEW_REGISTRATION, false);
  const home = read("src/views/wali/WaliHome.vue");
  assert.ok(home.includes('<router-link v-if="SHOW_NEW_REGISTRATION" to="/wali/daftar/baru" class="start-card">'), "home: hidden behind the switch");
  assert.ok(home.includes('<router-link v-if="SHOW_NEW_REGISTRATION" to="/wali/daftar/baru" class="add-link">'), "the small link under the children too");
  assert.ok(home.includes("<strong>Pengkinian data santri</strong>"), "the main card says what to do");
  assert.ok(home.includes("Belum dapat slip, atau slipnya hilang?"), "and what to do without a slip");
  assert.ok(read("src/views/wali/WaliAkun.vue").includes('<router-link v-if="SHOW_NEW_REGISTRATION" to="/wali/daftar/baru" class="link-row">'), "Akun too");
  assert.ok(read("src/views/wali/WaliLink.vue").includes('<h1 class="w-title">Ketik kode dari slip</h1>'));
});

test("KK photo: the phone shrinks it until it is small enough, and the admin views it in the page", () => {
  const form = squash(read("src/views/wali/WaliSantriForm.vue"));
  assert.ok(has(form, "const KK_LIMIT = 800 * 1024"));
  assert.ok(has(form, "for (const [side, quality] of [[1600, 0.8], [1400, 0.7], [1200, 0.6], [1000, 0.55]])"), "smaller again when still too big");
  assert.ok(has(form, "if (dataUrl.length * 0.75 <= KK_LIMIT) return dataUrl"));
  const adminView = squash(read("src/views/dashboard/admin/AdminWaliView.vue"));
  assert.ok(has(adminView, "kkView.value = { url: data.url, name: review.value.santri.name || 'santri' }"), "shown in a sheet (a data: link cannot be opened as a new tab)");
  assert.ok(!has(adminView, "window.open(data.url"), "no new tab");
  assert.ok(has(adminView, '<img :src="kkView.url"'));
});

test("the KK photo opens over the review sheet, not behind it", () => {
  const view = squash(read("src/views/dashboard/admin/AdminWaliView.vue"));
  assert.ok(has(view, '<div v-if="kkView" class="wv-overlay wv-overlay-top"'));
  assert.ok(has(view, ".wv-overlay.wv-overlay-top { z-index: 9995; }"), "above the other sheets (9990), below the app dialog (100000)");
});
