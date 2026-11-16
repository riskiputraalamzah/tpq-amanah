import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { squash, has } from "./helpers/sourceText.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const view = squash(fs.readFileSync(path.join(here, "..", "src/views/dashboard/admin/AdminWaliView.vue"), "utf8"));

test("Ingatkan goes through the TPQ bot: one button, no wa.me link, the error shown in the sheet", () => {
  assert.ok(has(view, `<button type="button" class="wv-btn wv-btn-wa" :disabled="busy" @click="sendReminder(remind)">`));
  assert.ok(has(view, "{{ busy ? 'Mengirim…' : 'Kirim lewat WA bot TPQ' }}"));
  assert.ok(has(view, "await api.post('/wali/admin/reminders/send', { santriId: r.santriId })"));
  assert.ok(has(view, `<p v-if="remindError" class="wv-note is-danger" role="alert">{{ remindError }}</p>`), "e.g. 'masih dalam antrean' / 'dalam 24 jam terakhir'");
  assert.ok(!has(view, `:href="waTo(g.phone, remindMessage)"`), "not from the teacher's own WhatsApp any more");
  assert.ok(has(view, "Malam hari (21.00–06.30) dikirim besok pagi."));
});

test("verify / needs fixing / identity / link request: the admin is told the wali hears it on WhatsApp", () => {
  assert.ok(has(view, "'Data terverifikasi, wali dikabari lewat WA'"));
  assert.ok(has(view, "'Permintaan perbaikan dikirim ke WA wali'"));
  assert.ok(has(view, "'Perubahan identitas disetujui, wali dikabari lewat WA'"));
  assert.ok(has(view, "'Pengajuan ditolak, wali dikabari lewat WA'"));
});

test("Kode untuk santri: sent by the TPQ bot to the number typed or tapped (linked wali), no wa.me share link", () => {
  assert.ok(has(view, `<form class="wv-code-send" @submit.prevent="sendCode">`));
  assert.ok(has(view, `<input id="code-phone" v-model="codePhone" class="wv-input" type="tel" inputmode="tel"`));
  assert.ok(has(view, `@click="codePhone = displayPhone(g.phone)"`), "a linked wali's number in one tap");
  assert.ok(has(view, "await api.post('/wali/admin/codes/send', { santriId: codeSheet.value.santriId, code: codeSheet.value.code, phone: codePhone.value })"));
  assert.ok(!has(view, "waShareUrl"), "the wa.me share link is gone");
  assert.ok(has(view, "{{ busy ? 'Mengirim…' : 'Kirim lewat WA bot TPQ' }}"));
});
