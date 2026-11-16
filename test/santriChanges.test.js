import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { squash, has } from "./helpers/sourceText.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => squash(fs.readFileSync(path.join(here, "..", p), "utf8"));

test("naik jilid: the guru's button (only the jilid they teach, one step), a confirmation, the list again without the skeleton", () => {
  const m = read("src/components/SantriManager.vue");
  assert.ok(has(m, 'class="s-promote"'), "phone card");
  assert.ok(has(m, 'class="action-link promote-link"'), "desktop table");
  assert.ok(has(m, 'if (!(changeAccess.value.taughtClassIds || []).includes(cur)) return null;'));
  assert.ok(has(m, 'if (props.adminMode) return null;'), "the admin uses Ubah");
  assert.ok(has(m, 'await api.post("/santri-changes/promote", { santriId: row.id, from });'), "from: a double tap is refused by the server");
  assert.ok(has(m, 'Bisa dibatalkan dalam 24 jam.'));
  assert.ok(has(m, '<SantriPromotions ref="promotionsPanel" :admin-mode="adminMode" @changed="reloadSantri" />'));
});

test("usulan santri baru: similar names before sending, an exact one blocks it; the decider accepts (name/jilid editable) or declines with a reason", () => {
  const p = read("src/components/santri/SantriProposals.vue");
  assert.ok(has(p, "api.get('/santri-changes/proposals/similar', { params: { name }, cache: false })"));
  assert.ok(has(p, ":disabled=\"busy || form.name.trim().length < 3 || (sheet.mode === 'propose' && !!exactMatch)\""));
  assert.ok(has(p, "api.post(`/santri-changes/proposals/${sheet.value.proposal.id}/decide`, { approve: true, name: form.value.name, classId: form.value.classId })"));
  assert.ok(has(p, "input: { label: 'Alasan', value: '', placeholder: 'Contoh: sudah terdaftar dengan nama lain', required: true, maxlength: 300, multiline: true }"));
  assert.ok(has(p, ".sp-overlay { position: fixed; inset: 0; z-index: 9990;"), "a sheet like the others (the confirmation goes above)");
});
