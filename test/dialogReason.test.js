import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { waFailText } from "../src/utils/waBotStatus.js";
import { squash, has } from "./helpers/sourceText.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => fs.readFileSync(path.join(here, "..", p), "utf8");

test("a reason is typed in a box of a few lines (Enter = new line, Ctrl+Enter = confirm), with a counter", () => {
  const host = squash(read("src/components/DialogHost.vue"));
  assert.ok(has(host, '<textarea v-if="dialogState.input.multiline" id="dlg-input"'));
  assert.ok(has(host, '@keydown.enter.ctrl.prevent="confirm"'));
  assert.ok(has(host, "{{ String(dialogState.input.value || '').length }}/{{ dialogState.input.maxlength }}"));
  assert.ok(has(host, '<input v-else id="dlg-input"'), "one-line fields stay as they were (typing a name to delete)");
  const pendaftaran = squash(read("src/views/dashboard/admin/PendaftaranView.vue"));
  assert.ok(has(pendaftaran, "placeholder: 'Contoh: usia belum cukup, kuota sesi penuh', required: true, maxlength: 300, multiline: true"), "cancel reason");
  assert.ok(has(pendaftaran, "required: true, maxlength: 300, multiline: true }"));
  assert.ok(has(squash(read("src/views/dashboard/admin/AdminWaliView.vue")), "input: { label: 'Alasan', value: 'Nama santri tidak ditemukan', required: true, maxlength: 300, multiline: true }"));
});

test("a failed WhatsApp message says why in plain words", () => {
  assert.match(waFailText({ error: "No LID for user new Error (<anonymous>:6:31)", attempts: 3 }), /^Nomor tidak ditemukan di WhatsApp\. Kemungkinan nomornya salah atau kurang angka/);
  assert.match(waFailText({ error: "Nomor ini tidak terdaftar di WhatsApp. Cek lagi nomornya", attempts: 1 }), /^Nomor tidak ditemukan/);
  assert.equal(waFailText({ error: "Client not ready", attempts: 3 }), "Gagal setelah 3x percobaan: Client not ready");
  assert.equal(waFailText({ error: "", attempts: 1 }), "Gagal");
  assert.ok(has(squash(read("src/views/dashboard/admin/WaLogView.vue")), "{{ waFailText(r) }}"));
});
