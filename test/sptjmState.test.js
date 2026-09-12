import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const sptjm = await import("../src/utils/sptjmState.js");

test("missing-field labels cover all readiness codes", () => {
  for (const code of ["tpqProfile_missing", "tpqName", "tpqAddress", "tpqHeadName", "user_missing", "userName", "userNik", "userBirthPlace", "userBirthDate", "userAddress", "userPosition"]) {
    const label = sptjm.missingFieldLabel(code);
    assert.ok(label && label !== code, code + " must have Indonesian label");
  }
  assert.equal(sptjm.missingFieldLabel("unknown_xyz"), "unknown_xyz");
});

test("readiness headline states", () => {
  assert.equal(sptjm.readinessHeadline(true), "SPTJM siap diproses");
  assert.equal(sptjm.readinessHeadline(false), "SPTJM belum siap");
});

test("profile fix targets route to existing profile pages", () => {
  assert.deepEqual(sptjm.profileFixTarget(["userNik", "tpqName"]), { needsTeacher: true, needsTpq: true });
  assert.deepEqual(sptjm.profileFixTarget([]), { needsTeacher: false, needsTpq: false });
});

test("SptjmView smoke: context, readiness, profiles, no signature/PDF", () => {
  const src = fs.readFileSync(path.join(here, "../src/views/dashboard/guru/SptjmView.vue"), "utf8");
  assert.match(src, /Surat Pernyataan Tanggung Jawab Mutlak/);
  assert.match(src, /sptjm-readiness/);
  assert.match(src, /Konteks Laporan/);
  assert.match(src, /Kesiapan SPTJM/);
  assert.match(src, /Ringkasan Profil/);
  assert.match(src, /missingFieldLabel/);
  assert.match(src, /@media/);
  assert.match(src, /100%/);
  assert.ok(!src.includes("canvas"), "no signature capture widget");
  assert.ok(!src.toLowerCase().includes("gotenberg"), "no PDF renderer in this phase");
  assert.ok(!src.toLowerCase().includes("signature-pad"), "no signature widget");
});

test("SPTJM entry lives inside LPJ detail flow", () => {
  const src = fs.readFileSync(path.join(here, "../src/views/dashboard/guru/LpjDetailView.vue"), "utf8");
  assert.match(src, /Kesiapan SPTJM/);
  assert.match(src, /lpj\/\$\{reportId\}\/sptjm/);
  const router = fs.readFileSync(path.join(here, "../src/router/index.js"), "utf8");
  assert.match(router, /lpj\/:id\/sptjm/);
});