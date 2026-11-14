import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  STEPS, fieldError, stepErrors, stepOfPath, mergeProfile, emptyProfile, normalizePhone, displayPhone,
  formatLinkCode, linkCodeMessage, getPath,
} from "../src/utils/santriProfile.js";
import { slipLines } from "../src/utils/waliSlips.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => fs.readFileSync(path.join(here, "..", p), "utf8");

test("form steps: required fields, NIK/KK 16 digits (a masked value from the server counts as filled), phones, dates", () => {
  const nik = STEPS[0].fields.find((f) => f.path === "santri.nik");
  assert.equal(fieldError(nik, ""), "NIK anak wajib diisi");
  assert.equal(fieldError(nik, "1234"), "NIK anak harus 16 angka");
  assert.equal(fieldError(nik, "3515010101150001"), "");
  assert.equal(fieldError(nik, "3515********0001"), "", "masked = unchanged, not an error");
  const birth = STEPS[0].fields.find((f) => f.path === "santri.tanggalLahir");
  assert.match(fieldError(birth, "2999-01-01"), /masa depan/);
  const hp = STEPS[2].fields.find((f) => f.path === "ayah.hp");
  assert.equal(fieldError(hp, ""), "", "optional");
  assert.match(fieldError(hp, "12345"), /tidak valid/);
  assert.equal(fieldError(hp, "0812 3456 7890"), "");
  const errs = stepErrors(STEPS[1], emptyProfile());
  assert.deepEqual(Object.keys(errs).sort(), ["alamat.desa", "alamat.jalan", "alamat.kabupaten", "alamat.kecamatan"]);
  assert.equal(stepOfPath("keluarga.noKK"), 2);
});

test("server data fills the form; every field exists for v-model", () => {
  const data = mergeProfile({ santri: { namaLengkap: "Ahmad" }, persetujuan: { syarat: true } });
  assert.equal(getPath(data, "santri.namaLengkap"), "Ahmad");
  assert.equal(getPath(data, "alamat.rt"), "");
  assert.deepEqual(data.persetujuan, { syarat: true, data: false });
});

test("phones and codes are written the way parents read them", () => {
  assert.equal(normalizePhone("0812-3456-7890"), "6281234567890");
  assert.equal(displayPhone("6281234567890"), "0812 3456 7890");
  assert.equal(formatLinkCode("ab2c d3ef"), "AB2C-D3EF");
  assert.equal(formatLinkCode("ab2"), "AB2");
});

test("the teacher's private WA message carries the child, the link with the code, and a do-not-share line", () => {
  const msg = linkCodeMessage({ santriName: "Ahmad Fauzi", code: "AB2C-D3EF", expiresAt: "2026-12-14T00:00:00Z", siteUrl: "https://tpqamanahsawotratap.com" });
  assert.match(msg, /wali dari \*Ahmad Fauzi\*/);
  assert.match(msg, /https:\/\/tpqamanahsawotratap\.com\/wali\/tautkan\?kode=AB2C-D3EF/);
  assert.match(msg, /kode: \*AB2C-D3EF\*/);
  assert.match(msg, /tidak dibagikan/);
  assert.ok(!msg.includes("\n\n\n"), "no empty gaps");
  const slip = slipLines({ santriName: "Ahmad", classLabel: "Jilid 1", code: "AB2C-D3EF", siteUrl: "https://tpqamanahsawotratap.com" });
  assert.equal(slip.steps[0], "1. Buka tpqamanahsawotratap.com/wali");
});

test("teacher's reminder: worded for the status, quotes the admin's fix note, signed by the teacher, link to the portal", async () => {
  const { reminderMessage, REMIND_STATUSES } = await import("../src/utils/santriProfile.js");
  assert.deepEqual(REMIND_STATUSES, ["empty", "draft", "needs_fix"]);
  const base = { santriName: "Ahmad Fauzi", siteUrl: "https://tpqamanahsawotratap.com", senderName: "Ustadz Riski" };
  const empty = reminderMessage({ ...base, status: "empty" });
  assert.match(empty, /^Assalamu'alaikum Bapak\/Ibu wali dari \*Ahmad Fauzi\*\./);
  assert.match(empty, /belum diisi/);
  assert.match(empty, /https:\/\/tpqamanahsawotratap\.com\/wali\n/);
  assert.match(empty, /Ustadz Riski, TPQ Amanah$/);
  assert.match(reminderMessage({ ...base, status: "draft" }), /tinggal dilanjutkan/);
  const fix = reminderMessage({ ...base, status: "needs_fix", note: "NIK mohon dicek" });
  assert.match(fix, /perlu diperbaiki:\n_NIK mohon dicek_\n\nMohon diperbaiki/);
  const noNote = reminderMessage({ ...base, status: "needs_fix", senderName: "" });
  assert.ok(!noNote.includes("\n\n\n") && !noNote.includes("__"), "no empty gaps when there is no note");
  assert.match(noNote, /\nTPQ Amanah$/);
});

test("routing: wali portal is separate; login has a Wali Santri tab instead of Google", () => {
  const router = read("src/router/index.js");
  assert.ok(router.includes('path: "/wali"') && router.includes("meta: { requiresAuth: true, wali: true }"));
  assert.ok(router.includes("isWali !== inWaliPortal"), "a wali never sees the staff dashboard and vice versa");
  const login = read("src/views/LoginView.vue");
  assert.ok(login.includes('id="tab-wali"') && !login.includes('id="tab-google"'));
  assert.ok(login.includes('autocomplete="one-time-code"'), "phones offer the code from the SMS/WA keyboard");
  const form = read("src/views/wali/WaliSantriForm.vue");
  assert.ok(form.includes("w-actionbar"), "the next/back buttons stay within thumb reach");
  assert.ok(form.includes("shrinkImage"), "KK photo is made smaller on the phone before upload");
});

test("kegiatan helpers: rupiah, dates, the payment line a parent reads, the summary tiles", async () => {
  const { formatRupiah, dayLabel, paymentLine, summarize } = await import("../src/utils/kegiatan.js");
  assert.equal(formatRupiah(150000), "Rp150.000");
  assert.equal(formatRupiah("abc"), "Rp0");
  assert.equal(dayLabel("2026-12-07"), "Senin, 7 Desember 2026");
  assert.equal(dayLabel(""), "");
  assert.equal(dayLabel("07-12-2026"), "");
  assert.equal(paymentLine({ state: "gratis" }), "Tanpa biaya");
  assert.equal(paymentLine({ state: "lunas", paid: 150000, fee: 150000 }), "Lunas (Rp150.000)");
  assert.equal(paymentLine({ state: "lunas", manual: true, manualNote: "tunai ke admin", fee: 150000 }), "Lunas (dicatat manual: tunai ke admin)");
  assert.equal(paymentLine({ state: "sebagian", paid: 40000, fee: 150000, remaining: 110000 }), "Rp40.000 dari Rp150.000, kurang Rp110.000");
  assert.equal(paymentLine({ state: "belum", fee: 150000 }), "Belum ada setoran, biaya Rp150.000");
  const s = summarize([
    { status: "siap", payment: { state: "lunas" }, requirementsDone: 3, requirementsTotal: 3 },
    { status: "terdaftar", payment: { state: "sebagian" }, requirementsDone: 1, requirementsTotal: 3 },
    { status: "batal", payment: { state: "belum" }, requirementsDone: 0, requirementsTotal: 3 },
  ]);
  assert.deepEqual([s.total, s.lunas, s.belum, s.lengkap, s.withRequirements], [2, 1, 1, 1, true]);
});
