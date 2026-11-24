import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { squash, has } from "./helpers/sourceText.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => squash(fs.readFileSync(path.join(here, "..", p), "utf8"));

test("AdminWaliView: empty-profile rows with linked guardians expose Kelola wali + Lepas tautan for admin and jilid guru", () => {
  const v = read("src/views/dashboard/admin/AdminWaliView.vue");
  assert.ok(has(v, `v-if="r.profileStatus === 'empty' && r.guardians.length && canAct(r.classId)"`), "empty rows like Syifa can be unlinked");
  assert.ok(has(v, `@click="openGuardians(r)"`));
  assert.ok(has(v, `v-if="review.canUnlink"`), "review modal uses server canUnlink (admin + jilid guru), not admin-only");
  assert.ok(!has(v, `<button v-if="isAdmin" type="button" class="wv-link is-danger" @click="unlink(g)">`), "old admin-only unlink guard replaced");
  assert.ok(has(v, "'Tautan wali dilepas, wali dikabari lewat WA'"));
});

test("AdminWaliView: verified data supports sending and resolving an advisory note without downgrading verified status", () => {
  const v = read("src/views/dashboard/admin/AdminWaliView.vue");
  assert.ok(has(v, `v-if="review.profile.status === 'verified' && review.canSendVerifiedNote"`));
  assert.ok(has(v, "api.post(`/wali/admin/santri/${review.value.santri.id}/verified-note`, { note: verifiedNoteInput.value })"));
  assert.ok(has(v, "api.delete(`/wali/admin/santri/${review.value.santri.id}/verified-note`)"));
  assert.ok(has(v, "'Pesan pembenahan dikirim ke WA wali, status tetap terverifikasi'"));
  assert.ok(has(v, `<span v-if="r.verifiedNote" class="wv-pill is-warn">Perlu dibenahi</span>`));
});

test("Wali portal: verified note is highlighted on WaliHome and WaliSantriForm while keeping Terverifikasi", () => {
  const home = read("src/views/wali/WaliHome.vue");
  assert.ok(has(home, `v-if="s.profileStatus === 'verified' && s.verifiedNote"`));
  assert.ok(has(home, `<span class="w-pill is-ok">{{ status(s).label }}</span>`));
  assert.ok(has(home, `<span class="w-pill is-warn">Perlu dibenahi</span>`));
  assert.ok(has(home, "Perbarui data sekarang"));

  const form = read("src/views/wali/WaliSantriForm.vue");
  assert.ok(has(form, `v-if="verifiedNote" class="w-note is-warn"`));
  assert.ok(has(form, "verifiedNote.value = data.profile.verifiedNote || ''"));
  assert.ok(has(form, "Data ananda tetap berstatus <strong>Terverifikasi</strong>."));
});
